'use client';

import { useQuery } from '@tanstack/react-query';

import {
  listAssignmentsClient,
  listOverdueReportingClient,
} from '@/app/(dashboard)/md/assignments/_actions/assignment.client';
import { assignmentKeys, STALE_TIME } from '@/lib/mos/contracts/query-keys';
import type {
  AssignmentFilterDTO,
  AssignmentSummaryDTO,
  OverdueFilterDTO,
  OverdueSummaryDTO,
} from '@/lib/mos/contracts/assignment.contract';

import { unwrapList } from './unwrap';

// ============================================================================
// HOOK — DANH SÁCH PHẦN VIỆC
//
// ─── HOOK CHỈ LÀM BỐN VIỆC (Yêu cầu 3) ───────────────────────────────────
//   Fetch · Cache · Invalidate · Mutation
//
// Không một phép tính nghiệp vụ nào ở đây: không cộng sản lượng, không tính tỉ
// lệ, không xếp hạng, không quyết định nút nào bật. Tất cả đã xong ở
// `calculators/` và `policies/` trước khi dữ liệu rời máy chủ.
//
// Phép thử để biết một dòng có nên nằm ở đây không: *"nếu đổi từ React Query
// sang thứ khác, dòng này có phải viết lại không?"* Nếu KHÔNG thì nó là nghiệp
// vụ và phải đi chỗ khác.
//
// ⚠️ Hook chỉ nhìn thấy DTO của Contract. Không một kiểu nào nhập khẩu từ
// `_services/`, và vì thế không một tên cột nào lọt tới đây.
// ============================================================================

export interface AssignmentsQuery {
  rows: AssignmentSummaryDTO[];
  isLoading: boolean;
  /** Đã có dữ liệu cũ, đang lấy dữ liệu mới. Tách khỏi `isLoading` để màn hình
   *  không chớp về khung xám mỗi lần làm mới. */
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAssignments(filter: AssignmentFilterDTO = {}): AssignmentsQuery {
  const q = useQuery({
    queryKey: assignmentKeys.list(filter),
    queryFn: async () => unwrapList(await listAssignmentsClient(filter)),
    staleTime: STALE_TIME.TRANSACTION,
  });

  return {
    rows: q.data?.rows ?? [],
    isLoading: q.isPending,
    isRefreshing: q.isFetching && !q.isPending,
    error: q.error ? q.error.message : null,
    refetch: () => void q.refetch(),
  };
}

// ── THIẾU BÁO CÁO ───────────────────────────────────────────────────────────

export interface OverdueQuery {
  rows: OverdueSummaryDTO[];
  /** Tổng số NGÀY trễ, không phải số phần việc. Máy chủ đã đếm. */
  totalOverdue: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Phần việc còn ngày thiếu báo cáo.
 *
 * ⚠️ `totalOverdue` đến THẲNG từ máy chủ, hook không cộng lại. Cộng ở đây sẽ
 * cho một con số khác khi danh sách bị phân trang — và hai con số cùng tên mà
 * khác giá trị là thứ làm người vận hành mất niềm tin vào bảng điều khiển.
 */
export function useOverdueReporting(filter: OverdueFilterDTO = {}): OverdueQuery {
  const q = useQuery({
    queryKey: assignmentKeys.overdue(filter),
    queryFn: async () => unwrapList(await listOverdueReportingClient(filter)),
    // Bang dieu khien, khong phai man hinh tac nghiep: chenh mot phut khong
    // doi quyet dinh nao, va truy van gop nay dat.
    staleTime: STALE_TIME.DASHBOARD,
  });

  return {
    rows: q.data?.rows ?? [],
    totalOverdue: q.data?.totalOverdue ?? 0,
    isLoading: q.isPending,
    isRefreshing: q.isFetching && !q.isPending,
    error: q.error ? q.error.message : null,
    refetch: () => void q.refetch(),
  };
}
