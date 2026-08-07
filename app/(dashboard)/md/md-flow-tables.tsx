'use client';

// ============================================================================
// MD — BA BẢNG CỦA DÒNG CHẢY ĐƠN HÀNG: Vật tư · Sản xuất · Giao hàng
//
// Tách khỏi `md-client.tsx` ngày 06/08/2026 (Board Directive — Step 1).
// **Phép dời thuần**: ⛔ không đổi nghiệp vụ · ⛔ không đổi giao diện · ⛔ không
// đổi API. Markup chép nguyên văn, chỉ thay chuỗi lớp bằng hằng số cùng giá trị.
//
// ⚠️ **VÌ SAO NẰM Ở `app/…/md/` CHỨ ⛔ KHÔNG Ở `components/md/`.**
// Bản nháp đầu tôi đặt ở `components/md/` và nó **vi phạm bài kiểm kiến trúc ②**:
// `components/` ⛔ **không được import từ `app/`**, mà ba bảng này cần kiểu dữ
// liệu và bảng nhãn ở `md-schema.ts` — vốn nằm trong `app/`. Đặt ở đây thì
// `app → app`, hợp lệ, và ⛔ không phải chép kiểu sang chỗ thứ hai.
//
// ⚠️ **TỆP NÀY ⛔ KHÔNG CHỨA MỘT LITERAL MÀU HAY CỠ CHỮ NÀO.** `arch.test.mjs`
// ⑨/⑩ là bánh cóc: tệp MỚI viết `text-slate-500` hay `text-xs` thẳng thì HỎNG,
// và thêm tên vào sổ nợ là việc **cần Board duyệt**. Mọi lớp ô lấy từ
// `components/ui` — tệp đó đã nằm sẵn trong cả hai sổ nợ.
// ============================================================================
import { useState, useTransition } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

import {
  Badge, NoDataTable, SearchBox, btnGhost, thCls, trHover, theadRow, tbodyDivide,
  tdCode, tdCodeMuted, tdStrong, tdMuted, tdNum, unitCls,
} from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { nf, fmtDate } from './md-tabs';
import {
  buocKeTiepNPL, buocKeTiepSanXuat, buocKeTiepGiaoHang, type BuocKeTiep,
} from '@/lib/mos/md/flow-steps';
import {
  setMaterialRequestStatus, setProductionOrderStatus, setShipmentStatus,
} from './_actions/flow.actions';
import {
  MATERIAL_CATEGORY_LABEL, MR_STATUS_LABEL, PROD_STATUS_LABEL, SHIPMENT_STATUS_LABEL,
  type MaterialCategory, type MaterialRequestRow, type ProductionOrderRow, type ShipmentRow,
} from './md-schema';

interface Khung<T> {
  rows: T[];
  error: string | null;
  onRetry: () => void;
  q: string;
  onQ: (v: string) => void;
  /** Gọi sau khi đổi trạng thái xong để nạp lại số liệu. */
  onDone: () => void;
}

/**
 * Nút đẩy chứng từ đi MỘT bước.
 *
 * 🔑 Một nút, ⛔ không phải hộp chọn: thứ tự vòng đời là thứ phần mềm phải nhớ
 * hộ người dùng. Chứng từ đã đóng ⇒ `buoc === null` ⇒ ⛔ KHÔNG dựng nút —
 * một nút bấm vào ⛔ không làm gì là tệ hơn ⛔ không có nút.
 *
 * ⚠️ Nút chỉ là GỢI Ý. Máy chủ đọc lại trạng thái thật rồi mới quyết định
 * (`flow.actions.ts`), nên bấm nhanh hai lần hay gọi thẳng action đều ⛔ không
 * làm chứng từ nhảy cóc.
 */
function NutBuoc({ buoc, dang, onChay }: {
  buoc: BuocKeTiep;
  dang: boolean;
  onChay: (status: string) => void;
}) {
  if (!buoc) return <span>—</span>;
  return (
    <button type="button" className={btnGhost} disabled={dang} onClick={() => onChay(buoc.status)}>
      {dang ? 'Đang lưu…' : buoc.nhan}
    </button>
  );
}

/** Gom một chỗ: chạy action, báo kết quả, nạp lại. */
function useDoiTrangThai(onDone: () => void) {
  const [dang, setDang] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const chay = (id: string, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setDang(id);
    void fn()
      .then((r) => {
        // ⚠️ Báo THẬT: CSDL từ chối (RLS) thì người dùng phải thấy, ⛔ không
        // được nuốt lỗi rồi để màn hình trông như đã lưu.
        if (r.ok) toast.success(r.message ?? 'Đã cập nhật.');
        else toast.error(r.message ?? 'Không cập nhật được.');
        if (r.ok) startTransition(onDone);
      })
      .finally(() => setDang(null));
  };
  return { dang, chay };
}

/** Lọc phía client trên dữ liệu ĐÃ TẢI — ⛔ không truy vấn lại CSDL. */
function loc<T>(rows: T[], q: string, truong: (r: T) => (string | null)[]): T[] {
  const k = q.trim().toLowerCase();
  return k ? rows.filter((r) => truong(r).some((v) => (v ?? '').toLowerCase().includes(k))) : rows;
}

// ─── VẬT TƯ ────────────────────────────────────────────────────────────────
/** 🔴 `BUG-5` · Board 07/08/2026 — trạng thái ⛔ không sửa được, khai đúng như
 *  `LUAT.MATERIAL_REQUEST` ở `lib/mos/md/document-lock.ts`.
 *  `ORDERED` = đã đặt nhà cung cấp · `RECEIVED` = đã nhập kho.
 *  ⚠️ Chỉ để ẨN nút; luật thật chạy ở `updateMaterialRequest` trên máy chủ. */
const MR_KHOA_SUA: ReadonlySet<string> = new Set(['ORDERED', 'RECEIVED']);

export function MaterialRequestTable({
  rows, error, onRetry, q, onQ, onDone, onSua,
}: Khung<MaterialRequestRow> & { onSua?: (id: string) => void }) {
  const { dang, chay } = useDoiTrangThai(onDone);
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (rows.length === 0) {
    return (
      <NoData
        title="Chưa có đề nghị mua NPL"
        sub="Bấm Sinh từ định mức để hệ thống tự tính nhu cầu từng loại nguyên phụ liệu theo mã hàng và số lượng đơn."
      />
    );
  }
  const hien = loc(rows, q, (r) => [r.request_no, r.po_number, r.material_name]);
  return (
    <>
      <SearchBox value={q} onChange={onQ} placeholder="Tìm số phiếu, PO, tên nguyên phụ liệu..." label="Tìm đề nghị mua NPL" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className={theadRow}>
              <th className={thCls}>Số phiếu</th>
              <th className={thCls}>PO</th>
              <th className={thCls}>Nguyên phụ liệu</th>
              <th className={thCls}>Loại</th>
              <th className={thCls}>Số lượng</th>
              <th className={thCls}>Cần ngày</th>
              <th className={thCls}>Trạng thái</th>
              <th className={thCls}>Bước kế tiếp</th>
            </tr>
          </thead>
          <tbody className={tbodyDivide}>
            {hien.map((r) => (
              <tr key={r.id} className={trHover}>
                <td className={tdCode}>{r.request_no}</td>
                <td className={tdCodeMuted}>{r.po_number ?? '—'}</td>
                <td className={tdStrong}>{r.material_name}</td>
                <td className={tdMuted}>
                  {MATERIAL_CATEGORY_LABEL[r.category as MaterialCategory] ?? r.category}
                </td>
                <td className={tdNum}>
                  {nf.format(r.quantity)} <span className={unitCls}>{r.unit}</span>
                </td>
                <td className={tdMuted}>{fmtDate(r.needed_date)}</td>
                <td className={tdMuted}>
                  <Badge tone={r.status === 'REJECTED' ? 'rose' : r.status === 'RECEIVED' ? 'emerald' : 'indigo'}>
                    {MR_STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </td>
                <td className={tdMuted}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <NutBuoc
                      buoc={buocKeTiepNPL(r.status)}
                      dang={dang === r.id}
                      onChay={(st) => chay(r.id, () => setMaterialRequestStatus(r.id, st as never))}
                    />
                    {/* 🔴 BUG-5 — sửa NỘI DUNG phiếu, ⛔ không chỉ đẩy trạng
                        thái. Nút "Bước kế tiếp" đã có từ lâu, nhưng gõ sai
                        **số lượng vải** thì ⛔ không có đường nào sửa, mà số đó
                        đi thẳng vào đơn mua hàng. */}
                    {/* ⚠️ Lớp lấy từ `btnGhost` của `components/ui`, ⛔ KHÔNG
                        viết màu/cỡ chữ thẳng — xem khối chú thích đầu tệp:
                        tệp này cố ý ⛔ không chứa một literal nào, và bánh cóc
                        `TD-07`/`TD-10` đọc literal MỚI ở đây là **nợ mới**. */}
                    {onSua && !MR_KHOA_SUA.has(String(r.status ?? '').toUpperCase()) && (
                      <button type="button" className={btnGhost} onClick={() => onSua(r.id)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Sửa
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <NoDataTable hien={hien.length} tong={rows.length} />
      </div>
    </>
  );
}

// ─── SẢN XUẤT ──────────────────────────────────────────────────────────────
export function ProductionOrderTable({ rows, error, onRetry, q, onQ, onDone }: Khung<ProductionOrderRow>) {
  const { dang, chay } = useDoiTrangThai(onDone);
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (rows.length === 0) {
    return (
      <NoData
        title="Chưa có lệnh sản xuất"
        sub="Bấm Sinh từ SAM để tính số ngày sản xuất từ thời gian chuẩn của mã hàng và năng lực chuyền."
      />
    );
  }
  const hien = loc(rows, q, (p) => [p.order_no, p.po_number]);
  return (
    <>
      <SearchBox value={q} onChange={onQ} placeholder="Tìm số lệnh sản xuất, mã PO..." label="Tìm lệnh sản xuất" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className={theadRow}>
              <th className={thCls}>Số lệnh</th>
              <th className={thCls}>PO</th>
              <th className={thCls}>SL kế hoạch</th>
              <th className={thCls}>Bắt đầu</th>
              <th className={thCls}>Tới hạn</th>
              <th className={thCls}>Trạng thái</th>
              <th className={thCls}>Bước kế tiếp</th>
            </tr>
          </thead>
          <tbody className={tbodyDivide}>
            {hien.map((p) => (
              <tr key={p.id} className={trHover}>
                <td className={tdCode}>{p.order_no}</td>
                <td className={tdCodeMuted}>{p.po_number ?? '—'}</td>
                <td className={tdNum}>{nf.format(p.planned_qty)} pcs</td>
                <td className={tdMuted}>{fmtDate(p.start_date)}</td>
                <td className={tdMuted}>{fmtDate(p.due_date)}</td>
                <td className={tdMuted}>
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
                <td className={tdMuted}>
                  <NutBuoc
                    buoc={buocKeTiepSanXuat(p.status)}
                    dang={dang === p.id}
                    onChay={(st) => chay(p.id, () => setProductionOrderStatus(p.id, st as never))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <NoDataTable hien={hien.length} tong={rows.length} />
      </div>
    </>
  );
}

// ─── GIAO HÀNG ─────────────────────────────────────────────────────────────
export function ShipmentTable({ rows, error, onRetry, q, onQ, onDone }: Khung<ShipmentRow>) {
  const { dang, chay } = useDoiTrangThai(onDone);
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (rows.length === 0) {
    return <NoData title="Chưa có lệnh giao hàng" sub="Bấm Tạo lệnh giao hàng để lập lệnh đầu tiên." />;
  }
  const hien = loc(rows, q, (s) => [s.shipment_no, s.po_number, s.container_no, s.destination_port]);
  return (
    <>
      <SearchBox value={q} onChange={onQ} placeholder="Tìm số lệnh giao, PO, số container, cảng đến..." label="Tìm lệnh giao hàng" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className={theadRow}>
              <th className={thCls}>Số lệnh</th>
              <th className={thCls}>PO</th>
              <th className={thCls}>Container</th>
              <th className={thCls}>Cảng đến</th>
              <th className={thCls}>ETD</th>
              <th className={thCls}>Trạng thái</th>
              <th className={thCls}>Bước kế tiếp</th>
            </tr>
          </thead>
          <tbody className={tbodyDivide}>
            {hien.map((s) => (
              <tr key={s.id} className={trHover}>
                <td className={tdCode}>{s.shipment_no}</td>
                <td className={tdCodeMuted}>{s.po_number ?? '—'}</td>
                <td className={tdCodeMuted}>{s.container_no ?? '—'}</td>
                <td className={tdMuted}>{s.destination_port ?? '—'}</td>
                <td className={tdMuted}>{fmtDate(s.etd_date)}</td>
                <td className={tdMuted}>
                  <Badge
                    tone={
                      s.status === 'CANCELLED' ? 'rose'
                      : s.status === 'DELIVERED' ? 'emerald'
                      : s.status === 'DRAFT' ? 'amber'
                      : 'indigo'
                    }
                  >
                    {SHIPMENT_STATUS_LABEL[s.status] ?? s.status}
                  </Badge>
                </td>
                <td className={tdMuted}>
                  <NutBuoc
                    buoc={buocKeTiepGiaoHang(s.status)}
                    dang={dang === s.id}
                    onChay={(st) => chay(s.id, () => setShipmentStatus(s.id, st as never))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <NoDataTable hien={hien.length} tong={rows.length} />
      </div>
    </>
  );
}
