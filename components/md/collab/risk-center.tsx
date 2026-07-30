'use client';

import { useMemo, useState } from 'react';
import { Search, TriangleAlert } from 'lucide-react';

import { Badge, ProgressBar, inputCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { DataTable, tdCls, Metric, fmtDate, fmtNum } from '../po/tab-kit';
import { PO_STATUS_LABEL, RISK_LEVEL_LABEL, RISK_WEIGHTS, labelOf } from '../po/labels';
import type { RiskCenterRow } from '@/app/(dashboard)/md/_services/collaboration.service';

// ============================================================================
// TRUNG TÂM RỦI RO
//
// Sắp theo điểm giảm dần: đơn nguy hiểm nhất nằm trên cùng, không phải cuộn
// đi tìm. Điểm tổng là CỘT SINH TỰ ĐỘNG trong cơ sở dữ liệu theo trọng số cố
// định (NPL 35%, tiến độ 30%, chất lượng 20%, năng lực xưởng 15%) — giao diện
// chỉ hiển thị, không tự nhân lại, nên không thể lệch với báo cáo.
//
// Đây KHÔNG phải điểm do trí tuệ nhân tạo đoán. Bốn cấu phần do người chấm ở
// tab Rủi ro của từng đơn; công thức trọng số nằm nguyên văn trong migration.
// ============================================================================

function toneOf(level: string) {
  if (level === 'CRITICAL') return 'rose' as const;
  if (level === 'HIGH') return 'rose' as const;
  if (level === 'MEDIUM') return 'amber' as const;
  return 'emerald' as const;
}

export default function RiskCenter({
  rows,
  error,
  onRefresh,
}: {
  rows: RiskCenterRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
}) {
  const [q, setQ] = useState('');

  const stats = useMemo(() => {
    const by = (lvl: string) => rows.filter((r) => r.risk_level === lvl).length;
    const avg = rows.length > 0 ? rows.reduce((s, r) => s + r.total_score, 0) / rows.length : null;
    return {
      total: rows.length,
      critical: by('CRITICAL'),
      high: by('HIGH'),
      avg,
    };
  }, [rows]);

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.po_number, r.customer_name].filter(Boolean).some((v) => String(v).toLowerCase().includes(kw)),
    );
  }, [rows, q]);

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Đơn đã chấm điểm" value={fmtNum(stats.total)} />
        <Metric
          label="Mức nguy kịch"
          value={fmtNum(stats.critical)}
          tone={stats.critical > 0 ? 'rose' : 'emerald'}
          sub="điểm từ 70 trở lên"
        />
        <Metric
          label="Mức cao"
          value={fmtNum(stats.high)}
          tone={stats.high > 0 ? 'amber' : 'emerald'}
          sub="điểm từ 45 đến dưới 70"
        />
        <Metric
          label="Điểm trung bình"
          value={stats.avg === null ? '—' : fmtNum(Number(stats.avg.toFixed(1)))}
          sub={stats.avg === null ? 'chưa đơn nào được chấm' : 'trên thang 100'}
        />
      </div>

      <div className="relative mb-3 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm mã PO, khách hàng..."
          aria-label="Tìm đơn hàng theo rủi ro"
          className={`${inputCls} pl-9`}
        />
      </div>

      {shown.length === 0 ? (
        <NoData
          title={rows.length === 0 ? 'Chưa đơn nào được chấm điểm rủi ro' : 'Không có đơn nào khớp từ khoá'}
          sub={
            rows.length === 0
              ? 'Mở một đơn hàng, vào tab Rủi ro và chấm bốn cấu phần: nguyên phụ liệu, tiến độ, chất lượng, năng lực xưởng.'
              : undefined
          }
        />
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white">
            <DataTable
              head={['Mã PO', 'Khách hàng', 'Ngày giao', 'NPL', 'Tiến độ', 'Chất lượng', 'Năng lực', 'Điểm tổng', 'Mức', 'Trạng thái PO']}
              minWidth={1180}
            >
              {shown.map((r) => (
                <tr key={r.order_id} className="transition hover:bg-slate-50/70">
                  <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{r.po_number}</td>
                  <td className={tdCls}>{r.customer_name}</td>
                  <td className={tdCls}>{fmtDate(r.delivery_date)}</td>
                  <td className={`${tdCls} tabular-nums text-slate-600`}>{fmtNum(r.material_score)}</td>
                  <td className={`${tdCls} tabular-nums text-slate-600`}>{fmtNum(r.schedule_score)}</td>
                  <td className={`${tdCls} tabular-nums text-slate-600`}>{fmtNum(r.quality_score)}</td>
                  <td className={`${tdCls} tabular-nums text-slate-600`}>{fmtNum(r.capacity_score)}</td>
                  <td className={tdCls}>
                    <div className="w-28">
                      <span className="mb-1 block text-xs font-extrabold tabular-nums text-slate-900">
                        {fmtNum(r.total_score)}
                      </span>
                      <ProgressBar pct={Math.min(100, r.total_score)} tone={toneOf(r.risk_level)} />
                    </div>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={toneOf(r.risk_level)} icon={r.risk_level === 'CRITICAL' ? TriangleAlert : undefined}>
                      {labelOf(RISK_LEVEL_LABEL, r.risk_level)}
                    </Badge>
                  </td>
                  <td className={`${tdCls} text-xs`}>{labelOf(PO_STATUS_LABEL, r.status)}</td>
                </tr>
              ))}
            </DataTable>
          </div>

          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
            Công thức điểm tổng: nguyên phụ liệu {RISK_WEIGHTS.material * 100}% ·
            tiến độ {RISK_WEIGHTS.schedule * 100}% ·
            chất lượng {RISK_WEIGHTS.quality * 100}% ·
            năng lực xưởng {RISK_WEIGHTS.capacity * 100}%. Ngưỡng: từ 70 là Nguy kịch,
            từ 45 là Cao, từ 20 là Trung bình. Công thức và ngưỡng nằm trong cơ sở dữ liệu nên
            báo cáo và giao diện luôn ra cùng một con số.
          </p>
        </>
      )}
    </>
  );
}
