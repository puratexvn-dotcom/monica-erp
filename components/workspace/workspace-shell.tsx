'use client';

import Link from 'next/link';
import { MessagesSquare, PieChart, Sparkles, FileText, type LucideIcon } from 'lucide-react';

import { QuickActions, BlockChoDuLieu, type QuickAction } from './blocks';
import MosTaskInbox from '@/components/mos/command-center/mos-task-inbox';
import MosKpiGrid from '@/components/mos/command-center/mos-kpi-grid';
import MosAlertPanel from '@/components/mos/command-center/mos-alert-panel';
import type { MosFeed } from '@/lib/mos/command-center.contract';
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
  /**
   * Ba mảng đã qua **Feed Adapter** — hình dạng TRÌNH BÀY.
   *
   * 🔑 Khung ⛔ KHÔNG biết phân hệ nào: ⛔ không bảng tra *"loại việc nào thì
   * icon nào"*, ⛔ không nhắc tới PO hay phiếu kiểm. Toàn bộ ý nghĩa do Feed
   * Adapter gắn vào trước khi truyền xuống.
   */
  feed: MosFeed | null;
  /**
   * **Mật độ** của ba khối điều hành — ⛔ **không** phải thứ tự của chúng.
   *
   * | | |
   * |---|---|
   * | `'doc'` *(mặc định)* | xếp **dọc** — phân hệ thưa khối, đọc từ trên xuống |
   * | `'ngang'` | **ba cột** `2/2/1` — phân hệ **dày đặc**, người dùng mở hàng chục lần mỗi ngày |
   *
   * 🔑 **Khung giữ nguyên THỨ TỰ** *(việc → số → cảnh báo)* ở **cả hai** chế
   * độ. `P7`/`P31`/`P32` được thoả bởi **trái-sang-phải** y hệt
   * **trên-xuống-dưới** — cái đọc trước vẫn là **việc**.
   *
   * ⚠️ **⛔ Không ép mọi phân hệ vào một mật độ.** `/kho` có ba cột từ trước, và
   * ba cột **đúng** cho một màn hình mở hàng chục lần mỗi ngày: xếp dọc buộc
   * người dùng cuộn qua hộp việc mỗi lần chỉ để liếc một con số. Ép xếp dọc là
   * khung **lấn sang quyết định nó ⛔ không nên quyết** — nó chịu trách nhiệm
   * về **trải nghiệm**, và trải nghiệm của một màn dùng liên tục ⛔ khác màn
   * dùng vài lần.
   */
  bocCuc?: 'doc' | 'ngang' | 'tuyBien';
  hanhDongNhanh: readonly QuickAction[];
  /** Ẩn bớt phần khung. `'dauTrang'` = bỏ tiêu đề; `'ca'` = bỏ cả tiêu đề lẫn
   *  lối về trang chủ. Bỏ trống = giữ nguyên như cũ cho 12 phân hệ còn lại. */
  an?: 'dauTrang' | 'ca';
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
  moduleKey, tenModule, moTaKey, feed, loi, hanhDongNhanh, bocCuc = 'doc', an, children,
}: WorkspaceShellProps) {
  const { t } = useLanguage();
  const mau = MODULE_IDENTITY[moduleKey];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* ─── ĐẦU TRANG ────────────────────────────────────────────────── */}
      {/* 🔴 `an='dauTrang'` — Board Directive 07/08/2026 §2: *"Xóa hoàn toàn
          KHÔNG GIAN LÀM VIỆC / Merchandising / mô tả. **⛔ Không để khoảng
          trắng. ⛔ Không giữ chiều cao cũ.**"*
          🔑 Thanh trên của Dashboard đã in **tên phân hệ** rồi; khối này lặp
          lại đúng thông tin đó và ăn ~150 px của màn hình đầu tiên.
          ⚠️ Trả `null`, ⛔ KHÔNG trả `<header className="h-0">` — thẻ rỗng vẫn
          giữ `mb-8` và để lại đúng khoảng trắng Board yêu cầu xoá. */}
      {an !== 'dauTrang' && an !== 'ca' && (
        <header className="mb-8">
          <p className={`${TYPE.overline} ${mau.primary}`}>{t('workspace.eyebrow')}</p>
          {/* Tên Module ⛔ KHÔNG đi qua `t()` — từ vựng hiến định (§45.3), và
              phép kiểm ⑪ cưỡng chế điều đó. */}
          <h1 className={`${TYPE.pageTitle} mt-1 text-slate-900`}>{tenModule}</h1>
          <p className={`${TYPE.body} mt-1.5 text-slate-500`}>{t(moTaKey)}</p>
        </header>
      )}

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

      {/* ═══ HỢP NHẤT — Board Directive 05/08/2026, Phương án ① ═══════════
          Khung này là **lớp TRẢI NGHIỆM**: nó quyết định **thứ tự** và **bố
          cục**. Ba khối dữ liệu thuộc **lớp NGHIỆP VỤ** dùng chung
          (`components/mos/command-center/`) — đã chạy sẵn ở `/md` và `/kho`.

          ⚠️ Trước bản này tôi dựng `WorkInbox` và `KpiStrip` **song song** với
          hai khối MOS cùng chức năng. Đó là **khung thứ hai**, và Board đã ra
          luật *"⛔ không duy trì hai framework song song"*. Nay khung **bọc**
          khối MOS; hai khối kia còn trong `blocks.tsx` nhưng **⛔ không được
          dựng ra ở đâu nữa**.

          🔑 Thứ tự vẫn là **VIỆC → SỐ → HÀNH ĐỘNG**. Đó là phần khung này
          **giữ**, và là lý do nó tồn tại thay vì để mỗi phân hệ tự xếp. */}
      {/* ⚠️ BA KHỐI ĐIỀU HÀNH ĐI LIỀN NHAU, ở **cả hai** mật độ.
          Bản trước tôi để `MosAlertPanel` rơi xuống **sau `children`** — tức
          sau cả bảng dữ liệu của phân hệ. Cảnh báo nằm dưới bảng thì người
          dùng đọc hết bảng rồi mới biết có cảnh báo, và tới lúc đó họ đã tự
          rút kết luận từ bảng rồi. Việc · Số · Cảnh báo là **một cụm**. */}
      {/* 🔴 `tuyBien` — KHUNG ⛔ KHÔNG DỰNG BA KHỐI, PHÂN HỆ TỰ ĐẶT CHÚNG.

          Board: *"Framework chỉ quy định **thứ tự · hành vi · nguyên tắc**.
          ⛔ Không ép mọi Workspace có cùng **bố cục** nếu điều đó làm giảm hiệu
          quả công việc của từng phòng ban."*

          `/md` đặt KPI **bên trong một tab**, việc và cảnh báo lên đầu. Đó là
          bố cục **khác** — và nó thoả `P7`/`P31`/`P32` **mạnh hơn** cả hai chế
          độ kia: số liệu nằm sau một cú bấm, còn việc thì hiện ngay.

          ⚠️ Chế độ này ⛔ **KHÔNG** phải cửa chạy làng: phân hệ chọn nó vẫn phải
          giữ **VIỆC TRƯỚC SỐ**. Khung thôi **đặt** ba khối, nhưng **nguyên tắc
          thì ⛔ không ai được miễn**. */}
      {bocCuc !== 'tuyBien' && (
      <div
        className={
          bocCuc === 'ngang'
            ? 'mb-8 grid grid-cols-1 gap-4 lg:grid-cols-5'
            : 'mb-8 flex flex-col gap-6'
        }
      >
        <div className={bocCuc === 'ngang' ? 'lg:col-span-2' : ''}>
          <MosTaskInbox title={t('workspace.today')} tasks={feed?.tasks ?? []} error={loi} />
        </div>
        <div className={bocCuc === 'ngang' ? 'lg:col-span-2' : ''}>
          <MosKpiGrid title={t('workspace.kpi')} kpis={feed?.kpis ?? null} />
        </div>
        {/* Cảnh báo nay là khối THẬT của lớp nghiệp vụ, ⛔ không còn là ô chờ. */}
        <div className={bocCuc === 'ngang' ? 'lg:col-span-1' : ''}>
          <MosAlertPanel
            title={t('workspace.alerts')}
            alerts={feed?.alerts ?? []}
            error={loi}
            watchingHint={t('workspace.watchingHint')}
          />
        </div>
      </div>
      )}

      <QuickActions hanhDong={hanhDongNhanh} moduleKey={moduleKey} />

      {children}

      {/* ─── KHỐI ĐÃ THIẾT KẾ, ⛔ CHƯA CÓ DỮ LIỆU ───────────────────────
          Hai khối này cần bảng ⛔ chưa tồn tại, và `SECURITY FREEZE` đang chặn
          migration. Hiện chúng ra kèm **lý do thật** thay vì giấu đi hoặc bịa
          số — Playbook Điều XX: *"⛔ Không Mock"*. */}
      {/* 🔴 `an='ca'` bỏ hai khối này — Board §12: *"⛔ Không được tồn tại
          Timeline trùng · Activity trùng."*
          `/md` đã có **Nhật ký thao tác** thật ở tầng Management; giữ thêm hai
          khối `SẮP CÓ` cùng tên là **trùng tên, khác nội dung** — thứ dạy người
          dùng bỏ qua cả khu vực đó.
          ⚠️ Phân hệ khác **vẫn giữ** chúng: chúng nói thật rằng bảng dữ liệu ⛔
          chưa tồn tại, và đó là *"⛔ không Mock"* chứ ⛔ không phải rác. */}
      {an !== 'ca' && (
        <>
          <BlockChoDuLieu tieuDeKey="workspace.calendar" lyDoKey="workspace.needsData" />
          <BlockChoDuLieu tieuDeKey="workspace.recent" lyDoKey="workspace.needsData" />
        </>
      )}

      {/* ─── DẢI DỊCH VỤ TOÀN CỤC — ĐÃ GỠ 06/08/2026 ────────────────────
          🔴 Gỡ sau đợt rà thực chiến: dải này dựng **4 nút `SẮP CÓ` bị khoá**
          ở **cuối MỌI Workspace**, và bốn dịch vụ đó **CHÍNH LÀ** bốn nút đang
          chạy thật trên Bottom Nav *(Chat · Báo cáo · A.I · Hướng dẫn)*.

          Chú thích cũ ở đây viết: *"khi Bottom Navigation mở ra, dải này là lối
          vào THỨ HAI"*. Bottom Nav **đã mở** — nên dải này thôi là lối vào thứ
          hai và trở thành **bản sao bị khoá** của thứ đang dùng được.

          🔑 Cái giá thật: người dùng cuộn hết một Workspace và thứ cuối cùng họ
          thấy là **bốn ô xám ghi "SẮP CÓ"**. Đó là ấn tượng *"phần mềm chưa
          xong"* đặt ở đúng chỗ đáng lẽ phải là *"đã làm xong việc"*.

          ⚠️ ⛔ KHÔNG xoá `DICH_VU` và các khoá i18n — chúng vẫn ở nguyên trong
          tệp này để dùng lại nếu Board muốn một dải lối tắt THẬT SỰ mở được. */}

      {/* Lối về trang chủ — `EP-2`: nút `Home` phải về được Launcher từ **mọi**
          Workspace, nếu ⛔ không trang chủ thôi là *"điểm vào"* và chỉ còn là
          *"trang đăng nhập"*.
          🔴 Board §3: *"Logo MONICA **đã là Home**. ⛔ Không được lặp chức
          năng."* ⇒ phân hệ nào bật `an='ca'` thì bỏ nút này.
          ⚠️ `EP-2` VẪN ĐƯỢC GIỮ: logo ở thanh trên là `<Link href="/">` — lối
          về Launcher ⛔ không mất, nó chỉ **thôi có hai chỗ**. */}
      {an !== 'ca' && (
      <div className="mt-8">
        <Link
          href="/"
          className={`${TYPE.label} inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`}
        >
          ← {t('workspace.backHome')}
        </Link>
      </div>
      )}
    </div>
  );
}
