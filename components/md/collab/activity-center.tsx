'use client';

import { memo, useMemo, useState } from 'react';
import { History, Search, FileClock } from 'lucide-react';

import { Badge, inputCls } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import { Metric, fmtNum } from '../po/tab-kit';
import { AUDIT_ACTION_LABEL, ENTITY_TYPE_LABEL, ROLE_LABEL_SAFE, labelOf } from '../po/labels';
import { docPhienBan } from '@/lib/mos/md/version-log';
import type { ActivityRow } from '@/schemas/md';

// ============================================================================
// NHẬT KÝ THAO TÁC
//
// Ghi lại AI làm gì, LÚC NÀO, ĐỔI TỪ GÌ SANG GÌ. Khi số lượng một đơn tự nhiên
// khác với hợp đồng, đây là chỗ duy nhất trả lời được câu "ai sửa?".
//
// Chỉ lưu phần THAY ĐỔI chứ không chép nguyên bản ghi: chép nguyên mỗi lần sửa
// một ô thì nhật ký phình rất nhanh mà tra lại vẫn phải tự so từng cột.
// ============================================================================

/** Hiện giờ theo múi giờ Việt Nam. Nhật ký mà lệch múi giờ thì tra theo ca
 *  làm việc sẽ ra sai người. */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
}

/** Giá trị trong nhật ký có thể là chuỗi, số, null hoặc object JSON */
function fmtVal(v: unknown): string {
  if (v === null || v === undefined || v === '') return '(trống)';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function toneOf(action: string) {
  if (action === 'DELETE' || action === 'REJECT') return 'rose' as const;
  if (action === 'CREATE') return 'emerald' as const;
  if (action === 'APPROVE') return 'indigo' as const;
  return 'amber' as const;
}

function ActivityCenter({
  rows,
  error,
  onRefresh,
}: {
  rows: ActivityRow[];
  error: string | null;
  onRefresh: () => void | Promise<void>;
}) {
  const [q, setQ] = useState('');
  /** 🔴 Dòng nhật ký đang mở **ảnh chụp nguyên bản ghi**. Một ô nhớ cho cả
   *  danh sách — mở dòng này là đóng dòng kia, ⛔ không để mười khối JSON cùng
   *  bung ra. */
  const [anhChup, setAnhChup] = useState<number | null>(null);

  const stats = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.action, (m.get(r.action) ?? 0) + 1);
    return m;
  }, [rows]);

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.actor_name, r.actor_role, r.entity_type, r.action, JSON.stringify(r.changes)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw)),
    );
  }, [rows, q]);

  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Số dòng nhật ký" value={fmtNum(rows.length)} sub="300 dòng gần nhất" />
        <Metric label="Tạo mới" value={fmtNum(stats.get('CREATE') ?? 0)} tone="emerald" />
        <Metric label="Cập nhật" value={fmtNum(stats.get('UPDATE') ?? 0)} tone="amber" />
        <Metric
          label="Duyệt / Từ chối"
          value={fmtNum((stats.get('APPROVE') ?? 0) + (stats.get('REJECT') ?? 0))}
          tone="indigo"
        />
      </div>

      <div className="relative mb-3 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm người thao tác, đối tượng, nội dung..."
          aria-label="Tìm trong nhật ký"
          className={`${inputCls} pl-9`}
        />
      </div>

      {shown.length === 0 ? (
        <NoData
          title={rows.length === 0 ? 'Nhật ký còn trống' : 'Không có dòng nào khớp từ khoá'}
          sub={
            rows.length === 0
              ? 'Nhật ký ghi tự động khi có thao tác tạo, sửa, duyệt hoặc từ chối trong phân hệ này.'
              : undefined
          }
        />
      ) : (
        <ol className="space-y-2">
          {shown.map((a) => {
            // 🔴 Board 07/08/2026 *"Bổ sung thêm ①"* — **Version History**.
            // `docPhienBan` tách khoá kỹ thuật (`__phien_ban` · `__anh_chup`)
            // ra khỏi danh sách ô-đã-đổi, và **chịu được dòng nhật ký ĐỜI CŨ**
            // (⛔ không có khoá nào). Nhật ký là sổ chỉ-ghi-thêm — ⛔ không có
            // đường nâng cấp dòng cũ, nên phép đọc phải nhận cả hai đời.
            const pb = docPhienBan(a.changes);
            const moRong = anhChup === a.id;
            return (
              <li key={a.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <History className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <Badge tone={toneOf(a.action)}>{labelOf(AUDIT_ACTION_LABEL, a.action)}</Badge>
                  <Badge tone="slate">{labelOf(ENTITY_TYPE_LABEL, a.entity_type)}</Badge>
                  {/* Số phiên bản chỉ hiện khi dòng THẬT SỰ có — ⛔ không bịa
                      "v1" cho dòng đời cũ, vì phiên bản ấy ⛔ chưa từng được ghi. */}
                  {pb.so !== null && <Badge tone="indigo">phiên bản {pb.so}</Badge>}
                  <span className="font-semibold text-slate-700">{a.actor_name ?? 'Không rõ người thao tác'}</span>
                  {a.actor_role && <span className="text-slate-500">({ROLE_LABEL_SAFE(a.actor_role)})</span>}
                  <span className="ml-auto tabular-nums text-slate-400">{fmtTime(a.created_at)}</span>
                </div>

                {pb.o.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {pb.o.map(([field, ch]) => (
                      <li key={field} className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-mono font-semibold text-slate-600">{field}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 line-through">
                          {fmtVal(ch.from)}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800">
                          {fmtVal(ch.to)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-400">Không ghi chi tiết thay đổi cho thao tác này.</p>
                )}

                {/* ═══ 🔴 ẢNH CHỤP NGUYÊN BẢN GHI — Board: *"⛔ Không overwrite
                    dữ liệu."* ══════════════════════════════════════════════
                    🔑 Danh sách ô-đã-đổi ở trên trả lời *"cái gì đổi"*. Chỉ
                    **ảnh chụp** mới trả lời *"lúc 14:20 ngày 3/8, chứng từ này
                    trông như thế nào?"* — câu người ta hỏi khi tranh chấp với
                    khách.
                    ⚠️ GẤP LẠI mặc định: mở sẵn thì mỗi dòng nhật ký cao vài
                    trăm pixel và tab Nhật ký thành ⛔ không đọc được. */}
                {(pb.truoc || pb.sau) && (
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => setAnhChup(moRong ? null : a.id)}
                      aria-expanded={moRong}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 transition hover:text-blue-800"
                    >
                      <FileClock className="h-3.5 w-3.5" aria-hidden="true" />
                      {moRong ? 'Ẩn bản ghi đầy đủ' : 'Xem bản ghi đầy đủ trước ⟷ sau'}
                    </button>

                    {moRong && (
                      <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
                        <div>
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            Trước
                          </p>
                          <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-600">
                            {pb.truoc ? JSON.stringify(pb.truoc, null, 2) : '(chưa có — đây là bản ghi mới)'}
                          </pre>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                            Sau
                          </p>
                          <pre className="max-h-64 overflow-auto rounded-lg bg-emerald-50/60 p-2 text-[11px] leading-relaxed text-emerald-900">
                            {pb.sau ? JSON.stringify(pb.sau, null, 2) : '(không còn bản mới)'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

// Bảng dữ liệu nặng: chỉ vẽ lại khi mảng dòng hoặc lỗi thật sự đổi.
// Trang cha giữ mười ba tab nên mỗi lần đổi tab là một lượt vẽ; không bọc
// memo thì bảng đang ẩn cũng bị dựng lại theo.
export default memo(ActivityCenter);
