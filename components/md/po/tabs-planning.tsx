'use client';

import { useMemo } from 'react';
import { CheckCircle2, TriangleAlert, Flag } from 'lucide-react';

import { Badge, ProgressBar } from '@/components/ui';
import { TabSection, DataTable, tdCls, Metric, StatusBadge, fmtDate, fmtNum, fmtMoney } from './tab-kit';
import type { Po360Data } from '@/app/(dashboard)/md/_services/po.service';
import {
  ORDER_TYPE_LABEL, INCOTERM_LABEL, SHIP_MODE_LABEL, PO_STATUS_LABEL,
  MILESTONE_STATUS_LABEL, SAMPLE_STAGE_LABEL, SAMPLE_STATUS_LABEL,
  MATERIAL_CATEGORY_LABEL, ROLE_LABEL_SAFE,
  resolveMilestoneState, sampleApprovalRate, buildSizeMatrix, vnToday,
  type OrderType, type Incoterm, type ShipMode,
} from './labels';

// ============================================================================
// NĂM TAB ĐẦU CỦA PO 360°: Tổng quan · T&A · Mẫu duyệt · BOM · Trạng thái NPL
// Gom vào một file vì cả năm đều là bảng đọc, không có form phức tạp.
// ============================================================================

// ─── 1. TỔNG QUAN ───────────────────────────────────────────────────────────
export function TabOverview({ data }: { data: Po360Data }) {
  // Hook phải chạy TRƯỚC mọi lối thoát sớm: nếu đặt sau `if (!h) return` thì
  // lượt render không có header sẽ gọi ít hook hơn lượt có header, React so
  // lệch thứ tự hook và văng lỗi.
  const matrix = useMemo(() => buildSizeMatrix(data.breakdown), [data.breakdown]);

  const h = data.header;
  if (!h) return <TabSection error={data.errors.header ?? 'Không tìm thấy đơn hàng.'}>{null}</TabSection>;

  const today = vnToday();

  const lateCount = data.milestones.filter(
    (m) => resolveMilestoneState(m, today).state === 'LATE',
  ).length;

  const sewn = data.production.reduce((s, p) => s + p.actual_qty, 0);
  const pct = h.total_quantity > 0 ? (sewn / h.total_quantity) * 100 : 0;
  const value = h.unit_price ? h.unit_price * h.total_quantity : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Số lượng đặt" value={fmtNum(h.total_quantity)} sub="sản phẩm" />
        <Metric
          label="Đã may"
          value={fmtNum(sewn)}
          sub={`${pct.toFixed(1)}% kế hoạch`}
          tone={pct >= 100 ? 'emerald' : 'indigo'}
        />
        <Metric
          label="Mốc tiến độ trễ"
          value={fmtNum(lateCount)}
          sub={lateCount > 0 ? 'cần xử lý ngay' : 'đúng tiến độ'}
          tone={lateCount > 0 ? 'rose' : 'emerald'}
        />
        <Metric
          label="Giá trị đơn"
          value={value === null ? '—' : fmtMoney(value, h.currency)}
          sub={h.unit_price ? `${fmtMoney(h.unit_price, h.currency)}/sp` : 'chưa có đơn giá'}
        />
      </div>

      <TabSection title="Thông tin đơn hàng">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Mã hàng', h.style_no ? `${h.style_no} — ${h.style_name}` : 'Chưa gắn mã hàng'],
            ['Khách hàng', h.customer_name],
            ['Hình thức gia công', h.order_type ? ORDER_TYPE_LABEL[h.order_type as OrderType] ?? h.order_type : '—'],
            ['Điều kiện giao hàng', h.incoterm ? INCOTERM_LABEL[h.incoterm as Incoterm] ?? h.incoterm : '—'],
            ['Phương thức vận chuyển', h.ship_mode ? SHIP_MODE_LABEL[h.ship_mode as ShipMode] ?? h.ship_mode : '—'],
            ['Xưởng sản xuất', h.factory_name ?? '—'],
            ['Ngày đặt hàng', fmtDate(h.order_date)],
            ['Ngày xuất xưởng', fmtDate(h.ex_factory_date)],
            ['Ngày giao khách', fmtDate(h.delivery_date)],
            ['Thời gian chuẩn (SAM)', h.sam_minutes ? `${fmtNum(h.sam_minutes)} phút/sp` : '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{k}</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800">{v}</dd>
            </div>
          ))}
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Trạng thái</dt>
            <dd className="mt-1">
              <StatusBadge code={h.status} labels={PO_STATUS_LABEL} />
            </dd>
          </div>
        </dl>
      </TabSection>

      <TabSection
        title={`Số lượng theo màu × size (${fmtNum(matrix.grandTotal)} sp)`}
        error={data.errors.breakdown}
        isEmpty={data.breakdown.length === 0}
        emptyTitle="Chưa nhập số lượng theo màu và size"
        emptyHint="Cắt, đóng thùng và kiểm AQL đều cần bảng này — tổng số lượng PO là chưa đủ."
      >
        <div className="overflow-x-auto p-1">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-400">Màu</th>
                {matrix.sizes.map((s) => (
                  <th key={s} className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-400">
                    {s}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-xs font-bold uppercase text-slate-600">Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {matrix.colors.map((c) => (
                <tr key={c} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2 font-mono font-semibold text-slate-800">{c}</td>
                  {matrix.sizes.map((s) => (
                    <td key={s} className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {matrix.cell(c, s) || '—'}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-900">
                    {fmtNum(matrix.rowTotal(c))}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 bg-slate-50/70">
                <td className="px-3 py-2 text-xs font-bold uppercase text-slate-600">Tổng</td>
                {matrix.sizes.map((s) => (
                  <td key={s} className="px-3 py-2 text-right font-bold tabular-nums text-slate-800">
                    {fmtNum(matrix.colTotal(s))}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-extrabold tabular-nums text-indigo-700">
                  {fmtNum(matrix.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </TabSection>
    </div>
  );
}

// ─── 2. LỊCH TRÌNH T&A ──────────────────────────────────────────────────────
export function TabTimeline({ data }: { data: Po360Data }) {
  const today = vnToday();
  const rows = data.milestones;

  const done = rows.filter((m) => m.actual_date).length;
  const late = rows.filter((m) => resolveMilestoneState(m, today).state === 'LATE');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tổng số mốc" value={fmtNum(rows.length)} />
        <Metric label="Đã hoàn thành" value={fmtNum(done)} tone="emerald" />
        <Metric
          label="Đang trễ"
          value={fmtNum(late.length)}
          tone={late.length > 0 ? 'rose' : 'emerald'}
          sub={late.length > 0 ? `trễ nhiều nhất ${Math.max(...late.map((m) => resolveMilestoneState(m, today).lateDays))} ngày` : undefined}
        />
        <Metric
          label="Mốc đường găng"
          value={fmtNum(rows.filter((m) => m.is_critical).length)}
          sub="trễ ở đây là trễ cả đơn"
          tone="amber"
        />
      </div>

      <TabSection
        title="Đường găng tiến độ (Critical Path)"
        error={data.errors.milestones}
        isEmpty={rows.length === 0}
        emptyTitle="Chưa có lịch tiến độ"
        emptyHint="Lịch được sinh tự động khi tạo PO từ mẫu T&A."
      >
        <DataTable head={['#', 'Mốc công việc', 'Kế hoạch', 'Thực tế', 'Phụ trách', 'Trạng thái']} minWidth={720}>
          {rows.map((m) => {
            const st = resolveMilestoneState(m, today);
            const tone = st.state === 'LATE' ? 'rose' : st.state === 'DONE' ? 'emerald' : 'slate';
            return (
              <tr key={m.id} className={`transition hover:bg-slate-50/70 ${m.is_critical ? 'bg-amber-50/30' : ''}`}>
                <td className={`${tdCls} tabular-nums text-slate-400`}>{m.seq_no}</td>
                <td className={tdCls}>
                  <span className="flex items-center gap-1.5 font-medium text-slate-800">
                    {m.is_critical && <Flag className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />}
                    {m.milestone}
                  </span>
                </td>
                <td className={tdCls}>{fmtDate(m.planned_date)}</td>
                <td className={tdCls}>{fmtDate(m.actual_date)}</td>
                <td className={`${tdCls} text-xs text-slate-500`}>
                  {m.responsible_role ? ROLE_LABEL_SAFE(m.responsible_role) : '—'}
                </td>
                <td className={tdCls}>
                  <span className="flex items-center gap-1.5">
                    <Badge tone={tone} icon={st.state === 'DONE' ? CheckCircle2 : st.state === 'LATE' ? TriangleAlert : undefined}>
                      {MILESTONE_STATUS_LABEL[st.state]}
                    </Badge>
                    {st.lateDays > 0 && (
                      <span className="text-xs font-bold text-rose-600">trễ {st.lateDays} ngày</span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </TabSection>
    </div>
  );
}

// ─── 3. MẪU DUYỆT ───────────────────────────────────────────────────────────
export function TabSamples({ data }: { data: Po360Data }) {
  const rate = sampleApprovalRate(data.samples);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Metric label="Tổng lượt gửi mẫu" value={fmtNum(data.samples.length)} />
        <Metric
          label="Tỷ lệ mẫu đạt"
          value={rate === null ? '—' : `${rate}%`}
          sub={rate === null ? 'chưa có mẫu nào có kết luận' : 'trên số mẫu đã có kết luận'}
          tone={rate === null ? 'slate' : rate >= 80 ? 'emerald' : 'amber'}
        />
        <Metric
          label="Đang chờ khách"
          value={fmtNum(data.samples.filter((s) => s.status === 'SENT').length)}
          tone="amber"
        />
      </div>

      <TabSection
        title="Lịch sử gửi mẫu"
        error={data.errors.samples}
        isEmpty={data.samples.length === 0}
        emptyTitle="Chưa gửi mẫu nào"
        emptyHint="Proto → Fit → Size Set → PP → TOP là chuỗi mẫu chuẩn trước khi vào chuyền."
      >
        <DataTable head={['Loại mẫu', 'Lần', 'Ngày gửi', 'Khách phản hồi', 'Trạng thái', 'Nhận xét']} minWidth={760}>
          {data.samples.map((s) => (
            <tr key={s.id} className="transition hover:bg-slate-50/70">
              <td className={`${tdCls} font-medium text-slate-800`}>
                {SAMPLE_STAGE_LABEL[s.stage as keyof typeof SAMPLE_STAGE_LABEL] ?? s.stage}
              </td>
              <td className={`${tdCls} tabular-nums`}>#{s.round_no}</td>
              <td className={tdCls}>{fmtDate(s.sent_date)}</td>
              <td className={tdCls}>{fmtDate(s.reply_date)}</td>
              <td className={tdCls}>
                <StatusBadge
                  code={s.status}
                  labels={SAMPLE_STATUS_LABEL}
                  tone={s.status === 'REJECTED' ? 'rose' : s.status === 'APPROVED' ? 'emerald' : 'indigo'}
                />
              </td>
              <td className="max-w-xs px-4 py-3 text-xs text-slate-600">{s.buyer_comment ?? '—'}</td>
            </tr>
          ))}
        </DataTable>
      </TabSection>
    </div>
  );
}

// ─── 4. CẤU TRÚC NPL (BOM) ──────────────────────────────────────────────────
export function TabBom({ data }: { data: Po360Data }) {
  return (
    <TabSection
      title="Định mức nguyên phụ liệu (lấy từ mã hàng)"
      error={data.errors.materialNeeds}
      isEmpty={data.materialNeeds.length === 0}
      emptyTitle="Mã hàng chưa khai định mức NPL"
      emptyHint="Định mức khai một lần ở Mã hàng, mọi PO dùng mã đó đều lấy theo — không nhập lại."
    >
      <DataTable
        head={['Nguyên phụ liệu', 'Loại', 'Màu áp dụng', 'Định mức/sp', 'Hao hụt', 'Đã tính hao hụt', 'Nhà cung cấp']}
        minWidth={860}
      >
        {data.materialNeeds.map((b) => (
          <tr key={b.id} className="transition hover:bg-slate-50/70">
            <td className={`${tdCls} font-medium text-slate-800`}>{b.item_name}</td>
            <td className={`${tdCls} text-xs text-slate-500`}>
              {MATERIAL_CATEGORY_LABEL[b.category as keyof typeof MATERIAL_CATEGORY_LABEL] ?? b.category}
            </td>
            <td className={`${tdCls} text-xs`}>{b.color_code ?? 'Mọi màu'}</td>
            <td className={`${tdCls} tabular-nums`}>{fmtNum(b.consumption_per_pcs)} {b.unit}</td>
            <td className={`${tdCls} tabular-nums text-slate-500`}>{b.wastage_percent}%</td>
            <td className={`${tdCls} tabular-nums font-semibold text-slate-900`}>
              {fmtNum(b.net_consumption)} {b.unit}
            </td>
            <td className={`${tdCls} text-xs text-slate-500`}>{b.supplier ?? '—'}</td>
          </tr>
        ))}
      </DataTable>
    </TabSection>
  );
}

// ─── 5. TRẠNG THÁI NPL ──────────────────────────────────────────────────────
export function TabMaterials({ data }: { data: Po360Data }) {
  const h = data.header;

  return (
    <TabSection
      title={`Nhu cầu NPL cho ${fmtNum(h?.total_quantity ?? 0)} sản phẩm`}
      error={data.errors.materialNeeds}
      isEmpty={data.materialNeeds.length === 0}
      emptyTitle="Chưa tính được nhu cầu NPL"
      emptyHint="Cần gắn mã hàng cho PO và khai định mức ở mã hàng đó."
    >
      <div className="border-b border-slate-100 bg-indigo-50/40 px-4 py-2.5 text-[11px] leading-relaxed text-indigo-900">
        Số lượng cần = định mức đã tính hao hụt × số lượng PO. Con số này{' '}
        <strong>tính ra tự động</strong>, không nhập tay — sửa định mức ở mã hàng là mọi PO cập nhật theo.
      </div>

      <DataTable head={['Nguyên phụ liệu', 'Loại', 'Định mức/sp', 'Số lượng cần', 'Nhà cung cấp']} minWidth={720}>
        {data.materialNeeds.map((b) => (
          <tr key={b.id} className="transition hover:bg-slate-50/70">
            <td className={`${tdCls} font-medium text-slate-800`}>{b.item_name}</td>
            <td className={`${tdCls} text-xs text-slate-500`}>
              {MATERIAL_CATEGORY_LABEL[b.category as keyof typeof MATERIAL_CATEGORY_LABEL] ?? b.category}
            </td>
            <td className={`${tdCls} tabular-nums text-slate-600`}>
              {fmtNum(b.net_consumption)} {b.unit}
            </td>
            <td className={`${tdCls} tabular-nums text-base font-extrabold text-indigo-700`}>
              {fmtNum(b.required_qty)} {b.unit}
            </td>
            <td className={`${tdCls} text-xs text-slate-500`}>{b.supplier ?? '—'}</td>
          </tr>
        ))}
      </DataTable>

      <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-[11px] font-semibold text-amber-800">
        Chưa đối chiếu với tồn kho thực tế và lịch NPL về. Phần đó cần nối với phiếu mua và bảng
        warehouse_transactions ở bước sau.
      </p>
    </TabSection>
  );
}

export { ProgressBar };
