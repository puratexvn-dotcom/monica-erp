// ============================================================================
// MONICA GARMENT ERP — Hằng số nhận diện thương hiệu
//
// Gom đường dẫn logo về MỘT chỗ để đổi file chỉ phải sửa một dòng, thay vì đi
// lùng trong navbar, trang login và trang đổi mật khẩu.
//
// ─── LOGO ĐÃ CHUYỂN SANG PNG NỀN TRONG SUỐT ──────────────────────────────
// Trước đây là monica-logo.jpg. JPG không có kênh alpha nên luôn kèm một nền
// đặc, đặt lên nền màu sẽ lộ khối chữ nhật trắng. Nay dùng MONICA.png có nền
// trong suốt, hiển thị đúng trên mọi nền.
//
// ⚠️ TÊN TỆP PHÂN BIỆT CHỮ HOA/THƯỜNG. Trên Windows local thì '/monica.png' vẫn
// chạy, nhưng máy chủ Vercel dùng Linux nên sai một chữ hoa là ảnh vỡ 404 chỉ ở
// bản deploy — loại lỗi rất khó đoán vì local vẫn tốt. Tên đúng: MONICA.png
export const LOGO_SRC = '/MONICA.png';

export const LOGO_ALT = 'Monica Garment';
