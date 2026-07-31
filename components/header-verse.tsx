import { todaysVerse } from '@/components/daily-verses';

// ============================================================================
// LỜI CHÚA TRÊN THANH ĐẦU TRANG — HAI CÁCH BÀY, MỘT NGUỒN
//
// ─── VÌ SAO PHẢI CÓ HAI BIẾN THỂ ──────────────────────────────────────────
// Trên màn rộng, cách duy nhất để câu nằm ĐÚNG GIỮA THANH là căn tuyệt đối:
// logo rộng 208px còn cụm nút bên phải rộng khác, nên flex-1 sẽ cho ra "giữa
// khoảng trống còn lại" — lệch hẳn sang phải.
//
// Nhưng khối căn tuyệt đối nằm NGOÀI luồng, tức KHÔNG đẩy được ai ra. Trên màn
// hẹp nó sẽ nằm đè lên logo. Đó chính là lý do bản trước phải ẩn nó dưới lg —
// và hệ quả là điện thoại không thấy Lời Chúa.
//
// Cách giải: màn hẹp dùng biến thể 'bar' — một HÀNG RIÊNG nằm dưới hàng logo,
// trong luồng tài liệu nên tự đẩy chỗ cho mình, không đè lên ai. Câu được hiện
// ĐẦY ĐỦ tới hai dòng thay vì bị cắt cụt.
//
// Cả hai biến thể lấy câu từ cùng todaysVerse(), nên không bao giờ lệch nhau.
// ============================================================================

/** Dải chuyển sắc vàng gold → hổ phách đậm. Sắc độ chọn đủ tối để chữ vẫn đọc
 *  rõ trên nền trắng mờ của thanh kính. */
const GOLD_GRADIENT = 'linear-gradient(95deg, #b45309 0%, #d97706 30%, #f59e0b 55%, #b45309 100%)';

/** Bóng chữ rất nhẹ giúp chữ vàng tách khỏi nền kính mờ mà không bị bệt.
 *  Dùng drop-shadow chứ không text-shadow vì chữ đang tô bằng nền cắt (
 *  bg-clip-text) — text-shadow sẽ vẽ đè lên phần nền bị cắt và làm đục màu. */
const GLOW: React.CSSProperties = { filter: 'drop-shadow(0 1px 1px rgba(180,83,9,0.18))' };

function Quote({ side }: { side: 'open' | 'close' }) {
  return (
    <span
      aria-hidden="true"
      className="shrink-0 select-none font-black leading-none text-amber-400"
    >
      {side === 'open' ? '“' : '”'}
    </span>
  );
}

export default function HeaderVerse({
  variant,
  className = '',
}: {
  /** 'center' = căn tuyệt đối giữa thanh (từ lg) · 'bar' = hàng riêng (dưới lg) */
  variant: 'center' | 'bar';
  className?: string;
}) {
  const verse = todaysVerse();

  if (variant === 'center') {
    return (
      <div
        aria-label="Lời Chúa hôm nay"
        // pointer-events-none: lớp phủ ở giữa không được nuốt cú bấm vào logo
        // hay cụm nút nằm dưới nó.
        className={`pointer-events-none absolute left-1/2 hidden -translate-x-1/2 px-4 lg:block lg:max-w-[40rem] xl:max-w-[52rem] ${className}`}
      >
        <p className="flex items-baseline justify-center gap-2" style={GLOW}>
          <Quote side="open" />
          <span
            className="min-w-0 truncate bg-clip-text text-xl font-bold italic leading-snug text-transparent xl:text-2xl"
            style={{ backgroundImage: GOLD_GRADIENT }}
            title={`${verse.text} — ${verse.ref}`}
          >
            {verse.text}
          </span>
          <Quote side="close" />
          {/* Xuất xứ thu nhỏ: bỏ hẳn thì câu Kinh Thánh mất nguồn, mà để to
              bằng câu thì nó tranh chỗ với chính nội dung. */}
          <span className="shrink-0 text-sm font-bold not-italic text-amber-700">{verse.ref}</span>
        </p>
      </div>
    );
  }

  // ─── Biến thể 'bar' cho điện thoại và máy tính bảng ────────────────────
  // Nằm trong luồng nên tự chiếm chỗ, không đè lên logo. line-clamp-2 cho câu
  // dài xuống dòng thứ hai rồi mới cắt — trên một hàng riêng thì có chỗ để
  // đọc, không cần cắt cụt ngay dòng đầu như biến thể căn giữa.
  return (
    <div
      aria-label="Lời Chúa hôm nay"
      className={`border-t border-amber-200/60 bg-gradient-to-r from-amber-50/80 via-yellow-50/90 to-amber-50/80 px-4 py-2 lg:hidden ${className}`}
    >
      <p className="mx-auto flex max-w-2xl items-baseline justify-center gap-1.5 text-center" style={GLOW}>
        <Quote side="open" />
        <span
          className="line-clamp-2 min-w-0 bg-clip-text text-[15px] font-bold italic leading-snug text-transparent sm:text-base"
          style={{ backgroundImage: GOLD_GRADIENT }}
        >
          {verse.text}
        </span>
        <Quote side="close" />
      </p>
      <p className="mt-0.5 text-center text-[11px] font-bold text-amber-700">{verse.ref}</p>
    </div>
  );
}
