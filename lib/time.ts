/**
 * GIỜ VIỆT NAM — NGUỒN SỰ THẬT DUY NHẤT
 *
 * ─── VÌ SAO TỆP NÀY TỒN TẠI ───────────────────────────────────────────────
 *
 * Máy chủ (Vercel) chạy giờ UTC. Nhà máy ở `Asia/Ho_Chi_Minh` = UTC+7. Lấy
 * "hôm nay" theo giờ UTC thì suốt **07:00 tối đến nửa đêm giờ VN**, hệ thống
 * vẫn tưởng là ngày hôm trước — ca chiều báo sản lượng vào sai ngày.
 *
 * Trước Audit 03/08/2026, phép bù này được viết tay bằng số ma thuật
 * `Date.now() + 7 * 3600 * 1000` ở **sáu tệp khác nhau**. Sáu bản sao của một
 * quy tắc nghĩa là sáu chỗ có thể lệch nhau, và không chỗ nào là chỗ đúng.
 *
 * ─── VÌ SAO KHÔNG DÙNG `Intl` Ở MỌI CHỖ ───────────────────────────────────
 *
 * `toLocaleDateString('en-CA', { timeZone })` cho ra `YYYY-MM-DD` chuẩn và
 * **đúng cả khi có quy tắc giờ mùa**. Việt Nam không đổi giờ mùa từ 1975, nên
 * phép cộng 7 giờ hiện cho cùng kết quả — nhưng `Intl` mô tả **ý định** thay
 * vì mã hoá một hằng số. Ở đây dùng `Intl` làm đường chính.
 *
 * ⚠️ `MUI_GIO` vẫn được xuất ra vì có chỗ cần chuỗi múi giờ để truyền vào
 * `Intl` khác — KHÔNG dùng nó để tự cộng trừ mili-giây.
 */

/** Múi giờ vận hành của nhà máy. Mọi thứ "theo ngày" phải quy về đây. */
export const MUI_GIO = 'Asia/Ho_Chi_Minh' as const;

/**
 * Ngày hôm nay theo giờ Việt Nam, dạng `YYYY-MM-DD`.
 *
 * Dùng cho mọi phép so sánh với cột `DATE` trong cơ sở dữ liệu — cột `DATE`
 * không mang múi giờ, nên nó phải được so với **ngày theo giờ nhà máy**.
 */
export function ngayVN(luc: Date = new Date()): string {
  // `en-CA` cho ra đúng `YYYY-MM-DD`; đây là cách ngắn nhất lấy ngày theo một
  // múi giờ mà không phải tự cộng trừ.
  return luc.toLocaleDateString('en-CA', { timeZone: MUI_GIO });
}

/**
 * Giờ trong ngày (0–23) theo giờ Việt Nam.
 *
 * Dùng cho những thứ phụ thuộc buổi — lời chào trên trang chủ, ca làm việc.
 * Đi qua `Intl` với `MUI_GIO` thay vì cộng bù giờ bằng tay: cộng tay là đúng
 * loại số ma thuật mà bài kiểm kiến trúc cấm, và nó sai ngay khi múi giờ đổi.
 */
export function gioVN(luc: Date = new Date()): number {
  const hh = luc.toLocaleString('en-GB', {
    timeZone: MUI_GIO,
    hour: '2-digit',
    hour12: false,
  });
  return Number(hh);
}

/** Ngày VN của một mốc thời gian bất kỳ (chuỗi ISO hoặc `Date`). */
export function ngayVNCua(moc: string | Date | null | undefined): string | null {
  if (!moc) return null;
  const d = moc instanceof Date ? moc : new Date(moc);
  return Number.isNaN(d.getTime()) ? null : ngayVN(d);
}

/** `true` nếu mốc thời gian rơi vào ĐÚNG hôm nay theo giờ nhà máy. */
export function laHomNayVN(moc: string | Date | null | undefined): boolean {
  const n = ngayVNCua(moc);
  return n !== null && n === ngayVN();
}

/** Ngày VN cách hôm nay `soNgay` ngày (âm = quá khứ), dạng `YYYY-MM-DD`. */
export function ngayVNLech(soNgay: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + soNgay);
  return ngayVN(d);
}

/** Hiển thị ngày–giờ cho người đọc, theo giờ nhà máy. */
export function hienThiVN(moc: string | Date | null | undefined): string {
  if (!moc) return '—';
  const d = moc instanceof Date ? moc : new Date(moc);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { timeZone: MUI_GIO, hour12: false });
}
