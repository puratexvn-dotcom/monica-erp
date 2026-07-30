'use client';

import type { ElementType } from 'react';
import { Boxes, Minus, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { ProgressBar, Badge } from '@/components/ui';
import type { DeptMetrics } from '@/app/actions/ceo-report';
import type { ReportMetric } from '@/components/report-sheet';

// ============================================================================
// DASHBOARD MINI "SỐ LIỆU BỘ PHẬN"
//
// ─── BA CON SỐ, BA SẮC MÀU ─────────────────────────────────────────────────
// 🟢 Doanh thu dự kiến · 🟠 Sản lượng đang chạy · 🔵 Giá trị đơn trung bình.
// Ba thẻ trắng giống nhau buộc người đọc phải dò nhãn; màu nền cho phép nhận
// ra thẻ trước cả khi đọc chữ — quan trọng vì báo cáo này được chụp thành ảnh
// và xem trên màn hình điện thoại nhỏ.
//
// ─── VÌ SAO TREND LÀ SỐ THẬT ───────────────────────────────────────────────
// Mũi tên "↑ +5% so với tháng trước" tính từ chính doanh thu tháng này so với
// tháng trước trong bảng orders, KHÔNG phải con số minh hoạ. Tháng trước bằng
// 0 thì hiện "chưa có nền so sánh" chứ không hiện +100% — ảnh này gửi cho giám
// đốc, một con số bịa nằm lại vĩnh viễn trong nhóm chat.
//
// ─── VÌ SAO CÓ THANH TIẾN ĐỘ ───────────────────────────────────────────────
// Thanh dưới thẻ Doanh thu cho biết tháng này đã đạt bao nhiêu phần so với
// TOÀN BỘ doanh thu đang chạy — trả lời câu "còn bao nhiêu phải giao nữa".
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

type CardTone = 'emerald' | 'amber' | 'blue';

const TONE: Record<CardTone, { card: string; chip: string; value: string; bar: 'emerald' | 'amber' | 'indigo' }> = {
  emerald: {
    card: 'border-emerald-200 bg-emerald-50',
    chip: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-900',
    bar: 'emerald',
  },
  amber: {
    card: 'border-amber-200 bg-amber-50',
    chip: 'bg-amber-100 text-amber-800',
    value: 'text-amber-900',
    bar: 'amber',
  },
  blue: {
    card: 'border-blue-200 bg-blue-50',
    chip: 'bg-blue-100 text-blue-700',
    value: 'text-blue-900',
    // ProgressBar dùng bảng Tone gốc, ở đó khoá xanh dương vẫn mang tên 'indigo'
    bar: 'indigo',
  },
};

function BigCard({
  icon: Icon,
  tone,
  label,
  value,
  unit,
  sub,
  pct,
  trend,
}: {
  icon: ElementType;
  tone: CardTone;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  pct?: number;
  trend?: { pct: number | null; note: string };
}) {
  const t = TONE[tone];
  const up = trend?.pct !== null && trend?.pct !== undefined && trend.pct > 0;
  const down = trend?.pct !== null && trend?.pct !== undefined && trend.pct < 0;
  const TrendIcon = up ? TrendingUp : down ? TrendingDown : Minus;

  return (
    <div className={`rounded-xl border p-3 ${t.card}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.chip}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-600">
          {label}
        </p>
      </div>

      <p className={`mt-2 text-2xl font-extrabold leading-none tabular-nums tracking-tight ${t.value}`}>
        {value}
        {unit && <span className="ml-1 text-xs font-bold text-slate-500">{unit}</span>}
      </p>
      <p className="mt-1 text-[10px] leading-snug text-slate-600">{sub}</p>

      {pct !== undefined && (
        <div className="mt-2">
          <ProgressBar pct={pct} tone={t.bar} />
        </div>
      )}

      {trend && (
        <p
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            trend.pct === null
              ? 'bg-slate-100 text-slate-600'
              : up
                ? 'bg-emerald-100 text-emerald-800'
                : down
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-100 text-slate-600'
          }`}
        >
          <TrendIcon className="h-3 w-3" aria-hidden="true" />
          {trend.pct === null ? trend.note : `${up ? '+' : ''}${trend.pct}% ${trend.note}`}
        </p>
      )}
    </div>
  );
}

export default function DeptReport({
  dept,
  metrics,
}: {
  dept: DeptMetrics;
  /** Số liệu theo bộ phận từ layout gốc — giữ nguyên, không bỏ */
  metrics: ReportMetric[];
}) {
  const money = (n: number | null) => (n === null ? '—' : nf.format(n));

  // Phần doanh thu tháng này chiếm bao nhiêu trong tổng doanh thu đang chạy.
  // Không có mẫu số thì không vẽ thanh, thay vì vẽ một thanh 0% gây hiểu nhầm.
  const monthPct =
    dept.revenue && dept.revenue > 0 ? (dept.revenueThisMonth / dept.revenue) * 100 : undefined;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <BigCard
          icon={Wallet}
          tone="emerald"
          label="Doanh thu dự kiến"
          value={money(dept.revenue)}
          unit={dept.revenue === null ? undefined : dept.currency}
          sub={
            dept.revenue === null
              ? `${dept.unpricedOrders} đơn đang chạy đều chưa nhập đơn giá`
              : dept.unpricedOrders > 0
                ? `từ ${dept.pricedOrders} đơn có giá · chưa gồm ${dept.unpricedOrders} đơn thiếu giá`
                : `từ toàn bộ ${dept.pricedOrders} đơn đang chạy`
          }
          pct={monthPct}
          trend={{
            pct: dept.revenueTrendPct,
            note: dept.revenueTrendPct === null ? 'chưa có nền so sánh tháng trước' : 'so với tháng trước',
          }}
        />

        <BigCard
          icon={Boxes}
          tone="amber"
          label="Sản lượng đang chạy"
          value={dept.quantity === null ? '—' : nf.format(dept.quantity)}
          unit={dept.quantity === null ? undefined : 'sp'}
          sub={
            dept.quantity === null
              ? 'chưa đọc được dữ liệu đơn hàng'
              : `cộng từ ${dept.pricedOrders + dept.unpricedOrders} đơn chưa đóng`
          }
        />

        <BigCard
          icon={Receipt}
          tone="blue"
          label="Giá trị đơn trung bình"
          value={money(dept.aov)}
          unit={dept.aov === null ? undefined : dept.currency}
          sub={
            dept.aov === null
              ? 'cần ít nhất một đơn có đơn giá'
              : `doanh thu chia cho ${dept.pricedOrders} đơn có giá`
          }
        />
      </div>

      {/* Doanh thu hai tháng, để con số phần trăm ở trên có chỗ đối chiếu.
          Chỉ một con số phần trăm mà không có gốc thì không kiểm chứng được. */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Tháng này</p>
          <p className="mt-0.5 text-sm font-extrabold tabular-nums text-slate-900">
            {nf.format(dept.revenueThisMonth)} <span className="text-[10px] text-slate-500">{dept.currency}</span>
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Tháng trước</p>
          <p className="mt-0.5 text-sm font-extrabold tabular-nums text-slate-900">
            {nf.format(dept.revenueLastMonth)} <span className="text-[10px] text-slate-500">{dept.currency}</span>
          </p>
        </div>
      </div>

      {/* Bảng số liệu theo bộ phận CŨ — giữ nguyên, chỉ xếp xuống dưới */}
      {metrics.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
            Số liệu theo bộ phận
          </h4>
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 text-xs font-semibold text-slate-600">{m.label}</p>
                <p className="shrink-0 text-lg font-extrabold tabular-nums tracking-tight text-slate-900">
                  {m.value}
                  {m.unit && <span className="ml-1 text-[10px] font-bold text-slate-400">{m.unit}</span>}
                </p>
              </div>
              {m.pct !== undefined && (
                <div className="mt-2">
                  <ProgressBar pct={m.pct} tone={m.tone ?? 'indigo'} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2.5">
        <Badge tone="slate">Nguồn: Monica ERP</Badge>
        <span className="text-[10px] leading-snug text-slate-500">
          Doanh thu tính bằng đơn giá × số lượng của các đơn chưa đóng. Ô hiện &quot;—&quot; nghĩa là
          chưa đủ dữ liệu để tính, không phải bằng không.
        </span>
      </div>
    </div>
  );
}
