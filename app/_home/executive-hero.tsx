import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { ROLE_LABEL } from '@/lib/rbac';
import HeaderVerse from '@/components/header-verse';
import type { HomeMetrics } from '../home-metrics';

// ============================================================================
// EXECUTIVE HERO — NGỮ CẢNH BUỔI SÁNG, KHÔNG PHẢI BẢNG ĐIỀU KHIỂN
//
// ─── BỐN DÒNG, THEO ĐÚNG THỨ TỰ MỘT NGƯỜI ĐỌC KHI MỞ MÁY ────────────────
//   ① Business Operating System        tôi đang ở trong cái gì
//   ② Chào buổi sáng, <vai trò>        hệ thống biết tôi là ai
//   ③ Hôm nay là Thứ Hai, 03 tháng 8   hôm nay là ngày nào
//   ④ 3 việc cần chú ý hôm nay         tôi phải để mắt tới gì
//   ⑤ Lời Chúa                          một nhịp lặng trước khi vào việc
//
// ─── ⚠️ RANH GIỚI VỚI §13.1 · "The Homepage is not a dashboard" ──────────
// Dòng ④ là MỘT CÂU, không phải một dãy widget. Cố ý thiếu: không biểu đồ,
// không xu hướng, không so kỳ trước, không doanh thu, không KPI. Ba con số chi
// tiết nằm ở ba mảnh nhỏ bên phải, mỗi mảnh là một LỐI ĐI thẳng tới chỗ xử lý
// nó — không phải một ô số để ngắm.
//
// Ranh giới phân định: khối này trả lời *"sáng nay tôi đi đâu trước?"* — đúng
// câu hỏi §13.1 giao cho trang chủ. Nó KHÔNG trả lời *"tình hình thế nào?"*;
// câu đó thuộc về Executive Center.
//
// ─── VÌ SAO LỜI CHÚA CHUYỂN TỪ THANH ĐẦU TRANG XUỐNG ĐÂY ────────────────
// Câu Lời Chúa KHÔNG bị gỡ — nó được trả về đúng chỗ của nó. Nằm trong thanh
// điều hướng, nó là một mẩu chữ chen giữa logo và chuông thông báo. Nằm ở đây,
// nó khép lại phần ngữ cảnh buổi sáng: đọc xong "hôm nay có 3 việc cần chú ý"
// rồi mới tới câu Kinh Thánh — đó là một NHỊP, không phải một mẩu trang trí.
//
// Nguồn không đổi (`todaysVerse` qua `HeaderVerse`), câu không đổi, cách xoay
// theo ngày không đổi. `TopNavbar` nhận `showVerse={false}` để không hiện hai
// lần trên cùng một màn hình — hai lần thì cả hai đều mất giá trị.
//
// ─── SỐ LIỆU THẬT, TRẠNG THÁI RỖNG TRUNG THỰC ────────────────────────────
// Ba tín hiệu lấy từ `getHomeMetrics()` — dữ liệu thật trong CSDL:
//   • phần việc đang chạy mà CHƯA gửi báo cáo ngày   (Playbook XXX mục 7)
//   • biên bản QA có hàng lỗi trong 7 ngày
//   • lô hàng có ETD đúng hôm nay
//
// `null` = **chưa đọc được**, KHÔNG phải 0. Hai chuyện khác hẳn nhau trong nhà
// máy, nên `null` hiện dấu "—" chứ không bao giờ hiện số không.
// ============================================================================

interface Signal {
  key: string;
  short: string;
  label: string;
  count: number | null;
  href: string;
  /**
   * Màu chấm khi CÓ việc cần xử lý. Không có việc thì tất cả về xám.
   *
   * ⚠️ CHUỖI NGUYÊN VẸN. Không ghép `s.hot.replace('text-','bg-')` — Tailwind
   * quét mã nguồn bằng biểu thức chính quy, nó không chạy JavaScript. Class
   * ghép lúc chạy sẽ có mặt ở dev (nhờ cache) và biến mất sạch ở production.
   */
  dot: string;
}

function greeting(hour: number): string {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

/**
 * Một câu về khối lượng việc cần chú ý.
 *
 * `null` ở cả ba tín hiệu ⇒ nói thẳng là chưa đọc được, KHÔNG gộp thành 0.
 */
function attentionLine(m: HomeMetrics): string {
  const { reportMissing, qaDefect, shipToday } = m.ops;
  const known = [reportMissing, qaDefect, shipToday].filter(
    (n): n is number => n !== null,
  );
  if (known.length === 0) return 'Chưa đọc được số liệu vận hành hôm nay';
  const total = known.reduce((a, b) => a + b, 0);
  if (total === 0) return 'Không có việc nào cần chú ý hôm nay';
  return `${total} việc cần chú ý hôm nay`;
}

export default function ExecutiveHero({
  metrics,
  hour,
  today,
}: {
  metrics: HomeMetrics;
  /** Giờ VN — truyền vào từ trang để component giữ được tính thuần */
  hour: number;
  /** Ngày VN đã định dạng sẵn */
  today: string;
}) {
  const signed = metrics.status === 'ok';
  const who = metrics.role ? ROLE_LABEL[metrics.role] : null;

  const signals: Signal[] = [
    {
      key: 'report', short: 'Báo cáo', label: 'Phần việc chưa gửi báo cáo ngày',
      count: metrics.ops.reportMissing, href: '/subcon', dot: 'bg-amber-500',
    },
    {
      key: 'qa', short: 'Chất lượng', label: 'Biên bản QA có hàng lỗi trong 7 ngày',
      count: metrics.ops.qaDefect, href: '/qa', dot: 'bg-rose-500',
    },
    {
      key: 'ship', short: 'Xuất hàng', label: 'Lô hàng có ETD hôm nay',
      count: metrics.ops.shipToday, href: '/xuat-hang', dot: 'bg-cyan-500',
    },
  ];

  return (
    <section aria-label="Ngữ cảnh buổi sáng" className="mb-14 sm:mb-20">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-14">
        {/* ── Ngữ cảnh ─────────────────────────────────────────────────── */}
        <div className="min-w-0 lg:max-w-2xl">
          {/* ⚠️ slate-600 chứ không phải slate-400. Đo trên nền #F6F7F9:
              slate-400 chỉ đạt 2,39:1 — dưới ngưỡng WCAG AA (4,5:1) cho chữ
              nhỏ. slate-500 đạt 4,44 (vẫn thiếu), slate-600 đạt 7,07. Chữ mờ
              trông "tinh tế" trên màn hình thiết kế, và biến mất trên màn hình
              xưởng dưới ánh đèn cao áp. */}
          <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-slate-600">
            Business Operating System
          </p>

          {/* leading 1.05 + tracking âm: ở cỡ chữ lớn, khoảng cách dòng và chữ
              mặc định trông rời rạc. Bóp lại là thứ khiến một tiêu đề lớn đọc
              ra "được sắp chữ" thay vì "được phóng to". */}
          <h1 className="mt-3 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-[42px]">
            {greeting(hour)}
            {/* Chữ lớn chỉ cần 3:1, nhưng slate-300 mới đạt 1,39 — vẫn hỏng.
                slate-500 (4,44) nhạt hơn hẳn slate-900 nên thứ bậc vẫn rõ. */}
            {who && <span className="text-slate-500">, {who}</span>}
          </h1>

          <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600 sm:text-[15px]">
            Hôm nay là {today}.
            {signed && (
              <>
                {' · '}
                <span className="font-semibold text-slate-700">{attentionLine(metrics)}</span>
              </>
            )}
          </p>

          {!signed && (
            <Link
              href="/login"
              className="group mt-5 inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl bg-white px-4 text-[13px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Đăng nhập để xem tình hình vận hành
              <ArrowRight
                className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          )}

          {/* ── Lời Chúa — nhịp lặng khép lại phần ngữ cảnh ─────────────── */}
          <HeaderVerse variant="hero" className="mt-8" />
        </div>

        {/* ── Ba tín hiệu cần chú ý ────────────────────────────────────── */}
        {signed && (
          <div className="grid shrink-0 grid-cols-3 gap-2.5 lg:w-auto">
            {signals.map((s) => {
              // So thẳng với null thay vì đi qua biến boolean: TypeScript không
              // thu hẹp kiểu xuyên qua biến trung gian.
              const chuaDo = s.count === null;
              const hot = s.count !== null && s.count > 0;
              return (
                <Link
                  key={s.key}
                  href={s.href}
                  title={s.label}
                  className="group flex min-h-[5.25rem] flex-col justify-between rounded-[1rem] bg-white px-3.5 py-3 shadow-[0_0_0_1px_rgba(16,24,40,0.04),0_1px_2px_-1px_rgba(16,24,40,0.05)] transition-colors hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:min-w-[8.5rem] sm:px-4"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`h-[5px] w-[5px] shrink-0 rounded-full ${
                        hot ? s.dot : 'bg-slate-200'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
                      {s.short}
                    </span>
                  </span>
                  <span
                    className={`text-[28px] font-bold leading-none tabular-nums tracking-[-0.03em] ${
                      chuaDo || !hot ? 'text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {/* "—" khi CHƯA ĐỌC ĐƯỢC. Không bao giờ thay bằng 0. */}
                    {chuaDo ? '—' : s.count}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
