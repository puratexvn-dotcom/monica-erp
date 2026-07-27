'use client';

// ============================================================================
// MODULE 6 — TỔ TRƯỞNG MAY (Mobile-first)
// Counter [+1 ĐẠT]/[+1 LỖI] theo giờ · Takt time & Hiệu suất chuyền · Bottleneck
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Shirt, Plus, Minus, Send, Gauge, Timer, Activity, AlertTriangle,
  CheckCircle2, PackageOpen,
} from 'lucide-react';
import {
  Card, PageHeader, StatCard, Badge, EmptyState, AccessDenied, MockBadge,
  inputCls, btnPrimary, thCls, tdCls, useToast, ToastView, Field,
} from '@/components/ui';
import { useSession } from '@/lib/hooks';
import { canAccess } from '@/lib/auth';
import { fetchTables, insertRow, genId, subscribeTables } from '@/lib/supabase';
import {
  taktTimeMinutes, lineEfficiencyPercent, defectRatePercent,
  fmtNum, fmtNum1, fmtPct,
} from '@/lib/garment-math';
import type { Order, SewingLine, ProdLog, Bundle } from '@/types/erp';

const MODULE_PATH = '/to-truong-may';
const STAGES = ['May thân', 'Tra tay', 'Vào lưng/khóa', 'Hoàn thiện'];
const HOURS = ['08h', '09h', '10h', '11h', '13h', '14h', '15h', '16h', '17h'];

export default function SewingPage() {
  const { session, ready } = useSession();
  const { toast, showToast } = useToast();

  const [isMock, setIsMock] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);

  const [lineId, setLineId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [stage, setStage] = useState(STAGES[0]);
  const [okCount, setOkCount] = useState(0);
  const [defCount, setDefCount] = useState(0);
  const [targetDay, setTargetDay] = useState('400');
  const [sam, setSam] = useState('12');
  const [workers, setWorkers] = useState('28');
  const [workHours, setWorkHours] = useState('8');

  const load = useCallback(async () => {
    const { data, isMock } = await fetchTables(['orders', 'sewing_lines', 'prod_logs', 'bundles']);
    setOrders(data.orders as Order[]);
    setLines(data.sewing_lines as SewingLine[]);
    setProdLogs(data.prod_logs as ProdLog[]);
    setBundles(data.bundles as Bundle[]);
    setIsMock(isMock);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['prod_logs', 'bundles'], () => { void load(); }), [load]);

  // Mặc định chọn chuyền/PO đầu tiên phù hợp
  useEffect(() => {
    if (!lineId && lines.length > 0) {
      setLineId(lines[0].id);
      setSam(String(lines[0].sam_default));
      setWorkers(String(lines[0].worker_count));
    }
  }, [lines, lineId]);
  useEffect(() => {
    if (!orderId) {
      const o = orders.find((x) => x.line_id === lineId) ?? orders.find((x) => x.status === 'Đang may');
      if (o) setOrderId(o.id);
    }
  }, [orders, lineId, orderId]);

  const order = orders.find((o) => o.id === orderId) ?? null;
  const today = new Date().toDateString();
  const todayLogs = useMemo(
    () => prodLogs.filter((l) => l.line_id === lineId && new Date(l.created_at).toDateString() === today),
    [prodLogs, lineId, today],
  );

  const todayOk = todayLogs.reduce((s, l) => s + l.qty_ok, 0);
  const todayDef = todayLogs.reduce((s, l) => s + l.qty_defect, 0);
  const defRate = defectRatePercent(todayDef, todayOk + todayDef);

  // BTP khả dụng = bó đã giao chuyền − đã may (đồng bộ tự động từ Tổ Cắt)
  const availableBtp = useMemo(() => {
    if (!order) return 0;
    const delivered = bundles.filter((b) => b.order_id === order.id && b.status === 'Đã giao chuyền')
      .reduce((s, b) => s + b.qty, 0);
    const sewn = prodLogs.filter((l) => l.order_id === order.id)
      .reduce((s, l) => s + l.qty_ok + l.qty_defect, 0);
    return Math.max(0, delivered - sewn);
  }, [order, bundles, prodLogs]);

  // Takt & hiệu suất
  const takt = taktTimeMinutes((Number(workHours) || 0) * 60, Number(targetDay) || 0);
  const eff = lineEfficiencyPercent(todayOk, Number(sam) || 0, Number(workers) || 0, Number(workHours) || 0);

  // Bảng sản lượng theo giờ
  const hourly = useMemo(() => HOURS.map((h) => {
    const ls = todayLogs.filter((l) => l.hour_slot === h);
    return { hour: h, ok: ls.reduce((s, l) => s + l.qty_ok, 0), def: ls.reduce((s, l) => s + l.qty_defect, 0) };
  }), [todayLogs]);

  // Bottleneck: công đoạn có sản lượng hôm nay thấp nhất (ứ BTP phía trước)
  const stageOutput = useMemo(() => STAGES.map((st) => ({
    stage: st,
    ok: todayLogs.filter((l) => l.stage === st).reduce((s, l) => s + l.qty_ok, 0),
  })), [todayLogs]);
  const bottleneck = useMemo(() => {
    const active = stageOutput.filter((s) => s.ok > 0);
    if (active.length < 2) return null;
    return active.reduce((min, s) => (s.ok < min.ok ? s : min), active[0]);
  }, [stageOutput]);

  const currentHourSlot = (): string => {
    const h = new Date().getHours();
    return `${String(Math.min(Math.max(h, 8), 17)).padStart(2, '0')}h`;
  };

  const submitReport = async () => {
    if (!order || (okCount === 0 && defCount === 0)) return;
    const row: ProdLog = {
      id: genId('P'), order_id: order.id, subcon_id: null, line_id: lineId,
      stage, qty_ok: okCount, qty_defect: defCount,
      hour_slot: currentHourSlot(), photo_url: null, created_at: new Date().toISOString(),
    };
    setProdLogs((prev) => [row, ...prev]);
    setOkCount(0);
    setDefCount(0);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('prod_logs', payload);
    showToast(ok ? `✓ Đã gửi: ${okCount} đạt / ${defCount} lỗi (${stage})` : 'Đã ghi báo cáo (offline)');
  };

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Tổ trưởng May" desc="Bấm đếm sản lượng theo giờ — tối ưu cho điện thoại/tablet đặt tại chuyền"
        action={<MockBadge show={isMock} />} />

      {/* Chọn chuyền / PO / công đoạn */}
      <Card>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <Field label="Chuyền">
            <select className={inputCls} value={lineId} onChange={(e) => {
              setLineId(e.target.value);
              const l = lines.find((x) => x.id === e.target.value);
              if (l) { setSam(String(l.sam_default)); setWorkers(String(l.worker_count)); }
            }}>
              {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="PO đang may">
            <select className={inputCls} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              {orders.filter((o) => o.status !== 'Đã xuất').map((o) => <option key={o.id} value={o.id}>{o.po_code} · {o.product_name}</option>)}
            </select>
          </Field>
          <Field label="Công đoạn">
            <select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value)}>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex items-center gap-2 border-t border-slate-50 px-4 py-2.5 text-xs text-slate-500">
          <PackageOpen className="h-4 w-4 text-indigo-500" />
          BTP khả dụng từ Tổ Cắt: <b className="tabular-nums text-slate-800">{fmtNum(availableBtp)}</b>
          <span className="text-slate-300">·</span> tự trừ khi chuyền báo sản lượng
        </div>
      </Card>

      {/* Counter */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => setOkCount((v) => v + 1)}
          className="group flex min-h-[128px] flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 transition active:scale-95">
          <span className="flex items-center gap-1 text-lg font-bold"><Plus className="h-6 w-6" /> 1 ĐẠT</span>
          <span className="text-4xl font-black tabular-nums">{okCount}</span>
          <span className="text-xs text-emerald-100">chạm để cộng</span>
        </button>
        <button onClick={() => setDefCount((v) => v + 1)}
          className="group flex min-h-[128px] flex-col items-center justify-center gap-1 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/20 transition active:scale-95">
          <span className="flex items-center gap-1 text-lg font-bold"><Plus className="h-6 w-6" /> 1 LỖI</span>
          <span className="text-4xl font-black tabular-nums">{defCount}</span>
          <span className="text-xs text-rose-100">chuyển QA kiểm lại</span>
        </button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <button onClick={() => setOkCount((v) => Math.max(0, v - 1))}
          className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-500 transition active:scale-95">
          <Minus className="h-4 w-4" /> Đạt
        </button>
        <button onClick={() => setDefCount((v) => Math.max(0, v - 1))}
          className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-500 transition active:scale-95">
          <Minus className="h-4 w-4" /> Lỗi
        </button>
        <button onClick={() => void submitReport()} disabled={okCount === 0 && defCount === 0}
          className={`${btnPrimary} py-2.5`}>
          <Send className="h-4 w-4" /> Gửi báo cáo
        </button>
      </div>

      {/* KPI hôm nay */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Shirt} tone="emerald" label="Đạt hôm nay" value={fmtNum(todayOk)} />
        <StatCard icon={AlertTriangle} tone={defRate > 3 ? 'rose' : 'slate'} alert={defRate > 3}
          label="Lỗi hôm nay" value={fmtNum(todayDef)} sub={`tỷ lệ ${fmtPct(defRate)}`} />
        <StatCard icon={Timer} tone="indigo" label="Takt time" value={`${fmtNum1(takt)} ph/SP`} sub={`mục tiêu ${fmtNum(Number(targetDay) || 0)} SP/ngày`} />
        <StatCard icon={Gauge} tone={eff >= 60 ? 'emerald' : 'amber'} label="Hiệu suất chuyền" value={fmtPct(eff, 0)} sub={`SAM ${sam}′ · ${workers} CN`} />
      </div>

      {/* Tham số chuyền */}
      <Card className="mt-4" title="Tham số Nhịp chuyền" icon={Timer}>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <Field label="Mục tiêu SP/ngày"><input type="number" className={inputCls} value={targetDay} onChange={(e) => setTargetDay(e.target.value)} /></Field>
          <Field label="SAM (phút/SP)"><input type="number" step="0.1" className={inputCls} value={sam} onChange={(e) => setSam(e.target.value)} /></Field>
          <Field label="Số công nhân"><input type="number" className={inputCls} value={workers} onChange={(e) => setWorkers(e.target.value)} /></Field>
          <Field label="Giờ làm việc"><input type="number" className={inputCls} value={workHours} onChange={(e) => setWorkHours(e.target.value)} /></Field>
        </div>
        <p className="border-t border-slate-50 px-4 py-2.5 text-[11px] text-slate-400">
          Hiệu suất % = (Sản lượng × SAM) / (Số CN × Giờ làm × 60) × 100 · Takt = Giờ khả dụng / Mục tiêu.
        </p>
      </Card>

      {/* Bảng sản lượng theo giờ */}
      <Card className="mt-4" title="Sản lượng theo giờ (hôm nay)" icon={Activity}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thCls}>Khung giờ</th>
                {hourly.map((h) => <th key={h.hour} className={`${thCls} text-center`}>{h.hour}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50">
                <td className={`${tdCls} font-semibold text-emerald-700`}>Đạt</td>
                {hourly.map((h) => <td key={h.hour} className={`${tdCls} text-center tabular-nums`}>{h.ok || '·'}</td>)}
              </tr>
              <tr>
                <td className={`${tdCls} font-semibold text-rose-600`}>Lỗi</td>
                {hourly.map((h) => <td key={h.hour} className={`${tdCls} text-center tabular-nums ${h.def > 0 ? 'text-rose-600 font-semibold' : 'text-slate-300'}`}>{h.def || '·'}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        {todayLogs.length === 0 && <EmptyState title="Chuyền chưa có báo cáo hôm nay" sub="Dùng bộ đếm phía trên để bắt đầu" />}
      </Card>

      {/* Bottleneck */}
      <Card className="mt-4" title="Cân bằng chuyền & Điểm nghẽn (Bottleneck)" icon={Gauge}>
        <ul className="divide-y divide-slate-50">
          {stageOutput.map((s) => {
            const isBn = bottleneck?.stage === s.stage;
            return (
              <li key={s.stage} className="flex items-center justify-between px-5 py-3">
                <span className={`text-sm font-medium ${isBn ? 'text-rose-700' : 'text-slate-700'}`}>{s.stage}</span>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-slate-800">{fmtNum(s.ok)} SP</span>
                  {isBn
                    ? <Badge tone="rose" icon={AlertTriangle}>Nghẽn chuyền</Badge>
                    : s.ok > 0 ? <Badge tone="emerald" icon={CheckCircle2}>Ổn định</Badge> : <Badge tone="slate">Chưa chạy</Badge>}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-slate-50 px-5 py-2.5 text-[11px] text-slate-400">
          Công đoạn có sản lượng thấp nhất trong ngày được đánh dấu nghẽn — cân nhắc điều CN hỗ trợ hoặc tách bó nhỏ.
        </p>
      </Card>

      <ToastView message={toast} />
    </div>
  );
}
