'use client';

import { Layers, Palette, TriangleAlert } from 'lucide-react';

import RollChip from '@/components/warehouse/allocation/roll-chip';
import { useLanguage } from '@/lib/i18n';
import { blockReasonOf, type CutTicket, type ShadeGroup } from '@/schemas/warehouse/allocation.schema';

// ============================================================================
// BẢNG TÔNG MÀU — CỘT TRÁI
//
// Mỗi khối là một nhóm (tông màu × lô). Đây chính là ranh giới nghiệp vụ: vải
// cùng mã nhưng khác lô nhuộm là khác tông, cắt lẫn lên một bàn là lỗi KHÔNG
// SỬA ĐƯỢC sau khi đã cắt.
//
// ─── CUỘN CHƯA GÁN TÔNG ĐỨNG THÀNH NHÓM RIÊNG ────────────────────────────
// Không dồn vào một nhóm "khác". Chúng là rủi ro: ghép nhầm một cuộn không
// biết tông vào bàn cắt là đúng cái sai mà cả màn hình này sinh ra để chặn.
// Nhóm này viền hổ phách và có câu cảnh báo riêng.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

export default function ShadeBoard({
  groups,
  ticket,
  busyRollId,
  onAllocate,
  onRelease,
}: {
  groups: ShadeGroup[];
  /** Lệnh cắt đang chọn; null = chưa chọn nên chưa ghép được gì */
  ticket: CutTicket | null;
  busyRollId: string | null;
  onAllocate: (group: ShadeGroup, rollId: string, qtyM: number) => void;
  onRelease: (reservationId: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const unknownShade = g.shadeCode === null;
        return (
          <section
            key={`${g.shadeCode ?? ''}|${g.lotId ?? ''}`}
            className={`min-w-0 rounded-xl border p-3 ${
              unknownShade ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'
            }`}
          >
            <header className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  unknownShade ? 'bg-amber-200 text-amber-800' : 'bg-purple-100 text-purple-700'
                }`}
              >
                <Palette className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black tracking-tight text-slate-900">
                  {g.shadeCode ?? t('wh_shade_none')}
                </span>
                {g.lotNo && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Layers className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {t('wh_lot')} {g.lotNo}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-black tabular-nums text-emerald-700">
                  {nf.format(g.availableM)} m
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {g.rolls.length} {t('wh_al_rolls')} · {t('wh_al_available')}
                </span>
              </span>
            </header>

            {unknownShade && (
              <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-amber-100 px-2 py-1.5 text-[11px] font-semibold leading-relaxed text-amber-900">
                <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('wh_al_rule_shade')}
              </p>
            )}

            <ul className="space-y-1.5">
              {g.rolls.map((r) => (
                <RollChip
                  key={r.rollId}
                  roll={r}
                  // Chưa chọn lệnh cắt thì chưa ghép được — nhưng lý do đó KHÔNG
                  // phải lỗi của cuộn, nên không gắn nhãn chặn nào lên nó; nút
                  // chỉ mờ đi, còn câu nhắc chọn lệnh nằm ở đầu màn hình.
                  blocked={ticket ? blockReasonOf(r, g.shadeCode, ticket) : null}
                  disabled={ticket === null}
                  busy={busyRollId === r.rollId}
                  onAllocate={() => onAllocate(g, r.rollId, r.lengthM ?? 0)}
                  onRelease={() => r.reservationId && onRelease(r.reservationId)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
