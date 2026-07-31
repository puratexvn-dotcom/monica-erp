import { todaysVerse } from '@/components/daily-verses';

// ============================================================================
// LỜI CHÚA TRÊN THANH ĐẦU TRANG — HAI CÁCH BÀY, MỘT NGUỒN
//
// ─── VÌ SAO PHẢI CÓ HAI BIẾN THỂ ──────────────────────────────────────────
// Trên màn rộng, cách duy nhất để câu nằm ĐÚNG GIỮA THANH là căn tuyệt đối:
// logo và cụm nút bên phải rộng khác nhau, nên flex-1 sẽ cho ra "giữa khoảng
// trống còn lại" — lệch hẳn sang một bên.
//
// Nhưng khối căn tuyệt đối nằm NGOÀI luồng, tức KHÔNG đẩy được ai ra. Ở màn
// hẹp nó sẽ đè lên logo. Vì vậy màn hẹp dùng biến thể 'bar' — một hàng riêng
// nằm dưới hàng logo, trong luồng nên tự chiếm chỗ.
//
// ─── KHÔNG CẮT CHỮ Ở BẤT KỲ ĐÂU ───────────────────────────────────────────
// Bản trước dùng truncate (màn rộng) và line-clamp-2 (màn hẹp). Cả hai đều làm
// câu Kinh Thánh cụt giữa chừng kèm dấu ba chấm — với nội dung này thì đó là
// điều không chấp nhận được: một câu bị cắt có thể đổi hẳn ý nghĩa.
// Nay câu TỰ XUỐNG DÒNG, hiện đủ trong mọi trường hợp.
//
// Câu dài nhất trong bộ là 102 ký tự. Ở cỡ text-xl (20px, bề rộng trung bình
// ~0,52em) nó chiếm khoảng 1.060px, nên với max-w 56rem (896px) sẽ xuống đúng
// HAI dòng — vừa khít chiều cao thanh đã nới ở app/top-navbar.tsx.
// ============================================================================

/** Dải chuyển sắc vàng gold → hổ phách đậm. Sắc độ chọn đủ tối để chữ vẫn đọc
 *  rõ trên nền trắng mờ của thanh kính. */
const GOLD_GRADIENT = 'linear-gradient(95deg, #b45309 0%, #d97706 30%, #f59e0b 55%, #b45309 100%)';

/** Bóng chữ rất nhẹ giúp chữ vàng tách khỏi nền kính mờ mà không bị bệt.
 *  Dùng drop-shadow chứ không text-shadow vì chữ đang tô bằng nền cắt
 *  (bg-clip-text) — text-shadow sẽ vẽ đè lên phần nền bị cắt và làm đục màu. */
const GLOW: React.CSSProperties = { filter: 'drop-shadow(0 1px 1px rgba(180,83,9,0.18))' };

function Quote({ side }: { side: 'open' | 'close' }) {
  return (
    <span aria-hidden="true" className="select-none font-black leading-none text-amber-400">
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
        // top-1/2 + -translate-y-1/2: câu nở ra hai dòng thì nở ĐỀU về hai phía
        // quanh trục giữa, không đẩy lệch xuống dưới.
        // pointer-events-none: lớp phủ ở giữa không được nuốt cú bấm vào logo
        // hay cụm nút nằm dưới nó.
        className={`pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 px-4 text-center lg:block lg:max-w-[56rem] xl:max-w-[68rem] ${className}`}
      >
        {/* balance: trình duyệt chia đều chữ cho hai dòng thay vì dồn hết lên
            dòng đầu rồi để dòng sau trơ trọi vài chữ. */}
        <p
          className="text-balance bg-clip-text text-xl font-bold italic leading-snug text-transparent xl:text-2xl"
          style={{ ...GLOW, backgroundImage: GOLD_GRADIENT }}
        >
          <Quote side="open" />
          {verse.text}
          <Quote side="close" />
        </p>
        {/* Xuất xứ tách xuống dòng riêng: để chung một dòng với câu thì khi câu
            xuống hai dòng, mã trích dẫn bị đẩy lơ lửng giữa câu. */}
        <p className="mt-0.5 text-sm font-bold not-italic text-amber-700">{verse.ref}</p>
      </div>
    );
  }

  // ─── Biến thể 'bar' cho điện thoại và máy tính bảng ────────────────────
  // Nằm trong luồng nên tự chiếm chỗ và tự cao lên theo số dòng — không cần
  // giới hạn số dòng, câu luôn hiện đủ.
  return (
    <div
      aria-label="Lời Chúa hôm nay"
      className={`border-t border-amber-200/60 bg-gradient-to-r from-amber-50/80 via-yellow-50/90 to-amber-50/80 px-4 py-2 lg:hidden ${className}`}
    >
      <p
        className="mx-auto max-w-2xl text-balance bg-clip-text text-center text-[15px] font-bold italic leading-snug text-transparent sm:text-base"
        style={{ ...GLOW, backgroundImage: GOLD_GRADIENT }}
      >
        <Quote side="open" />
        {verse.text}
        <Quote side="close" />
      </p>
      <p className="mt-0.5 text-center text-[11px] font-bold text-amber-700">{verse.ref}</p>
    </div>
  );
}
