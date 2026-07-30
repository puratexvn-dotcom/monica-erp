'use client';

import type { ReactNode } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

// ============================================================================
// BỘ BIỂU ĐỒ DÙNG CHUNG CHO BẢNG TỔNG QUAN MERCHANDISER
//
// ─── VÌ SAO BỌC RECHARTS LẠI ────────────────────────────────────────────────
// Recharts cần rất nhiều thuộc tính lặp đi lặp lại (trục, lưới, tooltip, màu).
// Viết thẳng ở mỗi chỗ dùng thì bốn biểu đồ sẽ có bốn kiểu trình bày khác nhau
// mà không ai chủ ý làm vậy. Bọc lại để trục, phông chữ và định dạng số tiếng
// Việt là một.
//
// ─── VÌ SAO PHÂN BIỆT "KHÔNG ĐỌC ĐƯỢC" VỚI "KHÔNG CÓ SỐ LIỆU" ──────────────
// Biểu đồ trống vì lỗi quyền mà hiện y hệt biểu đồ trống vì tháng đó chưa có
// đơn thì người điều hành sẽ yên tâm nhầm. Hai trạng thái tách hẳn ra.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

/** Bảng màu lấy đúng dải màu đang dùng ở phần còn lại của hệ thống */
export const CHART_COLORS = ['#4f46e5', '#059669', '#e11d48', '#d97706', '#0891b2', '#7c3aed', '#64748b'];

const AXIS = { fontSize: 11, fill: '#64748b' } as const;

/** Recharts khai kiểu giá trị tooltip là ValueType | undefined (có thể là mảng
 *  khi một điểm gộp nhiều chuỗi). Chuẩn hoá về chuỗi số tiếng Việt ở một chỗ,
 *  không ép kiểu bừa ở từng biểu đồ. */
function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.map(fmtValue).join(' – ');
  const n = Number(v);
  return Number.isFinite(n) ? nf.format(n) : String(v);
}

export function ChartFrame({
  title,
  hint,
  error,
  isEmpty,
  emptyText,
  height = 240,
  children,
}: {
  title: string;
  hint?: string;
  error?: string | null;
  isEmpty?: boolean;
  emptyText?: string;
  height?: number;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">{title}</h3>
        {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
      </div>

      {error ? (
        <p role="alert" className="flex items-center justify-center px-2 text-center text-sm font-semibold text-rose-700" style={{ height }}>
          {error}
        </p>
      ) : isEmpty ? (
        <p className="flex items-center justify-center px-2 text-center text-sm text-slate-400" style={{ height }}>
          {emptyText ?? 'Chưa có số liệu để vẽ biểu đồ'}
        </p>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

/** Cột đơn — dùng cho "số lượng giao theo tháng" và "mốc trễ theo bộ phận" */
export function BarSeries({
  data,
  xKey,
  yKey,
  name,
  color = CHART_COLORS[0],
}: {
  data: ReadonlyArray<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
}) {
  return (
    <BarChart data={data as Record<string, string | number>[]} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" />
      <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v: number) => nf.format(v)} width={56} />
      <Tooltip
        formatter={(v) => [fmtValue(v), name]}
        contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
      />
      <Bar dataKey={yKey} name={name} fill={color} radius={[4, 4, 0, 0]} />
    </BarChart>
  );
}

/** Đường — dùng cho số đơn giao theo tháng, đọc xu hướng dễ hơn cột */
export function LineSeries({
  data,
  xKey,
  yKey,
  name,
  color = CHART_COLORS[1],
}: {
  data: ReadonlyArray<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
}) {
  return (
    <LineChart data={data as Record<string, string | number>[]} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" />
      <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
      <Tooltip
        formatter={(v) => [fmtValue(v), name]}
        contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
      />
      <Line type="monotone" dataKey={yKey} name={name} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />
    </LineChart>
  );
}

/** Tròn — dùng cho phân bố trạng thái NPL và mức rủi ro */
export function PieSeries({
  data,
  nameKey,
  valueKey,
  colors,
}: {
  data: ReadonlyArray<Record<string, string | number>>;
  nameKey: string;
  valueKey: string;
  colors?: ReadonlyArray<string>;
}) {
  const palette = colors ?? CHART_COLORS;
  return (
    <PieChart>
      <Pie
        data={data as Record<string, string | number>[]}
        dataKey={valueKey}
        nameKey={nameKey}
        innerRadius="45%"
        outerRadius="78%"
        paddingAngle={2}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={palette[i % palette.length]} />
        ))}
      </Pie>
      <Tooltip
        formatter={(v, n) => [fmtValue(v), String(n)]}
        contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
      />
      <Legend
        verticalAlign="bottom"
        height={28}
        wrapperStyle={{ fontSize: 11 }}
        formatter={(value: string) => <span style={{ color: '#475569' }}>{value}</span>}
      />
    </PieChart>
  );
}
