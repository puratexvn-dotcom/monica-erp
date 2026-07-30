'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Palette, Ruler, Settings2, Layers, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui';
import { TabSection, DataTable, tdCls, Metric, fmtNum } from '../po/tab-kit';
import { MATERIAL_CATEGORY_LABEL, STYLE_STATUS_LABEL, labelOf } from '../po/labels';
import { getStyleDetailClient } from '@/app/(dashboard)/md/_actions/style360.client';
import { deleteStyleChild } from '@/app/(dashboard)/md/_actions/style.actions';
import type { StyleDetail } from '@/app/(dashboard)/md/_services/style.service';
import { sumOperationSam, type StyleRow } from '@/schemas/md';

// ============================================================================
// CHI TIẾT MÃ HÀNG — bảng màu · size · công đoạn · định mức NPL
//
// Nạp khi mở, không nạp sẵn cho cả bảng: một mã hàng có thể có 10 màu × 8 size
// × 20 dòng BOM; nạp sẵn 200 mã hàng là kéo về hàng chục nghìn dòng cho một
// lần mở trang.
// ============================================================================

type Section = 'colorways' | 'sizes' | 'operations' | 'bom';

const SECTIONS: Array<{ key: Section; label: string; icon: typeof Palette }> = [
  { key: 'colorways', label: 'Bảng màu', icon: Palette },
  { key: 'sizes', label: 'Bảng size', icon: Ruler },
  { key: 'operations', label: 'Công đoạn & SAM', icon: Settings2 },
  { key: 'bom', label: 'Định mức NPL', icon: Layers },
];

const TABLE_OF: Record<Section, 'style_colorways' | 'style_sizes' | 'style_operations' | 'style_bom'> = {
  colorways: 'style_colorways',
  sizes: 'style_sizes',
  operations: 'style_operations',
  bom: 'style_bom',
};

export default function StyleDetailSheet({
  style,
  onClose,
  onChanged,
}: {
  style: StyleRow | null;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const [section, setSection] = useState<Section>('colorways');
  const [data, setData] = useState<StyleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async (id: string) => {
    setLoading(true);
    const d = await getStyleDetailClient(id);
    setData(d);
    setLoading(false);
  };

  useEffect(() => {
    if (!style) return;
    let alive = true;
    setSection('colorways');
    setData(null);
    setLoading(true);

    void getStyleDetailClient(style.id).then((d) => {
      if (!alive) return;
      setData(d);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [style]);

  useEffect(() => {
    if (!style) return;
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
  }, [style, onClose]);

  if (!style) return null;

  async function remove(sec: Section, id: string, label: string) {
    if (!window.confirm(`Xoá "${label}"? Thao tác này không hoàn tác được.`)) return;
    setBusy(id);
    const res = await deleteStyleChild(TABLE_OF[sec], id);
    setBusy(null);
    if (res.ok) {
      toast.success('Đã xoá', { description: label });
      if (style) await load(style.id);
      await onChanged();
    } else {
      toast.error('Không xoá được', { description: res.message });
    }
  }

  const samFromOps = data ? sumOperationSam(data.operations) : 0;
  // Lệch giữa SAM khai ở mã hàng và tổng SAM công đoạn nghĩa là bảng công đoạn
  // chưa cập nhật, hoặc SAM khai sai — cả hai đều làm tính sai năng suất chuyền.
  const samMismatch =
    style.sam_minutes !== null && samFromOps > 0 && Math.abs(style.sam_minutes - samFromOps) > 0.01;

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết mã hàng ${style.style_no}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col bg-slate-50 shadow-2xl duration-200 animate-in slide-in-from-right lg:max-w-4xl"
      >
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Mã hàng</p>
              <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-900">
                {style.style_no}
              </h2>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {style.style_name}
                {style.customer_name ? ` · ${style.customer_name}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone="indigo">{labelOf(STYLE_STATUS_LABEL, style.status)}</Badge>
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

          <div role="tablist" className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-1">
            {SECTIONS.map((s) => {
              const on = s.key === section;
              const Icon = s.icon;
              const count = data
                ? s.key === 'colorways' ? data.colorways.length
                  : s.key === 'sizes' ? data.sizes.length
                  : s.key === 'operations' ? data.operations.length
                  : data.bom.length
                : 0;
              return (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSection(s.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    on ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {s.label}
                  {count > 0 && <span className="tabular-nums opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {loading || !data ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
              <p className="text-sm font-medium">Đang tải chi tiết mã hàng...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {section === 'colorways' && (
                <TabSection
                  title="Bảng màu"
                  error={data.errors.colorways}
                  isEmpty={data.colorways.length === 0}
                  emptyTitle="Chưa khai bảng màu"
                  emptyHint="Mỗi màu là một dòng, dùng lại cho mọi PO của mã hàng này."
                >
                  <DataTable head={['Mã màu', 'Tên màu', 'Pantone', 'Xem trước', '']} minWidth={560}>
                    {data.colorways.map((c) => (
                      <tr key={c.id} className="transition hover:bg-slate-50/70">
                        <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{c.color_code}</td>
                        <td className={tdCls}>{c.color_name}</td>
                        <td className={`${tdCls} font-mono text-xs`}>{c.pantone ?? '—'}</td>
                        <td className={tdCls}>
                          {c.hex_preview ? (
                            <span className="flex items-center gap-2">
                              <span
                                className="h-5 w-5 rounded border border-slate-200"
                                style={{ backgroundColor: c.hex_preview }}
                                aria-hidden="true"
                              />
                              <span className="font-mono text-xs text-slate-400">{c.hex_preview}</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className={tdCls}>
                          <DeleteBtn busy={busy === c.id} onClick={() => void remove('colorways', c.id, c.color_name)} />
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                  <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
                    Màu xem trước chỉ để nhận diện nhanh trên màn hình. Màu chuẩn để sản xuất luôn là mã
                    Pantone — mỗi màn hình hiển thị một khác.
                  </p>
                </TabSection>
              )}

              {section === 'sizes' && (
                <TabSection
                  title="Bảng size"
                  error={data.errors.sizes}
                  isEmpty={data.sizes.length === 0}
                  emptyTitle="Chưa khai bảng size"
                  emptyHint="Nhập cả dải một lần, ví dụ: S,M,L,XL — thứ tự gõ chính là thứ tự hiển thị."
                >
                  <DataTable head={['Thứ tự', 'Mã size', 'Nhóm size', '']} minWidth={480}>
                    {data.sizes.map((s) => (
                      <tr key={s.id} className="transition hover:bg-slate-50/70">
                        <td className={`${tdCls} tabular-nums text-slate-400`}>{s.sort_order}</td>
                        <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{s.size_code}</td>
                        <td className={`${tdCls} text-xs text-slate-500`}>{s.size_group ?? '—'}</td>
                        <td className={tdCls}>
                          <DeleteBtn busy={busy === s.id} onClick={() => void remove('sizes', s.id, s.size_code)} />
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                </TabSection>
              )}

              {section === 'operations' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Metric label="SAM khai ở mã hàng" value={style.sam_minutes ? `${fmtNum(style.sam_minutes)}′` : '—'} />
                    <Metric
                      label="Tổng SAM công đoạn"
                      value={`${fmtNum(samFromOps)}′`}
                      tone={samMismatch ? 'rose' : 'emerald'}
                      sub={samMismatch ? 'lệch so với SAM khai' : undefined}
                    />
                  </div>

                  {samMismatch && (
                    <p
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      SAM khai ở mã hàng ({fmtNum(style.sam_minutes)}′) lệch với tổng SAM các công đoạn (
                      {fmtNum(samFromOps)}′). Năng suất chuyền tính theo SAM nên lệch ở đây sẽ giao chỉ tiêu
                      sai cho tổ may.
                    </p>
                  )}

                  <TabSection
                    title="Công đoạn"
                    error={data.errors.operations}
                    isEmpty={data.operations.length === 0}
                    emptyTitle="Chưa khai công đoạn"
                    emptyHint="Bảng công đoạn dùng để cân chuyền và tính năng suất mục tiêu."
                  >
                    <DataTable head={['#', 'Công đoạn', 'Loại máy', 'SAM (phút)', '']} minWidth={560}>
                      {data.operations.map((o) => (
                        <tr key={o.id} className="transition hover:bg-slate-50/70">
                          <td className={`${tdCls} tabular-nums text-slate-400`}>{o.seq_no}</td>
                          <td className={`${tdCls} font-medium text-slate-800`}>{o.operation}</td>
                          <td className={`${tdCls} text-xs text-slate-500`}>{o.machine_type ?? '—'}</td>
                          <td className={`${tdCls} tabular-nums font-semibold`}>{fmtNum(o.sam_minutes)}</td>
                          <td className={tdCls}>
                            <DeleteBtn busy={busy === o.id} onClick={() => void remove('operations', o.id, o.operation)} />
                          </td>
                        </tr>
                      ))}
                    </DataTable>
                  </TabSection>
                </>
              )}

              {section === 'bom' && (
                <TabSection
                  title="Định mức nguyên phụ liệu"
                  error={data.errors.bom}
                  isEmpty={data.bom.length === 0}
                  emptyTitle="Chưa khai định mức"
                  emptyHint="Khai một lần ở đây, mọi PO dùng mã hàng này đều tự tính ra nhu cầu NPL."
                >
                  <DataTable
                    head={['Nguyên phụ liệu', 'Loại', 'Màu', 'Định mức/sp', 'Hao hụt', 'Đã tính hao hụt', '']}
                    minWidth={800}
                  >
                    {data.bom.map((b) => (
                      <tr key={b.id} className="transition hover:bg-slate-50/70">
                        <td className={`${tdCls} font-medium text-slate-800`}>{b.item_name}</td>
                        <td className={`${tdCls} text-xs text-slate-500`}>
                          {labelOf(MATERIAL_CATEGORY_LABEL, b.category)}
                        </td>
                        <td className={`${tdCls} text-xs`}>{b.color_code ?? 'Mọi màu'}</td>
                        <td className={`${tdCls} tabular-nums`}>
                          {fmtNum(b.consumption_per_pcs)} {b.unit}
                        </td>
                        <td className={`${tdCls} tabular-nums text-slate-500`}>{b.wastage_percent}%</td>
                        <td className={`${tdCls} tabular-nums font-semibold text-slate-900`}>
                          {fmtNum(b.net_consumption)} {b.unit}
                        </td>
                        <td className={tdCls}>
                          <DeleteBtn busy={busy === b.id} onClick={() => void remove('bom', b.id, b.item_name)} />
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                  <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
                    Cột “đã tính hao hụt” do cơ sở dữ liệu tự tính = định mức × (1 + hao hụt%). Không nhập
                    tay để mọi màn hình dùng chung một công thức.
                  </p>
                </TabSection>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteBtn({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title="Xoá"
      className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:text-rose-600 disabled:opacity-40"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}
