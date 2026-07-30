'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Check, Copy, Loader2, Plus, Send, Trash2, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui';
import { getCostingDetailClient } from '@/app/(dashboard)/md/_actions/md4.client';
import {
  setCostingStatus, reviseCosting, deleteCostingItem,
} from '@/app/(dashboard)/md/_actions/commercial.actions';
import type { CostingDetail } from '@/app/(dashboard)/md/_services/commercial.service';
import { TabSection, DataTable, tdCls, Metric, fmtDate, fmtNum, fmtMoney } from '../po/tab-kit';
import { COST_CATEGORY_LABEL, COSTING_STATUS_LABEL, ORDER_TYPE_LABEL, labelOf } from '../po/labels';
import { CostingItemDialog } from './costing-form-dialog';
import type { CostingRow } from '@/schemas/md';

// ============================================================================
// CHI TIẾT MỘT BẢN CHIẾT TÍNH + LỊCH SỬ PHIÊN BẢN
//
// ─── VÌ SAO PHẢI CÓ PHIÊN BẢN ───────────────────────────────────────────────
// Giá báo cho khách thay đổi nhiều lần trước khi chốt. Sửa đè lên bản cũ là
// mất dấu vết: khi khách hỏi "sao lần trước 4,20 USD mà giờ 4,65?" thì phải mở
// lại được đúng bản 4,20 để chỉ ra khoản nào tăng.
//
// ─── VÌ SAO BIÊN LỢI NHUẬN TÍNH LẠI TẠI CHỖ ─────────────────────────────────
// Cột margin_percent trong bảng chỉ đúng ở thời điểm bấm lưu. Màn hình này
// cộng lại từ chính các khoản mục đang hiển thị, nên con số luôn khớp với
// những dòng người dùng đang nhìn thấy.
// ============================================================================

const EMPTY: CostingDetail = {
  items: [], byCategory: [], totalCost: 0, margin: null, versions: [], error: null,
};

export default function CostingDetailSheet({
  costing,
  onClose,
  onChanged,
}: {
  costing: CostingRow | null;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const [data, setData] = useState<CostingDetail>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const id = costing?.id ?? null;
  const no = costing?.costing_no ?? null;
  const quoted = costing?.quoted_price ?? null;

  const load = useCallback(async () => {
    if (!id || !no) return;
    setLoading(true);
    setData(await getCostingDetailClient(id, no, quoted));
    setLoading(false);
  }, [id, no, quoted]);

  useEffect(() => {
    if (!id) return;
    setData(EMPTY);
    void load();
  }, [id, load]);

  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [id, onClose]);

  if (!costing) return null;

  const act = (fn: () => Promise<{ ok: boolean; message: string }>, okTitle: string) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(okTitle, { description: res.message });
        await load();
        await onChanged();
      } else {
        toast.error('Không thực hiện được', { description: res.message });
      }
    });
  };

  const decide = (status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISE') => {
    let reason: string | undefined;
    if (status === 'REJECTED' || status === 'REVISE') {
      const input = window.prompt(
        status === 'REJECTED'
          ? 'Lý do từ chối bản chiết tính này?'
          : 'Cần làm lại những gì?',
      );
      // Bấm Huỷ ở hộp nhắc = không làm gì cả, khác hẳn với nhập chuỗi rỗng
      if (input === null) return;
      reason = input;
    }
    act(() => setCostingStatus(costing.id, status, reason), 'Đã cập nhật trạng thái');
  };

  const marginTone =
    data.margin === null ? 'slate' : data.margin >= 15 ? 'emerald' : data.margin >= 5 ? 'amber' : 'rose';

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-900/50 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết chiết tính ${costing.costing_no}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col bg-slate-50 shadow-2xl duration-200 animate-in slide-in-from-right lg:max-w-4xl"
      >
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Chiết tính giá</p>
              <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-900">
                {costing.costing_no}
                <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-sm font-bold text-slate-600">
                  phiên bản {costing.version}
                </span>
              </h2>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {costing.customer_name ?? 'Chưa gắn khách hàng'}
                {costing.style_no ? ` · ${costing.style_no}` : ''}
                {' · '}
                {labelOf(ORDER_TYPE_LABEL, costing.order_type)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={costing.status === 'APPROVED' ? 'emerald' : costing.status === 'REJECTED' ? 'rose' : 'slate'}>
                {labelOf(COSTING_STATUS_LABEL, costing.status)}
              </Badge>
              <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={pending} onClick={() => decide('SUBMITTED')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50">
              <Send className="h-3.5 w-3.5" aria-hidden="true" /> Trình duyệt
            </button>
            <button type="button" disabled={pending} onClick={() => decide('APPROVED')} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Duyệt
            </button>
            <button type="button" disabled={pending} onClick={() => decide('REJECTED')} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-800 shadow-sm transition hover:bg-rose-100 disabled:opacity-50">
              <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Từ chối
            </button>
            <button type="button" disabled={pending} onClick={() => act(() => reviseCosting(costing.id), 'Đã tạo phiên bản mới')} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-800 shadow-sm transition hover:bg-blue-100 disabled:opacity-50">
              <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Làm bản mới
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
              <p className="text-sm font-medium">Đang tải khoản mục chi phí...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric label="Số lượng chiết tính" value={fmtNum(costing.quantity)} sub="sản phẩm" />
                <Metric
                  label="Giá thành một sản phẩm"
                  value={data.items.length === 0 ? '—' : fmtMoney(data.totalCost, costing.currency)}
                  sub={data.items.length === 0 ? 'chưa nhập khoản mục nào' : `cộng từ ${data.items.length} khoản mục`}
                />
                <Metric label="Giá báo khách" value={fmtMoney(costing.quoted_price, costing.currency)} />
                <Metric
                  label="Biên lợi nhuận"
                  value={data.margin === null ? '—' : `${fmtNum(data.margin)}%`}
                  sub={data.margin === null ? 'chưa nhập giá báo' : '(giá báo − giá thành) / giá báo'}
                  tone={marginTone}
                />
              </div>

              {/* ── Cơ cấu giá thành theo nhóm ──────────────────────────── */}
              <TabSection
                title="Cơ cấu giá thành theo nhóm chi phí"
                isEmpty={data.byCategory.length === 0}
                emptyTitle="Chưa có khoản mục nào"
              >
                <div className="space-y-2 p-4">
                  {data.byCategory
                    .slice()
                    .sort((a, b) => b.amount - a.amount)
                    .map((c) => {
                      const pct = data.totalCost > 0 ? (c.amount / data.totalCost) * 100 : 0;
                      return (
                        <div key={c.category}>
                          <div className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="font-semibold text-slate-700">
                              {labelOf(COST_CATEGORY_LABEL, c.category)}
                            </span>
                            <span className="tabular-nums text-slate-500">
                              {fmtMoney(c.amount, costing.currency)} · {pct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </TabSection>

              {/* ── Khoản mục chi tiết ──────────────────────────────────── */}
              <TabSection
                title="Khoản mục chi phí"
                error={data.error}
                isEmpty={data.items.length === 0}
                emptyTitle="Chưa nhập khoản mục nào"
                emptyHint="Nhập từng khoản: vải, phụ liệu, giá gia công, in thêu, giặt, đóng gói, vận chuyển..."
                action={
                  <button
                    type="button"
                    onClick={() => setItemOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Thêm khoản mục
                  </button>
                }
              >
                <DataTable head={['Nhóm', 'Khoản mục', 'Đơn vị', 'Định mức', 'Đơn giá', 'Thành tiền', '']} minWidth={800}>
                  {data.items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/70">
                      <td className={`${tdCls} text-xs`}>{labelOf(COST_CATEGORY_LABEL, it.category)}</td>
                      <td className={`${tdCls} font-medium text-slate-800`}>{it.item_name}</td>
                      <td className={tdCls}>{it.unit ?? '—'}</td>
                      <td className={`${tdCls} tabular-nums`}>{fmtNum(it.consumption)}</td>
                      <td className={`${tdCls} tabular-nums`}>{fmtNum(it.unit_price)}</td>
                      <td className={`${tdCls} tabular-nums font-semibold text-slate-900`}>
                        {fmtMoney(it.amount, costing.currency)}
                      </td>
                      <td className={tdCls}>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => act(() => deleteCostingItem(it.id, costing.id), 'Đã xoá khoản mục')}
                          aria-label={`Xoá khoản mục ${it.item_name}`}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </TabSection>

              {/* ── Lịch sử phiên bản ───────────────────────────────────── */}
              <TabSection
                title="Lịch sử phiên bản"
                isEmpty={data.versions.length === 0}
                emptyTitle="Chưa đọc được các phiên bản"
              >
                <DataTable head={['Phiên bản', 'Giá báo', 'Trạng thái', 'Ngày tạo', '']} minWidth={560}>
                  {data.versions.map((v) => (
                    <tr key={v.id} className={v.id === costing.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'}>
                      <td className={`${tdCls} font-bold tabular-nums text-slate-800`}>v{v.version}</td>
                      <td className={`${tdCls} tabular-nums`}>{fmtMoney(v.quoted_price, costing.currency)}</td>
                      <td className={tdCls}>
                        <Badge tone={v.status === 'APPROVED' ? 'emerald' : v.status === 'SUPERSEDED' ? 'slate' : 'amber'}>
                          {labelOf(COSTING_STATUS_LABEL, v.status)}
                        </Badge>
                      </td>
                      <td className={tdCls}>{fmtDate(v.created_at)}</td>
                      <td className={`${tdCls} text-xs text-blue-600`}>
                        {v.id === costing.id ? 'đang xem' : ''}
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </TabSection>
            </>
          )}
        </div>
      </div>

      <CostingItemDialog
        open={itemOpen}
        costingId={id}
        currency={costing.currency}
        onClose={() => setItemOpen(false)}
        onCreated={async () => {
          await load();
          await onChanged();
        }}
      />
    </div>
  );
}
