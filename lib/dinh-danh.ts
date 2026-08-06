// ============================================================================
// ĐỊNH DANH ĐĂNG NHẬP — NGUỒN SỰ THẬT DUY NHẤT
//
// Board 07/08/2026: *"đổi tất cả thông tin đăng nhập thành `md001`, `md002`,
// `kho001`, `kho002`, … **⛔ không cần `@monica.vn`**"*.
//
// ─── 🔑 VÌ SAO ⛔ KHÔNG ĐỔI EMAIL TRONG SUPABASE AUTH ────────────────────
// Supabase Auth định danh người dùng **bằng email** — đó là khoá của bảng
// `auth.users`, và là thứ `signInWithPassword` nhận. Đổi nó thành `md001`
// trần sẽ phải:
//   · sửa email của **mọi tài khoản** trong `auth.users` *(cửa một chiều)*
//   · Supabase vẫn **bắt buộc đúng dạng email** ⇒ cùng lắm ra `md001@…` gì đó
//   · phá `scripts/seed-users.mjs`, phá mọi bài kiểm đang dùng email
//
// ⇒ Cách đúng: **giữ nguyên email làm khoá kỹ thuật**, và cho phép người dùng
// **gõ tên tài khoản trần**. Hệ thống tự ghép miền. Người dùng ⛔ không bao giờ
// phải gõ `@monica.vn` nữa — đúng yêu cầu — mà ⛔ không đụng tới `auth.users`.
//
// 🔑 Đây là **quy tắc thuần**: ⛔ không biết Supabase, ⛔ không biết React.
// Nhận CHUỖI, trả CHUỖI. Nhờ vậy Server Action, script seed và bài kiểm dùng
// chung đúng một phép ghép, ⛔ không ai tự ghép lại theo cách khác.
// ============================================================================

/** Miền email nội bộ. Trùng mặc định của `scripts/seed-users.mjs`.
 *
 *  ⚠️ Đổi giá trị này là **đổi định danh của mọi tài khoản** — nó phải khớp
 *  với `SEED_EMAIL_DOMAIN` mà script seed đã dùng lúc tạo tài khoản, ⛔ không
 *  phải một hằng số trang trí. */
export const MIEN_EMAIL = 'monica.vn' as const;

/**
 * Đổi thứ người dùng gõ thành **email thật** để đưa cho Supabase Auth.
 *
 * - `md001`            → `md001@monica.vn`
 * - `MD001`            → `md001@monica.vn`   *(email ⛔ phân biệt hoa thường)*
 * - ` md001 `          → `md001@monica.vn`   *(dán từ nơi khác hay dính dấu cách)*
 * - `md001@monica.vn`  → giữ nguyên          *(mã cũ và thói quen cũ vẫn chạy)*
 * - `sep@doitac.com`   → giữ nguyên          *(đối tác ngoài dùng email thật)*
 *
 * ⚠️ Chuỗi rỗng trả về rỗng — để nơi gọi tự lo thông điệp *"chưa nhập"*, ⛔
 * không biến nó thành `@monica.vn` rồi ném cho Auth một email vô nghĩa.
 */
export function emailTuTenDangNhap(nhapVao: string): string {
  const s = nhapVao.trim().toLowerCase();
  if (!s) return '';
  return s.includes('@') ? s : `${s}@${MIEN_EMAIL}`;
}

/**
 * Chiều ngược lại: lấy **tên tài khoản** để HIỂN THỊ từ một email.
 *
 * Dùng ở màn hình đổi mật khẩu, thanh tài khoản… — người dùng nay biết mình
 * là `md001`, nên bày `md001@monica.vn` ra là bắt họ đọc một thứ ⛔ không còn
 * dùng để đăng nhập nữa.
 *
 * ⚠️ Email **ngoài miền nội bộ** *(đối tác)* giữ nguyên cả chuỗi: cắt đuôi sẽ
 * biến hai đối tác khác nhau `sep@a.com` và `sep@b.com` thành cùng một chữ
 * `sep` trên màn hình.
 */
export function tenDangNhapTuEmail(email: string | null | undefined): string {
  const s = (email ?? '').trim();
  if (!s) return '';
  return s.toLowerCase().endsWith(`@${MIEN_EMAIL}`) ? s.slice(0, s.lastIndexOf('@')) : s;
}
