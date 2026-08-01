// ============================================================================
// BẢN DỊCH CỦA MASTER DATA NGƯỜI DÙNG KHAI — VALUE OBJECT
//
// ⚠️ TỆP NÀY PHẢI CHO CÙNG KẾT QUẢ VỚI HÀM SQL `mos_pick_translation()`.
// Hai bản cài đặt của một luật là hai bản sẽ lệch — nên có phép kiểm hợp đồng
// đối chiếu từng nhánh dự phòng giữa TypeScript và PostgreSQL.
//
// ─── VÌ SAO CÓ HAI BẢN CÀI ĐẶT ───────────────────────────────────────────
//   SQL   dùng trong trigger đồng bộ và khi cần lọc/sắp xếp NGAY trong CSDL
//   TS    dùng ở giao diện, nơi ngôn ngữ phiên chỉ tồn tại trên trình duyệt
//
// Máy chủ **không biết** người dùng đang xem tiếng gì — `Language` là trạng thái
// của client. Ép service phải biết nghĩa là truyền ngôn ngữ qua mọi Server
// Action, và quên một chỗ là một màn hình hiện sai tiếng.
//
// ─── HIẾN PHÁP ĐIỀU IX ───────────────────────────────────────────────────
// *"Frontend chịu trách nhiệm dịch thuật."* DTO mang **cả bản đồ dịch**; việc
// chọn tiếng nào xảy ra ở tầng vẽ. Đó là lý do `ContractTypeDTO.name` là một
// object chứ không phải một chuỗi đã chốt sẵn.
// ============================================================================

import type { Language } from '@/lib/i18n';

/**
 * Bản đồ dịch của một mục danh mục.
 *
 * ⚠️ Khoá là chữ **THƯỜNG**: `vi` · `en` · `cn`. JSON phân biệt hoa thường, và
 * `Language` của ứng dụng viết HOA — nên mọi lần tra đều phải hạ chữ trước.
 * Quên một lần là `translations['VN']` trả `undefined` mà không báo gì.
 *
 * ⚠️ Nợ đã ghi ở ADR-005: `cn` là **mã quốc gia**, ngôn ngữ đúng chuẩn BCP-47
 * phải là `zh`. Chọn `cn` để khớp `Language` sẵn có, tránh sinh một bảng ánh xạ
 * thứ hai — nhưng đó là nợ, không phải thiết kế đúng.
 */
export type TranslatedText = Record<string, string>;

/** Ba ngôn ngữ ứng dụng đang chạy, ở dạng khoá JSONB. */
export const TRANSLATION_KEYS = ['vi', 'en', 'cn'] as const;

/**
 * Chọn bản dịch theo chuỗi dự phòng.
 *
 * ```
 * ngôn ngữ phiên → vi → en → khoá đầu tiên có chữ → chính `code`
 * ```
 *
 * ⚠️ **KHÔNG BAO GIỜ trả chuỗi rỗng.** Đây là cả lý do hàm này tồn tại.
 *
 * Ca hỏng thật nếu chỉ dừng ở `en`: người vận hành khai một loại hợp đồng **chỉ
 * bằng tiếng Việt**; một phiên `EN` tra `en` không thấy → màn hình hiện ô trống
 * → người dùng kết luận danh mục hỏng.
 *
 * Playbook Điều XX: *"tra nhãn không thấy thì **hiện mã gốc**, không để trống —
 * người vận hành còn biết mà báo lại."* Chuỗi kết thúc ở `code` chính vì thế.
 *
 * ⚠️ Nhánh "khoá đầu tiên" **sắp xếp theo khoá** trước khi lấy. Không sắp thì
 * thứ tự phụ thuộc vào thứ tự chèn của JSON, và hai lần gọi có thể trả hai giá
 * trị khác nhau cho cùng một dữ liệu — hàm SQL cũng `ORDER BY e.key` đúng vì lẽ
 * này, và hai bên phải khớp.
 */
export function pickTranslation(
  t: TranslatedText | null | undefined,
  lang: Language | string,
  fallbackCode: string,
): string {
  const map = t ?? {};

  const at = (k: string): string | null => {
    const v = map[k];
    if (typeof v !== 'string') return null;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  return (
    at(String(lang).toLowerCase()) ??
    at('vi') ??
    at('en') ??
    // Ngôn ngữ nào cũng được, miễn là có chữ — nhưng phải TIỀN ĐỊNH.
    Object.keys(map)
      .sort()
      .map(at)
      .find((v): v is string => v !== null) ??
    fallbackCode
  );
}

/**
 * Dựng bản đồ dịch từ biểu mẫu, gỡ sạch khoá rỗng.
 *
 * ⚠️ Đối ứng của `mos_strip_blank_translations()` phía SQL. Chuỗi rỗng trong
 * JSONB là thứ tệ nhất: nó **có** khoá nên chuỗi dự phòng dừng lại ở đó, và màn
 * hình hiện ô trống — đúng thứ `pickTranslation` sinh ra để tránh.
 *
 * Trả `{}` khi không còn khoá nào; ràng buộc `<bảng>_translations_shape` của
 * CSDL sẽ từ chối, và **từ chối to tiếng là đúng** — người dùng chưa nhập gì.
 */
export function buildTranslations(input: Record<string, string | null | undefined>): TranslatedText {
  const out: TranslatedText = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v !== 'string') continue;
    const trimmed = v.trim();
    if (trimmed.length > 0) out[k.toLowerCase()] = trimmed;
  }
  return out;
}

/** Bản đồ dịch có dùng được không — tức có ít nhất một khoá có chữ. */
export function hasAnyTranslation(t: TranslatedText | null | undefined): boolean {
  if (!t) return false;
  return Object.values(t).some((v) => typeof v === 'string' && v.trim().length > 0);
}
