import { BookOpen } from 'lucide-react';

// ============================================================================
// LỜI CHÚA HÔM NAY
//
// ─── VÌ SAO KHÔNG DÙNG Math.random() ─────────────────────────────────────
// Bản gốc random trong useEffect nên F5 ba lần ra ba câu khác nhau, trong khi
// chú thích lại ghi "mỗi ngày". Ở đây lấy chỉ số TỪ CHÍNH NGÀY: cùng một ngày
// thì mọi người, mọi thiết bị, mọi lần tải trang đều thấy đúng một câu — đó
// mới là "Lời Chúa hôm nay" theo nghĩa dùng được trong nhà máy.
//
// ─── VÌ SAO LÀ SERVER COMPONENT ──────────────────────────────────────────
// Nhờ tính theo ngày nên không cần state, không cần useEffect, không cần
// 'use client'. Giá trị server tính ra trùng khớp client => không hydration
// mismatch, và không thêm một byte JavaScript nào vào bundle.
//
// Ngày lấy theo Asia/Ho_Chi_Minh (UTC+7), không theo giờ máy chủ: Vercel chạy
// UTC nên nếu không quy đổi thì câu Lời Chúa sẽ đổi vào 7 giờ sáng giờ Việt Nam
// chứ không phải lúc nửa đêm.
// ============================================================================

interface Verse {
  text: string;
  ref: string;
}

const VERSES: Verse[] = [
  { text: 'Phúc thay ai có tâm hồn nghèo khó, vì Nước Trời là của họ.', ref: 'Mt 5,3' },
  { text: 'Thầy để lại bình an cho anh em, Thầy ban cho anh em bình an của Thầy.', ref: 'Ga 14,27' },
  {
    text: 'Tất cả những gì anh em muốn người ta làm cho mình, thì chính anh em cũng hãy làm cho người ta.',
    ref: 'Mt 7,12',
  },
  { text: 'Anh em hãy yêu thương nhau như Thầy đã yêu thương anh em.', ref: 'Ga 15,12' },
  { text: 'Ai trung tín trong việc rất nhỏ, thì cũng trung tín trong việc lớn.', ref: 'Lc 16,10' },
  { text: 'Tất cả những gì anh em làm, hãy làm hết lòng như làm cho Chúa.', ref: 'Cl 3,23' },
  { text: 'Anh em hãy mang lấy gánh nặng cho nhau, như vậy là anh em chu toàn luật Đức Ki-tô.', ref: 'Gl 6,2' },
];

/** Mốc ngày theo giờ Việt Nam, dạng YYYY-MM-DD */
function vnDateKey(): { key: string; label: string } {
  const vn = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const key = vn.toISOString().slice(0, 10);
  const label = vn.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC', // đã cộng bù 7 giờ ở trên, không cộng thêm lần nữa
  });
  return { key, label };
}

/** Chỉ số ổn định theo ngày: cùng ngày -> cùng câu, đổi ngày -> đổi câu */
function verseOfDay(dateKey: string): Verse {
  const n = Number(dateKey.replace(/-/g, ''));
  return VERSES[n % VERSES.length];
}

export default function DailyVerses({ className = '' }: { className?: string }) {
  const { key, label } = vnDateKey();
  const verse = verseOfDay(key);

  return (
    <section
      aria-label="Lời Chúa hôm nay"
      className={`overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:gap-6 sm:p-8">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-200">
          <BookOpen className="h-7 w-7" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-700">
              Lời Chúa hôm nay
            </h2>
            <span className="text-xs font-semibold capitalize text-slate-400">{label}</span>
          </div>

          {/* blockquote + cite là thẻ đúng ngữ nghĩa cho câu dẫn có nguồn */}
          <blockquote className="text-lg font-medium italic leading-relaxed text-slate-800 sm:text-xl">
            “{verse.text}”
          </blockquote>

          <cite className="mt-3 block text-sm font-bold not-italic text-indigo-600">
            — {verse.ref}
          </cite>
        </div>
      </div>
    </section>
  );
}
