import { daysUntil, vnTodayISO } from './po-flow';

// ============================================================================
// LOGIC CHẤT LƯỢNG — Điều XVIII (tầng Domain thuần)
//
// Không gọi Supabase, không dựng JSX. Nhờ vậy chạy thử được bằng một tệp Node
// mà không cần dựng cả trình duyệt, và cùng một phép tính dùng chung cho bảng
// tổng quan lẫn màn hình PO.
//
// ─── VÌ SAO KHÔNG TỰ TÍNH LẠI SỐ NGÀY ────────────────────────────────────
// `daysUntil` bên po-flow.ts đã xử lý múi giờ Việt Nam (máy chủ chạy giờ UTC,
// nên nửa đêm ca ba sẽ lệch ngày nếu cắt chuỗi thô). Viết lại phép trừ ngày ở
// đây là tạo nguồn sự thật thứ hai, và một trong hai sẽ sai trước.
// ============================================================================

// ── ĐỌC TRẠNG THÁI AQL CŨ ───────────────────────────────────────────────────
//
// ⚠️ Đo trên cơ sở dữ liệu đang chạy: cột `aql_status` chứa 'Pass' / 'Fail' /
// 'Pending' — chữ hoa đầu, không phải chữ in hoa toàn phần. So sánh thẳng
// `=== 'PASS'` sẽ KHÔNG BAO GIỜ khớp, và mọi lô kiểm sẽ rơi hết vào nhánh
// "chưa kết luận" mà không có lỗi nào báo ra. Đây đúng là lỗi đã mắc với
// `npl_status` ở Phase 4.

export const AQL_RESULTS = ['PASS', 'FAIL', 'PENDING'] as const;
export type AqlResult = (typeof AQL_RESULTS)[number];

export function readAqlStatus(raw: string | null | undefined): AqlResult {
  const s = (raw ?? '').trim().toUpperCase();
  if (s === 'PASS' || s === 'ĐẠT' || s === 'DAT') return 'PASS';
  if (s === 'FAIL' || s === 'KHÔNG ĐẠT' || s === 'KHONG DAT') return 'FAIL';
  return 'PENDING';
}

/**
 * Kết luận AQL từ số lỗi đếm được so với ngưỡng chấp nhận / từ chối.
 *
 * Dùng khi phiếu kiểm CHƯA có kết luận lưu sẵn. Không dùng để ghi đè kết luận
 * QC đã ghi: con người có quyền quyết định khác máy, và cái đã ghi là bằng
 * chứng.
 *
 * Vùng giữa ac và re là CÓ THẬT trong bảng AQL đôi mẫu — chưa đủ để nhận, cũng
 * chưa đủ để loại, phải kiểm mẫu thứ hai. Gộp nó vào PASS hay FAIL đều là bịa
 * ra một kết luận mà quy trình chưa cho phép.
 */
export function judgeAql(
  qtyDefect: number | null,
  ac: number | null,
  re: number | null,
): AqlResult {
  if (qtyDefect === null || ac === null) return 'PENDING';
  if (qtyDefect <= ac) return 'PASS';
  if (re !== null && qtyDefect >= re) return 'FAIL';
  return 'PENDING';
}

/**
 * Lỗi trên trăm sản phẩm.
 *
 * Trả null khi chưa kiểm cái nào — Điều XX. Trả 0 ở đây là nói dối theo hướng
 * dễ chịu nhất: "đã kiểm, không thấy lỗi" trong khi sự thật là "chưa kiểm".
 */
export function dhuOf(defects: number | null, checked: number | null): number | null {
  if (defects === null || checked === null || checked <= 0) return null;
  return Math.round((defects / checked) * 100 * 100) / 100;
}

// ── PARETO ──────────────────────────────────────────────────────────────────

export interface ParetoInput {
  /** Mã lỗi chuẩn. null với dòng cũ chưa gán mã. */
  code: string | null;
  /** Nhãn hiển thị: tên trong danh mục, hoặc chữ tự do cũ khi chưa có mã. */
  label: string;
  qty: number;
}

export interface ParetoRow {
  key: string;
  label: string;
  qty: number;
  /** Phần trăm của riêng loại này */
  pct: number;
  /** Phần trăm cộng dồn tính từ loại nhiều nhất — đường gấp khúc của biểu đồ */
  cumPct: number;
}

export interface ParetoResult {
  rows: ParetoRow[];
  total: number;
  /** Số loại lỗi đã bị gộp vào cột "Khác" */
  merged: number;
  /** Bao nhiêu loại đầu bảng đã chiếm 80% số lỗi — con số cần hành động */
  vitalFew: number;
}

const PARETO_TOP = 5;

/**
 * Gom lỗi theo loại, xếp từ nhiều đến ít, kèm phần trăm cộng dồn.
 *
 * ─── VÌ SAO PHẢI CÓ CỘT "KHÁC" ───────────────────────────────────────────
 * Yêu cầu là hiện năm loại nhiều nhất. Nếu cắt phăng phần đuôi thì đường cộng
 * dồn sẽ kết thúc ở 60% và người đọc sẽ tưởng biểu đồ tính sai. Gộp phần đuôi
 * vào một cột "Khác" giữ cho đường cộng dồn luôn chạm 100%, và vẫn nói rõ nó
 * đang gộp bao nhiêu loại.
 *
 * ─── VÌ SAO GOM THEO MÃ, LẤY CHỮ LÀM DỰ PHÒNG ────────────────────────────
 * Dòng đã gán mã thì gom theo mã, nên "Đứt chỉ" và "Đứt chỉ diễu" về chung một
 * cột. Dòng chưa gán mã đành gom theo chữ — vẫn hơn là bỏ nó ra ngoài, vì bỏ
 * ra là làm tổng số lỗi trên biểu đồ nhỏ hơn tổng số lỗi thật của đơn.
 */
export function paretoOf(input: readonly ParetoInput[], top: number = PARETO_TOP): ParetoResult {
  const tally = new Map<string, { label: string; qty: number }>();

  for (const d of input) {
    const qty = Number.isFinite(d.qty) ? d.qty : 0;
    if (qty <= 0) continue;
    // Tiền tố phân biệt hai không gian khoá: một mã lỗi tên "CHỈ THỪA" và một
    // chuỗi tự do "Chỉ thừa" là hai thứ khác nhau, không được đụng khoá nhau.
    const key = d.code ? `c:${d.code}` : `t:${d.label.trim().toLowerCase()}`;
    const cur = tally.get(key);
    if (cur) cur.qty += qty;
    else tally.set(key, { label: d.label, qty });
  }

  const all = [...tally.entries()]
    .map(([key, v]) => ({ key, label: v.label, qty: v.qty }))
    // Hoà điểm thì xếp theo tên: cùng một dữ liệu phải cho cùng một biểu đồ ở
    // mọi lần vẽ, nếu không cột sẽ nhảy chỗ mỗi lần tải lại.
    .sort((a, b) => b.qty - a.qty || a.label.localeCompare(b.label, 'vi'));

  const total = all.reduce((s, r) => s + r.qty, 0);
  if (total === 0) return { rows: [], total: 0, merged: 0, vitalFew: 0 };

  const head = all.slice(0, top);
  const tail = all.slice(top);
  const shown = [...head];
  if (tail.length > 0) {
    shown.push({
      key: '__other__',
      label: '',                                   // nhãn do giao diện điền từ i18n
      qty: tail.reduce((s, r) => s + r.qty, 0),
    });
  }

  let run = 0;
  const rows = shown.map<ParetoRow>((r) => {
    run += r.qty;
    return {
      key: r.key,
      label: r.label,
      qty: r.qty,
      pct: Math.round((r.qty / total) * 1000) / 10,
      cumPct: Math.round((run / total) * 1000) / 10,
    };
  });

  // "Số ít sống còn" tính trên danh sách ĐẦY ĐỦ, không tính trên năm cột đang
  // hiện: nếu tính trên phần đã cắt thì con số sẽ phụ thuộc vào việc màn hình
  // đang hiện mấy cột, mà đó là chuyện trình bày, không phải chuyện chất lượng.
  let acc = 0;
  let vitalFew = 0;
  for (const r of all) {
    acc += r.qty;
    vitalFew++;
    if (acc / total >= 0.8) break;
  }

  return { rows, total, merged: tail.length, vitalFew };
}

// ── CAPA ────────────────────────────────────────────────────────────────────

export const CAPA_STATUSES = ['OPEN', 'IN_PROGRESS', 'VERIFYING', 'CLOSED', 'CANCELLED'] as const;
export type CapaStatus = (typeof CAPA_STATUSES)[number];

export const CAPA_AGEING = ['OVERDUE', 'DUE_SOON', 'ON_TRACK', 'DONE'] as const;
export type CapaAgeing = (typeof CAPA_AGEING)[number];

/** Còn ngần này ngày trở xuống thì coi là sắp tới hạn */
export const CAPA_DUE_SOON_DAYS = 3;

/**
 * Xếp mức khẩn của một phiếu CAPA theo hạn xử lý.
 *
 * Phiếu đã đóng hoặc đã huỷ KHÔNG bao giờ là quá hạn: một việc xong tháng
 * trước mà vẫn nhuộm đỏ bảng thì bảng sẽ đỏ vĩnh viễn và không ai nhìn nữa.
 */
export function capaAgeingOf(
  dueDate: string | null,
  status: CapaStatus,
  today: string = vnTodayISO(),
): CapaAgeing {
  if (status === 'CLOSED' || status === 'CANCELLED') return 'DONE';
  const d = daysUntil(dueDate, today);
  if (d === null) return 'ON_TRACK';
  if (d < 0) return 'OVERDUE';
  if (d <= CAPA_DUE_SOON_DAYS) return 'DUE_SOON';
  return 'ON_TRACK';
}

export interface CapaSummary {
  total: number;
  open: number;
  overdue: number;
  dueSoon: number;
  closed: number;
  /** Tỉ lệ đóng, phần trăm. null khi chưa có phiếu nào — Điều XX. */
  closeRate: number | null;
}

export function summariseCapa(
  items: ReadonlyArray<{ status: CapaStatus; ageing: CapaAgeing }>,
): CapaSummary {
  const total = items.length;
  if (total === 0) {
    return { total: 0, open: 0, overdue: 0, dueSoon: 0, closed: 0, closeRate: null };
  }
  const closed = items.filter((i) => i.status === 'CLOSED').length;
  // Phiếu HUỶ không nằm ở "đang mở" mà cũng không tính là "đã đóng": huỷ nghĩa
  // là phiếu lập nhầm, đếm nó vào tỉ lệ đóng sẽ thổi phồng thành tích.
  const cancelled = items.filter((i) => i.status === 'CANCELLED').length;
  const denom = total - cancelled;
  return {
    total,
    open: items.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS' || i.status === 'VERIFYING').length,
    overdue: items.filter((i) => i.ageing === 'OVERDUE').length,
    dueSoon: items.filter((i) => i.ageing === 'DUE_SOON').length,
    closed,
    closeRate: denom > 0 ? Math.round((closed / denom) * 1000) / 10 : null,
  };
}
