'use client';

import { Inbox } from 'lucide-react';

import { TYPE } from '@/lib/design/typography';
import { GLASS } from '@/lib/design/tokens';
import { useLanguage } from '@/lib/i18n';

// ============================================================================
// WORK ZONE — VÙNG MỘT CỦA TRANG CHỦ · `UI-1.5`
//
// **ADR-017** *(→ Hiến pháp §13.3)*: trang chủ có **HAI vùng hiến định** —
// Work Zone *(mặc định mở khi đăng nhập)* + Business Operating System Launcher.
// Trước bản này chỉ có vùng hai; đây là vùng một.
//
// ─── 🔴 GIAI ĐOẠN 1 — BOARD DECISION `Q1` · 05/08/2026 ──────────────────
// *"Work Zone Phase 1 chỉ triển khai: Layout · Empty State · Skeleton ·
// Welcome. ⛔ Không chờ Work Inbox. ⛔ Không cần migration."*
//
// ⇒ Vùng này **⛔ CHƯA CÓ NGUỒN DỮ LIỆU**. Work Inbox *(EDD-05)* ⛔ chưa
// migration nào dựng.
//
// 🔑 **VÌ SAO ⛔ KHÔNG BÀY DỮ LIỆU MẪU.** Cám dỗ ở đây rất cụ thể: ba thẻ việc
// giả sẽ làm ảnh chụp màn hình đẹp hẳn. Nhưng một con số bịa trên trang chủ là
// thứ **⛔ không ai gỡ ra được** — nó sẽ đi vào bản demo, vào tài liệu bán hàng,
// rồi có người tin nó. Trạng thái rỗng **trung thực** kém hấp dẫn hơn và đúng.
//
// ─── ⚠️ MỤC ⑭ — VÙNG NÀY ⛔ KHÔNG ĐƯỢC TỰ TÍNH ─────────────────────────
// Khi Work Inbox có thật, vùng này **nhận số đã tính**, ⛔ không tự cộng. Phép
// kiểm ⑭ *(`G6`)* sẽ bắt ngay nếu ai đó viết `.reduce((s, x) => s + …)` ở đây.
// ============================================================================

/** Lời chào theo buổi — thuần trình bày, ⛔ không phải chỉ số nghiệp vụ.
 *
 *  ⚠️ Dùng giờ **của trình duyệt**, ⛔ không phải giờ máy chủ: lời chào phải
 *  khớp với đồng hồ trên tường của người đang nhìn. Đây là ngoại lệ có chủ ý
 *  với `lib/time.ts` — tệp đó là nguồn sự thật cho **dữ liệu nghiệp vụ**, còn
 *  đây là một câu chào. */
function khoaLoiChao(gio: number): 'workZone.greetingMorning' | 'workZone.greetingAfternoon' | 'workZone.greetingEvening' {
  if (gio < 12) return 'workZone.greetingMorning';
  if (gio < 18) return 'workZone.greetingAfternoon';
  return 'workZone.greetingEvening';
}

export default function WorkZone({
  ten,
  dangTai = false,
}: {
  /** Tên hiển thị — email hoặc tên người dùng. `null` khi ⛔ chưa đọc được. */
  ten: string | null;
  /** Bày khung xương thay vì trạng thái rỗng. */
  dangTai?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <section aria-label={t('workZone.title')} className="mx-auto mb-14 max-w-5xl sm:mb-20">
      {/* ── Lời chào ─────────────────────────────────────────────────── */}
      <p className={`${TYPE.overline} mb-1.5 text-slate-500`}>
        {t(khoaLoiChao(new Date().getHours()))}
        {ten ? `, ${ten}` : ''}
      </p>
      <h2 className={`${TYPE.sectionTitle} mb-5 text-slate-900`}>{t('workZone.title')}</h2>

      {dangTai ? (
        // ── Khung xương ────────────────────────────────────────────────
        // `aria-busy` + `sr-only`: người dùng trình đọc màn hình nghe được
        // "đang tải" thay vì im lặng trước ba khối xám vô nghĩa.
        <div
          aria-busy="true"
          className={`rounded-2xl border border-slate-200/70 p-6 ${GLASS}`}
        >
          <span className="sr-only">{t('workZone.loading')}</span>
          <div className="space-y-3" aria-hidden="true">
            <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200/80" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-slate-200/60" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200/50" />
          </div>
        </div>
      ) : (
        // ── Trạng thái rỗng TRUNG THỰC ─────────────────────────────────
        <div
          className={`flex flex-col items-center rounded-2xl border border-slate-200/70 px-6 py-10 text-center ${GLASS}`}
        >
          <span className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
          </span>
          <p className={`${TYPE.cardTitle} text-slate-700`}>{t('workZone.emptyTitle')}</p>
          <p className={`${TYPE.bodySm} mt-1.5 max-w-sm text-slate-500`}>
            {t('workZone.emptyHint')}
          </p>
        </div>
      )}
    </section>
  );
}
