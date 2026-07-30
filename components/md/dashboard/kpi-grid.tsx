'use client';

import type { ElementType } from 'react';
import {
  Boxes, CalendarClock, ChevronRight, ClipboardList, FileQuestion,
  RefreshCw, ShoppingCart, TriangleAlert,
} from 'lucide-react';

import type { MdDashboardData } from '@/app/(dashboard)/md/_services/dashboard.service';
import { fmtNum } from '../po/tab-kit';

// ============================================================================
// SÁU THẺ CHỈ SỐ ĐIỀU HÀNH
//
// ─── VÌ SAO SÁU, KHÔNG PHẢI TÁM ────────────────────────────────────────────
// Lưới 1 / 2 / 3 cột chia hết cho sáu nên ra đúng hai hàng 3-3 cân đối ở mọi
// bề ngang màn hình. Tám thẻ sẽ để lại một hàng cụt hai ô kèm khoảng trống thừa.
//
// ─── VÌ SAO MỖI THẺ MỘT MÀU ────────────────────────────────────────────────
// Sáu thẻ trắng giống hệt nhau buộc người dùng phải ĐỌC hết nhãn mới biết thẻ
// nào là cảnh báo. Màu mang nghĩa cố định: hồng là đang trễ, hổ phách là đang
// chờ, đỏ là nguy hiểm, xanh dương là đang chạy trôi chảy, xanh lá là cơ hội.
// Liếc một cái là thấy, không phải đọc.
//
// ─── VÌ SAO BẤM ĐƯỢC ───────────────────────────────────────────────────────
// Con trỏ hình bàn tay mà bấm vào không xảy ra gì là nói dối người dùng. Mỗi
// thẻ nhảy thẳng tới đúng tab xử lý con số đó, kèm cuộn lên đầu trang vì thanh
// tab nằm trên cùng còn khối chỉ số nằm dưới.
//
// ─── VÌ SAO "—" CHỨ KHÔNG PHẢI 0 ───────────────────────────────────────────
// Trong nhà máy, "không có mốc nào trễ" và "không đọc được dữ liệu mốc trễ" là
// hai chuyện khác hẳn nhau. Hiện 0 khi thật ra là lỗi quyền sẽ khiến người
// điều hành yên tâm nhầm.
// ============================================================================

type KpiTone = 'blue' | 'rose' | 'amber' | 'red' | 'emerald' | 'slate';

/** Bảng màu riêng của khối chỉ số, KHÔNG dùng chung Tone của bộ giao diện gốc:
 *  ở đây cần sáu sắc riêng biệt, mà mở rộng Tone gốc thì kéo theo thay đổi ở
 *  mọi phù hiệu và thanh tiến độ trong toàn hệ thống.
 *
 *  ĐÃ ĐO tương phản trên cả sáu nền (thuật toán WCAG 2.1):
 *    con số   sắc độ 900 trên nền 50   →  8,71 – 16,30 : 1
 *    nhãn     slate-600 trên nền 50    →  6,90 –  7,31 : 1
 *    phụ đề   slate-600 trên nền 50    →  6,90 –  7,31 : 1
 *    icon     sắc độ 700 trên nền 100  →  4,84 –  8,40 : 1
 *  Thấp nhất 4,84:1, đều vượt ngưỡng 4,5:1 của WCAG AA cho chữ thường.
 *
 *  ⚠️ Phụ đề từng dùng slate-500 và tụt xuống 4,33:1 trên nền xanh dương, hồng,
 *  đỏ và xám — dưới chuẩn. Đừng hạ lại xuống 500 cho "nhạt bớt". */
const TONE: Record<KpiTone, { card: string; icon: string; value: string; arrow: string }> = {
  blue: {
    card: 'border-blue-200 bg-blue-50 hover:border-blue-300',
    icon: 'bg-blue-100 text-blue-700',
    value: 'text-blue-900',
    arrow: 'text-blue-400 group-hover:text-blue-600',
  },
  rose: {
    card: 'border-rose-200 bg-rose-50 hover:border-rose-300',
    icon: 'bg-rose-100 text-rose-700',
    value: 'text-rose-900',
    arrow: 'text-rose-400 group-hover:text-rose-600',
  },
  amber: {
    card: 'border-amber-200 bg-amber-50 hover:border-amber-300',
    icon: 'bg-amber-100 text-amber-800',
    value: 'text-amber-900',
    arrow: 'text-amber-500 group-hover:text-amber-700',
  },
  // Đỏ (red) chứ KHÔNG phải hồng (rose): rose đã dành cho "Mốc T&A trễ", hai
  // thẻ cạnh nhau cùng sắc hồng thì mất luôn ý nghĩa phân biệt. red-600
  // (#dc2626) ngả cam, rose-600 (#e11d48) ngả hồng — nhìn ra ngay là hai thứ.
  red: {
    card: 'border-red-200 bg-red-50 hover:border-red-300',
    icon: 'bg-red-100 text-red-700',
    value: 'text-red-900',
    arrow: 'text-red-400 group-hover:text-red-600',
  },
  emerald: {
    card: 'border-emerald-200 bg-emerald-50 hover:border-emerald-300',
    icon: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-900',
    arrow: 'text-emerald-400 group-hover:text-emerald-600',
  },
  slate: {
    card: 'border-slate-200 bg-slate-100 hover:border-slate-300',
    icon: 'bg-slate-200 text-slate-700',
    value: 'text-slate-900',
    arrow: 'text-slate-400 group-hover:text-slate-600',
  },
};

const dash = (n: number | null) => (n === null ? '—' : fmtNum(n));

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  goLabel,
  onGo,
}: {
  icon: ElementType;
  label: string;
  value: string;
  sub: string;
  tone: KpiTone;
  goLabel: string;
  onGo: () => void;
}) {
  const t = TONE[tone];
  return (
    <button
      type="button"
      onClick={onGo}
      aria-label={`${label}: ${value}. ${goLabel}`}
      className={`group cursor-pointer rounded-2xl border p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${t.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <ChevronRight
          className={`h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 ${t.arrow}`}
          aria-hidden="true"
        />
      </div>

      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p>
      <p className={`mt-0.5 text-3xl font-extrabold tabular-nums tracking-tight ${t.value}`}>{value}</p>
      <p className="mt-1 text-[11px] font-medium text-slate-600">{sub}</p>
    </button>
  );
}

export type KpiTarget =
  | 'po' | 'materials' | 'risks' | 'rfq' | 'changes';

export default function KpiGrid({
  data,
  loading,
  onReload,
  onGo,
}: {
  data: MdDashboardData | null;
  loading: boolean;
  onReload: () => void;
  /** Nhảy tới tab xử lý con số vừa bấm */
  onGo: (target: KpiTarget) => void;
}) {
  const k = data?.kpi ?? null;

  return (
    <section aria-label="Tổng quan điều hành">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Tổng quan điều hành</h2>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Tính lại
        </button>
      </div>

      {/* Lúc chưa có số liệu vẫn giữ NGUYÊN sáu ô ở đúng vị trí, chỉ thay nội
          dung bằng khung xương. Thay cả khối bằng một dòng "đang tải" sẽ làm
          trang co lại rồi bật ra, đẩy phần bên dưới nhảy hai lần. */}
      {k === null ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="mt-3 h-3 w-24 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-2.5 w-32 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          icon={ShoppingCart}
          tone="blue"
          label="Đơn đang chạy"
          value={dash(k.runningOrders)}
          sub={k.runningQuantity === null ? 'chưa đọc được số lượng' : `${fmtNum(k.runningQuantity)} sản phẩm`}
          goLabel="Mở tab Đơn hàng"
          onGo={() => onGo('po')}
        />
        <KpiCard
          icon={CalendarClock}
          tone="rose"
          label="Mốc T&A trễ"
          value={dash(k.lateMilestones)}
          sub={k.ordersWithLate === null ? 'chưa đọc được' : `thuộc ${fmtNum(k.ordersWithLate)} đơn hàng`}
          goLabel="Mở tab Đơn hàng để xử lý"
          onGo={() => onGo('po')}
        />
        <KpiCard
          icon={Boxes}
          tone="amber"
          label="NPL chưa về kho"
          value={dash(k.pendingMaterials)}
          sub="đề nghị mua chưa nhận hàng"
          goLabel="Mở tab Vật tư"
          onGo={() => onGo('materials')}
        />
        <KpiCard
          icon={TriangleAlert}
          tone="red"
          label="Đơn rủi ro cao"
          value={dash(k.criticalRisks)}
          sub="mức Cao và Nguy kịch"
          goLabel="Mở tab Rủi ro"
          onGo={() => onGo('risks')}
        />
        <KpiCard
          icon={FileQuestion}
          tone="emerald"
          label="Yêu cầu báo giá mở"
          value={dash(k.openInquiries)}
          sub="chưa chốt thắng hay thua"
          goLabel="Mở tab Yêu cầu báo giá"
          onGo={() => onGo('rfq')}
        />
        <KpiCard
          icon={ClipboardList}
          tone="slate"
          label="Thay đổi chờ duyệt"
          value={dash(k.openChangeRequests)}
          sub="cần một quyết định"
          goLabel="Mở tab Yêu cầu thay đổi"
          onGo={() => onGo('changes')}
        />
      </div>
      )}
    </section>
  );
}
