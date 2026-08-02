'use client';

import { useState } from 'react';
import {
  MessageSquare, FileText, Camera, PieChart, History, ListChecks,
  Plus, ImagePlus, Send, Download, CircleDot, Paperclip,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// NGỮ CẢNH ĐƠN HÀNG — SÁU KHỐI BẮT BUỘC TRÊN MỌI MÀN HÌNH ĐƠN HÀNG
//
// Hiến pháp đòi sáu năng lực này có mặt ngay tại nơi người dùng đang làm việc,
// không bắt họ đi tìm ở chỗ khác:
//
//   Thảo luận       Điều 30 · Business Communication
//   Tài liệu        Điều 33 · Documents
//   Bằng chứng      Điều 8  · Evidence First
//   Báo cáo         Điều 29 · Business Reporting
//   Dòng thời gian  Điều 8.6 · Traceability
//   Công việc       Điều 9.3 · Work-Centered Experience
//
// §16.4: *"users shall not need to leave their Workspace to complete related
// business activities"* — đó chính là lý do khối này nằm CẠNH lát cắt nghiệp vụ
// chứ không phải một trang riêng.
//
// ─── ⚠️ ĐÂY LÀ TẦNG TRÌNH BÀY THUẦN ──────────────────────────────────────
// Component KHÔNG gọi API, KHÔNG đọc cơ sở dữ liệu, KHÔNG chứa nghiệp vụ.
// Nó dựng đúng bố cục và trạng thái rỗng để khi tầng dữ liệu được nối vào,
// giao diện không phải vẽ lại. Mọi khối đang ở trạng thái "chưa có dữ liệu" —
// KHÔNG bịa bản ghi nghiệp vụ để trông cho đầy (Playbook Điều XX).
//
// ─── VÌ SAO LÀ MỘT RAIL, KHÔNG PHẢI SÁU TAB NỮA ──────────────────────────
// Thanh lát cắt đã có tối đa tám mục. Thêm sáu tab nữa là mười bốn — người
// dùng mất khả năng quét bằng mắt. Rail tách hai loại thông tin ra hai trục:
// *lát cắt nghiệp vụ* đi ngang, *ngữ cảnh đơn hàng* đi dọc.
//
// ⚠️ Vùng bấm tối thiểu 56px: người vận hành xưởng thao tác bằng ngón tay,
// nhiều khi đeo găng. 44px là ngưỡng tối thiểu của WCAG; ở xưởng nên rộng hơn.
// ============================================================================

type SectionKey = 'chat' | 'documents' | 'evidence' | 'reports' | 'timeline' | 'tasks';

interface Section {
  key: SectionKey;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Ô icon: nền nhạt + chữ đậm cùng dải màu — chuỗi literal, Tailwind JIT */
  tile: string;
  /** Nhãn hành động chính của khối */
  action: string;
  actionIcon: LucideIcon;
  /** Câu nói thật khi chưa có dữ liệu — không bịa bản ghi */
  empty: string;
}

const SECTIONS: Section[] = [
  {
    key: 'chat',
    label: 'Thảo luận',
    hint: 'Trao đổi gắn với đơn hàng này',
    icon: MessageSquare,
    tile: 'bg-violet-50 text-violet-600',
    action: 'Gửi tin nhắn',
    actionIcon: Send,
    empty: 'Chưa có trao đổi nào về đơn hàng này. Mọi thảo luận sẽ được lưu vĩnh viễn làm bằng chứng vận hành.',
  },
  {
    key: 'documents',
    label: 'Tài liệu',
    hint: 'Tech pack · hợp đồng · chứng từ',
    icon: FileText,
    tile: 'bg-blue-50 text-blue-600',
    action: 'Đính kèm tài liệu',
    actionIcon: Paperclip,
    empty: 'Chưa có tài liệu nào gắn với đơn hàng. Tài liệu đính kèm ở đây luôn giữ đúng phiên bản đã duyệt.',
  },
  {
    key: 'evidence',
    label: 'Bằng chứng',
    hint: 'Ảnh · video · chữ ký số',
    icon: Camera,
    tile: 'bg-amber-50 text-amber-600',
    action: 'Chụp / tải ảnh',
    actionIcon: ImagePlus,
    empty: 'Chưa có bằng chứng nào. Mọi hoạt động quan trọng của đơn hàng đều cần bằng chứng xác thực kèm theo.',
  },
  {
    key: 'reports',
    label: 'Báo cáo',
    hint: 'Xuất một chạm, kèm bằng chứng',
    icon: PieChart,
    tile: 'bg-emerald-50 text-emerald-600',
    action: 'Xuất báo cáo',
    actionIcon: Download,
    empty: 'Chưa có báo cáo nào được lập. Báo cáo xuất ra luôn đi kèm bằng chứng gốc để bên nhận kiểm chứng được.',
  },
  {
    key: 'timeline',
    label: 'Dòng thời gian',
    hint: 'Toàn bộ vòng đời đơn hàng',
    icon: History,
    tile: 'bg-slate-100 text-slate-600',
    action: 'Xem đầy đủ',
    actionIcon: CircleDot,
    empty: 'Chưa ghi nhận sự kiện nào. Mỗi mốc của đơn hàng sẽ hiện tại đây theo đúng thứ tự thời gian.',
  },
  {
    key: 'tasks',
    label: 'Công việc',
    hint: 'Việc cần xử lý của đơn này',
    icon: ListChecks,
    tile: 'bg-rose-50 text-rose-600',
    action: 'Thêm công việc',
    actionIcon: Plus,
    empty: 'Không có việc nào tồn đọng cho đơn hàng này.',
  },
];

export default function OrderContextRail() {
  // Mặc định mở Thảo luận: đó là khối người dùng chạm nhiều nhất trong ngày.
  const [open, setOpen] = useState<SectionKey>('chat');
  const active = SECTIONS.find((s) => s.key === open) ?? SECTIONS[0];
  const ActionIcon = active.actionIcon;

  return (
    <aside
      aria-label="Ngữ cảnh đơn hàng"
      className="flex flex-col gap-3 lg:sticky lg:top-[8.5rem] lg:self-start"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Ngữ cảnh đơn hàng
        </h2>

        {/* Sáu nút — mobile xếp lưới 3 cột cho gọn, desktop xếp dọc để đọc nhanh */}
        <div className="grid grid-cols-3 gap-1 p-2 lg:grid-cols-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const on = s.key === open;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setOpen(s.key)}
                aria-pressed={on}
                className={`flex min-h-[56px] touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center transition active:scale-95 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-left ${
                  on ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                    on ? 'bg-white/15 text-white' : s.tile
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span className="min-w-0 lg:flex-1">
                  <span className={`block truncate text-[11px] font-bold lg:text-sm ${on ? 'text-white' : 'text-slate-800'}`}>
                    {s.label}
                  </span>
                  <span className={`hidden truncate text-[11px] font-medium lg:block ${on ? 'text-slate-300' : 'text-slate-400'}`}>
                    {s.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Khung nội dung của khối đang mở */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active.tile}`}>
            <active.icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{active.label}</h3>
        </div>

        <div className="px-4 py-6 text-center">
          <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-500">{active.empty}</p>
        </div>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            className="flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <ActionIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {active.action}
          </button>
        </div>
      </div>
    </aside>
  );
}
