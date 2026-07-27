'use client';

// ============================================================================
// MODULE 7 — CỔNG SUBCON (XƯỞNG GIA CÔNG NGOÀI)
// Data-scoping: chỉ thấy PO & công nợ của chính xưởng mình
// Báo sản lượng ngày · Yêu cầu cấp bù NPL · Bảng kê công nợ (chỉ đọc)
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Handshake, Send, PackagePlus, Wallet, Camera, CheckCircle2,
  AlertTriangle, ClipboardList, Hourglass, XCircle,
} from 'lucide-react';
import {
  Card, PageHeader, StatCard, Badge, ProgressBar, EmptyState, AccessDenied,
  MockBadge, Modal, Field, inputCls, btnPrimary, btnGhost, useToast, ToastView,
} from '@/components/ui';
import { useSession, useTimeFilter, inTimeRange } from '@/lib/hooks';
import { canAccess } from '@/lib/auth';
import { fetchTables, insertRow, genId, subscribeTables } from '@/lib/supabase';
import {
  settleSubcon, defectRatePercent, progressPercent,
  fmtNum, fmtVND, fmtPct, fmtDateTime, fmtDate,
} from '@/lib/garment-math';
import type { Order, ProdLog, FinancialRecord, Approval, Subcon } from '@/types/erp';

const MODULE_PATH = '/subcon';
const STAGES = ['May thân', 'Tra tay', 'Vào lưng/khóa', 'Hoàn thiện'];

export default function SubconPage() {
  const { session, ready } = useSession();
  const range = useTimeFilter();
  const { toast, showToast } = useToast();

  const [isMock, setIsMock] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [finance, setFinance] = useState<FinancialRecord[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [subcons, setSubcons] = useState<Subcon[]>([]);

  const [showReport, setShowReport] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const [fr, setFr] = useState({ order_id: '', stage: STAGES[0], ok: '', defect: '', photo: '' });
  const [fq, setFq] = useState({ order_id: '', content: '', qty: '' });

  // Xưởng của user hiện tại (superadmin/GĐ/MD xem toàn bộ → mặc định SC1 demo)
  const mySubconId = session?.user.subcon_id ?? 'SC1';

  const load = useCallback(async () => {
    const { data, isMock } = await fetchTables(['orders', 'prod_logs', 'financial_records', 'approvals', 'subcons']);
    setOrders(data.orders as Order[]);
    setProdLogs(data.prod_logs as ProdLog[]);
    setFinance(data.financial_records as FinancialRecord[]);
    setApprovals(data.approvals as Approval[]);
    setSubcons(data.subcons as Subcon[]);
    setIsMock(isMock);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['orders', 'approvals'], () => { void load(); }), [load]);

  const myName = subcons.find((s) => s.id === mySubconId)?.name ?? 'Xưởng của tôi';
  const myOrders = useMemo(() => orders.filter((o) => o.subcon_id === mySubconId), [orders, mySubconId]);
  const myLogs = useMemo(
    () => prodLogs.filter((l) => l.subcon_id === mySubconId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [prodLogs, mySubconId],
  );
  const myLogsInRange = myLogs.filter((l) => inTimeRange(l.created_at, range));
  const myFinance = finance.filter((f) => f.subcon_id === mySubconId);
  const myRequests = approvals.filter((a) => a.requester === myName || a.requester === session?.user.name);

  const kpi = useMemo(() => {
    const ok = myLogsInRange.reduce((s, l) => s + l.qty_ok, 0);
    const de = myLogsInRange.reduce((s, l) => s + l.qty_defect, 0);
    const rate = defectRatePercent(de, ok + de);
    const receivable = myFinance.reduce((s, f) => s + settleSubcon(f.qa_passed_qty, f.unit_price, f.penalty_amount, f.advance_pay).net, 0);
    return { ok, de, rate, receivable };
  }, [myLogsInRange, myFinance]);

  const doneByOrder = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of myLogs) m[l.order_id] = (m[l.order_id] || 0) + l.qty_ok;
    return m;
  }, [myLogs]);

  const poCode = useCallback((id: string | null) => orders.find((o) => o.id === id)?.po_code ?? '—', [orders]);

  const sendReport = async () => {
    const row: ProdLog = {
      id: genId('P'), order_id: fr.order_id, subcon_id: mySubconId, line_id: null,
      stage: fr.stage, qty_ok: Number(fr.ok) || 0, qty_defect: Number(fr.defect) || 0,
      hour_slot: `${String(new Date().getHours()).padStart(2, '0')}h`,
      photo_url: fr.photo.trim() || null, created_at: new Date().toISOString(),
    };
    setProdLogs((prev) => [row, ...prev]);
    setShowReport(false);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('prod_logs', payload);
    showToast(ok ? '✓ Đã gửi báo cáo sản lượng về Công ty' : 'Đã ghi báo cáo (offline)');
    setFr({ order_id: '', stage: STAGES[0], ok: '', defect: '', photo: '' });
  };

  const sendRequest = async () => {
    const row: Approval = {
      id: genId('A'), type: 'Cấp bù NPL', requester: myName,
      order_id: fq.order_id || null, content: fq.content.trim(), qty: Number(fq.qty) || 0,
      status: 'Chờ duyệt', reason: '', created_at: new Date().toISOString(),
    };
    setApprovals((prev) => [row, ...prev]);
    setShowRequest(false);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('approvals', payload);
    showToast(ok ? '✓ Đã gửi yêu cầu cấp bù NPL — chờ Giám đốc duyệt' : 'Đã gửi yêu cầu (offline)');
    setFq({ order_id: '', content: '', qty: '' });
  };

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div>
      <PageHeader title={`Cổng Xưởng — ${myName}`} desc="Tiếp nhận PO phân bổ · Báo sản lượng ngày · Công nợ dự kiến"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MockBadge show={isMock} />
            <button className={btnGhost} onClick={() => setShowRequest(true)}><PackagePlus className="h-4 w-4" /> Xin cấp bù NPL</button>
            <button className={btnPrimary} onClick={() => setShowReport(true)}><Send className="h-4 w-4" /> Báo sản lượng</button>
          </div>
        } />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Handshake} tone="indigo" label="Sản lượng đạt" value={fmtNum(kpi.ok)} sub="theo bộ lọc thời gian" />
        <StatCard icon={AlertTriangle} tone={kpi.rate > 3 ? 'rose' : 'emerald'} alert={kpi.rate > 3}
          label="Tỷ lệ lỗi" value={fmtPct(kpi.rate)}
          sub={kpi.rate > 3 ? 'Vượt ngưỡng 3% — Công ty đã nhận cảnh báo' : 'Trong ngưỡng cho phép'} />
        <StatCard icon={ClipboardList} tone="amber" label="PO được phân bổ" value={fmtNum(myOrders.length)} sub="đơn hàng đang đảm nhận" />
        <StatCard icon={Wallet} tone="emerald" label="Công nợ dự kiến nhận" value={fmtVND(kpi.receivable)} sub="sau phạt & đối trừ tạm ứng" />
      </div>

      {/* PO được phân bổ */}
      <Card className="mt-5" title="PO được phân bổ" icon={ClipboardList}>
        <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
          {myOrders.length === 0 && <div className="lg:col-span-2"><EmptyState title="Chưa có PO nào được phân bổ cho xưởng" /></div>}
          {myOrders.map((o) => {
            const done = doneByOrder[o.id] || 0;
            const pct = progressPercent(done, o.target_qty);
            return (
              <div key={o.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-indigo-700">{o.po_code}</p>
                    <p className="text-sm font-medium text-slate-800">{o.product_name}</p>
                    <p className="text-xs text-slate-400">Đơn giá CMT: {fmtVND(o.unit_price_cmt)}/SP · X-Factory: {fmtDate(o.xfactory_date)}</p>
                  </div>
                  <Badge tone={o.status === 'Hoàn thành' || o.status === 'Đã xuất' ? 'emerald' : 'indigo'}>{o.status}</Badge>
                </div>
                <div className="mt-3">
                  <ProgressBar pct={pct} />
                  <p className="mt-1 text-xs tabular-nums text-slate-400">{fmtNum(done)} / {fmtNum(o.target_qty)} SP</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Lịch sử báo cáo */}
        <Card title="Báo cáo sản lượng gần đây" icon={Send}>
          <div className="max-h-[380px] overflow-y-auto">
            <ul className="divide-y divide-slate-50">
              {myLogsInRange.length === 0 && <EmptyState title="Chưa có báo cáo trong khoảng thời gian này" />}
              {myLogsInRange.slice(0, 25).map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                  <span className="text-xs tabular-nums text-slate-400">{fmtDateTime(l.created_at)}</span>
                  <span className="text-sm font-semibold text-indigo-700">{poCode(l.order_id)}</span>
                  <span className="text-sm text-slate-500">{l.stage}</span>
                  <span className="ml-auto flex items-center gap-3 text-sm tabular-nums">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {fmtNum(l.qty_ok)}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${l.qty_defect > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                      <AlertTriangle className="h-3.5 w-3.5" /> {fmtNum(l.qty_defect)}
                    </span>
                  </span>
                  {l.photo_url && (
                    <a href={l.photo_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
                      <Camera className="h-3.5 w-3.5" /> Ảnh
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Yêu cầu + Công nợ */}
        <div className="space-y-5">
          <Card title="Yêu cầu cấp bù NPL đã gửi" icon={PackagePlus}>
            <ul className="divide-y divide-slate-50">
              {myRequests.length === 0 && <EmptyState title="Chưa gửi yêu cầu nào" />}
              {myRequests.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-700" title={a.content}>{a.content}</p>
                  {a.status === 'Chờ duyệt' ? <Badge tone="amber" icon={Hourglass}>Chờ duyệt</Badge>
                    : a.status === 'Đã duyệt' ? <Badge tone="emerald" icon={CheckCircle2}>Đã duyệt</Badge>
                      : <Badge tone="rose" icon={XCircle}>Từ chối</Badge>}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Bảng kê Công nợ dự kiến (chỉ đọc)" icon={Wallet}>
            <div className="divide-y divide-slate-50">
              {myFinance.length === 0 && <EmptyState title="Chưa có bảng kê" sub="Bảng kê sinh tự động khi QA Công ty duyệt lô ĐẠT" />}
              {myFinance.map((f) => {
                const st = settleSubcon(f.qa_passed_qty, f.unit_price, f.penalty_amount, f.advance_pay);
                return (
                  <div key={f.id} className="px-5 py-4 text-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-indigo-700">{poCode(f.order_id)}</span>
                      <Badge tone={f.status === 'Đã thanh toán' ? 'emerald' : 'amber'}>{f.status}</Badge>
                    </div>
                    <div className="space-y-1 tabular-nums text-slate-600">
                      <div className="flex justify-between"><span>Nghiệm thu ({fmtNum(f.qa_passed_qty)} SP × {fmtVND(f.unit_price)})</span><span>{fmtVND(st.gross)}</span></div>
                      <div className="flex justify-between text-rose-600"><span>Phạt / Đền bù</span><span>− {fmtVND(f.penalty_amount)}</span></div>
                      <div className="flex justify-between text-amber-600"><span>Đối trừ tạm ứng</span><span>− {fmtVND(f.advance_pay)}</span></div>
                      <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-900">
                        <span>Còn được nhận</span><span>{fmtVND(st.net)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal báo sản lượng */}
      <Modal open={showReport} title="Báo cáo sản lượng ngày" onClose={() => setShowReport(false)}>
        <div className="space-y-4">
          <Field label="PO">
            <select className={inputCls} value={fr.order_id} onChange={(e) => setFr({ ...fr, order_id: e.target.value })}>
              <option value="">— Chọn PO —</option>
              {myOrders.map((o) => <option key={o.id} value={o.id}>{o.po_code} · {o.product_name}</option>)}
            </select>
          </Field>
          <Field label="Công đoạn">
            <select className={inputCls} value={fr.stage} onChange={(e) => setFr({ ...fr, stage: e.target.value })}>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số lượng ĐẠT"><input type="number" className={inputCls} value={fr.ok} onChange={(e) => setFr({ ...fr, ok: e.target.value })} /></Field>
            <Field label="Số lượng LỖI"><input type="number" className={inputCls} value={fr.defect} onChange={(e) => setFr({ ...fr, defect: e.target.value })} /></Field>
          </div>
          <Field label="Link ảnh minh chứng" hint="Chụp bảng sản lượng cuối ngày / hàng đã may">
            <input className={inputCls} value={fr.photo} onChange={(e) => setFr({ ...fr, photo: e.target.value })} placeholder="https://…" />
          </Field>
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setShowReport(false)}>Hủy</button>
            <button className={btnPrimary} disabled={!fr.order_id || (!fr.ok && !fr.defect)} onClick={() => void sendReport()}>
              <Send className="h-4 w-4" /> Gửi báo cáo
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal xin cấp bù NPL */}
      <Modal open={showRequest} title="Yêu cầu cấp bù Nguyên phụ liệu" onClose={() => setShowRequest(false)}>
        <div className="space-y-4">
          <Field label="PO liên quan">
            <select className={inputCls} value={fq.order_id} onChange={(e) => setFq({ ...fq, order_id: e.target.value })}>
              <option value="">— Chọn PO —</option>
              {myOrders.map((o) => <option key={o.id} value={o.id}>{o.po_code}</option>)}
            </select>
          </Field>
          <Field label="Nội dung yêu cầu" hint="Ghi rõ tên NPL, lý do hao hụt (lỗi vải, hư hỏng khi may…)">
            <textarea rows={3} className={inputCls} value={fq.content} onChange={(e) => setFq({ ...fq, content: e.target.value })}
              placeholder="VD: Xin cấp bù 120m Vải Nỉ Da Cá 320GSM do lô DL-2398 loang màu…" />
          </Field>
          <Field label="Số lượng"><input type="number" className={inputCls} value={fq.qty} onChange={(e) => setFq({ ...fq, qty: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setShowRequest(false)}>Hủy</button>
            <button className={btnPrimary} disabled={!fq.content.trim()} onClick={() => void sendRequest()}>
              <PackagePlus className="h-4 w-4" /> Gửi yêu cầu
            </button>
          </div>
        </div>
      </Modal>

      <ToastView message={toast} />
    </div>
  );
}
