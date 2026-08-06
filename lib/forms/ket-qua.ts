// ============================================================================
// KẾT QUẢ MỘT LẦN GHI BIỂU MẪU
//
// Mọi Server Action nhập liệu của xưởng đã trả về đúng hình dạng này từ trước
// (`{ success: true }` hoặc `{ error: '…' }`) — tệp này chỉ **đặt tên** cho nó
// để `components/forms/action-form.tsx` bám vào mà ⛔ không phải import từ
// `app/` *(kiến trúc cấm: `components` ⛔ không được import từ `app`)*.
//
// ⚠️ Cả hai trường đều **tuỳ chọn**: đây là hình dạng ĐANG CÓ của mã cũ, ⛔
// không phải hình dạng lý tưởng. Union rõ ràng
// *(`{ok:true} | {ok:false, loi}`)* sẽ đúng hơn, nhưng đổi nó là sửa **tám
// hàm ở năm phân hệ** — việc đó cần một vòng riêng, ⛔ không gộp vào bản vá
// đang chữa cháy.
// ============================================================================
export interface KetQuaForm {
  success?: boolean;
  error?: string;
}
