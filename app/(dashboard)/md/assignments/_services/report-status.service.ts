import 'server-only';

import { guard, safeQuery } from '../../_services/guard';
import type { ReportStatus } from '@/lib/mos/calculators/report-status.calculator';
import type {
  ListResult,
  OverdueFilterDTO,
  OverdueListDTO,
  ReportDayDTO,
} from '@/lib/mos/contracts/assignment.contract';

// ============================================================================
// TRẠNG THÁI BÁO CÁO — ĐƯỜNG ĐỌC NÓNG
//
// Tách khỏi `assignment.service.ts` vì đây là con số mà BỐN nơi cùng hỏi:
// bảng điều khiển Giám đốc · /md theo từng PO · QA (chuyền nào im lặng) · và
// cổng đối tác. Gộp vào service chi tiết sẽ kéo cả tệp đó vào mọi nơi chỉ cần
// một con số.
//
// ─── VÌ SAO ĐỌC VIEW CHỨ KHÔNG DÙNG CALCULATOR Ở ĐÂY ─────────────────────
// `calculators/report-status.calculator.ts` tính cho MỘT phần việc đã có dữ
// liệu trong bộ nhớ. View `v_assignment_report_status` (029 Mục 10a) tính cho
// HÀNG NGHÌN phần việc ngay trong cơ sở dữ liệu — kéo toàn bộ sổ cái của mọi
// phần việc về máy chủ ứng dụng chỉ để đếm ngày thiếu là một vòng mạng khổng lồ
// cho một con số nhỏ.
//
// Cùng một luật, hai điểm thực thi, có bài kiểm giữ hai bên khớp nhau — cùng
// khuôn `SHIPMENT_FLOW` ⟷ `shipments_status_valid` của Phase 6.
//
// ⚠️ View khai `security_invoker = true`, nên nó tôn trọng RLS của người gọi.
// Không có dòng đó, view chạy dưới quyền chủ sở hữu và VƯỢT MẶT RLS — bảy view
// của 017/020/022 đã rò rỉ thật vì thiếu nó (vá ở 024 Mục 7).
// ============================================================================

interface RawStatusRow {
  assignment_id: string;
  assignment_no: string;
  partner_id: string;
  order_id: string;
  report_date: string;
  report_status: ReportStatus;
}

/**
 * Những phần việc còn ngày thiếu báo cáo, gom theo phần việc.
 *
 * ⚠️ Lọc `report_status = 'OVERDUE'` ngay trong truy vấn chứ không kéo cả bốn
 * trạng thái về rồi lọc ở đây: một phần việc chạy 60 ngày sinh 60 dòng, và
 * `NOT_STARTED` chiếm phần lớn trong số đó. Kéo về rồi vứt đi là trả tiền băng
 * thông cho dữ liệu không dùng.
 *
 * Gom nhóm là phép ĐẾM chứ không phải phép tính nghiệp vụ — nó không quyết định
 * điều gì, chỉ sắp lại hình dạng dữ liệu view đã trả. Ngưỡng cảnh báo, thứ tự
 * ưu tiên và mọi phán quyết khác vẫn nằm ở `calculators/` và `policies/`.
 */
export async function listOverdueReporting(
  filter: OverdueFilterDTO = {},
): Promise<OverdueListDTO> {
  const g = await guard();
  if (!g.supabase) return { rows: [], totalOverdue: 0, error: g.error };
  const sb = g.supabase;

  const { rows, error } = await safeQuery<RawStatusRow>('trạng thái báo cáo ngày', () => {
    let q = sb
      .from('v_assignment_report_status')
      .select('assignment_id, assignment_no, partner_id, order_id, report_date, report_status')
      .eq('report_status', 'OVERDUE')
      .order('report_date', { ascending: true });

    if (filter.orderId) q = q.eq('order_id', filter.orderId);
    if (filter.partnerId) q = q.eq('partner_id', filter.partnerId);

    return q;
  });

  if (error) return { rows: [], totalOverdue: 0, error };

  const byAssignment = new Map<string, OverdueListDTO['rows'][number]>();
  for (const r of rows) {
    const found = byAssignment.get(r.assignment_id);
    if (found) {
      found.overdueCount += 1;
      continue;
    }
    byAssignment.set(r.assignment_id, {
      assignmentId: r.assignment_id,
      assignmentNo: r.assignment_no,
      partnerId: r.partner_id,
      orderId: r.order_id,
      overdueCount: 1,
      // Truy vấn đã sắp theo ngày tăng dần, nên dòng ĐẦU của mỗi phần việc là
      // ngày trễ xa nhất.
      oldestMissing: r.report_date,
    });
  }

  const summary = [...byAssignment.values()].sort((a, b) => b.overdueCount - a.overdueCount);

  return { rows: summary, totalOverdue: rows.length, error: null };
}

/**
 * Trạng thái từng ngày của MỘT phần việc, đọc thẳng từ view.
 *
 * Dùng cho màn hình chi tiết khi cần đối chiếu với kết quả của calculator —
 * hai bên phải cho cùng một câu trả lời trên cùng dữ liệu.
 */
export async function getReportCalendar(
  assignmentId: string,
): Promise<ListResult<ReportDayDTO>> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const sb = g.supabase;

  const { rows, error } = await safeQuery<RawStatusRow>('lịch báo cáo ngày', () =>
    sb
      .from('v_assignment_report_status')
      .select('assignment_id, assignment_no, partner_id, order_id, report_date, report_status')
      .eq('assignment_id', assignmentId)
      .order('report_date', { ascending: true }),
  );

  if (error) return { rows: [], error };
  return { rows: rows.map((r) => ({ date: r.report_date, status: r.report_status })), error: null };
}
