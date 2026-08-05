import 'server-only';

import { getCutTickets } from '../actions';
import { kpiCat, duLieuCatHomNay, type PhieuCat } from '@/lib/mos/calculators/cat-kpi.calculator';
import { viecCuaCat, NGUONG_HAO_HUT, CAT_NEO } from '@/lib/mos/workspace/cat-work-items';
import type { WorkItem } from '@/lib/mos/workspace/work-item';
import type { KpiItem } from '@/components/workspace/blocks';

// ============================================================================
// COMMAND CENTER — TỔ CẮT · Blueprint tầng ②
//
// ĐỌC · GOM · PHÁN. ⛔ Không dựng giao diện, ⛔ không biết React.
//
// ⚠️ Nó **⛔ không nuốt lỗi thành mảng rỗng**: màn hình rỗng vì *"⛔ không có
// phiếu nào"* và vì *"⛔ không đọc được CSDL"* trông **y hệt nhau**, và chỉ
// **một** trong hai là tin tốt.
// ============================================================================

export interface CatCommandCenter {
  viec: WorkItem[];
  kpi: KpiItem[];
  loi: string | null;
}

export async function getCatCommandCenter(): Promise<CatCommandCenter> {
  let phieu: PhieuCat[];
  try {
    phieu = (await getCutTickets()) as unknown as PhieuCat[];
  } catch (e) {
    return { viec: [], kpi: [], loi: e instanceof Error ? e.message : String(e) };
  }

  const k = kpiCat(phieu);
  const homNay = duLieuCatHomNay(phieu);
  const viec = viecCuaCat(homNay);

  const nguon = { nguonKey: 'cat.nguon' as const, nguonVars: { soPhieu: phieu.length } };

  // Phiếu vượt định mức nặng nhất — **nguyên nhân có tên** cho khuyến nghị.
  // ⚠️ `null` khi ⛔ không phiếu nào vượt: khi đó **⛔ KHÔNG có gì để khuyến
  // nghị**, và bịa một câu để lấp chỗ trống còn tệ hơn ⛔ không có câu nào.
  const vuotNang = [...homNay.phieuVuotDinhMuc].sort((a, b) => b.vuot - a.vuot)[0] ?? null;

  const kpi: KpiItem[] = [
    { id: 'btp', labelKey: 'cat.tongBtp', giaTri: k.tongBtp.toLocaleString('vi-VN'),
      donVi: 'sp', href: CAT_NEO.nhatKy, hanhDongKey: 'cat.moNhatKy', ...nguon },
    { id: 'vai', labelKey: 'cat.vaiDaTrai', giaTri: k.tongVaiDaTrai.toFixed(1),
      donVi: 'm', href: CAT_NEO.nhatKy, hanhDongKey: 'cat.moNhatKy', ...nguon },
    { id: 'dau-tam', labelKey: 'cat.dauTam', giaTri: k.tongDauTam.toFixed(1),
      donVi: 'm', href: CAT_NEO.nhatKy, hanhDongKey: 'cat.moNhatKy', ...nguon },
    {
      id: 'hao-hut',
      labelKey: 'cat.tyLeHaoHut',
      giaTri: `${k.tyLeHaoHut.toFixed(1)}%`,
      // Con số DUY NHẤT mang **phán quyết** ở khâu cắt. Vải đã cắt là **mất
      // vĩnh viễn** — nên đây là con số đắt nhất trên màn hình này.
      trangThai: k.tyLeHaoHut > NGUONG_HAO_HUT ? 'critical' : 'healthy',
      href: CAT_NEO.nhatKy,
      hanhDongKey: 'cat.moNhatKy',
      ...nguon,
      ...(vuotNang
        ? {
            khuyenNghiKey: 'cat.khuyenNghiVuot' as const,
            khuyenNghiVars: { maPhieu: vuotNang.maPhieu, vuot: vuotNang.vuot.toFixed(1) },
          }
        : {}),
    },
  ];

  return { viec, kpi, loi: null };
}
