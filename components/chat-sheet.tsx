'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, TriangleAlert, MessageSquare, Eye, AtSign } from 'lucide-react';

import Sheet from '@/components/sheet';
import { Badge, inputCls } from '@/components/ui';
import { ALL_ROLES, ROLE_LABEL, type Role } from '@/lib/rbac';

// ============================================================================
// CHAT LIÊN BỘ PHẬN — có tag @ để gọi đúng người
//
// ─── QUYỀN ĐỌC ───────────────────────────────────────────────────────────
// Theo nghiệp vụ: giamdoc và md đọc được MỌI hội thoại; các bộ phận khác chỉ
// thấy tin của mình gửi và tin có tag @ bộ phận mình.
//
// ⚠️ Việc lọc dưới đây là LỌC HIỂN THỊ, KHÔNG phải hàng rào bảo mật. Tin nhắn
// hiện nằm trong bộ nhớ trình duyệt nên chưa có gì để rò rỉ, nhưng khi nối vào
// Supabase thì BẮT BUỘC viết RLS policy trên bảng messages — lọc ở client thì
// ai mở DevTools cũng đọc được hết.
//
// ─── TRẠNG THÁI DỮ LIỆU ──────────────────────────────────────────────────
// Chưa có bảng `messages` trong schema nên tin nhắn mất khi tải lại trang. Cố ý
// không dựng dữ liệu giả trông như thật, và có nhãn "Chưa lưu trữ" ngay đầu
// khung để không ai coi đây là kênh liên lạc chính thức.
// ============================================================================

export interface ChatMessage {
  id: string;
  from: Role;
  text: string;
  /** Các bộ phận được tag bằng @ */
  mentions: Role[];
  redFlag: boolean;
  at: string;
}

const timeFmt = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

/** Bộ phận nào đọc được mọi hội thoại */
const CAN_READ_ALL: readonly Role[] = ['giamdoc', 'md', 'superadmin'];

/** Bỏ dấu để gõ '@ke toan' hay '@ketoan' đều gợi ý ra Kế toán */
function deaccent(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export default function ChatSheet({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role: Role | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [redFlag, setRedFlag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  // ── Gợi ý @ ───────────────────────────────────────────────────────────────
  // Chỉ bắt cụm @ Ở CUỐI chuỗi đang gõ. Nếu bắt bất kỳ @ nào thì sau khi tag
  // xong rồi gõ tiếp nội dung, bảng gợi ý vẫn hiện ra và che mất ô nhập.
  // Dùng [^@] thay cho \p{L}: \p{L} bắt buộc cờ 'u', mà cờ 'u' lại đòi
  // target es6 — tsconfig của dự án không đặt target nên TS từ chối biên dịch.
  // Giới hạn 30 ký tự để khi gõ xong nội dung dài thì bảng gợi ý tự tắt.
  const mentionQuery = useMemo(() => {
    const m = text.match(/@([^@]{0,30})$/);
    return m ? deaccent(m[1].trim()) : null;
  }, [text]);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return ALL_ROLES.filter((r) => r !== 'superadmin').filter(
      (r) => mentionQuery === '' || deaccent(ROLE_LABEL[r]).includes(mentionQuery) || r.includes(mentionQuery),
    );
  }, [mentionQuery]);

  function pickMention(r: Role) {
    // Thay đúng cụm @... đang gõ ở cuối bằng thẻ tag hoàn chỉnh
    setText((prev) => prev.replace(/@([^@]{0,30})$/, `@${r} `));
    inputRef.current?.focus();
  }

  function send() {
    const body = text.trim();
    if (!body || !role) return;

    // Trích tag từ nội dung: '@ketoan' -> role 'ketoan'
    const mentions = ALL_ROLES.filter((r) => new RegExp(`@${r}\\b`, 'i').test(body));

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: role, text: body, mentions, redFlag, at: new Date().toISOString() },
    ]);
    setText('');
    setRedFlag(false);
  }

  // Lọc hiển thị theo quyền đọc
  const visible = useMemo(() => {
    if (!role) return [];
    if (CAN_READ_ALL.includes(role)) return messages;
    return messages.filter((m) => m.from === role || m.mentions.includes(role));
  }, [messages, role]);

  const readsAll = role ? CAN_READ_ALL.includes(role) : false;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Trao đổi liên bộ phận"
      subtitle={role ? `Gửi với vai trò ${ROLE_LABEL[role]}` : 'Cần đăng nhập để gửi'}
      footer={
        <div>
          {/* Bảng gợi ý @ — nằm ngay trên ô nhập, tầm mắt tự nhiên */}
          {suggestions.length > 0 && (
            <div className="mb-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              <p className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <AtSign className="h-3 w-3" aria-hidden="true" /> Gọi bộ phận
              </p>
              {suggestions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => pickMention(r)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-indigo-50"
                >
                  <span className="font-mono text-xs text-indigo-600">@{r}</span>
                  <span className="truncate text-slate-700">{ROLE_LABEL[r]}</span>
                </button>
              ))}
            </div>
          )}

          <label className="mb-2.5 flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={redFlag}
              onChange={(e) => setRedFlag(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-400"
            />
            <TriangleAlert className="h-4 w-4 text-rose-500" aria-hidden="true" />
            Gắn cờ đỏ (việc cần xử lý ngay)
          </label>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && suggestions.length === 0) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={!role}
              placeholder={role ? 'Gõ @ để gọi bộ phận, Enter để gửi...' : 'Cần đăng nhập'}
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={send}
              disabled={!role || !text.trim()}
              aria-label="Gửi tin nhắn"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      }
    >
      <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-[11px] font-semibold leading-relaxed text-amber-800">
        Chưa lưu trữ — tin nhắn mất khi tải lại trang. Việc cần bằng chứng hãy ghi vào phiếu của phân
        hệ tương ứng.
      </p>

      {readsAll && (
        <p className="flex items-center gap-1.5 border-b border-indigo-100 bg-indigo-50 px-5 py-2 text-[11px] font-semibold text-indigo-800">
          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Bạn đang xem được toàn bộ hội thoại của mọi bộ phận.
        </p>
      )}

      <div className="space-y-3 bg-slate-50/60 p-4">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
            <MessageSquare className="h-8 w-8" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">Chưa có tin nhắn nào</p>
            <p className="max-w-[16rem] text-xs">
              Gõ <span className="font-mono font-bold">@</span> rồi tên bộ phận để gọi đúng người.
            </p>
          </div>
        ) : (
          visible.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border bg-white p-3 shadow-sm ${
                m.redFlag ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
              }`}
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Badge tone={m.redFlag ? 'rose' : 'indigo'}>{ROLE_LABEL[m.from]}</Badge>
                {m.redFlag && (
                  <Badge tone="rose" icon={TriangleAlert}>
                    Cần xử lý ngay
                  </Badge>
                )}
                <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                  {timeFmt.format(new Date(m.at))}
                </span>
              </div>

              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                {m.text}
              </p>

              {m.mentions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.mentions.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700"
                    >
                      @{ROLE_LABEL[r]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </Sheet>
  );
}
