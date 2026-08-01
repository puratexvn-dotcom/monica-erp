'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getAssignmentDetailClient,
  getReportCalendarClient,
} from '@/app/(dashboard)/md/assignments/_actions/assignment.client';
import { assignmentKeys, STALE_TIME } from '@/lib/mos/contracts/query-keys';
import type {
  AssignmentDetailDTO,
  ReportDayDTO,
} from '@/lib/mos/contracts/assignment.contract';

import { unwrapItem, unwrapList } from './unwrap';

// ============================================================================
// HOOK — CHI TIẾT MỘT PHẦN VIỆC
// ============================================================================

export interface AssignmentQuery {
  data: AssignmentDetailDTO | null;
  isLoading: boolean;
  isRefreshing: boolean;
  /** Không đọc được gì cả. Màn hình hiện trạng thái lỗi. */
  error: string | null;
  /**
   * Đọc được phần chính nhưng một truy vấn phụ hỏng — sổ cái chẳng hạn.
   *
   * ⚠️ PHẢI hiển thị, không được nuốt. Chi tiết vẫn xem được, nhưng `progress`
   * và `reporting` đang tính trên dữ liệu thiếu, tức là **những con số đó sai**.
   * Hiện chúng như thể bình thường là nói dối bằng số.
   */
  warning: string | null;
  refetch: () => void;
}

export function useAssignment(assignmentId: string | null): AssignmentQuery {
  const q = useQuery({
    queryKey: assignmentKeys.detail(assignmentId ?? ''),
    queryFn: async () => unwrapItem(await getAssignmentDetailClient(assignmentId as string)),
    staleTime: STALE_TIME.TRANSACTION,
    // Không có id thì không có gì để hỏi. `enabled: false` giữ hook ở trạng
    // thái chờ thay vì gọi mạng với chuỗi rỗng rồi nhận 404.
    enabled: !!assignmentId,
  });

  return {
    data: q.data?.data ?? null,
    isLoading: q.isPending && !!assignmentId,
    isRefreshing: q.isFetching && !q.isPending,
    error: q.error ? q.error.message : null,
    warning: q.data?.error ?? null,
    refetch: () => void q.refetch(),
  };
}

// ── LỊCH BÁO CÁO ────────────────────────────────────────────────────────────

export interface ReportCalendarQuery {
  days: ReportDayDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Lịch báo cáo đọc thẳng từ view `v_assignment_report_status`.
 *
 * ⚠️ Đây là NGUỒN THỨ HAI cho cùng một sự thật: `useAssignment().data.reporting`
 * cũng trả trạng thái từng ngày, tính bằng calculator trên sổ cái đã tải về.
 *
 * Hai bên phải luôn khớp — có bài kiểm giữ chúng khớp. Dùng hook này khi màn
 * hình **chỉ** cần cái lịch: nó không kéo theo toàn bộ sổ cái.
 */
export function useReportCalendar(assignmentId: string | null): ReportCalendarQuery {
  const q = useQuery({
    queryKey: assignmentKeys.calendar(assignmentId ?? ''),
    queryFn: async () => unwrapList(await getReportCalendarClient(assignmentId as string)),
    staleTime: STALE_TIME.TRANSACTION,
    enabled: !!assignmentId,
  });

  return {
    days: q.data?.rows ?? [],
    isLoading: q.isPending && !!assignmentId,
    error: q.error ? q.error.message : null,
    refetch: () => void q.refetch(),
  };
}
