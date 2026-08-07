'use client';

// ============================================================================
// ORDER CENTER — CỘT GIỮA CỦA MD WORKSPACE
//
// Board Directive 07/08/2026 *(MD V2 Final)* §7: giữ **Order Journey** +
// **danh sách PO**; ⛔ **không** thêm Dashboard vào đây.
//
// ⚠️ Tệp nằm ở `app/(dashboard)/md/`, ⛔ KHÔNG ở `components/` — nó dùng
// `MdOrderJourney` vốn ở đây, mà kiến trúc **cấm `components/` import từ
// `app/`**. Đặt nhầm chỗ thì phép kiểm ② đánh hỏng ngay.
//
// ⚠️ Tách khỏi `md-client.tsx` vì trần **900 dòng** — sửa bằng **CẤU TRÚC**,
// ⛔ không bằng cách nới trần.
// ============================================================================
import MdOrderJourney from './md-order-journey';
import PoList from '@/components/md/po/po-list';
import ActionablePoList from '@/components/md/command-center/actionable-po';
import { hopNhom, dauHopNhom, SAC_NHOM } from '@/components/ui';
import KhoiThuGon from '@/components/ui/khoi-thu-gon';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import type { ChungTuCon, BienBanKiem } from '@/lib/mos/md/order-journey';
import type { PoRow } from '@/schemas/md';
import type { CommandCenterData } from './_services/command-center.service';

export default function MdOrderCenter({
  pos, materials, productions, shipments, inspections, today, onOpenTab,
  ccPos, ccLoi, onOpenPo, poError, onRefresh,
}: {
  pos: PoRow[];
  materials: ChungTuCon[];
  productions: ChungTuCon[];
  shipments: ChungTuCon[];
  inspections: BienBanKiem[];
  today: string;
  onOpenTab: (t: string) => void;
  ccPos: CommandCenterData['pos'];
  ccLoi: string | null;
  onOpenPo: (orderId: string, poNumber: string) => void;
  poError: string | null;
  onRefresh: () => void;
}) {
  return (
    <>
      {/* ④ BUSINESS FLOW — sắc **Journey = xanh lá** (Board §12). */}
      {/* Board §10 — mở sẵn ~4 dòng, còn lại sau nút "Xem thêm". */}
      <KhoiThuGon caoToiDa={420} nhan={`Xem đủ ${pos.length} đơn`}>
      <MdOrderJourney
        pos={pos}
        materials={materials}
        productions={productions}
        shipments={shipments}
        inspections={inspections}
        today={today}
        onOpenTab={onOpenTab}
      />
      </KhoiThuGon>

      {ccPos.length > 0 || ccLoi ? (
        <ActionablePoList pos={ccPos} error={ccLoi} onOpenPo={onOpenPo} />
      ) : null}

      {/* ⑥ DATA — `DNA-6`: bảng cuộn TRONG khung của nó, ⛔ không đẩy khối
          dưới ra khỏi tầm mắt. */}
      <div className={hopNhom('journey')}>
        <div className={dauHopNhom('journey')}>
          <h2 className={`${SAC_NHOM.journey.chu} ${TYPE.bodySm} ${FONT_WEIGHT.bold}`}>
            Danh sách PO
          </h2>
          <span className={`tabular-nums text-slate-500 ${TYPE.caption}`}>{pos.length} đơn</span>
        </div>
        <div className="p-1">
          <KhoiThuGon caoToiDa={236} nhan={`Xem đủ ${pos.length} PO`}>
            <PoList rows={pos} error={poError} onRefresh={onRefresh} />
          </KhoiThuGon>
        </div>
      </div>
    </>
  );
}
