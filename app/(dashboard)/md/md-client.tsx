'use client';

import { useCallback, useState, useTransition } from 'react';
import {
  Building2, PackageSearch, Boxes, Factory, Ship, Plus, RefreshCw, AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

import { Card, Badge, thCls, tdCls, btnPrimary, btnGhost } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import PoTable from '../orders/po-table';
import PoFormDialog from '../orders/po-form-dialog';
import type { PoRow } from '../orders/po-schema';
import type { PoOption } from './md-types';
import { loadMdSnapshot, type MdSnapshot } from './md-actions';
import { listOrders } from '../orders/actions';
import {
  CustomerFormDialog, MaterialRequestDialog, ProductionOrderDialog, ShipmentFormDialog,
} from './md-forms';
import {
  MATERIAL_CATEGORY_LABEL, MR_STATUS_LABEL, PROD_STATUS_LABEL,
  type MaterialCategory,
} from './md-schema';

// ============================================================================
// BÀN LÀM VIỆC MERCHANDISER — 5 nhóm chức năng
//
// ─── VÌ SAO DÙNG TABS ────────────────────────────────────────────────────
// Năm nhóm mỗi nhóm một bảng dữ liệu; xếp dọc hết một trang thì trên điện thoại
// phải cuộn rất xa mới tới nhóm cuối. Tabs giữ mọi nhóm trong một tầm với.
// Thanh tab cuộn ngang được (overflow-x-auto) để trên màn 360px không bị bóp
// chữ tới mức không đọc nổi.
//
// ─── PO ĐƯỢC GỘP VÀO ĐÂY ─────────────────────────────────────────────────
// PO không còn là phân hệ độc lập. Bảng và form PO TÁI SỬ DỤNG nguyên các
// component đã có trong ../orders (po-table, po-form-dialog) — không chép lại
// code để tránh hai bản lệch nhau về sau.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

type TabKey = 'customers' | 'po' | 'materials' | 'production' | 'shipments';

const TABS: Array<{ key: TabKey; label: string; short: string; icon: LucideIcon }> = [
  { key: 'customers', label: 'Khách hàng', short: 'Khách', icon: Building2 },
  { key: 'po', label: 'Đơn hàng (PO)', short: 'PO', icon: PackageSearch },
  { key: 'materials', label: 'Vật tư', short: 'Vật tư', icon: Boxes },
  { key: 'production', label: 'Sản xuất', short: 'Sản xuất', icon: Factory },
  { key: 'shipments', label: 'Giao hàng', short: 'Giao', icon: Ship },
];

function fmtDate(v: string | null): string {
  if (!v) return '—';
  const [y, m, d] = v.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export default function MdClient({
  initialSnapshot,
  initialPoRows,
  initialPoError,
  poOptions,
}: {
  initialSnapshot: MdSnapshot;
  initialPoRows: PoRow[];
  initialPoError: string | null;
  poOptions: PoOption[];
}) {
  const [tab, setTab] = useState<TabKey>('po');
  const [snap, setSnap] = useState(initialSnapshot);
  const [poRows, setPoRows] = useState(initialPoRows);
  const [poError, setPoError] = useState(initialPoError);
  const [dialog, setDialog] = useState<TabKey | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const [s, o] = await Promise.all([loadMdSnapshot(), listOrders()]);
    setSnap(s);
    setPoRows(o.rows);
    setPoError(o.error);
  }, []);

  const doRefresh = () => startTransition(() => { void refresh(); });

  // Đếm để hiện trên tab — người dùng biết ngay nhóm nào có việc
  const counts: Record<TabKey, number> = {
    customers: snap.customers.length,
    po: poRows.length,
    materials: snap.materialRequests.length,
    production: snap.productionOrders.length,
    shipments: snap.shipments.length,
  };

  const errorOf: Record<TabKey, string | null> = {
    customers: snap.errors.customers,
    po: poError,
    materials: snap.errors.materialRequests,
    production: snap.errors.productionOrders,
    shipments: snap.errors.shipments,
  };

  const createLabel: Record<TabKey, string> = {
    customers: 'Tạo khách hàng',
    po: 'Tạo PO',
    materials: 'Tạo đề nghị mua NPL',
    production: 'Tạo lệnh sản xuất',
    shipments: 'Tạo lệnh giao hàng',
  };

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const err = errorOf[tab];

  return (
    <>
      {/* ── Thanh tab: cuộn ngang trên mobile ─────────────────────────── */}
      <div
        role="tablist"
        aria-label="Nhóm chức năng Merchandiser"
        className="-mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {TABS.map((t) => {
          const on = t.key === tab;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                on
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
              {counts[t.key] > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                    on ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {counts[t.key]}
                </span>
              )}
              {errorOf[t.key] && (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
            <active.icon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            {active.label}
          </h2>
          <div className="flex items-center gap-2">
            <button type="button" className={btnGhost} onClick={doRefresh} disabled={pending}>
              <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} /> Tải lại
            </button>
            <button type="button" className={btnPrimary} onClick={() => setDialog(tab)}>
              <Plus className="h-4 w-4" /> {createLabel[tab]}
            </button>
          </div>
        </div>

        {err ? (
          <ErrorState message={err} onRetry={() => void refresh()} />
        ) : (
          <>
            {/* ── Khách hàng ─────────────────────────────────────────── */}
            {tab === 'customers' &&
              (snap.customers.length === 0 ? (
                <NoData title="Chưa có khách hàng nào" sub="Bấm Tạo khách hàng để thêm đối tác đầu tiên." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className={thCls}>Mã KH</th>
                        <th className={thCls}>Tên khách hàng</th>
                        <th className={thCls}>Người liên hệ</th>
                        <th className={thCls}>Điện thoại</th>
                        <th className={thCls}>Quốc gia</th>
                        <th className={thCls}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {snap.customers.map((c) => (
                        <tr key={c.id} className="transition hover:bg-slate-50/70">
                          <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{c.customer_code}</td>
                          <td className={`${tdCls} font-medium text-slate-800`}>{c.name}</td>
                          <td className={tdCls}>{c.contact_person ?? '—'}</td>
                          <td className={tdCls}>{c.phone ?? '—'}</td>
                          <td className={tdCls}>{c.country ?? '—'}</td>
                          <td className={tdCls}>
                            {c.is_active ? <Badge tone="emerald">Đang hợp tác</Badge> : <Badge tone="slate">Tạm dừng</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* ── PO: tái sử dụng bảng có sẵn ────────────────────────── */}
            {tab === 'po' && <PoTable rows={poRows} loading={pending} error={null} onRefresh={refresh} />}

            {/* ── Đề nghị mua NPL ───────────────────────────────────── */}
            {tab === 'materials' &&
              (snap.materialRequests.length === 0 ? (
                <NoData title="Chưa có đề nghị mua NPL" sub="Bấm Tạo đề nghị mua NPL để lập phiếu đầu tiên." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className={thCls}>Số phiếu</th>
                        <th className={thCls}>PO</th>
                        <th className={thCls}>Nguyên phụ liệu</th>
                        <th className={thCls}>Loại</th>
                        <th className={thCls}>Số lượng</th>
                        <th className={thCls}>Cần ngày</th>
                        <th className={thCls}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {snap.materialRequests.map((r) => (
                        <tr key={r.id} className="transition hover:bg-slate-50/70">
                          <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{r.request_no}</td>
                          <td className={`${tdCls} font-mono text-xs text-slate-500`}>{r.po_number ?? '—'}</td>
                          <td className={`${tdCls} font-medium text-slate-800`}>{r.material_name}</td>
                          <td className={`${tdCls} text-xs text-slate-500`}>
                            {MATERIAL_CATEGORY_LABEL[r.category as MaterialCategory] ?? r.category}
                          </td>
                          <td className={`${tdCls} tabular-nums font-semibold`}>
                            {nf.format(r.quantity)} <span className="font-normal text-slate-400">{r.unit}</span>
                          </td>
                          <td className={tdCls}>{fmtDate(r.needed_date)}</td>
                          <td className={tdCls}>
                            <Badge tone={r.status === 'REJECTED' ? 'rose' : r.status === 'RECEIVED' ? 'emerald' : 'indigo'}>
                              {MR_STATUS_LABEL[r.status] ?? r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* ── Lệnh sản xuất ─────────────────────────────────────── */}
            {tab === 'production' &&
              (snap.productionOrders.length === 0 ? (
                <NoData title="Chưa có lệnh sản xuất" sub="Bấm Tạo lệnh sản xuất để phát hành lệnh đầu tiên." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className={thCls}>Số lệnh</th>
                        <th className={thCls}>PO</th>
                        <th className={thCls}>SL kế hoạch</th>
                        <th className={thCls}>Bắt đầu</th>
                        <th className={thCls}>Tới hạn</th>
                        <th className={thCls}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {snap.productionOrders.map((p) => (
                        <tr key={p.id} className="transition hover:bg-slate-50/70">
                          <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{p.order_no}</td>
                          <td className={`${tdCls} font-mono text-xs text-slate-500`}>{p.po_number ?? '—'}</td>
                          <td className={`${tdCls} tabular-nums font-semibold`}>{nf.format(p.planned_qty)} pcs</td>
                          <td className={tdCls}>{fmtDate(p.start_date)}</td>
                          <td className={tdCls}>{fmtDate(p.due_date)}</td>
                          <td className={tdCls}>
                            <Badge
                              tone={
                                p.status === 'CANCELLED' ? 'rose'
                                : p.status === 'COMPLETED' ? 'emerald'
                                : p.status === 'PENDING' ? 'amber'
                                : 'indigo'
                              }
                            >
                              {PROD_STATUS_LABEL[p.status] ?? p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* ── Lệnh giao hàng ────────────────────────────────────── */}
            {tab === 'shipments' &&
              (snap.shipments.length === 0 ? (
                <NoData title="Chưa có lệnh giao hàng" sub="Bấm Tạo lệnh giao hàng để lập lệnh đầu tiên." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className={thCls}>Số lệnh</th>
                        <th className={thCls}>PO</th>
                        <th className={thCls}>Container</th>
                        <th className={thCls}>Cảng đến</th>
                        <th className={thCls}>ETD</th>
                        <th className={thCls}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {snap.shipments.map((s) => (
                        <tr key={s.id} className="transition hover:bg-slate-50/70">
                          <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{s.shipment_no}</td>
                          <td className={`${tdCls} font-mono text-xs text-slate-500`}>{s.po_number ?? '—'}</td>
                          <td className={`${tdCls} font-mono text-xs`}>{s.container_no ?? '—'}</td>
                          <td className={tdCls}>{s.destination_port ?? '—'}</td>
                          <td className={tdCls}>{fmtDate(s.etd_date)}</td>
                          <td className={tdCls}>
                            <Badge tone={s.status === 'DRAFT' ? 'amber' : 'indigo'}>{s.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </>
        )}
      </Card>

      {/* ── Các hộp thoại tạo mới ──────────────────────────────────────── */}
      <CustomerFormDialog open={dialog === 'customers'} onClose={() => setDialog(null)} onDone={refresh} />
      <PoFormDialog open={dialog === 'po'} onClose={() => setDialog(null)} onCreated={refresh} />
      <MaterialRequestDialog open={dialog === 'materials'} onClose={() => setDialog(null)} onDone={refresh} pos={poOptions} />
      <ProductionOrderDialog open={dialog === 'production'} onClose={() => setDialog(null)} onDone={refresh} pos={poOptions} />
      <ShipmentFormDialog open={dialog === 'shipments'} onClose={() => setDialog(null)} onDone={refresh} pos={poOptions} />
    </>
  );
}
