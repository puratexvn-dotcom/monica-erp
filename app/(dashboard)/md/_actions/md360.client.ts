'use server';

import { listPoRows } from '../_services/po.service';
import { listStyles } from '../_services/style.service';
import type { PoRow, StyleRow } from '@/schemas/md';

// ============================================================================
// CẦU NỐI cho nút "Tải lại" ở màn hình Merchandiser.
// Các service có 'server-only' nên client không import trực tiếp được.
// ============================================================================

export async function listPoRowsClient(): Promise<{ rows: PoRow[]; error: string | null }> {
  return listPoRows();
}

export async function listStylesClient(): Promise<{ rows: StyleRow[]; error: string | null }> {
  return listStyles();
}
