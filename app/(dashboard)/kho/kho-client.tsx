'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  Boxes, PackagePlus, PackageMinus, RefreshCw, TriangleAlert, ArrowDownToLine,
  ArrowUpFromLine, Layers,
} from 'lucide-react';

import { Card, StatCard, Badge, ProgressBar, btnPrimary, btnGhost, thCls, tdCls } from '@/components/ui';
import { NoData } from '@/components/data-state';
import { listMaterials, listTransactions } from './wh-actions';
import { CATEGORY_LABEL, type MaterialCategory, type MaterialRow, type PoOption, type TxRow } from './wh-schema';
import TxTable from './tx-table';
import InboundFormDialog from './inbound-form-dialog';
import OutboundFormDialog from './outbound-form-dialog';

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

export default function KhoClient({
  initialMaterials,
  initialTx,
  poOptions,
  initialError,
}: {
  initialMaterials: MaterialRow[];
  initialTx: TxRow[];
  poOptions: PoOption[];
  initialError: string | null;
}) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [tx, setTx] = useState(initialTx);
  const [error, setError] = useState(initialError);
  const [showInbound, setShowInbound] = useState(false);
  const [showOutbound, setShowOutbound] = useState(false);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const [m, t] = await Promise.all([listMaterials(), listTransactions()]);
    setMaterials(m.rows);
    setTx(t.rows);
    setError(m.error ?? t.error);
  }, []);

  const stats = useMemo(() => {
    const lowStock = materials.filter((m) => Number(m.stock_qty) <= Number(m.min_stock_qty));
    const vnToday = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
    const inToday = tx.filter(
      (t) =>
        t.transaction_type.toUpperCase() === 'IN' &&
        new Date(new Date(t.created_at).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10) === vnToday,
    );
    const outToday = tx.filter(
      (t) =>
        t.transaction_type.toUpperCase() === 'OUT' &&
        new Date(new Date(t.created_at).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10) === vnToday,
    );
    return { codes: materials.length, lowStock, inToday: inToday.length, outToday: outToday.length };
  }, [materials, tx]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Boxes} label="Danh mục vật tư" value={nf.format(stats.codes)} sub="mã NPL đang quản lý" />
        <StatCard
          icon={TriangleAlert}
          label="Chạm ngưỡng tồn"
          value={nf.format(stats.lowStock.length)}
          sub={stats.lowStock.length > 0 ? 'mã cần nhập bổ sung' : 'tồn kho ổn định'}
          tone={stats.lowStock.length > 0 ? 'rose' : 'emerald'}
          alert={stats.lowStock.length > 0}
        />
        <StatCard
          icon={ArrowDownToLine}
          label="Phiếu nhập hôm nay"
          value={nf.format(stats.inToday)}
          sub="lô mới nhập trong ngày"
          tone="indigo"
        />
        <StatCard
          icon={ArrowUpFromLine}
          label="Phiếu xuất hôm nay"
          value={nf.format(stats.outToday)}
          sub="lượt cấp phát trong ngày"
          tone="amber"
        />
      </div>

      {/* ── Cảnh báo tồn thấp: đưa lên trên vì đây là việc cần xử lý ngay ── */}
      {stats.lowStock.length > 0 && (
        <Card className="mt-6" title={`Cần nhập bổ sung (${stats.lowStock.length})`} icon={TriangleAlert}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thCls}>Mã NPL</th>
                  <th className={thCls}>Tên</th>
                  <th className={thCls}>Tồn / Ngưỡng</th>
                  <th className={thCls}>Mức tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.lowStock.map((m) => {
                  const min = Number(m.min_stock_qty) || 1;
                  return (
                    <tr key={m.id} className="transition hover:bg-slate-50/70">
                      <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{m.material_code}</td>
                      <td className={tdCls}>{m.name}</td>
                      <td className={`${tdCls} tabular-nums`}>
                        <span className="font-semibold text-rose-600">{nf.format(Number(m.stock_qty))}</span>
                        <span className="text-slate-400"> / {nf.format(Number(m.min_stock_qty))} {m.unit}</span>
                      </td>
                      <td className={tdCls}>
                        <ProgressBar pct={(Number(m.stock_qty) / min) * 100} tone="rose" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Tồn kho theo mã ─────────────────────────────────────────────── */}
      <Card className="mt-6" title={`Tồn kho hiện tại (${materials.length})`} icon={Layers}>
        {materials.length === 0 ? (
          <NoData title="Chưa có mã vật tư nào" sub="Lập phiếu nhập kho để tạo mã NPL đầu tiên." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thCls}>Mã NPL</th>
                  <th className={thCls}>Tên</th>
                  <th className={thCls}>Loại</th>
                  <th className={thCls}>Tồn hiện tại</th>
                  <th className={thCls}>Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {materials.map((m) => {
                  const low = Number(m.stock_qty) <= Number(m.min_stock_qty);
                  return (
                    <tr key={m.id} className="transition hover:bg-slate-50/70">
                      <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{m.material_code}</td>
                      <td className={tdCls}>{m.name}</td>
                      <td className={`${tdCls} text-xs text-slate-500`}>
                        {CATEGORY_LABEL[m.category as MaterialCategory] ?? m.category}
                      </td>
                      <td className={`${tdCls} tabular-nums font-semibold text-slate-800`}>
                        {nf.format(Number(m.stock_qty))} <span className="font-normal text-slate-400">{m.unit}</span>
                      </td>
                      <td className={tdCls}>
                        {low ? (
                          <Badge tone="rose" icon={TriangleAlert}>Chạm ngưỡng</Badge>
                        ) : (
                          <Badge tone="emerald">Đủ tồn</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Lịch sử xuất/nhập ───────────────────────────────────────────── */}
      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Lịch sử xuất / nhập kho</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={btnGhost}
              disabled={pending}
              onClick={() => startTransition(() => void refresh())}
            >
              <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} /> Làm mới
            </button>
            <button type="button" className={btnGhost} onClick={() => setShowOutbound(true)}>
              <PackageMinus className="h-4 w-4" /> Xuất kho
            </button>
            <button type="button" className={btnPrimary} onClick={() => setShowInbound(true)}>
              <PackagePlus className="h-4 w-4" /> Nhập kho
            </button>
          </div>
        </div>

        <TxTable rows={tx} error={error} onRefresh={refresh} />
      </Card>

      <InboundFormDialog
        open={showInbound}
        onClose={() => setShowInbound(false)}
        onCreated={refresh}
        poOptions={poOptions}
      />

      <OutboundFormDialog
        open={showOutbound}
        onClose={() => setShowOutbound(false)}
        onCreated={refresh}
        materials={materials.filter((m) => Number(m.stock_qty) > 0)}
        poOptions={poOptions}
      />
    </>
  );
}
