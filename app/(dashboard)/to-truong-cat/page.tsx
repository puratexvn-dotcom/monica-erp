'use client';

// ============================================================================
// MODULE 5 — TỔ TRƯỞNG CẮT (CUTTING ROOM)
// Lệnh cắt (bàn/lá/ratio) · Nhật ký hao hụt · Bundle Ticket in bó hàng
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Scissors, PlusCircle, Layers3, Ticket, Printer, ArrowRightCircle,
  AlertTriangle, CheckCircle2, Table2,
} from 'lucide-react';
import {
  Card, PageHeader, StatCard, Badge, EmptyState, AccessDenied, MockBadge,
  Modal, Field, inputCls, btnPrimary, btnGhost, thCls, tdCls, useToast, ToastView,
} from '@/components/ui';
import { useSession, useTimeFilter, inTimeRange } from '@/lib/hooks';
import { canAccess } from '@/lib/auth';
import { fetchTables, insertRow, updateRow, genId, subscribeTables } from '@/lib/supabase';
import {
  cuttingWastePercent, expectedCutPieces, fmtNum, fmtNum1, fmtPct, fmtDateTime,
} from '@/lib/garment-math';
import type { Order, CuttingLog, Bundle } from '@/types/erp';

const MODULE_PATH = '/to-truong-cat';
const SIZES = ['S', 'M', 'L', 'XL'];
const MAX_WASTE = 3.5; // trần hao hụt cho phép (%) — cấu hình ở Super Admin

export default function CuttingPage() {
  const { session, ready } = useSession();
  const range = useTimeFilter();
  const { toast, showToast } = useToast();

  const [isMock, setIsMock] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<CuttingLog[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [bundleFor, setBundleFor] = useState<CuttingLog | null>(null);
  const [printTicket, setPrintTicket] = useState<Bundle | null>(null);

  // Form lệnh cắt
  const [f, setF] = useState({ order_id: '', marker_name: '', table_count: '1', ply_count: '40', fabric_used: '', marker_length: '', cut_qty: '' });
  const [fRatio, setFRatio] = useState<Record<string, string>>({ S: '1', M: '2', L: '2', XL: '1' });
  // Form tạo bó
  const [fb, setFb] = useState({ size: 'M', qty_per_bundle: '30', count: '5' });

  const load = useCallback(async () => {
    const { data, isMock } = await fetchTables(['orders', 'cutting_logs', 'bundles']);
    setOrders(data.orders as Order[]);
    setLogs(data.cutting_logs as CuttingLog[]);
    setBundles(data.bundles as Bundle[]);
    setIsMock(isMock);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['cutting_logs', 'bundles'], () => { void load(); }), [load]);

  const poCode = useCallback((id: string) => orders.find((o) => o.id === id)?.po_code ?? id, [orders]);

  const logsInRange = useMemo(
    () => logs.filter((l) => inTimeRange(l.created_at, range))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [logs, range],
  );

  const kpi = useMemo(() => {
    const totalCut = logsInRange.reduce((s, l) => s + l.cut_qty, 0);
    const totalIssued = logsInRange.reduce((s, l) => s + l.fabric_used_m, 0);
    const totalMarker = logsInRange.reduce((s, l) => s + l.marker_length_m, 0);
    const avgWaste = cuttingWastePercent(totalIssued, totalMarker);
    const tables = logsInRange.reduce((s, l) => s + l.table_count, 0);
    const pendingBundles = bundles.filter((b) => b.status === 'Đã cắt').length;
    return { totalCut, avgWaste, tables, pendingBundles };
  }, [logsInRange, bundles]);

  // Tính live trong form
  const liveRatio = useMemo(() => {
    const r: Record<string, number> = {};
    SIZES.forEach((s) => { const v = Number(fRatio[s]) || 0; if (v > 0) r[s] = v; });
    return r;
  }, [fRatio]);
  const liveExpected = expectedCutPieces(Number(f.table_count) || 0, Number(f.ply_count) || 0, liveRatio);
  const liveWaste = cuttingWastePercent(Number(f.fabric_used) || 0, Number(f.marker_length) || 0);

  const submitLog = async () => {
    const row: CuttingLog = {
      id: genId('C'),
      order_id: f.order_id,
      marker_name: f.marker_name.trim(),
      table_count: Number(f.table_count) || 0,
      ply_count: Number(f.ply_count) || 0,
      size_ratio: liveRatio,
      cut_qty: Number(f.cut_qty) || liveExpected,
      fabric_used_m: Number(f.fabric_used) || 0,
      marker_length_m: Number(f.marker_length) || 0,
      waste_percent: liveWaste,
      created_at: new Date().toISOString(),
    };
    setLogs((prev) => [row, ...prev]);
    setShowForm(false);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('cutting_logs', payload);
    showToast(ok ? `✓ Đã ghi nhật ký cắt ${poCode(row.order_id)}` : 'Đã ghi nhật ký (offline)');
    if (liveWaste > MAX_WASTE) showToast(`⚠ Hao hụt ${fmtPct(liveWaste)} vượt trần ${MAX_WASTE}% — báo Giám đốc!`);
    setF({ order_id: '', marker_name: '', table_count: '1', ply_count: '40', fabric_used: '', marker_length: '', cut_qty: '' });
  };

  const createBundles = async () => {
    if (!bundleFor) return;
    const existing = bundles.filter((b) => b.order_id === bundleFor.order_id && b.size === fb.size).length;
    const rows: Bundle[] = Array.from({ length: Number(fb.count) || 0 }, (_, i) => ({
      id: genId('BD'),
      order_id: bundleFor.order_id,
      cutting_log_id: bundleFor.id,
      bundle_no: `${poCode(bundleFor.order_id)}-${fb.size}-${String(existing + i + 1).padStart(2, '0')}`,
      size: fb.size,
      qty: Number(fb.qty_per_bundle) || 0,
      status: 'Đã cắt',
    }));
    setBundles((prev) => [...prev, ...rows]);
    setBundleFor(null);
    for (const r of rows) {
      const { id: _omit, ...payload } = r;
      void insertRow('bundles', payload);
    }
    showToast(`✓ Đã tạo ${rows.length} bó hàng size ${fb.size}`);
  };

  const handOver = async (b: Bundle) => {
    setBundles((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: 'Đã giao chuyền' } : x)));
    await updateRow('bundles', b.id, { status: 'Đã giao chuyền' });
    showToast(`✓ ${b.bundle_no} đã giao sang Chuyền may`);
  };

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div>
      <PageHeader title="Tổ trưởng Cắt" desc="Lệnh cắt theo bàn/lá/sơ đồ — BTP tự động chảy sang Chuyền may"
        action={
          <div className="flex items-center gap-2">
            <MockBadge show={isMock} />
            <button className={btnPrimary} onClick={() => setShowForm(true)}>
              <PlusCircle className="h-4 w-4" /> Ghi nhật ký cắt
            </button>
          </div>
        } />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Scissors} tone="indigo" label="BTP cắt đạt" value={fmtNum(kpi.totalCut)} sub="theo bộ lọc thời gian" />
        <StatCard icon={AlertTriangle} tone={kpi.avgWaste > MAX_WASTE ? 'rose' : 'emerald'} alert={kpi.avgWaste > MAX_WASTE}
          label="Hao hụt bình quân" value={fmtPct(kpi.avgWaste)}
          sub={kpi.avgWaste > MAX_WASTE ? `Vượt trần cho phép ${MAX_WASTE}%` : `Trong trần cho phép ≤ ${MAX_WASTE}%`} />
        <StatCard icon={Table2} tone="amber" label="Số bàn cắt" value={fmtNum(kpi.tables)} sub="tổng số bàn đã trải" />
        <StatCard icon={Ticket} tone="slate" label="Bó chờ giao chuyền" value={fmtNum(kpi.pendingBundles)} sub="bundle trạng thái Đã cắt" />
      </div>

      {/* Nhật ký cắt */}
      <Card className="mt-5" title="Nhật ký Cắt" icon={Layers3}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thCls}>Thời gian</th>
                <th className={thCls}>PO</th>
                <th className={thCls}>Sơ đồ</th>
                <th className={`${thCls} text-right`}>Bàn × Lá</th>
                <th className={thCls}>Ratio</th>
                <th className={`${thCls} text-right`}>BTP đạt</th>
                <th className={`${thCls} text-right`}>Vải xả / trên SĐ (m)</th>
                <th className={thCls}>Hao hụt</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logsInRange.length === 0 && <tr><td colSpan={9}><EmptyState title="Chưa có nhật ký cắt trong khoảng thời gian này" /></td></tr>}
              {logsInRange.map((l) => (
                <tr key={l.id} className="transition hover:bg-slate-50/70">
                  <td className={`${tdCls} text-slate-400`}>{fmtDateTime(l.created_at)}</td>
                  <td className={`${tdCls} font-semibold text-indigo-700`}>{poCode(l.order_id)}</td>
                  <td className={tdCls}>{l.marker_name}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{l.table_count} × {l.ply_count}</td>
                  <td className={`${tdCls} text-xs text-slate-500`}>
                    {Object.entries(l.size_ratio ?? {}).map(([k, v]) => `${k}:${v}`).join(' / ')}
                  </td>
                  <td className={`${tdCls} text-right font-semibold tabular-nums`}>{fmtNum(l.cut_qty)}</td>
                  <td className={`${tdCls} text-right tabular-nums text-slate-500`}>{fmtNum1(l.fabric_used_m)} / {fmtNum1(l.marker_length_m)}</td>
                  <td className={tdCls}>
                    {l.waste_percent > MAX_WASTE
                      ? <Badge tone="rose" icon={AlertTriangle}>{fmtPct(l.waste_percent)}</Badge>
                      : <Badge tone="emerald" icon={CheckCircle2}>{fmtPct(l.waste_percent)}</Badge>}
                  </td>
                  <td className={tdCls}>
                    <button className={btnGhost} onClick={() => setBundleFor(l)}>
                      <Ticket className="h-3.5 w-3.5" /> Tạo bó
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bundle tickets */}
      <Card className="mt-5" title={`Bó hàng / Bundle Tickets (${bundles.length})`} icon={Ticket}>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {bundles.length === 0 && <div className="sm:col-span-2 xl:col-span-3"><EmptyState title="Chưa có bó hàng" sub="Tạo bó từ một dòng nhật ký cắt" /></div>}
          {bundles.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-bold text-slate-800">{b.bundle_no}</p>
                <p className="text-xs text-slate-500">Size <b>{b.size}</b> · {fmtNum(b.qty)} BTP</p>
                {b.status === 'Đã giao chuyền'
                  ? <Badge tone="emerald" icon={CheckCircle2}>Đã giao chuyền</Badge>
                  : <Badge tone="amber" icon={Scissors}>Đã cắt — chờ giao</Badge>}
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button title="In phiếu bó hàng" onClick={() => setPrintTicket(b)}
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-indigo-600"><Printer className="h-4 w-4" /></button>
                {b.status === 'Đã cắt' && (
                  <button title="Giao sang chuyền" onClick={() => void handOver(b)}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100"><ArrowRightCircle className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal nhật ký cắt */}
      <Modal open={showForm} title="Ghi Nhật ký Cắt / Lệnh cắt" onClose={() => setShowForm(false)} wide>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="PO">
            <select className={inputCls} value={f.order_id} onChange={(e) => setF({ ...f, order_id: e.target.value })}>
              <option value="">— Chọn PO —</option>
              {orders.filter((o) => o.status !== 'Đã xuất').map((o) => <option key={o.id} value={o.id}>{o.po_code} · {o.product_name}</option>)}
            </select>
          </Field>
          <Field label="Tên sơ đồ (Marker)"><input className={inputCls} value={f.marker_name} onChange={(e) => setF({ ...f, marker_name: e.target.value })} placeholder="SD-Polo-A" /></Field>
          <Field label="Số bàn cắt"><input type="number" className={inputCls} value={f.table_count} onChange={(e) => setF({ ...f, table_count: e.target.value })} /></Field>
          <Field label="Số lá vải / bàn"><input type="number" className={inputCls} value={f.ply_count} onChange={(e) => setF({ ...f, ply_count: e.target.value })} /></Field>
          <Field label="Vải xả cây (m)" hint="Tổng vải thực tế đã trải"><input type="number" step="0.1" className={inputCls} value={f.fabric_used} onChange={(e) => setF({ ...f, fabric_used: e.target.value })} /></Field>
          <Field label="Vải trên sơ đồ (m)" hint="Chiều dài sơ đồ × số lá"><input type="number" step="0.1" className={inputCls} value={f.marker_length} onChange={(e) => setF({ ...f, marker_length: e.target.value })} /></Field>
        </div>
        <div className="mt-4">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tỷ lệ phối size trên sơ đồ (SP/sơ đồ)</span>
          <div className="grid grid-cols-4 gap-2">
            {SIZES.map((s) => (
              <label key={s} className="block">
                <span className="mb-1 block text-center text-xs font-bold text-slate-500">{s}</span>
                <input type="number" className={`${inputCls} text-center`} value={fRatio[s]} onChange={(e) => setFRatio({ ...fRatio, [s]: e.target.value })} />
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-indigo-50 px-3 py-2.5 text-xs text-indigo-700">
            BTP dự kiến: <b className="tabular-nums">{fmtNum(liveExpected)}</b>
            <span className="block text-indigo-400">= bàn × lá × SP/sơ đồ</span>
          </div>
          <div className={`rounded-lg px-3 py-2.5 text-xs ${liveWaste > MAX_WASTE ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            Hao hụt: <b className="tabular-nums">{fmtPct(liveWaste)}</b>
            <span className="block opacity-70">{liveWaste > MAX_WASTE ? `⚠ vượt trần ${MAX_WASTE}%` : `trần cho phép ${MAX_WASTE}%`}</span>
          </div>
          <Field label="BTP cắt đạt thực tế">
            <input type="number" className={inputCls} value={f.cut_qty} onChange={(e) => setF({ ...f, cut_qty: e.target.value })} placeholder={String(liveExpected)} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setShowForm(false)}>Hủy</button>
          <button className={btnPrimary} disabled={!f.order_id || !f.marker_name.trim()} onClick={() => void submitLog()}>
            <Scissors className="h-4 w-4" /> Ghi nhật ký
          </button>
        </div>
      </Modal>

      {/* Modal tạo bó */}
      <Modal open={!!bundleFor} title={`Tạo bó hàng — ${bundleFor ? poCode(bundleFor.order_id) : ''}`} onClose={() => setBundleFor(null)}>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Size">
            <select className={inputCls} value={fb.size} onChange={(e) => setFb({ ...fb, size: e.target.value })}>
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="BTP / bó"><input type="number" className={inputCls} value={fb.qty_per_bundle} onChange={(e) => setFb({ ...fb, qty_per_bundle: e.target.value })} /></Field>
          <Field label="Số bó"><input type="number" className={inputCls} value={fb.count} onChange={(e) => setFb({ ...fb, count: e.target.value })} /></Field>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Số bó được đánh thứ tự tự động: <span className="font-mono">{bundleFor ? poCode(bundleFor.order_id) : 'PO'}-{fb.size}-01, -02…</span>
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setBundleFor(null)}>Hủy</button>
          <button className={btnPrimary} onClick={() => void createBundles()}><Ticket className="h-4 w-4" /> Tạo bó hàng</button>
        </div>
      </Modal>

      {/* Phiếu in bó hàng */}
      <Modal open={!!printTicket} title="Bundle Ticket — Phiếu bó hàng" onClose={() => setPrintTicket(null)}>
        {printTicket && (
          <div>
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">MONICA GARMENT · BUNDLE TICKET</p>
              <p className="mt-2 font-mono text-2xl font-black tracking-tight text-slate-900">{printTicket.bundle_no}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg bg-slate-50 py-2"><span className="block text-[10px] uppercase text-slate-400">PO</span><b>{poCode(printTicket.order_id)}</b></div>
                <div className="rounded-lg bg-slate-50 py-2"><span className="block text-[10px] uppercase text-slate-400">Size</span><b>{printTicket.size}</b></div>
                <div className="rounded-lg bg-slate-50 py-2"><span className="block text-[10px] uppercase text-slate-400">Số lượng</span><b className="tabular-nums">{fmtNum(printTicket.qty)}</b></div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">Chuyển sang chuyền may — ký nhận tại sổ giao ca</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setPrintTicket(null)}>Đóng</button>
              <button className={btnPrimary} onClick={() => window.print()}><Printer className="h-4 w-4" /> In phiếu</button>
            </div>
          </div>
        )}
      </Modal>

      <ToastView message={toast} />
    </div>
  );
}
