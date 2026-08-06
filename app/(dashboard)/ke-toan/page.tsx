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

// ============================================================================
// 🔴 SỬA 07/08/2026 — MÀN HÌNH NÀY ĐANG ĐỌC NHỮNG CỘT ⛔ KHÔNG TỒN TẠI
//
// `types/erp.ts` khai `Order` có `po_code · product_name · target_qty ·
// unit_price_fob · unit_price_cmt`. Bảng `orders` THẬT ⛔ **không có cột nào
// trong số đó** — nó có `po_number · style_code · total_quantity · unit_price
// · currency`.
//
// TypeScript **im lặng** vì kiểu đang nói dối; lúc chạy mọi trường thành
// `undefined`, phép nhân ra `NaN`, và `fmtVND` biến `NaN` thành **`0 ₫`**.
//
// 🔑 Hậu quả đo được trên phiên `kt001` thật: bảng *"P&L PER PO"* hiện **14
// dòng PO TRỐNG, mọi cột `0 ₫`, margin `0,0%`**. Kế toán đọc thành *"đơn nào
// cũng hoà vốn"* — một phát biểu tài chính **sai** về 14 đơn hàng thật.
//
// ⚠️ Đây đúng thứ Hiến pháp cảnh báo: **mã ⛔ không bao giờ là nguồn chân lý**.
// Kiểu dữ liệu cũng vậy — nó chỉ là *lời khai*, và lời khai này sai.
//
// ⇒ Khai lại hình dạng theo **CSDL đang chạy**, và ở đâu thiếu dữ liệu thì
// **nói ⚪ chưa đo được**, ⛔ KHÔNG điền 0 *(`V.1`)*.
// ============================================================================
interface DonThat {
  id: string;
  po_number: string | null;
  style_code: string | null;
  total_quantity: number | null;
  /** ⚠️ Đo được: **0/14 đơn có đơn giá**. Cột này gần như luôn `null`. */
  unit_price: number | null;
  currency: string | null;
}

/** Ô tiền ⛔ chưa tính được. `V.1`: *"⚪ chưa đo được"* ⛔ KHÁC *"0 ₫"*. */
function OChua() {
  return <span className="text-slate-400" title="Chưa có đơn giá FOB trên đơn hàng">⚪</span>;
}

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

  // ⚠️ Cột thật là `po_number`, ⛔ không phải `po_code`. Và khi ⛔ không tra
  // được thì hiện **`⛔ không rõ`** chứ ⛔ KHÔNG đổ nguyên UUID ra màn hình —
  // đó là thứ kế toán ⛔ không đọc được và cũng ⛔ không đối chiếu được.
  const poCode = useCallback(
    (id: string) =>
      (orders as unknown as DonThat[]).find((o) => o.id === id)?.po_number ?? '⛔ không rõ đơn',
    [orders],
  );
  const subconName = useCallback((id: string) => subcons.find((s) => s.id === id)?.name ?? id, [subcons]);

  const kpi = useMemo(() => ({
    payable: finance.filter((f) => f.status !== 'Đã thanh toán').reduce((s, f) => s + f.total_pay, 0),
    advanced: finance.reduce((s, f) => s + f.advance_pay, 0),
    penalties: finance.reduce((s, f) => s + f.penalty_amount, 0),
    pending: finance.filter((f) => f.status === 'Chờ đối soát').length,
  }), [finance]);

  // ── P&L per PO ────────────────────────────────────────────────────────────
  // 🔑 `null` nghĩa là **⛔ chưa tính được**, ⛔ không phải *"bằng 0"*. Mọi ô
  // dưới đây phải giữ được sự phân biệt đó cho tới tận lúc vẽ ra màn hình —
  // ép về 0 ở giữa đường là chỗ con số bắt đầu nói dối.
  const pnl = useMemo(() => (orders as unknown as DonThat[]).map((o) => {
    const sl = Number(o.total_quantity ?? 0) || 0;
    const gia = o.unit_price == null ? null : Number(o.unit_price) || 0;
    const revenue = gia == null || sl === 0 ? null : sl * gia;

    // ⚠️ ⛔ KHÔNG CÓ ĐƠN GIÁ CMT TRÊN `orders`. Giá CMT nằm ở
    // `financial_records.unit_price` — nhưng đó là giá **trả nhà thầu cho một
    // bảng kê**, ⛔ không phải giá thành gia công của cả đơn. Suy một cái ra
    // cái kia là **bịa số kế toán**, nên chỗ này để ⚪.
    const cmt: number | null = null;

    const npl = revenue == null ? null : revenue * ((Number(nplCostPct) || 0) / 100);
    const overhead = revenue == null ? null : revenue * ((Number(overheadPct) || 0) / 100);
    const profit = revenue == null || npl == null || overhead == null || cmt == null
      ? null
      : revenue - cmt - npl - overhead;
    const marginPct = profit == null || revenue == null || revenue <= 0
      ? null
      : (profit / revenue) * 100;
    return { order: o, sl, tien: o.currency ?? 'VND', revenue, cmt, npl, overhead, profit, marginPct };
  }), [orders, nplCostPct, overheadPct]);

  /** Bao nhiêu đơn ⛔ chưa nhập đơn giá — đây là **việc của kế toán**, ⛔ không
   *  phải một con số trang trí. */
  const thieuGia = useMemo(() => pnl.filter((r) => r.revenue === null).length, [pnl]);

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
    // ⚠️ Ô ⛔ chưa tính được xuất ra chữ `CHUA_DO_DUOC`, ⛔ **không** xuất `0`.
    // Tệp CSV đi ra ngoài phần mềm và ⛔ không mang theo màu ⚪ — một số `0`
    // trong đó sẽ được đọc là **số liệu tài chính thật**.
    const oCsv = (v: number | null) => (v == null ? 'CHUA_DO_DUOC' : String(Math.round(v)));
    const lines = pnl.map((r) => [
      r.order.po_number ?? '', r.order.style_code ?? '', r.tien,
      oCsv(r.revenue), oCsv(r.cmt), oCsv(r.npl), oCsv(r.overhead),
      oCsv(r.profit), r.marginPct == null ? 'CHUA_DO_DUOC' : r.marginPct.toFixed(1),
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
        {/* 🔴 NÓI THẲNG CÁI ĐANG THIẾU — `V.1`.
            Bảng đầy ô ⚪ mà ⛔ không giải thích thì người đọc tưởng phần mềm
            hỏng. Băng này biến nó thành **việc phải làm của kế toán**: đơn nào
            chưa có đơn giá thì ⛔ không ai tính được lãi lỗ, kể cả làm tay. */}
        {thieuGia > 0 && (
          <p role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            ⚠️ <strong>{thieuGia}/{pnl.length} đơn hàng chưa có đơn giá FOB</strong> trong CSDL
            ⇒ ⛔ <strong>không</strong> tính được doanh thu, lãi/lỗ và margin cho những đơn đó.
            <br />
            <span className="text-xs">
              Ô <strong>⚪</strong> nghĩa là <strong>chưa đo được</strong>, ⛔ <strong>không</strong> phải
              &quot;bằng 0&quot;. Nhập đơn giá ở phân hệ <strong>Merchandising → PO</strong> rồi quay lại.
            </span>
          </p>
        )}
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
                  <td className={`${tdCls} font-semibold text-blue-700`}>{r.order.po_number ?? '—'}</td>
                  <td className={tdCls}>
                    {r.order.style_code ?? '—'}
                    <span className="ml-2 text-xs text-slate-400 tabular-nums">{fmtNum(r.sl)} sp</span>
                  </td>
                  <td className={`${tdCls} text-right tabular-nums`}>
                    {r.revenue == null ? <OChua /> : `${fmtNum(r.revenue)} ${r.tien}`}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums text-slate-500`}>
                    {r.cmt == null ? <OChua /> : `− ${fmtNum(r.cmt)} ${r.tien}`}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums text-slate-500`}>
                    {r.npl == null ? <OChua /> : `− ${fmtNum(r.npl)} ${r.tien}`}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums text-slate-500`}>
                    {r.overhead == null ? <OChua /> : `− ${fmtNum(r.overhead)} ${r.tien}`}
                  </td>
                  <td className={`${tdCls} text-right font-bold tabular-nums ${r.profit == null ? '' : r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {r.profit == null ? <OChua /> : `${fmtNum(r.profit)} ${r.tien}`}
                  </td>
                  <td className={tdCls + ' text-right'}>
                    {r.marginPct == null
                      ? <OChua />
                      : r.marginPct >= 0
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
