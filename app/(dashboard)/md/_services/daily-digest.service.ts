import 'server-only';

// ============================================================================
// NẠP NGUỒN CHO BÁO CÁO NGÀY CỦA MD
//
// Board 06/08/2026: *"Mỗi ngày MD chỉ cần kiểm tra lại các báo cáo… là nó có
// thể tự tổng hợp thành một báo cáo trực quan gửi cho CEO và Production
// Director."*
//
// 🔑 Tệp này CHỈ ĐỌC và **⛔ không tính gì**. Toàn bộ phép tổng hợp nằm ở
// `lib/mos/md/daily-digest.ts` — hàm thuần, có bài kiểm riêng. Giám đốc mở
// bảng tổng của mình rồi cũng gọi đúng hàm đó, nên hai màn hình ⛔ không thể
// ra hai con số khác nhau.
//
// ⚠️ `Promise.allSettled`: một bảng lỗi ⛔ không được kéo cả báo cáo xuống.
// Nguồn nào hỏng thì phần đó **rỗng**, và `V.1` khiến digest ghi *"⚪ chưa đo
// được"* thay vì bịa số 0.
// ============================================================================
import { guard } from './guard';
import { ngayVN } from '@/lib/time';
import type { NguonDigest } from '@/lib/mos/md/daily-digest';

interface RawSanLuong {
  target_qty: number | null;
  actual_qty: number | null;
  defect_qty: number | null;
  departments: { name: string } | { name: string }[] | null;
}
interface RawSubcon {
  output_qty: number | null;
  issue_note: string | null;
  support_request: string | null;
}
interface RawKiem { inspected_qty: number | null; defect_qty: number | null }
interface RawDon { po_number: string; delivery_date: string | null; status: string }
interface RawNpl { request_no: string; needed_date: string | null }

const mot = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;
const so = (v: number | null | undefined): number => Number(v ?? 0) || 0;

/** Nạp mọi nguồn của MỘT ngày. `ngay` mặc định hôm nay theo giờ Việt Nam. */
export async function napNguonDigest(ngay: string = ngayVN()): Promise<NguonDigest> {
  const g = await guard();
  const rong: NguonDigest = { ngay, sanLuong: [], subcon: [], kiem: [], don: [], nplTre: [] };
  if (!g.supabase) return rong;
  const sb = g.supabase;

  // Biên bản QA ⛔ không có cột `date` — lọc theo `created_at` trong ngày.
  const dau = `${ngay}T00:00:00`;
  const cuoi = `${ngay}T23:59:59`;

  const [sl, sc, qa, don, npl] = await Promise.allSettled([
    sb.from('daily_production_logs')
      .select('target_qty, actual_qty, defect_qty, departments ( name )')
      .eq('date', ngay).limit(500),
    sb.from('assignment_daily_reports')
      .select('output_qty, issue_note, support_request')
      .eq('report_date', ngay).limit(500),
    sb.from('qa_audit_reports')
      .select('inspected_qty, defect_qty')
      .gte('created_at', dau).lte('created_at', cuoi).limit(500),
    sb.from('orders')
      .select('po_number, delivery_date, status')
      .neq('status', 'COMPLETED').limit(500),
    // Phiếu NPL CHƯA nhận đủ — chỉ những phiếu còn sống mới đáng cảnh báo.
    sb.from('material_requests')
      .select('request_no, needed_date')
      .not('status', 'in', '("RECEIVED","REJECTED")').limit(500),
  ]);

  const lay = <T>(r: PromiseSettledResult<{ data: T[] | null; error: unknown }>): T[] =>
    r.status === 'fulfilled' && !r.value.error ? (r.value.data ?? []) : [];

  return {
    ngay,
    sanLuong: lay<RawSanLuong>(sl).map((r) => ({
      department: mot(r.departments)?.name ?? null,
      target_qty: so(r.target_qty),
      actual_qty: so(r.actual_qty),
      defect_qty: so(r.defect_qty),
    })),
    subcon: lay<RawSubcon>(sc).map((r) => ({
      subcon: null,
      output_qty: so(r.output_qty),
      // Sự cố = có ghi chú sự cố hoặc có yêu cầu hỗ trợ. ⛔ Không có cột đếm
      // riêng, nên đếm theo DẤU HIỆU thay vì bịa ra một con số.
      issues: (r.issue_note?.trim() ? 1 : 0) + (r.support_request?.trim() ? 1 : 0),
    })),
    kiem: lay<RawKiem>(qa).map((r) => ({
      inspected_qty: so(r.inspected_qty),
      defect_qty: so(r.defect_qty),
    })),
    don: lay<RawDon>(don).map((r) => ({
      po_number: r.po_number, delivery_date: r.delivery_date, status: r.status,
    })),
    nplTre: lay<RawNpl>(npl).map((r) => ({
      request_no: r.request_no, needed_date: r.needed_date,
    })),
  };
}
