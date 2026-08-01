'use client';

import { AlertTriangle, CalendarDays, TrendingUp } from 'lucide-react';

import { useLanguage } from '@/lib/i18n';
import type { AssignmentDetailDTO } from '@/lib/mos/contracts/assignment.contract';

import { ReportStatusChip } from './assignment-chips';
import { REPORT_TONE } from './tone';

// ============================================================================
// CHI TIẾT PHẦN VIỆC — TIẾN ĐỘ VÀ LỊCH BÁO CÁO
//
// ⚠️ KHÔNG một phép tính nào ở đây. `progress` và `reporting` đã tính xong ở
// `calculators/` trước khi rời máy chủ; component chỉ ĐỊNH DẠNG và VẼ.
//
// Phép thử: mọi phép chia, mọi phép trừ ngày mà xuất hiện trong tệp này đều là
// dấu hiệu logic đã rơi sai tầng.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const pf = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 });

/**
 * ⚠️ `—` và `0` là hai chuyện khác hẳn nhau (chuẩn UI 4.1).
 *
 * `defectRate` bằng `null` nghĩa là **chưa sản xuất dòng nào**, không phải
 * "tỉ lệ lỗi 0%". Hiện `0%` ở đó sẽ được đọc là "chạy hoàn hảo", và nó sẽ leo
 * lên bảng xếp hạng đối tác — calculator trả `null` chính là để tránh điều đó,
 * và giao diện không được phá.
 */
const num = (v: number | null) => (v === null ? '—' : nf.format(v));
const pct = (v: number | null) => (v === null ? '—' : pf.format(v));

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="truncate text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-0.5 truncate text-lg font-bold tabular-nums text-slate-800">{value}</p>
      {hint && <p className="truncate text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function AssignmentDetailPanel({ a }: { a: AssignmentDetailDTO }) {
  const { t } = useLanguage();
  const { progress: p, reporting: r } = a;

  return (
    <div className="space-y-4">
      {/* ─── TIẾN ĐỘ ─────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <TrendingUp className="h-4 w-4 text-slate-400" />
          {t('asg_prog_output')}
        </h3>

        {p.reportedDays === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {t('asg_prog_none')}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat
              label={t('asg_prog_output')}
              value={num(p.outputQty)}
              hint={a.uom ?? undefined}
            />
            <Stat label={t('asg_prog_target')} value={num(p.targetQty)} />
            <Stat label={t('asg_prog_defect')} value={pct(p.defectRate)} />
            <Stat label={t('asg_prog_days')} value={String(p.reportedDays)} />
          </div>
        )}
      </section>

      {/* ─── LỊCH BÁO CÁO ────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {t('asg_overdue_title')}
          {r.overdueCount > 0 && (
            <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-xs font-bold tabular-nums text-white">
              {r.overdueCount}
            </span>
          )}
        </h3>

        {/* ⚠️ Danh sách BỊ CẮT phải được BÁO RA, không nuốt. Một lịch bị cắt
            lặng lẽ sẽ được đọc là "đã phủ hết ngày" — và những ngày trễ nằm sau
            điểm cắt biến mất khỏi tầm mắt. */}
        {r.truncated && (
          <p className="mb-2 flex items-start gap-1.5 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Khoảng ngày kế hoạch dài bất thường — lịch dưới đây đã bị cắt bớt.
              Hãy kiểm tra lại ngày bắt đầu và ngày kết thúc.
            </span>
          </p>
        )}

        {r.days.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {t('asg_no_overdue')}
          </p>
        ) : (
          <>
            {/* Dải ô vuông: mỗi ô một ngày. Mắt bắt được cụm ngày trễ trước cả
                khi đọc con số — và cụm liền nhau là tín hiệu khác hẳn với vài
                ngày lẻ rải rác. */}
            <div className="flex flex-wrap gap-1">
              {r.days.map((d) => (
                <span
                  key={d.date}
                  title={`${d.date} · ${t(`asg_rep_${d.status}` as never)}`}
                  className={`h-6 w-6 rounded ${
                    REPORT_TONE[d.status] === 'emerald' ? 'bg-emerald-400'
                    : REPORT_TONE[d.status] === 'amber' ? 'bg-amber-400'
                    : REPORT_TONE[d.status] === 'rose' ? 'bg-rose-500'
                    : 'bg-slate-200'}`}
                />
              ))}
            </div>

            {/* Chú giải — màu KHÔNG được đứng một mình (chuẩn UI: trạng thái
                luôn có icon + chữ). */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(['COMPLETE', 'PARTIAL', 'OVERDUE', 'NOT_STARTED'] as const).map((s) => (
                <ReportStatusChip key={s} status={s} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ─── SỔ CÁI ──────────────────────────────────────────────────── */}
      {a.reports.length > 0 && (
        <section>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <tbody className="divide-y divide-slate-100">
                {a.reports.map((rep) => (
                  <tr
                    key={rep.id}
                    // ⚠️ Bản đã bị đính chính vẫn HIỆN, nhưng mờ đi và gạch ngang.
                    // Ẩn hẳn là xoá lịch sử; hiện như bình thường là để người
                    // đọc cộng nhầm. Sổ cái giữ cả hai, và mắt phải phân biệt được.
                    className={rep.isCurrent ? '' : 'text-slate-400 line-through'}
                  >
                    <td className="px-2 py-1.5 tabular-nums">{rep.reportDate}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{num(rep.outputQty)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{num(rep.defectQty)}</td>
                    <td className="px-2 py-1.5 text-xs">
                      {rep.isCorrection && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
                          đính chính
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
