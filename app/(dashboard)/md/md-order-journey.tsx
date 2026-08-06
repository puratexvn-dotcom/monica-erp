'use client';

// ============================================================================
// MD — "ĐƠN HÀNG ĐANG Ở ĐÂU?"
//
// Board Directive 06/08/2026 (L2): mỗi đơn hiện **sức khoẻ · % hoàn thành ·
// việc kế tiếp**, và mỗi chặng **bung ra** cho thấy *trạng thái · người phụ
// trách · ngày · bằng chứng*.
//
// Luật nằm ở `lib/mos/md/order-journey.ts` (hàm thuần, 35 phép đo). Tệp này
// CHỈ vẽ — ⛔ không tính nghiệp vụ ở đây, vì Cổng khách hàng và bảng tổng của
// giám đốc rồi cũng phải hiện đúng những con số này.
//
// ⚠️ **⛔ KHÔNG literal màu/cỡ chữ** — bánh cóc `TD-07`/`TD-10`. Màu lấy từ
// `STATUS` của `lib/design/tokens.ts`, lớp ô lấy từ `components/ui`.
// ============================================================================
import { useState } from 'react';
import napDong from 'next/dynamic';
import { ChevronRight, Paperclip, ArrowUpRight } from 'lucide-react';

import { STATUS } from '@/lib/design/tokens';
import { Card, btnGhost, thCls, trHover, theadRow, tbodyDivide, tdCode, tdMuted } from '@/components/ui';
import { NoData } from '@/components/data-state';
import {
  tinhHanhTrinh, CHANG, CHANG_LABEL, SUC_KHOE_LABEL,
  type Chang, type TrangThaiChang, type SucKhoe, type ChungTuCon, type HanhTrinh,
  type BienBanKiem,
} from '@/lib/mos/md/order-journey';
import { fmtDate } from './md-tabs';

// ⚠️ NẠP ĐỘNG — `recharts` ~100 kB. Tab PO là màn hình MD mở đầu tiên mỗi
// sáng; gói tải lần đầu ⛔ không được phình vì một biểu đồ nằm dưới nếp gấp.
const JourneyStageChart = napDong(() => import('@/components/md/journey-stage-chart'), {
  ssr: false,
  loading: () => <div className="h-52 w-full animate-pulse rounded-xl bg-slate-100" />,
});

const TONE: Record<TrangThaiChang, string> = {
  XONG: STATUS.healthy.chip,
  DANG_LAM: STATUS.inProgress.chip,
  CHUA_TOI: STATUS.draft.chip,
  KHONG_DO_DUOC: STATUS.waiting.chip,
};
/** Màu MỘT ĐOẠN của thanh tiến trình. Dùng `dot` (màu đặc) chứ ⛔ không dùng
 *  `chip` (nền nhạt) — đoạn thanh chỉ vài pixel, nền nhạt sẽ ⛔ không nhìn ra. */
const DOAN: Record<TrangThaiChang, string> = {
  XONG: STATUS.healthy.dot,
  DANG_LAM: STATUS.inProgress.dot,
  CHUA_TOI: STATUS.draft.dot,
  KHONG_DO_DUOC: STATUS.waiting.dot,
};

const KY_HIEU: Record<TrangThaiChang, string> = {
  XONG: '✓', DANG_LAM: '●', CHUA_TOI: '·', KHONG_DO_DUOC: '⚪',
};
const TRANG_THAI_LABEL: Record<TrangThaiChang, string> = {
  XONG: 'Đã xong', DANG_LAM: 'Đang làm', CHUA_TOI: 'Chưa tới', KHONG_DO_DUOC: 'Chưa đo được',
};

/** 🟢 🟡 🔴 — biểu tượng ĐI KÈM CHỮ, ⛔ không bao giờ chỉ có màu.
 *  Người mù màu ⛔ không đọc được một chấm màu đứng một mình. */
const SUC_KHOE_ICON: Record<SucKhoe, string> = {
  ON_TRACK: '🟢', AT_RISK: '🟡', DELAYED: '🔴',
};
const SUC_KHOE_TONE: Record<SucKhoe, string> = {
  ON_TRACK: STATUS.healthy.chip,
  AT_RISK: STATUS.warning.chip,
  DELAYED: STATUS.critical.chip,
};

export default function MdOrderJourney({
  pos, materials, productions, shipments, inspections, today, onOpenTab,
}: {
  pos: { id: string; po_number: string; status: string; customer_name: string; delivery_date: string }[];
  materials: ChungTuCon[];
  productions: ChungTuCon[];
  shipments: ChungTuCon[];
  inspections: BienBanKiem[];
  today: string;
  onOpenTab: (tab: 'po' | 'materials' | 'production' | 'shipments') => void;
}) {
  const [mo, setMo] = useState<string | null>(null);

  const ds = pos.map((p) => ({
    po: p,
    h: tinhHanhTrinh({
      poNumber: p.po_number,
      poStatus: p.status,
      materials, productions, shipments, inspections,
      deliveryDate: p.delivery_date,
      today,
    }),
  }));

  return (
    <Card title="Đơn hàng đang ở đâu?">
      {ds.length === 0 ? (
        <NoData title="Chưa có đơn hàng nào" sub="Tạo PO để bắt đầu theo dõi dòng chảy." />
      ) : (
        <>
          {/* 🔴 BIỂU ĐỒ TRƯỚC BẢNG — Board 06/08/2026: *"luôn luôn ưu tiên
              trực quan"*. Bảng trả lời *"đơn NÀY ở đâu"*; biểu đồ trả lời
              *"CẢ XƯỞNG đang ứ ở khâu nào"* — câu MD cần trước khi soi đơn. */}
          <div className="mb-4">
            <JourneyStageChart ds={ds.map((x) => x.h)} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className={theadRow}>
                  <th className={thCls}>PO</th>
                  <th className={thCls}>Khách hàng</th>
                  {/* Nói rõ đo theo NGÀY GIAO — thẻ "Trễ mốc T&A" ở dưới đo
                      thứ khác. Hai cột cùng tên là chỗ màn hình tự mâu thuẫn. */}
                  <th className={thCls} title="Đo theo ngày giao hẹn khách">Sức khoẻ (theo ngày giao)</th>
                  <th className={thCls}>Tiến độ</th>
                  {/* 🔴 SÁU CỘT CHẤM → MỘT THANH TIẾN TRÌNH — Board 06/08/2026:
                      *"luôn luôn ưu tiên trực quan"*.
                      Sáu cột riêng bắt mắt quét ngang rồi tự ghép lại thành
                      *"đơn này đi tới đâu"*. Một thanh liền kể ngay câu đó. */}
                  <th className={thCls}>Hành trình</th>
                  <th className={thCls}>Việc kế tiếp</th>
                </tr>
              </thead>
              <tbody className={tbodyDivide}>
                {ds.map(({ po, h }) => (
                  <DongDon
                    key={po.id}
                    h={h}
                    khach={po.customer_name}
                    mo={mo === po.id}
                    onMo={() => setMo(mo === po.id ? null : po.id)}
                    onOpenTab={onOpenTab}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* 🔴 Nói thẳng giới hạn, ⛔ không để người đọc tự suy. */}
          <p className={`mt-3 ${tdMuted}`}>
            ⚠️ Chặng <strong>Kiểm hàng</strong> hiện <strong>số liệu thật</strong> từ biên bản QA
            (số lượt kiểm · số lỗi · tỉ lệ). &quot;Đã xong&quot; ở đây nghĩa là{' '}
            <strong>đã có biên bản kiểm cho lô đã sản xuất xong</strong> — ⛔ <strong>không</strong>{' '}
            nghĩa là đã đạt AQL 2.5. Bảng biên bản ⛔ không ghi phán quyết cuối, và ngưỡng AQL là
            quyết định của Board chứ ⛔ không phải của phần mềm.
          </p>
        </>
      )}
    </Card>
  );
}

function DongDon({ h, khach, mo, onMo, onOpenTab }: {
  h: HanhTrinh;
  khach: string;
  mo: boolean;
  onMo: () => void;
  onOpenTab: (tab: 'po' | 'materials' | 'production' | 'shipments') => void;
}) {
  const vk = h.viecKeTiep;
  return (
    <>
      <tr className={trHover}>
        <td className={tdCode}>
          <button type="button" onClick={onMo} className="flex items-center gap-1" aria-expanded={mo}>
            <ChevronRight className={`h-4 w-4 transition ${mo ? 'rotate-90' : ''}`} aria-hidden="true" />
            {h.poNumber}
          </button>
        </td>
        <td className={tdMuted}>{khach}</td>
        <td className={tdMuted}>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${SUC_KHOE_TONE[h.sucKhoe]}`} title={h.viSucKhoe}>
            {SUC_KHOE_ICON[h.sucKhoe]} {SUC_KHOE_LABEL[h.sucKhoe]}
          </span>
        </td>
        <td className={tdMuted}>
          <span className="tabular-nums">{h.phanTram}%</span>
        </td>
        {/* Thanh tiến trình: sáu đoạn liền nhau, mỗi đoạn một chặng. Rê chuột
            vào đoạn nào ra câu giải thích của chặng đó. */}
        <td className={tdMuted}>
          <div className="flex min-w-[190px] gap-0.5" role="img"
            aria-label={`Hành trình: ${h.chang.map((c) => `${CHANG_LABEL[c.chang as Chang]} ${TRANG_THAI_LABEL[c.trangThai]}`).join(', ')}`}>
            {h.chang.map((c) => (
              <span
                key={c.chang}
                title={`${CHANG_LABEL[c.chang as Chang]} — ${c.vi}`}
                className={`h-2.5 flex-1 first:rounded-l-full last:rounded-r-full ${DOAN[c.trangThai]}`}
              />
            ))}
          </div>
        </td>
        <td className={tdMuted}>
          {vk ? (
            <button type="button" className={btnGhost} onClick={() => onOpenTab(vk.moTab)}>
              {vk.viec} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : '—'}
        </td>
      </tr>

      {mo && (
        <tr>
          <td colSpan={6}>
            <div className="space-y-2 px-4 pb-4">
              {vk && (
                <p className={tdMuted}>
                  <strong>Việc kế tiếp:</strong> {vk.viec} · <strong>Ai:</strong> {vk.ai}
                  {' · '}<strong>Hạn:</strong> {vk.hanChot ? fmtDate(vk.hanChot) : '⚪ chưa có mốc'}
                </p>
              )}
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className={theadRow}>
                    <th className={thCls}>Chặng</th>
                    <th className={thCls}>Trạng thái</th>
                    <th className={thCls}>Phụ trách</th>
                    <th className={thCls}>Mốc</th>
                    <th className={thCls}>Bằng chứng</th>
                  </tr>
                </thead>
                <tbody className={tbodyDivide}>
                  {h.chang.map((c) => (
                    <tr key={c.chang} className={trHover}>
                      <td className={tdCode}>{CHANG_LABEL[c.chang as Chang]}</td>
                      <td className={tdMuted}>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${TONE[c.trangThai]}`}>
                          {KY_HIEU[c.trangThai]} {TRANG_THAI_LABEL[c.trangThai]}
                        </span>
                        {' '}{c.vi}
                      </td>
                      {/* ⚠️ VAI, ⛔ không phải tên người — CSDL chưa có cột phụ trách. */}
                      <td className={tdMuted}>{c.chuTrach}</td>
                      <td className={tdMuted}>{c.moc ? fmtDate(c.moc) : '—'}</td>
                      <td className={tdMuted}>
                        {c.bangChung.length === 0 ? '—' : c.bangChung.map((b) => (
                          <span key={b.so} className="mr-2 inline-flex items-center gap-1">
                            {b.so}
                            {b.coTep && <Paperclip className="h-3 w-3" aria-label="có tệp đính kèm" />}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
