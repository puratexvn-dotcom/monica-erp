'use client';

import { Check, Lock, Link2Off, Palette, ShieldAlert } from 'lucide-react';

import { useLanguage } from '@/lib/i18n';
import type { BlockReason, ShadeRoll } from '@/schemas/warehouse/allocation.schema';

// ============================================================================
// MỘT CUỘN VẢI TRÊN BẢNG TÔNG MÀU
//
// ─── VÌ SAO KHÔNG CHỈ LÀM MỜ NÚT KHI KHÔNG GHÉP ĐƯỢC ─────────────────────
// Nút mờ không nói vì sao. Thủ kho nhìn một cuộn còn 95 m nằm đó mà không bấm
// được sẽ đi hỏi người khác, hoặc tệ hơn là tự tìm cách lách. Mỗi lý do chặn
// có một câu giải thích và một biểu tượng riêng, đọc là hiểu ngay.
//
//   QA    — chưa đạt kiểm chất lượng
//   TAKEN — đã hứa cho lệnh cắt khác
//   SHADE — khác tông với lệnh đang chọn
//
// ─── ĐIỀU XX: 0 LÀ 0, KHÔNG ĐỌC ĐƯỢC LÀ "—" ─────────────────────────────
// Chiều dài null hiện dấu gạch. Một cuộn 0 m là cuộn đã dùng hết, còn một cuộn
// không đọc được chiều dài là dữ liệu hỏng — hai chuyện phải phân biệt.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

export default function RollChip({
  roll,
  blocked,
  disabled,
  busy,
  onAllocate,
  onRelease,
}: {
  roll: ShadeRoll;
  /** Lý do CUỘN NÀY không ghép được. null = cuộn hoàn toàn hợp lệ. */
  blocked: BlockReason;
  /** Chưa chọn lệnh cắt nên chưa thao tác được — KHÔNG phải lỗi của cuộn, nên
   *  chỉ làm mờ nút chứ tuyệt đối không gắn nhãn chặn nào lên nó. */
  disabled: boolean;
  busy: boolean;
  onAllocate: () => void;
  onRelease: () => void;
}) {
  const { t } = useLanguage();
  const mine = roll.reservationId !== null;

  const reason =
    blocked === 'QA' ? { text: t('wh_al_locked_qa'), Icon: ShieldAlert }
    : blocked === 'TAKEN' ? { text: t('wh_al_locked_other'), Icon: Lock }
    : blocked === 'SHADE' ? { text: t('wh_al_locked_shade'), Icon: Palette }
    : null;

  return (
    <li
      className={`flex min-w-0 flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2 transition ${
        mine
          ? 'border-emerald-300 bg-emerald-50'
          : blocked
            ? 'border-slate-200 bg-slate-50'
            : 'border-slate-200 bg-white hover:border-emerald-300'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-xs font-bold text-slate-800">
          {roll.rollCode}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
          <span className="tabular-nums font-semibold text-slate-700">
            {roll.lengthM === null ? '—' : `${nf.format(roll.lengthM)} m`}
          </span>
          {roll.widthM !== null && <span className="tabular-nums">× {nf.format(roll.widthM)} m</span>}
          {roll.score !== null && (
            <span className="tabular-nums">
              {nf.format(roll.score)} {t('wh_point_unit')}
            </span>
          )}
          {roll.qaStatus === 'CONDITIONAL' && (
            <span className="font-bold text-amber-700">{t('wh_qa_conditional')}</span>
          )}
        </span>
      </span>

      {reason && !mine && (
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-slate-500">
          <reason.Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{reason.text}</span>
        </span>
      )}

      {mine ? (
        <button
          type="button"
          onClick={onRelease}
          disabled={busy || disabled}
          // h-9 (36px) là mức tối thiểu tôi chấp nhận ở đây: danh sách này có thể
          // dài hàng chục cuộn, nút 44px sẽ đẩy nhóm dài gấp rưỡi và thủ kho phải
          // cuộn nhiều hơn. Cả dòng vẫn là vùng nhận diện, chỉ vùng bấm là nút.
          className="flex h-9 shrink-0 touch-manipulation items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 disabled:opacity-40"
        >
          <Link2Off className="h-3.5 w-3.5" aria-hidden="true" />
          {t('wh_al_release')}
        </button>
      ) : (
        <button
          type="button"
          onClick={onAllocate}
          disabled={busy || disabled || blocked !== null}
          title={reason?.text}
          className="flex h-9 shrink-0 touch-manipulation items-center gap-1 rounded-lg bg-emerald-700 px-3 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {t('wh_al_allocate')}
        </button>
      )}
    </li>
  );
}
