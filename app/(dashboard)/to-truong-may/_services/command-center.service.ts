import 'server-only';

import { getSewingDashboardData } from '../actions';
import {
  kpiMay, duLieuMayHomNay, type PhieuGio, type VuKimGay,
} from '@/lib/mos/calculators/may-kpi.calculator';
import {
  viecCuaMay, NGUONG_HIEU_SUAT, NGUONG_SUA_LAI, MAY_NEO,
} from '@/lib/mos/workspace/may-work-items';
import type { WorkItem } from '@/lib/mos/workspace/work-item';
import type { KpiItem } from '@/components/workspace/blocks';

// ============================================================================
// COMMAND CENTER — CHUYỀN MAY · Blueprint tầng ②
//
// ĐỌC · GOM · PHÁN. ⛔ Không dựng giao diện, ⛔ không biết React.
// ============================================================================

export interface MayCommandCenter {
  viec: WorkItem[];
  kpi: KpiItem[];
  loi: string | null;
}

export async function getMayCommandCenter(): Promise<MayCommandCenter> {
  let phieu: PhieuGio[];
  let kimGay: VuKimGay[];
  try {
    const d = await getSewingDashboardData();
    phieu = d.hourlyLogs as unknown as PhieuGio[];
    kimGay = (d.needleLogs ?? []) as unknown as VuKimGay[];
  } catch (e) {
    // ⛔ KHÔNG nuốt lỗi thành mảng rỗng: màn hình rỗng vì *"⛔ không có phiếu"*
    // và vì *"⛔ không đọc được CSDL"* trông y hệt nhau, và chỉ một là tin tốt.
    return { viec: [], kpi: [], loi: e instanceof Error ? e.message : String(e) };
  }

  const k = kpiMay(phieu);
  const homNay = duLieuMayHomNay(phieu, kimGay);
  const viec = viecCuaMay(homNay);

  const nguon = { nguonKey: 'may.nguon' as const, nguonVars: { soPhieu: phieu.length } };

  // Chuyền thấp nhất — **nguyên nhân có tên** cho khuyến nghị. `null` khi ⛔
  // không chuyền nào dưới ngưỡng: khi đó **⛔ KHÔNG có gì để khuyến nghị**.
  const thapNhat = [...homNay.hieuSuatTheoChuyen]
    .sort((a, b) => a.hieuSuat - b.hieuSuat)
    .filter((c) => c.hieuSuat < NGUONG_HIEU_SUAT)[0] ?? null;

  const kpi: KpiItem[] = [
    { id: 'dat', labelKey: 'may.tongDat', giaTri: k.tongDat.toLocaleString('vi-VN'),
      donVi: 'sp', href: MAY_NEO.nhatKy, hanhDongKey: 'may.moNhatKy', ...nguon },
    { id: 'muc-tieu', labelKey: 'may.mucTieu', giaTri: k.tongMucTieu.toLocaleString('vi-VN'),
      donVi: 'sp', href: MAY_NEO.nhatKy, hanhDongKey: 'may.moNhatKy', ...nguon },
    {
      id: 'sua-lai',
      labelKey: 'may.suaLai',
      giaTri: k.tongSuaLai.toLocaleString('vi-VN'),
      donVi: 'sp',
      trangThai: k.tyLeSuaLai > NGUONG_SUA_LAI ? 'warning' : 'healthy',
      href: MAY_NEO.nhatKy,
      hanhDongKey: 'may.moNhatKy',
      ...nguon,
    },
    {
      id: 'hieu-suat',
      labelKey: 'may.hieuSuat',
      giaTri: `${k.hieuSuat.toFixed(1)}%`,
      // Con số DUY NHẤT mang phán quyết về **năng suất**. *(Việc an toàn sản
      // phẩm — kim gãy — ⛔ không phải một KPI: nó là một VIỆC, và nó nằm ở hộp
      // thư việc, nơi ⛔ không ai lướt qua được.)*
      trangThai: k.hieuSuat < NGUONG_HIEU_SUAT ? 'critical' : 'healthy',
      href: MAY_NEO.nhatKy,
      hanhDongKey: 'may.moNhatKy',
      ...nguon,
      ...(thapNhat
        ? {
            khuyenNghiKey: 'may.khuyenNghiChuyen' as const,
            khuyenNghiVars: { chuyen: thapNhat.chuyen, hieuSuat: thapNhat.hieuSuat.toFixed(0) },
          }
        : {}),
    },
  ];

  return { viec, kpi, loi: null };
}
