'use client'

/**
 * SubmitButton — Client Component dùng chung cho các form Server Action.
 *
 * Mục đích:
 *  1. Loading state: hiển thị spinner + text trạng thái khi form đang submit
 *     (useFormStatus đọc trạng thái pending của <form> cha gần nhất).
 *  2. Chống double-submit: disable nút trong lúc pending — cực kỳ quan trọng
 *     với nghiệp vụ kho (tránh xuất/nhập trùng 2 lần cùng một bó hàng).
 *  3. Accessibility: aria-busy + aria-disabled cho screen reader.
 *
 * KHÔNG chứa business logic — thuần UI, dùng được cho mọi form trong app.
 */
import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'

interface SubmitButtonProps {
  children: ReactNode
  /** Text hiển thị khi đang submit, vd: "Đang phát hành đơn..." */
  pendingText?: string
  className?: string
}

export function SubmitButton({ children, pendingText = 'Đang xử lý...', className = '' }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-disabled={pending}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-inherit inline-flex items-center justify-center gap-2`}
    >
      {pending ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{pendingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
