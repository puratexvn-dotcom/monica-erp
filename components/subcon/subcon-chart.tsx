'use client';

// ============================================================================
// HÀNG CÒN NẰM Ở XƯỞNG NGOÀI — BIỂU ĐỒ CỦA GIA CÔNG NGOÀI
//
// Board 06/08/2026: *"luôn luôn phải là **ưu tiên trực quan, biểu đồ**"*.
//
// 🔑 Câu quan trọng nhất ⛔ không phải *"đã gửi bao nhiêu"* mà là ***"hàng của
// tôi còn nằm ở xưởng ngoài bao nhiêu"*** — hàng đã trả tiền vải, đã trả công
// cắt, và đang **nằm ngoài tầm tay**.
//
// ⚠️ Nạp ĐỘNG từ trang cha — `recharts` ~100 kB.
// ⚠️ Phép tính ở `lib/mos/calculators/subcon-kpi.calculator.ts`, ⛔ không ở
// đây. Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

import { STATUS } from '@/lib/design/tokens';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import {
  cotGiaCong, tongConNgoai, type DonGiaCong,
} from '@/lib/mos/calculators/subcon-kpi.calculator';

export default function SubconChart({ don }: { don: readonly DonGiaCong[] }) {
  const duLieu = cotGiaCong(don).map((d) => ({ ...d, 'Còn ở ngoài': d.conNgoai }));
  const tong = tongConNgoai(don);

  // 🔴 `V.1` — ⛔ KHÔNG vẽ cột 0. "Chưa có đơn gia công nào" ⛔ KHÁC "⛔ không
  // còn hàng nào ở ngoài"; câu sau là một lời trấn an mà ⛔ chưa ai kiểm chứng.
  if (duLieu.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className={`px-4 text-center text-slate-500 ${TYPE.bodySm}`}>
          ⚪ ⛔ Chưa có đơn gia công ngoài nào.
          <br />
          <span className={TYPE.caption}>
            Biểu đồ trống nghĩa là <strong>chưa lập đơn</strong>, ⛔ <strong>không</strong> phải
            đã nhận về hết hàng.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={`text-slate-900 ${TYPE.body} ${FONT_WEIGHT.semibold}`}>
          Hàng gửi đi ⟷ nhận về theo đơn gia công
        </h3>
        {/* Con số MD phải trả lời cho giám đốc, đặt ngay cạnh biểu đồ. */}
        <p className={`${TYPE.bodySm} text-slate-600`}>
          Còn ở xưởng ngoài:{' '}
          <strong className={`tabular-nums ${STATUS.warning.text}`}>{tong.toLocaleString('vi-VN')} sp</strong>
        </p>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={duLieu} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="don" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={48} />
            <YAxis tick={{ fontSize: 11 }} width={52} />
            <Tooltip
              formatter={(v, n) => [`${Number(v).toLocaleString('vi-VN')} sp`, String(n)]}
              labelFormatter={(l, p) => {
                const d = p?.[0]?.payload as { cong?: string } | undefined;
                return `${l}${d?.cong ? ` — ${d.cong}` : ''}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {/* Gửi vẽ NHẠT, nhận vẽ ĐẬM, còn-ở-ngoài vẽ CẢNH BÁO — cột thứ ba
                là thứ duy nhất cần hành động, nên nó phải bắt mắt nhất. */}
            <Bar dataKey="Đã gửi đi" fill={STATUS.draft.chart} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Đã nhận về" fill={STATUS.healthy.chart} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Còn ở ngoài" fill={STATUS.warning.chart} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
