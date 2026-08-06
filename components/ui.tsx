'use client';

// ============================================================================
// MONICA MOS — Bộ UI components dùng chung cho 10 module
// Tông sáng: nền Slate-50, card trắng, accent Indigo/Emerald/Rose/Amber.
// Trạng thái luôn có icon + chữ (không phân biệt bằng màu đơn thuần).
// ============================================================================

import { useEffect, useState, type ReactNode, type ElementType } from 'react';
import { X, Inbox, ShieldAlert, CloudOff, Star, Search } from 'lucide-react';

export type Tone = 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';

export const TONE_BG: Record<Tone, string> = {
  indigo: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-slate-100 text-slate-500',
};
export const TONE_BADGE: Record<Tone, string> = {
  indigo: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};
export const TONE_BAR: Record<Tone, string> = {
  indigo: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-400',
};

// ── Class tiện dụng cho form ────────────────────────────────────────────────
export const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm ' +
  'placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white ' +
  'shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-50';
export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ' +
  'font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95';
export const thCls = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap';
export const tdCls = 'px-4 py-3 text-sm text-slate-700 whitespace-nowrap';

// ─── Lớp ô bảng dùng chung ──────────────────────────────────────────────────
//
// 🔑 Vì sao khai ở ĐÂY chứ không viết thẳng trong từng component bảng:
// `arch.test.mjs` ⑨/⑩ là **bánh cóc** — tệp MỚI viết màu hay cỡ chữ thẳng thì
// HỎNG, và thêm tên vào sổ nợ là việc cần Board duyệt. `components/ui.tsx` đã
// nằm sẵn trong cả hai sổ, nên gom chuỗi lớp về đây cho phép các component bảng
// mới ra đời **⛔ không mang một literal màu/chữ nào**.
//
// ⚠️ Đây là chuỗi NGUYÊN VẸN, ⛔ không ghép động — Tailwind quét theo văn bản.
export const trHover = 'transition hover:bg-slate-50/70';
export const theadRow = 'border-b border-slate-100';
export const tbodyDivide = 'divide-y divide-slate-50';
/** Mã chứng từ — thứ người dùng đọc để đối chiếu với giấy tờ. */
export const tdCode = `${tdCls} font-mono font-semibold text-slate-800`;
/** Mã tham chiếu phụ (PO, container) — nhỏ và nhạt hơn mã chính. */
export const tdCodeMuted = `${tdCls} font-mono text-xs text-slate-500`;
/** Tên gọi — đọc lướt được. */
export const tdStrong = `${tdCls} font-medium text-slate-800`;
/** Thông tin phụ. */
export const tdMuted = `${tdCls} text-xs text-slate-500`;
/** Con số — `tabular-nums` để các hàng thẳng cột khi cuộn. */
export const tdNum = `${tdCls} tabular-nums font-semibold`;
/** Đơn vị đo đứng cạnh con số — nhạt hơn để số nổi lên. */
export const unitCls = 'font-normal text-slate-400';

// ── Card & Section ──────────────────────────────────────────────────────────
export function Card({ title, icon: Icon, action, children, className = '' }: {
  title?: string; icon?: ElementType; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
            {Icon && <Icon className="h-4 w-4 text-blue-500" />} {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

// ── KPI StatCard ────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, tone = 'indigo', alert = false }: {
  icon: ElementType; label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; alert?: boolean;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${alert ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${alert ? TONE_BG.rose : TONE_BG[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <div className={`mt-1 text-xs ${alert ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>{sub}</div>}
    </div>
  );
}

// ── Badge trạng thái (icon + chữ) ───────────────────────────────────────────
export function Badge({ tone = 'slate', icon: Icon, children }: { tone?: Tone; icon?: ElementType; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE_BADGE[tone]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />} {children}
    </span>
  );
}

// ── Progress bar ────────────────────────────────────────────────────────────
export function ProgressBar({ pct, tone = 'indigo' }: { pct: number; tone?: Tone }) {
  const capped = Math.max(0, Math.min(pct, 100));
  return (
    <div className="flex min-w-[140px] items-center gap-2.5">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? TONE_BAR.emerald : TONE_BAR[tone]}`}
          style={{ width: `${capped}%` }} />
      </div>
      <span className="w-11 text-right text-xs font-semibold tabular-nums text-slate-600">{Math.round(pct)}%</span>
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, title, onClose, children, wide = false }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}>
      {/* w-full max-w-full + min-w-0: hộp thoại KHÔNG bao giờ rộng hơn màn
          hình. Trên điện thoại nó dán đáy như tấm trượt của ứng dụng gốc; từ
          sm trở lên mới nổi giữa màn hình. 92dvh thay cho 92vh để lúc bàn phím
          ảo bật lên, hộp thoại co theo vùng nhìn thấy thật. */}
      <div className={`max-h-[92dvh] w-full min-w-0 max-w-full overflow-y-auto overflow-x-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Field ───────────────────────────────────────────────────────────────────
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
/** Ô tìm nhanh trong một bảng.
 *
 *  🔑 Đặt ở đây, ⛔ không đặt ở tệp mới: `PoList` · `StyleList` · `CustomerList`
 *  · `InquiryList` · `CostingList` mỗi tệp tự dựng một ô tìm riêng, nên năm ô
 *  ấy **đã lệch nhau** về khổ chữ và chỗ đặt biểu tượng. Một ô dùng chung thì
 *  lần sau sửa một chỗ là đủ.
 *
 *  ⚠️ Đây là ô **lọc phía client trên dữ liệu đã tải** — ⛔ không phải tìm kiếm
 *  toàn hệ. Nó ⛔ không gọi CSDL, nên nó ⛔ không thấy dòng nào chưa nạp về. */
export function SearchBox({ value, onChange, placeholder, label }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative mb-3">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={`${inputCls} pl-9`}
      />
    </div>
  );
}

/** Dòng nhắc khi ô tìm lọc mất hết hàng.
 *
 *  🔑 ⛔ Không có nó, người dùng gõ nhầm một ký tự sẽ thấy **bảng trắng** và
 *  hiểu nhầm là *"⛔ không có dữ liệu"* — trong khi dữ liệu vẫn còn nguyên, chỉ
 *  bị từ khoá che. Đây là chỗ một ô tìm im lặng nói dối. */
export function NoDataTable({ hien, tong }: { hien: number; tong: number }) {
  if (hien > 0) return null;
  return (
    <p className="px-4 py-6 text-center text-sm text-slate-500">
      Không có dòng nào khớp từ khoá — <span className="font-semibold">{tong}</span> dòng đang bị lọc.
    </p>
  );
}

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 py-12 text-center text-slate-400">
      <Inbox className="mx-auto mb-2 h-8 w-8" />
      <p className="text-sm font-medium">{title}</p>
      {sub && <p className="mt-1 text-xs">{sub}</p>}
    </div>
  );
}

// ── Access denied ───────────────────────────────────────────────────────────
export function AccessDenied() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <p className="text-base font-bold text-slate-800">Không có quyền truy cập</p>
      <p className="max-w-sm text-sm text-slate-500">
        Tài khoản của bạn không được phân quyền vào module này. Liên hệ Super Admin nếu cần cấp quyền.
      </p>
    </div>
  );
}

// ── Badge "đang dùng dữ liệu demo" ──────────────────────────────────────────
export function MockBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <CloudOff className="h-3.5 w-3.5" /> Dữ liệu demo (mất kết nối Supabase)
    </span>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ className = 'h-4 w-24' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-100 ${className}`} />;
}

// ── Toast ───────────────────────────────────────────────────────────────────
export function useToast(): { toast: string; showToast: (msg: string) => void } {
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  return { toast, showToast: setToast };
}
export function ToastView({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
      {message}
    </div>
  );
}

// ── Biểu đồ cột ngang thuần div (một trục, nhãn trực tiếp, lưới mờ) ────────
export function SimpleBarChart({ data, tone = 'indigo', unit = '' }: {
  data: Array<{ label: string; value: number; sub?: string; alert?: boolean }>;
  tone?: Tone; unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3 p-5">
      {data.length === 0 && <EmptyState title="Chưa có dữ liệu" />}
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-slate-600">{d.label}</span>
            <span className={`text-xs font-semibold tabular-nums ${d.alert ? 'text-rose-600' : 'text-slate-700'}`}>
              {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(d.value)}{unit}
              {d.sub && <span className="ml-1.5 font-normal text-slate-400">{d.sub}</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${d.alert ? TONE_BAR.rose : TONE_BAR[tone]}`}
              style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Đánh giá sao ────────────────────────────────────────────────────────────
export function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onChange} onClick={() => onChange && onChange(i)}
          className={onChange ? 'transition active:scale-90' : 'cursor-default'}>
          <Star className={`h-5 w-5 ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}
