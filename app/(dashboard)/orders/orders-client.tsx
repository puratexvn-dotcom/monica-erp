'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { PackagePlus, RefreshCw, Package, PackageCheck, Layers } from 'lucide-react';

import { Card, StatCard, btnPrimary, btnGhost } from '@/components/ui';
import { listOrders } from './actions';
import type { PoRow } from './po-schema';
import PoTable from './po-table';
import PoFormDialog from './po-form-dialog';
import ReopenPanel from './reopen-panel';
import type { Role } from '@/lib/rbac';

/**
 * Cầu nối giữa dữ liệu nạp sẵn ở máy chủ và phần tương tác ở trình duyệt.
 *
 * Dữ liệu lần đầu do Server Component truyền xuống (initialRows) nên bảng có
 * nội dung ngay từ khung hình đầu; các lần làm mới sau gọi lại Server Action
 * thay vì tải lại cả trang.
 */
export default function OrdersClient({
  initialRows,
  initialError,
  role,
}: {
  initialRows: PoRow[];
  initialError: string | null;
  /** 🔴 `BUG-4` — quyết định có bày khu **Mở lại chứng từ đã đóng** hay không.
   *  Đọc ở máy chủ từ `app_metadata`; xem chú thích ở `page.tsx`. */
  role: Role | null;
}) {
  const [rows, setRows] = useState<PoRow[]>(initialRows);
  const [error, setError] = useState<string | null>(initialError);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();

  const nf = useMemo(() => new Intl.NumberFormat('vi-VN'), []);
  const stats = useMemo(() => {
    const qty = rows.reduce((s, o) => s + (o.total_quantity ?? 0), 0);
    const running = rows.filter((o) => o.status?.toUpperCase() === 'IN_PRODUCTION').length;
    return { count: rows.length, qty, running };
  }, [rows]);

  const refresh = useCallback(async () => {
    const res = await listOrders();
    setRows(res.rows);
    setError(res.error);
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Package} label="Tổng đơn hàng" value={nf.format(stats.count)} sub="PO đang quản lý" />
        <StatCard icon={Layers} label="Tổng sản lượng" value={nf.format(stats.qty)} sub="pcs theo kế hoạch" tone="emerald" />
        <StatCard icon={PackageCheck} label="Đang sản xuất" value={nf.format(stats.running)} sub="đơn đang chạy chuyền" tone="amber" />
      </div>

      <Card className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Danh sách đơn hàng</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={btnGhost}
            disabled={pending}
            onClick={() => startTransition(() => void refresh())}
          >
            <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <button type="button" className={btnPrimary} onClick={() => setShowAdd(true)}>
            <PackagePlus className="h-4 w-4" /> Tạo PO
          </button>
        </div>
      </div>

      <PoTable rows={rows} loading={false} error={error} onRefresh={refresh} />
      </Card>

      {/* 🔴 BUG-4 · Re-open Workflow — Board 07/08/2026. Khu này **tự ẩn** khi
          vai ⛔ không được mở lại, hoặc khi ⛔ không có đơn nào đã đóng.
          🔑 Đặt ở `/orders` vì `giamdoc` ⛔ KHÔNG vào được `/md` — lý lẽ đầy đủ
          ở đầu `reopen-panel.tsx`. */}
      <ReopenPanel rows={rows} role={role} onDone={refresh} />

      <PoFormDialog open={showAdd} onClose={() => setShowAdd(false)} onCreated={refresh} />
    </>
  );
}
