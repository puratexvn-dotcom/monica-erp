'use client';

// ============================================================================
// MODULE 3 — MD (MERCHANDISER)
// Quản lý PO · BOM NPL · Tiến độ mẫu (Proto→Fit→SMS→PP→TOP) · Costing & Margin
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardList, PlusCircle, Layers, FlaskConical, Calculator as CalcIcon,
  PackageCheck, PackageX, Truck, CircleDashed, CheckCircle2, XCircle, Send,
} from 'lucide-react';
import {
  Card, PageHeader, Badge, ProgressBar, EmptyState, AccessDenied, MockBadge,
  Modal, Field, inputCls, btnPrimary, btnGhost, thCls, tdCls, useToast, ToastView,
} from '@/components/ui';
import { useSession } from '@/lib/hooks';
import { canAccess } from '@/lib/auth';
import { fetchTables, insertRow, updateRow, genId, subscribeTables } from '@/lib/supabase';
import { bomTotalNeed, fmtNum, fmtNum1, fmtNum2, fmtVND, fmtPct, fmtDate, progressPercent } from '@/lib/garment-math';
import type {
  Order, BomItem, SampleRecord, ProdLog, Subcon, SewingLine,
  BomCategory, NplStatus, SampleStage, SampleStatus,
} from '@/types/erp';

const MODULE_PATH = '/md';
const SIZES = ['S', 'M', 'L', 'XL'];
const SAMPLE_STAGES: SampleStage[] = ['Proto', 'Fit', 'SMS', 'PP', 'TOP'];
const SAMPLE_STATUSES: SampleStatus[] = ['Đang làm', 'Đã gửi', 'Approved', 'Rejected'];
const BOM_CATEGORIES: BomCategory[] = ['Vải', 'Chỉ', 'Cúc', 'Khóa', 'Nhãn', 'Bao bì'];
const NPL_STATUSES: NplStatus[] = ['Đã về kho', 'Đang về', 'Chưa đặt', 'Thiếu hụt'];

const NPL_BADGE: Record<NplStatus, { tone: 'emerald' | 'amber' | 'slate' | 'rose'; icon: typeof PackageCheck }> = {
  'Đã về kho': { tone: 'emerald', icon: PackageCheck },
  'Đang về': { tone: 'amber', icon: Truck },
  'Chưa đặt': { tone: 'slate', icon: CircleDashed },
  'Thiếu hụt': { tone: 'rose', icon: PackageX },
};
const SAMPLE_BADGE: Record<SampleStatus, { tone: 'slate' | 'amber' | 'emerald' | 'rose'; icon: typeof Send }> = {
  'Đang làm': { tone: 'slate', icon: CircleDashed },
  'Đã gửi': { tone: 'amber', icon: Send },
  Approved: { tone: 'emerald', icon: CheckCircle2 },
  Rejected: { tone: 'rose', icon: XCircle },
};

export default function MdPage() {
  const { session, ready } = useSession();
  const { toast, showToast } = useToast();

  const [isMock, setIsMock] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bom, setBom] = useState<BomItem[]>([]);
  const [samples, setSamples] = useState<SampleRecord[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [subcons, setSubcons] = useState<Subcon[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [nplCostPerPcs, setNplCostPerPcs] = useState<number>(95000); // chi phí NPL ước tính/SP

  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showAddBom, setShowAddBom] = useState(false);

  // Form tạo PO
  const [fPo, setFPo] = useState({ po_code: '', brand: '', product_name: '', cmt: '', fob: '', etd: '', xfactory: '', assign: '' });
  const [fSizes, setFSizes] = useState<Record<string, string>>({ S: '', M: '', L: '', XL: '' });
  // Form BOM
  const [fBom, setFBom] = useState({ item_name: '', category: 'Vải' as BomCategory, unit: 'm', norm: '', wastage: '3', npl_status: 'Chưa đặt' as NplStatus });

  const load = useCallback(async () => {
    const { data, isMock } = await fetchTables(['orders', 'bom', 'samples', 'prod_logs', 'subcons', 'sewing_lines']);
    setOrders(data.orders as Order[]);
    setBom(data.bom as BomItem[]);
    setSamples(data.samples as SampleRecord[]);
    setProdLogs(data.prod_logs as ProdLog[]);
    setSubcons(data.subcons as Subcon[]);
    setLines(data.sewing_lines as SewingLine[]);
    setIsMock(isMock);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['orders', 'bom', 'samples'], () => { void load(); }), [load]);
  useEffect(() => {
    if (!selectedId && orders.length > 0) setSelectedId(orders[0].id);
  }, [orders, selectedId]);

  const doneByOrder = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of prodLogs) m[l.order_id] = (m[l.order_id] || 0) + (Number(l.qty_ok) || 0);
    return m;
  }, [prodLogs]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const selectedBom = bom.filter((b) => b.order_id === selectedId);
  const selectedSamples = samples.filter((s) => s.order_id === selectedId);

  const assignName = (o: Order): string => {
    if (o.subcon_id) return subcons.find((s) => s.id === o.subcon_id)?.name ?? `Xưởng #${o.subcon_id}`;
    if (o.line_id) return lines.find((l) => l.id === o.line_id)?.name ?? `Chuyền #${o.line_id}`;
    return 'Chưa phân bổ';
  };

  // ── Tạo PO ────────────────────────────────────────────────────────────────
  const createPO = async () => {
    const target = SIZES.reduce((s, k) => s + (Number(fSizes[k]) || 0), 0);
    const size_breakdown: Record<string, number> = {};
    SIZES.forEach((k) => { if (Number(fSizes[k]) > 0) size_breakdown[k] = Number(fSizes[k]); });
    const row: Order = {
      id: genId('O'),
      po_code: fPo.po_code.trim(),
      brand: fPo.brand.trim(),
      product_name: fPo.product_name.trim(),
      target_qty: target,
      size_breakdown,
      unit_price_cmt: Number(fPo.cmt) || 0,
      unit_price_fob: Number(fPo.fob) || 0,
      status: 'Mới',
      etd_date: fPo.etd,
      xfactory_date: fPo.xfactory,
      subcon_id: fPo.assign.startsWith('SC') ? fPo.assign : null,
      line_id: fPo.assign.startsWith('L') ? fPo.assign : null,
      created_at: new Date().toISOString(),
    };
    setOrders((prev) => [row, ...prev]);
    setShowCreatePO(false);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('orders', payload);
    showToast(ok ? `✓ Đã tạo ${row.po_code} trên Supabase` : `Đã tạo ${row.po_code} (offline — lưu cục bộ)`);
    setFPo({ po_code: '', brand: '', product_name: '', cmt: '', fob: '', etd: '', xfactory: '', assign: '' });
    setFSizes({ S: '', M: '', L: '', XL: '' });
  };

  // ── Thêm dòng BOM ─────────────────────────────────────────────────────────
  const addBom = async () => {
    if (!selected) return;
    const row: BomItem = {
      id: genId('B'),
      order_id: selected.id,
      item_name: fBom.item_name.trim(),
      category: fBom.category,
      unit: fBom.unit,
      norm_per_pcs: Number(fBom.norm) || 0,
      wastage_percent: Number(fBom.wastage) || 0,
      npl_status: fBom.npl_status,
    };
    setBom((prev) => [...prev, row]);
    setShowAddBom(false);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('bom', payload);
    showToast(ok ? '✓ Đã thêm định mức BOM' : 'Đã thêm BOM (offline)');
    setFBom({ item_name: '', category: 'Vải', unit: 'm', norm: '', wastage: '3', npl_status: 'Chưa đặt' });
  };

  // ── Cập nhật trạng thái mẫu / NPL ─────────────────────────────────────────
  const setSampleStatus = async (s: SampleRecord, status: SampleStatus) => {
    setSamples((prev) => prev.map((x) => (x.id === s.id ? { ...x, status, sent_date: status === 'Đã gửi' ? new Date().toISOString() : x.sent_date } : x)));
    await updateRow('samples', s.id, { status });
    showToast(`Mẫu ${s.stage}: ${status}`);
  };
  const setNplStatus = async (b: BomItem, npl_status: NplStatus) => {
    setBom((prev) => prev.map((x) => (x.id === b.id ? { ...x, npl_status } : x)));
    await updateRow('bom', b.id, { npl_status });
  };

  // ── Costing ───────────────────────────────────────────────────────────────
  const costing = useMemo(() => {
    if (!selected) return null;
    const cost = selected.unit_price_cmt + nplCostPerPcs;
    const margin = selected.unit_price_fob - cost;
    const marginPct = selected.unit_price_fob > 0 ? (margin / selected.unit_price_fob) * 100 : 0;
    return { cost, margin, marginPct };
  }, [selected, nplCostPerPcs]);

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div>
      <PageHeader title="Merchandiser (MD)" desc="Quản lý PO · BOM nguyên phụ liệu · Tiến độ mẫu · Costing"
        action={
          <div className="flex items-center gap-2">
            <MockBadge show={isMock} />
            <button className={btnPrimary} onClick={() => setShowCreatePO(true)}>
              <PlusCircle className="h-4 w-4" /> Tạo PO mới
            </button>
          </div>
        } />

      {/* Bảng PO */}
      <Card title={`Danh sách PO (${orders.length})`} icon={ClipboardList}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thCls}>Mã PO</th>
                <th className={thCls}>Nhãn hàng</th>
                <th className={thCls}>Sản phẩm</th>
                <th className={thCls}>Nơi sản xuất</th>
                <th className={`${thCls} text-right`}>Mục tiêu</th>
                <th className={thCls}>Tiến độ</th>
                <th className={thCls}>X-Factory</th>
                <th className={thCls}>Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.length === 0 && <tr><td colSpan={8}><EmptyState title="Chưa có PO — bấm Tạo PO mới" /></td></tr>}
              {orders.map((o) => {
                const done = doneByOrder[o.id] || 0;
                const pct = progressPercent(done, o.target_qty);
                return (
                  <tr key={o.id} onClick={() => setSelectedId(o.id)}
                    className={`cursor-pointer transition ${selectedId === o.id ? 'bg-indigo-50/60' : 'hover:bg-slate-50/70'}`}>
                    <td className={`${tdCls} font-semibold text-indigo-700`}>{o.po_code}</td>
                    <td className={tdCls}>{o.brand}</td>
                    <td className={`${tdCls} font-medium text-slate-800`}>{o.product_name}</td>
                    <td className={tdCls}>{assignName(o)}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(o.target_qty)}</td>
                    <td className={tdCls}>
                      <ProgressBar pct={pct} />
                      <span className="mt-0.5 block text-[11px] tabular-nums text-slate-400">{fmtNum(done)}/{fmtNum(o.target_qty)}</span>
                    </td>
                    <td className={`${tdCls} text-slate-500`}>{fmtDate(o.xfactory_date)}</td>
                    <td className={tdCls}>
                      <Badge tone={o.status === 'Hoàn thành' || o.status === 'Đã xuất' ? 'emerald' : o.status === 'Mới' ? 'slate' : 'indigo'}>
                        {o.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-50 px-5 py-2.5 text-[11px] text-slate-400">
          Bấm vào một PO để xem BOM, tiến độ mẫu và costing bên dưới.
        </p>
      </Card>

      {selected && (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* BOM */}
          <Card className="xl:col-span-2" title={`BOM — ${selected.po_code}`} icon={Layers}
            action={<button className={btnGhost} onClick={() => setShowAddBom(true)}><PlusCircle className="h-4 w-4" /> Thêm NPL</button>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={thCls}>Nguyên phụ liệu</th>
                    <th className={thCls}>Nhóm</th>
                    <th className={`${thCls} text-right`}>Định mức/SP</th>
                    <th className={`${thCls} text-right`}>Hao hụt</th>
                    <th className={`${thCls} text-right`}>Tổng nhu cầu</th>
                    <th className={thCls}>Trạng thái NPL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedBom.length === 0 && <tr><td colSpan={6}><EmptyState title="PO chưa có BOM" sub="Bấm Thêm NPL để lập định mức" /></td></tr>}
                  {selectedBom.map((b) => {
                    const need = bomTotalNeed(selected.target_qty, b.norm_per_pcs, b.wastage_percent);
                    const bd = NPL_BADGE[b.npl_status];
                    return (
                      <tr key={b.id} className="transition hover:bg-slate-50/70">
                        <td className={`${tdCls} font-medium text-slate-800`}>{b.item_name}</td>
                        <td className={tdCls}><Badge tone="slate">{b.category}</Badge></td>
                        <td className={`${tdCls} text-right tabular-nums`}>{fmtNum2(b.norm_per_pcs)} {b.unit}</td>
                        <td className={`${tdCls} text-right tabular-nums`}>{fmtPct(b.wastage_percent)}</td>
                        <td className={`${tdCls} text-right font-semibold tabular-nums text-slate-900`}>{fmtNum1(need)} {b.unit}</td>
                        <td className={tdCls}>
                          <select value={b.npl_status} onChange={(e) => void setNplStatus(b, e.target.value as NplStatus)}
                            className={`rounded-full border px-2 py-1 text-xs font-semibold focus:outline-none ${
                              bd.tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : bd.tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : bd.tone === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                            {NPL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-50 px-5 py-2.5 text-[11px] text-slate-400">
              Tổng nhu cầu = Mục tiêu PO × Định mức/SP × (1 + Hao hụt %) — tính bằng lib/garment-math.
            </p>
          </Card>

          {/* Mẫu + Costing */}
          <div className="space-y-5">
            <Card title="Tiến độ Mẫu" icon={FlaskConical}>
              <ul className="divide-y divide-slate-50">
                {SAMPLE_STAGES.map((stage) => {
                  const s = selectedSamples.find((x) => x.stage === stage);
                  if (!s) {
                    return (
                      <li key={stage} className="flex items-center justify-between px-5 py-3">
                        <span className="text-sm font-medium text-slate-400">{stage}</span>
                        <Badge tone="slate" icon={CircleDashed}>Chưa bắt đầu</Badge>
                      </li>
                    );
                  }
                  const bd = SAMPLE_BADGE[s.status];
                  return (
                    <li key={stage} className="px-5 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">{stage}</span>
                        <select value={s.status} onChange={(e) => void setSampleStatus(s, e.target.value as SampleStatus)}
                          className={`rounded-full border px-2 py-1 text-xs font-semibold focus:outline-none ${
                            bd.tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : bd.tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : bd.tone === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                          {SAMPLE_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
                        </select>
                      </div>
                      {s.buyer_comment && <p className="mt-1 text-xs text-slate-400">💬 {s.buyer_comment}</p>}
                      {s.sent_date && <p className="mt-0.5 text-[11px] text-slate-400">Gửi: {fmtDate(s.sent_date)}</p>}
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card title="Costing & Margin dự kiến" icon={CalcIcon}>
              <div className="space-y-2.5 p-5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Giá bán FOB</span><span className="font-semibold tabular-nums">{fmtVND(selected.unit_price_fob)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Đơn giá CMT</span><span className="tabular-nums">− {fmtVND(selected.unit_price_cmt)}</span></div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Chi phí NPL ước tính/SP</span>
                  <input type="number" value={nplCostPerPcs} onChange={(e) => setNplCostPerPcs(Number(e.target.value) || 0)}
                    className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm tabular-nums focus:border-indigo-400 focus:outline-none" />
                </div>
                <div className="border-t border-slate-100 pt-2.5">
                  {costing && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-700">Margin gộp/SP</span>
                        <span className={`font-bold tabular-nums ${costing.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {fmtVND(costing.margin)} ({fmtPct(costing.marginPct)})
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-slate-400">
                        <span>Cả PO ({fmtNum(selected.target_qty)} SP)</span>
                        <span className="tabular-nums">{fmtVND(costing.margin * selected.target_qty)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal tạo PO */}
      <Modal open={showCreatePO} title="Tạo PO mới" onClose={() => setShowCreatePO(false)} wide>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mã PO"><input className={inputCls} value={fPo.po_code} onChange={(e) => setFPo({ ...fPo, po_code: e.target.value })} placeholder="PO-M26xx" /></Field>
          <Field label="Nhãn hàng"><input className={inputCls} value={fPo.brand} onChange={(e) => setFPo({ ...fPo, brand: e.target.value })} placeholder="MONICA / NORDIC EU…" /></Field>
          <Field label="Tên sản phẩm"><input className={inputCls} value={fPo.product_name} onChange={(e) => setFPo({ ...fPo, product_name: e.target.value })} /></Field>
          <Field label="Phân bổ sản xuất">
            <select className={inputCls} value={fPo.assign} onChange={(e) => setFPo({ ...fPo, assign: e.target.value })}>
              <option value="">— Chưa phân bổ —</option>
              <optgroup label="Chuyền nội bộ">{lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</optgroup>
              <optgroup label="Xưởng Subcon">{subcons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>
            </select>
          </Field>
          <Field label="Đơn giá CMT (VNĐ/SP)" hint="Trả cho chuyền/xưởng gia công"><input type="number" className={inputCls} value={fPo.cmt} onChange={(e) => setFPo({ ...fPo, cmt: e.target.value })} /></Field>
          <Field label="Giá FOB (VNĐ/SP)" hint="Giá bán cho buyer — không dùng trả subcon"><input type="number" className={inputCls} value={fPo.fob} onChange={(e) => setFPo({ ...fPo, fob: e.target.value })} /></Field>
          <Field label="Ngày xuất xưởng (X-Factory)"><input type="date" className={inputCls} value={fPo.xfactory} onChange={(e) => setFPo({ ...fPo, xfactory: e.target.value })} /></Field>
          <Field label="Ngày giao hàng (ETD)"><input type="date" className={inputCls} value={fPo.etd} onChange={(e) => setFPo({ ...fPo, etd: e.target.value })} /></Field>
        </div>
        <div className="mt-4">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Breakdown Size</span>
          <div className="grid grid-cols-4 gap-2">
            {SIZES.map((s) => (
              <label key={s} className="block">
                <span className="mb-1 block text-center text-xs font-bold text-slate-500">{s}</span>
                <input type="number" className={`${inputCls} text-center`} value={fSizes[s]}
                  onChange={(e) => setFSizes({ ...fSizes, [s]: e.target.value })} placeholder="0" />
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Tổng mục tiêu: <b className="tabular-nums">{fmtNum(SIZES.reduce((s, k) => s + (Number(fSizes[k]) || 0), 0))} SP</b>
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setShowCreatePO(false)}>Hủy</button>
          <button className={btnPrimary} disabled={!fPo.po_code.trim() || !fPo.product_name.trim()} onClick={() => void createPO()}>
            <PlusCircle className="h-4 w-4" /> Tạo PO
          </button>
        </div>
      </Modal>

      {/* Modal thêm BOM */}
      <Modal open={showAddBom} title={`Thêm NPL vào BOM — ${selected?.po_code ?? ''}`} onClose={() => setShowAddBom(false)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Tên nguyên phụ liệu"><input className={inputCls} value={fBom.item_name} onChange={(e) => setFBom({ ...fBom, item_name: e.target.value })} placeholder="VD: Vải Piqué CD 235GSM - Navy" /></Field>
          </div>
          <Field label="Nhóm">
            <select className={inputCls} value={fBom.category} onChange={(e) => setFBom({ ...fBom, category: e.target.value as BomCategory })}>
              {BOM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Đơn vị"><input className={inputCls} value={fBom.unit} onChange={(e) => setFBom({ ...fBom, unit: e.target.value })} placeholder="m / cuộn / cái / bộ" /></Field>
          <Field label="Định mức / SP"><input type="number" step="0.01" className={inputCls} value={fBom.norm} onChange={(e) => setFBom({ ...fBom, norm: e.target.value })} /></Field>
          <Field label="Hao hụt (%)"><input type="number" step="0.1" className={inputCls} value={fBom.wastage} onChange={(e) => setFBom({ ...fBom, wastage: e.target.value })} /></Field>
        </div>
        {selected && fBom.norm && (
          <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            Tổng nhu cầu dự kiến: <b className="tabular-nums">
              {fmtNum1(bomTotalNeed(selected.target_qty, Number(fBom.norm) || 0, Number(fBom.wastage) || 0))} {fBom.unit}
            </b> cho {fmtNum(selected.target_qty)} SP
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setShowAddBom(false)}>Hủy</button>
          <button className={btnPrimary} disabled={!fBom.item_name.trim() || !fBom.norm} onClick={() => void addBom()}>
            <PlusCircle className="h-4 w-4" /> Thêm vào BOM
          </button>
        </div>
      </Modal>

      <ToastView message={toast} />
    </div>
  );
}
