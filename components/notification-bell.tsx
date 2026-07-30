'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertOctagon, Bell, CalendarClock, ClipboardList, Loader2, Package, ShieldCheck, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { getNotifications, type Notification } from '@/app/actions/notifications';
import { BIZ_TONE, type BizDomain } from '@/components/md/semantic-tone';

// ============================================================================
// CHUÔNG CẢNH BÁO LIÊN BỘ PHẬN
//
// ─── VÌ SAO NẠP KHI MỞ, KHÔNG NẠP SẴN ─────────────────────────────────────
// Chuông có mặt ở cả mười hai phân hệ. Nạp sẵn nghĩa là mỗi lần mở BẤT KỲ
// trang nào cũng tốn năm truy vấn cho một thứ người dùng có thể không bấm tới.
// Con số trên chuông vì vậy chỉ hiện SAU lần mở đầu tiên — thà chưa hiện còn
// hơn hiện một con số cũ từ mười phút trước.
//
// ─── VÌ SAO KHÔNG DÙNG <dialog> HAY LỚP PHỦ TOÀN MÀN ──────────────────────
// Đây là danh sách liếc nhanh rồi đóng, không phải nơi làm việc. Lớp phủ toàn
// màn hình cho một danh sách năm dòng là quá tay; một tấm thả xuống neo vào
// chuông đúng với kỳ vọng của người dùng hơn.
// ============================================================================

const KIND_META: Record<Notification['kind'], { icon: LucideIcon; domain: BizDomain }> = {
  SCHEDULE: { icon: CalendarClock, domain: 'PLANNING' },
  MATERIAL: { icon: Package, domain: 'MATERIAL' },
  CHANGE: { icon: ClipboardList, domain: 'SHIPPING' },
  RISK: { icon: AlertOctagon, domain: 'QUALITY' },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    void getNotifications().then((f) => {
      setItems(f.items);
      setCount(f.count);
      setError(f.error);
      setLoading(false);
    });
  }, []);

  // Bấm ra ngoài hoặc Esc thì đóng — hành vi mặc định của mọi tấm thả xuống
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((v) => {
      if (!v && items === null) load();
      return !v;
    });
  };

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-label={count === null ? 'Cảnh báo' : `Cảnh báo: ${count} mục`}
        aria-expanded={open}
        className="relative flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {count !== null && count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold tabular-nums text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Trung tâm cảnh báo"
          className="absolute right-0 z-[105] mt-2 flex max-h-[70dvh] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-2.5">
            <Bell className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <h3 className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wide text-slate-700">
              Cảnh báo liên bộ phận
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading && items === null ? (
            <p className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tổng hợp...
            </p>
          ) : error ? (
            <p role="alert" className="px-4 py-8 text-center text-xs font-semibold text-red-700">{error}</p>
          ) : !items || items.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-9 text-center">
              <ShieldCheck className="h-8 w-8 text-emerald-200" strokeWidth={1.25} aria-hidden="true" />
              <p className="text-xs font-semibold text-emerald-700">Không có cảnh báo nào</p>
              <p className="max-w-[15rem] text-[11px] text-slate-400">
                Theo dõi mốc đường găng trễ từ 3 ngày, NPL trễ từ 3 ngày, yêu cầu thay đổi chờ
                duyệt và đơn ở mức Nguy kịch.
              </p>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-slate-50 overflow-y-auto">
              {items.map((n) => {
                const meta = KIND_META[n.kind];
                const Icon = meta.icon;
                return (
                  <li key={n.id} className="flex items-start gap-2.5 px-3 py-2.5">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${BIZ_TONE[meta.domain].chip}`}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-800">{n.title}</span>
                      <span className="block truncate text-[11px] text-slate-500">{n.detail}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-red-800">
                      {n.metric}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="shrink-0 touch-manipulation border-t border-slate-100 py-2 text-[11px] font-bold text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
          >
            {loading ? 'Đang tải...' : 'Tải lại cảnh báo'}
          </button>
        </div>
      )}
    </div>
  );
}
