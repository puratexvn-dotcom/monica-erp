// ============================================================================
// MONICA GARMENT ERP — Supabase Client + Data Layer (fallback mock tự động)
//
// ⚠️ CÁCH CẤU HÌNH ĐÚNG (khắc phục lỗi 401 Unauthorized):
//   1. Supabase Dashboard → Project Settings → API Keys
//      → bấm COPY key "Publishable key" (sb_publishable_jFhxcGYaLy_5LAN0PFeWhA_IMOBOUgX) — TUYỆT ĐỐI không gõ tay
//        (key có ký tự dễ nhầm giữa chữ O và số 0). Key "anon public" (eyJ…) cũng dùng được.
//   2. Tạo file `.env.local` ở gốc dự án:
//        NEXT_PUBLIC_SUPABASE_URL=https://xbqnbnziwsjqxrrmxvic.supabase.co
//        NEXT_PUBLIC_SUPABASE_KEY=sb_publishable_jFhxcGYaLy_5LAN0PFeWhA_IMOBOUgX
//   3. TẮT và chạy lại `npm run dev` (Next.js chỉ đọc .env.local lúc khởi động).
//   4. Kiểm tra kết nối:  node scripts/check-supabase.mjs
// ============================================================================
import { createClient } from '@supabase/supabase-js';
import { MOCK } from '@/lib/mock-data';

// Ưu tiên biến môi trường; fallback về hằng số (chỉ dùng cho demo nhanh)
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://xbqnbnziwsjqxrrmxvic.supabase.co';
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_jFhxcGYaLy_5LAN0PFeWhA_IMOBOUgX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export type TableName =
  | 'users' | 'subcons' | 'sewing_lines' | 'orders' | 'bom' | 'inventory'
  | 'cutting_logs' | 'bundles' | 'prod_logs' | 'qa_logs' | 'samples'
  | 'financial_records' | 'approvals' | 'shipments' | 'notifications'
  | 'feedbacks' | 'system_logs' | 'settings';

export interface TableResult<T> {
  rows: T[];
  isMock: boolean; // true = đang chạy dữ liệu demo (mất kết nối hoặc bảng trống)
}

// Lưu lỗi gần nhất để hiển thị/chẩn đoán
let _lastError = '';
let _warned = false;
export const getLastSupabaseError = (): string => _lastError;

function noteError(table: string, message: string): void {
  _lastError = `[${table}] ${message}`;
  if (!_warned && typeof console !== 'undefined') {
    _warned = true;
    if (/api key|jwt|401|unauthor/i.test(message)) {
      console.warn(
        `%c[MONICA ERP] Supabase trả về lỗi API KEY: "${message}".\n` +
        '→ Copy lại Publishable key trong Project Settings → API Keys (chú ý chữ O / số 0),\n' +
        '→ dán vào .env.local (NEXT_PUBLIC_SUPABASE_KEY) rồi restart `npm run dev`.\n' +
        '→ Chẩn đoán nhanh: node scripts/check-supabase.mjs',
        'color:#e11d48;font-weight:bold',
      );
    } else {
      console.warn(`[MONICA ERP] Supabase lỗi: ${message} — đang dùng mock data.`);
    }
  }
}

/** Đọc bảng — lỗi hoặc bảng trống thì tự fallback mock, KHÔNG bao giờ văng trắng. */
export async function fetchTable<T>(table: TableName): Promise<TableResult<T>> {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(2000);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return { rows: (MOCK[table] as T[]) ?? [], isMock: true };
    }
    return { rows: data as T[], isMock: false };
  } catch (e) {
    noteError(table, e instanceof Error ? e.message : 'Không kết nối được');
    return { rows: (MOCK[table] as T[]) ?? [], isMock: true };
  }
}

/** Đọc nhiều bảng song song. */
export async function fetchTables(
  tables: TableName[],
): Promise<{ data: Record<string, unknown[]>; isMock: boolean }> {
  const results = await Promise.all(tables.map((t) => fetchTable<unknown>(t)));
  const data: Record<string, unknown[]> = {};
  let isMock = false;
  tables.forEach((t, i) => {
    data[t] = results[i].rows;
    if (results[i].isMock) isMock = true;
  });
  return { data, isMock };
}

/** Ghi 1 dòng — trả về true nếu ghi lên Supabase thành công (id để DB tự sinh nếu có). */
export async function insertRow(table: TableName, row: Record<string, unknown>): Promise<boolean> {
  try {
    const { error } = await supabase.from(table).insert(row);
    if (error) noteError(table, error.message);
    return !error;
  } catch {
    return false;
  }
}

/** Cập nhật theo id. */
export async function updateRow(table: TableName, id: string, patch: Record<string, unknown>): Promise<boolean> {
  try {
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    if (error) noteError(table, error.message);
    return !error;
  } catch {
    return false;
  }
}

/** Xóa theo id. */
export async function deleteRow(table: TableName, id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/** Realtime: gọi cb khi bất kỳ bảng nào thay đổi. Trả về hàm hủy đăng ký. */
export function subscribeTables(tables: TableName[], cb: () => void): () => void {
  let channel = supabase.channel(`monica-rt-${tables.join('-')}`);
  for (const t of tables) {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: t },
      () => cb(),
    );
  }
  channel.subscribe();
  return () => { supabase.removeChannel(channel); };
}

/** Sinh id cục bộ cho optimistic update (DB thật nên dùng uuid default). */
export function genId(prefix = 'X'): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}
