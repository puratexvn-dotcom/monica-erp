'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CloudOff, Info, Layers, RefreshCw, Scissors } from 'lucide-react';
import { toast } from 'sonner';

import CutTicketBasket from '@/components/warehouse/allocation/cut-ticket-basket';
import ShadeBoard from '@/components/warehouse/allocation/shade-board';
import { inputCls } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';
import {
  allocateRollClient, getAllocationBoardClient, releaseReservationClient,
} from '@/app/(dashboard)/kho/_actions/wh.client';
import type {
  AllocationBoard, CutTicket, ShadeGroup,
} from '@/schemas/warehouse/allocation.schema';

// ============================================================================
// MÀN GIỮ CHỖ & PHÂN BỔ THEO TÔNG MÀU
//
// Bố cục hai cột: trái là kho vải xếp theo tông, phải là các lệnh cắt đang chờ.
// Người thủ kho chọn một lệnh, rồi bấm Ghép trên từng cuộn cùng tông.
//
// ─── ĐIỀU VII: BA LUẬT CHẶN KHÔNG NẰM Ở ĐÂY ──────────────────────────────
// Trigger wh_reservation_guard (migration 020) mới là nơi chặn. Phần làm mờ nút
// ở giao diện chỉ để người dùng biết TRƯỚC khi bấm, không phải hàng rào. Nếu
// hai bên có lệch thì cơ sở dữ liệu vẫn thắng, và người dùng nhận đúng câu báo
// lỗi từ đó — kèm tên cuộn và tên tông màu cụ thể.
//
// ─── VÌ SAO TẢI LẠI CẢ BẢNG SAU MỖI LẦN GHÉP ─────────────────────────────
// Ghép một cuộn làm đổi bốn con số cùng lúc: khả dụng của nhóm, số đã ghép của
// lệnh, tông màu lệnh đang dùng, và số khả dụng ở bảng tồn. Cập nhật cục bộ cho
// nhanh thì sẽ có lúc bốn con số đó lệch nhau. Một lượt đọc lại là rẻ hơn nhiều
// so với một con số sai trên màn hình kho.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

function Skeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]" aria-hidden="true">
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

const EMPTY: AllocationBoard = { materials: [], groups: [], tickets: [], error: null };

export default function AllocationPanel() {
  const { t } = useLanguage();

  const [board, setBoard] = useState<AllocationBoard>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [busyRollId, setBusyRollId] = useState<string | null>(null);

  const load = useCallback(async (mid: string | null) => {
    setLoading(true);
    const b = await getAllocationBoardClient(mid);
    setBoard(b);
    setLoading(false);
    return b;
  }, []);

  useEffect(() => {
    void (async () => {
      const b = await load(null);
      // Tự chọn vật tư đầu tiên: mở màn hình ra mà cột trái trống trơn thì người
      // dùng tưởng kho không có gì, dù thật ra chỉ là chưa chọn vật tư.
      if (b.materials.length > 0) {
        setMaterialId(b.materials[0].id);
        void load(b.materials[0].id);
      }
    })();
  }, [load]);

  const ticket = useMemo<CutTicket | null>(
    () => board.tickets.find((x) => x.id === ticketId) ?? null,
    [board.tickets, ticketId],
  );

  async function onAllocate(group: ShadeGroup, rollId: string, qtyM: number) {
    if (!ticket || !materialId) return;
    if (qtyM <= 0) {
      // Cuộn không đọc được chiều dài thì không ghép: giữ chỗ 0 m là một dòng
      // vô nghĩa làm sai luôn phép cộng "đã ghép" của lệnh cắt.
      toast.error(t('wh_al_error_allocate'), { description: t('wh_error_load') });
      return;
    }
    setBusyRollId(rollId);
    const res = await allocateRollClient({
      rollId, cutTicketId: ticket.id, materialId, lotId: group.lotId, qtyM,
    });
    setBusyRollId(null);
    if (!res.ok) {
      toast.error(t('wh_al_error_allocate'), { description: res.message });
      return;
    }
    toast.success(t('wh_al_allocated'), { description: `${ticket.ticketNo} · ${nf.format(qtyM)} m` });
    await load(materialId);
  }

  async function onRelease(reservationId: string) {
    if (!materialId) return;
    setBusyRollId(reservationId);
    const res = await releaseReservationClient(reservationId);
    setBusyRollId(null);
    if (!res.ok) {
      toast.error(t('wh_al_error_release'), { description: res.message });
      return;
    }
    toast.success(t('wh_al_released'));
    await load(materialId);
  }

  if (loading && board.materials.length === 0 && board.error === null) return <Skeleton />;

  return (
    <div className="min-w-0 space-y-4">
      {board.error && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-800">
          <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words">{t('wh_error_load')} — {board.error}</span>
          <button
            type="button"
            onClick={() => void load(materialId)}
            className="flex shrink-0 items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-1 font-bold text-rose-700 transition hover:bg-rose-100"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" /> {t('wh_retry')}
          </button>
        </div>
      )}

      {board.materials.length === 0 && !board.error ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
          <Layers className="h-8 w-8" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">{t('wh_al_no_material')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 sm:max-w-sm">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('wh_al_pick_material')}
              </span>
              <select
                value={materialId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setMaterialId(id);
                  void load(id);
                }}
                className={`${inputCls} w-full text-base sm:text-sm`}
              >
                {board.materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} · {m.name} ({m.rollCount})
                  </option>
                ))}
              </select>
            </label>

            {!ticket && board.tickets.length > 0 && (
              <p className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-800">
                <Scissors className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('wh_al_pick_ticket')}
              </p>
            )}
          </div>

          <p className="flex items-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
            <Info className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span>
              <strong className="font-bold text-slate-800">{t('wh_al_rules')}</strong>{' '}
              {t('wh_al_rule_qa')} {t('wh_al_rule_shade')} {t('wh_al_rule_once')}
            </span>
          </p>

          {/* Hai cột từ lg trở lên. Dưới lg xếp dọc: giỏ lệnh cắt LÊN TRƯỚC vì
              phải chọn lệnh rồi mới ghép được cuộn nào. */}
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
            <section className="order-2 min-w-0 lg:order-1">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-600">
                {t('wh_al_board')}
              </h3>
              {board.groups.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                  {t('wh_al_no_roll')}
                </p>
              ) : (
                <ShadeBoard
                  groups={board.groups}
                  ticket={ticket}
                  busyRollId={busyRollId}
                  onAllocate={(g, rollId, qty) => void onAllocate(g, rollId, qty)}
                  onRelease={(id) => void onRelease(id)}
                />
              )}
            </section>

            <section className="order-1 min-w-0 lg:order-2">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                {t('wh_al_basket')}
              </h3>
              <CutTicketBasket tickets={board.tickets} selectedId={ticketId} onSelect={setTicketId} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
