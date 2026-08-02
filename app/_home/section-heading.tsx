// ============================================================================
// TIÊU ĐỀ KHỐI — ba phân loại hiến định, ba mức nhấn giảm dần
//
// ─── VÌ SAO LẦN NÀY CÓ TIÊU ĐỀ NHÓM, TRONG KHI TRƯỚC ĐÓ ĐÃ BỎ ────────────
// Bản trước bỏ tiêu đề nhóm vì nhóm hồi đó do ta TỰ NGHĨ RA
// (CORE/BUSINESS/COMMERCIAL...) — người mở lần đầu phải đọc năm chướng ngại
// trước khi thấy thứ cần bấm.
//
// Ba khối lần này KHÔNG do ta nghĩ ra: chúng là ba phân loại của Hiến pháp
// (§16.2 · §17 · §34), và §17.3 CẤM trộn chúng vào nhau. Tiêu đề ở đây không
// phải để sắp xếp cho gọn — nó là ranh giới hiến định hiện thành hình.
//
// ─── BA MỨC NHẤN, KHÁC NHAU Ở BA THUỘC TÍNH ─────────────────────────────
//   primary    18px · 700 · slate-900 · có chữ dẫn phía trên · đường kẻ đậm
//   secondary  14px · 700 · slate-700 · không chữ dẫn        · đường kẻ nhạt
//   tertiary   11px · 700 · slate-400 · CHỮ HOA giãn rộng    · không đường kẻ
//
// Mức thứ ba cố ý đổi sang chữ hoa nhỏ thay vì chỉ thu nhỏ: hạ tầng phải đọc
// ra là NHÃN HỆ THỐNG, không phải một tiêu đề nghiệp vụ bị làm bé lại.
// ============================================================================

export type HeadingLevel = 'primary' | 'secondary' | 'tertiary';

export default function SectionHeading({
  eyebrow,
  title,
  note,
  count,
  level,
}: {
  /** Chữ dẫn phía trên — chỉ mức `primary` dùng tới */
  eyebrow?: string;
  title: string;
  /** Một câu giải thích khối này là gì. Không phải khẩu hiệu. */
  note: string;
  count: number;
  level: HeadingLevel;
}) {
  if (level === 'tertiary') {
    return (
      <div className="mb-3 flex items-center gap-2.5">
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-600">
          {title}
        </h2>
        <span className="text-[10.5px] font-semibold tabular-nums text-slate-500">{count}</span>
        <span className="h-px flex-1 bg-slate-200/70" aria-hidden="true" />
      </div>
    );
  }

  const primary = level === 'primary';

  return (
    <div className={primary ? 'mb-6 sm:mb-7' : 'mb-4 sm:mb-5'}>
      {/* ⚠️ slate-600 chứ không phải slate-400 — xem ghi chú độ tương phản ở
          app/_home/executive-hero.tsx. Nền #F6F7F9 khắt khe hơn nền trắng. */}
      {eyebrow && (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">
          {eyebrow}
        </p>
      )}
      <div className="flex items-baseline gap-3">
        <h2
          className={
            primary
              ? 'text-[18px] font-bold tracking-[-0.02em] text-slate-900 sm:text-[20px]'
              : 'text-[14px] font-bold tracking-[-0.01em] text-slate-700'
          }
        >
          {title}
        </h2>
        {/* Số đếm trong viên thuốc chìm: nó là siêu dữ liệu, không phải một
            phần của tiêu đề. Để trần cạnh chữ thì mắt đọc liền thành một cụm. */}
        <span
          className={`rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-slate-600 ${
            primary ? '' : 'scale-95'
          }`}
        >
          {count}
        </span>
        {/* Đường kẻ mảnh chạy hết phần còn lại: chia khối bằng NHỊP chứ không
            bằng khung. Khung viền quanh mỗi khối sẽ thành ba cái hộp lồng nhau. */}
        <span
          className={`h-px min-w-4 flex-1 ${primary ? 'bg-slate-200' : 'bg-slate-200/70'}`}
          aria-hidden="true"
        />
        <span className="hidden text-[11px] font-medium text-slate-500 sm:block">{note}</span>
      </div>
    </div>
  );
}
