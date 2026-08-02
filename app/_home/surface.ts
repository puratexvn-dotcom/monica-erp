// ============================================================================
// HỆ MẶT PHẲNG — nguồn chân lý duy nhất cho bóng, kính và nhiễu nền
//
// Gom về một tệp vì thứ khiến một giao diện trông ĐẮT không phải là một cái
// bóng đẹp, mà là MỌI cái bóng trên màn hình cùng tuân một quy luật ánh sáng.
// Mỗi thẻ tự chế bóng riêng là cách chắc chắn nhất để ra vẻ ngoài nghiệp dư.
//
// ─── BỐN LỚP BÓNG, MÔ PHỎNG ÁNH SÁNG THẬT ────────────────────────────────
//   ① CONTACT      0 0 0 1px   viền tiếp xúc — thay cho `border`, không chiếm chỗ
//   ② SHADOW       0 1px 2px   bóng đổ sát mép, nơi vật chạm mặt phẳng
//   ③ AMBIENT      0 4px 8px   bóng khuếch tán của ánh sáng môi trường
//   ④ ATMOSPHERE   0 12px 24px vệt rất nhạt, rất xa — thứ tạo cảm giác "nổi"
//
// Một `shadow-lg` đơn lớp chỉ có ③. Thiếu ① thì mép thẻ nhoè vào nền; thiếu ④
// thì thẻ dán phẳng lên trang. Đủ bốn lớp, mắt đọc ra "vật thể" chứ không phải
// "hình chữ nhật tô màu" — đó là toàn bộ khác biệt.
//
// Độ mờ giữ rất thấp (0,03–0,14). Bóng đậm là dấu hiệu của phần mềm đời cũ:
// nó cố tạo chiều sâu bằng độ tương phản thay vì bằng lớp.
// ============================================================================

/** Trạng thái nghỉ — bốn lớp, tổng độ mờ dưới 0,2 */
export const ELEV_REST =
  'shadow-[0_0_0_1px_rgba(16,24,40,0.03),0_1px_2px_-1px_rgba(16,24,40,0.06),0_4px_8px_-4px_rgba(16,24,40,0.05),0_12px_24px_-12px_rgba(16,24,40,0.05)]';

/** Rê chuột — cùng bốn lớp, nới rộng và hạ thấp: vật được nhấc lên khỏi mặt */
export const ELEV_HOVER =
  'hover:shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_2px_4px_-2px_rgba(16,24,40,0.07),0_12px_20px_-8px_rgba(16,24,40,0.07),0_28px_48px_-24px_rgba(16,24,40,0.16)]';

/** Mặt phẳng chìm — dùng cho Global Service, cố ý KHÔNG nổi lên */
export const ELEV_SUNKEN =
  'shadow-[0_0_0_1px_rgba(16,24,40,0.04),0_1px_1px_-0.5px_rgba(16,24,40,0.04)]';

/**
 * Ô icon kiểu KÍNH MỜ.
 *
 * `inset 0 1px 0 rgba(255,255,255,.75)` là vệt sáng mảnh chạy dọc mép TRÊN —
 * đúng chỗ ánh sáng chạm vào một khối bo tròn. Một dòng, và ô icon thôi trông
 * như một mảng màu, bắt đầu trông như một vật thể có bề mặt.
 *
 * ⚠️ Cố ý KHÔNG dùng chuyển sắc đậm hay viền dày: cả hai đều kéo giao diện về
 * phía skeuomorphism đời 2010.
 */
export const GLASS =
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_0_0_1px_rgba(255,255,255,0.45)]';

/**
 * Quầng sáng khi rê chuột — toả ra bằng CHÍNH màu chữ của ô icon
 * (`currentColor`), nên mỗi phân hệ sáng lên bằng sắc riêng của nó mà không
 * cần khai thêm một biến màu thứ năm.
 */
export const GLASS_GLOW =
  'group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(255,255,255,0.6),0_10px_24px_-12px_currentColor]';

/**
 * NHIỄU NỀN — hạt giấy dưới 1%.
 *
 * `feTurbulence` sinh nhiễu ngay trong trình duyệt: không tải ảnh, không thêm
 * một byte mạng nào. Ở opacity 0,022 nó gần như vô hình khi nhìn thẳng, nhưng
 * nó phá vỡ mảng màu phẳng tuyệt đối của `#F6F7F9` — mà mảng phẳng tuyệt đối
 * chính là thứ khiến một trang web trông như "trang web", còn hạt mịn khiến nó
 * trông như một mặt vật liệu.
 *
 * ⚠️ Dùng data-URI nội tuyến, KHÔNG tải từ máy chủ ngoài.
 */
export const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";
