'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send, TriangleAlert, Loader2 } from 'lucide-react';

import { Badge, inputCls } from '@/components/ui';
import { ROLE_LABEL, type Role } from '@/lib/rbac';

// ============================================================================
// KHUNG CHAT TRƯỢT — trao đổi nhanh giữa các bộ phận
//
// Thay cho components/ChatDrawer.tsx cũ. Bản cũ có ba vấn đề:
//   • Dùng màu pink-600 nằm ngoài design system (repo dùng indigo làm màu chính).
//   • Không đóng được bằng Esc, không khoá cuộn nền, không bẫy tiêu điểm —
//     mở ra trên điện thoại là cuộn xuyên qua lớp phủ xuống trang phía sau.
//   • Không có nhãn thời gian nên không biết tin nào trước tin nào.
//
// ─── TRẠNG THÁI DỮ LIỆU ──────────────────────────────────────────────────
// Tin nhắn hiện GIỮ TRONG BỘ NHỚ, mất khi tải lại trang. Chưa có bảng
// `messages` trong schema nên chưa nối Supabase được — cố ý không dựng dữ liệu
// giả trông như thật. Nhãn "Chưa lưu trữ" hiện thẳng trên đầu khung để người
// dùng không tưởng đây là kênh liên lạc chính thức.
// Khi có bảng, chỉ cần thay hai hàm load/send ở cuối file.
// ============================================================================

export interface ChatMessage {
  id: string;
  /** Vai trò người gửi — hiển thị bằng ROLE_LABEL cho thống nhất toàn app */
  role: Role;
  text: string;
  /** Cờ đỏ: việc cần xử lý ngay, không phải trao đổi thường */
  redFlag: boolean;
  at: string;
}

const timeFmt = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function ChatDrawer({ role }: { role: Role | null }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [redFlag, setRedFlag] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Esc để đóng + khoá cuộn nền. Thiếu khoá cuộn thì trên điện thoại người dùng
  // cuộn xuyên lớp phủ xuống trang phía sau, rất khó hiểu.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Luôn cuộn xuống tin mới nhất
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'end' });
  }, [open, messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || !role) return;

    setSending(true);
    const msg: ChatMessage = {
      // crypto.randomUUID có sẵn trong mọi trình duyệt hiện đại; chỉ chạy khi
      // người dùng bấm gửi nên không ảnh hưởng hydration.
      id: crypto.randomUUID(),
      role,
      text: body,
      redFlag,
      at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setText('');
    setRedFlag(false);
    setSending(false);
  }

  const unread = messages.filter((m) => m.redFlag).length;

  return (
    <>
      {/* ── Nút mở ─────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mở khung trao đổi giữa các bộ phận"
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 transition hover:bg-indigo-700 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 lg:bottom-6"
      >
        <MessageSquare className="h-6 w-6" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold ring-2 ring-white">
            {unread}
          </span>
        )}
      </button>

      {/* ── Lớp phủ + khung trượt ──────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Trao đổi giữa các bộ phận"
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-200 animate-in slide-in-from-right sm:max-w-sm"
          >
            {/* Đầu khung */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                  Trao đổi giữa bộ phận
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {role ? `Bạn đang gửi với vai trò ${ROLE_LABEL[role]}` : 'Cần đăng nhập để gửi'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nói thẳng là chưa lưu trữ, để không ai coi đây là kênh chính thức */}
            <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-[11px] font-semibold leading-relaxed text-amber-800">
              Chưa lưu trữ — tin nhắn mất khi tải lại trang. Việc cần bằng chứng hãy ghi vào phiếu của
              phân hệ tương ứng.
            </p>

            {/* Danh sách tin */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
                  <MessageSquare className="h-8 w-8" aria-hidden="true" />
                  <p className="text-sm font-medium">Chưa có tin nhắn nào</p>
                  <p className="max-w-[15rem] text-xs">
                    Gõ nội dung bên dưới để nhắn cho các bộ phận đang trực.
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-xl border bg-white p-3 shadow-sm ${
                      m.redFlag ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
                    }`}
                  >
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <Badge tone={m.redFlag ? 'rose' : 'indigo'}>{ROLE_LABEL[m.role]}</Badge>
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
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>

            {/* Ô nhập */}
            <div className="border-t border-slate-100 bg-white p-4">
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
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  disabled={!role}
                  placeholder={role ? 'Nhập nội dung, Enter để gửi...' : 'Cần đăng nhập'}
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!role || !text.trim() || sending}
                  aria-label="Gửi tin nhắn"
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
