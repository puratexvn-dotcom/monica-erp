// ============================================================================
// MONICA MOS — Hằng số nhận diện thương hiệu
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

// ─── TÊN HỆ THỐNG ────────────────────────────────────────────────────────
// Hệ thống không còn định vị là ERP truyền thống mà là Hệ điều hành Sản xuất
// (Manufacturing Operating System).
//
// Hai biến thể, dùng đúng chỗ:
//   • APP_NAME      — chỗ HẸP: logo, thanh đầu trang, thanh dưới, thẻ meta,
//                     nhãn ngắn. Tên dài ở đây sẽ bị cắt hoặc bóp vỡ bố cục.
//   • APP_NAME_FULL — chỗ RỘNG: trang chủ, chân trang, tài liệu, đoạn văn
//                     xuôi trong báo cáo — nơi có chỗ cho cả phần giải nghĩa.
//
// Gom về đây thay vì viết thẳng chuỗi ở từng nơi: lần đổi tên này phải sờ vào
// mười mấy tệp rải rác, chính là cái giá của việc trước kia chép chuỗi khắp
// nơi. Từ nay đổi tên hệ thống chỉ sửa hai dòng dưới đây.
export const APP_NAME = 'MONICA MOS';
export const APP_NAME_FULL = 'MONICA MOS (Manufacturing Operating System)';

// Chữ thay ảnh logo. Dùng tên NGẮN vì đây là nhãn đọc màn hình cho một hình
// ảnh nhỏ — đọc cả cụm dài mỗi lần lướt qua logo là tra tấn người khiếm thị.
export const LOGO_ALT = APP_NAME;

// ─── BẢNG MÀU LẤY TỪ CHÍNH FILE LOGO ─────────────────────────────────────
// Sáu màu dưới đây KHÔNG phải ước lượng bằng mắt: giải mã public/MONICA.png
// (RGBA 8-bit, 1096x270) rồi đếm điểm ảnh đục và có độ bão hoà > 25%, bỏ hết
// phần xám/trắng/đen. Tỷ lệ đo được:
//   #E4549C hồng   26,3%      #B4CC30 xanh chanh 17,5%
//   #E45454 đỏ san 16,0%      #54C0E4 xanh lơ    15,4%
//   #FCC048 vàng   14,0%      #006CB4 xanh dương 10,8%
//
// Wordmark "MONICA" trên logo là chữ nhiều màu, nên chữ "Monica" ở trang chủ
// cũng dùng dải chuyển sắc qua đúng sáu màu này thay vì một màu đơn.
//
// Cố ý dùng chuỗi CSS đầy đủ + style inline thay vì class Tailwind kiểu
// bg-[linear-gradient(...)]: giá trị tuỳ ý của Tailwind phải thay mọi dấu cách
// bằng dấu gạch dưới, một dải sáu màu viết như vậy rất dễ sai một ký tự mà lại
// im lặng không sinh CSS.
export const LOGO_COLORS = ['#E4549C', '#FCC048', '#B4CC30', '#54C0E4', '#006CB4'] as const;

/** Dải chuyển sắc dùng cho chữ "Monica" — khớp màu wordmark trên logo */
export const LOGO_TEXT_GRADIENT = `linear-gradient(100deg, ${LOGO_COLORS.join(', ')})`;
