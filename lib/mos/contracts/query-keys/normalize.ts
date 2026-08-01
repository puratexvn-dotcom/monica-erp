// ============================================================================
// CHUẨN HOÁ BỘ LỌC — DÙNG CHUNG CHO MỌI KEY FACTORY
//
// Tách riêng vì cả `assignment.keys.ts`, `partner.keys.ts` và mọi factory sau
// này (buyer · subcon · sales · hr · crm) đều cần đúng phép chuẩn hoá này.
// Chép sang từng tệp là dựng n bản cài đặt, và chúng sẽ lệch.
// ============================================================================

/**
 * Biến một object bộ lọc thành một chuỗi ổn định để làm mảnh khoá.
 *
 * ⚠️ Hai bộ lọc **cùng ý nghĩa** phải cho **cùng một khoá**. Nếu không, chúng
 * chiếm hai ô nhớ đệm và gọi mạng hai lần cho cùng một câu hỏi — và tệ hơn,
 * `invalidateQueries` nhắm vào ô này sẽ để ô kia trơ ra với dữ liệu cũ.
 *
 * Ba thứ được xử lý, cả ba đều là bẫy thật:
 *   ① `undefined` · `null` · chuỗi rỗng bị bỏ hẳn
 *      `{orderId:'x'}` phải bằng `{orderId:'x', partnerId:undefined}`
 *   ② khoá object được sắp xếp — thứ tự khai báo không được đổi ô nhớ đệm
 *   ③ mảng được sắp xếp — `['DRAFT','ISSUED']` và `['ISSUED','DRAFT']` là cùng
 *      một câu hỏi
 */
export function normalizeFilter(filter: object | undefined): string {
  if (!filter) return '';

  const entries = Object.entries(filter)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]): [string, unknown] => [k, Array.isArray(v) ? [...v].sort() : v])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  return entries.length === 0 ? '' : JSON.stringify(Object.fromEntries(entries));
}
