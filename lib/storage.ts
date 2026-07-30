// ============================================================================
// ĐƯỜNG DẪN CÔNG KHAI TỚI TỆP TRONG BUCKET `evidences`
//
// Cơ sở dữ liệu lưu ĐƯỜNG DẪN TRONG BUCKET, không lưu URL đầy đủ (xem
// migration 013). Nếu sau này bucket chuyển sang riêng tư thì URL công khai đã
// lưu sẽ chết hết, còn đường dẫn thì vẫn dùng được để phát Signed URL.
//
// Hàm này dựng lại URL để xem tệp. Thiếu biến môi trường thì trả null chứ
// KHÔNG ghép ra một URL sai — thẻ <a> trỏ vào "undefined/storage/..." còn khó
// hiểu hơn là một nút bị vô hiệu hoá.
// ============================================================================

const BUCKET = 'evidences';

export function publicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  // Mỗi đoạn mã hoá riêng để dấu "/" phân cấp thư mục không bị mã hoá theo
  const safe = path.split('/').map(encodeURIComponent).join('/');
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${safe}`;
}
