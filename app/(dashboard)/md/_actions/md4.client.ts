'use server';

import { listCustomers, listInquiries, listCostings, getCustomer360, getCostingDetail, listCustomerOptions } from '../_services/commercial.service';
import { listDocuments, listComments, listChangeRequests, listActivity, listRisks } from '../_services/collaboration.service';
import { getMdDashboard } from '../_services/dashboard.service';
import { getCommandCenter } from '../_services/command-center.service';
import type { Customer360Data, CostingDetail } from '../_services/commercial.service';
import type { MdDashboardData } from '../_services/dashboard.service';
import type { CommandCenterData } from '../_services/command-center.service';

// ============================================================================
// CẦU NỐI CHO CÁC MÀN HÌNH BƯỚC 4
//
// Các service đều có 'server-only' nên component client không import thẳng
// được — đó là chủ đích, để mã truy vấn cơ sở dữ liệu không bao giờ lọt xuống
// trình duyệt. Quyền vẫn được kiểm bên trong từng service qua guard().
// ============================================================================

export async function listCustomersClient() {
  return listCustomers();
}
export async function listInquiriesClient() {
  return listInquiries();
}
export async function listCostingsClient() {
  return listCostings();
}
export async function listDocumentsClient() {
  return listDocuments();
}
export async function listCommentsClient() {
  return listComments();
}
export async function listChangeRequestsClient() {
  return listChangeRequests();
}
export async function listActivityClient() {
  return listActivity();
}
export async function listRisksClient() {
  return listRisks();
}
export async function getMdDashboardClient(): Promise<MdDashboardData> {
  return getMdDashboard();
}
export async function getCustomer360Client(customerId: string): Promise<Customer360Data> {
  return getCustomer360(customerId);
}
export async function getCostingDetailClient(
  costingId: string,
  costingNo: string,
  quotedPrice: number | null,
): Promise<CostingDetail> {
  return getCostingDetail(costingId, costingNo, quotedPrice);
}
export async function listCustomerOptionsClient() {
  return listCustomerOptions();
}

// ─── Command Center (Giai đoạn 3) ──────────────────────────────────────────
export async function getCommandCenterClient(): Promise<CommandCenterData> {
  return getCommandCenter();
}
