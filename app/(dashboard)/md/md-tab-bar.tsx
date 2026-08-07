'use client';

import { forwardRef } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';

import { chuCanhBao } from '@/components/ui';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { GROUP_TONE } from '@/components/md/semantic-tone';
import { TABS, GROUPS, TAB_HANG_NGAY, type TabKey } from './md-tabs';

// ============================================================================
// THANH TAB — 13 tab nghiệp vụ, chia BA NHÓM
//
// Tách khỏi `md-client.tsx` ngày 07/08/2026. **Phép dời thuần về hành vi**:
// ⛔ không đổi nghiệp vụ, ⛔ không đổi API, ⛔ không đổi thứ tự tab.
//
// ─── ⚠️ VÌ SAO DỜI, VÀ VÌ SAO CHÚ THÍCH CŨ NÓI NGƯỢC LẠI ────────────────
// Chú thích cũ trong `md-client.tsx` ghi: *"Thanh tab Ở LẠI đây: nó mang nợ
// màu/chữ `TD-07`·`TD-10` đã có, dời sang tệp mới thì bánh cóc đọc ra là nợ
// MỚI."* Điều đó **đúng — nếu dời NGUYÊN VĂN**.
//
// 🔑 Nên bản này ⛔ **không** dời nguyên văn: mọi cỡ chữ và độ đậm nay lấy từ
// `TYPE` / `FONT_WEIGHT` *(thẻ chữ hiến định)*, và mọi sắc lấy từ `GROUP_TONE`.
// Tệp mới ra đời **⛔ không mang một literal nào** ⇒ bánh cóc xanh, và nợ chữ
// của `md-client` **giảm thật** thay vì chỉ đổi chỗ.
//
// ⚠️ `text-rose-400` của biểu tượng cảnh báo cũng đã đi — nó nay dùng
// `GROUP_TONE`… ⛔ **KHÔNG**: sắc cảnh báo ⛔ không thuộc nhóm nào. Nó lấy từ
// `TONE_BADGE.rose` của `components/ui` — xem `lopCanhBao` bên dưới.
//
// ─── VÌ SAO `md-client` PHẢI GẦY ĐI ─────────────────────────────────────
// Bài kiểm ⑤ chặn cứng ở **900 dòng**. Sau khi thêm `BUG-1`/`BUG-5`, tệp đó
// chạm **933**. Sửa bằng **CẤU TRÚC**, ⛔ không bằng cách nới trần — trần ấy
// tồn tại đúng để chặn việc nới nó.
// ============================================================================

export interface MdTabBarProps {
  tab: TabKey;
  onDi: (t: TabKey) => void;
  counts: Record<TabKey, number | null>;
  errorOf: Record<TabKey, string | null>;
  moTabPhu: boolean;
  onMoTabPhu: (v: boolean) => void;
}

/** `forwardRef` vì `md-client` cuộn tới thanh này mỗi lần đổi tab — thanh tab
 *  nằm trên còn khối chỉ số nằm dưới, ⛔ không cuộn thì người dùng bấm một thẻ
 *  chỉ số mà màn hình ⛔ không đổi gì, tưởng nút hỏng. */
const MdTabBar = forwardRef<HTMLDivElement, MdTabBarProps>(function MdTabBar(
  { tab, onDi, counts, errorOf, moTabPhu, onMoTabPhu }, ref,
) {
  return (
    <div ref={ref} className="-mx-1 mb-5 space-y-2 px-1 pt-1">
      {GROUPS.map((g) => {
        // Mỗi nhóm một sắc màu riêng — xem bảng GROUP_TONE và số đo tương phản
        // ở components/md/semantic-tone.ts
        const tone = GROUP_TONE[g];
        return (
          <div key={g} className="flex items-center gap-2">
            <span
              className={`hidden w-24 shrink-0 text-right uppercase lg:block ${TYPE.overline} ${tone.label}`}
            >
              {g}
            </span>
            <div
              role="tablist"
              aria-label={`Nhóm ${g}`}
              className="flex flex-1 gap-1.5 overflow-x-auto pb-1"
            >
              {TABS
                .filter((t) => t.group === g && (moTabPhu || TAB_HANG_NGAY.includes(t.key) || t.key === tab))
                .map((t) => {
                  const on = t.key === tab;
                  const Icon = t.icon;
                  const n = counts[t.key];
                  return (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={on}
                      // Qua `goTab` chứ ⛔ không `setTab` thẳng — `goTab` mới là
                      // chỗ ghi nhớ tab. Hai đường đổi tab mà chỉ một đường ghi
                      // nhớ là đúng cách để `BUG-2` quay lại ở nửa số nút.
                      onClick={() => onDi(t.key)}
                      // ring-inset thay cho border: viền vẽ vào PHÍA TRONG nên
                      // nút ⛔ không đổi kích thước giữa hai trạng thái, hàng
                      // tab ⛔ không nhích qua lại mỗi lần bấm.
                      className={`flex shrink-0 touch-manipulation select-none items-center gap-2 rounded-xl px-3 py-2 transition active:scale-95 ${TYPE.label} ${FONT_WEIGHT.bold} ${
                        on ? tone.active : tone.idle
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="hidden sm:inline">{t.label}</span>
                      <span className="sm:hidden">{t.short}</span>
                      {n !== null && n > 0 && (
                        <span
                          className={`rounded-full px-1.5 tabular-nums ${TYPE.caption} ${FONT_WEIGHT.bold} ${
                            on ? tone.countActive : tone.countIdle
                          }`}
                        >
                          {n}
                        </span>
                      )}
                      {errorOf[t.key] && (
                        <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${chuCanhBao}`} aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })}

      {/* More ▼ — 8 tab theo chu kỳ. Board: *"⛔ Không xoá tab."* */}
      <button
        type="button"
        onClick={() => onMoTabPhu(!moTabPhu)}
        aria-expanded={moTabPhu}
        className={`ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-slate-500 transition hover:bg-slate-100 ${TYPE.label} ${FONT_WEIGHT.bold}`}
      >
        {moTabPhu ? 'Thu gọn' : `More (${TABS.length - TAB_HANG_NGAY.length})`}
        <ChevronDown className={`h-4 w-4 transition ${moTabPhu ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
    </div>
  );
});

export default MdTabBar;
