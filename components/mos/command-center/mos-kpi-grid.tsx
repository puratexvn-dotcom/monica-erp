'use client';

import { memo } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';

import type { MosKpi, MosTone } from '@/lib/mos/command-center.contract';

// ============================================================================
// LƯỚI Ô CHỈ SỐ — DÙNG CHUNG CHO MỌI PHÂN HỆ
//
// ─── TƯƠNG PHẢN ĐÃ ĐO (WCAG 2.1) ──────────────────────────────────────────
// con số  sắc độ 900 / nền 50   8,71 – 16,30 : 1
// nhãn    slate-600 / nền 50    6,90 –  7,31 : 1
// icon    sắc độ 700 / nền 100  4,84 –  8,40 : 1
// Thấp nhất 4,84:1, vượt ngưỡng 4,5:1 của WCAG AA.
// ⚠️ Hổ phách dùng sắc độ 800 chứ không 700 như các nhóm khác: amber-700 trên
// amber-100 chỉ đạt 4,51:1 — sát ngưỡng tới mức một lần chỉnh nhẹ là rớt.
// ⚠️ Nhãn và phụ đề phải là slate-600. slate-500 tụt xuống 4,33:1 trên nền
// pastel, dưới chuẩn. Đừng hạ xuống 500 cho "nhạt bớt".
// ============================================================================

const TONE: Record<MosTone, { card: string; chip: string; value: string; arrow: string }> = {
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
  amber: {
    card: 'border-amber-200 bg-amber-50 hover:border-amber-300',
    chip: 'bg-amber-100 text-amber-800', value: 'text-amber-900',
    arrow: 'text-amber-500 group-hover:text-amber-700',
  },
  rose: {
    card: 'border-rose-200 bg-rose-50 hover:border-rose-300',
    chip: 'bg-rose-100 text-rose-700', value: 'text-rose-900',
    arrow: 'text-rose-400 group-hover:text-rose-600',
  },
  red: {
    card: 'border-red-200 bg-red-50 hover:border-red-300',
    chip: 'bg-red-100 text-red-700', value: 'text-red-900',
    arrow: 'text-red-400 group-hover:text-red-600',
  },
  purple: {
    card: 'border-purple-200 bg-purple-50 hover:border-purple-300',
    chip: 'bg-purple-100 text-purple-700', value: 'text-purple-900',
    arrow: 'text-purple-400 group-hover:text-purple-600',
  },
  slate: {
    card: 'border-slate-200 bg-slate-100 hover:border-slate-300',
    chip: 'bg-slate-200 text-slate-700', value: 'text-slate-900',
    arrow: 'text-slate-400 group-hover:text-slate-600',
  },
};

function Card({ kpi }: { kpi: MosKpi }) {
  const t = TONE[kpi.tone];
  const Icon = kpi.icon;
  const clickable = Boolean(kpi.onGo);

  // Con trỏ hình bàn tay mà bấm vào không xảy ra gì là nói dối người dùng.
  // Không có onGo thì vẽ thành thẻ tĩnh, không phải nút.
  const Tag = clickable ? 'button' : 'div';

  return (
    <Tag
      {...(clickable ? { type: 'button' as const, onClick: kpi.onGo, 'aria-label': `${kpi.label}: ${kpi.value}. ${kpi.goLabel}` } : {})}
      className={`group rounded-2xl border p-3 text-left shadow-sm transition-all ${t.card} ${
        clickable
          ? 'cursor-pointer touch-manipulation hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chip}`}>
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        {clickable && (
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${t.arrow}`}
            aria-hidden="true"
          />
        )}
      </div>
      <p className="mt-2.5 text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-600">
        {kpi.label}
      </p>
      <p className={`mt-0.5 truncate text-2xl font-extrabold tabular-nums tracking-tight ${t.value}`}>
        {kpi.value}
      </p>
      <p className="mt-0.5 text-[10px] leading-snug text-slate-600">{kpi.sub}</p>
      {/* P38 — khuyen nghi. Them MOI, ⛔ khong doi hanh vi cu: vang truong nay
          thi o KPI hien y het truoc. */}
      {kpi.recommendation && (
        <p className="mt-1 text-[10px] leading-snug font-medium text-slate-700">{kpi.recommendation}</p>
      )}
    </Tag>
  );
}

/** Khung xương giữ NGUYÊN số ô ở đúng vị trí. Thay cả khối bằng một dòng
 *  "đang tải" sẽ làm cột co lại rồi bật ra, đẩy phần bên dưới nhảy hai lần. */
function Skeleton({ count, cols }: { count: number; cols: string }) {
  return (
    <div className={cols} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-2.5 h-2.5 w-20 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-2 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function MosKpiGrid({
  title,
  kpis,
  loading = false,
  onReload,
  columns = 'grid grid-cols-2 gap-2',
  skeletonCount = 6,
}: {
  title: string;
  /** null = chưa có số liệu, khung sẽ vẽ khung xương */
  kpis: MosKpi[] | null;
  loading?: boolean;
  onReload?: () => void;
  columns?: string;
  skeletonCount?: number;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h2>
        {onReload && (
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            className="inline-flex touch-manipulation items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Tính lại
          </button>
        )}
      </div>

      {kpis === null ? (
        <Skeleton count={skeletonCount} cols={columns} />
      ) : (
        <div className={columns}>
          {kpis.map((k) => (
            <Card key={k.id} kpi={k} />
          ))}
        </div>
      )}
    </section>
  );
}

export default memo(MosKpiGrid);
