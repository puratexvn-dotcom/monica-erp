'use client';

// ============================================================================
// MODULE 9 — KẾ TOÁN (ACCOUNTING & COSTING)
// Đối soát công nợ Subcon = SL đạt QA × Đơn giá CMT − Phạt − Tạm ứng
// Quản lý tạm ứng · P&L per PO · Xuất CSV
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calculator as CalcIcon, Wallet, HandCoins, FileDown, ReceiptText,
  TrendingUp, TrendingDown, BadgeCheck, CircleDollarSign,
} from 'lucide-react';
import {
  Card, PageHeader, StatCard, Badge, EmptyState, AccessDenied, MockBadge,
  Modal, Field, inputCls, btnPrimary, btnGhost, thCls, tdCls, useToast, ToastView,
} from '@/components/ui';
import { useSession } from '@/lib/hooks';
import { canAccess } from '@/lib/auth';
import { fetchTables, updateRow, subscribeTables } from '@/lib/supabase';
import { settleSubcon, fmtNum, fmtVND, fmtPct } from '@/lib/garment-math';
import type { FinancialRecord, Order, Subcon } from '@/types/erp';

const MODULE_PATH = '/ke-toan';

export default function AccountingPage() {
  const { session, ready } = useSession();
  const { toast, showToast } = useToast();

  const [isMock, setIsMock] = useState(false);
  const [finance, setFinance] = useState<FinancialRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subcons, setSubcons] = useState<Subcon[]>([]);

  const [advanceFor, setAdvanceFor] = useState<FinancialRecord | null>(null);
  const [advanceAmt, setAdvanceAmt] = useState('');
  const [penaltyFor, setPenaltyFor] = useState<FinancialRecord | null>(null);
  const [penaltyAmt, setPenaltyAmt] = useState('');
  const [penaltyNote, setPenaltyNote] = useState('');

  // Tham số P&L
  const [nplCostPct, setNplCostPct] = useState('52'); // % FOB ước tính cho NPL
  const [overheadPct, setOverheadPct] = useState('8'); // % FOB chi phí quản lý/điện nước/khấu hao

  const load = useCallback(async () => {
    const { data, isMock } = await fetchTables(['financial_records', 'orders', 'subcons']);
    setFinance(data.financial_records as FinancialRecord[]);
    setOrders(data.orders as Order[]);
    setSubcons(data.subcons as Subcon[]);
    setIsMock(isMock);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['financial_records', 'qa_logs'], () => { void load(); }), [load]);

  const poCode = useCallback((id: string) => orders.find((o) => o.id === id)?.po_code ?? id, [orders]);
  const subconName = useCallback((id: string) => subcons.find((s) => s.id === id)?.name ?? id, [subcons]);

  const kpi = useMemo(() => ({
    payable: finance.filter((f) => f.status !== 'Đã thanh toán').reduce((s, f) => s + f.total_pay, 0),
    advanced: finance.reduce((s, f) => s + f.advance_pay, 0),
    penalties: finance.reduce((s, f) => s + f.penalty_amount, 0),
    pending: finance.filter((f) => f.status === 'Chờ đối soát').length,
  }), [finance]);

  // ── P&L per PO ────────────────────────────────────────────────────────────
  const pnl = useMemo(() => orders.map((o) => {
    const revenue = o.target_qty * o.unit_price_fob;
    const cmt = o.target_qty * o.unit_price_cmt;
    const npl = revenue * ((Number(nplCostPct) || 0) / 100);
    const overhead = revenue * ((Number(overheadPct) || 0) / 100);
    const profit = revenue - cmt - npl - overhead;
    const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { order: o, revenue, cmt, npl, overhead, profit, marginPct };
  }), [orders, nplCostPct, overheadPct]);

  // ── Cập nhật record ───────────────────────────────────────────────────────
  const recompute = (f: FinancialRecord): FinancialRecord => ({
    ...f,
    total_pay: settleSubcon(f.qa_passed_qty, f.unit_price, f.penalty_amount, f.advance_pay).net,
  });

  const addAdvance = async () => {
    if (!advanceFor) return;
    const updated = recompute({ ...advanceFor, advance_pay: advanceFor.advance_pay + (Number(advanceAmt) || 0) });
    setFinance((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setAdvanceFor(null);
    setAdvanceAmt('');
    await updateRow('financial_records', updated.id, { advance_pay: updated.advance_pay, total_pay: updated.total_pay });
    showToast(`✓ Đã ghi tạm ứng ${fmtVND(Number(advanceAmt) || 0)} cho ${subconName(updated.subcon_id)}`);
  };

  const addPenalty = async () => {
    if (!penaltyFor) return;
    const updated = recompute({
      ...penaltyFor,
      penalty_amount: penaltyFor.penalty_amount + (Number(penaltyAmt) || 0),
      penalty_note: [penaltyFor.penalty_note, penaltyNote.trim()].filter(Boolean).join('; '),
    });
    setFinance((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setPenaltyFor(null);
    setPenaltyAmt('');
    setPenaltyNote('');
    await updateRow('financial_records', updated.id, {
      penalty_amount: updated.penalty_amount, penalty_note: updated.penalty_note, total_pay: updated.total_pay,
    });
    showToast('✓ Đã ghi khoản phạt/đền bù');
  };

  const setStatus = async (f: FinancialRecord, status: FinancialRecord['status']) => {
    setFinance((prev) => prev.map((x) => (x.id === f.id ? { ...x, status } : x)));
    await updateRow('financial_records', f.id, { status });
    showToast(`✓ ${subconName(f.subcon_id)} · ${poCode(f.order_id)}: ${status}`);
  };

  // ── Xuất CSV P&L ──────────────────────────────────────────────────────────
  const exportCsv = () => {
    const header = 'PO;Nhan hang;San pham;Doanh thu FOB;Chi phi CMT;Chi phi NPL (uoc);Overhead;Lai/Lo;Margin %';
    const lines = pnl.map((r) => [
      r.order.po_code, r.order.brand, r.order.product_name,
      Math.round(r.revenue), Math.round(r.cmt), Math.round(r.npl), Math.round(r.overhead),
      Math.round(r.profit), r.marginPct.toFixed(1),
    ].join(';'));
    const blob = new Blob(['﻿' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monica-pnl-per-po.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Đã xuất file P&L (CSV)');
  };

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div>
      <PageHeader title="Kế toán & Costing" desc="Công nợ subcon lấy CĂN CỨ DUY NHẤT từ sản lượng QA Endline PASS"
        action={
          <div className="flex items-center gap-2">
            <MockBadge show={isMock} />
            <button className={btnGhost} onClick={exportCsv}><FileDown className="h-4 w-4" /> Xuất CSV P&amp;L</button>
          </div>
        } />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Wallet} tone="rose" label="Còn phải trả Subcon" value={fmtVND(kpi.payable)} sub="sau phạt & đối trừ tạm ứng" />
        <StatCard icon={HandCoins} tone="amber" label="Đã tạm ứng" value={fmtVND(kpi.advanced)} sub="sẽ đối trừ khi quyết toán" />
        <StatCard icon={ReceiptText} tone="slate" label="Phạt / Đền bù" value={fmtVND(kpi.penalties)} sub="vải hỏng vượt định mức, trễ tiến độ" />
        <StatCard icon={CalcIcon} tone="indigo" label="Chờ đối soát" value={fmtNum(kpi.pending)} sub="bảng kê chưa chốt" />
      </div>

      {/* Đối soát công nợ */}
      <Card className="mt-5" title="Bảng Đối soát Công nợ Subcon" icon={CircleDollarSign}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thCls}>Xưởng</th>
                <th className={thCls}>PO</th>
                <th className={`${thCls} text-right`}>SL đạt QA</th>
                <th className={`${thCls} text-right`}>Đơn giá CMT</th>
                <th className={`${thCls} text-right`}>Nghiệm thu</th>
                <th className={`${thCls} text-right`}>Phạt/Đền bù</th>
                <th className={`${thCls} text-right`}>Tạm ứng</th>
                <th className={`${thCls} text-right`}>Còn phải trả</th>
                <th className={thCls}>Trạng thái</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {finance.length === 0 && <tr><td colSpan={10}><EmptyState title="Chưa có bảng kê công nợ" sub="Bảng kê tự sinh khi QA duyệt lô ĐẠT cho PO subcon" /></td></tr>}
              {finance.map((f) => {
                const st = settleSubcon(f.qa_passed_qty, f.unit_price, f.penalty_amount, f.advance_pay);
                return (
                  <tr key={f.id} className="transition hover:bg-slate-50/70">
                    <td className={`${tdCls} font-medium text-slate-800`}>{subconName(f.subcon_id)}</td>
                    <td className={`${tdCls} font-semibold text-blue-700`}>{poCode(f.order_id)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(f.qa_passed_qty)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{fmtVND(f.unit_price)}</td>
                    <td className={`${tdCls} text-right tabular-nums font-medium`}>{fmtVND(st.gross)}</td>
                    <td className={`${tdCls} text-right tabular-nums text-rose-600`}>
                      − {fmtVND(f.penalty_amount)}
                      {f.penalty_note && <span className="block max-w-[180px] truncate text-[10px] text-slate-400" title={f.penalty_note}>{f.penalty_note}</span>}
                    </td>
                    <td className={`${tdCls} text-right tabular-nums text-amber-600`}>− {fmtVND(f.advance_pay)}</td>
                    <td className={`${tdCls} text-right font-bold tabular-nums ${st.net >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>{fmtVND(st.net)}</td>
                    <td className={tdCls}>
                      <select value={f.status} onChange={(e) => void setStatus(f, e.target.value as FinancialRecord['status'])}
                        className={`rounded-full border px-2 py-1 text-xs font-semibold focus:outline-none ${
                          f.status === 'Đã thanh toán' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : f.status === 'Đã chốt' ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        <option>Chờ đối soát</option><option>Đã chốt</option><option>Đã thanh toán</option>
                      </select>
                    </td>
                    <td className={tdCls}>
                      <span className="flex gap-1.5">
                        <button className={btnGhost} onClick={() => { setAdvanceFor(f); setAdvanceAmt(''); }}>
                          <HandCoins className="h-3.5 w-3.5" /> Tạm ứng
                        </button>
                        <button className={btnGhost} onClick={() => { setPenaltyFor(f); setPenaltyAmt(''); setPenaltyNote(''); }}>
                          <ReceiptText className="h-3.5 w-3.5" /> Phạt
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-50 px-5 py-2.5 text-[11px] text-slate-400">
          Còn phải trả = SL đạt QA × Đơn giá CMT − Phạt/Đền bù − Tạm ứng (lib/garment-math.settleSubcon).
        </p>
      </Card>

      {/* P&L per PO */}
      <Card className="mt-5" title="P&L per PO (Báo cáo lãi/lỗ từng đơn hàng)" icon={TrendingUp}
        action={
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <label className="flex items-center gap-1.5">NPL % FOB
              <input type="number" value={nplCostPct} onChange={(e) => setNplCostPct(e.target.value)}
                className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-right tabular-nums focus:border-blue-400 focus:outline-none" />
            </label>
            <label className="flex items-center gap-1.5">Overhead % FOB
              <input type="number" value={overheadPct} onChange={(e) => setOverheadPct(e.target.value)}
                className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-right tabular-nums focus:border-blue-400 focus:outline-none" />
            </label>
          </div>
        }>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thCls}>PO</th>
                <th className={thCls}>Sản phẩm</th>
                <th className={`${thCls} text-right`}>Doanh thu FOB</th>
                <th className={`${thCls} text-right`}>CMT</th>
                <th className={`${thCls} text-right`}>NPL (ước)</th>
                <th className={`${thCls} text-right`}>Overhead</th>
                <th className={`${thCls} text-right`}>Lãi / Lỗ</th>
                <th className={`${thCls} text-right`}>Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pnl.map((r) => (
                <tr key={r.order.id} className="transition hover:bg-slate-50/70">
                  <td className={`${tdCls} font-semibold text-blue-700`}>{r.order.po_code}</td>
                  <td className={tdCls}>{r.order.product_name}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtVND(r.revenue)}</td>
                  <td className={`${tdCls} text-right tabular-nums text-slate-500`}>− {fmtVND(r.cmt)}</td>
                  <td className={`${tdCls} text-right tabular-nums text-slate-500`}>− {fmtVND(r.npl)}</td>
                  <td className={`${tdCls} text-right tabular-nums text-slate-500`}>− {fmtVND(r.overhead)}</td>
                  <td className={`${tdCls} text-right font-bold tabular-nums ${r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {fmtVND(r.profit)}
                  </td>
                  <td className={tdCls + ' text-right'}>
                    {r.profit >= 0
                      ? <Badge tone="emerald" icon={TrendingUp}>{fmtPct(r.marginPct)}</Badge>
                      : <Badge tone="rose" icon={TrendingDown}>{fmtPct(r.marginPct)}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal tạm ứng */}
      <Modal open={!!advanceFor} title="Ghi nhận Tạm ứng cho Xưởng" onClose={() => setAdvanceFor(null)}>
        <div className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            {advanceFor && <>{subconName(advanceFor.subcon_id)} · {poCode(advanceFor.order_id)} — đã tạm ứng {fmtVND(advanceFor.advance_pay)}</>}
          </p>
          <Field label="Số tiền tạm ứng thêm (VNĐ)" hint="Sẽ tự đối trừ vào kỳ quyết toán">
            <input type="number" className={inputCls} value={advanceAmt} onChange={(e) => setAdvanceAmt(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setAdvanceFor(null)}>Hủy</button>
            <button className={btnPrimary} disabled={!advanceAmt} onClick={() => void addAdvance()}>
              <HandCoins className="h-4 w-4" /> Ghi tạm ứng
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal phạt */}
      <Modal open={!!penaltyFor} title="Ghi nhận Phạt / Đền bù" onClose={() => setPenaltyFor(null)}>
        <div className="space-y-4">
          <Field label="Số tiền (VNĐ)">
            <input type="number" className={inputCls} value={penaltyAmt} onChange={(e) => setPenaltyAmt(e.target.value)} />
          </Field>
          <Field label="Lý do" hint="VD: đền bù vải hỏng vượt định mức hao hụt, phạt trễ tiến độ theo hợp đồng">
            <textarea rows={2} className={inputCls} value={penaltyNote} onChange={(e) => setPenaltyNote(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setPenaltyFor(null)}>Hủy</button>
            <button className={btnPrimary} disabled={!penaltyAmt || !penaltyNote.trim()} onClick={() => void addPenalty()}>
              <BadgeCheck className="h-4 w-4" /> Ghi nhận
            </button>
          </div>
        </div>
      </Modal>

      <ToastView message={toast} />
    </div>
  );
}
