'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, CornerDownLeft, PackageSearch, Search, Shirt, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { PoRow, StyleRow, CustomerRow } from '@/schemas/md';
import { BIZ_TONE } from './semantic-tone';

// ============================================================================
// TÌM NHANH TOÀN CỤC — Ctrl+K
//
// ─── VÌ SAO TỰ DỰNG THAY VÌ KÉO THÊM THƯ VIỆN ──────────────────────────────
// Bảng lệnh chỉ cần bốn thứ: lọc chuỗi, di chuyển bằng phím mũi tên, Enter để
// chọn, Esc để đóng. Kéo cmdk về kèm theo cả cụm phụ thuộc của nó chỉ vì bốn
// hành vi này là không đáng, nhất là khi dự án đã cố ý không dùng shadcn.
//
// ─── TÌM TRÊN DỮ LIỆU ĐÃ CÓ SẴN TRONG BỘ NHỚ ──────────────────────────────
// PO, mã hàng và khách hàng đều đã nạp cho các tab. Gọi thêm truy vấn tìm kiếm
// cho mỗi phím gõ là vừa chậm vừa thừa. Đổi lại, danh sách chỉ tìm được trong
// phần đã nạp — nói rõ điều đó ở chân bảng thay vì để người dùng tự đoán.
//
// ─── BỎ DẤU KHI SO KHỚP ────────────────────────────────────────────────────
// Gõ "ao khoac" phải ra "Áo khoác". Người vận hành gõ nhanh thường bỏ dấu.
// ============================================================================

type Kind = 'PO' | 'STYLE' | 'CUSTOMER';

interface Item {
  kind: Kind;
  id: string;
  code: string;
  name: string;
  hint: string;
}

const KIND_META: Record<Kind, { icon: LucideIcon; label: string; chip: string }> = {
  PO: { icon: PackageSearch, label: 'Đơn hàng', chip: BIZ_TONE.SHIPPING.chip },
  STYLE: { icon: Shirt, label: 'Mã hàng', chip: BIZ_TONE.SAMPLE.chip },
  CUSTOMER: { icon: Building2, label: 'Khách hàng', chip: BIZ_TONE.MATERIAL.chip },
};

function deaccent(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export default function CommandPalette({
  open,
  onClose,
  pos,
  styles,
  customers,
  onPickPo,
  onPickStyle,
  onPickCustomer,
}: {
  open: boolean;
  onClose: () => void;
  pos: ReadonlyArray<PoRow>;
  styles: ReadonlyArray<StyleRow>;
  customers: ReadonlyArray<CustomerRow>;
  onPickPo: (orderId: string, poNumber: string) => void;
  onPickStyle: () => void;
  onPickCustomer: () => void;
}) {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo<Item[]>(() => {
    const all: Item[] = [
      ...pos.map((p) => ({
        kind: 'PO' as const,
        id: p.id,
        code: p.po_number,
        name: p.customer_name,
        hint: p.style_no ?? 'chưa gắn mã hàng',
      })),
      ...styles.map((s) => ({
        kind: 'STYLE' as const,
        id: s.id,
        code: s.style_no,
        name: s.style_name,
        hint: s.customer_name ?? 'chưa gắn khách hàng',
      })),
      ...customers.map((c) => ({
        kind: 'CUSTOMER' as const,
        id: c.id,
        code: c.customer_code,
        name: c.name,
        hint: c.country ?? '—',
      })),
    ];

    const kw = deaccent(q.trim());
    if (!kw) return all.slice(0, 12);

    return all
      .map((it) => {
        const code = deaccent(it.code);
        const name = deaccent(it.name);
        // Khớp từ đầu mã được ưu tiên: gõ "PO26" thì PO26xx phải lên trước một
        // mã hàng ngẫu nhiên có chứa "po26" ở giữa tên.
        const score = code.startsWith(kw) ? 0 : code.includes(kw) ? 1 : name.includes(kw) ? 2 : 3;
        return { it, score };
      })
      .filter((x) => x.score < 3)
      .sort((a, b) => a.score - b.score)
      .slice(0, 20)
      .map((x) => x.it);
  }, [q, pos, styles, customers]);

  // Mở lại là ô trống và con trỏ về đầu — giữ từ khoá cũ khiến người dùng
  // tưởng hệ thống không tìm thấy gì cho lần tra mới.
  useEffect(() => {
    if (!open) return;
    setQ('');
    setCursor(0);
    // Chờ một khung hình cho panel gắn vào DOM rồi mới đặt tiêu điểm
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [q]);

  // Cuộn dòng đang chọn vào tầm nhìn khi di chuyển bằng phím mũi tên
  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  const pick = (it: Item) => {
    onClose();
    if (it.kind === 'PO') onPickPo(it.id, it.code);
    else if (it.kind === 'STYLE') onPickStyle();
    else onPickCustomer();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[cursor];
      if (it) pick(it);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-slate-900/50 p-3 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tìm nhanh"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[70dvh] w-full min-w-0 max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tìm mã PO, mã hàng, khách hàng..."
            aria-label="Tìm nhanh"
            className="min-w-0 flex-1 bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            Không tìm thấy mục nào khớp &quot;{q}&quot;
          </p>
        ) : (
          <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-1">
            {items.map((it, i) => {
              const meta = KIND_META[it.kind];
              const Icon = meta.icon;
              const active = i === cursor;
              return (
                <li key={`${it.kind}-${it.id}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => pick(it)}
                    className={`flex w-full touch-manipulation items-center gap-3 px-3 py-2 text-left transition-colors ${
                      active ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.chip}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm font-bold text-slate-800">
                        {it.code}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {meta.label} · {it.name} · {it.hint}
                      </span>
                    </span>
                    {active && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="shrink-0 border-t border-slate-100 bg-slate-50/70 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
          <kbd className="rounded border border-slate-300 bg-white px-1 font-sans">↑</kbd>{' '}
          <kbd className="rounded border border-slate-300 bg-white px-1 font-sans">↓</kbd> di chuyển ·{' '}
          <kbd className="rounded border border-slate-300 bg-white px-1 font-sans">Enter</kbd> mở ·{' '}
          <kbd className="rounded border border-slate-300 bg-white px-1 font-sans">Esc</kbd> đóng.
          Chỉ tìm trong phần dữ liệu đã nạp ({pos.length} đơn, {styles.length} mã hàng,{' '}
          {customers.length} khách hàng).
        </p>
      </div>
    </div>
  );
}
