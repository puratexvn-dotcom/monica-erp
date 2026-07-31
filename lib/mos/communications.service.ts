// ============================================================================
// HỘI THOẠI — TẦNG DỮ LIỆU
//
// ─── VÌ SAO KHÔNG DÙNG lib/supabase.ts ────────────────────────────────────
// fetchTable() ở đó có cơ chế RƠI VỀ DỮ LIỆU DEMO khi lỗi. Với bảng số liệu
// thì còn chấp nhận được, nhưng với hội thoại thì tuyệt đối không: người dùng
// sẽ đọc những tin nhắn chưa từng ai gửi và tin đó trông y như tin thật.
// Ở đây lỗi phải LỘ RA thành thông báo đỏ, không được che.
//
// ─── PHÂN BIỆT "LỖI" VỚI "CHƯA CÓ TIN NÀO" ───────────────────────────────
// Trả về kiểu kết quả có nhánh ok/lỗi thay vì mảng rỗng, vì mảng rỗng khiến
// giao diện hiện "Chưa có tin nhắn nào" ngay cả khi thật ra là mất mạng —
// đúng cái bẫy mà quy ước dự án gọi là "0 là 0, không đọc được là —".
// ============================================================================

import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@/utils/supabase/client';
import { ALL_ROLES, isRole, type Role } from '@/lib/rbac';

export type ContextType = 'module' | 'order' | 'customer' | 'style' | 'material';

export interface ChatChannel {
  /** Khoá phân hệ, xem lib/mos/mos-context.ts */
  module: string;
  contextType: ContextType;
  /** NULL với kênh chung của phân hệ */
  contextId: string | null;
}

export interface ChatAttachment {
  url: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  /** null khi vai trò trong bản ghi không còn nằm trong danh sách hợp lệ */
  from: Role | null;
  /** Vai trò thô, để còn hiện được thứ gì đó khi `from` là null */
  fromRaw: string;
  text: string;
  mentions: Role[];
  redFlag: boolean;
  at: string;
  attachments: ChatAttachment[];
}

/** Dòng thô đọc từ PostgREST */
interface CommunicationRow {
  id: string;
  module: string;
  context_type: string;
  context_id: string | null;
  sender_id: string;
  sender_role: string;
  content: string;
  attachment_urls: string[] | null;
  attachment_names: string[] | null;
  mentions: string[] | null;
  red_flag: boolean;
  created_at: string;
}

export type LoadResult =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; message: string };

export type SendResult = { ok: true } | { ok: false; message: string };

/** Số tin tải về khi mở khung. Lấy MỚI NHẤT rồi đảo lại, không phải cũ nhất. */
const PAGE_SIZE = 200;

const SELECT_COLS =
  'id,module,context_type,context_id,sender_id,sender_role,content,attachment_urls,attachment_names,mentions,red_flag,created_at';

function toMessage(r: CommunicationRow): ChatMessage {
  const urls = r.attachment_urls ?? [];
  const names = r.attachment_names ?? [];
  return {
    id: r.id,
    senderId: r.sender_id,
    from: isRole(r.sender_role) ? r.sender_role : null,
    fromRaw: r.sender_role,
    text: r.content,
    // Lọc lại phía client: cột là text[] tự do, một vai trò đã bị gỡ khỏi hệ
    // thống vẫn còn nằm trong tin cũ và sẽ tra ra nhãn undefined nếu không lọc.
    mentions: (r.mentions ?? []).filter(isRole),
    redFlag: r.red_flag,
    at: r.created_at,
    attachments: urls.map((url, i) => ({ url, name: names[i] ?? 'tệp đính kèm' })),
  };
}

/** Áp điều kiện kênh lên truy vấn. context_id NULL phải dùng .is, không phải .eq. */
function sameChannel(row: Pick<CommunicationRow, 'module' | 'context_type' | 'context_id'>, ch: ChatChannel): boolean {
  return (
    row.module === ch.module &&
    row.context_type === ch.contextType &&
    (row.context_id ?? null) === ch.contextId
  );
}

export async function loadMessages(ch: ChatChannel): Promise<LoadResult> {
  const sb = createClient();
  let q = sb
    .from('communications')
    .select(SELECT_COLS)
    .eq('module', ch.module)
    .eq('context_type', ch.contextType)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  q = ch.contextId === null ? q.is('context_id', null) : q.eq('context_id', ch.contextId);

  const { data, error } = await q;
  if (error) {
    // Bảng chưa tạo là tình huống RẤT DỄ gặp lúc bàn giao (quên chạy migration).
    // Nói thẳng phải làm gì thay vì ném mã lỗi PostgREST vào mặt người dùng.
    const missing = error.code === '42P01' || /communications.*does not exist/i.test(error.message);
    return {
      ok: false,
      message: missing
        ? 'Chưa có bảng lưu trữ hội thoại. Cần chạy migration 019_communications.sql trên Supabase.'
        : error.message,
    };
  }
  const rows = (data ?? []) as CommunicationRow[];
  // Đảo lại thành cũ -> mới để khung chat đọc xuôi theo thời gian
  return { ok: true, messages: rows.map(toMessage).reverse() };
}

export async function sendMessage(
  ch: ChatChannel,
  payload: { text: string; attachments: ChatAttachment[]; redFlag: boolean },
): Promise<SendResult> {
  const sb = createClient();

  // Trích vai trò được gọi bằng @ ngay tại đây, không nhận từ giao diện: một
  // nguồn duy nhất thì tin gửi từ bất kỳ màn hình nào cũng gắn tag như nhau.
  const mentions = ALL_ROLES.filter((r) => new RegExp(`@${r}\\b`, 'i').test(payload.text));

  // sender_id / sender_role KHÔNG gửi lên: trigger ở migration 019 tự đóng dấu
  // theo phiên đăng nhập thật. Gửi lên cũng bị ghi đè.
  const { error } = await sb.from('communications').insert({
    module: ch.module,
    context_type: ch.contextType,
    context_id: ch.contextId,
    content: payload.text,
    attachment_urls: payload.attachments.map((a) => a.url),
    attachment_names: payload.attachments.map((a) => a.name),
    mentions,
    red_flag: payload.redFlag,
  });

  if (error) {
    const denied = error.code === '42501' || /row-level security/i.test(error.message);
    return {
      ok: false,
      message: denied ? 'Bạn không có quyền gửi tin trong kênh này.' : error.message,
    };
  }
  return { ok: true };
}

/**
 * Nghe tin mới theo thời gian thực.
 *
 * Bộ lọc phía máy chủ chỉ nhận MỘT điều kiện, nên lọc theo `module` (cột hẹp
 * nhất có sẵn) rồi đối chiếu nốt ngữ cảnh ở client. Không lọc gì cả thì mọi
 * phân hệ đều nhận sự kiện của nhau — tốn băng thông vô ích trên mạng xưởng.
 *
 * ⚠️ Realtime KHÔNG thay thế được RLS ở chiều đọc lần đầu, nhưng Supabase có
 * áp RLS lên luồng realtime: tin mà người này không được đọc thì cũng không
 * được đẩy tới. Vì vậy không cần lọc quyền lại ở đây.
 */
export function subscribeMessages(
  ch: ChatChannel,
  onInsert: (m: ChatMessage) => void,
  onDelete: (id: string) => void,
): () => void {
  const sb = createClient();
  const channel: RealtimeChannel = sb
    .channel(`comm-${ch.module}-${ch.contextType}-${ch.contextId ?? 'all'}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'communications', filter: `module=eq.${ch.module}` },
      (p) => {
        const row = p.new as CommunicationRow;
        if (sameChannel(row, ch)) onInsert(toMessage(row));
      },
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'communications' },
      (p) => {
        // DELETE mang được cả dòng cũ nhờ REPLICA IDENTITY FULL ở migration 019
        const row = p.old as Partial<CommunicationRow>;
        if (row.id) onDelete(row.id);
      },
    );

  channel.subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}
