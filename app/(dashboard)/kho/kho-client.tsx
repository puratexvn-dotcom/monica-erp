'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  Boxes, PackagePlus, PackageMinus, RefreshCw, TriangleAlert, ArrowDownToLine,
  ArrowUpFromLine, Layers,
} from 'lucide-react';

import { Card, StatCard, Badge, ProgressBar, btnPrimary, btnGhost, thCls, tdCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { listMaterials, listTransactions } from './wh-actions';
import { CATEGORY_LABEL, type MaterialCategory, type MaterialRow, type PoOption, type TxRow } from './wh-schema';
import TxTable from './tx-table';
import InboundFormDialog from './inbound-form-dialog';
import OutboundFormDialog from './outbound-form-dialog';
import { laHomNayVN } from '@/lib/time';

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

/**
 * Màn hình kho CŨ, giữ nguyên vẹn.
 *
 * ─── VÌ SAO THÊM PROP `mode` ─────────────────────────────────────────────
 * Trung tâm điều hành mới nhúng lại chính component này vào hai tab Nhập hàng
 * và Xuất kho, thay vì viết lại hai form từ đầu. Hai form nhập/xuất ở đây đang
 * phục vụ người dùng thật và đã chạy ổn định — viết lại chỉ để cho "mới" là
 * đánh đổi thứ đang dùng được lấy thứ chưa kiểm chứng.
 *
 * `mode` không truyền (undefined) thì component chạy Y HỆT như trước: hiện đủ
 * dải chỉ số, bảng tồn kho cũ và lịch sử. Truyền 'inbound'/'outbound' thì chỉ
 * hiện phần liên quan tới luồng đó.
 */
export default function KhoClient({
  mode,
  onChanged,
  initialMaterials,
  initialTx,
  poOptions,
  initialMatError,
  initialTxError,
  initialPoError,
}: {
  /** undefined = màn hình đầy đủ như cũ; 'inbound'/'outbound' = nhúng vào tab */
  mode?: 'inbound' | 'outbound';
  /** Gọi sau khi ghi thành công, để trung tâm điều hành nạp lại số liệu */
  onChanged?: () => void | Promise<void>;
  initialMaterials: MaterialRow[];
  initialTx: TxRow[];
  poOptions: PoOption[];
  initialMatError: string | null;
  initialTxError: string | null;
  initialPoError: string | null;
}) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [tx, setTx] = useState(initialTx);
  // Tách lỗi theo từng nguồn: nếu gộp một biến thì bảng tồn kho hỏng lại hiện
  // "chưa có vật tư nào" — người dùng tưởng kho trống trong khi thực tế là lỗi
  // kết nối. Trong ERP hai chuyện đó dẫn tới hai quyết định khác hẳn nhau.
  const [matError, setMatError] = useState(initialMatError);
  const [txError, setTxError] = useState(initialTxError);
  const [showInbound, setShowInbound] = useState(false);
  const [showOutbound, setShowOutbound] = useState(false);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const [m, t] = await Promise.all([listMaterials(), listTransactions()]);
    setMaterials(m.rows);
    setTx(t.rows);
    setMatError(m.error);
    setTxError(t.error);
    // Bảng tồn kho mới đọc từ stock_levels, không đọc materials.stock_qty — nên
    // ghi xong phải báo lên trang cha để nó nạp lại, nếu không hai bảng sẽ hiện
    // hai con số khác nhau trên cùng một màn hình.
    await onChanged?.();
  }, [onChanged]);

  const stats = useMemo(() => {
    const lowStock = materials.filter((m) => Number(m.stock_qty) <= Number(m.min_stock_qty));
    const inToday = tx.filter(
      (t) =>
        t.transaction_type.toUpperCase() === 'IN' && laHomNayVN(t.created_at),
    );
    const outToday = tx.filter(
      (t) =>
        t.transaction_type.toUpperCase() === 'OUT' && laHomNayVN(t.created_at),
    );
    return { codes: materials.length, lowStock, inToday: inToday.length, outToday: outToday.length };
  }, [materials, tx]);

  // Gom mọi lỗi đang có để hiện một dải cảnh báo ở đầu trang — người vận hành
  // thấy ngay có gì không đọc được, thay vì phải tự đoán qua các bảng trống.
  const problems = [
    matError ? `Tồn kho: ${matError}` : null,
    txError ? `Lịch sử xuất/nhập: ${txError}` : null,
    initialPoError ? `Danh sách PO: ${initialPoError}` : null,
  ].filter((x): x is string => x !== null);

  return (
    <>
      {problems.length > 0 && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4"
        >
          <p className="flex items-center gap-2 text-sm font-bold text-rose-900">
            <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
            Không đọc được {problems.length} nhóm dữ liệu
          </p>
          <ul className="mt-2 space-y-1 pl-7 text-sm text-rose-800">
            {problems.map((p) => (
              <li key={p} className="list-disc">{p}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => startTransition(() => { void refresh(); })}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
          >
            <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} aria-hidden="true" />
            Tải lại dữ liệu
          </button>
        </div>
      )}

      {/* Dải chỉ số và bảng tồn kho CŨ chỉ hiện ở màn hình đầy đủ. Khi nhúng
          vào tab của trung tâm điều hành thì ba cột phía trên đã trả lời đúng
          những câu đó rồi — hiện lại vừa lặp vừa dễ lệch số. */}
      {mode === undefined && (
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
      )}

      {/* ── Cảnh báo tồn thấp: đưa lên trên vì đây là việc cần xử lý ngay ── */}

      {mode === undefined && stats.lowStock.length > 0 && (
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
      {mode === undefined && (
      <Card className="mt-6" title={`Tồn kho hiện tại (${materials.length})`} icon={Layers}>
        {matError ? (
          <ErrorState message={matError} onRetry={() => void refresh()} />
        ) : materials.length === 0 ? (
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
      )}

      {/* ── Lịch sử xuất/nhập ───────────────────────────────────────────── */}

      <Card className={mode === undefined ? 'mt-6' : ''}>
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

        <TxTable rows={tx} error={txError} onRefresh={refresh} />
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
