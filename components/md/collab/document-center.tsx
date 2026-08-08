'use client';

import { memo, useMemo, useState, useTransition } from 'react';
import { Download, FileText, Search, Trash2, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, inputCls, Modal, Field, btnGhost, btnPrimary } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { DataTable, tdCls, Metric, fmtDate, fmtNum } from '../po/tab-kit';
import { DOC_TYPE_LABEL, DOC_TYPES, ENTITY_TYPE_LABEL, labelOf } from '../po/labels';
import { deleteDocument } from '@/app/(dashboard)/md/_actions/collaboration.actions';
// 🔴 BUG-5 · Board 07/08/2026 — Update cho Tech Pack.
import { updateTechPack } from '@/app/(dashboard)/md/_actions/revisions.actions';
import { layUrlBangChung } from '@/app/actions/evidence-url-action';
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
  /** Tệp đang xin URL — để nút hiện vòng quay và ⛔ không bấm được hai lần. */
  const [dangMo, setDangMo] = useState<string | null>(null);

  /** Mở một tài liệu qua **Signed URL**.
   *
   *  ⚠️ ⛔ KHÔNG dựng URL ở client: đường dẫn trong kho ⛔ không còn mở trực
   *  tiếp được sau `057`. Máy chủ ký sau khi kiểm quyền, và URL sống 300 giây. */
  async function moTep(d: DocumentCenterRow) {
    setDangMo(d.id);
    try {
      const r = await layUrlBangChung(d.entity_type, d.entity_id, d.storage_path);
      if (!r.ok || !r.url) { toast.error('Không mở được tài liệu', { description: r.message }); return; }
      window.open(r.url, '_blank', 'noreferrer');
    } finally {
      setDangMo(null);
    }
  }

  const [type, setType] = useState('');
  const [pending, startTransition] = useTransition();
  /** 🔴 `BUG-5` — tài liệu đang sửa. Giữ **bản nháp tại chỗ** thay vì gọi
   *  `docDeSua`: hai ô duy nhất sửa được ở đây *(`title`, `doc_type`)* **đã có
   *  đủ** trong dòng bảng, nên ⛔ không có nguy cơ ghi `null` đè lên ô ⛔ không
   *  hiện — thứ khiến bốn hộp thoại kia buộc phải đọc lại nguyên dòng. */
  const [sua, setSua] = useState<{ id: string; title: string; doc_type: string } | null>(null);

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

  // 🔴 BUG-5 · Board 07/08/2026: *"⛔ Không Delete vật lý. Chỉ Archive."*
  //
  // ⚠️ `deleteDocument` nay **TỪ CHỐI** và trả về câu giải thích — `md_documents`
  // ⛔ không có cột lưu trữ nào để thay thế xoá cứng *(cần migration, `ADR-027`,
  // đang bị `SECURITY FREEZE` chặn)*. Nút giữ lại để câu trả lời đến được với
  // người dùng thay vì biến mất cùng nút.
  const remove = (r: DocumentCenterRow) => {
    if (!window.confirm(
      `Gỡ tài liệu "${r.title}"?\n\n`
      + '⚠️ Board đã CẤM xoá vật lý chứng từ (07/08/2026). Hệ thống sẽ từ chối '
      + 'và giải thích lối đi thay thế.',
    )) return;
    startTransition(async () => {
      const res = await deleteDocument(r.id);
      if (res.ok) {
        toast.success('Đã gỡ tài liệu', { description: res.message });
        await onRefresh();
      } else {
        toast.error('⛔ Không gỡ được', { description: res.message, duration: 12_000 });
      }
    });
  };

  /** 🔴 `BUG-5` — sửa tên và phân loại tài liệu.
   *
   *  🔑 Đây là **lối đi thay cho xoá**: phần lớn lý do người ta xoá một tài
   *  liệu là *"đặt sai tên"* hoặc *"chọn nhầm loại"* — hai thứ nay sửa được
   *  tại chỗ, ⛔ không phải xoá rồi tải lên lại. */
  const luu = () => {
    if (!sua) return;
    startTransition(async () => {
      const res = await updateTechPack(sua.id, { title: sua.title, doc_type: sua.doc_type });
      if (!res.ok) { toast.error('Không lưu được', { description: res.message }); return; }
      toast.success('Đã lưu', { description: res.message });
      setSua(null);
      await onRefresh();
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
                    {/* 🔴 **ĐỔI TỪ URL CÔNG KHAI SANG SIGNED URL — `057`.**
                        Kho bằng chứng nay **riêng tư**, nên thẻ `<a href=
                        {publicUrl(...)}>` cũ **⛔ không mở được nữa** *(403)*.
                        Đây là hệ quả trực tiếp của migration, và nếu ⛔ không
                        sửa ở đây thì mọi nút *"Mở tài liệu"* trong Trung tâm
                        tài liệu sẽ hỏng lặng lẽ.

                        🔑 Đường mới đi qua `layUrlBangChung`, nơi máy chủ hỏi
                        **hai** câu trước khi ký: tệp có thuộc bản ghi ⛔, và
                        người này có đọc được bản ghi đó ⛔. URL sống 300 giây. */}
                    <button
                      type="button"
                      disabled={dangMo === d.id}
                      onClick={() => void moTep(d)}
                      aria-label={`Mở tài liệu ${d.title}`}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
                    >
                      {dangMo === d.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Download className="h-4 w-4" />}
                    </button>
                    {/* 🔴 BUG-5 — sửa tên / phân loại. Lối đi THAY CHO xoá. */}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setSua({ id: d.id, title: d.title, doc_type: d.doc_type })}
                      aria-label={`Sửa tài liệu ${d.title}`}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
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

      {/* 🔴 BUG-5 — hộp thoại Sửa tài liệu. Hai ô, ⛔ không hơn: đổi **tệp** là
          một lượt tải lên mới (`saveDocument` tăng `version`), ⛔ không phải
          việc của một ô nhập trong bảng. */}
      <Modal open={sua !== null} title="Sửa thông tin tài liệu" onClose={() => setSua(null)}>
        {sua && (
          <div className="space-y-3">
            <Field label="Tên tài liệu">
              <input
                className={inputCls}
                value={sua.title}
                onChange={(e) => setSua({ ...sua, title: e.target.value })}
              />
            </Field>
            <Field label="Loại tài liệu">
              <select
                className={inputCls}
                value={sua.doc_type}
                onChange={(e) => setSua({ ...sua, doc_type: e.target.value })}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </Field>
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-800">
              Đổi <strong>tệp</strong> thì tải lên bản mới từ màn hình chi tiết mã hàng / đơn hàng —
              hệ thống tự tăng số phiên bản và <strong>giữ nguyên</strong> bản cũ để tra lại.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setSua(null)} disabled={pending}>
                Hủy
              </button>
              <button type="button" className={btnPrimary} onClick={luu} disabled={pending}>
                {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// Bảng dữ liệu nặng: chỉ vẽ lại khi mảng dòng hoặc lỗi thật sự đổi.
// Trang cha giữ mười ba tab nên mỗi lần đổi tab là một lượt vẽ; không bọc
// memo thì bảng đang ẩn cũng bị dựng lại theo.
export default memo(DocumentCenter);
