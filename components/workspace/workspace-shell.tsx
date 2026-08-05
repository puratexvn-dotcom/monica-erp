'use client';

import Link from 'next/link';
import { MessagesSquare, PieChart, Sparkles, FileText, type LucideIcon } from 'lucide-react';

import type { WorkItem } from '@/lib/mos/workspace/work-item';
import { WorkInbox, KpiStrip, QuickActions, BlockChoDuLieu, type KpiItem, type QuickAction } from './blocks';
import { MODULE_IDENTITY, STATUS, type ModuleKey } from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';

// ============================================================================
// KHUNG WORKSPACE — MỘT BỐ CỤC, MỌI PHÂN HỆ DÙNG CHUNG
//
// ═══ VÌ SAO PHẢI CÓ KHUNG DÙNG CHUNG ═══════════════════════════════════
// Mười một Workspace tự dựng bố cục riêng ⇒ mười một cách trả lời câu *"hôm
// nay tôi cần làm gì?"*, và người kiêm nhiệm hai bộ phận phải **học lại từ
// đầu** ở phân hệ thứ hai. Trí nhớ cơ bắp là thứ đắt nhất để xây lại.
//
// ⚠️ Khung này **⛔ KHÔNG được dựng khi ⛔ chưa có màn hình nào dùng nó.** Một
// khung ⛔ không ai render là **dead code** — đúng khuôn `TD-42` *(bốn bảng
// RBAC trông đầy thẩm quyền mà ⛔ không điều khiển gì)*. Vì vậy nó ra đời
// **cùng lượt** với `/qa`, ⛔ không sớm hơn một lượt nào.
//
// ═══ THỨ TỰ KHỐI — Board `UI_UX_STANDARDS §9` ══════════════════════════
//   Đầu trang → VIỆC HÔM NAY → KPI → Việc làm nhanh → dữ liệu → khối chờ
//   → dải Dịch vụ toàn cục
//
// 🔑 **VIỆC đứng trước SỐ.** Người vận hành mở Workspace để **làm**, ⛔ không
//    để ngắm. KPI lên đầu biến nơi làm việc thành bảng báo cáo cho cấp trên —
//    và người vận hành lại phải **hỏi** mới biết làm gì, đúng thứ triết lý
//    MONICA ONE muốn xoá.
// ============================================================================

/** Bốn Dịch vụ toàn cục, đúng thứ tự Board nêu. Cả bốn hiện là `COMING_SOON`
 *  ở `home-modules.ts` — dải này vì vậy là **lối vào đã đặt sẵn**, ⛔ không
 *  phải tính năng đang chạy. Nó ⛔ **không mở Module mới**. */
const DICH_VU: ReadonlyArray<{ id: string; labelKey: DictionaryKey; icon: LucideIcon; key: ModuleKey }> = [
  { id: 'chat', labelKey: 'workspace.svc.chat', icon: MessagesSquare, key: 'communication' },
  { id: 'report', labelKey: 'workspace.svc.report', icon: PieChart, key: 'reporting' },
  { id: 'ai', labelKey: 'workspace.svc.ai', icon: Sparkles, key: 'ai' },
  { id: 'guide', labelKey: 'workspace.svc.guide', icon: FileText, key: 'documents' },
];

export interface WorkspaceShellProps {
  /** Khoá màu — mọi sắc nhận diện của Workspace tra từ đây, ⛔ không viết thẳng. */
  moduleKey: ModuleKey;
  /** Tên hiến định — **⛔ KHÔNG dịch** *(§45.3)*. */
  tenModule: string;
  /** Khoá i18n câu mô tả dưới tiêu đề. */
  moTaKey: DictionaryKey;
  viec: readonly WorkItem[];
  kpi: readonly KpiItem[];
  hanhDongNhanh: readonly QuickAction[];
  /**
   * Lỗi đọc dữ liệu từ Command Center. `null`/bỏ trống = đọc được.
   *
   * ⚠️ **Phải hiện ra, ⛔ không được nuốt.** Màn hình rỗng vì *"⛔ không có
   * việc nào"* và màn hình rỗng vì *"⛔ không đọc được CSDL"* trông **y hệt
   * nhau** — và chỉ **một** trong hai là tin tốt.
   */
  loi?: string | null;
  /** Bảng biểu, biểu đồ — phần riêng của từng phân hệ. */
  children: React.ReactNode;
}

export default function WorkspaceShell({
  moduleKey, tenModule, moTaKey, viec, kpi, loi, hanhDongNhanh, children,
}: WorkspaceShellProps) {
  const { t } = useLanguage();
  const mau = MODULE_IDENTITY[moduleKey];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* ─── ĐẦU TRANG ────────────────────────────────────────────────── */}
      <header className="mb-8">
        <p className={`${TYPE.overline} ${mau.primary}`}>{t('workspace.eyebrow')}</p>
        {/* Tên Module ⛔ KHÔNG đi qua `t()` — từ vựng hiến định (§45.3), và
            phép kiểm ⑪ cưỡng chế điều đó. */}
        <h1 className={`${TYPE.pageTitle} mt-1 text-slate-900`}>{tenModule}</h1>
        <p className={`${TYPE.body} mt-1.5 text-slate-500`}>{t(moTaKey)}</p>
      </header>

      {/* ⚠️ Băng lỗi đứng TRƯỚC mọi khối dữ liệu. Đặt nó ở cuối trang thì
          người dùng đọc xong bốn số 0 rồi mới biết là **⛔ chưa đọc được** —
          và tới lúc đó họ đã tin vào bốn số đó rồi. */}
      {loi && (
        <p
          role="alert"
          className={`${TYPE.bodySm} ${STATUS.critical.chip} mb-6 rounded-xl px-4 py-3 ring-1`}
        >
          {t('workspace.loadError')} <span className="font-mono">{loi}</span>
        </p>
      )}

      <WorkInbox viec={viec} moduleKey={moduleKey} />
      <KpiStrip kpi={kpi} />
      <QuickActions hanhDong={hanhDongNhanh} moduleKey={moduleKey} />

      {children}

      {/* ─── KHỐI ĐÃ THIẾT KẾ, ⛔ CHƯA CÓ DỮ LIỆU ───────────────────────
          Ba khối này cần bảng ⛔ chưa tồn tại, và `SECURITY FREEZE` đang chặn
          migration. Hiện chúng ra kèm **lý do thật** thay vì giấu đi hoặc bịa
          số — Playbook Điều XX: *"⛔ Không Mock"*. */}
      <BlockChoDuLieu tieuDeKey="workspace.calendar" lyDoKey="workspace.needsData" />
      <BlockChoDuLieu tieuDeKey="workspace.alerts" lyDoKey="workspace.needsData" />
      <BlockChoDuLieu tieuDeKey="workspace.recent" lyDoKey="workspace.needsData" />

      {/* ─── DẢI DỊCH VỤ TOÀN CỤC ──────────────────────────────────────
          ⚠️ Đặt **cuối cùng**, và đó là chủ ý. Bốn dịch vụ này phục vụ **mọi**
          Workspace nên chúng ⛔ không được tranh chỗ với việc của phân hệ. Khi
          `Bottom Navigation` mở ra, dải này là lối vào **thứ hai** — ⛔ không
          phải lối duy nhất. */}
      <section aria-label={t('workspace.globalServices')} className="mt-10 border-t border-slate-200/70 pt-6">
        <h2 className={`${TYPE.overline} mb-3 text-slate-500`}>{t('workspace.globalServices')}</h2>
        <div className="flex flex-wrap gap-2.5">
          {DICH_VU.map(({ id, labelKey, icon: Icon, key }) => (
            // ⚠️ `<button disabled>`, ⛔ KHÔNG `<div>` mờ. Người đi bằng bàn
            // phím và trình đọc màn hình phải **nghe được rằng nó bị khoá** —
            // cùng lý do đã áp cho ô `COMING_SOON` ở trang chủ.
            <button
              key={id}
              type="button"
              disabled
              aria-disabled="true"
              title={t('home.comingSoonHint')}
              className={`${TYPE.label} inline-flex min-h-[44px] cursor-not-allowed items-center gap-2 rounded-xl bg-white/60 px-4 text-slate-400 shadow-sm ring-1 ring-slate-200/70`}
            >
              <Icon className={`h-4 w-4 ${MODULE_IDENTITY[key].secondary} opacity-60`} aria-hidden="true" />
              {t(labelKey)}
              <span className={`${TYPE.overline} ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-500`}>
                {t('home.comingSoon')}
              </span>
            </button>
          ))}
        </div>
        <p className={`${TYPE.caption} mt-3 text-slate-400`}>{t('workspace.globalServicesHint')}</p>
      </section>

      {/* Lối về trang chủ — `EP-2`: nút `Home` phải về được Launcher từ **mọi**
          Workspace, nếu ⛔ không trang chủ thôi là *"điểm vào"* và chỉ còn là
          *"trang đăng nhập"*. */}
      <div className="mt-8">
        <Link
          href="/"
          className={`${TYPE.label} inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`}
        >
          ← {t('workspace.backHome')}
        </Link>
      </div>
    </div>
  );
}
