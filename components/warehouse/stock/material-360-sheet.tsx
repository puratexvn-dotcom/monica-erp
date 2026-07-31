'use client';

import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, History, Loader2, MapPin, Package } from 'lucide-react';

import Sheet from '@/components/sheet';
import { BIZ_TONE } from '@/components/md/semantic-tone';
import { listMovementsClient } from '@/app/(dashboard)/kho/_actions/wh.client';
import {
  MATERIAL_CATEGORY_LABEL, MOVEMENT_TYPE_LABEL, UOM_LABEL,
  labelOf, type MovementRow, type StockRow,
} from '@/schemas/warehouse';

// ============================================================================
// PANEL VẬT TƯ 360° (§8) — HIỂN THỊ LŨY TIẾN
//
// Bấm một dòng tồn kho là panel trượt ra, KHÔNG chuyển trang. Xử lý xong đóng
// lại là mắt đã ở sẵn chỗ cũ trong bảng, không phải định vị lại.
//
// Panel dùng lại `Sheet` chung của hệ thống nên tự có: Esc để đóng, khoá cuộn
// nền, trả tiêu điểm về nút vừa bấm, và bám biến --nav-h để không bị thanh điều
// hướng che mất phần dưới.
//
// Lịch sử biến động nạp KHI MỞ, không nạp sẵn theo bảng: bảng có 500 dòng thì
// nạp sẵn nghĩa là 500 lượt truy vấn cho thứ người dùng bấm vào một hai cái.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
const num = (n: number | null | undefined) => (n === null || n === undefined ? '—' : nf.format(n));

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'blue' | 'purple' | 'emerald' }) {
  const cls = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    purple: 'border-purple-200 bg-purple-50 text-purple-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }[tone];
  return (
    <div className={`rounded-xl border p-2.5 ${cls}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

export default function Material360Sheet({
  stock,
  onClose,
}: {
  stock: StockRow | null;
  onClose: () => void;
}) {
  const [moves, setMoves] = useState<MovementRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stock) {
      setMoves(null);
      setError(null);
      return;
    }
    let alive = true;
    setMoves(null);
    void listMovementsClient(stock.material_id).then((r) => {
      if (!alive) return;
      setMoves(r.rows);
      setError(r.error);
    });
    return () => {
      alive = false;
    };
  }, [stock]);

  if (!stock) return null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={stock.material_code}
      subtitle={stock.material_name}
    >
      <div className="space-y-4 p-4">
        {/* Ba con số tồn — luôn đi cùng nhau */}
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Tồn thực tế" value={num(stock.on_hand_qty)} tone="blue" />
          <Stat label="Đã giữ chỗ" value={num(stock.reserved_qty)} tone="purple" />
          <Stat label="Có sẵn" value={num(stock.available_qty)} tone="emerald" />
        </div>

        {/* Định vị trong kho */}
        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${BIZ_TONE.SHIPPING.chip}`}>
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Định vị trong kho</h3>
          </div>
          <p className="mt-2 font-mono text-sm font-bold text-slate-800">
            {stock.bin_path ?? 'Chưa xếp vị trí'}
          </p>
          {!stock.bin_path && (
            <p className="mt-1 text-[11px] text-amber-800">
              Hàng còn tồn nhưng chưa gán ô kệ — thủ kho sẽ không tìm ra khi cần lấy.
            </p>
          )}
        </section>

        {/* Thông số */}
        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${BIZ_TONE.MATERIAL.chip}`}>
              <Package className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Thông số vật tư</h3>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              ['Nhóm', labelOf(MATERIAL_CATEGORY_LABEL, stock.category)],
              ['Đơn vị tính', labelOf(UOM_LABEL, stock.uom)],
              ['Màu sắc', stock.color_code ?? '—'],
              ['Kích cỡ', stock.size_code ?? '—'],
              ['Lô', stock.lot_no ?? '—'],
              ['Nhà cung cấp', stock.supplier_name ?? '—'],
              ['Chờ kiểm', num(stock.in_inspection_qty)],
              ['Bị khoá', num(stock.blocked_qty)],
              [
                'Giá trị tồn',
                stock.stock_value === null
                  ? '— (chưa khai đơn giá)'
                  : `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(stock.stock_value)} ${stock.currency ?? ''}`,
              ],
              ['Tồn tối thiểu', num(stock.min_stock_qty)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="mt-0.5 truncate text-xs font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Dòng thời gian biến động (§16) */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 p-3">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${BIZ_TONE.PLANNING.chip}`}>
              <History className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
              Lịch sử nhập / xuất
            </h3>
          </div>

          {moves === null ? (
            <p className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tải lịch sử...
            </p>
          ) : error ? (
            <p role="alert" className="px-4 py-8 text-center text-xs font-semibold text-red-700">{error}</p>
          ) : moves.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-9 text-center">
              <History className="h-8 w-8 text-slate-200" strokeWidth={1.25} aria-hidden="true" />
              <p className="text-xs font-semibold text-slate-600">Chưa có biến động nào</p>
              <p className="max-w-[16rem] text-[11px] text-slate-400">
                Mọi lần nhập, xuất, điều chỉnh và chuyển kho đều được ghi lại tại đây.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {moves.map((m) => {
                const inbound = m.qty > 0;
                return (
                  <li key={m.id} className="flex items-start gap-2.5 px-3 py-2.5">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                        inbound ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inbound ? (
                        <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {labelOf(MOVEMENT_TYPE_LABEL, m.movement_type)}
                        {m.roll_code && <span className="ml-1.5 font-mono text-[10px] text-slate-400">{m.roll_code}</span>}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {fmtDateTime(m.created_at)}
                        {m.actor_name && ` · ${m.actor_name}`}
                        {m.to_path && ` · → ${m.to_path}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-bold tabular-nums ${inbound ? 'text-emerald-800' : 'text-amber-800'}`}
                    >
                      {inbound ? '+' : ''}{nf.format(m.qty)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Sheet>
  );
}
