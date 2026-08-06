'use client';

// ============================================================================
// PHỄU HOÀN THÀNH — BIỂU ĐỒ CỦA TỔ HOÀN THÀNH
//
// Board 06/08/2026: *"luôn luôn phải là **ưu tiên trực quan, biểu đồ**"*.
//
// ─── 🔑 VÌ SAO LÀ PHỄU, ⛔ KHÔNG PHẢI BỐN CON SỐ RỜI ────────────────────
// Bốn khâu *(cắt chỉ → ủi → kiểm cuối đạt → lỗi)* là **một dòng chảy**: hàng
// vào khâu sau phải ⛔ **không nhiều hơn** khâu trước. Bày bốn con số rời thì
// mắt phải tự so từng cặp mới thấy chỗ **nghẽn**; xếp thành phễu thì chỗ tụt
// **nhìn thấy ngay** — và đó chính là câu tổ trưởng hỏi mỗi giờ.
//
// ⚠️ Cột **lỗi** cố ý vẽ MÀU NGUY CẤP, ⛔ không cùng màu với ba khâu kia: nó
// ⛔ không phải một bước của phễu, nó là **phần rơi ra khỏi phễu**.
//
// ⚠️ Nạp ĐỘNG từ trang cha — `recharts` ~100 kB, ⛔ không vào gói tải lần đầu.
// Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

import { STATUS } from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
// 🔴 Phép cộng nằm ở `lib/`, ⛔ KHÔNG ở màn hình. Bản đầu tôi cộng ngay trong
// component và bài kiểm *"màn hình MỚI ⛔ không được tự tính"* chặn ngay — đúng
// lúc: cùng bốn con số này còn xuất hiện ở KPI Command Center và báo cáo ngày
// của MD, mỗi nơi tự cộng là mỗi nơi có cơ hội cộng khác đi.
import { pheuHoanThanh, type DongBoHoanThanh } from '@/lib/mos/calculators/hoan-thanh-kpi.calculator';

export type DongHoanThanh = DongBoHoanThanh;

export default function FinishingChart({ rows }: { rows: readonly DongHoanThanh[] }) {
  const duLieu = pheuHoanThanh(rows).map((k) => ({
    ...k,
    mau: k.laLoi ? STATUS.critical.chart
      : k.khau === 'Kiểm cuối đạt' ? STATUS.healthy.chart
      : STATUS.inProgress.chart,
  }));

  // ⛔ KHÔNG vẽ phễu toàn số 0 — `V.1`. Bốn cột cao bằng 0 trông như *"làm được
  // 0"*, trong khi sự thật là *"chưa ai ghi nhật ký hoàn thành"*.
  if (duLieu.every((d) => d.sl === 0)) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className={`px-4 text-center text-slate-500 ${TYPE.bodySm}`}>
          ⚪ Hôm nay <strong>chưa ghi nhật ký hoàn thành nào</strong>.
          <br />
          <span className={TYPE.caption}>
            Phễu trống nghĩa là <strong>chưa có báo cáo</strong>,
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
          <XAxis dataKey="khau" tick={{ fontSize: 11 }} interval={0} />
          <YAxis tick={{ fontSize: 11 }} width={44} />
          <Tooltip formatter={(v) => [`${v} sp`, 'Số lượng']} />
          <Bar dataKey="sl" radius={[6, 6, 0, 0]}>
            {duLieu.map((d) => <Cell key={d.khau} fill={d.mau} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
