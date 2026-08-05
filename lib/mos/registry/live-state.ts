import type { PermissionState } from '@/lib/mos/capability/visible-modules';

// ============================================================================
// LIVE STATE — "BẢN ĐỒ SỐNG CỦA DOANH NGHIỆP"
//
// Board Rev 3: *"Mỗi ô có thể có một tín hiệu nhỏ… Chỉ **một chấm màu** là đủ.
// Điều này khiến Homepage trở thành **bản đồ sống của doanh nghiệp** chứ ⛔
// không chỉ là màn hình chọn ứng dụng."*
//
// ═══ 🔴 ĐIỀU KIỆN TIÊN QUYẾT: CHẤM NÀY ⛔ KHÔNG ĐƯỢC RÒ DỮ LIỆU ═════════
// Trang chủ bày **toàn bộ 22 App cho MỌI người xem**, kể cả khách chưa đăng
// nhập *(ADR-022)*. Một chấm đỏ trên ô `Warehouse` nói với **bất kỳ ai mở
// trang** rằng *"kho đang có việc gấp"* — đó là **thông tin vận hành của doanh
// nghiệp**, và nó rò ra **⛔ không qua một câu truy vấn nào**.
//
// ⚠️ Đây đúng loại rò mà `AI-4` cảnh báo ở `ADR-027`: **siêu dữ liệu**. Người
// nhận ⛔ không đọc được **nội dung**, nhưng biết được **có chuyện gì đang xảy
// ra** — và với đối thủ, *"có chuyện đang xảy ra"* đã là thông tin.
//
// 🔑 ⇒ **`LS-1`: chấm chỉ hiện trên ô người xem THẬT SỰ MỞ ĐƯỢC.**
//    Đúng một dòng luật, và nó rơi thẳng ra từ `PermissionState` đã có —
//    ⛔ không cần một cơ chế phân quyền thứ hai.
//
// ═══ VÀ ĐIỀU KIỆN THỨ HAI: CHẤM ⛔ KHÔNG BIẾN TRANG CHỦ THÀNH DASHBOARD ══
// `Product Constitution §2` nói ba lần Homepage **⛔ không phải** Dashboard.
// Ranh giới sắc gọn:
//
//   ✅ **MỘT chấm** nói *"có việc"*        → hướng người dùng ĐI ĐÂU
//   🔴 **MỘT CON SỐ** nói *"47 việc"*      → bắt người dùng ĐỌC và SUY
//
// Con số là **dữ liệu**; chấm là **chỉ đường**. Trang chủ chỉ được làm việc
// thứ hai — và đó cũng là lý do `P1` tồn tại.
//
// ⚠️ ⇒ **`LS-2`: ⛔ KHÔNG hiện con số trên ô.** Board viết *"badge/số lượng
// việc"*, nhưng chính Board cũng viết *"chỉ **một chấm màu** hoặc badge nhỏ là
// đủ"* và *"⛔ không biến Homepage thành Dashboard"*. Tôi chọn **chấm**, và ghi
// lại lựa chọn này để Board bác nếu thấy sai.
// ============================================================================

/**
 * Bốn mức sống của một Business App.
 *
 * ⚠️ Cố ý **⛔ không có mức thứ năm**. Bốn màu là ngưỡng mà mắt còn phân biệt
 * được **⛔ không cần chú giải**; thêm mức thứ năm thì người dùng phải **học
 * bảng màu**, và một tín hiệu phải học thì thôi làm tín hiệu.
 */
export type LiveState =
  /** 🟢 Bình thường — ⛔ không có gì cần làm ngay. */
  | 'normal'
  /** 🟡 Cần chú ý — có dấu hiệu nên xem, ⛔ chưa gấp. */
  | 'attention'
  /** 🔴 Có việc cần xử lý — có việc mức `CRITICAL` đang chờ. */
  | 'action'
  /** 🔵 Có cập nhật mới — dữ liệu vừa đổi, ⛔ không phải việc phải làm. */
  | 'update';

/** ⛔ Không đo được, hoặc ⛔ không được phép thấy ⇒ **⛔ không có chấm**.
 *
 *  ⚠️ **⛔ KHÔNG** rơi về `'normal'`. Một chấm xanh nói *"mọi thứ ổn"* — mà
 *  *"tôi ⛔ không đọc được"* thì **⛔ không phải** *"mọi thứ ổn"*. Đó là hai câu
 *  khác nhau, và gộp chúng là **nói dối** *(quy tắc `V.1`)*. */
export type LiveStateOrNull = LiveState | null;

/**
 * 🔴 **`LS-1` — CỔNG DUY NHẤT ĐỂ MỘT CHẤM ĐƯỢC HIỆN.**
 *
 * Gọi hàm này **trước** khi hiện bất kỳ tín hiệu nào. Nó ⛔ **không** đọc dữ
 * liệu — nó chỉ trả lời câu *"người này có được thấy trạng thái của App đó ⛔
 * không"*.
 *
 * | Trạng thái quyền | Thấy chấm? | Vì sao |
 * |---|---|---|
 * | `AUTHORIZED` | ✅ **có** | họ mở được App ⇒ họ đọc được dữ liệu đó |
 * | `UNAUTHORIZED` | 🔴 **⛔ KHÔNG** | rò *"bộ phận kia đang có việc gấp"* |
 * | `ANONYMOUS` | 🔴 **⛔ KHÔNG** | khách ⛔ không có việc, và ⛔ không được biết |
 * | `COMING_SOON` | ⛔ **không** | App ⛔ chưa tồn tại thì ⛔ không có trạng thái |
 */
export function duocThayTrangThai(quyen: PermissionState): boolean {
  return quyen === 'AUTHORIZED';
}

/**
 * Quy mức khẩn cao nhất trong hộp thư việc → mức sống của ô.
 *
 * 🔑 Nhờ vậy chấm trên trang chủ và hộp thư trong Workspace **⛔ không bao giờ
 * kể hai câu chuyện khác nhau** — cả hai đọc từ **cùng một** bộ luật
 * `WorkItemRule`.
 *
 * ⚠️ Tập việc **rỗng** ⇒ `'normal'`, ⛔ không phải `null`: đo được và ⛔ không
 * có việc **là một kết quả**, khác hẳn ⛔ chưa đo được.
 */
export function mucSongTuViec(
  mucKhanCaoNhat: 'CRITICAL' | 'WARNING' | 'INFO' | null,
): LiveState {
  if (mucKhanCaoNhat === 'CRITICAL') return 'action';
  if (mucKhanCaoNhat === 'WARNING') return 'attention';
  return 'normal';
}
