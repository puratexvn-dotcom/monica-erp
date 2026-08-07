'use client';

// ============================================================================
// SINH LỊCH T&A CHO ĐƠN CŨ — lối vào một-lần
//
// ─── 🔴 VÌ SAO KHỐI NÀY TỒN TẠI ─────────────────────────────────────────
// `seedMilestones()` **chỉ chạy lúc TẠO PO**. 14 đơn đang chạy được tạo
// **trước** khi có đoạn mã đó ⇒ ⛔ không đơn nào có mốc ⇒ **hộp thư việc rỗng
// vĩnh viễn** với toàn bộ sổ đơn hiện tại.
//
// 🔑 MD mở máy thấy *"⛔ không có việc nào"* trong khi có **6 đơn đã quá hạn
// giao**. Màn hình **nói dối theo kiểu trấn an** — nguy hơn báo động sai: báo
// động sai thì người ta đi kiểm, trấn an sai thì ⛔ không ai đi đâu cả.
//
// ⚠️ CHỈ hiện khi hộp thư **thật sự rỗng**. Hiện thường trực thì nó thành một
// nút *"bấm cho vui"* nằm mãi trên màn hình — và nút như vậy sớm muộn bị bấm
// nhầm.
//
// ⚠️ ⛔ KHÔNG tự chạy khi tải trang. Sinh 15 mốc × 14 đơn là **ghi dữ liệu
// nghiệp vụ**; việc đó phải do **người** quyết, ⛔ không phải do một lần mở
// trang quyết hộ.
// ============================================================================
import { useState, useTransition } from 'react';
import { CalendarPlus, Loader2 } from 'lucide-react';

import { STATUS } from '@/lib/design/tokens';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { btnPrimary } from '@/components/ui';

export default function MdSinhLichTa({
  chay,
}: {
  /** Server Action truyền từ trang — client ⛔ không tự gọi CSDL. */
  chay: () => Promise<{ ok: boolean; message?: string }>;
}) {
  const [dangChay, batDau] = useTransition();
  const [ketQua, setKetQua] = useState<{ ok: boolean; message?: string } | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className={`mb-1 flex items-center gap-2 text-slate-900 ${TYPE.body} ${FONT_WEIGHT.semibold}`}>
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        Hộp thư việc đang trống — vì đơn cũ chưa có lịch T&amp;A
      </h3>
      <p className={`mb-3 text-slate-600 ${TYPE.bodySm}`}>
        Lịch T&amp;A chỉ được sinh <strong>lúc tạo PO</strong>. Những đơn có trước đó ⛔{' '}
        <strong>không</strong> có mốc nào, nên hệ thống ⛔ không biết việc gì tới hạn.
        <br />
        <span className={TYPE.caption}>
          Bấm nút này để sinh lịch theo <strong>mẫu chuẩn đang dùng</strong> cho các đơn còn chạy.
          ⚠️ Đơn <strong>đã có lịch</strong> sẽ ⛔ <strong>không</strong> bị đụng tới.
        </span>
      </p>

      {ketQua && (
        <p
          role="status"
          className={`mb-3 rounded-xl px-3 py-2 ring-1 ${ketQua.ok ? STATUS.healthy.chip : STATUS.critical.chip} ${TYPE.bodySm}`}
        >
          {ketQua.ok ? '✅ ' : '⛔ '}{ketQua.message}
          {ketQua.ok && ' Tải lại trang để thấy việc mới.'}
        </p>
      )}

      <button
        type="button"
        className={btnPrimary}
        disabled={dangChay}
        onClick={() => batDau(async () => setKetQua(await chay()))}
      >
        {dangChay
          ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang sinh lịch…</>
          : <><CalendarPlus className="h-4 w-4" aria-hidden="true" /> Sinh lịch T&amp;A cho đơn đang chạy</>}
      </button>
    </div>
  );
}
