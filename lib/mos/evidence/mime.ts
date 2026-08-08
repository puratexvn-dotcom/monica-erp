// ============================================================================
// 🔴 ALLOWLIST ĐỊNH DẠNG TỆP BẰNG CHỨNG — **NGUỒN SỰ THẬT DUY NHẤT**
//
// 📐 Board Directive *EVIDENCE SECURITY IMPLEMENTATION* §1:
//    *"⛔ Không tạo allowlist ở nhiều nơi. Phải có **một nguồn sự thật duy
//    nhất**."*
//
// ─── 🔴 KHUYẾT TẬT ĐÃ ĐO, VÀ ĐÂY LÀ NGUYÊN NHÂN GỐC ────────────────────
// Trước tệp này, allowlist tồn tại ở **HAI** chỗ ⛔ không ai nối với ai:
//
//   ① `app/actions/upload-action.ts`  — ứng dụng, **CÓ** `application/pdf`
//   ② `storage.buckets.allowed_mime_types` — CSDL, **⛔ KHÔNG có** PDF
//
// Ngày 06/08/2026 Board yêu cầu nhận PDF. Chỗ ① được sửa; chỗ ② **⛔ không ai
// nhớ tới**. Kết quả đo ngày 08/08:
//
//     PDF  →  BỊ TỪ CHỐI: mime type application/pdf is not supported
//     PNG  →  ĐƯỢC
//
// 🔑 Người dùng chọn được tệp PDF trên màn hình, rồi Supabase từ chối. Tính
//    năng chạy **đúng một nửa**, và ⛔ không phép kiểm nào bắt được vì **mỗi
//    tầng đều tự nhất quán** — chúng chỉ ⛔ không nhất quán **với nhau**.
//
// ─── ⚠️ MỘT NGUỒN, HAI TẦNG — VÀ GIỚI HẠN THẬT CỦA VIỆC ĐÓ ─────────────
// TypeScript ⛔ **không** đặt được giá trị vào `storage.buckets`; SQL ⛔
// **không** đọc được tệp này. Nên *"một nguồn sự thật"* ở đây có nghĩa:
//
//   · Tệp NÀY là **bản gốc**. Ứng dụng đọc thẳng từ đây.
//   · Migration `057` chép danh sách này vào bucket, **kèm chú thích trỏ về
//     đúng tệp này**.
//   · `scripts/kiem-bang-chung.mjs` **ĐO** hai bên có khớp ⛔ — và **HỎNG** nếu
//     lệch.
//
// 🔑 Phép đo ở bước ba là thứ duy nhất khiến *"một nguồn"* thành sự thật thay
//    vì một lời hứa. Hai tầng ⛔ không tự đồng bộ được; điều làm được là **phát
//    hiện ngay khi chúng trôi ra khỏi nhau**.
//
// ⚠️ **Word/Excel CỐ Ý ⛔ KHÔNG có mặt.** Hai định dạng đó mang **macro chạy
// được**, và tệp ở đây được nhà thầu/khách tải về mở trên máy của họ. Mở
// allowlist cho chúng là **quyết định bảo mật**, cần Board — ⛔ không phải một
// dòng thêm vào mảng.
// ============================================================================

/** Định dạng bằng chứng được nhận. **Thứ tự ⛔ không quan trọng**, nhưng nội
 *  dung phải khớp tuyệt đối với `storage.buckets.allowed_mime_types`. */
export const MIME_BANG_CHUNG = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const;

export type MimeBangChung = (typeof MIME_BANG_CHUNG)[number];

/** Giới hạn kích thước một tệp, tính bằng byte.
 *
 *  ⚠️ Phải khớp `storage.buckets.file_size_limit`. Ứng dụng đặt thấp hơn thì
 *  người dùng bị chặn sớm *(chấp nhận được)*; đặt **cao hơn** thì họ chờ tải
 *  xong rồi mới nhận lỗi từ máy chủ — đúng loại trải nghiệm cần tránh. */
export const GIOI_HAN_BYTE = 8 * 1024 * 1024;

/** Phần mở rộng suy từ MIME.
 *
 *  ⚠️ **⛔ KHÔNG lấy từ tên tệp do client gửi** — tên tệp là dữ liệu người
 *  dùng, có thể chứa `../` hoặc ký tự lạ. Máy chủ tự quyết định đuôi. */
export const DUOI_THEO_MIME: Record<MimeBangChung, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
};

export function laMimeHopLe(mime: string): mime is MimeBangChung {
  return (MIME_BANG_CHUNG as readonly string[]).includes(mime);
}

/** Chuỗi cho thuộc tính `accept` của `<input type="file">`.
 *
 *  🔑 Sinh **từ chính danh sách trên**, ⛔ không gõ tay ở tệp giao diện: một
 *  `accept` rộng hơn allowlist là mời người dùng chọn tệp chắc chắn bị từ
 *  chối; hẹp hơn là giấu mất định dạng hợp lệ. */
export const ACCEPT_BANG_CHUNG = MIME_BANG_CHUNG.join(',');

/** Câu từ chối, viết cho người dùng đọc — ⛔ không phải mã lỗi. */
export function loiSaiDinhDang(mime: string): string {
  return `Định dạng ⛔ không hỗ trợ (${mime || 'không rõ'}). Chỉ nhận ảnh JPG, PNG, `
    + 'WEBP, HEIC và tài liệu PDF. Tệp Word/Excel xin xuất sang PDF trước khi tải lên.';
}
