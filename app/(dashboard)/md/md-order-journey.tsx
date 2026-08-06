'use client';

// ============================================================================
// MD — "ĐƠN HÀNG ĐANG Ở ĐÂU?"
//
// Board Directive 06/08/2026: MD Workspace phải trả lời được câu này, theo
// **dòng chảy nghiệp vụ** chứ ⛔ không theo tab:
//     PO → Vật tư → Sản xuất → Kiểm hàng → Giao hàng → Hoàn tất
//
// Luật nằm ở `lib/mos/md/order-journey.ts` (hàm thuần, có bài kiểm riêng).
// Tệp này CHỈ vẽ. ⛔ Không tính toán nghiệp vụ ở đây — Cổng khách hàng và bảng
// tổng của giám đốc rồi cũng phải hiện đúng những chặng này.
//
// ⚠️ **⛔ KHÔNG literal màu/cỡ chữ** — bánh cóc `TD-07`/`TD-10`. Màu lấy từ
// `STATUS` của `lib/design/tokens.ts`, lớp ô lấy từ `components/ui`.
// ============================================================================
import { STATUS } from '@/lib/design/tokens';
import { Card, thCls, trHover, theadRow, tbodyDivide, tdCode, tdMuted } from '@/components/ui';
import { NoData } from '@/components/data-state';
import {
  tinhHanhTrinh, demTheoChang, CHANG, CHANG_LABEL,
  type Chang, type TrangThaiChang, type ChungTuCon,
} from '@/lib/mos/md/order-journey';

/** Màu của từng trạng thái chặng — lấy nguyên từ thẻ trạng thái hiến định. */
const TONE: Record<TrangThaiChang, string> = {
  XONG: STATUS.healthy.chip,
  DANG_LAM: STATUS.inProgress.chip,
  CHUA_TOI: STATUS.draft.chip,
  KHONG_DO_DUOC: STATUS.waiting.chip,
};

const KY_HIEU: Record<TrangThaiChang, string> = {
  XONG: '✓',
  DANG_LAM: '●',
  CHUA_TOI: '·',
  KHONG_DO_DUOC: '⚪',
};

export default function MdOrderJourney({
  pos,
  materials,
  productions,
  shipments,
}: {
  pos: { id: string; po_number: string; status: string; customer_name: string }[];
  materials: ChungTuCon[];
  productions: ChungTuCon[];
  shipments: ChungTuCon[];
}) {
  const hanhTrinh = pos.map((p) =>
    tinhHanhTrinh({
      poNumber: p.po_number,
      poStatus: p.status,
      materials,
      productions,
      shipments,
    }),
  );
  const dem = demTheoChang(hanhTrinh);

  return (
    <Card title="Đơn hàng đang ở đâu?">
      {pos.length === 0 ? (
        <NoData title="Chưa có đơn hàng nào" sub="Tạo PO để bắt đầu theo dõi dòng chảy." />
      ) : (
        <>
          {/* Dải tổng quan — bao nhiêu đơn đang đứng ở mỗi chặng. */}
          <div className="mb-4 flex flex-wrap gap-2">
            {CHANG.map((c) => (
              <span
                key={c}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 ring-1 ${
                  c === 'KIEM_HANG' ? TONE.KHONG_DO_DUOC : dem[c] > 0 ? TONE.DANG_LAM : TONE.CHUA_TOI
                }`}
              >
                {CHANG_LABEL[c]}
                <span className="tabular-nums">{c === 'KIEM_HANG' ? '⚪' : dem[c]}</span>
              </span>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className={theadRow}>
                  <th className={thCls}>PO</th>
                  <th className={thCls}>Khách hàng</th>
                  {CHANG.map((c) => (
                    <th key={c} className={thCls}>{CHANG_LABEL[c]}</th>
                  ))}
                  <th className={thCls}>Đang ở</th>
                </tr>
              </thead>
              <tbody className={tbodyDivide}>
                {hanhTrinh.map((h, i) => (
                  <tr key={pos[i].id} className={trHover}>
                    <td className={tdCode}>{h.poNumber}</td>
                    <td className={tdMuted}>{pos[i].customer_name}</td>
                    {h.chang.map((c) => (
                      <td key={c.chang} className={tdMuted}>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${TONE[c.trangThai]}`}
                          title={c.vi}
                        >
                          {KY_HIEU[c.trangThai]}
                        </span>
                      </td>
                    ))}
                    <td className={tdMuted}>
                      {h.dangO ? CHANG_LABEL[h.dangO as Chang] : 'Đã đóng'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 🔴 Nói thẳng chỗ ⛔ chưa đo được, ⛔ không giấu sau một dấu chấm mờ. */}
          <p className={`mt-3 ${tdMuted}`}>
            ⚪ <strong>Kiểm hàng chưa đo được</strong> — MD chưa có đường dữ liệu sang Workspace QA.
            Cột này ⛔ <strong>không</strong> có nghĩa là &quot;chưa kiểm&quot;.
          </p>
        </>
      )}
    </Card>
  );
}
