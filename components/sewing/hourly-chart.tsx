'use client';

// ============================================================================
// SẢN LƯỢNG THEO GIỜ — BIỂU ĐỒ CỦA TỔ TRƯỞNG
//
// Board 06/08/2026: *"luôn luôn phải là **ưu tiên trực quan, biểu đồ**"*.
//
// ─── 🔑 VÌ SAO TỔ TRƯỞNG CẦN BIỂU ĐỒ, ⛔ KHÔNG PHẢI BẢNG ────────────────
// Bảng nhật ký trả lời *"giờ nào báo bao nhiêu"*. Biểu đồ trả lời câu tổ
// trưởng thật sự hỏi: ***"chuyền đang tụt ở giờ nào"*** — và trả lời trong
// **một cái liếc**, giữa lúc đứng ở chuyền chứ ⛔ không ngồi bàn.
//
// Hai cột cạnh nhau *(mục tiêu ⟷ thực tế)* làm khoảng hụt **nhìn thấy được**.
// Cùng con số đó nằm trong bảng thì phải trừ nhẩm từng dòng.
//
// ⚠️ Nạp ĐỘNG từ trang cha — `recharts` ~100 kB, ⛔ không được nằm trong gói
// tải lần đầu *(Board vừa yêu cầu tối ưu khởi động)*.
//
// ⚠️ Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

import { STATUS } from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';

export interface DongGio {
  time_slot: string;
  target_qty: number;
  actual_qty: number;
}

export default function HourlyChart({ rows }: { rows: readonly DongGio[] }) {
  // Nhật ký trả về mới-nhất-trước; biểu đồ phải đọc theo **chiều thời gian**.
  const duLieu = [...rows]
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    .map((r) => ({
      gio: r.time_slot,
      'Mục tiêu': Number(r.target_qty) || 0,
      'Thực tế': Number(r.actual_qty) || 0,
    }));

  if (duLieu.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className={`px-4 text-center text-slate-500 ${TYPE.bodySm}`}>
          ⚪ Hôm nay chuyền <strong>chưa báo giờ nào</strong>.
          <br />
          <span className={TYPE.caption}>
            Biểu đồ trống nghĩa là <strong>chưa có báo cáo</strong>,
            ⛔ <strong>không</strong> phải sản lượng bằng 0.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="h-56 w-full rounded-xl border border-slate-200 bg-white p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={duLieu} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="gio" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={46} />
          <YAxis tick={{ fontSize: 11 }} width={44} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {/* Mục tiêu vẽ NHẠT phía sau, thực tế vẽ ĐẬM phía trước — mắt bắt
              ngay cột nào hụt so với cột nào. */}
          <Bar dataKey="Mục tiêu" fill={STATUS.draft.chart} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Thực tế" fill={STATUS.inProgress.chart} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
