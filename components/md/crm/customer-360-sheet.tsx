'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Mail, Phone, Plus, Star, X } from 'lucide-react';

import { Badge } from '@/components/ui';
import { getCustomer360Client } from '@/app/(dashboard)/md/_actions/md4.client';
import type { Customer360Data } from '@/app/(dashboard)/md/_services/commercial.service';
import { TabSection, DataTable, tdCls, Metric, fmtDate, fmtNum, fmtMoney } from '../po/tab-kit';
import {
  PO_STATUS_LABEL, INQUIRY_STATUS_LABEL, COSTING_STATUS_LABEL, ORDER_TYPE_LABEL, labelOf,
} from '../po/labels';
import ContactFormDialog from './contact-form-dialog';
import type { CustomerRow } from '@/schemas/md';

// ============================================================================
// HỒ SƠ KHÁCH HÀNG 360°
//
// Bốn khối trong một màn hình: đầu mối liên hệ, lịch sử đơn, yêu cầu báo giá,
// các bản chiết tính. Merchandiser trước khi gọi cho khách cần thấy cùng lúc
// "đang nợ mình cái gì" và "mình đang nợ họ cái gì" — tách ra bốn trang thì
// không ai ghép lại nổi trong đầu.
// ============================================================================

const EMPTY: Customer360Data = { contacts: [], orders: [], inquiries: [], costings: [], errors: {} };

export default function Customer360Sheet({
  customer,
  onClose,
  onChanged,
}: {
  customer: CustomerRow | null;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const [data, setData] = useState<Customer360Data>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const customerId = customer?.id ?? null;

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    const d = await getCustomer360Client(customerId);
    setData(d);
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    if (!customerId) return;
    setData(EMPTY);
    void load();
  }, [customerId, load]);

  useEffect(() => {
    if (!customerId) return;
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
  }, [customerId, onClose]);

  if (!customer) return null;

  const totalQty = data.orders.reduce((s, o) => s + (Number(o.total_quantity) || 0), 0);
  const totalValue = data.orders.reduce(
    (s, o) => s + (o.unit_price ? Number(o.unit_price) * Number(o.total_quantity) : 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-900/50 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Hồ sơ khách hàng ${customer.name}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col bg-slate-50 shadow-2xl duration-200 animate-in slide-in-from-right lg:max-w-5xl"
      >
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Khách hàng 360°</p>
              <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-900">{customer.name}</h2>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {customer.customer_code}
                {customer.brand ? ` · ${customer.brand}` : ''}
                {customer.country ? ` · ${customer.country}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={customer.is_active ? 'emerald' : 'slate'}>
                {customer.is_active ? 'Đang giao dịch' : 'Ngừng giao dịch'}
              </Badge>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
              <p className="text-sm font-medium">Đang tải hồ sơ khách hàng...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric label="Tổng số đơn" value={fmtNum(data.orders.length)} />
                <Metric label="Tổng sản lượng" value={fmtNum(totalQty)} sub="sản phẩm" />
                <Metric
                  label="Giá trị đơn tính được"
                  value={totalValue > 0 ? fmtMoney(totalValue, customer.currency) : '—'}
                  sub={totalValue > 0 ? 'cộng từ các đơn có đơn giá' : 'chưa đơn nào có đơn giá'}
                />
                <Metric
                  label="Tỷ lệ giao đúng hạn"
                  value={customer.kpi_on_time_rate === null ? '—' : `${fmtNum(customer.kpi_on_time_rate)}%`}
                  sub={customer.kpi_on_time_rate === null ? 'chưa từng tính' : 'số liệu lưu sẵn'}
                  tone={customer.kpi_on_time_rate !== null && customer.kpi_on_time_rate >= 95 ? 'emerald' : 'amber'}
                />
              </div>

              {/* ── Đầu mối liên hệ ─────────────────────────────────────── */}
              <TabSection
                title="Đầu mối liên hệ"
                error={data.errors.contacts}
                isEmpty={data.contacts.length === 0}
                emptyTitle="Chưa khai người liên hệ"
                emptyHint="Khai đủ đầu mối mua hàng, kỹ thuật và chất lượng để gửi đúng người ngay từ lần đầu."
                action={
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Thêm liên hệ
                  </button>
                }
              >
                <ul className="divide-y divide-slate-50">
                  {data.contacts.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        {c.is_primary && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-label="Đầu mối chính" />}
                        {c.full_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {[c.job_title, c.department].filter(Boolean).join(' · ') || '—'}
                      </span>
                      {c.email && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          {c.phone}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </TabSection>

              {/* ── Lịch sử đơn hàng ────────────────────────────────────── */}
              <TabSection
                title="Lịch sử đơn hàng"
                error={data.errors.orders}
                isEmpty={data.orders.length === 0}
                emptyTitle="Khách hàng chưa có đơn nào"
              >
                <DataTable head={['Mã PO', 'Số lượng', 'Đơn giá', 'Ngày giao', 'Trạng thái']} minWidth={640}>
                  {data.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{o.po_number}</td>
                      <td className={`${tdCls} tabular-nums`}>{fmtNum(o.total_quantity)}</td>
                      <td className={`${tdCls} tabular-nums`}>{fmtMoney(o.unit_price, o.currency)}</td>
                      <td className={tdCls}>{fmtDate(o.delivery_date)}</td>
                      <td className={tdCls}>
                        <Badge tone="indigo">{labelOf(PO_STATUS_LABEL, o.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </TabSection>

              {/* ── Yêu cầu báo giá ─────────────────────────────────────── */}
              <TabSection
                title="Yêu cầu báo giá"
                error={data.errors.inquiries}
                isEmpty={data.inquiries.length === 0}
                emptyTitle="Chưa có yêu cầu báo giá nào"
              >
                <DataTable head={['Số yêu cầu', 'Sản phẩm', 'SL dự kiến', 'Giá mục tiêu', 'Hạn báo giá', 'Trạng thái']} minWidth={760}>
                  {data.inquiries.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50/70">
                      <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{i.inquiry_no}</td>
                      <td className={tdCls}>{i.product_name}</td>
                      <td className={`${tdCls} tabular-nums`}>{fmtNum(i.expected_qty)}</td>
                      <td className={`${tdCls} tabular-nums`}>{fmtMoney(i.target_price, i.currency)}</td>
                      <td className={tdCls}>{fmtDate(i.due_date)}</td>
                      <td className={tdCls}>
                        <Badge tone={i.status === 'WON' ? 'emerald' : i.status === 'LOST' ? 'rose' : 'amber'}>
                          {labelOf(INQUIRY_STATUS_LABEL, i.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </TabSection>

              {/* ── Bản chiết tính ──────────────────────────────────────── */}
              <TabSection
                title="Bản chiết tính giá"
                error={data.errors.costings}
                isEmpty={data.costings.length === 0}
                emptyTitle="Chưa có bản chiết tính nào"
              >
                <DataTable head={['Số chiết tính', 'Hình thức', 'Số lượng', 'Giá báo', 'Biên lợi nhuận', 'Trạng thái']} minWidth={760}>
                  {data.costings.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className={`${tdCls} font-mono font-semibold text-slate-800`}>
                        {c.costing_no}
                        <span className="ml-1 text-xs font-normal text-slate-400">v{c.version}</span>
                      </td>
                      <td className={tdCls}>{labelOf(ORDER_TYPE_LABEL, c.order_type)}</td>
                      <td className={`${tdCls} tabular-nums`}>{fmtNum(c.quantity)}</td>
                      <td className={`${tdCls} tabular-nums`}>{fmtMoney(c.quoted_price, c.currency)}</td>
                      <td className={`${tdCls} tabular-nums`}>
                        {c.margin_percent === null ? '—' : `${fmtNum(c.margin_percent)}%`}
                      </td>
                      <td className={tdCls}>
                        <Badge tone={c.status === 'APPROVED' ? 'emerald' : c.status === 'REJECTED' ? 'rose' : 'slate'}>
                          {labelOf(COSTING_STATUS_LABEL, c.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </TabSection>
            </>
          )}
        </div>
      </div>

      <ContactFormDialog
        open={contactOpen}
        customerId={customerId}
        customerName={customer.name}
        onClose={() => setContactOpen(false)}
        onCreated={async () => {
          await load();
          await onChanged();
        }}
      />
    </div>
  );
}
