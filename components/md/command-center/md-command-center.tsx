'use client';

// ============================================================================
// ① MD COMMAND CENTER — KHỐI ĐẦU TIÊN CỦA WORKSPACE
//
// Board Directive 07/08/2026 *(MD Workspace UX Redesign v2)* §1:
//
//   > *"Buổi sáng MD cần thấy ngay tình trạng công việc."*
//
// ─── 🔑 VÌ SAO ⛔ KHÔNG PHẢI MỘT DASHBOARD ──────────────────────────────
// Board nói thẳng: *"⛔ không phải mở để xem dashboard"* và *"mọi KPI phải hỗ
// trợ hành động"*. Nên **mỗi ô ở đây bấm được** và dẫn tới đúng chỗ xử lý —
// một con số ⛔ không bấm được chỉ là thông báo, và thông báo thì đọc xong
// **⛔ không còn việc gì để làm**.
//
// ⚠️ Ô *"Đúng tiến độ"* cố ý đứng NGAY SAU tổng số, trước hai ô rủi ro. Mở
// máy mà thấy hai ô đỏ trước tiên là bắt đầu ngày bằng cảm giác **bị kiểm
// tra** — đúng thứ Board yêu cầu tránh: *"MONICA ONE giúp tôi kiểm soát công
// việc, ⛔ không phải đang kiểm tra tôi."*
//
// ⚠️ Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// Phép tính ở `lib/mos/md/command-center-kpi.ts`, ⛔ không ở đây.
// ============================================================================
import {
  ClipboardList, ShieldCheck, AlertTriangle, CalendarClock, Sparkles, ArrowRight,
} from 'lucide-react';

import { STATUS } from '@/lib/design/tokens';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import type { TongQuanMd } from '@/lib/mos/md/command-center-kpi';
// ⚠️ Lớp thẻ bấm được lấy từ `components/ui`, ⛔ không viết màu thẳng ở đây.
import { theBamDuoc, loiDiChu } from '@/components/ui';

type Nhan = 'trung' | 'tot' | 'canh' | 'nguy';

const TONE: Record<Nhan, { chip: string; text: string; dot: string }> = {
  trung: { chip: STATUS.waiting.chip, text: STATUS.waiting.text, dot: STATUS.waiting.dot },
  tot: { chip: STATUS.healthy.chip, text: STATUS.healthy.text, dot: STATUS.healthy.dot },
  canh: { chip: STATUS.warning.chip, text: STATUS.warning.text, dot: STATUS.warning.dot },
  nguy: { chip: STATUS.critical.chip, text: STATUS.critical.text, dot: STATUS.critical.dot },
};

function O({
  nhan, so, phu, icon: Icon, tone, onClick, nhanBam, loiDi,
}: {
  nhan: string;
  so: string;
  phu: string;
  icon: typeof ClipboardList;
  tone: Nhan;
  onClick?: () => void;
  nhanBam: string;
  /** Câu **hành động** hiện ngay trên ô — Board §1. */
  loiDi?: string;
}) {
  const t = TONE[tone];
  const noiDung = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={`${TYPE.overline} text-slate-500`}>{nhan}</p>
        <Icon className={`h-4 w-4 shrink-0 ${t.text}`} aria-hidden="true" />
      </div>
      <p className={`mt-1.5 tabular-nums ${TYPE.pageTitle} ${FONT_WEIGHT.bold} ${t.text}`}>{so}</p>
      <p className={`mt-0.5 ${TYPE.caption} text-slate-500`}>{phu}</p>
      {/* 🔴 Board §1: *"KPI ⛔ không được là ngõ cụt … Mỗi KPI phải trả lời:
          tôi cần hành động gì?"*
          🔑 Con trỏ đổi hình khi rê chuột là **⛔ không đủ**: trên điện thoại
          ⛔ không có con trỏ, và người dùng máy bàn cũng phải rê tới mới biết.
          Nên lối đi được **viết ra thành chữ**. */}
      {onClick && (
        <p className={`mt-2 inline-flex items-center gap-1 ${loiDiChu} ${TYPE.caption} ${FONT_WEIGHT.semibold}`}>
          {loiDi} <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </p>
      )}
    </>
  );

  // ⛔ KHÔNG bọc `<button>` quanh ô ⛔ không có nơi để tới — con trỏ đổi thành
  // bàn tay rồi bấm ⛔ không xảy ra gì là **lời hứa suông của giao diện**.
  if (!onClick) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-4">{noiDung}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={nhanBam}
      className={`p-4 ${theBamDuoc}`}
    >
      {noiDung}
    </button>
  );
}

export default function MdCommandCenter({
  tq, onMoDon, onMoViec, onMoRuiRo,
}: {
  tq: TongQuanMd;
  onMoDon: () => void;
  onMoViec: () => void;
  onMoRuiRo: () => void;
}) {
  const canDeMat = tq.theoSucKhoe.AT_RISK;
  const treGiao = tq.theoSucKhoe.DELAYED;

  return (
    <section aria-label="Tổng quan điều hành">
      {/* ⚠️ 2 CỘT, ⛔ KHÔNG 5. Từ 07/08/2026 khối này nằm trong **cột trái** rộng
          3/12 — dàn 5 ô ngang ở đó thì mỗi ô chỉ còn ~60px và con số bị cắt. */}
      <div className="grid grid-cols-2 gap-3">
        <O
          nhan="Đơn đang quản lý" so={String(tq.tongPo)} phu="tổng PO còn chạy"
          icon={ClipboardList} tone="trung" onClick={onMoDon} nhanBam="Mở danh sách đơn hàng"
          loiDi="Mở danh sách"
        />
        <O
          nhan="Đúng tiến độ"
          // ⚠️ `null` ⇒ ⚪, ⛔ KHÔNG ⇒ `0%`. `0%` là một phán quyết nặng
          // *("⛔ không đơn nào đúng hạn")*; ⚪ là sự thật *("⛔ chưa có gì để đo")*.
          so={tq.phanTramDungTienDo === null ? '⚪' : `${tq.phanTramDungTienDo}%`}
          phu={`${tq.theoSucKhoe.ON_TRACK} đơn đúng hạn giao`}
          icon={ShieldCheck} tone="tot" onClick={onMoDon} nhanBam="Xem hành trình đơn hàng"
          loiDi="Xem hành trình"
        />
        <O
          nhan="Cần để mắt" so={String(canDeMat)} phu="sắp tới hạn giao"
          icon={AlertTriangle} tone={canDeMat > 0 ? 'canh' : 'trung'}
          onClick={onMoRuiRo} nhanBam="Mở khu rủi ro" loiDi="Xem vấn đề"
        />
        <O
          nhan="Trễ giao" so={String(treGiao)} phu="đã quá hạn"
          icon={AlertTriangle} tone={treGiao > 0 ? 'nguy' : 'trung'}
          onClick={onMoRuiRo} nhanBam="Mở khu rủi ro" loiDi="Xử lý ngay"
        />
        <O
          nhan="Việc hôm nay" so={String(tq.soViecHomNay)}
          phu={tq.khanNhat ? `khẩn nhất: ${tq.khanNhat.moTa}` : 'hộp thư việc trống'}
          icon={CalendarClock} tone={tq.soViecHomNay > 0 ? 'canh' : 'tot'}
          onClick={onMoViec} nhanBam="Mở danh sách việc hôm nay" loiDi="Mở tiêu điểm"
        />
      </div>

      {/* ─── THÀNH QUẢ TRONG NGÀY ────────────────────────────────────────
          Board: *"MD phải cảm thấy MONICA ONE giúp tôi kiểm soát công việc, ⛔
          không phải đang kiểm tra tôi"* — và gợi ý **thành quả trong ngày ·
          cảm giác hoàn thành**.

          🔑 Dải này lấy NGUYÊN số của báo cáo ngày, ⛔ không đếm lại. Một
          "thành tích" tính theo cách khác với báo cáo gửi giám đốc là chỗ hai
          màn hình bắt đầu nói hai chuyện.

          ⚠️ ⛔ KHÔNG bịa lời khen khi ⛔ chưa ai báo cáo. Một dải chúc mừng
          trên nền dữ liệu rỗng là **nịnh**, và người dùng nhận ra ngay. */}
      <div className={`mt-3 rounded-2xl border px-4 py-3 ${tq.chuaCoBaoCao ? 'border-slate-200 bg-white' : `${TONE.tot.chip} border`}`}>
        {tq.chuaCoBaoCao ? (
          <p className={`${TYPE.bodySm} text-slate-500`}>
            ⚪ Hôm nay <strong>chưa nhận được báo cáo nào</strong> từ tổ trưởng, nhà thầu hay QA —
            {' '}⛔ <strong>không</strong> phải sản lượng bằng 0.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <span className={`inline-flex items-center gap-1.5 ${TYPE.bodySm} ${FONT_WEIGHT.semibold} text-slate-700`}>
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Hôm nay xưởng đã làm được
            </span>
            {tq.thanhQua.map((m) => (
              <span key={m.nhan} className={`${TYPE.bodySm} text-slate-600`}>
                {m.nhan}:{' '}
                {m.gia === null ? (
                  <strong className="text-slate-400" title={m.vi}>⚪</strong>
                ) : (
                  <strong className="tabular-nums text-slate-900">
                    {m.gia.toLocaleString('vi-VN')} {m.donVi}
                  </strong>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
