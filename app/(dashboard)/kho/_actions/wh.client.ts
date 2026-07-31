'use server';

import { getWhCommandCenter } from '../_services/command-center.service';
import { listStock, listRolls, listMovements, listWhOptions } from '../_services/stock.service';
import type { WhCommandCenter } from '../_services/command-center.service';
import type { WhOptions } from '../_services/stock.service';
import type { StockRow, RollRow, MovementRow } from '@/schemas/warehouse';
import {
  listRollsForInspection, listInspections, listCustomerLimits, createInspection,
  type SaveResult,
} from '../_services/inspection.service';
import type {
  RollForInspection, InspectionRow, CustomerLimit, InspectionFormValues,
} from '@/schemas/warehouse/inspection.schema';
import {
  getAllocationBoard, allocateRoll, releaseReservation,
} from '../_services/allocation.service';
import type { AllocateResult, AllocationBoard } from '@/schemas/warehouse/allocation.schema';

// ============================================================================
// CẦU NỐI CHO CÁC MÀN HÌNH KHO
//
// Mọi service đều có 'server-only' nên component client không import thẳng được
// — đó là chủ đích, để mã truy vấn cơ sở dữ liệu không bao giờ lọt xuống trình
// duyệt. Quyền vẫn được kiểm bên trong từng service qua guard().
// ============================================================================

export async function getWhCommandCenterClient(): Promise<WhCommandCenter> {
  return getWhCommandCenter();
}

export async function listStockClient(): Promise<{ rows: StockRow[]; error: string | null }> {
  return listStock();
}

export async function listRollsClient(): Promise<{ rows: RollRow[]; error: string | null }> {
  return listRolls();
}

export async function listMovementsClient(
  materialId?: string,
): Promise<{ rows: MovementRow[]; error: string | null }> {
  return listMovements(materialId);
}

export async function listWhOptionsClient(): Promise<WhOptions> {
  return listWhOptions();
}

// ─── CHẤM ĐIỂM 4-POINT ──────────────────────────────────────────────────────
// Gộp ba lượt đọc mở màn thành MỘT lời gọi. Ba Server Action riêng nghĩa là ba
// vòng đi-về mạng nối tiếp nhau, mà ở xưởng thì mỗi vòng có thể mất hàng trăm
// mili giây — người kiểm nhìn thấy màn hình dựng lên từng mảnh.

export interface FourPointBootstrap {
  rolls: RollForInspection[];
  inspections: InspectionRow[];
  customers: CustomerLimit[];
  rollsError: string | null;
  inspectionsError: string | null;
  customersError: string | null;
}

export async function getFourPointDataClient(): Promise<FourPointBootstrap> {
  const [r, i, c] = await Promise.all([
    listRollsForInspection(),
    listInspections(),
    listCustomerLimits(),
  ]);
  return {
    rolls: r.rows,
    inspections: i.rows,
    customers: c.rows,
    rollsError: r.error,
    inspectionsError: i.error,
    customersError: c.error,
  };
}

export async function createInspectionClient(values: InspectionFormValues): Promise<SaveResult> {
  return createInspection(values);
}

// ─── GIỮ CHỖ & PHÂN BỔ THEO TÔNG MÀU ────────────────────────────────────────

export async function getAllocationBoardClient(materialId: string | null): Promise<AllocationBoard> {
  return getAllocationBoard(materialId);
}

export async function allocateRollClient(input: {
  rollId: string; cutTicketId: string; materialId: string; lotId: string | null; qtyM: number;
}): Promise<AllocateResult> {
  return allocateRoll(input);
}

export async function releaseReservationClient(reservationId: string): Promise<AllocateResult> {
  return releaseReservation(reservationId);
}
