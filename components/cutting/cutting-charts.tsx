'use client';

// ============================================================================
// HAI BIỂU ĐỒ CỦA TỔ CẮT
//
// Board 06/08/2026: *"luôn luôn phải là **ưu tiên trực quan, biểu đồ**"*.
//
// ① **Kế hoạch ⟷ Thực cắt** — bàn nào cắt thiếu.
// ② **Hao hụt vải theo phiếu (%)** — bàn nào ăn vải. Vải chiếm phần lớn giá
//    thành một mã hàng, và chênh vài phần trăm giữa các bàn thì ⛔ không ai
//    nhìn ra bằng mắt thường giữa ca.
//
// ⚠️ Nạp ĐỘNG từ trang cha — `recharts` ~100 kB.
// ⚠️ Phép tính ở `lib/mos/calculators/cat-kpi.calculator.ts`, ⛔ không ở đây.
// Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';

import { STATUS } from '@/lib/design/tokens';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import {
  cotPhieuCat, cotHaoHutCat, ngayVeCat, type PhieuCat,
} from '@/lib/mos/calculators/cat-kpi.calculator';
import { ngayVN, hienThiVN } from '@/lib/time';

function Trong({ chu, phu }: { chu: string; phu: string }) {
  // 🔴 `V.1` — ⛔ KHÔNG vẽ cột 0. "Chưa lập phiếu nào" ⛔ KHÁC "cắt được 0".
  return (
    <div className="flex h-52 items-center justify-center rounded-xl border border-slate-200 bg-white">
      <p className={`px-4 text-center text-slate-500 ${TYPE.bodySm}`}>
        ⚪ {chu}
        <br />
        <span className={TYPE.caption}>{phu}</span>
      </p>
    </div>
  );
}

const tieuDe = `mb-2 text-slate-900 ${TYPE.body} ${FONT_WEIGHT.semibold}`;

export default function CuttingCharts({ tickets }: { tickets: readonly PhieuCat[] }) {
  // 🔑 Hôm nay nếu có phiếu; ⛔ không thì ngày cắt GẦN NHẤT — và **nói rõ ngày
  // nào** ngay trên tiêu đề. Nhà máy ⛔ không cắt mỗi ngày; một hộp trống mỗi
  // sáng thì tổ trưởng thôi nhìn sau đúng ba hôm.
  const ngay = ngayVeCat(tickets);
  const sanLuong = cotPhieuCat(tickets, ngay);
  const hao = cotHaoHutCat(tickets, ngay);
  const nhan = ngay === null
    ? ''
    : ngay === ngayVN()
      ? ' hôm nay'
      : ` ngày ${hienThiVN(`${ngay}T12:00:00Z`).split(' ').at(-1) ?? ngay}`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div>
        <h3 className={tieuDe}>Kế hoạch ⟷ Thực cắt{nhan}</h3>
        {sanLuong.length === 0 ? (
          <Trong chu="⛔ Chưa có phiếu cắt nào." phu="Biểu đồ trống nghĩa là chưa lập phiếu, ⛔ không phải cắt được 0." />
        ) : (
          <div className="h-52 w-full rounded-xl border border-slate-200 bg-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sanLuong} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="phieu" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={46} />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip formatter={(v, n) => [`${Number(v).toLocaleString('vi-VN')} sp`, String(n)]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {/* Kế hoạch vẽ NHẠT phía sau, thực cắt vẽ ĐẬM phía trước —
                    khoảng hụt hiện ra mà ⛔ không phải trừ nhẩm. */}
                <Bar dataKey="Kế hoạch" fill={STATUS.draft.chart} radius={[4, 4, 0, 0]} />
                {/* ⚠️ `fill` vẫn phải khai dù mỗi cột đã có `<Cell>` riêng — ô
                    màu trong CHÚ GIẢI đọc `fill` của `<Bar>`; thiếu nó thì chú
                    giải hiện ô ĐEN và người đọc ⛔ không tra được màu nào là gì. */}
                <Bar dataKey="Thực cắt" fill={STATUS.healthy.chart} radius={[4, 4, 0, 0]}>
                  {sanLuong.map((d) => (
                    <Cell key={d.phieu} fill={d.thieu > 0 ? STATUS.warning.chart : STATUS.healthy.chart} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div>
        <h3 className={tieuDe}>Hao hụt vải theo phiếu (%){nhan}</h3>
        {hao.length === 0 ? (
          <Trong chu="⛔ Chưa phiếu nào ghi số mét vải." phu="⛔ Không có mét vải thì ⛔ không tính được hao hụt." />
        ) : (
          <div className="h-52 w-full rounded-xl border border-slate-200 bg-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hao} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="phieu" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={46} />
                <YAxis tick={{ fontSize: 11 }} width={48} unit="%" />
                <Tooltip
                  formatter={(v, _n, p) => {
                    const d = p?.payload as { daTrai?: number; dauTam?: number; vaiLoi?: number } | undefined;
                    return [`${v}%  (trải ${d?.daTrai ?? 0}m · đầu tấm ${d?.dauTam ?? 0}m · lỗi ${d?.vaiLoi ?? 0}m)`, 'Hao hụt'];
                  }}
                />
                {/* ⚠️ MỘT MÀU DUY NHẤT, ⛔ KHÔNG tô theo ngưỡng: **⛔ chưa có
                    ngưỡng hao hụt nào được Board phê duyệt**. Tự đặt một con số
                    rồi tô đỏ là để phần mềm phán quyết thay Board — `G-6`. */}
                <Bar dataKey="hao" fill={STATUS.inProgress.chart} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
