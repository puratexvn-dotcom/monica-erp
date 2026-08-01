// ============================================================================
// MỞ PHONG BÌ — cầu nối giữa Contract và React Query
//
// ─── VÌ SAO CẦN TỆP NÀY ──────────────────────────────────────────────────
// Service KHÔNG BAO GIỜ ném lỗi. Nó trả `{ rows, error }` — đó là thiết kế có
// chủ ý từ Phase 5: *"một bảng hỏng không được kéo cả trang sang error
// boundary"*.
//
// Nhưng React Query đọc tín hiệu hỏng bằng **Promise bị reject**. Một promise
// giải quyết thành công với `error: 'Bạn không có quyền'` bên trong sẽ được
// React Query coi là THÀNH CÔNG: `isError` false, `data` là mảng rỗng, và màn
// hình hiện *"chưa có phần việc nào"*.
//
// ⚠️ Đó chính xác là lỗi đã xảy ra ở Phase 5 với `qa_logs`: giao diện nói với
// buyer *"chưa có phiếu kiểm nào"* trong khi sự thật là *"bạn không được xem"*.
// Một câu sai sự thật, và người dùng tin nó.
//
// Hai hàm dưới đây dịch phong bì thành tín hiệu mà React Query hiểu.
// ============================================================================

export interface Envelope {
  error: string | null;
}

/**
 * Danh sách: có lỗi là ném.
 *
 * Danh sách rỗng vì lỗi và danh sách rỗng vì chưa có dữ liệu là **hai sự thật
 * khác nhau**, và chỉ một trong hai được phép hiện thành "chưa có gì".
 */
export function unwrapList<T, E extends Envelope & { rows: T[] }>(res: E): E {
  if (res.error) throw new Error(res.error);
  return res;
}

/**
 * Một bản ghi: chỉ ném khi KHÔNG CÓ GÌ để hiện.
 *
 * ⚠️ Service cố ý cho phép trả `data` kèm `error` — chi tiết phần việc đọc
 * được nhưng sổ cái hỏng chẳng hạn. Ném ở đây sẽ vứt luôn phần dữ liệu dùng
 * được, và người dùng mất cả màn hình vì một truy vấn phụ.
 *
 * Nơi gọi nhận lại `error` kèm `data` và có trách nhiệm HIỂN THỊ nó — số liệu
 * tính trên dữ liệu thiếu là số liệu sai, nên cảnh báo không được nuốt.
 */
export function unwrapItem<T, E extends Envelope & { data: T | null }>(res: E): E {
  if (res.data === null) throw new Error(res.error ?? 'Không tìm thấy dữ liệu.');
  return res;
}

/** Lệnh ghi: `ok === false` là hỏng, dù promise vẫn giải quyết bình thường. */
export function unwrapMutation<E extends Envelope & { ok: boolean }>(res: E): E {
  if (!res.ok) throw new Error(res.error ?? 'Không thực hiện được.');
  return res;
}
