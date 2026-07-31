'use client';

import { memo } from 'react';
import type { ElementType } from 'react';
import {
  ArrowDownToLine, ArrowUpFromLine, Boxes, ChevronRight, Layers, Lock, RefreshCw, Truck, Wallet,
} from 'lucide-react';

import type { WhKpi } from '@/app/(dashboard)/kho/_services/command-center.service';

// ============================================================================
// CỘT GIỮA — TỔNG QUAN TỒN KHO
//
// ─── VÌ SAO MỖI Ô MỘT MÀU ──────────────────────────────────────────────────
// Hệ màu ngữ nghĩa của kho, cố định không đổi:
//   xanh dương = tồn kho bình thường · tím = đã giữ chỗ · xanh lá = có sẵn
//   hổ phách = đang đi đường (chờ) · xám = số liệu trong ngày
// Liếc một cái là biết ô nào nói về cái gì, không cần đọc nhãn.
//
// ─── VÌ SAO "—" CHỨ KHÔNG PHẢI 0 ───────────────────────────────────────────
// Trong kho, "hết hàng" và "không đọc được số tồn" dẫn tới hai hành động hoàn
// toàn khác nhau. Riêng giá trị tồn kho mà hiện 0 khi thật ra chưa ai khai đơn
// giá thì còn tệ hơn: đó là báo cáo cả kho không đáng giá gì.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nf3 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
const dash = (n: number | null) => (n === null ? '—' : nf3.format(n));

type Tone = 'blue' | 'emerald' | 'purple' | 'amber' | 'slate';

const TONE: Record<Tone, { card: string; chip: string; value: string; arrow: string }> = {
  blue: {
    card: 'border-blue-200 bg-blue-50 hover:border-blue-300',
    chip: 'bg-blue-100 text-blue-700', value: 'text-blue-900',
    arrow: 'text-blue-400 group-hover:text-blue-600',
  },
  emerald: {
    card: 'border-emerald-200 bg-emerald-50 hover:border-emerald-300',
    chip: 'bg-emerald-100 text-emerald-700', value: 'text-emerald-900',
    arrow: 'text-emerald-400 group-hover:text-emerald-600',
  },
  purple: {
    card: 'border-purple-200 bg-purple-50 hover:border-purple-300',
    chip: 'bg-purple-100 text-purple-700', value: 'text-purple-900',
    arrow: 'text-purple-400 group-hover:text-purple-600',
  },
  amber: {
    card: 'border-amber-200 bg-amber-50 hover:border-amber-300',
    chip: 'bg-amber-100 text-amber-800', value: 'text-amber-900',
    arrow: 'text-amber-500 group-hover:text-amber-700',
  },
  slate: {
    card: 'border-slate-200 bg-slate-100 hover:border-slate-300',
    chip: 'bg-slate-200 text-slate-700', value: 'text-slate-900',
    arrow: 'text-slate-400 group-hover:text-slate-600',
  },
};

function KpiCard({
  icon: Icon, tone, label, value, sub, onGo, goLabel,
}: {
  icon: ElementType;
  tone: Tone;
  label: string;
  value: string;
  sub: string;
  onGo: () => void;
  goLabel: string;
}) {
  const t = TONE[tone];
  return (
    <button
      type="button"
      onClick={onGo}
      aria-label={`${label}: ${value}. ${goLabel}`}
      className={`group cursor-pointer touch-manipulation rounded-2xl border p-3 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${t.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.chip}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <ChevronRight
          className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${t.arrow}`}
          aria-hidden="true"
        />
      </div>
      <p className="mt-2 text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-600">{label}</p>
      <p className={`mt-0.5 truncate text-xl font-extrabold tabular-nums tracking-tight ${t.value}`}>{value}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-slate-600">{sub}</p>
    </button>
  );
}

/** Khung xương giữ NGUYÊN sáu ô ở đúng vị trí: thay cả khối bằng một dòng
 *  "đang tải" sẽ làm cột co lại rồi bật ra, đẩy hai cột bên cạnh nhảy theo. */
function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-2" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-2 h-2.5 w-20 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-6 w-16 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-2 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export type KpiTarget = 'stock' | 'inbound' | 'outbound' | 'reserve';

function WhStockKpi({
  kpi,
  loading,
  onReload,
  onGo,
}: {
  kpi: WhKpi | null;
  loading: boolean;
  onReload: () => void;
  onGo: (t: KpiTarget) => void;
}) {
  return (
    <section aria-label="Tổng quan tồn kho">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Tổng quan tồn kho</h2>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="inline-flex touch-manipulation items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Tính lại
        </button>
      </div>

      {kpi === null ? (
        <Skeleton />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <KpiCard
            icon={Boxes} tone="blue" label="Tổng tồn kho"
            value={dash(kpi.totalOnHand)}
            sub={kpi.skuCount === null ? 'chưa đọc được' : `${nf.format(kpi.skuCount)} mã vật tư`}
            goLabel="Mở bảng tồn kho" onGo={() => onGo('stock')}
          />
          <KpiCard
            icon={Wallet} tone="emerald" label={`Giá trị kho (${kpi.currency})`}
            value={kpi.totalValue === null ? '—' : nf.format(kpi.totalValue)}
            sub={
              kpi.totalValue === null
                ? `${kpi.unvaluedCount} dòng đều chưa có đơn giá`
                : kpi.unvaluedCount > 0
                  ? `chưa gồm ${kpi.unvaluedCount} dòng thiếu đơn giá`
                  : `từ toàn bộ ${kpi.valuedCount} dòng tồn`
            }
            goLabel="Mở bảng tồn kho" onGo={() => onGo('stock')}
          />
          <KpiCard
            icon={Layers} tone="emerald" label="Có sẵn"
            value={dash(kpi.totalAvailable)}
            sub="lấy được ngay, đã trừ giữ chỗ"
            goLabel="Mở bảng tồn kho" onGo={() => onGo('stock')}
          />
          <KpiCard
            icon={Lock} tone="purple" label="Đã giữ chỗ"
            value={dash(kpi.totalReserved)}
            sub="còn trong kho nhưng đã có chủ"
            goLabel="Mở tab Giữ chỗ" onGo={() => onGo('reserve')}
          />
          <KpiCard
            icon={Truck} tone="amber" label="Đang đi đường"
            value={dash(kpi.inTransitQty)}
            sub="đã đặt mua, chưa nhận đủ"
            goLabel="Mở tab Nhập hàng" onGo={() => onGo('inbound')}
          />
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => onGo('inbound')}
              className="group flex touch-manipulation items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-blue-300 hover:shadow-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Nhập hôm nay</span>
                <span className="block truncate text-sm font-extrabold tabular-nums text-slate-900">
                  {dash(kpi.receivedToday)}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onGo('outbound')}
              className="group flex touch-manipulation items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-blue-300 hover:shadow-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <ArrowUpFromLine className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Xuất hôm nay</span>
                <span className="block truncate text-sm font-extrabold tabular-nums text-slate-900">
                  {dash(kpi.issuedToday)}
                </span>
              </span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(WhStockKpi);
