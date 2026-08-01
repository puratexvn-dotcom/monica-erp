'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createAssignmentClient,
  transitionAssignmentClient,
} from '@/app/(dashboard)/md/assignments/_actions/assignment.client';
import { assignmentInvalidationKeys } from '@/lib/mos/contracts/query-keys';
import type {
  CreateAssignmentDTO,
  MutationResult,
  TransitionAssignmentDTO,
} from '@/lib/mos/contracts/assignment.contract';

import { unwrapMutation } from './unwrap';

// ============================================================================
// HOOK — LỆNH GHI
//
// ─── HAI THỨ TỆP NÀY TUYỆT ĐỐI KHÔNG LÀM ─────────────────────────────────
//   ✗ KHÔNG kiểm tra hợp lệ. `canTransition` đã chạy ở service, và nó là nơi
//     DUY NHẤT được phép phán quyết. Kiểm lại ở đây là dựng bản cài đặt thứ
//     hai của luật — rồi hai bên sẽ lệch, và giao diện sẽ cho bấm một nút mà
//     máy chủ từ chối (hoặc tệ hơn: KHOÁ một nút mà máy chủ cho phép).
//   ✗ KHÔNG cập nhật lạc quan. Lập phần việc sinh ra một Business Number THẬT
//     từ dãy số của cơ sở dữ liệu; đoán trước số đó rồi hiện lên màn hình là
//     bịa ra một chứng từ chưa tồn tại.
//
// Việc của tệp này đúng hai thứ: **gọi** và **làm mới đúng chỗ**.
// ============================================================================

export interface MutationState<TInput> {
  run: (input: TInput) => Promise<MutationResult>;
  isRunning: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Làm mới sau khi ghi.
 *
 * ⚠️ Danh sách khoá đến từ `assignmentInvalidationKeys` — MỘT nơi duy nhất.
 * Rải `invalidateQueries` trong từng mutation là cách chắc chắn để một ngày nào
 * đó thêm truy vấn mới mà quên làm mới nó: **không lỗi nào nổ ra**, màn hình
 * chỉ hiện số cũ mãi mãi.
 */
function useInvalidator() {
  const qc = useQueryClient();
  return (assignmentId?: string) => {
    for (const key of assignmentInvalidationKeys(assignmentId)) {
      void qc.invalidateQueries({ queryKey: key });
    }
  };
}

// ── LẬP PHẦN VIỆC ───────────────────────────────────────────────────────────

/**
 * Đầu vào biểu mẫu **không** mang `requestId` — hook tự quản lý nó.
 *
 * ⚠️ Cố ý. Nếu để biểu mẫu tự sinh thì mỗi biểu mẫu sẽ sinh một kiểu, và một
 * trong số đó sẽ sinh **lúc bấm** thay vì **lúc mở** — làm cột `request_id`
 * thành đồ trang trí mà không ai nhận ra.
 */
export type CreateAssignmentInput = Omit<CreateAssignmentDTO, 'requestId'>;

export interface CreateAssignmentState extends MutationState<CreateAssignmentInput> {
  /** Khoá của phiên biểu mẫu hiện tại. Hiện ra để gỡ lỗi và để bài kiểm bám vào. */
  requestId: string;
}

export function useCreateAssignment(): CreateAssignmentState {
  const invalidate = useInvalidator();

  // ⚠️ `useState(() => ...)` — sinh MỘT LẦN lúc hook gắn vào, tức là lúc BIỂU
  // MẪU MỞ. Viết `crypto.randomUUID()` thẳng trong thân hàm thì mỗi lần render
  // lại sinh một khoá mới, và bấm lại sau khi mạng chập sẽ tạo bản trùng —
  // đúng thứ cả cơ chế này sinh ra để chặn.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const m = useMutation({
    mutationFn: async (input: CreateAssignmentInput) =>
      unwrapMutation(await createAssignmentClient({ ...input, requestId })),
    onSuccess: () => {
      // Phần việc vừa lập chưa nằm trong bộ nhớ đệm nào, nên chỉ làm mới danh
      // sách — truyền `id` sẽ tạo một ô đệm rỗng cho màn hình chưa ai mở.
      invalidate();
      // Lập xong ⇒ phiên biểu mẫu kết thúc ⇒ khoá mới cho lần lập tiếp theo.
      // Thiếu dòng này thì người dùng KHÔNG lập được phần việc thứ hai: lần gửi
      // sau trùng khoá và máy chủ trả lại chính bản ghi cũ.
      setRequestId(crypto.randomUUID());
    },
  });

  const run = useCallback(
    (input: CreateAssignmentInput) => m.mutateAsync(input),
    [m],
  );

  return {
    run,
    requestId,
    isRunning: m.isPending,
    error: m.error ? m.error.message : null,
    reset: () => m.reset(),
  };
}

// ── CHUYỂN TRẠNG THÁI ───────────────────────────────────────────────────────

/**
 * ⚠️ Làm mới bằng `assignmentId` TỪ ĐẦU VÀO, không phải từ kết quả trả về.
 *
 * Nếu máy chủ trả `{ ok: false, id: null }` thì `unwrapMutation` đã ném và
 * `onSuccess` không chạy — nên hai nguồn luôn trùng nhau ở đường thành công.
 * Nhưng đọc từ đầu vào thì ý định rõ ràng hơn: *"tôi vừa đổi CÁI NÀY, hãy làm
 * mới CÁI NÀY"*, không phụ thuộc vào việc máy chủ có tử tế trả id về hay không.
 */
export function useTransitionAssignment(): MutationState<TransitionAssignmentDTO> {
  const invalidate = useInvalidator();

  const m = useMutation({
    mutationFn: async (input: TransitionAssignmentDTO) =>
      unwrapMutation(await transitionAssignmentClient(input)),
    onSuccess: (_res, input) => invalidate(input.assignmentId),
  });

  return {
    run: (input) => m.mutateAsync(input),
    isRunning: m.isPending,
    error: m.error ? m.error.message : null,
    reset: () => m.reset(),
  };
}
