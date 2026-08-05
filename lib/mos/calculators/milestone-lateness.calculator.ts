// ============================================================================
// MỐC TIẾN ĐỘ TRỄ — PURE CALCULATOR
//
// ─── VÌ SAO TỆP NÀY TỒN TẠI: `TD-17` · `KD-3` ────────────────────────────
// `po.service.ts` đếm mốc trễ bằng một vòng lặp viết thẳng trong hàm; còn
// `po-twin.service.ts:132` truyền `late_milestones: 0` — một HẰNG SỐ.
//
// Cả hai cùng nạp MỘT đơn hàng, cùng gọi `factsOf()`, và `po-flow.ts:111` đọc
// `late_milestones > 0` để nâng mức khẩn lên `CRITICAL`. Hệ quả đo được:
//
//   bảng danh sách   →  đơn X hiện CRITICAL   (đếm thật)
//   trang PO 360°    →  đơn X hiện NORMAL     (hằng số 0)
//
// **Hai màn hình cùng một đơn hàng cho hai mức khẩn cấp khác nhau.** Người
// điều độ tin màn hình nào cũng sai một nửa.
//
// ─── VÌ SAO KHÔNG VÁ RIÊNG `po-twin` ─────────────────────────────────────
// Chép vòng lặp sang tệp thứ hai là tạo bản chép tay thứ hai — đúng thứ đã
// sinh ra khuyết tật này. `AC-1` cấm sửa mã để bù cho một chỗ lệch mà không
// đóng nguồn lệch. Luật đếm phải nằm ở ĐÚNG MỘT chỗ, và cả hai service gọi nó.
//
// ─── EDD-06 §7 · Sprint I-2 ──────────────────────────────────────────────
// Đây là hạng mục *"sửa `po-twin:132`"* của Sprint I-2.
// ============================================================================

/** Chỉ những trường THẬT SỰ cần để phán một mốc là trễ. Nhận đúng chừng này
 *  thì hàm dùng lại được ở cổng đối tác mà không kéo theo cả lược đồ bảng. */
export interface MilestoneCore {
  /** `YYYY-MM-DD` — ngày kế hoạch. `null` = chưa đặt lịch. */
  planned_date: string | null;
  /** `YYYY-MM-DD` — ngày làm xong thật. Có giá trị ⇒ mốc đã đóng. */
  actual_date: string | null;
  status: string;
}

/** Mốc bị bỏ qua có chủ ý — ⛔ không tính là trễ. */
const TRANG_THAI_BO_QUA = 'SKIPPED';

/**
 * Một mốc có đang TRỄ THỰC TẾ không.
 *
 * 🔑 *"Trễ thực tế"* nghĩa là **quá ngày kế hoạch mà chưa có ngày thực tế** —
 * ⛔ không chờ ai vào bấm đổi trạng thái. Đây là quy tắc gốc của
 * `po.service.ts`, nay đặt ở đây làm nguồn duy nhất.
 *
 * ⚠️ So chuỗi `YYYY-MM-DD` bằng `<` là **cố ý**, ⛔ không phải cẩu thả: dạng
 * này sắp xếp theo từ điển **trùng** với thứ tự thời gian, và nó tránh hẳn việc
 * dựng `Date` — thứ sẽ kéo múi giờ máy chủ vào một phép so ngày. `lib/time.ts`
 * là nơi duy nhất được phép biết giờ Việt Nam; hàm này chỉ **nhận** `homNay`.
 */
export function laMocTre(m: MilestoneCore, homNay: string): boolean {
  if (m.status === TRANG_THAI_BO_QUA) return false;
  if (m.actual_date) return false;
  if (!m.planned_date) return false;
  return m.planned_date < homNay;
}

/**
 * Đếm số mốc đang trễ của **một** đơn hàng.
 *
 * Dùng ở `po-twin.service.ts` — trang PO 360° chỉ nạp mốc của đúng một đơn.
 */
export function demMocTre(rows: readonly MilestoneCore[], homNay: string): number {
  let n = 0;
  for (const m of rows) if (laMocTre(m, homNay)) n += 1;
  return n;
}

/**
 * Đếm mốc trễ cho **nhiều** đơn cùng lúc, trả về bản đồ `order_id → số mốc`.
 *
 * Dùng ở `po.service.ts` — bảng danh sách nạp mốc của cả trang một lượt.
 *
 * ⚠️ Đơn ⛔ **không** có mốc nào trễ sẽ **⛔ không xuất hiện** trong bản đồ.
 * Nơi gọi phải tự quy về `0` bằng `?? 0` — giữ đúng hành vi cũ của
 * `po.service.ts`, và cũng để phân biệt được *"đếm ra 0"* với *"chưa đếm"*.
 */
export function mocTreTheoDon<T extends MilestoneCore & { order_id: string }>(
  rows: readonly T[],
  homNay: string,
): Map<string, number> {
  const ra = new Map<string, number>();
  for (const m of rows) {
    if (!laMocTre(m, homNay)) continue;
    ra.set(m.order_id, (ra.get(m.order_id) ?? 0) + 1);
  }
  return ra;
}
