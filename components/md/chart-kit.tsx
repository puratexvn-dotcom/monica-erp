'use client';

import type { ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
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
export const CHART_COLORS = ['#2563eb', '#059669', '#e11d48', '#d97706', '#0891b2', '#0284c7', '#64748b'];

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

/** Hoạ tiết lưới mờ dùng làm nền cho ô biểu đồ trống.
 *  Vẽ bằng gradient của CSS thay vì ảnh: không thêm một lượt tải nào, và co
 *  giãn theo mọi kích thước ô mà không vỡ nét. */
const GRID_PATTERN: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, rgb(226 232 240 / 0.6) 1px, transparent 1px),' +
    'linear-gradient(to bottom, rgb(226 232 240 / 0.6) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
};

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
        <p
          role="alert"
          className="flex min-h-[200px] items-center justify-center rounded-lg bg-rose-50/60 px-3 text-center text-sm font-semibold text-rose-700"
          style={{ height }}
        >
          {error}
        </p>
      ) : isEmpty ? (
        // Ô TRỐNG THẤP HƠN Ô CÓ SỐ LIỆU (200px thay vì 240px trở lên): biểu đồ
        // rỗng giữ nguyên chiều cao đầy đủ sẽ để lại một mảng trắng chết chiếm
        // gần nửa màn hình mà không nói lên điều gì.
        //
        // Nền kẻ ô mờ cộng biểu tượng lớn cho biết "đây LÀ chỗ của biểu đồ,
        // chỉ là chưa có số liệu" — khác hẳn cảm giác trang bị lỗi render.
        <div
          className="relative flex min-h-[200px] flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 text-center"
          style={GRID_PATTERN}
        >
          <BarChart3 className="h-16 w-16 text-slate-200" strokeWidth={1.25} aria-hidden="true" />
          <p className="max-w-xs text-xs font-medium text-slate-400">
            {emptyText ?? 'Chưa có số liệu để vẽ biểu đồ'}
          </p>
        </div>
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

/**
 * Hai cột cạnh nhau — Kế hoạch vs Thực tế.
 *
 * ─── VÌ SAO THÊM MỚI CHỨ KHÔNG SỬA BarSeries ─────────────────────────────
 * `BarSeries` chỉ vẽ được MỘT chuỗi và đang phục vụ bốn biểu đồ khác của /md.
 * Nới nó ra thành nhiều chuỗi nghĩa là đổi chữ ký của một thứ đang chạy — luật
 * #9 của bản phê duyệt cấm làm mất tính ổn định. Đây là export MỚI, hoàn toàn
 * cộng thêm, không một dòng nào của phần cũ bị đụng.
 *
 * ─── VÌ SAO CỘT CHỨ KHÔNG PHẢI ĐƯỜNG ─────────────────────────────────────
 * Người đọc cần so SÁNH hai giá trị tại cùng một ngày, không cần đọc xu hướng.
 * Hai cột cạnh nhau cho phép nhìn ra chênh lệch bằng chiều cao; hai đường chồng
 * nhau thì phải dò mắt theo trục.
 */
export function TargetVsActualBars({
  data,
  xKey,
  targetKey,
  actualKey,
  targetName,
  actualName,
}: {
  data: ReadonlyArray<Record<string, string | number>>;
  xKey: string;
  targetKey: string;
  actualKey: string;
  targetName: string;
  actualName: string;
}) {
  return (
    <BarChart data={data as Record<string, string | number>[]} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" />
      <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v: number) => nf.format(v)} width={56} />
      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      {/* Kế hoạch xám nhạt làm nền, thực tế xanh đè lên: mắt bắt ngay chỗ cột
          xanh thấp hơn cột xám — đó chính là ngày hụt sản lượng. */}
      <Bar dataKey={targetKey} name={targetName} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
      <Bar dataKey={actualKey} name={actualName} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
    </BarChart>
  );
}
