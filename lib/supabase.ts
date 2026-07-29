// ============================================================================
// MONICA GARMENT ERP — Data Layer cho Client Component (fallback mock tự động)
//
// ─── HAI LỖI ĐÃ SỬA Ở ĐÂY ─────────────────────────────────────────────────
//
// 1. SAI KHOÁ, SAI CẢ DỰ ÁN.
//    Bản cũ đọc biến NEXT_PUBLIC_SUPABASE_KEY — biến này KHÔNG hề có trong
//    .env.local, nên rơi vào hằng số dự phòng viết cứng trong code. Khoá cứng
//    đó lại thuộc một project Supabase khác hẳn (xbqnb…) so với URL thật đang
//    dùng (mnxat…). Kết quả: mọi truy vấn trả 401 và toàn bộ màn hình âm thầm
//    chạy dữ liệu demo. Không ai nhận ra vì có sẵn cơ chế fallback mock.
//
// 2. KHÔNG MANG THEO PHIÊN ĐĂNG NHẬP.
//    Bản cũ tạo client bằng createClient() trần của supabase-js, không đọc
//    cookie phiên. Sau khi siết RLS về authenticated-only thì client này mãi
//    mãi là 'anon' và bị chặn sạch.
//    Nay dùng createBrowserClient của @supabase/ssr — cùng bộ cookie với
//    middleware và Server Component, nên RLS nhìn thấy đúng người đăng nhập.
//
// Client khởi tạo LƯỜI (lazy): file này bị kéo vào lúc pre-render phía máy chủ
// của client component, mà lúc đó chưa có document.cookie.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient as createBrowserSupabase } from '@/utils/supabase/client';
import { MOCK } from '@/lib/mock-data';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

let _client: SupabaseClient | null = null;

/** Client dùng chung, mang theo cookie phiên đăng nhập. */
export function getSupabase(): SupabaseClient {
  if (!_client) _client = createBrowserSupabase();
  return _client;
}

export type TableName =
  | 'subcons' | 'sewing_lines' | 'orders' | 'bom' | 'inventory'
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
      // Sau khi siết RLS về authenticated-only, 401 gần như luôn có nghĩa là
      // PHIÊN ĐĂNG NHẬP đã hết hạn — không còn là chuyện dán sai khoá API nữa.
      console.warn(
        `%c[MONICA ERP] Supabase từ chối truy cập: "${message}".\n` +
        '→ Mọi bảng nay chỉ cho người đã đăng nhập đọc (RLS authenticated-only).\n' +
        '→ Nhiều khả năng phiên đã hết hạn: đăng nhập lại tại /login.\n' +
        '→ Nếu vừa đăng nhập mà vẫn lỗi, kiểm tra NEXT_PUBLIC_SUPABASE_URL và\n' +
        '  NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local có đúng project không.',
        'color:#e11d48;font-weight:bold',
      );
    } else {
      console.warn(`[MONICA ERP] Supabase lỗi: ${message} — đang dùng mock data.`);
    }
  }
}

/**
 * Đọc bảng — chỉ rơi về dữ liệu demo khi LỖI, không bao giờ văng trắng.
 *
 * Bản cũ coi "bảng rỗng" cũng là lý do đổ mock. Điều đó khiến một bảng hợp lệ
 * nhưng chưa có dòng nào (vd: chưa lập lô hàng nào) lại hiện ra vài lô ảo —
 * người vận hành đọc xong tưởng đã có hàng chờ xuất. Trong ERP, "chưa có dữ
 * liệu" và "đang chạy dữ liệu demo" là hai chuyện phải phân biệt rạch ròi.
 * Nay bảng rỗng trả về mảng rỗng, để màn hình hiện đúng trạng thái trống.
 */
export async function fetchTable<T>(table: TableName): Promise<TableResult<T>> {
  try {
    const { data, error } = await getSupabase().from(table).select('*').limit(2000);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as T[], isMock: false };
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
    const { error } = await getSupabase().from(table).insert(row);
    if (error) noteError(table, error.message);
    return !error;
  } catch {
    return false;
  }
}

/** Cập nhật theo id. */
export async function updateRow(table: TableName, id: string, patch: Record<string, unknown>): Promise<boolean> {
  try {
    const { error } = await getSupabase().from(table).update(patch).eq('id', id);
    if (error) noteError(table, error.message);
    return !error;
  } catch {
    return false;
  }
}

/** Xóa theo id. */
export async function deleteRow(table: TableName, id: string): Promise<boolean> {
  try {
    const { error } = await getSupabase().from(table).delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/** Realtime: gọi cb khi bất kỳ bảng nào thay đổi. Trả về hàm hủy đăng ký. */
export function subscribeTables(tables: TableName[], cb: () => void): () => void {
  let channel = getSupabase().channel(`monica-rt-${tables.join('-')}`);
  for (const t of tables) {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: t },
      () => cb(),
    );
  }
  channel.subscribe();
  return () => { getSupabase().removeChannel(channel); };
}

/** Sinh id cục bộ cho optimistic update (DB thật nên dùng uuid default). */
export function genId(prefix = 'X'): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}
