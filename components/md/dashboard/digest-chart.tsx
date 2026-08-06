'use client';

// ============================================================================
// BIỂU ĐỒ CỦA BÁO CÁO NGÀY
//
// Tách khỏi thẻ báo cáo để **nạp động** — `recharts` nặng ~100 kB và ⛔ không
// được nằm trong gói tải lần đầu *(Board vừa yêu cầu tối ưu khởi động: FCP
// 1.29s → 0.58s, ⛔ đừng phá lại thành quả đó)*.
//
// ─── 🔴 ⛔ KHÔNG VẼ CỘT CHO CHỈ SỐ "⚪ CHƯA ĐO ĐƯỢC" ─────────────────────
// `V.1`. Cột cao bằng 0 trông y hệt *"hôm nay làm được 0 sản phẩm"*, trong khi
// sự thật là *"chưa ai báo cáo"*. Vẽ nhầm là để biểu đồ **nói dối sếp** — và
// biểu đồ nói dối thì nguy hơn bảng số nói dối, vì ⛔ không ai đọc kỹ biểu đồ.
//
// ⇒ Chỉ số `null` bị **lọc khỏi dữ liệu vẽ**, và phần thiếu được nói bằng chữ
// ở thẻ bên cạnh.
//
// ⚠️ Màu lấy từ `lib/design/tokens.ts`, ⛔ không viết mã màu thẳng — bánh cóc
// `TD-07` (Hiến pháp Điều 44.6: màu là THÔNG TIN, ⛔ không phải trang trí).
// ============================================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

import { CHART_PALETTE } from '@/lib/design/tokens';
// ⚠️ Cỡ chữ lấy từ THANG CHỮ HIẾN ĐỊNH, ⛔ không viết `text-sm` thẳng —
// bánh cóc `TD-10` (Quyết nghị Board 03/08/2026).
import { TYPE } from '@/lib/design/typography';
import type { ChiSo } from '@/lib/mos/md/daily-digest';

export default function DigestChart({ chiSo }: { chiSo: ChiSo[] }) {
  // ⛔ KHÔNG vẽ chỉ số chưa đo được — xem khối chú thích đầu tệp.
  const duLieu = chiSo
    .filter((c) => c.gia !== null)
    .map((c) => ({ ten: rutGon(c.nhan), gia: c.gia as number, donVi: c.donVi }));

  if (duLieu.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50 text-center">
        <p className={`px-4 text-slate-500 ${TYPE.bodySm}`}>
          ⚪ Chưa có số liệu nào để vẽ.
          <br />
          <span className={TYPE.caption}>
            Biểu đồ trống ở đây nghĩa là <strong>chưa ai báo cáo</strong>,
            ⛔ <strong>không</strong> phải mọi chỉ số bằng 0.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={duLieu} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="ten" tick={{ fontSize: 11 }} interval={0} />
          <YAxis tick={{ fontSize: 11 }} width={44} />
          {/* ⚠️ `recharts` khai kiểu giá trị là `ValueType | undefined`, ⛔ không
              phải `number` — ép kiểu ở đây sẽ giấu mất trường hợp `undefined`
              và cho ra chữ `undefined` trên tooltip. Kiểm tường minh thay vì ép. */}
          <Tooltip
            formatter={(v, _n, p) => {
              const so = typeof v === 'number' ? v.toLocaleString('vi-VN') : '⚪';
              const dv = (p?.payload as { donVi?: string } | undefined)?.donVi ?? '';
              return [`${so} ${dv}`.trim(), 'Giá trị'];
            }}
          />
          <Bar dataKey="gia" radius={[6, 6, 0, 0]}>
            {duLieu.map((d, i) => (
              <Cell key={d.ten} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Nhãn trục X phải ĐỌC ĐƯỢC ở khổ điện thoại — tên dài bị cắt chồng lên nhau. */
function rutGon(s: string): string {
  return s
    .replace('Sản lượng nội bộ', 'Nội bộ')
    .replace('Sản lượng gia công ngoài', 'Gia công')
    .replace('Tỉ lệ lỗi (QA kiểm)', 'Lỗi %')
    .replace('Đạt kế hoạch', 'Đạt KH');
}
