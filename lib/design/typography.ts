// ============================================================================
// HỆ THẺ CHỮ HIẾN ĐỊNH — MONICA ONE
//
// Thi hành **TD-10**, Quyết nghị Architecture Board 03/08/2026.
// Anh em với hệ thẻ màu ở `lib/design/tokens.ts`.
//
// ═══ MÀU NÓI "THUỘC VỀ ĐÂU", CHỮ NÓI "CÁI NÀO QUAN TRỌNG HƠN" ══════════
// Thẻ màu cấp DANH TÍNH. Thẻ chữ cấp THỨ BẬC. Thiếu một trong hai thì mỗi
// màn hình lại tự chế cách sắp xếp riêng, và người dùng phải học lại cách
// đọc ở từng phân hệ.
//
// ═══ ⚠️ TÊN THẺ ĐẶT THEO VAI TRÒ, KHÔNG THEO CỠ ════════════════════════
// `TYPE.cardTitle`, không phải `TYPE.text16`. Đặt tên theo cỡ thì ngày đổi
// thang chữ, mọi tên đều nói dối — `text16` mà lại ra 15px. Tên theo vai trò
// sống sót qua mọi lần chỉnh thang.
//
// ═══ ⚠️ VÌ SAO KHÔNG KHOÁ CỨNG TÊN BỘ CHỮ ══════════════════════════════
// Board đã chốt **Inter Variable, tự lưu trữ qua `next/font/local`** — nhưng
// tệp phông chưa có trong kho. Nếu thẻ chữ viết thẳng `font-[Inter]` thì
// Giai đoạn 2 sẽ phải sửa lại toàn bộ thẻ.
//
// Thay vào đó: thẻ chữ chỉ nói `font-sans`, còn `font-sans` trỏ tới biến CSS
// `--font-sans` do `next/font` đặt ở `app/layout.tsx`. Giai đoạn 2 chỉ đổi
// ĐÚNG MỘT chỗ — nguồn nạp phông — và **kiến trúc thẻ không đụng tới**, đúng
// như Board yêu cầu.
//
// ═══ ⚠️ CHUỖI PHẢI NGUYÊN VẸN ═══════════════════════════════════════════
// Không ghép `text-[${n}px]`. Tailwind quét mã bằng biểu thức chính quy, nó
// KHÔNG chạy JavaScript. Lớp ghép lúc chạy vẫn hiện ở dev nhờ cache rồi biến
// mất sạch ở production. `lib/**` đã nằm trong danh sách quét của
// `tailwind.config.ts` — thiếu dòng đó là mất trắng toàn bộ kiểu chữ.
// ============================================================================

// ─── ① HỌ CHỮ ───────────────────────────────────────────────────────────────
//
// Hai họ, không hơn. Mỗi họ thêm vào là thêm một bộ phông phải tải, và tải
// phông là thứ chặn lượt vẽ đầu tiên của trang.

export const FONT_FAMILY = {
  /** Chữ giao diện. Trỏ tới `--font-sans` do next/font đặt. */
  sans: 'font-sans',
  /**
   * Chữ đều bề ngang. Dùng cho mã, thông số kỹ thuật, khoá chứng từ —
   * những thứ người ta ĐỌC TỪNG KÝ TỰ chứ không đọc lướt.
   */
  mono: 'font-mono',
} as const;

/** Tên biến CSS mà `app/layout.tsx` phải đặt. Giai đoạn 2 giữ nguyên tên này. */
export const FONT_CSS_VAR = '--font-sans' as const;

// ─── ② ĐỘ ĐẬM ───────────────────────────────────────────────────────────────
//
// ⚠️ ĐÚNG BỐN BẬC. Bản cũ dùng chín bậc Tailwind rải rác; chín bậc thì mắt
// không phân biệt nổi `medium` với `semibold`, nên chúng thôi mang thông tin.
// Bốn bậc cách nhau đủ xa để mỗi bậc nói một điều khác nhau.

export const FONT_WEIGHT = {
  /** Thân bài, mô tả, nội dung đọc dài */
  regular: 'font-normal',   // 400
  /** Nhãn, chú thích có nhấn, ô bảng cần nổi nhẹ */
  medium: 'font-medium',    // 500
  /** Tiêu đề thẻ, tiêu đề mục, nhãn quan trọng */
  semibold: 'font-semibold',// 600
  /** Tiêu đề trang, số liệu lớn, chữ hiển thị */
  bold: 'font-bold',        // 700
} as const;

// ─── ③ THANG CỠ CHỮ ─────────────────────────────────────────────────────────
//
// MƯỜI bậc, thay cho 12 cỡ tuỳ ý + 11 bậc Tailwind chạy song song trước đây.
//
// ⚠️ Thang dừng ở 11px. Bản cũ có 9px và 9,5px — dưới ngưỡng đọc được của
// người trên 40 tuổi dưới ánh đèn xưởng, và ngành may thì phần lớn quản đốc
// ở độ tuổi đó. Xem §⑧ Khả năng tiếp cận.
//
// ⚠️ Không còn nửa pixel. `12,5px` cạnh `13px` là khác biệt không ai nhìn ra
// nhưng ai cũng phải bảo trì.

export const FONT_SIZE = {
  micro: 'text-[11px]',   // CHỈ cho nhãn CHỮ HOA có giãn chữ
  caption: 'text-[12px]',
  bodySm: 'text-[13px]',
  body: 'text-[14px]',
  bodyLg: 'text-[16px]',
  title: 'text-[18px]',
  titleLg: 'text-[22px]',
  display: 'text-[28px]',
  displayLg: 'text-[36px]',
  displayXl: 'text-[48px]',
} as const;

// ─── ④ GIÃN DÒNG ────────────────────────────────────────────────────────────
//
// Quy luật: chữ CÀNG LỚN thì giãn dòng CÀNG CHẶT. Tiêu đề 48px mà để giãn
// dòng 1,6 sẽ rời ra thành mấy dòng chữ không liên quan; thân bài 14px mà để
// 1,1 thì các dòng dính vào nhau, mắt lạc dòng khi xuống hàng.

export const LINE_HEIGHT = {
  /** Chữ hiển thị rất lớn */
  tight: 'leading-[1.05]',
  /** Tiêu đề */
  snug: 'leading-[1.2]',
  /** Tiêu đề nhỏ, nhãn */
  normal: 'leading-[1.35]',
  /** Thân bài — giãn nhất, vì đây là thứ đọc lâu nhất */
  relaxed: 'leading-[1.6]',
} as const;

// ─── ⑤ GIÃN CHỮ ─────────────────────────────────────────────────────────────
//
// Giãn chữ mặc định của phông được thiết kế cho cỡ thân bài. Giữ nguyên khi
// phóng to thì các chữ cái rời rạc; giữ nguyên khi thu nhỏ thì chúng dính
// nhau. Bóp âm ở cỡ lớn, nới dương ở cỡ nhỏ — đó là toàn bộ quy luật.

export const LETTER_SPACING = {
  /** Chữ hiển thị rất lớn */
  tighter: 'tracking-[-0.03em]',
  /** Tiêu đề trang, tiêu đề mục */
  tight: 'tracking-[-0.015em]',
  /** Thân bài — không chỉnh */
  normal: 'tracking-normal',
  /** Nhãn CHỮ HOA cỡ nhỏ: nới rộng mới đọc được */
  wide: 'tracking-[0.08em]',
  /** Chữ dẫn, nhãn hệ thống */
  wider: 'tracking-[0.16em]',
} as const;

// ─── ⑥ CHỮ SỐ ───────────────────────────────────────────────────────────────
//
// ⚠️ ĐÂY LÀ MỤC QUAN TRỌNG NHẤT VỚI MỘT PHẦN MỀM NHÀ MÁY.
//
// `tabular-nums` bắt mọi chữ số có CÙNG BỀ NGANG. Thiếu nó thì "111" hẹp hơn
// "999", và một cột số trong bảng sẽ răng cưa — mắt không so được hàng nào
// lớn hơn hàng nào mà phải đọc từng con số.
//
// Mọi con số ĐO ĐƯỢC — sản lượng, tồn kho, tiền, phần trăm, số thùng — bắt
// buộc dùng `numeric.table` hoặc `numeric.metric`. Số nằm giữa câu văn xuôi
// thì dùng `numeric.inline`.

export const NUMERIC = {
  /** Số trong bảng và danh sách — BẮT BUỘC thẳng cột */
  table: 'tabular-nums',
  /** Số liệu lớn ở thẻ chỉ số */
  metric: 'tabular-nums',
  /** Số lẫn trong câu văn — để phông tự cân cho đẹp mắt */
  inline: 'proportional-nums',
  /**
   * Số 0 có gạch chéo và chữ số cao bằng nhau — dùng cho mã chứng từ, mã
   * cuộn vải, khoá đơn hàng: chỗ mà nhầm `0` với `O` là sai một lô hàng.
   */
  code: 'font-mono tabular-nums',
} as const;

// ─── ⑦ THANG ĐÁP ỨNG ────────────────────────────────────────────────────────
//
// ⚠️ CHỈ ba vai trò lớn nhất mới đổi cỡ theo khổ màn hình. Thân bài KHÔNG
// đổi: 14px trên điện thoại và 14px trên màn 27 inch là ĐÚNG, vì khoảng cách
// mắt tới màn hình cũng khác nhau tương ứng. Thu nhỏ thân bài trên điện thoại
// là lỗi kinh điển — nó làm chữ khó đọc đúng lúc điều kiện đọc tệ nhất
// (ngoài trời, cầm một tay, trên sàn xưởng).

export const RESPONSIVE = {
  display: 'text-[36px] sm:text-[48px]',
  pageTitle: 'text-[22px] sm:text-[28px]',
  sectionTitle: 'text-[18px] sm:text-[22px]',
} as const;

// ─── ⑧ QUY TẮC KHẢ NĂNG TIẾP CẬN ────────────────────────────────────────────
//
// Không phải gợi ý. Là ràng buộc — cùng hạng với §44.7 của Hiến pháp.

export const A11Y = {
  /** Cỡ nhỏ nhất cho chữ ĐỌC. Dưới mức này chỉ được dùng cho nhãn CHỮ HOA. */
  MIN_READING_PX: 12,
  /**
   * `micro` (11px) chỉ hợp lệ khi ĐỒNG THỜI: viết HOA · đậm ≥ 600 · giãn chữ
   * ≥ 0.08em. Ba thứ đó bù lại phần cỡ chữ bị mất. Dùng 11px cho câu thường
   * là vi phạm.
   */
  MICRO_REQUIRES: 'uppercase + semibold + tracking ≥ 0.08em',
  /** Cỡ nhỏ nhất cho ô nhập liệu trên iOS — dưới 16px Safari tự phóng to trang. */
  MIN_INPUT_PX: 16,
  /** Độ tương phản: xem `lib/design/tokens.ts`. Chữ nhỏ ≥ 4,5:1 · chữ lớn ≥ 3:1. */
  CONTRAST: 'WCAG AA — 4.5:1 (chữ nhỏ) · 3:1 (chữ ≥ 24px hoặc ≥ 19px đậm)',
} as const;

// ─── ⑨ THẺ VAI TRÒ — CỬA VÀO DUY NHẤT CỦA MÃ ỨNG DỤNG ───────────────────────
//
// Màn hình nghiệp vụ **chỉ dùng `TYPE`**. Bảy nhóm nguyên thuỷ ở trên là để
// dựng nên `TYPE` và để tài liệu quy chiếu — không phải để gọi rải rác.
//
// Mỗi thẻ là một chuỗi hoàn chỉnh: cỡ + đậm + giãn dòng + giãn chữ. Gọi một
// lần là được cả bốn, và bốn thứ đó luôn khớp nhau.

export const TYPE = {
  /** Chữ hiển thị lớn nhất — trang chủ, màn hình chào */
  display: 'text-[36px] sm:text-[48px] font-bold leading-[1.05] tracking-[-0.03em]',
  /** Tiêu đề trang (h1) */
  pageTitle: 'text-[22px] sm:text-[28px] font-bold leading-[1.2] tracking-[-0.015em]',
  /** Tiêu đề mục (h2) */
  sectionTitle: 'text-[18px] sm:text-[22px] font-semibold leading-[1.2] tracking-[-0.015em]',
  /** Tiêu đề thẻ (h3) */
  cardTitle: 'text-[16px] font-semibold leading-[1.35] tracking-[-0.015em]',
  /** Đoạn dẫn, câu mở đầu */
  bodyLg: 'text-[16px] font-normal leading-[1.6]',
  /** Thân bài mặc định */
  body: 'text-[14px] font-normal leading-[1.6]',
  /** Chữ phụ, mô tả dưới tiêu đề */
  bodySm: 'text-[13px] font-normal leading-[1.6]',
  /** Chú thích, chữ trợ giúp dưới ô nhập */
  caption: 'text-[12px] font-normal leading-[1.35]',
  /** Nhãn biểu mẫu */
  label: 'text-[13px] font-medium leading-[1.35]',
  /** Chữ dẫn / nhãn hệ thống — CHỮ HOA, giãn rộng */
  overline: 'text-[11px] font-semibold uppercase leading-[1.35] tracking-[0.16em]',
  /** Số liệu lớn ở thẻ chỉ số */
  metric: 'text-[28px] font-bold leading-[1.05] tracking-[-0.03em] tabular-nums',
  /** Số liệu nhỏ, nằm trong dòng */
  metricSm: 'text-[14px] font-medium leading-[1.35] tabular-nums',
  /** Hàng tiêu đề của bảng — CHỮ HOA nhỏ, giãn vừa */
  tableHeader: 'text-[12px] font-semibold uppercase leading-[1.35] tracking-[0.08em]',
  /** Ô dữ liệu trong bảng — luôn thẳng cột */
  tableCell: 'text-[13px] font-normal leading-[1.35] tabular-nums',
  /** Mã chứng từ, mã cuộn, khoá đơn — đọc từng ký tự */
  code: 'text-[12px] font-medium leading-[1.35] font-mono tabular-nums',
  /**
   * Ô nhập liệu. 16px là BẮT BUỘC, không phải lựa chọn thẩm mỹ: Safari trên
   * iOS tự phóng to cả trang khi người dùng chạm vào ô có chữ nhỏ hơn 16px,
   * và trang đã phóng thì không tự thu lại.
   */
  input: 'text-[16px] font-normal leading-[1.35]',
} as const;

export type TypeRole = keyof typeof TYPE;
