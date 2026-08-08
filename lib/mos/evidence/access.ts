// ============================================================================
// LUẬT TRUY CẬP BẰNG CHỨNG — hằng số và ánh xạ thuần
//
// 📐 Board Directive *EVIDENCE SECURITY IMPLEMENTATION* 08/08/2026 §2 · §3
//
// ⚠️ Tệp này **⛔ không biết** Supabase, ⛔ không biết React. Nó chỉ khai *"đối
// tượng nào nằm ở bảng nào"* và *"URL sống bao lâu"* — để Server Action, bài
// kiểm và tầng vẽ cùng đọc **một** nguồn thay vì mỗi nơi chép một bản.
// ============================================================================

/**
 * 🔴 **HẠN CỦA URL — 300 giây.** Board §2 chốt con số này.
 *
 * 🔑 Vì sao đúng ngần đó:
 *   · **Đủ** để mở một ảnh hoặc tải một PDF, kể cả trên 3G ở xưởng.
 *   · **Quá ngắn** để dán vào email/Zalo rồi còn dùng được — mà đó chính là
 *     cách URL công khai rò ra ngoài trong đời thật.
 *
 * ⚠️ Nới con số này là **quyết định bảo mật**, ⛔ không phải tinh chỉnh trải
 * nghiệm. Người dùng gặp URL hết hạn thì bấm xem lại — hệ thống xin URL mới.
 */
export const HAN_SIGNED_URL_GIAY = 300;

/**
 * Đối tượng nghiệp vụ ⟷ bảng chứa nó.
 *
 * 🔑 Dùng để **hỏi RLS**: đọc được bản ghi cha ⇒ được xem bằng chứng của nó.
 * ⚠️ Danh sách này phải khớp `ENTITY_TYPES` ở `schemas/md/collaboration.schema`.
 * Thêm một loại ở đó mà quên ở đây ⇒ bằng chứng của loại ấy **⛔ không xem
 * được** — hỏng ồn ào, ⛔ không phải hở im lặng. Đó là hướng sai an toàn hơn.
 */
export const BANG_THEO_ENTITY = {
  ORDER: 'orders',
  STYLE: 'styles',
  COSTING: 'costings',
  INQUIRY: 'inquiries',
  CUSTOMER: 'customers',
  SAMPLE: 'sample_submissions',
  MILESTONE: 'order_milestones',
} as const;

export type EntityBangChung = keyof typeof BANG_THEO_ENTITY;
