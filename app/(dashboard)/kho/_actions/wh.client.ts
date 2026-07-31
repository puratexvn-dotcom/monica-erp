'use server';

import { getWhCommandCenter } from '../_services/command-center.service';
import { listStock, listRolls, listMovements, listWhOptions } from '../_services/stock.service';
import type { WhCommandCenter } from '../_services/command-center.service';
import type { WhOptions } from '../_services/stock.service';
import type { StockRow, RollRow, MovementRow } from '@/schemas/warehouse';

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
