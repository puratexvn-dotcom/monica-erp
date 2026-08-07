'use client';

// ============================================================================
// ③ RISK CENTER — VẤN ĐỀ ĐƯA LÊN TRƯỚC, MỖI DÒNG DẪN TỚI HÀNH ĐỘNG
//
// Board Directive 07/08/2026 §3:
//
//   > *"Mỗi cảnh báo phải **dẫn tới hành động**. ⛔ Không chỉ hiển thị số."*
//
// ─── 🔑 VÌ SAO GỘP HAI NGUỒN CẢNH BÁO LÀM MỘT ───────────────────────────
// Trước bản này màn hình có **hai chỗ báo động**: *"Cảnh báo"* trong báo cáo
// ngày, và *"Cảnh báo nguy cấp"* của Command Center. Người dùng phải đọc cả
// hai rồi **tự ghép** xem cái nào trùng cái nào.
//
// 🔑 Hai danh sách báo động cạnh nhau ⛔ không làm người ta cảnh giác gấp đôi
// — nó làm người ta **thôi tin cả hai**.
//
// ⚠️ ⛔ KHÔNG khử trùng lặp bằng cách so tiêu đề: hai nguồn nhìn hai lát cắt
// khác nhau *(báo cáo ngày nhìn theo NGÀY, Command Center nhìn theo ĐƠN)* và
// một câu chữ giống nhau ⛔ không chứng minh hai cảnh báo là một. Gộp là **xếp
// chung một chỗ theo mức độ**, ⛔ không phải trộn thành một dòng.
//
// ⚠️ Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import { AlertTriangle, ArrowUpRight, ShieldCheck } from 'lucide-react';

import { STATUS } from '@/lib/design/tokens';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { hopNhom, dauHopNhom, nutNoi, SAC_NHOM } from '@/components/ui';
import type { CanhBao, DichCanhBao } from '@/lib/mos/md/daily-digest';
import type { MosAlert } from '@/lib/mos/command-center.contract';

const NHAN_DICH: Record<DichCanhBao, string> = {
  po: 'Mở đơn hàng',
  materials: 'Mở phiếu NPL',
  production: 'Mở lệnh sản xuất',
  shipments: 'Mở lịch tàu',
  subcon: 'Mở nhà thầu',
};

export default function MdRiskCenter({
  canhBao: canhBaoGoc, alerts, loi, onDi, boQua, onXemTatCa,
}: {
  canhBao: readonly CanhBao[];
  alerts: readonly MosAlert[];
  loi?: string | null;
  onDi: (dich: DichCanhBao) => void;
  /** Board *MD V5* §4 — mở tab **Rủi ro** với danh sách đầy đủ. */
  onXemTatCa?: () => void;
  /** Tiêu đề ĐÃ hiện ở khối *Hôm nay* — Board §5: *"Risk ⛔ không lặp dữ liệu
   *  Today."* Bỏ chúng ra khỏi đây thay vì bày lần thứ hai. */
  boQua?: readonly string[];
}) {
  // 🔴 Lọc TRƯỚC khi đếm: con số *"N mục"* phải khớp thứ **thật sự còn lại**,
  // ⛔ không phải tổng trước khi lọc — số ⛔ không khớp danh sách là số nói dối.
  const canhBao = boQua && boQua.length > 0
    ? canhBaoGoc.filter((c) => !boQua.includes(c.tieuDe))
    : canhBaoGoc;
  const tong = canhBao.length + alerts.length;

  // 🔴 CHẶN NGƯỠNG — Board Directive 07/08/2026 §5: *"Chỉ hiển thị vấn đề. ⛔
  // Không hiển thị toàn bộ đơn."*
  //
  // Sau khi sinh lịch T&A cho 14 đơn cũ, hộp thư có **167 việc quá hạn** và
  // khu này đổ ra **170 mục** ⇒ trang cao **37.850 px**. Đó ⛔ không còn là
  // *"cần xử lý ngay"* — đó là một **bảng dữ liệu đội lốt cảnh báo**.
  //
  // 🔑 Một danh sách 170 dòng đỏ ⛔ không giúp ai chọn việc nào làm trước; nó
  // chỉ dạy người dùng **cuộn qua màu đỏ mà ⛔ không đọc**. Khu này giữ đúng
  // **phần đỉnh**; phần còn lại đã có **Hộp thư việc** ở cột trái lo — nơi có
  // sắp xếp, có phân trang, và đúng nghĩa *"Task"* chứ ⛔ không phải *"Risk"*.
  //
  // ⚠️ **⛔ KHÔNG giấu số bị cắt.** Nói thẳng còn bao nhiêu và chỉ chỗ xem —
  // cắt im lặng thì màn hình đọc thành *"chỉ có 8 vấn đề"*.
  // 🔴 Board *MD V5* §4: *"chỉ giữ **5 rủi ro cao nhất**. Có `Xem tất cả`."*
  const TOI_DA = 5;
  const bay = [
    ...canhBao.map((c, i) => ({ loai: 'd' as const, key: `d-${i}-${c.tieuDe}`, c })),
    ...alerts.map((a) => ({ loai: 'a' as const, key: a.id, a })),
  ];
  const hien = bay.slice(0, TOI_DA);
  const conLai = bay.length - hien.length;

  return (
    // Board *MD V5* §10: Risk = sắc **đỏ hồng**, khác hẳn Action xanh dương và
    // Today hổ phách. Khối có đầu màu, ⛔ không còn là tiêu đề trần trên nền trắng.
    <section aria-label="Khu rủi ro" id="khu-rui-ro" className={`scroll-mt-24 ${hopNhom('risk')}`}>
      <div className={dauHopNhom('risk')}>
        <h2 className={`${SAC_NHOM.risk.chu} ${TYPE.bodySm} ${FONT_WEIGHT.bold}`}>Cần xử lý ngay</h2>
        {tong > 0 && (
          <span className={`tabular-nums text-slate-500 ${TYPE.caption}`}>{tong} mục</span>
        )}
      </div>
      <div className="p-4">

      {/* 🔴 LỖI ĐỌC PHẢI HIỆN RA, ⛔ KHÔNG ĐƯỢC NUỐT.
          *"⛔ Không có rủi ro nào"* và *"⛔ không đọc được CSDL"* trông y hệt
          nhau trên màn hình — và chỉ **một** trong hai là tin tốt. */}
      {loi && (
        <p role="alert" className={`mb-3 rounded-xl px-4 py-2.5 ring-1 ${STATUS.critical.chip} ${TYPE.bodySm}`}>
          ⛔ <strong>Chưa đọc được danh sách rủi ro.</strong> {loi}
        </p>
      )}

      {tong === 0 && !loi ? (
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 ring-1 ${STATUS.healthy.chip}`}>
          <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className={TYPE.bodySm}>
            <strong>⛔ Không có vấn đề nào đang chờ xử lý.</strong>{' '}
            <span className="opacity-80">Hệ thống vẫn đang theo dõi — sẽ báo ngay khi có.</span>
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {/* Nguy cấp đứng trước — `canhBao` đã được `daily-digest` sắp theo mức độ. */}
          {hien.filter((x) => x.loai === 'd').map(({ key, c }, i) => {
            const nguy = c.mucDo === 'NGHIEM_TRONG';
            return (
              <li
                key={key}
                className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ring-1 ${nguy ? STATUS.critical.chip : STATUS.warning.chip}`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>{c.tieuDe}</p>
                  <p className={`${TYPE.caption} opacity-90`}>{c.chiTiet}</p>
                </div>
                {/* 🔑 ĐÂY là chỗ Board đòi: cảnh báo **dẫn tới hành động**.
                    Đích khai tại nguồn ở `daily-digest.ts`, ⛔ không đoán bằng
                    cách bóc chuỗi tiêu đề. */}
                {/* Board §11: nút đặc, ⛔ không còn là nút trắng mờ trên nền đỏ. */}
                <button type="button" onClick={() => onDi(c.dich)} className={nutNoi('risk')}>
                  {NHAN_DICH[c.dich]} <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            );
          })}

          {hien.filter((x) => x.loai === 'a').map(({ a }) => (
            <li
              key={a.id}
              className={`flex items-start gap-3 rounded-2xl px-4 py-3 ring-1 ${STATUS.critical.chip}`}
            >
              <a.icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className={`${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>{a.title}</p>
                <p className={`${TYPE.caption} opacity-90`}>{a.detail}</p>
              </div>
              <span className={`shrink-0 rounded-full bg-white/70 px-2 py-0.5 tabular-nums ${TYPE.caption} ${FONT_WEIGHT.bold}`}>
                {a.metric}
              </span>
              {/* ⚠️ Chỉ vẽ nút khi cảnh báo THẬT SỰ có nơi để tới. Một nút bấm
                  vào ⛔ không xảy ra gì còn tệ hơn ⛔ không có nút. */}
              {a.onOpen && (
                <button type="button" onClick={a.onOpen} className={nutNoi('risk')}>
                  Xử lý <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 🔴 Board *MD V5* §4: *"Có `Xem tất cả`. ⛔ Không render toàn bộ."*
          ⚠️ **⛔ KHÔNG giấu số bị cắt** — nói thẳng còn bao nhiêu rồi mới mời
          bấm. Cắt im lặng thì màn hình đọc thành *"chỉ có 5 vấn đề"*.
          ⚠️ Câu cũ chỉ sang *"Hộp thư việc (cột trái)"* — khối đó **đã bị xoá**
          theo §1, nên chỉ đường tới nó là chỉ tới chỗ ⛔ không còn tồn tại. */}
      {(conLai > 0 || onXemTatCa) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {conLai > 0 && (
            <span className={`text-slate-500 ${TYPE.caption}`}>
              …và <strong>{conLai} mục nữa</strong>.
            </span>
          )}
          {onXemTatCa && (
            <button type="button" onClick={onXemTatCa} className={nutNoi('risk')}>
              Xem tất cả <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      </div>
    </section>
  );
}
