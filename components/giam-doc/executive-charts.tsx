'use client';

// ============================================================================
// HAI BIỂU ĐỒ CỦA BÀN PRODUCTION DIRECTOR
//
// Board 06/08/2026: *"luôn luôn phải là **ưu tiên trực quan, biểu đồ**"*.
//
// ① **NÚT THẮT WIP THEO PO** — cắt · may · đang kẹt, ba cột cạnh nhau.
//    Bảng cũ bắt đọc từng dòng rồi tự trừ. Ba cột cạnh nhau làm khoảng hụt
//    *(cắt rồi mà chưa may)* **nhìn thấy được** — đó chính là tiền đang nằm
//    chết trên sàn.
//
// ② **TỶ LỆ LỖI THEO CHUYỀN** — kèm **đường ngưỡng**. Một dãy số phần trăm
//    ⛔ không cho biết cái nào đáng lo; một đường kẻ ngang thì có. Cột vượt
//    ngưỡng tô màu nguy cấp, ⛔ không để giám đốc tự dò.
//
// ⚠️ Nạp ĐỘNG từ trang cha — `recharts` ~100 kB.
// ⚠️ Phép tính ở `lib/mos/calculators/dieu-hanh-kpi.calculator.ts`, ⛔ không ở
// đây. Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

import { STATUS } from '@/lib/design/tokens';
import { TYPE } from '@/lib/design/typography';
import {
  cotNutThat, cotLoiChuyen,
  type DongNutThat, type DongLoiChuyen,
} from '@/lib/mos/calculators/dieu-hanh-kpi.calculator';

const NGUONG_LOI = 3;

function Trong({ chu, phu }: { chu: string; phu: string }) {
  // 🔴 `V.1` — ⛔ KHÔNG vẽ biểu đồ toàn số 0. Cột phẳng đọc thành *"mọi thứ
  // bằng 0"*, trong khi sự thật thường là *"chưa ai báo cáo"*. Hai câu đó dẫn
  // tới hai quyết định trái ngược của giám đốc.
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
      <p className={`px-4 text-center text-slate-500 ${TYPE.bodySm}`}>
        ⚪ {chu}
        <br />
        <span className={TYPE.caption}>{phu}</span>
      </p>
    </div>
  );
}

export function BieuDoNutThat({ rows }: { rows: readonly DongNutThat[] }) {
  const duLieu = cotNutThat(rows);
  if (duLieu.length === 0) {
    return <Trong chu="Chưa có PO nào đang nghẽn." phu="⛔ Không có nút thắt, hoặc chưa tổ nào báo sản lượng." />;
  }
  return (
    <div className="h-64 w-full rounded-xl border border-slate-200 bg-white p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={duLieu} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="po" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={48} />
          <YAxis tick={{ fontSize: 11 }} width={52} />
          <Tooltip formatter={(v, n) => [`${Number(v).toLocaleString('vi-VN')} sp`, String(n)]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {/* Cắt vẽ NHẠT (đã qua), may vẽ ĐẬM (đang chạy), kẹt vẽ CẢNH BÁO. */}
          <Bar dataKey="Đã cắt" fill={STATUS.draft.chart} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Đã may" fill={STATUS.inProgress.chart} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Đang kẹt" fill={STATUS.warning.chart} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BieuDoLoiChuyen({ rows }: { rows: readonly DongLoiChuyen[] }) {
  const duLieu = cotLoiChuyen(rows, NGUONG_LOI);
  if (duLieu.length === 0) {
    return <Trong chu="Chưa chuyền nào có biên bản kiểm." phu="Biểu đồ trống nghĩa là chưa ai kiểm, ⛔ không phải chưa có lỗi." />;
  }
  return (
    <div className="h-64 w-full rounded-xl border border-slate-200 bg-white p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={duLieu} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="chuyen" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={48} />
          <YAxis tick={{ fontSize: 11 }} width={44} unit="%" />
          <Tooltip
            formatter={(v, _n, p) => {
              const d = p?.payload as { kiem?: number; loi?: number } | undefined;
              return [`${v}%  (${d?.loi ?? 0} lỗi / ${d?.kiem ?? 0} kiểm)`, 'Tỷ lệ lỗi'];
            }}
          />
          {/* 🔑 ĐƯỜNG NGƯỠNG — thứ biến một dãy số thành một phán quyết. */}
          <ReferenceLine
            y={NGUONG_LOI}
            stroke={STATUS.critical.chart}
            strokeDasharray="4 4"
            label={{ value: `ngưỡng ${NGUONG_LOI}%`, position: 'right', fontSize: 10 }}
          />
          <Bar dataKey="ti" radius={[6, 6, 0, 0]}>
            {duLieu.map((d) => (
              <Cell key={d.chuyen} fill={d.vuot ? STATUS.critical.chart : STATUS.healthy.chart} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
