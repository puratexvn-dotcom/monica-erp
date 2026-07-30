'use client';

import { memo, useMemo, useState, useTransition } from 'react';
import { Download, FileText, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, inputCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { DataTable, tdCls, Metric, fmtDate, fmtNum } from '../po/tab-kit';
import { DOC_TYPE_LABEL, DOC_TYPES, ENTITY_TYPE_LABEL, labelOf } from '../po/labels';
import { deleteDocument } from '@/app/(dashboard)/md/_actions/collaboration.actions';
import { publicUrl } from '@/lib/storage';
import type { DocumentCenterRow } from '@/app/(dashboard)/md/_services/collaboration.service';

// ============================================================================
// TRUNG TÂM TÀI LIỆU
//
// Gom mọi tài liệu của phân hệ về một bảng, lọc theo loại. Tài liệu kỹ thuật,
// sơ đồ cắt, rập và bảng đóng gói hiện đang nằm rải rác trong hộp thư — tìm
// lại bản mới nhất là việc mất nhiều thời gian nhất mỗi lần khách đổi chi tiết.
//
// Cột "Phiên bản" quan trọng hơn cả tên tệp: hai bản tech pack cùng tên nhưng
// khác phiên bản mà may nhầm bản cũ là cắt lại cả lô.
// ============================================================================

function fmtSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DocumentCenter({
  rows,
  error,
  onRefresh,
}: {
  rows: DocumentCenterRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [pending, startTransition] = useTransition();

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (type && r.doc_type !== type) return false;
      if (!kw) return true;
      return [r.title, r.uploaded_by_name, r.storage_path]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw));
    });
  }, [rows, q, type]);

  const byType = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.doc_type, (m.get(r.doc_type) ?? 0) + 1);
    return m;
  }, [rows]);

  const remove = (r: DocumentCenterRow) => {
    if (!window.confirm(`Gỡ tài liệu "${r.title}" khỏi danh sách? Tệp gốc trong kho lưu trữ vẫn còn.`)) return;
    startTransition(async () => {
      const res = await deleteDocument(r.id);
      if (res.ok) {
        toast.success('Đã gỡ tài liệu', { description: res.message });
        await onRefresh();
      } else {
        toast.error('Không gỡ được', { description: res.message });
      }
    });
  };

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tổng tài liệu" value={fmtNum(rows.length)} />
        <Metric label="Tài liệu kỹ thuật" value={fmtNum(byType.get('TECH_PACK') ?? 0)} tone="indigo" />
        <Metric label="Sơ đồ cắt & rập" value={fmtNum((byType.get('MARKER') ?? 0) + (byType.get('PATTERN') ?? 0))} />
        <Metric label="Hợp đồng & hoá đơn" value={fmtNum((byType.get('CONTRACT') ?? 0) + (byType.get('INVOICE') ?? 0))} />
      </div>

      <div className="mb-3 flex flex-wrap gap-3">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên tài liệu, người tải lên..."
            aria-label="Tìm tài liệu"
            className={`${inputCls} pl-9`}
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Lọc theo loại tài liệu"
          className={`${inputCls} sm:w-56`}
        >
          <option value="">Mọi loại tài liệu</option>
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <NoData
          title={rows.length === 0 ? 'Chưa có tài liệu nào' : 'Không có tài liệu khớp bộ lọc'}
          sub={
            rows.length === 0
              ? 'Tài liệu được tải lên từ màn hình chi tiết của mã hàng hoặc đơn hàng, rồi hiện tập trung ở đây.'
              : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataTable head={['Tên tài liệu', 'Loại', 'Gắn với', 'Phiên bản', 'Dung lượng', 'Người tải', 'Ngày tải', '']} minWidth={1060}>
            {shown.map((d) => (
              <tr key={d.id} className="transition hover:bg-slate-50/70">
                <td className={tdCls}>
                  <span className="flex items-center gap-2 font-medium text-slate-800">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="truncate">{d.title}</span>
                  </span>
                </td>
                <td className={`${tdCls} text-xs`}>{labelOf(DOC_TYPE_LABEL, d.doc_type)}</td>
                <td className={`${tdCls} text-xs`}>{labelOf(ENTITY_TYPE_LABEL, d.entity_type)}</td>
                <td className={tdCls}>
                  <Badge tone="slate">v{d.version}</Badge>
                </td>
                <td className={`${tdCls} tabular-nums text-xs`}>{fmtSize(d.file_size)}</td>
                <td className={`${tdCls} text-xs`}>{d.uploaded_by_name ?? '—'}</td>
                <td className={tdCls}>{fmtDate(d.created_at)}</td>
                <td className={tdCls}>
                  <div className="flex items-center gap-1">
                    {/* Thiếu biến môi trường Supabase thì publicUrl trả null —
                        hiện nút mờ chứ không tạo thẻ <a> trỏ vào URL sai */}
                    {publicUrl(d.storage_path) ? (
                      <a
                        href={publicUrl(d.storage_path) as string}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Mở tài liệu ${d.title}`}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    ) : (
                      <span
                        title="Chưa cấu hình địa chỉ kho lưu trữ nên không mở được tệp"
                        className="rounded-lg p-1.5 text-slate-300"
                      >
                        <Download className="h-4 w-4" />
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => remove(d)}
                      aria-label={`Gỡ tài liệu ${d.title}`}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
    </>
  );
}

// Bảng dữ liệu nặng: chỉ vẽ lại khi mảng dòng hoặc lỗi thật sự đổi.
// Trang cha giữ mười ba tab nên mỗi lần đổi tab là một lượt vẽ; không bọc
// memo thì bảng đang ẩn cũng bị dựng lại theo.
export default memo(DocumentCenter);
