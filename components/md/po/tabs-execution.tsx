'use client';

import { useMemo } from 'react';
import { TriangleAlert, FileText, MessageSquare, ShieldCheck } from 'lucide-react';

import { Badge, ProgressBar } from '@/components/ui';
import { TabSection, DataTable, tdCls, Metric, StatusBadge, fmtDate, fmtNum } from './tab-kit';
import type { Po360Data } from '@/app/(dashboard)/md/_services/po.service';
import {
  RISK_LEVEL_LABEL, DOC_TYPE_LABEL, TASK_STATUS_LABEL, RISK_WEIGHTS,
  ROLE_LABEL_SAFE, labelOf, riskLevelOf,
} from './labels';

// ============================================================================
// NĂM TAB SAU CỦA PO 360°:
// Tiến độ sản xuất · Chất lượng · Đóng gói & Xuất hàng · Rủi ro · Thảo luận
// ============================================================================

// ─── 6. TIẾN ĐỘ SẢN XUẤT ────────────────────────────────────────────────────
export function TabProduction({ data }: { data: Po360Data }) {
  const total = data.header?.total_quantity ?? 0;

  // Gom theo chuyền. Bảng log theo giờ có thể lên hàng nghìn dòng; người quản
  // lý cần biết CHUYỀN NÀO đang chạy tới đâu, không phải đọc từng dòng giờ.
  const byLine = useMemo(() => {
    const m = new Map<string, { target: number; actual: number; days: Set<string> }>();
    for (const p of data.production) {
      const key = p.line_name ?? 'Chưa gán chuyền';
      const cur = m.get(key) ?? { target: 0, actual: 0, days: new Set<string>() };
      cur.target += p.target_qty;
      cur.actual += p.actual_qty;
      cur.days.add(p.log_date);
      m.set(key, cur);
    }
    return [...m.entries()].map(([line, v]) => ({
      line,
      target: v.target,
      actual: v.actual,
      days: v.days.size,
      eff: v.target > 0 ? (v.actual / v.target) * 100 : 0,
    }));
  }, [data.production]);

  const sewn = byLine.reduce((s, l) => s + l.actual, 0);
  const wip = Math.max(0, total - sewn);
  const pct = total > 0 ? (sewn / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Kế hoạch" value={fmtNum(total)} sub="sản phẩm" />
        <Metric label="Đã ra chuyền" value={fmtNum(sewn)} sub={`${pct.toFixed(1)}%`} tone="indigo" />
        <Metric label="Còn lại (WIP)" value={fmtNum(wip)} tone={wip > 0 ? 'amber' : 'emerald'} />
        <Metric label="Số chuyền tham gia" value={fmtNum(byLine.length)} />
      </div>

      <TabSection
        title="Sản lượng theo chuyền"
        error={data.errors.production}
        isEmpty={byLine.length === 0}
        emptyTitle="Chưa có sản lượng ghi nhận"
        emptyHint="Số liệu lên đây khi tổ trưởng May khai báo sản lượng theo giờ."
      >
        <DataTable head={['Chuyền', 'Số ngày chạy', 'Kế hoạch', 'Thực tế', 'Hiệu suất']} minWidth={640}>
          {byLine.map((l) => (
            <tr key={l.line} className="transition hover:bg-slate-50/70">
              <td className={`${tdCls} font-medium text-slate-800`}>{l.line}</td>
              <td className={`${tdCls} tabular-nums text-slate-500`}>{l.days}</td>
              <td className={`${tdCls} tabular-nums`}>{fmtNum(l.target)}</td>
              <td className={`${tdCls} tabular-nums font-semibold`}>{fmtNum(l.actual)}</td>
              <td className={tdCls}>
                <ProgressBar pct={l.eff} tone={l.eff >= 95 ? 'emerald' : l.eff >= 80 ? 'indigo' : 'rose'} />
              </td>
            </tr>
          ))}
        </DataTable>
      </TabSection>
    </div>
  );
}

// ─── 7. CHẤT LƯỢNG ──────────────────────────────────────────────────────────
export function TabQuality({ data }: { data: Po360Data }) {
  const inspected = data.quality.reduce((s, q) => s + q.inspected_qty, 0);
  const passed = data.quality.reduce((s, q) => s + q.passed_qty, 0);
  const defects = data.quality.reduce((s, q) => s + q.defect_qty, 0);

  // Tỷ lệ đạt ngay lần đầu (RFT). Trả null khi chưa kiểm cái nào — hiện 0%
  // sẽ khiến người đọc tưởng hàng hỏng hết.
  const rft = inspected > 0 ? (passed / inspected) * 100 : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Đã kiểm" value={fmtNum(inspected)} sub="sản phẩm" />
        <Metric label="Đạt" value={fmtNum(passed)} tone="emerald" />
        <Metric label="Lỗi" value={fmtNum(defects)} tone={defects > 0 ? 'rose' : 'emerald'} />
        <Metric
          label="Tỷ lệ đạt (RFT)"
          value={rft === null ? '—' : `${rft.toFixed(1)}%`}
          sub={rft === null ? 'chưa kiểm lô nào' : undefined}
          tone={rft === null ? 'slate' : rft >= 95 ? 'emerald' : 'rose'}
        />
      </div>

      <TabSection
        title="Biên bản kiểm chất lượng"
        error={data.errors.quality}
        isEmpty={data.quality.length === 0}
        emptyTitle="Chưa có biên bản kiểm"
        emptyHint="Biên bản lên đây khi QA/QC ghi nhận kết quả kiểm theo chuyền."
      >
        <DataTable head={['Ngày kiểm', 'Chuyền', 'Đã kiểm', 'Đạt', 'Lỗi', 'Tỷ lệ đạt']} minWidth={640}>
          {data.quality.map((q, i) => {
            const r = q.inspected_qty > 0 ? (q.passed_qty / q.inspected_qty) * 100 : 0;
            return (
              <tr key={`${q.line_name}-${i}`} className="transition hover:bg-slate-50/70">
                <td className={tdCls}>{fmtDate(q.created_at)}</td>
                <td className={`${tdCls} font-medium text-slate-800`}>{q.line_name}</td>
                <td className={`${tdCls} tabular-nums`}>{fmtNum(q.inspected_qty)}</td>
                <td className={`${tdCls} tabular-nums text-emerald-700`}>{fmtNum(q.passed_qty)}</td>
                <td className={`${tdCls} tabular-nums text-rose-600`}>{fmtNum(q.defect_qty)}</td>
                <td className={tdCls}>
                  <Badge tone={r >= 95 ? 'emerald' : 'rose'}>{r.toFixed(1)}%</Badge>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </TabSection>
    </div>
  );
}

// ─── 8. ĐÓNG GÓI & XUẤT HÀNG ────────────────────────────────────────────────
export function TabPacking({ data }: { data: Po360Data }) {
  const total = data.header?.total_quantity ?? 0;
  const packedPcs = data.packing.reduce((s, c) => s + c.quantity_per_carton, 0);
  const grossKg = data.packing.reduce((s, c) => s + Number(c.gross_weight_kg ?? 0), 0);
  const pct = total > 0 ? (packedPcs / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Số thùng" value={fmtNum(data.packing.length)} />
        <Metric label="Đã đóng" value={fmtNum(packedPcs)} sub={`${pct.toFixed(1)}% đơn hàng`} tone="indigo" />
        <Metric label="Tổng trọng lượng" value={`${fmtNum(grossKg)} kg`} />
        <Metric label="Lệnh giao hàng" value={fmtNum(data.shipments.length)} />
      </div>

      <TabSection
        title="Lịch tàu & vận đơn"
        error={data.errors.shipments}
        isEmpty={data.shipments.length === 0}
        emptyTitle="Chưa lập lệnh giao hàng"
        emptyHint="Lệnh giao hàng lập ở tab Giao hàng của phân hệ Merchandiser."
      >
        <DataTable head={['Số lệnh', 'Container', 'Tàu', 'Cảng đến', 'Ngày rời cảng', 'Trạng thái']} minWidth={760}>
          {data.shipments.map((s) => (
            <tr key={s.shipment_no} className="transition hover:bg-slate-50/70">
              <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{s.shipment_no}</td>
              <td className={`${tdCls} font-mono text-xs`}>{s.container_no ?? '—'}</td>
              <td className={tdCls}>{s.vessel_name ?? '—'}</td>
              <td className={tdCls}>{s.destination_port ?? '—'}</td>
              <td className={tdCls}>{fmtDate(s.etd_date)}</td>
              <td className={tdCls}>
                <Badge tone={s.status === 'DRAFT' ? 'amber' : 'indigo'}>{s.status}</Badge>
              </td>
            </tr>
          ))}
        </DataTable>
      </TabSection>

      <TabSection
        title="Chi tiết thùng hàng"
        error={data.errors.packing}
        isEmpty={data.packing.length === 0}
        emptyTitle="Chưa đóng thùng nào"
      >
        <DataTable head={['Mã thùng', 'Màu', 'Size', 'SL/thùng', 'Trọng lượng', 'Trạng thái']} minWidth={640}>
          {data.packing.slice(0, 100).map((c) => (
            <tr key={c.carton_code} className="transition hover:bg-slate-50/70">
              <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{c.carton_code}</td>
              <td className={tdCls}>{c.color_code}</td>
              <td className={tdCls}>{c.size_code}</td>
              <td className={`${tdCls} tabular-nums`}>{fmtNum(c.quantity_per_carton)}</td>
              <td className={`${tdCls} tabular-nums`}>{c.gross_weight_kg ? `${c.gross_weight_kg} kg` : '—'}</td>
              <td className={tdCls}>
                <Badge tone={c.status === 'PACKED' ? 'amber' : 'emerald'}>{c.status}</Badge>
              </td>
            </tr>
          ))}
        </DataTable>
        {data.packing.length > 100 && (
          <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
            Hiển thị 100/{data.packing.length} thùng đầu tiên.
          </p>
        )}
      </TabSection>
    </div>
  );
}

// ─── 9. RỦI RO ──────────────────────────────────────────────────────────────
export function TabRisk({ data }: { data: Po360Data }) {
  const r = data.risk;

  const parts = r
    ? [
        { key: 'Nguyên phụ liệu', score: Number(r.material_score), weight: RISK_WEIGHTS.material },
        { key: 'Tiến độ', score: Number(r.schedule_score), weight: RISK_WEIGHTS.schedule },
        { key: 'Chất lượng', score: Number(r.quality_score), weight: RISK_WEIGHTS.quality },
        { key: 'Năng lực xưởng', score: Number(r.capacity_score), weight: RISK_WEIGHTS.capacity },
      ]
    : [];

  const total = r ? Number(r.total_score) : null;
  const level = total === null ? null : riskLevelOf(total);
  const tone = level === 'CRITICAL' || level === 'HIGH' ? 'rose' : level === 'MEDIUM' ? 'amber' : 'emerald';

  return (
    <div className="space-y-4">
      <TabSection
        title="Điểm rủi ro tổng hợp"
        error={data.errors.risk}
        isEmpty={!r}
        emptyTitle="Chưa chấm điểm rủi ro cho đơn này"
        emptyHint="Điểm tính theo công thức trọng số: NPL 35% · Tiến độ 30% · Chất lượng 20% · Năng lực xưởng 15%."
      >
        <div className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-4xl font-black tabular-nums tracking-tight text-slate-900">
              {total === null ? '—' : total.toFixed(1)}
            </span>
            <span className="text-sm text-slate-400">/ 100</span>
            {level && (
              <Badge tone={tone} icon={tone === 'rose' ? TriangleAlert : ShieldCheck}>
                Mức rủi ro: {RISK_LEVEL_LABEL[level]}
              </Badge>
            )}
            {r?.computed_at && (
              <span className="ml-auto text-xs text-slate-400">Cập nhật {fmtDate(r.computed_at)}</span>
            )}
          </div>

          <div className="space-y-3">
            {parts.map((p) => (
              <div key={p.key}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700">
                    {p.key}{' '}
                    <span className="font-normal text-slate-400">(trọng số {(p.weight * 100).toFixed(0)}%)</span>
                  </span>
                  <span className="font-bold tabular-nums text-slate-800">{p.score.toFixed(0)}/100</span>
                </div>
                <ProgressBar
                  pct={p.score}
                  tone={p.score >= 70 ? 'rose' : p.score >= 45 ? 'amber' : 'emerald'}
                />
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
            Điểm tổng do cơ sở dữ liệu tính bằng <strong>công thức trọng số</strong>, không phải mô hình
            dự đoán. Điểm càng cao thì rủi ro càng lớn.
          </p>
        </div>
      </TabSection>
    </div>
  );
}

// ─── 10. THẢO LUẬN & TÀI LIỆU ───────────────────────────────────────────────
export function TabCollaboration({ data }: { data: Po360Data }) {
  return (
    <div className="space-y-4">
      <TabSection
        title={`Tài liệu đính kèm (${data.documents.length})`}
        error={data.errors.documents}
        isEmpty={data.documents.length === 0}
        emptyTitle="Chưa có tài liệu"
        emptyHint="Tech Pack, sơ đồ rập, bảng đóng gói... đính kèm tại đây."
      >
        <DataTable head={['Loại', 'Tên tài liệu', 'Phiên bản', 'Ngày tải lên']} minWidth={560}>
          {data.documents.map((d) => (
            <tr key={d.id} className="transition hover:bg-slate-50/70">
              <td className={`${tdCls} text-xs`}>
                <Badge tone="slate" icon={FileText}>
                  {labelOf(DOC_TYPE_LABEL, d.doc_type)}
                </Badge>
              </td>
              <td className={`${tdCls} font-medium text-slate-800`}>{d.title}</td>
              <td className={`${tdCls} tabular-nums`}>v{d.version}</td>
              <td className={tdCls}>{fmtDate(d.created_at)}</td>
            </tr>
          ))}
        </DataTable>
      </TabSection>

      <TabSection
        title={`Thảo luận (${data.comments.length})`}
        error={data.errors.comments}
        isEmpty={data.comments.length === 0}
        emptyTitle="Chưa có trao đổi nào"
        emptyHint="Gõ @ kèm tên bộ phận để gọi đúng người, ví dụ @kho hoặc @qa."
      >
        <ul className="divide-y divide-slate-50">
          {data.comments.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{c.author_name ?? 'Không rõ'}</span>
                {c.is_task && (
                  <StatusBadge code={c.task_status} labels={TASK_STATUS_LABEL} tone="amber" />
                )}
                {c.assigned_role && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                    Giao: {ROLE_LABEL_SAFE(c.assigned_role)}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-slate-400">{fmtDate(c.created_at)}</span>
              </div>

              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                {c.body}
              </p>

              {c.mentions.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {c.mentions.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                    >
                      <MessageSquare className="mr-1 inline h-3 w-3" aria-hidden="true" />
                      {ROLE_LABEL_SAFE(m)}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </TabSection>
    </div>
  );
}
