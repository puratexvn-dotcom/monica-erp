'use client';

import { useState, useTransition } from 'react';
import { BadgeCheck, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, inputCls, btnPrimary, btnGhost, SAC_NHOM } from '@/components/ui';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { duyetChietTinh } from './_actions/costing-approval.actions';

// ============================================================================
// 🔴 HỘP THƯ DUYỆT GIÁ — BÀN LÀM VIỆC CỦA GIÁM ĐỐC
//
// ─── VÌ SAO MÀN HÌNH NÀY PHẢI TỒN TẠI ───────────────────────────────────
// UAT vòng đời 08/08/2026 đo được: **⛔ KHÔNG bản chiết tính nào duyệt được.**
// Luật nói *chỉ Giám đốc duyệt*, nhưng `setCostingStatus` nằm trong phân hệ
// `/md` — nơi vai `giamdoc` ⛔ không vào được. Người DUY NHẤT có quyền là
// người DUY NHẤT ⛔ không bấm được nút.
//
// 🔑 Sửa bằng cách đưa **hành động** về nơi người có quyền đang đứng, ⛔ không
// bằng cách nới quyền. Lý lẽ đầy đủ ở `costing-approval.actions.ts`.
//
// ⚠️ Tệp này ⛔ **không chứa literal màu hay cỡ chữ nào** — bánh cóc
// `TD-07`/`TD-10`. Sắc từ `SAC_NHOM`, thang chữ từ `TYPE`/`FONT_WEIGHT`.
//
// ⚠️ **NẰM Ở `app/…/giam-doc/`, ⛔ KHÔNG Ở `components/`.** Bản nháp đầu đặt ở
// `components/giam-doc/` và làm ĐỎ bài kiểm ③: `components/ → app/ ≤ 39 tệp`
// là bánh cóc chặn nợ mới (`AD-01`), mà tệp này buộc phải nhập `duyetChietTinh`
// từ `app/`. Đặt ở đây thì `app → app`, hợp lệ, và ⛔ không phải nới ngưỡng —
// nới ngưỡng là trả nợ bằng cách xoá sổ nợ. Cùng lý do đã đưa
// `po-master-dialog.tsx` và `bom-edit-dialog.tsx` về thư mục của phân hệ.
// ============================================================================

export interface DongChoDuyet {
  id: string;
  costing_no: string;
  version: number;
  quoted_price: number | null;
  currency: string | null;
  quantity: number | null;
  created_at: string;
}

export default function HopThuDuyetGia({
  rows, loi,
}: {
  rows: readonly DongChoDuyet[];
  loi: string | null;
}) {
  const [lyDo, setLyDo] = useState<Record<string, string>>({});
  const [dangChay, batDau] = useTransition();
  const [xong, setXong] = useState<Record<string, string>>({});

  const chay = (id: string, so: string, tt: 'APPROVED' | 'REJECTED' | 'REVISE') => {
    // Từ chối / làm lại BẮT BUỘC nêu lý do — hỏi ở giao diện trước khi bắn đi,
    // để người dùng ⛔ không phải chờ một vòng máy chủ mới biết mình thiếu.
    if (tt !== 'APPROVED' && !(lyDo[id] ?? '').trim()) {
      toast.error('Phải nêu lý do', { description: 'Từ chối hay yêu cầu làm lại đều cần lý do để MD biết sửa gì.' });
      return;
    }
    batDau(() => {
      void duyetChietTinh(id, tt, lyDo[id]).then((r) => {
        if (!r.ok) { toast.error('⛔ Không thực hiện được', { description: r.message, duration: 12_000 }); return; }
        toast.success(r.message);
        setXong((v) => ({ ...v, [id]: tt }));
      });
    });
  };

  // ⛔ Không có gì chờ duyệt ⇒ ⛔ không bày khối rỗng. Một khung trống nói
  // *"có gì đó thiếu"*, trong khi sự thật là *"⛔ không có việc gì để làm"*.
  if (!loi && rows.length === 0) return null;

  const sac = SAC_NHOM.action;

  return (
    <section className={`rounded-2xl border ${sac.vien} ${sac.nen} p-4`}>
      <h2 className={`flex items-center gap-2 ${sac.chu} ${TYPE.label} ${FONT_WEIGHT.bold}`}>
        <BadgeCheck className="h-4 w-4" aria-hidden="true" />
        Chờ Giám đốc duyệt giá
        <Badge tone="indigo">{rows.length}</Badge>
      </h2>
      <p className={`mt-1 ${sac.chu} ${TYPE.caption}`}>
        MD <strong>trình</strong>, Giám đốc <strong>duyệt</strong> — phân tách trách nhiệm.
        MD ⛔ không tự duyệt giá của chính mình.
      </p>

      {loi && (
        <p className={`mt-2 rounded-lg px-3 py-2 ${SAC_NHOM.risk.nen} ${SAC_NHOM.risk.chu} ${TYPE.caption}`}>
          {loi}
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {rows.map((r) => {
          const daXong = xong[r.id];
          return (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono text-slate-800 ${TYPE.label} ${FONT_WEIGHT.bold}`}>
                  {r.costing_no}
                </span>
                <Badge tone="slate">phiên bản {r.version}</Badge>
                <span className={`text-slate-600 ${TYPE.caption}`}>
                  {r.quoted_price === null
                    ? '⚪ chưa có giá chào'
                    : `${Number(r.quoted_price).toLocaleString('vi-VN')} ${r.currency ?? ''}`}
                  {r.quantity ? ` · ${r.quantity.toLocaleString('vi-VN')} sp` : ''}
                </span>
                {daXong && (
                  <Badge tone={daXong === 'APPROVED' ? 'emerald' : 'rose'}>
                    {daXong === 'APPROVED' ? 'đã duyệt' : daXong === 'REJECTED' ? 'đã từ chối' : 'yêu cầu làm lại'}
                  </Badge>
                )}
              </div>

              {!daXong && (
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <label className="min-w-0 flex-1">
                    <span className={`block text-slate-600 ${TYPE.caption}`}>
                      Lý do (bắt buộc khi từ chối / làm lại)
                    </span>
                    <input
                      className={inputCls}
                      value={lyDo[r.id] ?? ''}
                      onChange={(e) => setLyDo((v) => ({ ...v, [r.id]: e.target.value }))}
                      placeholder="Giá vải cao hơn mặt bằng 12% — đề nghị lấy báo giá NCC khác."
                      aria-label={`Lý do cho ${r.costing_no}`}
                    />
                  </label>
                  <button type="button" className={btnPrimary} disabled={dangChay}
                    onClick={() => chay(r.id, r.costing_no, 'APPROVED')}>
                    {dangChay
                      ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      : <BadgeCheck className="h-4 w-4" aria-hidden="true" />} Duyệt
                  </button>
                  <button type="button" className={btnGhost} disabled={dangChay}
                    onClick={() => chay(r.id, r.costing_no, 'REVISE')}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" /> Làm lại
                  </button>
                  <button type="button" className={btnGhost} disabled={dangChay}
                    onClick={() => chay(r.id, r.costing_no, 'REJECTED')}>
                    <XCircle className="h-4 w-4" aria-hidden="true" /> Từ chối
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
