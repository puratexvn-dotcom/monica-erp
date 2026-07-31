import { todaysVerse } from '@/components/daily-verses';

// ============================================================================
// LỜI CHÚA — DẢI TRÊN THANH ĐẦU TRANG
//
// ─── VÌ SAO CĂN GIỮA TUYỆT ĐỐI ────────────────────────────────────────────
// Dùng absolute + left-1/2 + -translate-x-1/2 chứ không dùng flex-1: với flex-1
// thì "giữa" là giữa khoảng trống CÒN LẠI sau logo và cụm nút, mà logo rộng
// 208px còn cụm nút bên phải rộng khác — câu sẽ lệch hẳn sang phải. Căn tuyệt
// đối cho câu nằm đúng giữa THANH, không phụ thuộc hai bên rộng bao nhiêu.
//
// pointer-events-none để lớp phủ ở giữa không nuốt cú bấm vào logo hay nút.
//
// ─── VÌ SAO CHỈ HIỆN TỪ lg ────────────────────────────────────────────────
// Khối căn giữa tuyệt đối KHÔNG đẩy được ai ra: nếu màn hẹp, nó sẽ nằm ĐÈ lên
// logo và cụm nút ngôn ngữ. Từ lg (1024px) trở lên mới đủ chỗ cho cả ba.
//
// ─── VÌ SAO CẮT CHỮ THAY VÌ XUỐNG DÒNG ────────────────────────────────────
// Thanh cao cố định. Cho câu xuống dòng sẽ đẩy logo và các nút lệch hàng mỗi
// khi câu dài hơn bình thường.
// ============================================================================

/** Dải chuyển sắc vàng gold → hổ phách đậm. Đặt thành hằng để đổi một chỗ là
 *  đổi cả cụm. Sắc độ chọn đủ tối để chữ vẫn đọc rõ trên nền trắng mờ. */
const GOLD_GRADIENT = 'linear-gradient(95deg, #b45309 0%, #d97706 30%, #f59e0b 55%, #b45309 100%)';

export default function HeaderVerse({ className = '' }: { className?: string }) {
  const verse = todaysVerse();

  return (
    <div
      aria-label="Lời Chúa hôm nay"
      className={`pointer-events-none absolute left-1/2 hidden -translate-x-1/2 px-4 lg:block lg:max-w-[38rem] xl:max-w-[46rem] ${className}`}
    >
      <p className="flex items-baseline justify-center gap-1.5">
        <span
          aria-hidden="true"
          className="shrink-0 select-none text-xl font-black leading-none text-amber-500"
        >
          &ldquo;
        </span>
        <span
          className="min-w-0 truncate bg-clip-text text-lg font-semibold italic leading-snug text-transparent xl:text-xl"
          style={{ backgroundImage: GOLD_GRADIENT }}
          title={`${verse.text} — ${verse.ref}`}
        >
          {verse.text}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 select-none text-xl font-black leading-none text-amber-500"
        >
          &rdquo;
        </span>
        {/* Xuất xứ giữ lại nhưng thu nhỏ: bỏ hẳn thì câu Kinh Thánh mất nguồn,
            mà để to bằng câu thì nó tranh chỗ với chính nội dung. */}
        <span className="shrink-0 text-xs font-bold not-italic text-amber-700">
          {verse.ref}
        </span>
      </p>
    </div>
  );
}
