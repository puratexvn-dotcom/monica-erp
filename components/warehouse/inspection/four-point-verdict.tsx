'use client';

import { CheckCircle2, XCircle, HelpCircle, Lock } from 'lucide-react';

import { useLanguage } from '@/lib/i18n';
import type { FourPointResult } from '@/lib/mos/four-point';

// ============================================================================
// THẺ KẾT QUẢ CHẤM ĐIỂM
//
// Hiện ĐỦ đường đi của con số chứ không chỉ hiện kết luận: tổng điểm → diện
// tích → điểm/100 yd² → so với ngưỡng. Người kiểm phải đối chiếu được với phiếu
// giấy; chỉ đưa ra hai chữ ĐẠT/TRƯỢT là bắt họ tin mà không kiểm tra được.
//
// ─── VÌ SAO HIỆN CẢ HAI HỆ ĐƠN VỊ ────────────────────────────────────────
// Phiếu của nhà cung cấp nước ngoài ghi yard và inch; cuộn trong kho đo bằng
// mét. Hiện cả hai thì việc đối chiếu là nhìn một cái, không phải mở máy tính.
// Đây cũng là lớp bảo vệ cuối cùng trước cái bẫy đơn vị: nếu ai đó lỡ nhập số
// mét vào ô yard, dòng quy đổi sẽ hiện ra một con số vô lý ngay lập tức.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

/** Số hoặc dấu gạch. KHÔNG hiện 0 thay cho "chưa tính được". */
const show = (v: number | null): string => (v === null ? '—' : nf.format(v));

export default function FourPointVerdict({
  score,
  limitFromCustomer,
}: {
  score: FourPointResult;
  /** true = ngưỡng lấy từ hồ sơ khách hàng, false = mức mặc định nhà máy */
  limitFromCustomer: boolean;
}) {
  const { t } = useLanguage();

  const tone =
    score.verdict === 'PASSED'
      ? {
          card: 'border-emerald-200 bg-emerald-50',
          text: 'text-emerald-800',
          badge: 'bg-emerald-700 text-white',
          Icon: CheckCircle2,
          label: t('wh_passed'),
        }
      : score.verdict === 'FAILED'
        ? {
            card: 'border-rose-200 bg-rose-50',
            text: 'text-rose-800',
            badge: 'bg-rose-700 text-white',
            Icon: XCircle,
            label: t('wh_failed'),
          }
        : {
            card: 'border-slate-200 bg-slate-50',
            text: 'text-slate-700',
            badge: 'bg-slate-500 text-white',
            Icon: HelpCircle,
            label: t('wh_pending'),
          };

  const { Icon } = tone;

  return (
    <div className={`rounded-xl border p-4 ${tone.card}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Icon className={`h-5 w-5 shrink-0 ${tone.text}`} aria-hidden="true" />
        <span className={`text-xs font-bold uppercase tracking-wider ${tone.text}`}>
          {t('wh_verdict')}
        </span>
        <span className={`ml-auto rounded-lg px-3 py-1 text-sm font-black tracking-tight ${tone.badge}`}>
          {tone.label}
        </span>
      </div>

      {/* Bốn ô số xếp theo đúng thứ tự phép tính, đọc từ trái sang là ra công thức */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-[11px] font-semibold text-slate-600">{t('wh_total_points')}</dt>
          <dd className="text-lg font-black tabular-nums text-slate-900">{score.totalPoints}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold text-slate-600">{t('wh_area')}</dt>
          <dd className="text-lg font-black tabular-nums text-slate-900">
            {show(score.areaSqYd)} <span className="text-xs font-bold text-slate-500">yd²</span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold text-slate-600">{t('wh_score')}</dt>
          <dd className={`text-lg font-black tabular-nums ${tone.text}`}>
            {show(score.pointsPer100SqYd)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold text-slate-600">{t('wh_limit')}</dt>
          <dd className="text-lg font-black tabular-nums text-slate-900">
            {nf.format(score.limit)}
            <span className="ml-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {limitFromCustomer ? t('wh_limit_from_customer') : t('wh_limit_from_default')}
            </span>
          </dd>
        </div>
      </dl>

      {score.verdict === 'PENDING' && (
        <p className="mt-3 text-xs font-semibold text-slate-600">{t('wh_pending_hint')}</p>
      )}

      {score.lengthYd !== null && score.widthInch !== null && (
        <p className="mt-3 border-t border-slate-200/70 pt-2 text-[11px] font-semibold text-slate-600">
          {t('wh_as_yd_inch')}: {nf.format(score.lengthYd)} yd × {nf.format(score.widthInch)} inch
        </p>
      )}

      {score.verdict === 'FAILED' && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-rose-300 bg-white/70 p-2.5 text-[11px] font-semibold leading-relaxed text-rose-800">
          <Lock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('wh_fail_warning')}
        </p>
      )}
    </div>
  );
}
