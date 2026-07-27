'use client';

// ============================================================================
// MODULE 2 — GIÁM ĐỐC (BOD DASHBOARD)
// KPI vĩ mô · Cảnh báo đỏ · So sánh năng suất Chuyền/Xưởng · Trung tâm phê duyệt
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote, TrendingUp, Wallet, AlertOctagon, CheckCircle2, XCircle,
  BadgeCheck, Hourglass, BarChart3, Landmark, PackageX, Clock4, ShieldAlert,
} from 'lucide-react';
import {
  Card, PageHeader, StatCard, Badge, EmptyState, AccessDenied, MockBadge,
  Modal, Field, inputCls, btnPrimary, btnGhost, thCls, tdCls, useToast, ToastView,
  SimpleBarChart, Skeleton,
} from '@/components/ui';
import { useSession, useTimeFilter, inTimeRange } from '@/lib/hooks';
import { canAccess } from '@/lib/auth';
import { fetchTables, updateRow, subscribeTables } from '@/lib/supabase';
import {
  fmtNum, fmtVND, fmtPct, daysLate, defectRatePercent, progressPercent, fmtDateTime,
} from '@/lib/garment-math';
import type {
  Order, ProdLog, QALog, FinancialRecord, Subcon, SewingLine, BomItem,
  InventoryItem, Approval,
} from '@/types/erp';

const MODULE_PATH = '/giam-doc';

export default function BodDashboardPage() {
  const { session, ready } = useSession();
  const range = useTimeFilter();
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [qaLogs, setQaLogs] = useState<QALog[]>([]);
  const [finance, setFinance] = useState<FinancialRecord[]>([]);
  const [subcons, setSubcons] = useState<Subcon[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [bom, setBom] = useState<BomItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [rejecting, setRejecting] = useState<Approval | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    const { data, isMock } = await fetchTables([
      'orders', 'prod_logs', 'qa_logs', 'financial_records', 'subcons',
      'sewing_lines', 'bom', 'inventory', 'approvals',
    ]);
    setOrders(data.orders as Order[]);
    setProdLogs(data.prod_logs as ProdLog[]);
    setQaLogs(data.qa_logs as QALog[]);
    setFinance(data.financial_records as FinancialRecord[]);
    setSubcons(data.subcons as Subcon[]);
    setLines(data.sewing_lines as SewingLine[]);
    setBom(data.bom as BomItem[]);
    setInventory(data.inventory as InventoryItem[]);
    setApprovals(data.approvals as Approval[]);
    setIsMock(isMock);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['prod_logs', 'qa_logs', 'approvals'], () => { void load(); }), [load]);

  const logsInRange = useMemo(
    () => prodLogs.filter((l) => inTimeRange(l.created_at, range)),
    [prodLogs, range],
  );

  // ── KPI vĩ mô ──────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'Đã xuất');
    const revenue = orders.reduce((s, o) => s + o.target_qty * o.unit_price_fob, 0);
    const grossProfit = orders.reduce((s, o) => s + o.target_qty * (o.unit_price_fob - o.unit_price_cmt), 0);
    const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const totalTarget = active.reduce((s, o) => s + o.target_qty, 0);
    const totalDone = prodLogs
      .filter((l) => active.some((o) => o.id === l.order_id))
      .reduce((s, l) => s + (Number(l.qty_ok) || 0), 0);
    const payable = finance
      .filter((f) => f.status !== 'Đã thanh toán')
      .reduce((s, f) => s + (Number(f.total_pay) || 0), 0);
    return { revenue, grossProfit, marginPct, progress: progressPercent(totalDone, totalTarget), payable };
  }, [orders, prodLogs, finance]);

  // ── Cảnh báo đỏ ────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const list: Array<{ id: string; icon: typeof Clock4; text: string }> = [];
    // 1. PO trễ > 3 ngày
    for (const o of orders) {
      if (o.status === 'Đã xuất' || o.status === 'Hoàn thành') continue;
      const late = daysLate(o.xfactory_date);
      if (late > 3) list.push({ id: `late-${o.id}`, icon: Clock4, text: `${o.po_code} (${o.product_name}) TRỄ ${late} ngày so với ngày xuất xưởng kế hoạch` });
    }
    // 2. Xưởng lỗi > 3%
    for (const sc of subcons) {
      const ls = logsInRange.filter((l) => l.subcon_id === sc.id);
      const ok = ls.reduce((s, l) => s + l.qty_ok, 0);
      const de = ls.reduce((s, l) => s + l.qty_defect, 0);
      const rate = defectRatePercent(de, ok + de);
      if (ok + de > 0 && rate > 3) list.push({ id: `def-${sc.id}`, icon: ShieldAlert, text: `${sc.name} tỷ lệ lỗi ${fmtPct(rate)} — vượt ngưỡng 3%` });
    }
    // 3. NPL thiếu so với BOM / dưới tồn an toàn
    for (const b of bom.filter((x) => x.npl_status === 'Thiếu hụt')) {
      const po = orders.find((o) => o.id === b.order_id)?.po_code ?? b.order_id;
      list.push({ id: `bom-${b.id}`, icon: PackageX, text: `Thiếu NPL "${b.item_name}" cho ${po}` });
    }
    for (const i of inventory.filter((x) => x.type === 'NPL' && x.safety_stock > 0)) {
      const qty = i.qty_m > 0 ? i.qty_m : i.roll_count;
      if (qty < i.safety_stock) list.push({ id: `inv-${i.id}`, icon: PackageX, text: `"${i.item_name}" dưới tồn an toàn (${fmtNum(qty)} / cần ${fmtNum(i.safety_stock)})` });
    }
    // 4. Lô QA rớt AQL
    for (const q of qaLogs.filter((x) => x.aql_status === 'Fail')) {
      const po = orders.find((o) => o.id === q.order_id)?.po_code ?? q.order_id;
      list.push({ id: `aql-${q.id}`, icon: AlertOctagon, text: `Lô Endline ${po} RỚT AQL 2.5 (${q.qty_defect} lỗi / Ac=${q.ac_number})` });
    }
    return list;
  }, [orders, subcons, logsInRange, bom, inventory, qaLogs]);

  // ── So sánh năng suất Chuyền & Xưởng ──────────────────────────────────────
  const productivity = useMemo(() => {
    const rows: Array<{ label: string; value: number; sub?: string; alert?: boolean }> = [];
    for (const l of lines) {
      const ls = logsInRange.filter((x) => x.line_id === l.id);
      const ok = ls.reduce((s, x) => s + x.qty_ok, 0);
      const de = ls.reduce((s, x) => s + x.qty_defect, 0);
      const rate = defectRatePercent(de, ok + de);
      rows.push({ label: `${l.name} (nội bộ)`, value: ok, sub: `lỗi ${fmtPct(rate)}`, alert: rate > 3 });
    }
    for (const sc of subcons) {
      const ls = logsInRange.filter((x) => x.subcon_id === sc.id);
      const ok = ls.reduce((s, x) => s + x.qty_ok, 0);
      const de = ls.reduce((s, x) => s + x.qty_defect, 0);
      const rate = defectRatePercent(de, ok + de);
      if (ok + de > 0) rows.push({ label: sc.name, value: ok, sub: `lỗi ${fmtPct(rate)}`, alert: rate > 3 });
    }
    return rows.sort((a, b) => b.value - a.value);
  }, [lines, subcons, logsInRange]);

  // ── Phê duyệt ─────────────────────────────────────────────────────────────
  const pending = approvals.filter((a) => a.status === 'Chờ duyệt');

  const decide = async (a: Approval, ok: boolean, reason = '') => {
    const status = ok ? 'Đã duyệt' : 'Từ chối';
    setApprovals((prev) => prev.map((x) => (x.id === a.id ? { ...x, status, reason } : x)));
    await updateRow('approvals', a.id, { status, reason });
    showToast(ok ? `✓ Đã duyệt: ${a.type}` : `Đã từ chối: ${a.type}`);
  };

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div>
      <PageHeader
        title="Dashboard Giám đốc"
        desc="KPI vĩ mô toàn hệ thống — số liệu chảy tự động từ Cắt → May → QA → Kho → Kế toán"
        action={<MockBadge show={isMock} />}
      />

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Banknote} tone="indigo" label="Doanh thu dự kiến (FOB)"
          value={loading ? <Skeleton className="h-7 w-28" /> : fmtVND(kpi.revenue)}
          sub={`${fmtNum(orders.length)} PO trong hệ thống`} />
        <StatCard icon={TrendingUp} tone="emerald" label="Lợi nhuận gộp (FOB − CMT)"
          value={loading ? <Skeleton className="h-7 w-28" /> : fmtVND(kpi.grossProfit)}
          sub={`Margin ${fmtPct(kpi.marginPct)} · chưa trừ chi phí NPL`} />
        <StatCard icon={Hourglass} tone="amber" label="Tiến độ tổng thể"
          value={loading ? <Skeleton className="h-7 w-28" /> : fmtPct(kpi.progress, 0)}
          sub="Sản lượng đạt / mục tiêu các PO đang chạy" />
        <StatCard icon={Wallet} tone="rose" label="Công nợ phải trả Subcon"
          value={loading ? <Skeleton className="h-7 w-28" /> : fmtVND(kpi.payable)}
          sub="Sau khi trừ phạt & đối trừ tạm ứng" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Cảnh báo đỏ */}
        <Card title={`Cảnh báo Đỏ (${alerts.length})`} icon={AlertOctagon}>
          {alerts.length === 0 ? (
            <EmptyState title="Không có cảnh báo nghiêm trọng" sub="Hệ thống đang vận hành trong ngưỡng an toàn" />
          ) : (
            <ul className="divide-y divide-slate-50">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                    <a.icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-relaxed text-slate-700">{a.text}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Năng suất chuyền/xưởng */}
        <Card title="Năng suất Chuyền & Xưởng (SP đạt)" icon={BarChart3}>
          <SimpleBarChart data={productivity} tone="indigo" unit=" SP" />
          <p className="border-t border-slate-50 px-5 py-2.5 text-[11px] text-slate-400">
            Cột đỏ = tỷ lệ lỗi vượt ngưỡng 3%. Số liệu theo bộ lọc thời gian trên Header.
          </p>
        </Card>
      </div>

      {/* Trung tâm phê duyệt */}
      <Card className="mt-5" title={`Trung tâm Phê duyệt (${pending.length} chờ xử lý)`} icon={Landmark}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thCls}>Loại</th>
                <th className={thCls}>Người yêu cầu</th>
                <th className={thCls}>Nội dung</th>
                <th className={thCls}>Thời gian</th>
                <th className={thCls}>Trạng thái / Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {approvals.length === 0 && (
                <tr><td colSpan={5}><EmptyState title="Chưa có yêu cầu nào" /></td></tr>
              )}
              {approvals.map((a) => (
                <tr key={a.id} className="transition hover:bg-slate-50/70">
                  <td className={tdCls}><Badge tone="indigo">{a.type}</Badge></td>
                  <td className={tdCls}>{a.requester}</td>
                  <td className="max-w-md px-4 py-3 text-sm text-slate-700">
                    {a.content}
                    {a.reason && <span className="mt-0.5 block text-xs text-slate-400">Lý do: {a.reason}</span>}
                  </td>
                  <td className={`${tdCls} text-slate-400`}>{fmtDateTime(a.created_at)}</td>
                  <td className={tdCls}>
                    {a.status === 'Chờ duyệt' ? (
                      <span className="flex gap-1.5">
                        <button onClick={() => void decide(a, true)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-95">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
                        </button>
                        <button onClick={() => { setRejecting(a); setRejectReason(''); }}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 active:scale-95">
                          <XCircle className="h-3.5 w-3.5" /> Từ chối
                        </button>
                      </span>
                    ) : a.status === 'Đã duyệt' ? (
                      <Badge tone="emerald" icon={BadgeCheck}>Đã duyệt</Badge>
                    ) : (
                      <Badge tone="rose" icon={XCircle}>Từ chối</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal từ chối */}
      <Modal open={!!rejecting} title="Từ chối yêu cầu" onClose={() => setRejecting(null)}>
        <div className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">{rejecting?.content}</p>
          <Field label="Lý do từ chối" hint="Lý do sẽ hiển thị cho người yêu cầu và lưu vào log hệ thống">
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className={inputCls} placeholder="VD: Hao hụt vượt 5% không có biên bản hiện trường…" />
          </Field>
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setRejecting(null)}>Hủy</button>
            <button className={btnPrimary} disabled={!rejectReason.trim()}
              onClick={() => { if (rejecting) { void decide(rejecting, false, rejectReason.trim()); setRejecting(null); } }}>
              Xác nhận từ chối
            </button>
          </div>
        </div>
      </Modal>

      <ToastView message={toast} />
    </div>
  );
}
