'use client';

// ============================================================================
// ⑦ TODAY'S FOCUS + ⑧ DAILY ACHIEVEMENT
//
// Board Directive 07/08/2026 *(MD v1.0 Final Polish)* §7–§8:
//
//   > *"Khi mở Workspace, MD biết ngay: **hôm nay tôi phải hoàn thành điều
//   > gì**." · "⛔ Không cần gamification. Chỉ tạo cảm giác tiến bộ."*
//
// ─── 🔑 VÌ SAO HAI KHỐI NÀY ĐỨNG CẠNH NHAU ──────────────────────────────
// *"Phải làm gì"* và *"đã xong tới đâu"* là **hai nửa của một câu**. Tách ra
// hai chỗ trên màn hình thì MD phải tự ghép — mà đó đúng là việc phần mềm nên
// làm hộ.
//
// ⚠️ Thanh tiến độ đo **số nguồn báo cáo đã gom đủ**, ⛔ KHÔNG đo *"đã tick
// xong bao nhiêu ô"*. Lý do đầy đủ ở `lib/mos/md/daily-focus.ts` — tóm tắt:
// mọi bảng nuôi hộp thư việc đang RỖNG, nên một mẫu số kiểu *"6/9"* sẽ là
// **bịa**, và một thanh tiến độ bịa còn tệ hơn ⛔ không có thanh nào.
//
// ⚠️ Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import { Target, ArrowUpRight, CheckCircle2, CircleDashed } from 'lucide-react';

import { STATUS } from '@/lib/design/tokens';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import type { BaoCaoNgay, DichCanhBao } from '@/lib/mos/md/daily-digest';
import { tieuDiemHomNay, tienDoNgay } from '@/lib/mos/md/daily-focus';
// ⚠️ Lớp lối-đi lấy từ `components/ui`, ⛔ không viết màu thẳng — bánh cóc TD-07.
import { loiDiChu } from '@/components/ui';

const SO_THU_TU = ['①', '②', '③', '④', '⑤'];

export default function MdDailyFocus({
  bc, onDi,
}: {
  bc: BaoCaoNgay;
  onDi: (dich: DichCanhBao) => void;
}) {
  const tieuDiem = tieuDiemHomNay(bc);
  const td = tienDoNgay(bc);
  const xong = td.daNhan === td.tong;

  return (
    <section aria-label="Tiêu điểm hôm nay" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* ─── ⑦ TODAY ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
        <h2 className={`mb-3 flex items-center gap-2 text-slate-900 ${TYPE.body} ${FONT_WEIGHT.semibold}`}>
          <Target className="h-4 w-4" aria-hidden="true" />
          Hôm nay cần chốt
        </h2>

        {tieuDiem.length === 0 ? (
          <p className={`text-slate-500 ${TYPE.bodySm}`}>
            ⛔ Không có việc nào phải chốt gấp hôm nay.
            <br />
            <span className={TYPE.caption}>
              Hệ thống vẫn theo dõi — mọi cảnh báo mới sẽ hiện ở khu <strong>Vấn đề cần xử lý</strong>.
            </span>
          </p>
        ) : (
          <ol className="space-y-2.5">
            {tieuDiem.map((v, i) => (
              <li key={`${i}-${v.viec}`} className="flex items-start gap-3">
                <span className={`shrink-0 tabular-nums ${TYPE.body} ${v.nguyCap ? STATUS.critical.text : 'text-slate-400'}`}>
                  {SO_THU_TU[i]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-slate-900 ${TYPE.bodySm} ${FONT_WEIGHT.medium}`}>{v.viec}</span>
                  <span className={`block text-slate-500 ${TYPE.caption}`}>{v.vi}</span>
                </span>
                {/* ⛔ KHÔNG vẽ nút cho việc làm NGOÀI hệ thống (gọi buyer, nhắc
                    tổ trưởng). Một nút bấm vào ⛔ không xảy ra gì còn tệ hơn ⛔
                    không có nút. */}
                {v.dich && (
                  <button
                    type="button"
                    onClick={() => onDi(v.dich as DichCanhBao)}
                    className={`inline-flex shrink-0 items-center gap-1 px-2 py-1 ${loiDiChu} ${TYPE.caption} ${FONT_WEIGHT.semibold}`}
                  >
                    Mở <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ─── ⑧ ĐÃ XONG TỚI ĐÂU ──────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${xong ? `${STATUS.healthy.chip} border` : 'border-slate-200 bg-white'}`}>
        <h2 className={`mb-1 flex items-center gap-2 ${TYPE.body} ${FONT_WEIGHT.semibold} ${xong ? '' : 'text-slate-900'}`}>
          {xong
            ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            : <CircleDashed className="h-4 w-4" aria-hidden="true" />}
          Báo cáo hôm nay
        </h2>

        <p className={`tabular-nums ${TYPE.display} ${FONT_WEIGHT.bold} ${xong ? STATUS.healthy.text : 'text-slate-900'}`}>
          {td.daNhan}
          <span className={`text-slate-400 ${TYPE.sectionTitle}`}> / {td.tong}</span>
        </p>
        <p className={`text-slate-500 ${TYPE.caption}`}>nguồn đã gửi số hôm nay</p>

        {/* Thanh tiến độ — `aria-*` để trình đọc màn hình đọc được con số, ⛔
            không chỉ thấy một khối màu. */}
        <div
          role="progressbar"
          aria-valuenow={td.daNhan}
          aria-valuemin={0}
          aria-valuemax={td.tong}
          aria-label="Số nguồn đã gửi báo cáo hôm nay"
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={`h-full rounded-full transition-all ${xong ? STATUS.healthy.dot : STATUS.inProgress.dot}`}
            style={{ width: `${td.phanTram}%` }}
          />
        </div>

        {/* 🔑 Nói **AI** còn thiếu, ⛔ không chỉ nói *"còn thiếu 1"*. Một con số
            thiếu ⛔ không cho biết phải gọi cho ai. */}
        <p className={`mt-2.5 ${TYPE.caption} ${xong ? '' : 'text-slate-500'}`}>
          {xong
            ? 'Đủ cả bốn nguồn — chốt được số cho giám đốc.'
            : <>Còn chờ: <strong>{td.conThieu.join(' · ')}</strong></>}
        </p>
      </div>
    </section>
  );
}
