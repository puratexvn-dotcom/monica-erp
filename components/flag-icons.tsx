// ============================================================================
// QUỐC KỲ DẠNG SVG NỘI TUYẾN
//
// ─── VÌ SAO KHÔNG DÙNG EMOJI 🇻🇳 🇬🇧 🇨🇳 ────────────────────────────────────
// Emoji quốc kỳ được ghép từ hai ký tự mã vùng. Trình duyệt chỉ vẽ ra lá cờ
// nếu PHÔNG HỆ ĐIỀU HÀNH có sẵn hình đó — macOS, iOS, Android đều có, riêng
// WINDOWS THÌ KHÔNG. Trên Windows nó rơi về hiển thị hai chữ cái "VN", "GB",
// "CN", đúng hiện tượng đã thấy.
//
// Vì phần lớn máy trong nhà máy chạy Windows, dùng emoji nghĩa là đa số người
// dùng sẽ KHÔNG BAO GIỜ thấy lá cờ. SVG nội tuyến vẽ giống hệt nhau ở mọi hệ
// điều hành, không phải tải thêm tệp nào, và co giãn không vỡ nét.
//
// Kích thước 20×14 theo tỷ lệ 10:7 — gần với tỷ lệ thật của cả ba lá cờ.
// ============================================================================

const BASE = 'shrink-0 rounded-[2px] ring-1 ring-black/10';

/** Việt Nam — nền đỏ, sao vàng năm cánh ở giữa */
export function FlagVN({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={`${BASE} ${className}`} aria-hidden="true" focusable="false">
      <rect width="30" height="20" fill="#da251d" />
      <path
        fill="#ff0"
        d="M15 4.4l1.47 4.52h4.75l-3.84 2.8 1.46 4.52L15 13.43l-3.84 2.81 1.46-4.52-3.84-2.8h4.75z"
      />
    </svg>
  );
}

/** Anh Quốc — Union Jack. Vẽ theo lớp: nền lam, chữ X trắng, chữ X đỏ,
 *  chữ thập trắng, chữ thập đỏ. Đúng thứ tự chồng lớp của lá cờ thật. */
export function FlagEN({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={`${BASE} ${className}`} aria-hidden="true" focusable="false">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0l60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0l60 40M60 0L0 40" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="13" />
      <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="8" />
    </svg>
  );
}

/** Trung Quốc — nền đỏ, một sao lớn và bốn sao nhỏ ở góc trên bên trái */
export function FlagCN({ className = '' }: { className?: string }) {
  const star = (cx: number, cy: number, r: number, rot: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (rot + i * 72 - 90) * (Math.PI / 180);
      const b = (rot + i * 72 - 90 + 36) * (Math.PI / 180);
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
      pts.push(`${cx + r * 0.382 * Math.cos(b)},${cy + r * 0.382 * Math.sin(b)}`);
    }
    return pts.join(' ');
  };
  return (
    <svg viewBox="0 0 30 20" className={`${BASE} ${className}`} aria-hidden="true" focusable="false">
      <rect width="30" height="20" fill="#de2910" />
      <polygon fill="#ffde00" points={star(5, 5, 3.2, 0)} />
      <polygon fill="#ffde00" points={star(10, 2, 1.1, 23)} />
      <polygon fill="#ffde00" points={star(12, 4.4, 1.1, 46)} />
      <polygon fill="#ffde00" points={star(12, 7.4, 1.1, 70)} />
      <polygon fill="#ffde00" points={star(10, 9.6, 1.1, 23)} />
    </svg>
  );
}
