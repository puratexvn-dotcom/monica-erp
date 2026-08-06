'use client';

// ============================================================================
// BIỂU MẪU CÓ TRẢ LỜI — dùng chung cho mọi cửa nhập liệu của xưởng
//
// ─── 🔴 KHUYẾT TẬT ĐANG VÁ: BIỂU MẪU NUỐT LỖI ───────────────────────────
// Mọi Server Action của xưởng trả về `{ success: true }` hoặc `{ error: '…' }`.
// Nhưng trang bọc chúng thế này:
//
//     <form action={async (fd) => { 'use server'; await createFinishingLog(fd) }}>
//
// — giá trị trả về **rơi vào hư không**. Tổ trưởng nhập sai *(quên chọn
// bundle, số âm, mất mạng, RLS chặn)* thì màn hình **⛔ KHÔNG HIỆN GÌ**: form
// trắng lại, y hệt lúc lưu thành công.
//
// 🔑 Đây là kiểu hỏng **nguy nhất trong nhà máy**: người dùng tin là đã ghi,
// đi làm việc khác, và số liệu biến mất **âm thầm**. Một lỗi ồn ào còn đỡ hơn
// một lỗi im lặng — vì lỗi im lặng ⛔ không ai đi sửa.
//
// ─── CÁCH DÙNG ───────────────────────────────────────────────────────────
//     <ActionForm action={async (_truoc, fd) => {
//       'use server'
//       return await createFinishingLog(fd)
//     }} nutChu="Ghi Nhận & Chuyển Đóng Thùng">
//       …các ô nhập…
//     </ActionForm>
//
// ⚠️ `useFormState` **⛔ KHÔNG phải** `useActionState` — dự án chạy React 18 +
// Next 14. `useActionState` là API React 19: import vào chỉ nhận cảnh báo lúc
// build rồi chết ở runtime vì giá trị là `undefined`. Xem `app/login/form.tsx`.
//
// ⚠️ Màu lấy từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import { useFormState, useFormStatus } from 'react-dom';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

import { STATUS } from '@/lib/design/tokens';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import type { KetQuaForm } from '@/lib/forms/ket-qua';

function NutGui({ chu }: { chu: string }) {
  // 🔑 `useFormStatus` đọc trạng thái của `<form>` **cha gần nhất** ⇒ nút bắt
  // buộc là component RIÊNG. Gọi hook này ngay trong `ActionForm` sẽ luôn
  // trả `pending = false` — và người dùng bấm hai lần.
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      <span className={`${TYPE.bodySm} ${FONT_WEIGHT.medium}`}>{pending ? 'Đang ghi…' : chu}</span>
    </button>
  );
}

export default function ActionForm({
  action, nutChu, children, className, chuThanhCong,
}: {
  action: (truoc: KetQuaForm | null, formData: FormData) => Promise<KetQuaForm>;
  nutChu: string;
  children: React.ReactNode;
  className?: string;
  /** Câu báo khi ghi xong. Mặc định nói rõ ĐÃ GHI, ⛔ không nói chung chung. */
  chuThanhCong?: string;
}) {
  const [kq, chay] = useFormState<KetQuaForm | null, FormData>(action, null);

  return (
    <form action={chay} className={className}>
      {/* 🔴 Lời báo đặt TRƯỚC các ô nhập, ⛔ không đặt dưới nút.
          Tổ trưởng đứng ở chuyền, mắt về đầu biểu mẫu sau khi bấm — lời báo
          nằm dưới cùng thì bị bàn phím ảo che và ⛔ không ai thấy. */}
      {kq?.error && (
        <p role="alert" className={`mb-3 flex items-start gap-2 rounded-xl px-3 py-2 ring-1 ${STATUS.critical.chip} ${TYPE.bodySm}`}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span><strong>⛔ Chưa ghi được.</strong> {kq.error}</span>
        </p>
      )}
      {kq?.success && !kq.error && (
        <p role="status" className={`mb-3 flex items-start gap-2 rounded-xl px-3 py-2 ring-1 ${STATUS.healthy.chip} ${TYPE.bodySm}`}>
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{chuThanhCong ?? 'Đã ghi vào hệ thống.'}</span>
        </p>
      )}

      {children}
      <NutGui chu={nutChu} />
    </form>
  );
}
