'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Send, TriangleAlert, MessageSquare, Eye, AtSign, Paperclip, X, Loader2, ImageIcon,
  CloudOff, RefreshCw, Wifi,
} from 'lucide-react';
import { toast } from 'sonner';

import { uploadEvidence } from '@/app/actions/upload-action';

import Sheet from '@/components/sheet';
import { Badge, inputCls } from '@/components/ui';
import { ALL_ROLES, ROLE_LABEL, type Role } from '@/lib/rbac';
import {
  loadMessages, sendMessage, subscribeMessages,
  type ChatAttachment, type ChatChannel, type ChatMessage,
} from '@/lib/mos/communications.service';

// ============================================================================
// CHAT LIÊN BỘ PHẬN — có tag @ để gọi đúng người
//
// ─── ĐÃ LƯU TRỮ THẬT (migration 019) ─────────────────────────────────────
// Trước đây tin nhắn chỉ nằm trong useState nên mất sạch khi tải lại trang, và
// việc lọc quyền đọc làm bằng .filter() trong trình duyệt — ai mở DevTools
// cũng đọc được hết. Nay:
//   • Tin nằm trong bảng `communications`, tải lại vẫn còn.
//   • Quyền đọc do RLS trong Postgres quyết định. Phần lọc ở client đã GỠ BỎ
//     hoàn toàn: giữ lại chỉ tạo ảo giác là còn hàng rào thứ hai, trong khi
//     thật ra nó chỉ khiến hai chỗ dễ lệch luật nhau.
//   • Realtime đẩy tin mới sang máy người khác, không cần F5.
//
// ─── LUẬT ĐỌC (nay thi hành ở máy chủ) ───────────────────────────────────
// Kênh chung của phân hệ: giám đốc / MD / superadmin đọc mọi hội thoại; bộ
// phận khác chỉ thấy tin mình gửi và tin có @ gọi mình.
// Kênh gắn hồ sơ (PO, khách hàng...): ai xem được hồ sơ thì đọc được hội thoại.
// ============================================================================

const timeFmt = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
});

/** Bộ phận nào đọc được mọi hội thoại — dùng để hiện dải nhắc, KHÔNG để lọc */
const CAN_READ_ALL: readonly Role[] = ['giamdoc', 'md', 'superadmin'];

/** Bỏ dấu để gõ '@ke toan' hay '@ketoan' đều gợi ý ra Kế toán */
function deaccent(s: string): string {
  // Lọc theo MÃ KÝ TỰ thay vì viết dãy ̀-ͯ vào biểu thức chính quy.
  // Dãy đó gồm toàn dấu tổ hợp KHÔNG NHÌN THẤY trong mã nguồn: chỉ cần một lần
  // sao chép qua công cụ khác là nó biến dạng âm thầm mà mắt không phát hiện.
  const bare = Array.from(s.normalize('NFD'))
    .filter((c) => { const n = c.codePointAt(0) ?? 0; return n < 0x300 || n > 0x36f; })
    .join('');
  return bare.replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

export type { ChatMessage };

export default function ChatSheet({
  open,
  onClose,
  role,
  channel,
  channelLabel,
}: {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  /** Kênh hội thoại. Thanh điều hướng truyền kênh chung của phân hệ đang mở. */
  channel: ChatChannel;
  channelLabel: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  /** null = chưa có lỗi. Chuỗi = lỗi thật, phải hiện ra chứ không nuốt. */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [redFlag, setRedFlag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // ─── ĐÍNH KÈM ẢNH ────────────────────────────────────────────────────────
  // Tải lên NGAY khi chọn, không đợi bấm Gửi. Mạng ở xưởng chập chờn; lỗi phải
  // lộ ra lúc người dùng còn đứng đó chụp lại được, thay vì mất cả tin đã gõ.
  //
  // ⚠️ Bucket `evidences` hiện CHỈ nhận ảnh (jpeg/png/webp/heic, tối đa 8 MB) —
  // xem migration 013. Vì vậy ô chọn tệp giới hạn accept="image/*".
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  async function pickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'chat');
        const res = await uploadEvidence(fd);
        if (!res.ok || !res.url) {
          toast.error(`Không tải được ${file.name}`, { description: res.message });
          continue;
        }
        setAttachments((prev) => [...prev, { url: res.url as string, name: file.name }]);
      }
    } finally {
      setUploading(false);
      // Xoá giá trị ô chọn tệp để chọn LẠI ĐÚNG tệp vừa rồi vẫn kích hoạt
      // onChange — nếu không, người dùng chụp lại cùng tên tệp sẽ không thấy gì.
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // ─── TẢI LỊCH SỬ + NGHE REALTIME ─────────────────────────────────────────
  // Khoá kênh thành chuỗi phẳng để làm dependency: truyền thẳng object `channel`
  // thì mỗi lượt render cha sinh một tham chiếu mới và effect chạy lại vô tận,
  // kéo theo huỷ/đăng ký lại kênh realtime liên tục.
  const chKey = `${channel.module}|${channel.contextType}|${channel.contextId ?? ''}`;

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await loadMessages(channel);
    if (res.ok) {
      setMessages(res.messages);
      setLoadError(null);
    } else {
      setMessages([]);
      setLoadError(res.message);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chKey]);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    // Chỉ nối realtime khi khung ĐANG MỞ. Nối sẵn từ lúc dựng trang nghĩa là
    // mỗi tab mở suốt ngày giữ một websocket không ai đọc.
    if (!open) {
      setLive(false);
      return;
    }
    const stop = subscribeMessages(
      channel,
      (m) => {
        setLive(true);
        // Chống trùng: người gửi vừa nhận lại chính tin mình vừa ghi
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      },
      (id) => setMessages((prev) => prev.filter((x) => x.id !== id)),
    );
    setLive(true);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chKey]);

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
    setText((prev) => prev.replace(/@([^@]{0,30})$/, `@${r} `));
    inputRef.current?.focus();
  }

  async function send() {
    const body = text.trim();
    // Cho phép gửi tin CHỈ có ảnh, không bắt buộc phải kèm chữ
    if ((!body && attachments.length === 0) || !role || sending) return;

    setSending(true);
    const res = await sendMessage(channel, { text: body, attachments, redFlag });
    setSending(false);

    if (!res.ok) {
      // KHÔNG xoá ô nhập khi gửi hỏng: người dùng vừa gõ xong một đoạn dài mà
      // mất trắng vì rớt mạng là lỗi khó tha thứ nhất của một khung chat.
      toast.error('Chưa gửi được tin', { description: res.message });
      return;
    }

    setText('');
    setRedFlag(false);
    setAttachments([]);
    // Realtime thường đẩy tin về trước khi tới dòng này, nhưng nếu websocket
    // đang rớt thì tải lại để người gửi vẫn thấy tin của mình.
    if (!live) void refresh();
  }

  const readsAll = role ? CAN_READ_ALL.includes(role) : false;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Trao đổi liên bộ phận"
      subtitle={role ? `${channelLabel} · gửi với vai trò ${ROLE_LABEL[role]}` : 'Cần đăng nhập để gửi'}
      size="full"
      footer={
        // min-w-0 + overflow-hidden: ô nhập và bảng gợi ý không được đẩy rộng
        // khung ra ngoài viền panel trên màn 360px.
        <div className="mx-auto w-full min-w-0 max-w-3xl overflow-hidden">
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
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-blue-50"
                >
                  <span className="font-mono text-xs text-blue-600">@{r}</span>
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

          {/* Ảnh đã đính kèm — xem trước ngay trên ô nhập để không gửi nhầm */}
          {attachments.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {attachments.map((a, i) => (
                <div
                  key={a.url}
                  className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt="Ảnh đính kèm" className="h-10 w-10 shrink-0 rounded object-cover" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-blue-800">{a.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Bỏ ảnh ${a.name}`}
                    className="shrink-0 rounded p-1 text-blue-500 transition hover:bg-blue-100 hover:text-blue-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex min-w-0 items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void pickFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={!role || uploading}
              aria-label="Đính kèm ảnh"
              className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 active:scale-95 disabled:opacity-40"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Paperclip className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && suggestions.length === 0) {
                  e.preventDefault();
                  void send();
                }
              }}
              disabled={!role}
              placeholder={role ? 'Gõ @ để gọi bộ phận, Enter để gửi...' : 'Cần đăng nhập'}
              // min-w-0 BẮT BUỘC: mặc định flex item có min-width là auto nên ô
              // nhập không co nhỏ hơn nội dung nó chứa, gõ dài là tràn cả khung.
              className={`${inputCls} min-w-0 flex-1 text-base sm:text-sm`}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!role || sending || (!text.trim() && attachments.length === 0)}
              aria-label="Gửi tin nhắn"
              className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      }
    >
      {loadError && (
        <div className="flex items-start gap-2 border-b border-rose-100 bg-rose-50 px-5 py-2.5 text-[11px] font-semibold leading-relaxed text-rose-800">
          <CloudOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words">
            Không đọc được lịch sử hội thoại — {loadError}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex shrink-0 items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-1 font-bold text-rose-700 transition hover:bg-rose-100"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" /> Thử lại
          </button>
        </div>
      )}

      {readsAll && (
        <p className="flex items-center gap-1.5 border-b border-blue-100 bg-blue-50 px-5 py-2 text-[11px] font-semibold text-blue-800">
          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Bạn đang xem được toàn bộ hội thoại của mọi bộ phận.
        </p>
      )}

      <div className="mx-auto min-w-0 max-w-3xl space-y-3 overflow-x-hidden p-3 sm:p-4">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">Đang tải hội thoại...</p>
          </div>
        ) : messages.length === 0 && !loadError ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
            <MessageSquare className="h-8 w-8" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">Chưa có tin nhắn nào</p>
            <p className="max-w-[16rem] text-xs">
              Gõ <span className="font-mono font-bold">@</span> rồi tên bộ phận để gọi đúng người.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`min-w-0 overflow-hidden rounded-xl border bg-white p-3 shadow-sm ${
                m.redFlag ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
              }`}
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Badge tone={m.redFlag ? 'rose' : 'indigo'}>
                  {/* Vai trò lạ (tài khoản cũ, vai trò đã gỡ) hiện mã thô chứ
                      không hiện "undefined" */}
                  {m.from ? ROLE_LABEL[m.from] : m.fromRaw || '—'}
                </Badge>
                {m.redFlag && (
                  <Badge tone="rose" icon={TriangleAlert}>
                    Cần xử lý ngay
                  </Badge>
                )}
                <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                  {timeFmt.format(new Date(m.at))}
                </span>
              </div>

              {m.text && (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                  {m.text}
                </p>
              )}

              {m.attachments.map((a) => (
                <a
                  key={a.url}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.name} className="h-12 w-12 shrink-0 rounded object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-xs font-bold text-blue-700">
                      <ImageIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Ảnh đính kèm
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">{a.name}</span>
                  </span>
                </a>
              ))}

              {m.mentions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.mentions.map((r) => (
                    <span
                      key={r}
                      className="max-w-full break-words rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700"
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

      {/* Dải trạng thái realtime đặt CUỐI luồng đọc: nó là thông tin phụ trợ,
          không được chiếm chỗ phía trên nơi người dùng tìm tin nhắn. */}
      {live && !loadError && (
        <p className="flex items-center justify-center gap-1.5 pb-2 text-[10px] font-semibold text-emerald-600">
          <Wifi className="h-3 w-3" aria-hidden="true" />
          Đang nhận tin theo thời gian thực
        </p>
      )}
    </Sheet>
  );
}
