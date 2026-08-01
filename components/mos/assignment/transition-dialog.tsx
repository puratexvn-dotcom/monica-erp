'use client';

import { useEffect, useState } from 'react';

import { Modal, Field, btnPrimary, btnGhost, inputCls } from '@/components/ui';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import {
  MIN_REASON_LENGTH,
  REASON_FIELD,
  type AssignmentStatus,
} from '@/lib/mos/domain/assignment';

// ============================================================================
// HỘP THOẠI CHUYỂN TRẠNG THÁI
//
// ⚠️ Ô lý do hiện hay không hiện được TRA TỪ `REASON_FIELD` của Domain, KHÔNG
// viết cứng bốn trạng thái ở đây. Viết cứng là dựng bản cài đặt thứ hai của
// luật, và ngày nghiệp vụ thêm một trạng thái đòi lý do thì cơ sở dữ liệu sẽ từ
// chối trong khi giao diện còn chưa hỏi — người dùng nhận một lỗi không hiểu nổi.
//
// ⚠️ Ngưỡng 10 ký tự cũng lấy từ `MIN_REASON_LENGTH`, cùng hằng số mà bốn ràng
// buộc `assignments_*_needs_reason` của 029 dùng. Gõ số 10 ở đây là mở đường cho
// hai bên lệch nhau.
//
// Kiểm ở đây chỉ là **phép lịch sự** — nó cho người dùng biết trước thay vì để
// máy chủ từ chối sau khi gõ xong. Hàng rào thật vẫn ở `canTransition` và ở
// `CHECK` của cơ sở dữ liệu (chuẩn UI 7.5).
// ============================================================================

export interface TransitionDialogProps {
  open: boolean;
  /** Đích đến. `null` = đóng hộp thoại. */
  target: AssignmentStatus | null;
  assignmentNo: string;
  isRunning: boolean;
  error: string | null;
  onConfirm: (reason: string | null) => void;
  onClose: () => void;
}

export function TransitionDialog({
  open, target, assignmentNo, isRunning, error, onConfirm, onClose,
}: TransitionDialogProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');

  // Đổi đích đến ⇒ xoá lý do cũ. Không xoá thì lý do huỷ của lần trước sẽ nằm
  // sẵn trong ô khi người dùng bấm "Tạm dừng" — và rất dễ được gửi đi nguyên xi.
  useEffect(() => {
    setReason('');
  }, [target, open]);

  if (!target) return null;

  const needsReason = REASON_FIELD[target] !== undefined;
  const trimmed = reason.trim();
  const reasonOk = !needsReason || trimmed.length >= MIN_REASON_LENGTH;

  return (
    <Modal open={open} title={t(`asg_act_${target}` as DictionaryKey)} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          <span className="font-mono font-semibold text-slate-800">{assignmentNo}</span>
        </p>

        {needsReason && (
          <Field label={t('asg_reason_label')} hint={t('asg_reason_hint')}>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              // `text-base` trên mobile: iOS tự phóng to trang khi chạm vào ô
              // chữ nhỏ hơn 16px (chuẩn UI 3.6).
              className={`${inputCls} min-h-[88px] resize-y text-base sm:text-sm`}
              autoFocus
            />
            {/* Đếm ngược cho người dùng biết còn thiếu bao nhiêu — tốt hơn hẳn
                một nút bị khoá mà không nói vì sao. */}
            {needsReason && trimmed.length < MIN_REASON_LENGTH && (
              <p className="mt-1 text-xs text-amber-800">
                {trimmed.length}/{MIN_REASON_LENGTH}
              </p>
            )}
          </Field>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`${btnGhost} min-h-[44px] touch-manipulation`}>
            {t('asg_cancel_btn')}
          </button>
          <button
            type="button"
            disabled={!reasonOk || isRunning}
            onClick={() => onConfirm(needsReason ? trimmed : null)}
            className={`${btnPrimary} min-h-[44px] touch-manipulation`}
          >
            {isRunning ? t('asg_saving') : t('asg_confirm')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
