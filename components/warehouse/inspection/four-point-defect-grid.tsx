'use client';

import { Minus, Plus } from 'lucide-react';

import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import type { DefectCounts } from '@/lib/mos/four-point';

// ============================================================================
// LƯỚI ĐẾM LỖI 4-POINT
//
// ─── VÌ SAO CÓ NÚT CỘNG/TRỪ CHỨ KHÔNG CHỈ Ô GÕ SỐ ────────────────────────
// Người kiểm đứng bên máy soi vải, một tay kéo vải một tay bấm. Mỗi lần thấy
// một vết lỗi là một nhát bấm — gõ số nghĩa là phải nhớ đang đếm tới đâu rồi
// sửa lại con số, vừa chậm vừa dễ nhầm. Ô gõ vẫn giữ để nhập nhanh khi chép
// lại từ phiếu giấy.
//
// Vùng chạm 44px theo khuyến nghị của WCAG — màn hình này dùng trên máy tính
// bảng đặt cạnh máy soi, thao tác bằng ngón tay chứ không phải chuột.
//
// ─── TRỌNG SỐ HIỆN NGAY TRÊN NÚT ─────────────────────────────────────────
// Nhóm 4 điểm nặng gấp bốn nhóm 1 điểm. Hiện "×4" ngay đó để người kiểm thấy
// một vết lỗi dài đắt hơn hẳn bốn vết ngắn, thay vì phải nhớ bảng trọng số.
// ============================================================================

interface Band {
  field: keyof DefectCounts;
  labelKey: DictionaryKey;
  weight: 1 | 2 | 3 | 4;
  /** Đậm dần theo mức nghiêm trọng — cùng hệ hổ phách, không đổi sắc lung tung */
  tone: string;
}

const BANDS: readonly Band[] = [
  { field: 'p1', labelKey: 'wh_defect_p1', weight: 1, tone: 'border-amber-200 bg-amber-50' },
  { field: 'p2', labelKey: 'wh_defect_p2', weight: 2, tone: 'border-amber-300 bg-amber-100/70' },
  { field: 'p3', labelKey: 'wh_defect_p3', weight: 3, tone: 'border-orange-300 bg-orange-100/70' },
  { field: 'p4', labelKey: 'wh_defect_p4', weight: 4, tone: 'border-rose-300 bg-rose-100/70' },
];

export default function FourPointDefectGrid({
  value,
  onChange,
  disabled = false,
}: {
  value: DefectCounts;
  onChange: (next: DefectCounts) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();

  const set = (field: keyof DefectCounts, next: number) => {
    // Chặn số âm tại chỗ. Để lọt xuống lược đồ rồi mới báo lỗi thì người kiểm
    // đã bấm thêm mấy nhát nữa mới biết mình sai.
    onChange({ ...value, [field]: Math.max(0, Math.round(next) || 0) });
  };

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
        {t('wh_defects')}
      </legend>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {BANDS.map((b) => {
          const n = value[b.field];
          return (
            <div key={b.field} className={`rounded-xl border p-3 ${b.tone}`}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-bold leading-tight text-slate-700">
                  {t(b.labelKey)}
                </span>
                <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-black tabular-nums text-slate-600">
                  ×{b.weight}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => set(b.field, n - 1)}
                  aria-label={`${t(b.labelKey)} −1`}
                  className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-slate-400 active:scale-95 disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>

                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={n}
                  onChange={(e) => set(b.field, Number(e.target.value))}
                  aria-label={t(b.labelKey)}
                  // text-base ở màn hẹp: dưới 16px là Safari trên iOS tự phóng
                  // to cả trang mỗi lần chạm vào ô nhập.
                  className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white text-center text-base font-black tabular-nums text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-sm"
                />

                <button
                  type="button"
                  onClick={() => set(b.field, n + 1)}
                  aria-label={`${t(b.labelKey)} +1`}
                  className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-slate-400 active:scale-95"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <p className="mt-1.5 text-right text-[11px] font-bold tabular-nums text-slate-600">
                {n * b.weight} {t('wh_point_unit')}
              </p>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
