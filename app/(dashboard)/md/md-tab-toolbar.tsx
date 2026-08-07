'use client';

import { Plus, RefreshCw, Sparkles } from 'lucide-react';

import { btnGhost, btnPrimary, SAC_NHOM } from '@/components/ui';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { CREATE_LABEL, TABS, type TabKey } from './md-tabs';

// ============================================================================
// THANH CÔNG CỤ CỦA KHU LÀM VIỆC — tiêu đề tab đang mở + các nút tạo mới
//
// Tách khỏi `md-client.tsx` ngày 08/08/2026, cùng lý do đã tách `md-tab-bar`:
// bài kiểm ⑤ chặn cứng **900 dòng**, và `md-client` chạm **923** sau khi thêm
// Order Master. Sửa bằng **CẤU TRÚC**, ⛔ không bằng cách nới trần.
//
// 🔑 Và như lần trước, đây ⛔ **không** phải phép dời nguyên văn: bốn literal
// cỡ chữ/màu *(`text-sm` · `font-bold` · `tracking-wide` · `text-blue-500`)*
// nay lấy từ `TYPE` / `FONT_WEIGHT` / `SAC_NHOM`. Tệp mới ra đời **⛔ không
// mang một literal nào** ⇒ bánh cóc `TD-07`/`TD-10` xanh, và nợ của
// `md-client` **giảm thật** thay vì chỉ đổi chỗ.
//
// ─── VÌ SAO HAI NÚT "SINH TỰ ĐỘNG" CHỈ HIỆN Ở HAI TAB ───────────────────
// *Vật tư* và *Sản xuất* là hai chỗ DUY NHẤT tính ra được từ dữ liệu đã có
// *(định mức NPL · SAM)*. Ở tab khác, một nút *"sinh tự động"* sẽ ⛔ không có
// gì để tính — bày nó ra là hứa một việc hệ thống ⛔ không làm được.
// ============================================================================

export default function MdTabToolbar({
  tab, dangTai, onTaiLai, onTaoMoi, onSinhTuDong,
}: {
  tab: TabKey;
  dangTai: boolean;
  onTaiLai: () => void;
  onTaoMoi: (t: TabKey) => void;
  onSinhTuDong: (loai: 'material' | 'production') => void;
}) {
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const nhanTao = CREATE_LABEL[tab];
  const coSinhTuDong = tab === 'materials' || tab === 'production';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2 className={`flex items-center gap-2 uppercase text-slate-700 ${TYPE.label} ${FONT_WEIGHT.bold}`}>
        <active.icon className={`h-4 w-4 ${SAC_NHOM.action.chu}`} aria-hidden="true" />
        {active.label}
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btnGhost} onClick={onTaiLai} disabled={dangTai}>
          <RefreshCw className={`h-4 w-4 ${dangTai ? 'animate-spin' : ''}`} aria-hidden="true" /> Tải lại
        </button>

        {/* Hai lối ở tab Vật tư và Sản xuất: sinh tự động hoặc tạo tay */}
        {tab === 'materials' && (
          <button type="button" className={btnPrimary} onClick={() => onSinhTuDong('material')}>
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Sinh từ định mức
          </button>
        )}
        {tab === 'production' && (
          <button type="button" className={btnPrimary} onClick={() => onSinhTuDong('production')}>
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Sinh từ SAM
          </button>
        )}

        {/* ⚠️ Ở hai tab có "sinh tự động", nút tạo TAY hạ xuống hạng phụ
            (`btnGhost`): sinh từ định mức/SAM là đường CHÍNH, nhập tay là ngoại
            lệ. Hai nút cùng cấp là hai nút ⛔ không nút nào nổi. */}
        {nhanTao && (
          <button
            type="button"
            className={coSinhTuDong ? btnGhost : btnPrimary}
            onClick={() => onTaoMoi(tab)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> {nhanTao}
          </button>
        )}
      </div>
    </div>
  );
}
