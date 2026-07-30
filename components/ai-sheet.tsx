'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Loader2, Info } from 'lucide-react';

import Sheet from '@/components/sheet';
import { inputCls } from '@/components/ui';
import { ROLE_LABEL, type Role } from '@/lib/rbac';

// ============================================================================
// TRỢ LÝ A.I — khung giao diện chatbot
//
// ─── TRẠNG THÁI THẬT CỦA TÍNH NĂNG NÀY ───────────────────────────────────
// Đây là KHUNG GIAO DIỆN, chưa nối mô hình nào. Dự án hiện không có khoá API
// của bất kỳ nhà cung cấp nào trong biến môi trường, nên không thể gọi thật.
//
// Cố ý KHÔNG dựng câu trả lời giả cho ra vẻ hoạt động: một trợ lý bịa số liệu
// sản xuất còn tệ hơn không có trợ lý — người vận hành sẽ tin và làm theo.
// Thay vào đó, khi bấm gửi hệ thống trả lời thẳng rằng chưa cấu hình, kèm đúng
// việc cần làm.
//
// KHI NỐI THẬT: tạo app/actions/ai-action.ts với 'use server', đọc khoá từ biến
// môi trường KHÔNG có tiền tố NEXT_PUBLIC_ (khoá phải nằm phía máy chủ), rồi
// thay thân hàm ask() bên dưới. Phần giao diện không cần sửa gì.
// ============================================================================

interface AiTurn {
  id: string;
  from: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  'Tổng kết sản lượng hôm nay của bộ phận tôi',
  'PO nào đang trễ tiến độ nhất?',
  'Mã NPL nào sắp hết tồn?',
  'Giải thích cách tính tỷ lệ đạt AQL',
];

export default function AiSheet({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role: Role | null;
}) {
  const [turns, setTurns] = useState<AiTurn[]>([]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [turns.length, thinking]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q) return;

    setTurns((prev) => [...prev, { id: crypto.randomUUID(), from: 'user', text: q }]);
    setText('');
    setThinking(true);

    // Chỗ này sẽ thay bằng lời gọi Server Action khi có khoá API.
    // Hiện trả lời trung thực là chưa cấu hình, không bịa nội dung.
    await new Promise((r) => setTimeout(r, 400));

    setTurns((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        from: 'bot',
        text:
          'Trợ lý A.I chưa được kết nối với mô hình nào nên tôi chưa trả lời được câu này.\n\n' +
          'Để bật: thêm khoá API vào biến môi trường phía máy chủ (tên biến KHÔNG có tiền tố ' +
          'NEXT_PUBLIC_), rồi nối vào app/actions/ai-action.ts. Giao diện này đã sẵn sàng, ' +
          'không cần sửa thêm.\n\n' +
          'Tôi cố ý không tự dựng câu trả lời: một trợ lý bịa số liệu sản xuất thì nguy hiểm ' +
          'hơn là không có trợ lý.',
      },
    ]);
    setThinking(false);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Trợ lý A.I"
      size="full"
      subtitle={role ? `Bối cảnh: ${ROLE_LABEL[role]}` : 'Chưa đăng nhập'}
      footer={
        <div className="mx-auto flex w-full min-w-0 max-w-3xl gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void ask(text);
              }
            }}
            placeholder="Hỏi trợ lý về sản lượng, tiến độ, tồn kho..."
            className={`${inputCls} min-w-0 flex-1 text-base sm:text-sm`}
          />
          <button
            type="button"
            onClick={() => void ask(text)}
            disabled={!text.trim() || thinking}
            aria-label="Gửi câu hỏi"
            className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-40"
          >
            {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      }
    >
      {/* Nói rõ trạng thái ngay từ đầu, đừng để người dùng hỏi rồi mới biết */}
      <p className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-5 py-2.5 text-[11px] font-semibold leading-relaxed text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Chưa kết nối mô hình A.I — cần thêm khoá API phía máy chủ. Giao diện đã sẵn sàng.
      </p>

      <div className="mx-auto max-w-3xl space-y-3 p-4">
        {turns.length === 0 ? (
          <div className="py-6">
            <div className="mb-5 flex flex-col items-center gap-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Sparkles className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="text-sm font-bold text-slate-800">Trợ lý sản xuất Monica</p>
              <p className="max-w-xs text-xs leading-relaxed text-slate-500">
                Hỏi về sản lượng, tiến độ đơn hàng, tồn kho hoặc nhờ tổng kết ca làm việc.
              </p>
            </div>

            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void ask(s)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((t) => (
            <div key={t.id} className={t.from === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  t.from === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {t.text}
              </div>
            </div>
          ))
        )}

        {thinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </Sheet>
  );
}
