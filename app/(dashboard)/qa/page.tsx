'use client';

// ============================================================================
// MODULE 8 — QA / QC
// Kiểm Inline (DHU/RFT) & Endline theo AQL 2.5 chuẩn ISO 2859-1 · Pareto · CAPA
// Lô PASS tự chảy về Kho Thành phẩm + Công nợ Kế toán (Single Source of Truth)
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck, PlusCircle, BarChart3, CheckCircle2, XCircle, FileSearch,
  ClipboardCheck, Percent,
} from 'lucide-react';
import {
  Card, PageHeader, StatCard, Badge, EmptyState, AccessDenied, MockBadge,
  Modal, Field, inputCls, btnPrimary, btnGhost, thCls, tdCls, useToast, ToastView,
} from '@/components/ui';
import { useSession, useTimeFilter, inTimeRange } from '@/lib/hooks';
import { canAccess } from '@/lib/auth';
import { fetchTables, insertRow, updateRow, genId, subscribeTables } from '@/lib/supabase';
import {
  aqlLookup, aqlJudge, dhu, rftPercent, settleSubcon,
  fmtNum, fmtPct, fmtDateTime,
} from '@/lib/garment-math';
import type { Order, QALog, FinancialRecord, InventoryItem, DefectClass } from '@/types/erp';

const MODULE_PATH = '/qa';
const DEFECT_GROUPS = [
  'Bỏ mũi', 'Đứt chỉ', 'Nhăn mũi may', 'Lệch sọc/kẻ', 'Sụp mí',
  'Loang màu (khác shade)', 'Rách/thủng vải', 'Cúc gãy/lệch', 'Khóa/dây kéo hỏng',
  'Nhãn sai/lệch', 'Dơ dầu máy', 'Chỉ thừa', 'Sót kim gãy',
];

export default function QaPage() {
  const { session, ready } = useSession();
  const range = useTimeFilter();
  const { toast, showToast } = useToast();

  const [isMock, setIsMock] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [qaLogs, setQaLogs] = useState<QALog[]>([]);
  const [finance, setFinance] = useState<FinancialRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [showEndline, setShowEndline] = useState(false);
  const [showInline, setShowInline] = useState(false);
  const [capaFor, setCapaFor] = useState<QALog | null>(null);
  const [capaText, setCapaText] = useState('');

  // Form Endline (AQL)
  const [fe, setFe] = useState({ order_id: '', lot_size: '', critical: '0', major: '0', minor: '0', defect_type: DEFECT_GROUPS[0] });
  // Form Inline
  const [fi, setFi] = useState({ order_id: '', checked: '', defect_type: DEFECT_GROUPS[0], defect_class: 'Major' as DefectClass, qty: '' });

  const load = useCallback(async () => {
    const { data, isMock } = await fetchTables(['orders', 'qa_logs', 'financial_records', 'inventory']);
    setOrders(data.orders as Order[]);
    setQaLogs(data.qa_logs as QALog[]);
    setFinance(data.financial_records as FinancialRecord[]);
    setInventory(data.inventory as InventoryItem[]);
    setIsMock(isMock);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['qa_logs'], () => { void load(); }), [load]);

  const poCode = useCallback((id: string) => orders.find((o) => o.id === id)?.po_code ?? id, [orders]);

  const logsInRange = useMemo(
    () => qaLogs.filter((l) => inTimeRange(l.created_at, range)),
    [qaLogs, range],
  );
  const inline = logsInRange.filter((l) => l.inspection_type === 'Inline');
  const endline = useMemo(
    () => logsInRange.filter((l) => l.inspection_type === 'Endline')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [logsInRange],
  );

  // KPI chất lượng
  const kpi = useMemo(() => {
    const checked = inline.reduce((s, l) => s + l.checked_qty, 0);
    const defects = inline.reduce((s, l) => s + l.qty_defect, 0);
    return {
      dhu: dhu(defects, checked),
      rft: rftPercent(Math.max(0, checked - defects), checked),
      passQty: endline.filter((l) => l.aql_status === 'Pass').reduce((s, l) => s + l.lot_size, 0),
      failLots: endline.filter((l) => l.aql_status === 'Fail').length,
    };
  }, [inline, endline]);

  // Pareto Top 5 lỗi (từ Inline) + % cộng dồn
  const pareto = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const l of inline) byType[l.defect_type] = (byType[l.defect_type] || 0) + l.qty_defect;
    const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const total = Object.values(byType).reduce((s, v) => s + v, 0) || 1;
    let cum = 0;
    return sorted.map(([type, qty]) => {
      cum += qty;
      return { type, qty, cumPct: (cum / total) * 100 };
    });
  }, [inline]);
  const paretoMax = Math.max(...pareto.map((p) => p.qty), 1);

  // Tra AQL live cho form Endline
  const plan = aqlLookup(Number(fe.lot_size) || 0);
  const verdict = plan ? aqlJudge(Number(fe.critical) || 0, Number(fe.major) || 0, plan) : null;

  // ── Gửi kết quả Endline: PASS → chảy về Kho TP + Công nợ Kế toán ─────────
  const submitEndline = async () => {
    const order = orders.find((o) => o.id === fe.order_id);
    if (!order || !plan || !verdict) return;
    const lot = Number(fe.lot_size) || 0;
    const row: QALog = {
      id: genId('Q'), order_id: order.id, inspection_type: 'Endline',
      lot_size: lot, sample_size: plan.sampleSize, ac_number: plan.ac, re_number: plan.re,
      defect_type: fe.defect_type, defect_class: 'Major',
      qty_defect: Number(fe.major) || 0, checked_qty: plan.sampleSize,
      aql_status: verdict, capa_note: '', created_at: new Date().toISOString(),
    };
    setQaLogs((prev) => [row, ...prev]);
    setShowEndline(false);
    const { id: _omit, ...payload } = row;
    void insertRow('qa_logs', payload);

    if (verdict === 'Pass') {
      // 1) Cộng vào Kho Thành phẩm
      const tpName = `TP: ${order.product_name} (${order.po_code})`;
      const existing = inventory.find((i) => i.type === 'Thành phẩm' && i.order_id === order.id);
      if (existing) {
        const newQty = existing.roll_count + lot;
        setInventory((prev) => prev.map((i) => (i.id === existing.id ? { ...i, roll_count: newQty } : i)));
        void updateRow('inventory', existing.id, { roll_count: newQty });
      } else {
        const inv: InventoryItem = {
          id: genId('I'), item_name: tpName, type: 'Thành phẩm', qty_kg: 0, qty_m: 0,
          gsm: 0, width_m: 0, color_code: '', dye_lot: '', shade: '', roll_count: lot,
          safety_stock: 0, order_id: order.id,
        };
        setInventory((prev) => [...prev, inv]);
        const { id: _o, ...p } = inv;
        void insertRow('inventory', p);
      }
      // 2) Cộng vào công nợ subcon (căn cứ duy nhất để thanh toán)
      if (order.subcon_id) {
        const rec = finance.find((f) => f.order_id === order.id && f.subcon_id === order.subcon_id);
        if (rec) {
          const qty = rec.qa_passed_qty + lot;
          const total = settleSubcon(qty, rec.unit_price, rec.penalty_amount, rec.advance_pay).net;
          setFinance((prev) => prev.map((f) => (f.id === rec.id ? { ...f, qa_passed_qty: qty, total_pay: total } : f)));
          void updateRow('financial_records', rec.id, { qa_passed_qty: qty, total_pay: total });
        } else {
          const total = settleSubcon(lot, order.unit_price_cmt, 0, 0).net;
          const nf: FinancialRecord = {
            id: genId('F'), order_id: order.id, subcon_id: order.subcon_id, qa_passed_qty: lot,
            unit_price: order.unit_price_cmt, penalty_amount: 0, penalty_note: '',
            advance_pay: 0, total_pay: total, status: 'Chờ đối soát',
          };
          setFinance((prev) => [...prev, nf]);
          const { id: _o, ...p } = nf;
          void insertRow('financial_records', p);
        }
      }
      showToast(`✓ Lô ${order.po_code} ĐẠT AQL — ${fmtNum(lot)} SP đã chảy về Kho TP & Công nợ`);
    } else {
      showToast(`✕ Lô ${order.po_code} RỚT AQL 2.5 — yêu cầu tái chế & lập CAPA`);
    }
    setFe({ order_id: '', lot_size: '', critical: '0', major: '0', minor: '0', defect_type: DEFECT_GROUPS[0] });
  };

  const submitInline = async () => {
    const order = orders.find((o) => o.id === fi.order_id);
    if (!order) return;
    const row: QALog = {
      id: genId('Q'), order_id: order.id, inspection_type: 'Inline',
      lot_size: 0, sample_size: 0, ac_number: 0, re_number: 0,
      defect_type: fi.defect_type, defect_class: fi.defect_class,
      qty_defect: Number(fi.qty) || 0, checked_qty: Number(fi.checked) || 0,
      aql_status: 'Pending', capa_note: '', created_at: new Date().toISOString(),
    };
    setQaLogs((prev) => [row, ...prev]);
    setShowInline(false);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('qa_logs', payload);
    showToast(ok ? '✓ Đã ghi kiểm Inline' : 'Đã ghi kiểm Inline (offline)');
    setFi({ order_id: '', checked: '', defect_type: DEFECT_GROUPS[0], defect_class: 'Major', qty: '' });
  };

  const saveCapa = async () => {
    if (!capaFor) return;
    setQaLogs((prev) => prev.map((l) => (l.id === capaFor.id ? { ...l, capa_note: capaText } : l)));
    await updateRow('qa_logs', capaFor.id, { capa_note: capaText });
    setCapaFor(null);
    showToast('✓ Đã lưu biện pháp CAPA');
  };

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div>
      <PageHeader title="QA / QC" desc="Inline (DHU · RFT) — Endline theo bảng AQL 2.5 ISO 2859-1, Level II"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MockBadge show={isMock} />
            <button className={btnGhost} onClick={() => setShowInline(true)}><FileSearch className="h-4 w-4" /> Kiểm Inline</button>
            <button className={btnPrimary} onClick={() => setShowEndline(true)}><ClipboardCheck className="h-4 w-4" /> Kiểm Endline (AQL)</button>
          </div>
        } />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Percent} tone={kpi.dhu > 10 ? 'rose' : 'indigo'} alert={kpi.dhu > 10}
          label="DHU (lỗi/100 SP)" value={fmtPct(kpi.dhu, 1)} sub="tổng lỗi / SP kiểm Inline × 100" />
        <StatCard icon={CheckCircle2} tone={kpi.rft >= 95 ? 'emerald' : 'amber'}
          label="RFT (đạt ngay lần đầu)" value={fmtPct(kpi.rft, 1)} sub="mục tiêu ≥ 95%" />
        <StatCard icon={ShieldCheck} tone="emerald" label="SP đạt Endline" value={fmtNum(kpi.passQty)} sub="đã chảy về Kho TP + Kế toán" />
        <StatCard icon={XCircle} tone={kpi.failLots > 0 ? 'rose' : 'slate'} alert={kpi.failLots > 0}
          label="Lô rớt AQL" value={fmtNum(kpi.failLots)} sub={kpi.failLots > 0 ? 'Cần tái chế + CAPA' : 'Không có lô rớt'} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Pareto */}
        <Card title="Pareto Top 5 lỗi phổ biến (Inline)" icon={BarChart3}>
          <div className="space-y-3 p-5">
            {pareto.length === 0 && <EmptyState title="Chưa có dữ liệu lỗi Inline" />}
            {pareto.map((p, idx) => (
              <div key={p.type}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-slate-600">{idx + 1}. {p.type}</span>
                  <span className="text-xs tabular-nums text-slate-500">
                    <b className="text-slate-800">{fmtNum(p.qty)}</b> lỗi · cộng dồn {fmtPct(p.cumPct, 0)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${(p.qty / paretoMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-slate-50 px-5 py-2.5 text-[11px] text-slate-400">
            Nguyên tắc 80/20: tập trung CAPA vào nhóm lỗi đầu bảng để giảm DHU nhanh nhất.
          </p>
        </Card>

        {/* Nhật ký Inline */}
        <Card title="Nhật ký kiểm Inline" icon={FileSearch}>
          <div className="max-h-[360px] overflow-y-auto">
            <ul className="divide-y divide-slate-50">
              {inline.length === 0 && <EmptyState title="Chưa có bản ghi Inline" />}
              {inline.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                  <span className="text-xs tabular-nums text-slate-400">{fmtDateTime(l.created_at)}</span>
                  <span className="text-sm font-semibold text-indigo-700">{poCode(l.order_id)}</span>
                  <span className="text-sm text-slate-600">{l.defect_type}</span>
                  <Badge tone={l.defect_class === 'Critical' ? 'rose' : l.defect_class === 'Major' ? 'amber' : 'slate'}>
                    {l.defect_class}
                  </Badge>
                  <span className="ml-auto text-sm tabular-nums">
                    <b className="text-rose-600">{fmtNum(l.qty_defect)}</b>
                    <span className="text-slate-400"> / {fmtNum(l.checked_qty)} kiểm</span>
                  </span>
                  <button onClick={() => { setCapaFor(l); setCapaText(l.capa_note); }}
                    className="text-xs font-medium text-indigo-600 hover:underline">CAPA</button>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Endline lots */}
      <Card className="mt-5" title="Kết quả Endline theo AQL 2.5" icon={ClipboardCheck}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thCls}>Thời gian</th>
                <th className={thCls}>PO</th>
                <th className={`${thCls} text-right`}>Cỡ lô</th>
                <th className={`${thCls} text-right`}>Mẫu (n)</th>
                <th className={`${thCls} text-right`}>Ac / Re</th>
                <th className={`${thCls} text-right`}>Lỗi Major</th>
                <th className={thCls}>Kết luận</th>
                <th className={thCls}>CAPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {endline.length === 0 && <tr><td colSpan={8}><EmptyState title="Chưa có lô Endline nào" /></td></tr>}
              {endline.map((l) => (
                <tr key={l.id} className="transition hover:bg-slate-50/70">
                  <td className={`${tdCls} text-slate-400`}>{fmtDateTime(l.created_at)}</td>
                  <td className={`${tdCls} font-semibold text-indigo-700`}>{poCode(l.order_id)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(l.lot_size)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(l.sample_size)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{l.ac_number} / {l.re_number}</td>
                  <td className={`${tdCls} text-right font-semibold tabular-nums`}>{fmtNum(l.qty_defect)}</td>
                  <td className={tdCls}>
                    {l.aql_status === 'Pass'
                      ? <Badge tone="emerald" icon={CheckCircle2}>ĐẠT — nhập kho TP</Badge>
                      : <Badge tone="rose" icon={XCircle}>RỚT — tái chế</Badge>}
                  </td>
                  <td className={`${tdCls} max-w-[220px]`}>
                    <button onClick={() => { setCapaFor(l); setCapaText(l.capa_note); }}
                      className="truncate text-left text-xs text-slate-500 hover:text-indigo-600 hover:underline">
                      {l.capa_note || '+ Thêm biện pháp'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Endline AQL */}
      <Modal open={showEndline} title="Kiểm Endline — AQL 2.5 (ISO 2859-1, Level II)" onClose={() => setShowEndline(false)} wide>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="PO / Lô hàng">
            <select className={inputCls} value={fe.order_id} onChange={(e) => setFe({ ...fe, order_id: e.target.value })}>
              <option value="">— Chọn PO —</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.po_code} · {o.product_name}</option>)}
            </select>
          </Field>
          <Field label="Cỡ lô (SP)"><input type="number" className={inputCls} value={fe.lot_size} onChange={(e) => setFe({ ...fe, lot_size: e.target.value })} /></Field>
        </div>

        <div className={`mt-3 rounded-xl px-4 py-3 text-sm ${plan ? 'bg-indigo-50 text-indigo-800' : 'bg-amber-50 text-amber-700'}`}>
          {plan ? (
            <>Bảng AQL 2.5 → Cỡ mẫu <b className="tabular-nums">n = {plan.sampleSize}</b> · Chấp nhận <b>Ac = {plan.ac}</b> · Từ chối <b>Re = {plan.re}</b> (lỗi Major)</>
          ) : (
            <>Lô &lt; 91 SP — theo quy trình phải <b>kiểm 100%</b>, không áp dụng chọn mẫu AQL.</>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Field label="Lỗi Critical" hint="≥1 là RỚT ngay"><input type="number" className={inputCls} value={fe.critical} onChange={(e) => setFe({ ...fe, critical: e.target.value })} /></Field>
          <Field label="Lỗi Major"><input type="number" className={inputCls} value={fe.major} onChange={(e) => setFe({ ...fe, major: e.target.value })} /></Field>
          <Field label="Lỗi Minor"><input type="number" className={inputCls} value={fe.minor} onChange={(e) => setFe({ ...fe, minor: e.target.value })} /></Field>
        </div>
        <Field label="Nhóm lỗi chủ yếu">
          <select className={inputCls} value={fe.defect_type} onChange={(e) => setFe({ ...fe, defect_type: e.target.value })}>
            {DEFECT_GROUPS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>

        {verdict && (
          <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${verdict === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {verdict === 'Pass' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {verdict === 'Pass'
              ? 'KẾT LUẬN: ĐẠT — số lượng lô sẽ tự cộng vào Kho Thành phẩm và Công nợ Kế toán'
              : 'KẾT LUẬN: RỚT LÔ — vượt Ac hoặc có lỗi Critical; yêu cầu tái chế toàn lô'}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setShowEndline(false)}>Hủy</button>
          <button className={btnPrimary} disabled={!fe.order_id || !plan} onClick={() => void submitEndline()}>
            <ClipboardCheck className="h-4 w-4" /> Chốt kết quả lô
          </button>
        </div>
      </Modal>

      {/* Modal Inline */}
      <Modal open={showInline} title="Ghi kiểm Inline (trên chuyền)" onClose={() => setShowInline(false)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="PO">
            <select className={inputCls} value={fi.order_id} onChange={(e) => setFi({ ...fi, order_id: e.target.value })}>
              <option value="">— Chọn PO —</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.po_code}</option>)}
            </select>
          </Field>
          <Field label="Số SP đã kiểm"><input type="number" className={inputCls} value={fi.checked} onChange={(e) => setFi({ ...fi, checked: e.target.value })} /></Field>
          <Field label="Loại lỗi">
            <select className={inputCls} value={fi.defect_type} onChange={(e) => setFi({ ...fi, defect_type: e.target.value })}>
              {DEFECT_GROUPS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Phân cấp">
            <select className={inputCls} value={fi.defect_class} onChange={(e) => setFi({ ...fi, defect_class: e.target.value as DefectClass })}>
              <option value="Critical">Critical</option><option value="Major">Major</option><option value="Minor">Minor</option>
            </select>
          </Field>
          <Field label="Số lỗi phát hiện"><input type="number" className={inputCls} value={fi.qty} onChange={(e) => setFi({ ...fi, qty: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setShowInline(false)}>Hủy</button>
          <button className={btnPrimary} disabled={!fi.order_id || !fi.checked} onClick={() => void submitInline()}>
            <FileSearch className="h-4 w-4" /> Ghi kết quả
          </button>
        </div>
      </Modal>

      {/* Modal CAPA */}
      <Modal open={!!capaFor} title="Biện pháp khắc phục (CAPA)" onClose={() => setCapaFor(null)}>
        <div className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            {capaFor && <>Lỗi: <b>{capaFor.defect_type}</b> · {poCode(capaFor.order_id)} · {capaFor.inspection_type}</>}
          </p>
          <Field label="Biện pháp CAPA" hint="Corrective & Preventive Action — hành động khắc phục và phòng ngừa tái diễn">
            <textarea rows={3} className={inputCls} value={capaText} onChange={(e) => setCapaText(e.target.value)}
              placeholder="VD: Thay kim #11, đào tạo lại thao tác, kiểm 100% bó kế tiếp…" />
          </Field>
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setCapaFor(null)}>Hủy</button>
            <button className={btnPrimary} onClick={() => void saveCapa()}>Lưu CAPA</button>
          </div>
        </div>
      </Modal>

      <ToastView message={toast} />
    </div>
  );
}
