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
