'use client';

// ============================================================================
// MODULE 10 — CỔNG BUYER (CUSTOMER PORTAL) — song ngữ Việt/Anh
// Timeline tiến độ PO · Báo cáo chất lượng QA · Shipment · Gửi đánh giá
// ⚠️ Data-scoping: buyer CHỈ thấy PO nhãn hàng của mình, KHÔNG thấy đơn giá
//    CMT hay bất kỳ chi phí nội bộ nào.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Globe, CheckCircle2, XCircle, Ship, Star, Send, PackageCheck,
  Scissors, Shirt, ShieldCheck, Container, MessageSquareHeart,
} from 'lucide-react';
import {
  Card, PageHeader, Badge, ProgressBar, EmptyState, AccessDenied, MockBadge,
  Modal, Field, inputCls, btnPrimary, btnGhost, useToast, ToastView, StarRating,
} from '@/components/ui';
import { useSession } from '@/lib/hooks';
import { canAccess } from '@/lib/auth';
import { fetchTables, insertRow, genId, subscribeTables } from '@/lib/supabase';
import { progressPercent, fmtNum, fmtDate, fmtDateTime, fmtPct, dhu } from '@/lib/garment-math';
import type { Order, ProdLog, QALog, Shipment, CuttingLog, BomItem, Feedback } from '@/types/erp';

const MODULE_PATH = '/buyer';

interface Milestone {
  key: string;
  labelVi: string;
  labelEn: string;
  icon: typeof Scissors;
  done: boolean;
  detail: string;
}

export default function BuyerPage() {
  const { session, ready } = useSession();
  const { toast, showToast } = useToast();

  const [isMock, setIsMock] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [qaLogs, setQaLogs] = useState<QALog[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [cuttings, setCuttings] = useState<CuttingLog[]>([]);
  const [bom, setBom] = useState<BomItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const [showFeedback, setShowFeedback] = useState(false);
  const [fb, setFb] = useState({ order_id: '', rating: 5, content: '' });

  const myBrand = session?.user.buyer_brand ?? 'NORDIC EU';

  const load = useCallback(async () => {
    const { data, isMock } = await fetchTables(['orders', 'prod_logs', 'qa_logs', 'shipments', 'cutting_logs', 'bom', 'feedbacks']);
    setOrders(data.orders as Order[]);
    setProdLogs(data.prod_logs as ProdLog[]);
    setQaLogs(data.qa_logs as QALog[]);
    setShipments(data.shipments as Shipment[]);
    setCuttings(data.cutting_logs as CuttingLog[]);
    setBom(data.bom as BomItem[]);
    setFeedbacks(data.feedbacks as Feedback[]);
    setIsMock(isMock);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['prod_logs', 'qa_logs', 'shipments'], () => { void load(); }), [load]);

  // Data-scoping: chỉ PO thuộc nhãn hàng của buyer
  const myOrders = useMemo(() => orders.filter((o) => o.brand === myBrand), [orders, myBrand]);
  const myOrderIds = useMemo(() => new Set(myOrders.map((o) => o.id)), [myOrders]);
  const myQa = qaLogs.filter((q) => myOrderIds.has(q.order_id));
  const myShipments = shipments.filter((s) => myOrderIds.has(s.order_id));
  const poCode = useCallback((id: string) => orders.find((o) => o.id === id)?.po_code ?? id, [orders]);

  const milestonesOf = (o: Order): { list: Milestone[]; pct: number } => {
    const oBom = bom.filter((b) => b.order_id === o.id);
    const nplDone = oBom.length > 0 && oBom.every((b) => b.npl_status === 'Đã về kho');
    const cutQty = cuttings.filter((c) => c.order_id === o.id).reduce((s, c) => s + c.cut_qty, 0);
    const sewn = prodLogs.filter((l) => l.order_id === o.id).reduce((s, l) => s + l.qty_ok, 0);
    const qaPass = myQa.filter((q) => q.order_id === o.id && q.inspection_type === 'Endline' && q.aql_status === 'Pass')
      .reduce((s, q) => s + q.lot_size, 0);
    const ship = myShipments.find((s) => s.order_id === o.id);
    const list: Milestone[] = [
      { key: 'npl', labelVi: 'NPL về kho', labelEn: 'Materials In-house', icon: PackageCheck, done: nplDone || cutQty > 0, detail: nplDone ? 'Đủ nguyên phụ liệu / All materials received' : 'Đang tập kết / In progress' },
      { key: 'cut', labelVi: 'Cắt', labelEn: 'Cutting', icon: Scissors, done: cutQty >= o.target_qty * 0.98, detail: `${fmtNum(cutQty)} / ${fmtNum(o.target_qty)} pcs` },
      { key: 'sew', labelVi: 'May', labelEn: 'Sewing', icon: Shirt, done: sewn >= o.target_qty * 0.98, detail: `${fmtNum(sewn)} / ${fmtNum(o.target_qty)} pcs` },
      { key: 'qa', labelVi: 'QA Final', labelEn: 'Final Inspection', icon: ShieldCheck, done: qaPass >= o.target_qty * 0.95, detail: `${fmtNum(qaPass)} pcs passed AQL 2.5` },
      { key: 'pack', labelVi: 'Đóng gói', labelEn: 'Packing', icon: Container, done: !!ship, detail: ship ? `${fmtNum(ship.carton_count)} cartons` : 'Chưa bắt đầu / Not started' },
      { key: 'ship', labelVi: 'Xuất hàng', labelEn: 'Shipped', icon: Ship, done: ship?.status === 'Đã xuất', detail: ship ? `ETD ${fmtDate(ship.etd)}` : '—' },
    ];
    return { list, pct: progressPercent(sewn, o.target_qty) };
  };

  const sendFeedback = async () => {
    const row: Feedback = {
      id: genId('FB'), order_id: fb.order_id, buyer_user: session?.user.name ?? myBrand,
      rating: fb.rating, content: fb.content.trim(), created_at: new Date().toISOString(),
    };
    setFeedbacks((prev) => [row, ...prev]);
    setShowFeedback(false);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('feedbacks', payload);
    showToast(ok ? '✓ Cảm ơn bạn — đánh giá đã gửi tới MD & Giám đốc / Feedback sent' : 'Đã ghi đánh giá (offline)');
    setFb({ order_id: '', rating: 5, content: '' });
  };

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div>
      <PageHeader title={`Customer Portal — ${myBrand}`}
        desc="Tiến độ sản xuất minh bạch theo thời gian thực · Real-time production transparency"
        action={
          <div className="flex items-center gap-2">
            <MockBadge show={isMock} />
            <button className={btnPrimary} onClick={() => setShowFeedback(true)}>
              <MessageSquareHeart className="h-4 w-4" /> Gửi đánh giá / Feedback
            </button>
          </div>
        } />

      {/* Timeline từng PO */}
      <div className="space-y-5">
        {myOrders.length === 0 && (
          <Card><EmptyState title="Chưa có PO nào thuộc nhãn hàng của bạn" sub="No purchase orders found for your brand" /></Card>
        )}
        {myOrders.map((o) => {
          const { list, pct } = milestonesOf(o);
          return (
            <Card key={o.id}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Globe className="h-4 w-4 text-blue-500" /> {o.po_code} — {o.product_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Số lượng / Qty: <b className="tabular-nums">{fmtNum(o.target_qty)}</b> pcs · Giao hàng / ETD: {fmtDate(o.etd_date)}
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <ProgressBar pct={pct} />
                  <p className="mt-1 text-right text-[11px] text-slate-400">Tiến độ may / Sewing progress</p>
                </div>
              </div>
              {/* Milestones */}
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 xl:grid-cols-6">
                {list.map((m) => (
                  <div key={m.key} className={`rounded-xl border p-3 text-center ${m.done ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/50'}`}>
                    <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${m.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <m.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                    </span>
                    <p className={`mt-2 text-xs font-bold ${m.done ? 'text-emerald-700' : 'text-slate-500'}`}>{m.labelVi}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{m.labelEn}</p>
                    <p className="mt-1 text-[11px] tabular-nums text-slate-500">{m.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Báo cáo chất lượng */}
        <Card title="Báo cáo Chất lượng / Quality Reports (AQL 2.5)" icon={ShieldCheck}>
          <ul className="divide-y divide-slate-50">
            {myQa.filter((q) => q.inspection_type === 'Endline').length === 0 && <EmptyState title="Chưa có lô kiểm Final" sub="No final inspection lots yet" />}
            {myQa.filter((q) => q.inspection_type === 'Endline').map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                <span className="text-xs tabular-nums text-slate-400">{fmtDateTime(q.created_at)}</span>
                <span className="text-sm font-semibold text-blue-700">{poCode(q.order_id)}</span>
                <span className="text-xs text-slate-500">Lot {fmtNum(q.lot_size)} pcs · sample n={q.sample_size}</span>
                <span className="ml-auto">
                  {q.aql_status === 'Pass'
                    ? <Badge tone="emerald" icon={CheckCircle2}>PASSED</Badge>
                    : <Badge tone="rose" icon={XCircle}>FAILED — reworking</Badge>}
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-slate-50 px-5 py-2.5 text-[11px] text-slate-400">
            Inline DHU hiện tại / Current inline DHU: <b>{fmtPct(dhu(
              myQa.filter((q) => q.inspection_type === 'Inline').reduce((s, q) => s + q.qty_defect, 0),
              myQa.filter((q) => q.inspection_type === 'Inline').reduce((s, q) => s + q.checked_qty, 0),
            ))}</b>
          </p>
        </Card>

        {/* Shipment + feedback đã gửi */}
        <div className="space-y-5">
          <Card title="Đóng gói & Xuất hàng / Packing & Shipment" icon={Ship}>
            <ul className="divide-y divide-slate-50">
              {myShipments.length === 0 && <EmptyState title="Chưa có lô xuất hàng" sub="No shipments yet" />}
              {myShipments.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
                  <span className="font-semibold text-blue-700">{poCode(s.order_id)}</span>
                  <span className="tabular-nums text-slate-600">{fmtNum(s.carton_count)} cartons · {fmtNum(s.qty)} pcs</span>
                  <span className="text-xs text-slate-400">GW {fmtNum(s.gw_kg)}kg · ETD {fmtDate(s.etd)}</span>
                  <span className="ml-auto">
                    {s.status === 'Đã xuất' ? <Badge tone="emerald" icon={Ship}>Shipped</Badge> : <Badge tone="amber" icon={Container}>Preparing</Badge>}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Đánh giá đã gửi / Your Feedback" icon={Star}>
            <ul className="divide-y divide-slate-50">
              {feedbacks.filter((f) => myOrderIds.has(f.order_id)).length === 0 && <EmptyState title="Chưa có đánh giá nào" />}
              {feedbacks.filter((f) => myOrderIds.has(f.order_id)).map((f) => (
                <li key={f.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-blue-700">{poCode(f.order_id)}</span>
                    <StarRating value={f.rating} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{f.content}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{fmtDateTime(f.created_at)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Modal feedback */}
      <Modal open={showFeedback} title="Gửi đánh giá dịch vụ / Send Feedback" onClose={() => setShowFeedback(false)}>
        <div className="space-y-4">
          <Field label="PO / Order">
            <select className={inputCls} value={fb.order_id} onChange={(e) => setFb({ ...fb, order_id: e.target.value })}>
              <option value="">— Chọn PO / Select PO —</option>
              {myOrders.map((o) => <option key={o.id} value={o.id}>{o.po_code} · {o.product_name}</option>)}
            </select>
          </Field>
          <Field label="Mức độ hài lòng / Rating">
            <StarRating value={fb.rating} onChange={(v) => setFb({ ...fb, rating: v })} />
          </Field>
          <Field label="Nội dung / Comments" hint="Gửi trực tiếp tới Merchandiser và Ban Giám đốc / Sent directly to MD & BOD">
            <textarea rows={3} className={inputCls} value={fb.content} onChange={(e) => setFb({ ...fb, content: e.target.value })}
              placeholder="Chất lượng, tiến độ, giao tiếp… / Quality, timeline, communication…" />
          </Field>
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setShowFeedback(false)}>Hủy / Cancel</button>
            <button className={btnPrimary} disabled={!fb.order_id || !fb.content.trim()} onClick={() => void sendFeedback()}>
              <Send className="h-4 w-4" /> Gửi / Submit
            </button>
          </div>
        </div>
      </Modal>

      <ToastView message={toast} />
    </div>
  );
}
