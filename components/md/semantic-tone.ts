// ============================================================================
// HỆ MÀU NGHIỆP VỤ — MỘT NGHIỆP VỤ, MỘT SẮC MÀU, DÙNG CHUNG MỌI NƠI
//
// ─── VÌ SAO TÁCH KHỎI Tone CỦA BỘ GIAO DIỆN GỐC ────────────────────────────
// `Tone` trong components/ui.tsx là màu THẨM MỸ (nhấn, thành công, cảnh báo).
// Bảng dưới đây là màu NGHIỆP VỤ: nhìn sắc màu là biết đang nói về nguyên phụ
// liệu hay hàng mẫu, không cần đọc chữ. Trộn hai khái niệm vào một bảng thì
// mỗi lần đổi màu nhấn của hệ thống lại vô tình đổi luôn ý nghĩa nghiệp vụ.
//
// ─── VÌ SAO TÍM QUAY LẠI ───────────────────────────────────────────────────
// Tím KHÔNG còn là màu thương hiệu (toàn hệ thống đã sang xanh dương). Ở đây
// tím chỉ mang đúng một nghĩa: HÀNG MẪU. Mẫu là thứ duy nhất trong nhà máy
// không nằm trên dòng chảy sản xuất chính, nên cho nó một sắc riêng hẳn là
// cách nhanh nhất để mắt tách nó ra.
//
// ─── TƯƠNG PHẢN ĐÃ ĐO TRÊN ĐÚNG CÁC CẶP DÙNG THẬT (WCAG 2.1) ───────────────
//   phù hiệu (chữ 700–800 / nền 50) : 5,21 – 6,84 : 1
//   huy hiệu (chữ 700–800 / nền 100): 4,84 – 6,37 : 1
// Thấp nhất 4,84:1 ở huy hiệu xanh lá, vẫn trên ngưỡng 4,5:1 của WCAG AA.
// ⚠️ Hổ phách dùng sắc độ 800 chứ không 700 như bốn nhóm kia: amber-700 trên
// amber-100 chỉ đạt 4,51:1 — sát ngưỡng tới mức một lần chỉnh nhẹ là rớt.
// ============================================================================

export const BIZ_DOMAINS = ['MATERIAL', 'QUALITY', 'SHIPPING', 'SAMPLE', 'PLANNING'] as const;
export type BizDomain = (typeof BIZ_DOMAINS)[number];

export const BIZ_LABEL: Record<BizDomain, string> = {
  MATERIAL: 'Nguyên phụ liệu',
  QUALITY: 'Chất lượng',
  SHIPPING: 'Giao hàng',
  SAMPLE: 'Hàng mẫu',
  PLANNING: 'Kế hoạch',
};

export interface BizStyle {
  /** Phù hiệu nhỏ: nền nhạt, chữ đậm, viền cùng sắc */
  badge: string;
  /** Huy hiệu bọc icon: nền 100, chữ 700 */
  chip: string;
  /** Thẻ lớn: viền + nền rất nhạt */
  card: string;
  /** Vạch màu dọc bên trái dòng danh sách */
  bar: string;
  /** Chữ đậm cho con số nổi bật */
  text: string;
}

export const BIZ_TONE: Record<BizDomain, BizStyle> = {
  // 🟢 Nguyên phụ liệu — xanh lá
  MATERIAL: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    chip: 'bg-emerald-100 text-emerald-700',
    card: 'border-emerald-200 bg-emerald-50/60',
    bar: 'bg-emerald-500',
    text: 'text-emerald-800',
  },
  // 🔴 Chất lượng / lỗi / nguy kịch — đỏ
  QUALITY: {
    badge: 'border-red-200 bg-red-50 text-red-700',
    chip: 'bg-red-100 text-red-700',
    card: 'border-red-200 bg-red-50/60',
    bar: 'bg-red-500',
    text: 'text-red-800',
  },
  // 🔵 Giao hàng / vận tải — xanh dương
  SHIPPING: {
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    chip: 'bg-blue-100 text-blue-700',
    card: 'border-blue-200 bg-blue-50/60',
    bar: 'bg-blue-500',
    text: 'text-blue-800',
  },
  // 🟣 Hàng mẫu — tím (màu NGHIỆP VỤ, không phải màu thương hiệu)
  SAMPLE: {
    badge: 'border-purple-200 bg-purple-50 text-purple-700',
    chip: 'bg-purple-100 text-purple-700',
    card: 'border-purple-200 bg-purple-50/60',
    bar: 'bg-purple-500',
    text: 'text-purple-800',
  },
  // 🟠 Kế hoạch / cảnh báo trễ — hổ phách
  PLANNING: {
    badge: 'border-amber-200 bg-amber-50 text-amber-800',
    chip: 'bg-amber-100 text-amber-800',
    card: 'border-amber-200 bg-amber-50/60',
    bar: 'bg-amber-500',
    text: 'text-amber-800',
  },
};

/** Dòng danh sách bấm được: viền sáng lên và nền đổi khi rê chuột, để người
 *  dùng biết cả dòng là một mục tiêu bấm chứ không riêng chữ trong đó. */
export const ROW_HOVER =
  'transition-colors hover:bg-slate-50 focus-within:bg-slate-50 cursor-pointer';

// ============================================================================
// SẮC MÀU CHO BA NHÓM TAB NGHIỆP VỤ
//
// Khác với BIZ_TONE ở trên (màu theo LOẠI DỮ LIỆU: nguyên phụ liệu, hàng mẫu…),
// bảng dưới đây là màu theo GIAI ĐOẠN CÔNG VIỆC. Mười ba tab trước kia đều
// viền xám nền trắng như nhau, nên muốn biết mình đang ở giai đoạn nào thì phải
// đọc nhãn nhóm bên trái — mà nhãn đó lại ẩn dưới màn hình lớn.
//
//   🔵 Thương mại — xanh lam : giai đoạn CHƯA có đơn (khách, báo giá, giá vốn)
//   🟢 Triển khai  — xanh ngọc: giai đoạn ĐÃ có đơn thật, đang chạy sản xuất
//   🟣 Phối hợp    — tím     : việc làm cùng bộ phận khác, không nằm trên dòng
//                              chảy sản xuất chính
//
// ─── TƯƠNG PHẢN ĐÃ ĐO (WCAG 2.1) ──────────────────────────────────────────
// Nhãn tab là chữ 14px ĐẬM. Ngưỡng "chữ lớn" của WCAG là 18,66px đậm, nên cỡ
// này KHÔNG được nới lỏng: vẫn phải đạt 4,5:1.
//
//   nghỉ   chữ 700 / nền 50 : lam 6,16 · ngọc 5,21 · tím 6,51  : 1
//   rê chuột chữ 700 / nền 100: lam 5,49 · ngọc 4,84 · tím 5,92  : 1
//   đang chọn  trắng / nền đậm : lam 5,17 · ngọc 5,48 · tím 5,38  : 1
//
// ⚠️ Nhóm Triển khai dùng emerald-700 cho trạng thái đang chọn, KHÔNG dùng
// emerald-600 như hai nhóm kia: chữ trắng trên emerald-600 chỉ đạt 3,77:1 —
// TRƯỢT chuẩn AA. Đây là cái bẫy cố hữu của dải xanh lá trong Tailwind, sắc độ
// 600 của nó sáng hơn hẳn 600 của lam và tím.
export type TabGroup = 'Thương mại' | 'Triển khai' | 'Phối hợp';

export interface TabGroupStyle {
  /** Nút ở trạng thái nghỉ */
  idle: string;
  /** Nút đang được chọn */
  active: string;
  /** Con số đếm bên trong nút, hai trạng thái */
  countIdle: string;
  countActive: string;
  /** Nhãn tên nhóm ở lề trái */
  label: string;
}

export const GROUP_TONE: Record<TabGroup, TabGroupStyle> = {
  'Thương mại': {
    idle: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-100 hover:ring-blue-300',
    active: 'bg-blue-600 text-white shadow-sm shadow-blue-600/30',
    countIdle: 'bg-blue-100 text-blue-700',
    countActive: 'bg-white/25 text-white',
    label: 'text-blue-600',
  },
  'Triển khai': {
    idle: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100 hover:ring-emerald-300',
    active: 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/30',
    countIdle: 'bg-emerald-100 text-emerald-700',
    countActive: 'bg-white/25 text-white',
    label: 'text-emerald-600',
  },
  'Phối hợp': {
    idle: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200 hover:bg-purple-100 hover:ring-purple-300',
    active: 'bg-purple-600 text-white shadow-sm shadow-purple-600/30',
    countIdle: 'bg-purple-100 text-purple-700',
    countActive: 'bg-white/25 text-white',
    label: 'text-purple-600',
  },
};
