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

// 🔴 SỬA 06/08/2026 — TRƯỚC ĐÓ TÔI ĐỌC NHẦM BẢNG.
//
// Bản đầu đọc `daily_production_logs`. Bảng đó **⛔ KHÔNG CÓ MÀN HÌNH NÀO GHI
// VÀO** — nó rỗng vĩnh viễn, nên báo cáo ngày sẽ mãi mãi hiện *"⚪ chưa ai báo
// cáo"* kể cả khi tổ trưởng đã báo đủ.
//
// Chỗ tổ trưởng may THẬT SỰ ghi là **`hourly_production_logs`** (migration
// `006`), tổ hoàn thành ghi **`finishing_logs`** (`007b`), nhà thầu ghi
// **`subcon_receipt_logs`** (`009`).
//
// 🔑 Bài học: *"bảng có tồn tại"* ⛔ **KHÁC** *"bảng có dữ liệu"*. Phải truy
// xem ai GHI vào bảng, ⛔ không chỉ xem lược đồ.
interface RawSanLuong {
  target_qty: number | null;
  actual_qty: number | null;
  rework_qty: number | null;
}
interface RawFinishing {
  final_qc_passed_qty: number | null;
  final_qc_defect_qty: number | null;
}
interface RawSubcon {
  quantity_good: number | null;
  quantity_defect: number | null;
}
interface RawKiem { inspected_qty: number | null; defect_qty: number | null }
interface RawDon { po_number: string; delivery_date: string | null; status: string }
interface RawNpl { request_no: string; needed_date: string | null }

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

  const [sl, ht, sc, qa, don, npl] = await Promise.allSettled([
    // Sản lượng chuyền may — nơi tổ trưởng THẬT SỰ báo theo giờ.
    sb.from('hourly_production_logs')
      .select('target_qty, actual_qty, rework_qty')
      .eq('log_date', ngay).limit(500),
    // Tổ hoàn thành — kiểm cuối.
    sb.from('finishing_logs')
      .select('final_qc_passed_qty, final_qc_defect_qty')
      .gte('created_at', dau).lte('created_at', cuoi).limit(500),
    // Nhà thầu ngoài — hàng nhận về trong ngày.
    sb.from('subcon_receipt_logs')
      .select('quantity_good, quantity_defect')
      .gte('received_at', dau).lte('received_at', cuoi).limit(500),
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
    sanLuong: [
      ...lay<RawSanLuong>(sl).map((r) => ({
        department: 'Chuyền may',
        target_qty: so(r.target_qty),
        actual_qty: so(r.actual_qty),
        // `rework_qty` = hàng phải sửa. Đó CHÍNH LÀ lỗi tại chuyền.
        defect_qty: so(r.rework_qty),
      })),
      ...lay<RawFinishing>(ht).map((r) => ({
        department: 'Hoàn thành',
        // ⚠️ Tổ hoàn thành ⛔ không đặt mục tiêu giờ ⇒ `target_qty = 0`, và
        // digest sẽ ⛔ không tính nó vào "% đạt kế hoạch" — đúng, vì ⛔ không
        // có kế hoạch nào để đạt.
        target_qty: 0,
        actual_qty: so(r.final_qc_passed_qty),
        defect_qty: so(r.final_qc_defect_qty),
      })),
    ],
    subcon: lay<RawSubcon>(sc).map((r) => ({
      subcon: null,
      output_qty: so(r.quantity_good),
      // Sự cố = có hàng lỗi trả về. ⛔ Không có cột đếm sự cố riêng, nên đếm
      // theo DẤU HIỆU thay vì bịa ra một con số.
      issues: so(r.quantity_defect) > 0 ? 1 : 0,
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
