'use client';

// ============================================================================
// MODULE 4 — KHO (NPL & THÀNH PHẨM)
// Nhập/Xuất NPL với máy tính quy đổi Kg↔m↔yd · Tồn an toàn · Kho TP & Shipment
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Warehouse, PlusCircle, ArrowUpFromLine, ArrowDownToLine, Calculator as CalcIcon,
  AlertTriangle, CheckCircle2, Container, Ship, PackagePlus,
} from 'lucide-react';
import {
  Card, PageHeader, StatCard, Badge, EmptyState, AccessDenied, MockBadge,
  Modal, Field, inputCls, btnPrimary, btnGhost, thCls, tdCls, useToast, ToastView,
} from '@/components/ui';
import { useSession } from '@/lib/hooks';
import { canAccess } from '@/lib/auth';
import { fetchTables, insertRow, updateRow, genId, subscribeTables } from '@/lib/supabase';
import {
  kgToMeters, metersToKg, metersToYards, bomTotalNeed, isBelowSafetyStock,
  fmtNum, fmtNum1, fmtNum2, fmtDate,
} from '@/lib/garment-math';
import type { InventoryItem, Order, BomItem, Shipment, Approval } from '@/types/erp';

const MODULE_PATH = '/kho';

export default function WarehousePage() {
  const { session, ready } = useSession();
  const { toast, showToast } = useToast();

  const [isMock, setIsMock] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bom, setBom] = useState<BomItem[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [tab, setTab] = useState<'NPL' | 'Thành phẩm'>('NPL');

  const [showIn, setShowIn] = useState(false);
  const [showOut, setShowOut] = useState(false);
  const [showShip, setShowShip] = useState(false);

  // Máy tính quy đổi (widget độc lập)
  const [calc, setCalc] = useState({ kg: '100', gsm: '200', width: '1.6' });
  // Form nhập kho vải
  const [fi, setFi] = useState({ item_name: '', kg: '', gsm: '', width: '', color: '', dye_lot: '', shade: 'A', rolls: '', safety: '', order_id: '' });
  // Form xuất kho
  const [fo, setFo] = useState({ inv_id: '', order_id: '', qty_m: '' });
  // Form shipment
  const [fs, setFs] = useState({ order_id: '', carton: '', qty: '', gw: '', nw: '', etd: '' });

  const load = useCallback(async () => {
    const { data, isMock } = await fetchTables(['inventory', 'orders', 'bom', 'shipments']);
    setInventory(data.inventory as InventoryItem[]);
    setOrders(data.orders as Order[]);
    setBom(data.bom as BomItem[]);
    setShipments(data.shipments as Shipment[]);
    setIsMock(isMock);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['inventory', 'shipments'], () => { void load(); }), [load]);

  const poCode = useCallback((id: string | null) => orders.find((o) => o.id === id)?.po_code ?? '—', [orders]);

  const npl = inventory.filter((i) => i.type === 'NPL');
  const finished = inventory.filter((i) => i.type === 'Thành phẩm');

  const lowStock = useMemo(
    () => npl.filter((i) => i.safety_stock > 0 && isBelowSafetyStock(i.qty_m > 0 ? i.qty_m : i.roll_count, i.safety_stock, 1)),
    [npl],
  );

  const kpi = useMemo(() => ({
    totalFabricM: npl.reduce((s, i) => s + (Number(i.qty_m) || 0), 0),
    low: lowStock.length,
    finishedQty: finished.reduce((s, i) => s + (Number(i.roll_count) || 0), 0),
    pendingShip: shipments.filter((s) => s.status === 'Chuẩn bị').length,
  }), [npl, lowStock, finished, shipments]);

  // Quy đổi live cho máy tính & form nhập
  const calcM = kgToMeters(Number(calc.kg) || 0, Number(calc.gsm) || 0, Number(calc.width) || 0);
  const fiM = kgToMeters(Number(fi.kg) || 0, Number(fi.gsm) || 0, Number(fi.width) || 0);

  // ── Nhập kho ──────────────────────────────────────────────────────────────
  const stockIn = async () => {
    const row: InventoryItem = {
      id: genId('I'),
      item_name: fi.item_name.trim(),
      type: 'NPL',
      qty_kg: Number(fi.kg) || 0,
      qty_m: fiM,
      gsm: Number(fi.gsm) || 0,
      width_m: Number(fi.width) || 0,
      color_code: fi.color.trim(),
      dye_lot: fi.dye_lot.trim(),
      shade: (fi.shade as InventoryItem['shade']) || '',
      roll_count: Number(fi.rolls) || 0,
      safety_stock: Number(fi.safety) || 0,
      order_id: fi.order_id || null,
    };
    setInventory((prev) => [row, ...prev]);
    setShowIn(false);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('inventory', payload);
    showToast(ok ? `✓ Nhập kho ${fmtNum1(row.qty_m)}m (${fmtNum1(row.qty_kg)}kg)` : 'Đã nhập kho (offline)');
    setFi({ item_name: '', kg: '', gsm: '', width: '', color: '', dye_lot: '', shade: 'A', rolls: '', safety: '', order_id: '' });
  };

  // ── Xuất kho (chặn vượt định mức BOM → tạo yêu cầu duyệt) ────────────────
  const stockOut = async () => {
    const item = inventory.find((i) => i.id === fo.inv_id);
    const order = orders.find((o) => o.id === fo.order_id);
    const qty = Number(fo.qty_m) || 0;
    if (!item || !order || qty <= 0) return;
    if (qty > item.qty_m) {
      showToast(`⚠ Tồn chỉ còn ${fmtNum1(item.qty_m)}m — không đủ xuất ${fmtNum1(qty)}m`);
      return;
    }
    // Đối chiếu nhu cầu BOM của PO cho NPL vải
    const bomFabric = bom.filter((b) => b.order_id === order.id && b.category === 'Vải');
    const totalNeed = bomFabric.reduce((s, b) => s + bomTotalNeed(order.target_qty, b.norm_per_pcs, b.wastage_percent), 0);
    if (totalNeed > 0 && qty > totalNeed) {
      const req: Approval = {
        id: genId('A'), type: 'Xuất vượt định mức', requester: session?.user.name ?? 'Thủ kho',
        order_id: order.id, content: `Xin xuất ${fmtNum1(qty)}m "${item.item_name}" cho ${order.po_code} (vượt nhu cầu BOM ${fmtNum1(totalNeed)}m)`,
        qty, status: 'Chờ duyệt', reason: '', created_at: new Date().toISOString(),
      };
      const { id: _omit, ...payload } = req;
      void insertRow('approvals', payload);
      setShowOut(false);
      showToast('⚠ Vượt định mức BOM — đã gửi yêu cầu chờ Giám đốc duyệt');
      return;
    }
    const newM = item.qty_m - qty;
    const newKg = metersToKg(newM, item.gsm, item.width_m);
    setInventory((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty_m: newM, qty_kg: newKg } : i)));
    setShowOut(false);
    await updateRow('inventory', item.id, { qty_m: newM, qty_kg: newKg });
    showToast(`✓ Đã xuất ${fmtNum1(qty)}m "${item.item_name}" cho ${order.po_code}`);
    setFo({ inv_id: '', order_id: '', qty_m: '' });
  };

  // ── Tạo shipment ──────────────────────────────────────────────────────────
  const createShipment = async () => {
    const row: Shipment = {
      id: genId('SH'), order_id: fs.order_id, carton_count: Number(fs.carton) || 0,
      qty: Number(fs.qty) || 0, gw_kg: Number(fs.gw) || 0, nw_kg: Number(fs.nw) || 0,
      etd: fs.etd, status: 'Chuẩn bị',
    };
    setShipments((prev) => [row, ...prev]);
    setShowShip(false);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('shipments', payload);
    showToast(ok ? `✓ Đã tạo shipment ${poCode(row.order_id)}` : 'Đã tạo shipment (offline)');
    setFs({ order_id: '', carton: '', qty: '', gw: '', nw: '', etd: '' });
  };

  const markShipped = async (s: Shipment) => {
    setShipments((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: 'Đã xuất' } : x)));
    await updateRow('shipments', s.id, { status: 'Đã xuất' });
    showToast(`✓ ${poCode(s.order_id)} đã xuất hàng`);
  };

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div>
      <PageHeader title="Kho NPL & Thành phẩm" desc="Nhập/Xuất theo BOM · Quy đổi Kg↔m↔yd tự động · Cảnh báo tồn an toàn"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MockBadge show={isMock} />
            <button className={btnGhost} onClick={() => setShowOut(true)}><ArrowUpFromLine className="h-4 w-4" /> Xuất kho</button>
            <button className={btnPrimary} onClick={() => setShowIn(true)}><ArrowDownToLine className="h-4 w-4" /> Nhập kho vải</button>
          </div>
        } />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Warehouse} tone="indigo" label="Tổng vải tồn kho" value={`${fmtNum(kpi.totalFabricM)} m`} sub={`${npl.length} mặt hàng NPL`} />
        <StatCard icon={AlertTriangle} tone={kpi.low > 0 ? 'rose' : 'emerald'} alert={kpi.low > 0}
          label="NPL dưới tồn an toàn" value={fmtNum(kpi.low)}
          sub={kpi.low > 0 ? 'Cần đặt bổ sung ngay' : 'Tất cả trong ngưỡng an toàn'} />
        <StatCard icon={Container} tone="emerald" label="Thành phẩm tồn" value={fmtNum(kpi.finishedQty)} sub="chờ xuất khẩu" />
        <StatCard icon={Ship} tone="amber" label="Shipment chuẩn bị" value={fmtNum(kpi.pendingShip)} sub="lô hàng đang đóng gói" />
      </div>

      {/* Máy tính quy đổi */}
      <Card className="mt-5" title="Máy tính Quy đổi Vải (Kg ↔ Mét ↔ Yard)" icon={CalcIcon}>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-5">
          <Field label="Khối lượng (Kg)"><input type="number" className={inputCls} value={calc.kg} onChange={(e) => setCalc({ ...calc, kg: e.target.value })} /></Field>
          <Field label="GSM (g/m²)"><input type="number" className={inputCls} value={calc.gsm} onChange={(e) => setCalc({ ...calc, gsm: e.target.value })} /></Field>
          <Field label="Khổ vải (m)"><input type="number" step="0.05" className={inputCls} value={calc.width} onChange={(e) => setCalc({ ...calc, width: e.target.value })} /></Field>
          <div className="rounded-xl bg-indigo-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-400">Mét</p>
            <p className="text-xl font-bold tabular-nums text-indigo-700">{fmtNum1(calcM)}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Yard</p>
            <p className="text-xl font-bold tabular-nums text-emerald-700">{fmtNum1(metersToYards(calcM))}</p>
          </div>
        </div>
        <p className="border-t border-slate-50 px-5 py-2.5 text-[11px] text-slate-400">
          Mét = (Kg × 1000) / (GSM × Khổ) · Yard = Mét / 0,9144 — dùng chung lib/garment-math cho mọi module.
        </p>
      </Card>

      {/* Tabs */}
      <div className="mt-5 flex gap-1.5">
        {(['NPL', 'Thành phẩm'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {t === 'NPL' ? `Kho NPL (${npl.length})` : `Kho Thành phẩm (${finished.length})`}
          </button>
        ))}
      </div>

      {tab === 'NPL' ? (
        <Card className="mt-3" title="Tồn kho Nguyên phụ liệu" icon={Warehouse}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thCls}>Mặt hàng</th>
                  <th className={thCls}>Màu / Lô nhuộm / Shade</th>
                  <th className={`${thCls} text-right`}>Kg</th>
                  <th className={`${thCls} text-right`}>Mét</th>
                  <th className={`${thCls} text-right`}>Yard</th>
                  <th className={`${thCls} text-right`}>Cuộn/Đv</th>
                  <th className={thCls}>PO</th>
                  <th className={thCls}>Tồn an toàn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {npl.length === 0 && <tr><td colSpan={8}><EmptyState title="Kho NPL trống" /></td></tr>}
                {npl.map((i) => {
                  const low = i.safety_stock > 0 && isBelowSafetyStock(i.qty_m > 0 ? i.qty_m : i.roll_count, i.safety_stock, 1);
                  return (
                    <tr key={i.id} className="transition hover:bg-slate-50/70">
                      <td className={`${tdCls} font-medium text-slate-800`}>{i.item_name}</td>
                      <td className={`${tdCls} text-xs text-slate-500`}>
                        {i.color_code || '—'}{i.dye_lot && <> · {i.dye_lot}</>}
                        {i.shade && <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">Shade {i.shade}</span>}
                      </td>
                      <td className={`${tdCls} text-right tabular-nums`}>{i.qty_kg > 0 ? fmtNum1(i.qty_kg) : '—'}</td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums`}>{i.qty_m > 0 ? fmtNum1(i.qty_m) : '—'}</td>
                      <td className={`${tdCls} text-right tabular-nums text-slate-500`}>{i.qty_m > 0 ? fmtNum1(metersToYards(i.qty_m)) : '—'}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(i.roll_count)}</td>
                      <td className={`${tdCls} text-indigo-700`}>{poCode(i.order_id)}</td>
                      <td className={tdCls}>
                        {i.safety_stock <= 0 ? <span className="text-xs text-slate-300">—</span>
                          : low ? <Badge tone="rose" icon={AlertTriangle}>Dưới an toàn</Badge>
                            : <Badge tone="emerald" icon={CheckCircle2}>Đủ</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card title="Tồn kho Thành phẩm" icon={Container}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={thCls}>Thành phẩm</th>
                    <th className={thCls}>PO</th>
                    <th className={`${thCls} text-right`}>Số lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {finished.length === 0 && <tr><td colSpan={3}><EmptyState title="Chưa có thành phẩm" sub="TP tự chảy về từ lô QA Endline PASS" /></td></tr>}
                  {finished.map((i) => (
                    <tr key={i.id} className="transition hover:bg-slate-50/70">
                      <td className={`${tdCls} font-medium text-slate-800`}>{i.item_name}</td>
                      <td className={`${tdCls} text-indigo-700`}>{poCode(i.order_id)}</td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums`}>{fmtNum(i.roll_count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Xuất hàng (Shipments)" icon={Ship}
            action={<button className={btnGhost} onClick={() => setShowShip(true)}><PackagePlus className="h-4 w-4" /> Tạo shipment</button>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={thCls}>PO</th>
                    <th className={`${thCls} text-right`}>Thùng</th>
                    <th className={`${thCls} text-right`}>SL</th>
                    <th className={`${thCls} text-right`}>GW/NW (kg)</th>
                    <th className={thCls}>ETD</th>
                    <th className={thCls}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {shipments.length === 0 && <tr><td colSpan={6}><EmptyState title="Chưa có shipment" /></td></tr>}
                  {shipments.map((s) => (
                    <tr key={s.id} className="transition hover:bg-slate-50/70">
                      <td className={`${tdCls} font-semibold text-indigo-700`}>{poCode(s.order_id)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(s.carton_count)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(s.qty)}</td>
                      <td className={`${tdCls} text-right tabular-nums text-slate-500`}>{fmtNum1(s.gw_kg)}/{fmtNum1(s.nw_kg)}</td>
                      <td className={`${tdCls} text-slate-500`}>{fmtDate(s.etd)}</td>
                      <td className={tdCls}>
                        {s.status === 'Đã xuất'
                          ? <Badge tone="emerald" icon={CheckCircle2}>Đã xuất</Badge>
                          : <button onClick={() => void markShipped(s)} className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                              Chuẩn bị → Xuất
                            </button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modal nhập kho vải */}
      <Modal open={showIn} title="Nhập kho Vải (theo cuộn/lô)" onClose={() => setShowIn(false)} wide>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <Field label="Tên vải"><input className={inputCls} value={fi.item_name} onChange={(e) => setFi({ ...fi, item_name: e.target.value })} placeholder="VD: Vải Piqué CD 235GSM - Navy" /></Field>
          </div>
          <Field label="Khối lượng (Kg)"><input type="number" className={inputCls} value={fi.kg} onChange={(e) => setFi({ ...fi, kg: e.target.value })} /></Field>
          <Field label="GSM"><input type="number" className={inputCls} value={fi.gsm} onChange={(e) => setFi({ ...fi, gsm: e.target.value })} /></Field>
          <Field label="Khổ vải (m)"><input type="number" step="0.05" className={inputCls} value={fi.width} onChange={(e) => setFi({ ...fi, width: e.target.value })} /></Field>
          <Field label="Mã màu"><input className={inputCls} value={fi.color} onChange={(e) => setFi({ ...fi, color: e.target.value })} placeholder="NV-19" /></Field>
          <Field label="Số lô nhuộm (Dye lot)"><input className={inputCls} value={fi.dye_lot} onChange={(e) => setFi({ ...fi, dye_lot: e.target.value })} placeholder="DL-24xx" /></Field>
          <Field label="Shade">
            <select className={inputCls} value={fi.shade} onChange={(e) => setFi({ ...fi, shade: e.target.value })}>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option>
            </select>
          </Field>
          <Field label="Số cuộn"><input type="number" className={inputCls} value={fi.rolls} onChange={(e) => setFi({ ...fi, rolls: e.target.value })} /></Field>
          <Field label="Mức tồn an toàn (m)"><input type="number" className={inputCls} value={fi.safety} onChange={(e) => setFi({ ...fi, safety: e.target.value })} /></Field>
          <Field label="Gắn PO (tùy chọn)">
            <select className={inputCls} value={fi.order_id} onChange={(e) => setFi({ ...fi, order_id: e.target.value })}>
              <option value="">— Không gắn —</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.po_code}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-indigo-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-400">Quy đổi Mét</p>
            <p className="text-lg font-bold tabular-nums text-indigo-700">{fmtNum1(fiM)} m</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Quy đổi Yard</p>
            <p className="text-lg font-bold tabular-nums text-emerald-700">{fmtNum1(metersToYards(fiM))} yd</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setShowIn(false)}>Hủy</button>
          <button className={btnPrimary} disabled={!fi.item_name.trim() || !fi.kg} onClick={() => void stockIn()}>
            <ArrowDownToLine className="h-4 w-4" /> Nhập kho
          </button>
        </div>
      </Modal>

      {/* Modal xuất kho */}
      <Modal open={showOut} title="Xuất kho NPL cho sản xuất" onClose={() => setShowOut(false)}>
        <div className="space-y-4">
          <Field label="Mặt hàng NPL">
            <select className={inputCls} value={fo.inv_id} onChange={(e) => setFo({ ...fo, inv_id: e.target.value })}>
              <option value="">— Chọn NPL —</option>
              {npl.filter((i) => i.qty_m > 0).map((i) => (
                <option key={i.id} value={i.id}>{i.item_name} (tồn {fmtNum1(i.qty_m)}m)</option>
              ))}
            </select>
          </Field>
          <Field label="Xuất cho PO">
            <select className={inputCls} value={fo.order_id} onChange={(e) => setFo({ ...fo, order_id: e.target.value })}>
              <option value="">— Chọn PO —</option>
              {orders.filter((o) => o.status !== 'Đã xuất').map((o) => <option key={o.id} value={o.id}>{o.po_code} · {o.product_name}</option>)}
            </select>
          </Field>
          <Field label="Số lượng xuất (m)" hint="Vượt nhu cầu BOM sẽ tự tạo yêu cầu chờ Giám đốc duyệt">
            <input type="number" step="0.1" className={inputCls} value={fo.qty_m} onChange={(e) => setFo({ ...fo, qty_m: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setShowOut(false)}>Hủy</button>
            <button className={btnPrimary} disabled={!fo.inv_id || !fo.order_id || !fo.qty_m} onClick={() => void stockOut()}>
              <ArrowUpFromLine className="h-4 w-4" /> Xuất kho
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal shipment */}
      <Modal open={showShip} title="Tạo Shipment xuất khẩu" onClose={() => setShowShip(false)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="PO">
              <select className={inputCls} value={fs.order_id} onChange={(e) => setFs({ ...fs, order_id: e.target.value })}>
                <option value="">— Chọn PO —</option>
                {orders.map((o) => <option key={o.id} value={o.id}>{o.po_code} · {o.product_name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Số thùng carton"><input type="number" className={inputCls} value={fs.carton} onChange={(e) => setFs({ ...fs, carton: e.target.value })} /></Field>
          <Field label="Số lượng (SP)"><input type="number" className={inputCls} value={fs.qty} onChange={(e) => setFs({ ...fs, qty: e.target.value })} /></Field>
          <Field label="GW (kg)"><input type="number" step="0.1" className={inputCls} value={fs.gw} onChange={(e) => setFs({ ...fs, gw: e.target.value })} /></Field>
          <Field label="NW (kg)"><input type="number" step="0.1" className={inputCls} value={fs.nw} onChange={(e) => setFs({ ...fs, nw: e.target.value })} /></Field>
          <Field label="ETD"><input type="date" className={inputCls} value={fs.etd} onChange={(e) => setFs({ ...fs, etd: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setShowShip(false)}>Hủy</button>
          <button className={btnPrimary} disabled={!fs.order_id || !fs.qty} onClick={() => void createShipment()}>
            <Ship className="h-4 w-4" /> Tạo shipment
          </button>
        </div>
      </Modal>

      <ToastView message={toast} />
    </div>
  );
}
