import 'server-only';

import { getQAReports } from '../actions';
import { kpiQA, duLieuQAHomNay, type PhieuKiem } from '@/lib/mos/calculators/qa-kpi.calculator';
import { viecCuaQA, NGUONG_TY_LE_LOI } from '@/lib/mos/workspace/qa-work-items';
import type { WorkItem } from '@/lib/mos/workspace/work-item';
import type { KpiItem } from '@/components/workspace/blocks';
import { QA_NEO } from '@/lib/mos/workspace/qa-work-items';

// ============================================================================
// COMMAND CENTER — QA · trả nợ `G-18`
//
// ═══ VÌ SAO TỆP NÀY RA ĐỜI ═════════════════════════════════════════════
// `Product Constitution §4.1` chuẩn hoá bốn tầng:
//
//   Workspace ← Business Capability ← Command Center ← Business Data
//
// và ra luật: **Workspace ⛔ KHÔNG đọc trực tiếp Business Data.**
//
// 🔴 Bản `/qa` ở `dbec0d9d` **⛔ chưa theo mô hình đó**: `page.tsx` gọi thẳng
// `getQAReports()` rồi tự gọi calculator. Tôi đã tách **phép TÍNH** khỏi màn
// hình nhưng **⛔ chưa tách phần ĐỌC** — nên màn hình vẫn biết bảng nào tồn
// tại. Đây là **nợ tôi tạo ra**, ⛔ không phải nợ thừa kế.
//
// ═══ TẦNG NÀY LÀM ĐÚNG BA VIỆC ═════════════════════════════════════════
//   ① ĐỌC   — nơi DUY NHẤT chạm dữ liệu QA
//   ② GOM   — gọi calculator thuần, ⛔ không tự tính
//   ③ PHÁN  — gắn ngưỡng, trạng thái, và **lối đi tiếp** cho từng con số
//
// ⚠️ Nó **⛔ không** dựng giao diện, và **⛔ không** biết React. Nhờ vậy
// Workspace thứ hai *(`/kho`)* nối vào đúng cùng một hình dạng mà ⛔ không phải
// chép một dòng logic nào.
//
// 🔑 `P36` — mỗi KPI mang `nguonKey`: **con số này từ đâu ra**. ⛔ Không có nó,
//    một con số chỉ là **một khẳng định**.
// ============================================================================

export interface QaCommandCenter {
  viec: WorkItem[];
  kpi: KpiItem[];
  /** `null` = đọc được. Chuỗi = **lý do thật**, ⛔ không nuốt lỗi. */
  loi: string | null;
}

/** ⚠️ Trả về khi ⛔ **chưa đo được** — khác hẳn *"đo được và bằng 0"*.
 *  Màn hình cần phân biệt hai thứ đó *(quy tắc `V.1`)*. */
const RONG: QaCommandCenter = { viec: [], kpi: [], loi: null };

export async function getQaCommandCenter(): Promise<QaCommandCenter> {
  let phieu: PhieuKiem[];
  try {
    phieu = (await getQAReports()) as PhieuKiem[];
  } catch (e) {
    // ⛔ KHÔNG nuốt lỗi thành mảng rỗng. Màn hình rỗng vì *"⛔ không có phiếu
    // nào"* và màn hình rỗng vì *"⛔ không đọc được CSDL"* trông **y hệt nhau**
    // — và chỉ một trong hai là tin tốt.
    return { ...RONG, loi: e instanceof Error ? e.message : String(e) };
  }

  const k = kpiQA(phieu);
  const homNay = duLieuQAHomNay(phieu);
  const viec = viecCuaQA(homNay);

  // ⚠️ `nguonKey` dùng CHUNG một câu cho cả bốn KPI vì cả bốn cùng dẫn xuất từ
  // **một** tập phiếu. Viết bốn câu khác nhau sẽ gợi ý bốn nguồn khác nhau —
  // và đó là lời nói dối nhỏ, kiểu lời nói dối ⛔ không ai kiểm.
  const nguon = { nguonKey: 'qa.nguon' as const, nguonVars: { soPhieu: phieu.length } };

  const kpi: KpiItem[] = [
    { id: 'kiem', labelKey: 'qa.tongKiem', giaTri: k.tongKiem.toLocaleString('vi-VN'),
      donVi: 'sp', href: QA_NEO.nhatKy, ...nguon },
    { id: 'dat', labelKey: 'qa.dat', giaTri: k.tongDat.toLocaleString('vi-VN'),
      donVi: 'sp', href: QA_NEO.nhatKy, ...nguon },
    { id: 'loi', labelKey: 'qa.loi', giaTri: k.tongLoi.toLocaleString('vi-VN'),
      donVi: 'sp', href: QA_NEO.nhatKy, ...nguon },
    {
      id: 'ty-le',
      labelKey: 'qa.tyLeLoi',
      giaTri: `${k.tyLeLoi.toFixed(1)}%`,
      // Con số DUY NHẤT mang **phán quyết** — nó nói *"đạt"* hay *"⛔ không
      // đạt"*. Tô cả bốn thì màu thôi mang nghĩa.
      trangThai: k.tyLeLoi > NGUONG_TY_LE_LOI ? 'critical' : 'healthy',
      href: QA_NEO.nhatKy,
      ...nguon,
    },
  ];

  return { viec, kpi, loi: null };
}
