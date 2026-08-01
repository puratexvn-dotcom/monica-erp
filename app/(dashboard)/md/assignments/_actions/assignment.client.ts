'use server';

import {
  listAssignments,
  getAssignmentDetail,
  createAssignment,
  transitionAssignment,
} from '../_services/assignment.service';
import { listExecutionPartners, listContractTypes } from '../_services/partner.service';
import { listOverdueReporting, getReportCalendar } from '../_services/report-status.service';
import { getScopeOptions } from '../_services/scope.service';
import type {
  AssignmentDetailDTO,
  AssignmentFilterDTO,
  AssignmentSummaryDTO,
  ContractTypeDTO,
  CreateAssignmentDTO,
  ItemResult,
  ListResult,
  MutationResult,
  OverdueFilterDTO,
  OverdueListDTO,
  PartnerOptionDTO,
  ReportDayDTO,
  ScopeOptionsDTO,
  TransitionAssignmentDTO,
} from '@/lib/mos/contracts/assignment.contract';

// ============================================================================
// CẦU NỐI CHO PHÂN HỆ ASSIGNMENT
//
// ─── ADAPTER, KHÔNG PHẢI NƠI CHỨA NGHIỆP VỤ ──────────────────────────────
// Không một câu `if` nghiệp vụ nào nằm trong tệp này. Mọi phán quyết đã xảy ra
// ở `policies/` và `permission/`; mọi con số đã tính ở `calculators/`; mọi lần
// chốt quyền đã diễn ra trong `guard()` của từng service.
//
// ⚠️ Đặt kiểm quyền ở đây thay vì trong service là một cái bẫy: Server Action
// và service đều là điểm vào có thể gọi thẳng, và service được các Server
// Component gọi trực tiếp KHÔNG đi qua tệp này. Chốt quyền phải ở lớp trong
// cùng.
//
// Một hàm bọc một việc. Không gộp nhiều lời gọi thành một "hàm tiện lợi" — làm
// vậy sẽ buộc màn hình chỉ cần danh sách đối tác phải chờ luôn cả danh sách
// phần việc.
// ============================================================================

export async function listAssignmentsClient(
  filter?: AssignmentFilterDTO,
): Promise<ListResult<AssignmentSummaryDTO>> {
  return listAssignments(filter);
}

export async function getAssignmentDetailClient(
  assignmentId: string,
): Promise<ItemResult<AssignmentDetailDTO>> {
  return getAssignmentDetail(assignmentId);
}

export async function createAssignmentClient(
  input: CreateAssignmentDTO,
): Promise<MutationResult> {
  return createAssignment(input);
}

/**
 * ⚠️ Nhận MỘT object thay vì ba tham số rời.
 *
 * `(id, to, reason)` là ba chuỗi cạnh nhau — đảo nhầm hai cái là lỗi thầm lặng
 * mà trình biên dịch không bắt được. `TransitionAssignmentDTO` buộc phải gọi
 * tên từng thứ.
 */
export async function transitionAssignmentClient(
  input: TransitionAssignmentDTO,
): Promise<MutationResult> {
  return transitionAssignment(input.assignmentId, input.to, input.reason);
}

export async function listExecutionPartnersClient(): Promise<ListResult<PartnerOptionDTO>> {
  return listExecutionPartners();
}

export async function listContractTypesClient(): Promise<ListResult<ContractTypeDTO>> {
  return listContractTypes();
}

export async function listOverdueReportingClient(
  filter?: OverdueFilterDTO,
): Promise<OverdueListDTO> {
  return listOverdueReporting(filter);
}

/**
 * Lịch báo cáo từng ngày, đọc thẳng từ `v_assignment_report_status`.
 *
 * ⚠️ Tách khỏi `getAssignmentDetailClient` chứ không gộp: chi tiết đã tính sẵn
 * `reporting` bằng calculator cho phần việc đang mở. Hàm này dùng khi cần đối
 * chiếu hai bên, hoặc khi màn hình chỉ cần cái lịch mà không cần cả sổ cái.
 */
export async function getReportCalendarClient(
  assignmentId: string,
): Promise<ListResult<ReportDayDTO>> {
  return getReportCalendar(assignmentId);
}

/**
 * Dữ liệu nền cho ô chọn phạm vi: đơn hàng · địa điểm · chuyền.
 *
 * Một lời gọi cho cả ba — service đã chạy song song bên trong. Tách thành ba
 * Server Action sẽ thành ba vòng mạng từ trình duyệt, đúng thứ vừa tránh được ở
 * tầng dưới.
 */
export async function getScopeOptionsClient(): Promise<ItemResult<ScopeOptionsDTO>> {
  return getScopeOptions();
}
