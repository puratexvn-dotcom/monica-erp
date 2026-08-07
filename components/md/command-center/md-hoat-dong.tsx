'use client';

// ============================================================================
// RECENT ACTIVITY — ĐÁY CỘT TRÁI
//
// Board Directive 07/08/2026 *(MD Home V2)* §3: *"Recent Activity — **đưa
// xuống cuối cột**."*
//
// ─── 🔑 NẠP KHI CẦN, ⛔ KHÔNG NẠP SẴN ───────────────────────────────────
// Nhật ký ⛔ **không** phải thứ MD mở máy để đọc — nó là thứ MD tra **khi ngờ
// ai đó vừa đổi gì**. Nạp sẵn nó ở mỗi lần mở trang là thêm **một truy vấn
// CSDL vào đường chặn**, đúng thứ vừa mất công gỡ khỏi trang chủ *(TTFB 901 →
// 74 ms)*.
//
// ⇒ Mặc định hiện **một nút**; bấm mới nạp. Sau khi nạp thì hiện 5 dòng gần
// nhất ngay tại chỗ, ⛔ không bắt nhảy sang tab khác.
//
// ⚠️ Nạp xong mà **rỗng** thì nói *"⛔ chưa ghi nhận thao tác nào"* — ⛔ KHÔNG
// im lặng quay về nút bấm. Im lặng thì người dùng tưởng nút hỏng và bấm lại.
//
// ⚠️ Màu/cỡ chữ từ thẻ chuẩn — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import { useState, useTransition } from 'react';
import { History, Loader2, ArrowUpRight } from 'lucide-react';

import { STATUS } from '@/lib/design/tokens';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { btnGhost, loiDiChu } from '@/components/ui';

export interface DongHoatDong {
  id: number;
  entity_type: string;
  action: string;
  actor_name: string | null;
  created_at: string;
}

const SO_DONG = 5;

export default function MdHoatDong({
  nap, moTab,
}: {
  /** Hàm nạp nhật ký — truyền từ trang, client ⛔ không tự gọi CSDL. */
  nap: () => Promise<{ rows: DongHoatDong[]; error: string | null }>;
  /** Mở tab Nhật ký đầy đủ. */
  moTab: () => void;
}) {
  const [dangNap, batDau] = useTransition();
  const [kq, setKq] = useState<{ rows: DongHoatDong[]; error: string | null } | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className={`flex items-center gap-2 text-slate-900 ${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>
          <History className="h-4 w-4" aria-hidden="true" />
          Hoạt động gần đây
        </h3>
        {kq && (
          <button type="button" onClick={moTab} className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${loiDiChu} ${TYPE.caption} ${FONT_WEIGHT.semibold}`}>
            Xem đủ <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>

      {kq === null ? (
        <button
          type="button"
          className={btnGhost}
          disabled={dangNap}
          onClick={() => batDau(async () => setKq(await nap()))}
        >
          {dangNap
            ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang nạp…</>
            : <><History className="h-4 w-4" aria-hidden="true" /> Nạp nhật ký</>}
        </button>
      ) : kq.error ? (
        // ⚠️ Màu lấy từ thẻ `STATUS`, ⛔ không viết `text-rose-700` thẳng —
        // bánh cóc `TD-07` chặn tệp MỚI, và nó chặn đúng.
        <p role="alert" className={`${STATUS.critical.text} ${TYPE.caption}`}>⛔ {kq.error}</p>
      ) : kq.rows.length === 0 ? (
        <p className={`text-slate-500 ${TYPE.caption}`}>
          ⚪ ⛔ Chưa ghi nhận thao tác nào.
        </p>
      ) : (
        <ul className="space-y-2">
          {kq.rows.slice(0, SO_DONG).map((r) => (
            <li key={r.id} className={`flex items-baseline gap-2 ${TYPE.caption}`}>
              <span className="shrink-0 tabular-nums text-slate-400">
                {r.created_at.slice(11, 16)}
              </span>
              <span className="min-w-0 text-slate-700">
                <strong>{r.actor_name ?? '⛔ không rõ người'}</strong> · {r.action} {r.entity_type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
