import 'server-only';

import { getFinishingAndPackingData } from '../actions';
import {
  kpiHoanThanh, duLieuHoanThanh, PO_KHONG_TEN,
  type BundleHoanThanh, type ThungCarton,
} from '@/lib/mos/calculators/hoan-thanh-kpi.calculator';
import {
  viecCuaHoanThanh, NGUONG_LOI_FINAL_QC, NGUONG_THUNG_CHO_NHAP, HOAN_THANH_NEO,
} from '@/lib/mos/workspace/hoan-thanh-work-items';
import type { WorkItem } from '@/lib/mos/workspace/work-item';
import type { KpiItem } from '@/components/workspace/blocks';

// ============================================================================
// COMMAND CENTER — TỔ HOÀN THÀNH · Blueprint tầng ②
//
// ĐỌC · GOM · PHÁN. ⛔ Không dựng giao diện, ⛔ không biết React.
// ============================================================================

export interface HoanThanhCommandCenter {
  viec: WorkItem[];
  kpi: KpiItem[];
  loi: string | null;
}

/** Bản ghi thùng như PostgREST trả về — `orders` có thể là **một** hoặc **mảng**
 *  tuỳ cách nó suy quan hệ. Khai tường minh ở nơi gọi, ⛔ không ép kiểu bừa. */
interface ThungRaw {
  quantity_per_carton: number;
  orders?: { po_number: string } | { po_number: string }[] | null;
}

function poCuaThung(c: ThungRaw): string {
  const o = Array.isArray(c.orders) ? c.orders[0] : c.orders;
  return o?.po_number?.trim() || PO_KHONG_TEN;
}

export async function getHoanThanhCommandCenter(): Promise<HoanThanhCommandCenter> {
  let bundles: BundleHoanThanh[];
  let thung: ThungCarton[];
  try {
    const d = await getFinishingAndPackingData();
    bundles = d.bundles as unknown as BundleHoanThanh[];
    thung = ((d.cartons ?? []) as unknown as ThungRaw[]).map((c) => ({
      quantity_per_carton: c.quantity_per_carton,
      po_number: poCuaThung(c),
    }));
  } catch (e) {
    // ⛔ KHÔNG nuốt lỗi thành mảng rỗng: màn hình rỗng vì *"⛔ không có bundle"*
    // và vì *"⛔ không đọc được CSDL"* trông y hệt nhau, và chỉ một là tin tốt.
    return { viec: [], kpi: [], loi: e instanceof Error ? e.message : String(e) };
  }

  const k = kpiHoanThanh(bundles, thung);
  const duLieu = duLieuHoanThanh(bundles, thung);
  const viec = viecCuaHoanThanh(duLieu);

  const nguon = {
    nguonKey: 'hoanThanh.nguon' as const,
    nguonVars: { soBundle: bundles.length },
  };

  // Bundle nghẽn ủi **có tên** — nguyên nhân cụ thể cho khuyến nghị. `null` khi
  // ⛔ không bundle nào nghẽn: khi đó **⛔ KHÔNG có gì để khuyến nghị**, và một
  // câu khuyến nghị rỗng còn tệ hơn ⛔ không có câu nào.
  const nghen = duLieu.nghenUi[0] ?? null;

  const kpi: KpiItem[] = [
    {
      id: 'final-qc-dat',
      labelKey: 'hoanThanh.finalQcDat',
      giaTri: k.tongDat.toLocaleString('vi-VN'),
      donVi: 'sp',
      href: HOAN_THANH_NEO.wip,
      hanhDongKey: 'hoanThanh.moBangWip',
      ...nguon,
    },
    {
      id: 'ty-le-loi',
      labelKey: 'hoanThanh.tyLeLoi',
      giaTri: `${k.tyLeLoi.toFixed(1)}%`,
      // Con số DUY NHẤT mang phán quyết về **chất lượng đầu ra** của tổ.
      // *(Đóng vượt đơn ⛔ không phải KPI: nó là một VIỆC, và nó nằm ở hộp thư
      // việc, nơi ⛔ không ai lướt qua được.)*
      trangThai: k.tyLeLoi > NGUONG_LOI_FINAL_QC ? 'critical' : 'healthy',
      href: HOAN_THANH_NEO.wip,
      hanhDongKey: 'hoanThanh.moBangWip',
      ...nguon,
    },
    {
      id: 'cho-dong-thung',
      labelKey: 'hoanThanh.choDongThung',
      giaTri: k.soChoDongThung.toLocaleString('vi-VN'),
      donVi: 'bundle',
      trangThai: k.soChoDongThung > 0 ? 'warning' : 'healthy',
      href: HOAN_THANH_NEO.dongThung,
      hanhDongKey: 'hoanThanh.moDongThung',
      ...nguon,
      ...(nghen
        ? {
            khuyenNghiKey: 'hoanThanh.khuyenNghiUi' as const,
            khuyenNghiVars: { bundle: nghen.bundle, catChi: nghen.catChi, ui: nghen.ui },
          }
        : {}),
    },
    {
      id: 'thung-tai-xuong',
      labelKey: 'hoanThanh.thungTaiXuong',
      giaTri: k.soThungTaiXuong.toLocaleString('vi-VN'),
      donVi: 'thùng',
      trangThai: k.soThungTaiXuong > NGUONG_THUNG_CHO_NHAP ? 'warning' : 'healthy',
      href: HOAN_THANH_NEO.thungTaiXuong,
      hanhDongKey: 'hoanThanh.moThungTaiXuong',
      ...nguon,
    },
  ];

  return { viec, kpi, loi: null };
}
