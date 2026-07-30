// ============================================================================
// LỜI CHÚA HÔM NAY — Tin Mừng, đổi mỗi ngày lúc 04:00 giờ Việt Nam
//
// ─── VÌ SAO KHÔNG DÙNG Math.random() ─────────────────────────────────────
// Random thì F5 ba lần ra ba câu khác nhau. Ở đây chỉ số lấy TỪ CHÍNH NGÀY:
// cùng một ngày thì mọi người, mọi thiết bị, mọi lần tải trang đều thấy đúng
// một câu — đó mới là "Lời Chúa hôm nay" theo nghĩa dùng được.
//
// ─── MỐC ĐỔI CÂU LÀ 04:00, KHÔNG PHẢI NỬA ĐÊM ────────────────────────────
// Ca sản xuất ở nhà máy thường bắt đầu từ 6 giờ sáng, còn tổ trực đêm làm qua
// 0 giờ. Nếu đổi câu vào nửa đêm thì người đang trong ca đêm tự nhiên thấy câu
// khác giữa buổi làm. Lấy mốc 04:00 để trọn một ca đêm vẫn giữ nguyên một câu.
//
// Cách tính: cộng bù 7 giờ (về giờ Việt Nam) rồi TRỪ 4 giờ, tức cộng 3 giờ so
// với UTC, sau đó cắt lấy phần ngày. Nhờ vậy 03:59 giờ Việt Nam vẫn thuộc
// "ngày hôm qua", đúng 04:00 mới sang câu mới.
//
// ─── VÌ SAO KHÔNG DÙNG font-serif ────────────────────────────────────────
// Bản trước dùng font-serif, tức ui-serif/Georgia/Times New Roman. Mấy font đó
// thiếu nhiều tổ hợp dấu tiếng Việt (â + huyền, ô + ngã...), nên trình duyệt
// phải ghép chữ từ font dự phòng — chữ như "tâm hồn" ra lệch chân, lệch dấu.
// Nay dùng font-sans để thừa hưởng Inter đã nạp qua next/font ở layout gốc:
// Inter phủ đầy đủ bộ chữ Việt, mọi dấu nằm đúng vị trí.
//
// ─── VÌ SAO LÀ SERVER COMPONENT ──────────────────────────────────────────
// Nhờ tính theo ngày nên không cần state, không cần useEffect, không cần
// 'use client'. Giá trị server tính ra trùng khớp client => KHÔNG hydration
// mismatch, và không thêm một byte JavaScript nào vào bundle.
// ============================================================================

interface Verse {
  text: string;
  ref: string;
}

/** Trích Tin Mừng theo bốn Phúc Âm. Thêm/bớt bao nhiêu câu cũng chạy đúng,
 *  vì chỉ số lấy theo phép chia lấy dư trên độ dài mảng. */
const VERSES: Verse[] = [
  { text: 'Phúc thay ai có tâm hồn nghèo khó, vì Nước Trời là của họ.', ref: 'Mt 5,3' },
  { text: 'Thầy để lại bình an cho anh em, Thầy ban cho anh em bình an của Thầy.', ref: 'Ga 14,27' },
  {
    text: 'Tất cả những gì anh em muốn người ta làm cho mình, thì chính anh em cũng hãy làm cho người ta.',
    ref: 'Mt 7,12',
  },
  { text: 'Anh em hãy yêu thương nhau như Thầy đã yêu thương anh em.', ref: 'Ga 15,12' },
  { text: 'Ai trung tín trong việc rất nhỏ, thì cũng trung tín trong việc lớn.', ref: 'Lc 16,10' },
  { text: 'Anh em hãy mang lấy gánh nặng cho nhau, như vậy là anh em chu toàn luật Đức Ki-tô.', ref: 'Gl 6,2' },
  { text: 'Hãy đến cùng Thầy, hỡi tất cả những ai đang vất vả mang gánh nặng nề, Thầy sẽ cho nghỉ ngơi bồi dưỡng.', ref: 'Mt 11,28' },
  { text: 'Anh em là muối cho đời, là ánh sáng cho thế gian.', ref: 'Mt 5,13-14' },
  { text: 'Ai muốn làm lớn giữa anh em thì phải làm người phục vụ anh em.', ref: 'Mt 20,26' },
  { text: 'Đừng lo lắng về ngày mai, ngày mai cứ để ngày mai lo.', ref: 'Mt 6,34' },
  { text: 'Sự thật sẽ giải phóng các ông.', ref: 'Ga 8,32' },
  { text: 'Cứ xin thì sẽ được, cứ tìm thì sẽ thấy, cứ gõ cửa thì sẽ mở cho.', ref: 'Mt 7,7' },
  { text: 'Không có tình thương nào cao cả hơn tình thương của người đã hy sinh tính mạng vì bạn hữu của mình.', ref: 'Ga 15,13' },
  { text: 'Thầy là con đường, là sự thật và là sự sống.', ref: 'Ga 14,6' },
];

/** Giờ Việt Nam (UTC+7), lùi thêm 4 giờ để mốc đổi câu là 04:00 thay vì 00:00 */
const VERSE_DAY_OFFSET_MS = (7 - 4) * 60 * 60 * 1000;

/**
 * Số thứ tự ngày (tính từ mốc epoch), đã dịch để ngày mới bắt đầu lúc 04:00.
 *
 * ⚠️ KHÔNG dùng số YYYYMMDD rồi lấy modulo. Cách đó SAI ở ranh giới tháng:
 * từ 20260731 sang 20260801 con số nhảy 70, mà 70 chia hết cho 14 (số câu hiện
 * có) nên ngày 1 tháng 8 lại ra đúng câu của ngày 31 tháng 7. Đếm theo số ngày
 * thì mỗi ngày tăng đúng 1, bảo đảm hai ngày liền nhau luôn khác câu bất kể
 * mảng có bao nhiêu câu.
 */
function verseDayNumber(): number {
  return Math.floor((Date.now() + VERSE_DAY_OFFSET_MS) / 86_400_000);
}

/** Ngày thật theo giờ Việt Nam, để hiển thị cho người đọc */
function vnDateLabel(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC', // đã cộng bù 7 giờ ở trên, không cộng thêm lần nữa
  });
}

function verseOfDay(dayNumber: number): Verse {
  // Phép % của JS giữ dấu, mà dayNumber luôn dương ở đây nên không cần chuẩn hoá
  return VERSES[dayNumber % VERSES.length];
}

export default function DailyVerses({ className = '' }: { className?: string }) {
  const verse = verseOfDay(verseDayNumber());
  const label = vnDateLabel();

  return (
    <section aria-label="Lời Chúa hôm nay" className={`mx-auto max-w-3xl text-center ${className}`}>
      {/* blockquote + cite là thẻ đúng ngữ nghĩa cho câu dẫn có nguồn.
          Dấu ngoặc kép để ngoài blockquote và aria-hidden, nếu không trình đọc
          màn hình sẽ đọc thành "dấu ngoặc kép" giữa câu Kinh Thánh. */}
      <blockquote className="relative px-6 sm:px-10">
        <span
          aria-hidden="true"
          className="absolute -left-1 -top-4 select-none font-sans text-6xl leading-none text-blue-200 sm:-left-2 sm:text-7xl"
        >
          &ldquo;
        </span>

        <p className="font-sans text-xl font-medium italic leading-relaxed text-slate-800 sm:text-2xl sm:leading-relaxed lg:text-[1.75rem]">
          {verse.text}
        </p>

        <span
          aria-hidden="true"
          className="absolute -bottom-8 -right-1 select-none font-sans text-6xl leading-none text-blue-200 sm:-right-2 sm:text-7xl"
        >
          &rdquo;
        </span>
      </blockquote>

      <cite className="mt-5 block text-sm font-bold not-italic tracking-wide text-blue-700 sm:text-base">
        — {verse.ref} —
      </cite>

      <p className="mt-1.5 text-xs font-medium capitalize text-slate-400">{label}</p>
    </section>
  );
}
