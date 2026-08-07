'use client';

// ============================================================================
// BÁO CÁO NGÀY CỦA MD — TRỰC QUAN TRƯỚC, SỐ SAU
//
// Board 06/08/2026: *"luôn luôn phải là **ưu tiên trực quan, biểu đồ**"*.
//
// ⇒ Thứ tự trên màn hình: **biểu đồ ⇒ cảnh báo ⇒ nhắc việc**. Bảng số chi tiết
// nằm ở các tab nghiệp vụ, ⛔ không nhồi vào đây.
//
// 🔑 Người đọc là giám đốc, giám đốc sản xuất và merchandiser — họ **quét**
// màn hình vài giây giữa lúc điều hành, ⛔ không ngồi **đọc** bảng. Một con số
// trả lời *"bao nhiêu"*; một biểu đồ trả lời *"đang tốt hay xấu"* — đó mới là
// câu họ hỏi.
//
// ─── ⚠️ ⛔ KHÔNG VẼ SỐ 0 KHI THẬT RA LÀ "⚪ CHƯA ĐO ĐƯỢC" ─────────────────
// `V.1`. Một cột cao bằng 0 trông như *"hôm nay làm được 0 sản phẩm"*, trong
// khi sự thật là *"chưa ai báo cáo"*. Hai câu đó khác nhau, và vẽ nhầm là để
// biểu đồ **nói dối sếp**. Chỉ số `null` ⇒ hiện dấu **⚪** kèm lý do, ⛔ không
// hiện cột.
//
// ⚠️ Thư viện biểu đồ nạp ĐỘNG — Board vừa yêu cầu tối ưu khởi động, và
// `recharts` nặng ~100 kB. Nó ⛔ không được nằm trong gói tải lần đầu.
// ============================================================================
import dynamic from 'next/dynamic';
import { TriangleAlert, ListChecks, Loader2 } from 'lucide-react';

import { Card } from '@/components/ui';
import { STATUS, CHART_PALETTE } from '@/lib/design/tokens';
// ⚠️ Cỡ chữ lấy từ THANG CHỮ HIẾN ĐỊNH, ⛔ không viết `text-sm` thẳng —
// bánh cóc `TD-10`.
import { TYPE } from '@/lib/design/typography';
import type { BaoCaoNgay, MucDo } from '@/lib/mos/md/daily-digest';

const BieuDo = dynamic(() => import('./digest-chart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center gap-2 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className={TYPE.bodySm}>Đang dựng biểu đồ…</span>
    </div>
  ),
});

const TONE_MUC_DO: Record<MucDo, string> = {
  NGHIEM_TRONG: STATUS.critical.chip,
  CANH_BAO: STATUS.warning.chip,
  BINH_THUONG: STATUS.draft.chip,
};
const ICON_MUC_DO: Record<MucDo, string> = {
  NGHIEM_TRONG: '🔴', CANH_BAO: '🟡', BINH_THUONG: '🟢',
};

export default function DailyDigestCard({ bc, gonGang = false }: { bc: BaoCaoNgay; gonGang?: boolean }) {
  // 🔴 THÊM 07/08/2026 — Board §6: *"Phần Report cuối trang đang mang cảm giác
  // ERP Dashboard. Ẩn hoặc giảm: chart ít giá trị, **báo cáo trùng**, widget ⛔
  // không phục vụ hành động."*
  //
  // Ở `/md`, hai khối **Cảnh báo** và **Việc cần làm** của thẻ này đã được đưa
  // lên thành khu **Vấn đề cần xử lý** (③) và **Hôm nay cần chốt** (⑦) — nơi
  // mỗi dòng **bấm được**. Giữ lại ở đây là bày **cùng một nội dung hai lần**,
  // và bản dưới còn **⛔ không bấm được** — tức bản kém hơn đứng sau bản tốt hơn.
  //
  // ⚠️ `gonGang` mặc định `false`: `/giam-doc` vẫn dùng thẻ ĐẦY ĐỦ, vì bàn giám
  // đốc ⛔ không có hai khu kia. Đổi mặc định là làm hỏng màn hình khác.
  return (
    <Card title={`Báo cáo ngày ${moc(bc.ngay)}`}>
      {bc.rong && (
        <p className={`mb-3 rounded-lg bg-slate-50 p-2 text-slate-600 ${TYPE.bodySm}`}>
          ⚪ Hôm nay <strong>chưa nhận được báo cáo nào</strong> từ tổ trưởng, nhà thầu hay QA.
          Đây ⛔ <strong>không</strong> phải &quot;sản lượng bằng 0&quot;.
        </p>
      )}

      {/* ① BIỂU ĐỒ ĐỨNG ĐẦU — trực quan trước, số sau. */}
      <BieuDo chiSo={bc.chiSo} />

      {/* ② Chỉ số dạng thẻ — đọc nhanh con số chính xác sau khi đã quét hình. */}
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {bc.chiSo.map((c, i) => (
          <div key={c.nhan} className="rounded-xl bg-slate-50 p-2.5">
            <p className={`text-slate-500 ${TYPE.label}`}>{c.nhan}</p>
            {c.gia === null ? (
              <>
                <p className={`text-slate-400 ${TYPE.metricSm}`}>⚪</p>
                <p className={`text-slate-500 ${TYPE.caption}`}>{c.vi}</p>
              </>
            ) : (
              <p
                className={`tabular-nums ${TYPE.metric}`}
                style={{ color: CHART_PALETTE[i % CHART_PALETTE.length] }}
              >
                {c.gia.toLocaleString('vi-VN')}
                <span className={`ml-1 text-slate-400 ${TYPE.caption}`}>{c.donVi}</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ③ Cảnh báo — đã xếp NGHIÊM TRỌNG lên trước ở tầng logic. */}
      {!gonGang && bc.canhBao.length > 0 && (
        <div className="mt-4">
          <h4 className={`mb-2 flex items-center gap-1.5 text-slate-800 ${TYPE.cardTitle}`}>
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            Cảnh báo ({bc.canhBao.length})
          </h4>
          <ul className="space-y-1.5">
            {bc.canhBao.slice(0, 8).map((c, i) => (
              <li key={`${c.tieuDe}-${i}`} className={`rounded-lg px-2.5 py-1.5 ring-1 ${TONE_MUC_DO[c.mucDo]}`}>
                <p className={TYPE.label}>{ICON_MUC_DO[c.mucDo]} {c.tieuDe}</p>
                <p className={TYPE.caption}>{c.chiTiet}</p>
              </li>
            ))}
          </ul>
          {bc.canhBao.length > 8 && (
            <p className={`mt-1 text-slate-500 ${TYPE.caption}`}>…và {bc.canhBao.length - 8} cảnh báo nữa.</p>
          )}
        </div>
      )}

      {/* ④ Nhắc việc — suy từ chính chỗ dữ liệu còn thiếu. */}
      {!gonGang && bc.nhacViec.length > 0 && (
        <div className="mt-4">
          <h4 className={`mb-2 flex items-center gap-1.5 text-slate-800 ${TYPE.cardTitle}`}>
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            Việc cần làm hôm nay
          </h4>
          <ul className={`list-inside list-disc space-y-1 text-slate-700 ${TYPE.bodySm}`}>
            {bc.nhacViec.map((v) => <li key={v}>{v}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}

function moc(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
