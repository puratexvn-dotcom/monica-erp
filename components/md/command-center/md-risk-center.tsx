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
  canhBao, alerts, loi, onDi,
}: {
  canhBao: readonly CanhBao[];
  alerts: readonly MosAlert[];
  loi?: string | null;
  onDi: (dich: DichCanhBao) => void;
}) {
  const tong = canhBao.length + alerts.length;

  return (
    <section aria-label="Khu rủi ro" id="khu-rui-ro" className="mb-5 scroll-mt-24">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className={`text-slate-700 ${TYPE.overline}`}>Vấn đề cần xử lý</h2>
        {tong > 0 && (
          <span className={`tabular-nums text-slate-500 ${TYPE.caption}`}>{tong} mục</span>
        )}
      </div>

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
        <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {/* Nguy cấp đứng trước — `canhBao` đã được `daily-digest` sắp theo mức độ. */}
          {canhBao.map((c, i) => {
            const nguy = c.mucDo === 'NGHIEM_TRONG';
            return (
              <li
                key={`d-${i}-${c.tieuDe}`}
                className={`flex items-start gap-3 rounded-2xl px-4 py-3 ring-1 ${nguy ? STATUS.critical.chip : STATUS.warning.chip}`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>{c.tieuDe}</p>
                  <p className={`${TYPE.caption} opacity-90`}>{c.chiTiet}</p>
                </div>
                {/* 🔑 ĐÂY là chỗ Board đòi: cảnh báo **dẫn tới hành động**.
                    Đích khai tại nguồn ở `daily-digest.ts`, ⛔ không đoán bằng
                    cách bóc chuỗi tiêu đề. */}
                <button
                  type="button"
                  onClick={() => onDi(c.dich)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/70 px-2 py-1 ${TYPE.caption} ${FONT_WEIGHT.semibold} transition hover:bg-white`}
                >
                  {NHAN_DICH[c.dich]} <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            );
          })}

          {alerts.map((a) => (
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
                <button
                  type="button"
                  onClick={a.onOpen}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/70 px-2 py-1 ${TYPE.caption} ${FONT_WEIGHT.semibold} transition hover:bg-white`}
                >
                  Xử lý <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
