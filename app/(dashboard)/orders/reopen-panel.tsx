'use client';

import { useMemo, useState, useTransition } from 'react';
import { Unlock, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, inputCls, btnPrimary, btnGhost, SAC_NHOM } from '@/components/ui';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { reopenOrder } from './actions';
import { PO_STATUS_LABEL, type PoRow } from './po-schema';
import { duocMoLai, PO_SAU_KHI_MO_LAI, PO_KHOA, PO_KHOA_TUYET_DOI } from '@/lib/mos/md/document-lock';
import type { Role } from '@/lib/rbac';

// ============================================================================
// 🔴 RE-OPEN WORKFLOW — **BOARD DECISION 07/08/2026**, mục *"Bổ sung thêm ②"*
//
//   > *"Completed chỉ được Re-open bởi **CEO hoặc Director**."*
//
// ─── ⚠️ VÌ SAO MÀN HÌNH NÀY Ở `/orders`, ⛔ KHÔNG Ở `/md` ────────────────
// `MODULE_ACCESS.giamdoc = ['/giam-doc', '/orders', '/subcon']` — **⛔ KHÔNG có
// `/md`**. Giám đốc **⛔ không mở được** Workspace Merchandising; `guard()` của
// phân hệ đó bác họ ngay.
//
// 🔑 Nên nút Re-open đặt ở `/md` sẽ là một điều khoản mà **đúng người được
// Board trao quyền lại ⛔ không với tới được** — trông như đã thi hành, đo ra
// là chưa. Đây là loại sai **im lặng**: mã có, kiểm thử của lập trình viên
// *(chạy bằng vai `md`)* ⛔ không bao giờ chạm tới nó.
//
// ⚠️ **⛔ KHÔNG mở rộng `MODULE_ACCESS` để giải bài này.** Mở `/md` cho
// `giamdoc` là trao thêm **cả phân hệ**, ⛔ không chỉ một nút — đó là quyết
// định phân quyền, thuộc Board.
//
// ─── 🔑 VÌ SAO LÀ MỘT KHU RIÊNG, ⛔ KHÔNG PHẢI MỘT CỘT TRONG BẢNG ────────
// Mở lại chứng từ đã đóng là việc **hiếm và nặng** — vài lần một quý. Một cột
// trong bảng 500 dòng biến nó thành thao tác **thường ngày**, đặt ngay cạnh
// những nút bấm hàng chục lần mỗi ngày. Khu riêng, phải chọn đơn, phải gõ lý
// do: ba bước cho một việc đáng ba bước.
// ============================================================================

/** Trạng thái coi là **đã đóng** — lấy thẳng từ bộ luật thuần, ⛔ không chép
 *  lại danh sách. Chép lại là mở đường cho giao diện và luật lệch nhau. */
const DA_DONG: ReadonlySet<string> = new Set([...PO_KHOA_TUYET_DOI, ...PO_KHOA]);

export default function ReopenPanel({
  rows, role, onDone,
}: {
  rows: PoRow[];
  role: Role | null;
  onDone: () => void | Promise<void>;
}) {
  const [chon, setChon] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [dangChay, batDau] = useTransition();

  const daDong = useMemo(
    () => rows.filter((r) => DA_DONG.has(String(r.status ?? '').toUpperCase())),
    [rows],
  );

  // 🔴 Vai ⛔ không được mở lại ⇒ **⛔ không bày gì cả**. Bày một khu bấm vào
  // là bị từ chối thì tệ hơn ⛔ không bày: nó nói rằng việc đó *có thể* làm
  // được, rồi bắt người dùng tự phát hiện là ⛔ không.
  //
  // ⚠️ Đây là **phép lịch sự với giao diện**, ⛔ KHÔNG phải chốt quyền.
  // `reopenOrder()` tự kiểm vai ở máy chủ — Server Action là endpoint gọi
  // thẳng được *(CLAUDE.md §2.1)*.
  if (!duocMoLai(role)) return null;

  // ⛔ Không có đơn nào đã đóng ⇒ ⛔ không bày khu trống. Một khối rỗng nói
  // *"có gì đó thiếu"*, trong khi sự thật là *"⛔ không có việc gì để làm"*.
  if (daDong.length === 0) return null;

  const moLai = () => {
    if (!chon) { toast.error('Chọn đơn hàng cần mở lại.'); return; }
    const don = daDong.find((d) => d.id === chon);
    if (!window.confirm(
      `Mở lại đơn "${don?.po_number ?? chon}"?\n\n`
      + `· Trạng thái sẽ chuyển về "${PO_SAU_KHI_MO_LAI}" (Đã duyệt), ⛔ KHÔNG về Nháp.\n`
      + '· Lý do và người thao tác được ghi vĩnh viễn vào Nhật ký — sổ chỉ-ghi-thêm.\n'
      + '· Đây là thao tác thẩm quyền, ⛔ không phải một lượt sửa thường.',
    )) return;

    batDau(() => {
      void reopenOrder(chon, lyDo).then(async (r) => {
        if (!r.ok) { toast.error('Không mở lại được', { description: r.message }); return; }
        toast.success(r.message);
        setChon('');
        setLyDo('');
        await onDone();
      });
    });
  };

  // ⚠️ **⛔ KHÔNG một literal màu hay cỡ chữ nào trong tệp này.** `arch.test`
  // ⑨/⑩ là **bánh cóc**: tệp MỚI viết `bg-indigo-50` hay `text-xs` thẳng thì
  // HỎNG, và thêm tên vào sổ nợ là việc **cần Board phê duyệt**. Bản nháp đầu
  // của tệp này đã đỏ đúng ở đó — sắc lấy từ `SAC_NHOM`, thang chữ từ `TYPE`.
  const sac = SAC_NHOM.action;

  return (
    <section className={`mt-6 rounded-2xl border ${sac.vien} ${sac.nen} p-4`}>
      <h2 className={`flex items-center gap-2 ${sac.chu} ${TYPE.label} ${FONT_WEIGHT.bold}`}>
        <Unlock className="h-4 w-4" aria-hidden="true" />
        Mở lại chứng từ đã đóng
        <Badge tone="indigo">chỉ Giám đốc</Badge>
      </h2>
      <p className={`mt-1 ${sac.chu} ${TYPE.caption}`}>
        Đơn <strong>Hoàn thành</strong> · <strong>Đã xuất hàng</strong> · <strong>Đã huỷ</strong> bị khoá —
        ⛔ không sửa, ⛔ không xoá. Mở lại là thao tác thẩm quyền và <strong>bắt buộc nêu lý do</strong>.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
        <label className="block">
          <span className={`${sac.chu} ${TYPE.caption} ${FONT_WEIGHT.semibold}`}>
            Đơn hàng đã đóng ({daDong.length})
          </span>
          <select
            value={chon}
            onChange={(e) => setChon(e.target.value)}
            className={inputCls}
            aria-label="Chọn đơn hàng cần mở lại"
          >
            <option value="">— Chọn đơn —</option>
            {daDong.map((d) => (
              <option key={d.id} value={d.id}>
                {d.po_number} · {PO_STATUS_LABEL[String(d.status ?? '').toUpperCase() as keyof typeof PO_STATUS_LABEL] ?? d.status}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={`${sac.chu} ${TYPE.caption} ${FONT_WEIGHT.semibold}`}>
            Lý do mở lại (bắt buộc, ≥ 10 ký tự)
          </span>
          <input
            value={lyDo}
            onChange={(e) => setLyDo(e.target.value)}
            placeholder="Khách bổ sung 500 sp cùng mã, đã có mail xác nhận ngày 07/08."
            className={inputCls}
            aria-label="Lý do mở lại đơn hàng"
          />
        </label>

        <div className="flex items-end gap-2">
          <button type="button" className={btnPrimary} disabled={dangChay} onClick={moLai}>
            {dangChay
              ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang mở...</>
              : <><Unlock className="h-4 w-4" aria-hidden="true" /> Mở lại</>}
          </button>
          {(chon || lyDo) && (
            <button
              type="button"
              className={btnGhost}
              onClick={() => { setChon(''); setLyDo(''); }}
              disabled={dangChay}
            >
              Huỷ
            </button>
          )}
        </div>
      </div>

      <p className={`mt-2 flex items-center gap-1.5 ${sac.chu} ${TYPE.caption}`}>
        <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
        Mọi lượt mở lại ghi vào Nhật ký với hành động <strong>Duyệt</strong> — lọc theo đó là thấy đủ lịch sử.
      </p>
    </section>
  );
}
