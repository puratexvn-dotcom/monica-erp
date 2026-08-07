// ============================================================================
// ③ RISK CENTER CỦA BÀN GIÁM ĐỐC — "CẦN XỬ LÝ NGAY"
//
// [ADR-026](../../docs/adr/ADR-026-workspace-design-dna.md) · `DNA-3` `DNA-4`
// `DNA-6b`.
//
// ─── 🔑 GIÁM ĐỐC NHÌN RỦI RO KHÁC MD ────────────────────────────────────
// MD lo **từng đơn**; giám đốc lo **năng lực xưởng**. Nên khu này gom **ba
// nguồn** mà bản cũ để rải rác ở ba chỗ khác nhau trên trang:
//
//   ① cảnh báo ngày *(đơn quá hạn · lỗi vượt ngưỡng · nhà thầu báo sự cố)*
//   ② chuyền vượt ngưỡng lỗi
//   ③ 🔴 gãy kim **chưa tìm thấy mảnh** — rủi ro AN TOÀN SẢN PHẨM
//
// ⚠️ Gãy kim đứng **ĐẦU** dù ⛔ không phải mục nhiều nhất: một mảnh kim còn
// trong lô hàng là **thu hồi toàn bộ lô** và có thể **mất khách vĩnh viễn**.
// Xếp nó sau *"tỷ lệ lỗi 3,2%"* là để **số đông đè lên mức nghiêm trọng**.
//
// ⚠️ `DNA-6b` — trần 8 mục, và **⛔ KHÔNG cắt im lặng**.
// ⚠️ Màu từ `tokens.ts`, cỡ chữ từ `TYPE` — bánh cóc `TD-07`/`TD-10`.
// ============================================================================
import { AlertTriangle, ShieldCheck, Syringe } from 'lucide-react';

import { STATUS } from '@/lib/design/tokens';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import type { CanhBao } from '@/lib/mos/md/daily-digest';

const TOI_DA = 8;

export interface ChuyenLoi {
  line_name: string;
  inspected: number;
  defects: number;
  rate: string;
}
export interface GayKim {
  line_name: string;
  operator: string;
  machine: string;
  date: string;
}

export default function GiamDocRisk({
  canhBao, chuyenLoi, gayKim,
}: {
  canhBao: readonly CanhBao[];
  chuyenLoi: readonly ChuyenLoi[];
  gayKim: readonly GayKim[];
}) {
  const tong = gayKim.length + chuyenLoi.length + canhBao.length;
  let con = TOI_DA;
  const lay = <T,>(ds: readonly T[]): T[] => {
    const r = ds.slice(0, Math.max(0, con));
    con -= r.length;
    return r;
  };
  const kim = lay(gayKim);
  const chuyen = lay(chuyenLoi);
  const cb = lay(canhBao);
  const conLai = tong - (kim.length + chuyen.length + cb.length);

  return (
    <section aria-label="Cần xử lý ngay" className="scroll-mt-24">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className={`text-slate-700 ${TYPE.overline}`}>Cần xử lý ngay</h2>
        {tong > 0 && <span className={`tabular-nums text-slate-500 ${TYPE.caption}`}>{tong} mục</span>}
      </div>

      {tong === 0 ? (
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 ring-1 ${STATUS.healthy.chip}`}>
          <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className={TYPE.bodySm}>
            <strong>⛔ Không có vấn đề nào đang chờ xử lý.</strong>{' '}
            <span className="opacity-80">Hệ thống vẫn đang theo dõi.</span>
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {/* ① GÃY KIM — đứng đầu, xem chú thích đầu tệp. */}
          {kim.map((n, i) => (
            <li key={`k-${i}-${n.machine}`} className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ring-1 ${STATUS.critical.chip}`}>
              <Syringe className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className={`${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>
                  Gãy kim ⛔ CHƯA tìm thấy mảnh — {n.line_name}
                </p>
                <p className={`${TYPE.caption} opacity-90`}>
                  Máy {n.machine} · {n.operator} · {n.date}
                </p>
              </div>
            </li>
          ))}

          {/* ② CHUYỀN VƯỢT NGƯỠNG LỖI */}
          {chuyen.map((c) => (
            <li key={`c-${c.line_name}`} className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ring-1 ${STATUS.critical.chip}`}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className={`${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>{c.line_name} vượt ngưỡng lỗi</p>
                <p className={`${TYPE.caption} opacity-90`}>{c.defects} lỗi / {c.inspected} kiểm</p>
              </div>
              <span className={`shrink-0 rounded-full bg-white/70 px-2 py-0.5 tabular-nums ${TYPE.caption} ${FONT_WEIGHT.bold}`}>
                {c.rate}%
              </span>
            </li>
          ))}

          {/* ③ CẢNH BÁO NGÀY */}
          {cb.map((c, i) => {
            const nguy = c.mucDo === 'NGHIEM_TRONG';
            return (
              <li key={`d-${i}-${c.tieuDe}`} className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ring-1 ${nguy ? STATUS.critical.chip : STATUS.warning.chip}`}>
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className={`${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>{c.tieuDe}</p>
                  <p className={`${TYPE.caption} opacity-90`}>{c.chiTiet}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {conLai > 0 && (
        <p className={`mt-3 text-slate-500 ${TYPE.caption}`}>
          …và <strong>{conLai} mục nữa</strong>. Chi tiết ở các bảng bên cột giữa.
        </p>
      )}
    </section>
  );
}
