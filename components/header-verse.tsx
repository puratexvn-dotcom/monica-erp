import { todaysVerse } from '@/components/daily-verses';

// ============================================================================
// LỜI CHÚA — DẢI GỌN TRÊN THANH ĐẦU TRANG
//
// ─── VÌ SAO DÙNG CHUNG NGUỒN VỚI KHỐI LỚN ─────────────────────────────────
// Cả hai lấy từ todaysVerse() trong components/daily-verses.tsx. Hai chỗ hiện
// hai câu khác nhau trong cùng một ngày thì còn tệ hơn là chỉ có một chỗ.
//
// ─── VÌ SAO LÀ SERVER COMPONENT ───────────────────────────────────────────
// Câu được chọn theo NGÀY chứ không theo ngẫu nhiên, nên máy chủ và trình duyệt
// luôn tính ra cùng một kết quả — không lệch hydrat hoá, không thêm một byte
// JavaScript nào vào gói.
//
// ─── VÌ SAO CẮT CHỮ THAY VÌ XUỐNG DÒNG ────────────────────────────────────
// Thanh đầu trang cao cố định 5rem. Cho câu xuống dòng sẽ đẩy logo và các nút
// lệch hàng ở mọi lần câu dài hơn bình thường. truncate giữ thanh luôn một
// chiều cao; câu đầy đủ vẫn nằm nguyên ở khối lớn giữa trang.
//
// ─── TƯƠNG PHẢN ĐÃ ĐO ─────────────────────────────────────────────────────
// amber-800 (#92400e) trên nền amber-50 (#fffbeb) = 6,84:1 — vượt ngưỡng
// 4,5:1 của WCAG AA. Dải chuyển sắc chỉ dùng cho chữ ĐẬM cỡ lớn, còn nhãn nhỏ
// giữ màu đặc để không tụt tương phản.
// ============================================================================

/** Dải chuyển sắc vàng gold → hổ phách đậm. Đặt thành hằng để chữ và viền
 *  dùng cùng một hệ màu, đổi một chỗ là đổi cả cụm. */
const GOLD_GRADIENT = 'linear-gradient(95deg, #b45309 0%, #d97706 35%, #f59e0b 65%, #b45309 100%)';

export default function HeaderVerse({ className = '' }: { className?: string }) {
  const verse = todaysVerse();

  return (
    <div
      aria-label="Lời Chúa hôm nay"
      className={`min-w-0 flex-1 rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 px-3 py-1.5 shadow-sm ${className}`}
    >
      <p className="flex items-baseline gap-1.5">
        <span
          aria-hidden="true"
          className="shrink-0 select-none text-base font-black leading-none text-amber-500"
        >
          &ldquo;
        </span>
        <span
          className="min-w-0 flex-1 truncate bg-clip-text text-[13px] font-bold italic leading-snug text-transparent sm:text-sm"
          style={{ backgroundImage: GOLD_GRADIENT }}
          title={`${verse.text} — ${verse.ref}`}
        >
          {verse.text}
        </span>
      </p>
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-amber-800">
        Lời Chúa hôm nay · {verse.ref}
      </p>
    </div>
  );
}
