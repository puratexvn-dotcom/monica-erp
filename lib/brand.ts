// ============================================================================
// MONICA GARMENT ERP — Hằng số nhận diện thương hiệu
//
// Gom đường dẫn logo về MỘT chỗ để đổi file chỉ phải sửa một dòng, thay vì đi
// lùng trong navbar, trang login và trang đổi mật khẩu.
//
// ─── VỀ FILE LOGO NỀN TRONG SUỐT ──────────────────────────────────────────
// Hiện public/ mới chỉ có monica-logo.jpg. Định dạng JPG KHÔNG có kênh alpha
// nên không thể trong suốt — ảnh luôn kèm một nền đặc (ở đây là nền trắng).
// Trên navbar và thẻ đăng nhập nền trắng thì nhìn vẫn liền mạch, nhưng đặt lên
// nền màu sẽ lộ ra khối chữ nhật trắng.
//
// CÁCH XỬ LÝ: xuất logo sang PNG (hoặc SVG) nền trong suốt, đặt vào
// public/monica-logo.png rồi đổi hằng số bên dưới thành '/monica-logo.png'.
// Không cần sửa gì thêm ở các trang.
export const LOGO_SRC = '/monica-logo.jpg';

export const LOGO_ALT = 'Monica Garment';
