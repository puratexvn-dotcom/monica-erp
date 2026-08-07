'use client';

// ============================================================================
// ĐƠN ĐANG DỒN Ở KHÂU NÀO — BIỂU ĐỒ PHÂN BỐ THEO CHẶNG
//
// Board 06/08/2026: *"luôn luôn phải là **ưu tiên trực quan, biểu đồ**"*.
//
// ─── 🔑 BẢNG TRẢ LỜI "ĐƠN NÀY Ở ĐÂU", BIỂU ĐỒ TRẢ LỜI "CẢ XƯỞNG Ở ĐÂU" ──
// Bảng *"Đơn hàng đang ở đâu?"* đọc theo **chiều dọc từng đơn** — muốn biết
// khâu nào đang **nghẽn** thì phải đếm tay 14 dòng. Biểu đồ này đếm sẵn: cột
// nào cao nhất là chỗ hàng đang **ứ**, và đó là việc MD phải gỡ **hôm nay**.
//
// 🔑 Phép đếm nằm ở `demTheoChang()` trong `lib/mos/md/order-journey.ts` — hàm
// thuần đã có sẵn *(⛔ chưa màn hình nào dùng)*. Màn hình này CHỈ vẽ: cùng con
// số đó rồi sẽ lên bảng tổng của giám đốc, ⛔ không được đếm lại theo cách khác.
//
// ⚠️ Nạp ĐỘNG từ trang cha — `recharts` ~100 kB, ⛔ không vào gói tải lần đầu.
// Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

import { STATUS, CHART_PALETTE } from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
import {
  demTheoChang, CHANG, CHANG_LABEL,
  type Chang, type HanhTrinh,
} from '@/lib/mos/md/order-journey';

export default function JourneyStageChart({ ds }: { ds: readonly HanhTrinh[] }) {
  const dem = demTheoChang([...ds]);
  const duLieu = CHANG.map((c, i) => ({
    chang: CHANG_LABEL[c as Chang],
    sl: dem[c as Chang],
    mau: CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  // 🔴 Cột CAO NHẤT tô màu cảnh báo — chỗ ứ hàng phải **tự nhảy ra**, ⛔ không
  // bắt người xem so chiều cao. Chỉ tô khi thật sự có đỉnh (⛔ không phải khi
  // mọi cột bằng nhau — lúc đó ⛔ không có chỗ ứ nào để chỉ).
  const dinh = Math.max(...duLieu.map((d) => d.sl));
  const coDinh = dinh > 0 && duLieu.filter((d) => d.sl === dinh).length === 1;

  // ⛔ KHÔNG vẽ sáu cột 0 — `V.1`. "⛔ Không đơn nào đang chạy" ⛔ KHÁC "⛔ chưa
  // đo được", nên chỗ này nói đúng cái đang xảy ra thay vì vẽ biểu đồ phẳng.
  if (dinh === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className={`px-4 text-center text-slate-500 ${TYPE.bodySm}`}>
          ⚪ ⛔ Không đơn nào đang đứng ở một chặng đo được.
          <br />
          <span className={TYPE.caption}>
            Đơn đã đóng, hoặc <strong>chưa có chứng từ nào</strong> để định vị.
          </span>
        </p>
      </div>
    );
  }

  return (
    // 🔴 Board *MD V5* §9 *"giảm chiều cao toàn trang thêm"*: `h-52` (208px)
    // → `h-36` (144px).
    //
    // 🔑 Biểu đồ này có **sáu cột và một trục** — nó ⛔ không cần 208px để đọc
    // được, và 64px tiết kiệm ở đây trả thẳng cho **bảng hành trình bên dưới**,
    // nơi mỗi dòng là một đơn hàng thật. Ưu tiên **dòng dữ liệu** hơn **khoảng
    // trống trong biểu đồ**.
    <div className="h-36 w-full rounded-xl border border-slate-200 bg-white p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={duLieu} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="chang" tick={{ fontSize: 11 }} interval={0} />
          <YAxis tick={{ fontSize: 11 }} width={36} allowDecimals={false} />
          <Tooltip formatter={(v) => [`${v} đơn`, 'Đang đứng ở đây']} />
          <Bar dataKey="sl" radius={[6, 6, 0, 0]}>
            {duLieu.map((d) => (
              <Cell
                key={d.chang}
                fill={coDinh && d.sl === dinh ? STATUS.warning.chart : d.mau}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
