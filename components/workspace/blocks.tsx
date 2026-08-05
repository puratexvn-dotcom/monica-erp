'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CircleAlert, CheckCircle2, Clock3, type LucideIcon } from 'lucide-react';

import type { WorkItem, WorkItemSeverity } from '@/lib/mos/workspace/work-item';
import { MODULE_IDENTITY, STATUS, type ModuleKey } from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';

// ============================================================================
// BỐN KHỐI DỰNG NÊN MỘT WORKSPACE
//
// ═══ TRIẾT LÝ ĐƯỢC MÃ HOÁ Ở ĐÂY ════════════════════════════════════════
// *"Loại bỏ văn hoá xin cho — mọi người tự nhìn thấy trạng thái công việc,
// trách nhiệm và tiến độ mà ⛔ không cần hỏi nhau."*
//
// Câu đó ⛔ không phải khẩu hiệu; nó quyết định **thứ tự** các khối:
//
//   ① VIỆC HÔM NAY   trước KPI — người vào Workspace để **làm**, ⛔ không để ngắm
//   ② KPI            sau đó — bối cảnh cho việc vừa đọc
//   ③ VIỆC LÀM NHANH kế bên — từ *"biết"* sang *"làm"* trong một cú bấm
//   ④ DỮ LIỆU        cuối — chi tiết cho ai cần đào sâu
//
// ⚠️ Đảo ① với ② là hỏng cả triết lý: KPI lên đầu biến Workspace thành **bảng
// báo cáo cho cấp trên**, và người vận hành lại phải **hỏi** mới biết làm gì.
// ============================================================================

const BIEU_TUONG_MUC: Record<WorkItemSeverity, LucideIcon> = {
  CRITICAL: CircleAlert,
  WARNING: AlertTriangle,
  INFO: CheckCircle2,
};

const THE_MUC: Record<WorkItemSeverity, { chip: string; text: string; dot: string }> = {
  CRITICAL: STATUS.critical,
  WARNING: STATUS.warning,
  INFO: STATUS.healthy,
};

// ─── ① VIỆC HÔM NAY ─────────────────────────────────────────────────────────

/**
 * *"Hôm nay tôi cần làm gì?"* — khối **đầu tiên** của mọi Workspace.
 *
 * ⚠️ Việc ở đây là **PHÉP CHIẾU** *(ADR-017 `WZ-1`)*: ⛔ **KHÔNG** có nút
 * *"đã xong"*. Việc biến mất khi **trạng thái nghiệp vụ** thôi đúng — ghi một
 * phiếu kiểm thì dòng *"⛔ chưa kiểm giờ nào"* tự rơi khỏi danh sách.
 *
 * 🔑 Đó là toàn bộ khác biệt giữa một hộp thư **⛔ không nói dối được** và một
 *    danh sách việc mà người ta bấm *"xong"* cho khuất mắt.
 */
export function WorkInbox({ viec, moduleKey }: { viec: readonly WorkItem[]; moduleKey: ModuleKey }) {
  const { t } = useLanguage();
  const mau = MODULE_IDENTITY[moduleKey];

  return (
    <section aria-label={t('workspace.today')} className="mb-8">
      <h2 className={`${TYPE.sectionTitle} mb-3 flex items-center gap-2 text-slate-900`}>
        <Clock3 className={`h-5 w-5 ${mau.primary}`} aria-hidden="true" />
        {t('workspace.today')}
      </h2>

      {viec.length === 0 ? (
        // ⚠️ *"⛔ Chưa đo được"* ⛔ KHÁC *"đo được, ⛔ không có việc"*. Khối này
        // chỉ rỗng khi **⛔ không luật nào nổ** — và bộ luật QA luôn có một luật
        // `INFO` bắt được trường hợp *"đã kiểm, mọi thứ ổn"*. Rơi vào đây nghĩa
        // là dữ liệu ⛔ chưa về, nên câu chữ phải nói đúng điều đó.
        <p className={`${TYPE.bodySm} rounded-xl bg-white/70 px-4 py-5 text-slate-500 ring-1 ring-slate-200/70`}>
          {t('workspace.todayEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {viec.map((v) => {
            const Icon = BIEU_TUONG_MUC[v.severity];
            const the = THE_MUC[v.severity];
            const noiDung = (
              <>
                <span className={`${the.chip} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className={`${TYPE.body} pt-1 text-slate-700`}>
                  {t(v.labelKey as DictionaryKey, v.vars)}
                </span>
              </>
            );

            // Việc CÓ nơi xử lý thì cả dòng là một liên kết — người dùng ⛔
            // không phải đi tìm nút. Việc ⛔ không có nơi xử lý thì ⛔ KHÔNG
            // giả vờ bấm được.
            return (
              <li key={v.id}>
                {v.href ? (
                  <Link
                    href={v.href}
                    className={`flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70 transition hover:ring-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`}
                  >
                    {noiDung}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70">
                    {noiDung}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─── ② KPI ──────────────────────────────────────────────────────────────────

export interface KpiItem {
  id: string;
  labelKey: DictionaryKey;
  /** Giá trị **đã định dạng** — hàm tính nằm ở `lib/mos/calculators/`, ⛔ không
   *  nằm ở màn hình *(phép kiểm `⑭`)*. */
  giaTri: string;
  /** Đơn vị. **Mọi con số phải có đơn vị** — quy tắc dữ liệu của dự án. */
  donVi?: string;
  /** Tô theo trạng thái khi con số **mang phán quyết** *(đạt/⛔ không đạt)*. */
  trangThai?: 'healthy' | 'warning' | 'critical';
  /**
   * 🔴 **`P33` · `P35` — LỐI ĐI TIẾP.**
   *
   * Một KPI ⛔ không `href` là một **ngõ cụt**: người đọc **biết có vấn đề** và
   * **⛔ không biết làm gì**, nên họ **đi hỏi người khác** — đúng thứ `§13`
   * muốn xoá. Nó cũng **trượt Phép thử Ba Giảm**.
   *
   * ⚠️ Để `?` vì TypeScript ⛔ **không** ép được *"phải có, trừ khi thật sự ⛔
   * không có nơi nào để tới"*. Vế đó do **phép kiểm ⑲** canh, ⛔ không do kiểu.
   */
  href?: string;
  /**
   * 🔑 **`P34` · `P36` — CON SỐ NÀY TỪ ĐÂU RA.**
   *
   * ⛔ **Không phải lời bình.** Là **nguồn gốc đo được**: *"từ 12 phiếu kiểm
   * hôm nay"*.
   *
   * ⚠️ Đây là chỗ `P36` sống hoặc chết. ⛔ Không có nó, một con số chỉ là **một
   * khẳng định**; có nó, nó là **một kết luận có nguồn**.
   */
  nguonKey?: DictionaryKey;
  nguonVars?: Record<string, string | number>;
  /**
   * 🔑 **`P38` — KHUYẾN NGHỊ, VÀ NÓ PHẢI CHỈ RA NGUYÊN NHÂN NGHIỆP VỤ.**
   *
   * ⛔ **Không phải** *"cần kiểm tra lại"* — câu đó ⛔ không thêm gì vào thứ
   * con số đã nói. Phải là *"chuyền 3 chiếm 40/50 lỗi hôm nay"*: **một nguyên
   * nhân có tên**, đủ để người đọc biết **đi đâu**.
   *
   * ⚠️ Chỉ hiện khi `trangThai` là `warning`/`critical`. Khuyến nghị gắn vào
   * một con số **đang ổn** là nhiễu, và nhiễu làm người ta thôi đọc khuyến
   * nghị **cả những lúc cần**.
   */
  khuyenNghiKey?: DictionaryKey;
  khuyenNghiVars?: Record<string, string | number>;
  /**
   * **`P39` · `P40` — NHÃN CỦA HÀNH ĐỘNG.**
   *
   * Thay cho chữ *"Xem chi tiết"* chung chung. *"Mở nhật ký kiểm"* nói rõ cú
   * bấm này **đưa người dùng tới đâu** — và `P40` đòi **mỗi cú bấm đưa họ gần
   * hơn tới chỗ xong việc**, ⛔ không phải gần hơn tới một màn hình khác.
   */
  hanhDongKey?: DictionaryKey;
}

export function KpiStrip({ kpi }: { kpi: readonly KpiItem[] }) {
  const { t } = useLanguage();
  const nen = 'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70';

  return (
    <section aria-label={t('workspace.kpi')} className="mb-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {kpi.map((k) => {
          const than = (
            <>
              <p className={`${TYPE.overline} text-slate-500`}>{t(k.labelKey)}</p>
              <p className={`${TYPE.metric} mt-2 ${k.trangThai ? STATUS[k.trangThai].text : 'text-slate-900'}`}>
                {k.giaTri}
                {/* Đơn vị nhỏ và nhạt hơn con số: nó là **ngữ cảnh**, ⛔ không
                    phải dữ liệu. Cùng cỡ thì mắt phải đọc hai lần mới tách được
                    đâu là số. */}
                {/* ⚠️ Bản nháp đầu viết thêm `font-normal` ở đây và **bánh cóc
                    chữ bắt ngay** — đúng thứ nó sinh ra để chặn. `TYPE.caption`
                    đã mang sẵn nét chữ của nó. Sửa bằng THẺ, ⛔ không bằng cách
                    thêm tệp vào sổ nợ. */}
                {k.donVi && <span className={`${TYPE.caption} ml-1.5 text-slate-400`}>{k.donVi}</span>}
              </p>
              {/* ═══ BỐN PHẦN CỦA MỘT KPI — Board, Execution Mode v2 ═══════
                  ① BẰNG CHỨNG  `nguonKey`      con số này từ đâu ra   `P36`
                  ② PHÂN TÍCH   `trangThai`     đạt hay ⛔ không đạt    `P34`
                  ③ KHUYẾN NGHỊ `khuyenNghiKey` nguyên nhân có tên     `P38`
                  ④ HÀNH ĐỘNG   `href` + nhãn   một cú bấm để xử lý    `P39` `P40`

                  ⚠️ Thiếu ① thì ② chỉ là **một khẳng định**. Thiếu ③ thì ④
                  đưa người dùng đi mà ⛔ không nói **đi làm gì**. Bốn phần này
                  ⛔ **không** phải bốn tính năng — chúng là **một câu hoàn
                  chỉnh**, và bỏ vế nào cũng làm câu đó cụt. */}
              {/* ① BẰNG CHỨNG — nguồn gốc con số, ⛔ không phải lời bình. */}
              {k.nguonKey && (
                <p className={`${TYPE.caption} mt-1.5 text-slate-400`}>{t(k.nguonKey, k.nguonVars)}</p>
              )}
              {/* ③ KHUYẾN NGHỊ — chỉ khi con số ĐANG CÓ VẤN ĐỀ. */}
              {k.khuyenNghiKey && (k.trangThai === 'warning' || k.trangThai === 'critical') && (
                <p className={`${TYPE.caption} ${STATUS[k.trangThai].text} mt-1.5`}>
                  {t(k.khuyenNghiKey, k.khuyenNghiVars)}
                </p>
              )}
            </>
          );

          // `P33` — thẻ có lối đi tiếp thì **CẢ THẺ** là liên kết, ⛔ không phải
          // một chữ *"xem thêm"* nhỏ ở góc. Vùng bấm càng lớn càng ít lần trượt
          // tay, và trên điện thoại đó là khác biệt thật.
          return k.href ? (
            <Link
              key={k.id}
              href={k.href}
              className={`${nen} group block transition hover:ring-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`}
            >
              {than}
              <span className={`${TYPE.caption} mt-2 inline-flex items-center gap-1 text-slate-400 transition group-hover:text-slate-700`}>
                {t(k.hanhDongKey ?? 'workspace.drillDown')}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <div key={k.id} className={nen}>{than}</div>
          );
        })}
      </div>
    </section>
  );
}

// ─── ③ VIỆC LÀM NHANH ───────────────────────────────────────────────────────

export interface QuickAction {
  id: string;
  labelKey: DictionaryKey;
  icon: LucideIcon;
  href?: string;
  /** ⛔ Chưa mở — hiện, khoá, gắn nhãn. **Cùng luật với ô Launcher**: ⛔ không
   *  ẩn, vì ẩn thì người dùng ⛔ không biết hệ thống sẽ có gì. */
  sapCo?: boolean;
}

export function QuickActions({ hanhDong, moduleKey }: { hanhDong: readonly QuickAction[]; moduleKey: ModuleKey }) {
  const { t } = useLanguage();
  const mau = MODULE_IDENTITY[moduleKey];

  return (
    <section aria-label={t('workspace.quickActions')} className="mb-8">
      <h2 className={`${TYPE.sectionTitle} mb-3 text-slate-900`}>{t('workspace.quickActions')}</h2>
      <div className="flex flex-wrap gap-2.5">
        {hanhDong.map(({ id, labelKey, icon: Icon, href, sapCo }) => {
          const chung = `${TYPE.label} inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 shadow-sm ring-1 transition`;
          if (sapCo || !href) {
            return (
              <button
                key={id}
                type="button"
                disabled
                aria-disabled="true"
                title={t('home.comingSoonHint')}
                className={`${chung} cursor-not-allowed bg-white/60 text-slate-400 ring-slate-200/70`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(labelKey)}
                <span className={`${TYPE.overline} ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-500`}>
                  {t('home.comingSoon')}
                </span>
              </button>
            );
          }
          return (
            <Link
              key={id}
              href={href}
              className={`${chung} bg-white text-slate-700 ring-slate-200/70 hover:ring-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`}
            >
              <Icon className={`h-4 w-4 ${mau.primary}`} aria-hidden="true" />
              {t(labelKey)}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── ④ KHỐI CHỜ DỮ LIỆU ─────────────────────────────────────────────────────

/**
 * Khối **đã thiết kế xong nhưng ⛔ chưa có dữ liệu**.
 *
 * ⚠️ Nó tồn tại để **nói thật**, ⛔ không phải để lấp chỗ. Ba khối
 * *(Lịch · Cảnh báo · Hoạt động gần đây)* cần bảng ⛔ chưa có — và
 * `SECURITY FREEZE` đang chặn migration.
 *
 * 🔑 Hai lối sai mà khối này tránh:
 *   ① **Dữ liệu giả** — Playbook Điều XX: *"⛔ Không Mock"*. Số liệu giả trên
 *      màn hình vận hành là thứ nguy hiểm nhất trong cả sản phẩm.
 *   ② **Giấu khối đi** — người dùng ⛔ không biết hệ thống sẽ có gì, và người
 *      dựng sau ⛔ không biết chỗ đó đã được thiết kế.
 */
export function BlockChoDuLieu({ tieuDeKey, lyDoKey }: { tieuDeKey: DictionaryKey; lyDoKey: DictionaryKey }) {
  const { t } = useLanguage();
  return (
    <section className="mb-8">
      <h2 className={`${TYPE.sectionTitle} mb-3 flex items-center gap-2 text-slate-900`}>
        {t(tieuDeKey)}
        <span className={`${TYPE.overline} rounded-full bg-slate-100 px-2 py-0.5 text-slate-500`}>
          {t('home.comingSoon')}
        </span>
      </h2>
      <p className={`${TYPE.bodySm} rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-5 text-slate-500`}>
        {t(lyDoKey)}
      </p>
    </section>
  );
}
