'use client';

// ============================================================================
// KHỐI GẤP — TẦNG ③ MANAGEMENT, MẶC ĐỊNH THU GỌN
//
// `MD_WORKSPACE_BLUEPRINT_V4.md` §6 + Board Directive *MD V4 Coding* §8–§11:
// Report · Timeline · Analytics · Notification — **đều mặc định thu gọn**, ⛔
// không chiếm First Screen.
//
// ⚠️ **THU GỌN ⛔ KHÔNG PHẢI ẨN.** Tiêu đề và con số **luôn hiện**; chỉ nội
// dung mới gấp. Một khối ẩn hẳn là một khối **⛔ không ai biết là có** — và
// sau ba ngày ⛔ không ai mở nó nữa.
//
// ⚠️ Nội dung **chỉ dựng khi mở**. Gấp bằng CSS thì biểu đồ vẫn render và vẫn
// truy vấn — tức trả đủ giá mà ⛔ không ai xem. Đây là khác biệt giữa *"giấu
// đi"* và *"⛔ chưa làm"*.
// ============================================================================
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';

export default function KhoiGap({
  tieuDe, so, moSan = false, children,
}: {
  tieuDe: string;
  /** Con số/nhãn phụ hiện **ngay cả khi đang gấp**. */
  so?: string;
  moSan?: boolean;
  children: React.ReactNode;
}) {
  const [mo, setMo] = useState(moSan);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${mo ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
        <span className={`flex-1 text-slate-800 ${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>{tieuDe}</span>
        {so && <span className={`tabular-nums text-slate-500 ${TYPE.caption}`}>{so}</span>}
      </button>

      {/* 🔑 Dựng nội dung CHỈ khi mở — xem chú thích đầu tệp. */}
      {mo && <div className="border-t border-slate-100 p-4">{children}</div>}
    </div>
  );
}
