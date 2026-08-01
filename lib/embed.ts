/**
 * NHÚNG QUAN HỆ CỦA PostgREST — MỘT KHUÔN DUY NHẤT
 *
 * ─── VÌ SAO CẦN ───────────────────────────────────────────────────────────
 *
 * PostgREST trả quan hệ nhúng lúc là **một đối tượng**, lúc là **một mảng**,
 * tuỳ hình dạng khoá mà nó suy ra được. Trước Audit 03/08/2026, mã nguồn xử
 * lý chuyện đó theo hai cách trộn lẫn:
 *
 *   ① `(item: any) => item.orders?.po_number`      — bỏ luôn kiểu, và SAI nếu
 *                                                     PostgREST trả mảng
 *   ② `Array.isArray(x) ? x[0]?.f : (x as unknown as {f: string})?.f`
 *                                                   — đúng, nhưng lặp lại và
 *                                                     dài tới mức khó đọc
 *
 * Cách ① là nguồn của **13 trong 18 chỗ `any`** — vi phạm guardrail *cấm `any`*.
 *
 * Tệp này gộp hai cách thành một hàm, nên vừa giữ kiểu vừa đúng ở cả hai hình
 * dạng dữ liệu.
 */

/** Quan hệ nhúng: PostgREST có thể trả về một đối tượng, một mảng, hoặc rỗng. */
export type Embed<T> = T | T[] | null | undefined;

/**
 * Lấy **một** bản ghi từ quan hệ nhúng, bất kể PostgREST trả kiểu nào.
 *
 * ⚠️ Trả `null` khi rỗng chứ không ném lỗi: quan hệ nhúng vắng mặt là chuyện
 * bình thường (khoá ngoại `NULL`, hoặc RLS lọc mất nhánh con). Nơi gọi tự
 * quyết hiển thị gì — thường là `'N/A'`.
 */
export function motBanGhi<T>(e: Embed<T>): T | null {
  if (e == null) return null;
  return Array.isArray(e) ? (e[0] ?? null) : e;
}

/** Lấy **danh sách** từ quan hệ nhúng, luôn trả về mảng (có thể rỗng). */
export function danhSach<T>(e: Embed<T>): T[] {
  if (e == null) return [];
  return Array.isArray(e) ? e : [e];
}
