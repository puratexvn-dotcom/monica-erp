'use client';

// ============================================================================
// ĐẦU WORKSPACE CỦA MD — ba khối ①②③ theo DNA Board Directive 07/08/2026
//
//   ① Command Center  →  ② Quick Actions  →  ③ Risk Center
//
// ─── 🔑 VÌ SAO GOM VÀO MỘT COMPONENT ────────────────────────────────────
// `md-client.tsx` đang ở **849/900 dòng** — phép kiểm kiến trúc chặn ở 900.
// Nhét ba khối vào đó là **vượt trần ngay**, và cách sửa sai là nới trần.
//
// 🔑 Gom ở đây còn **đúng hơn về cấu trúc**: ba khối này cùng đọc **một tập
// dữ liệu điều hành**, và chúng phải đổi cùng nhau. Tách rời ra ba chỗ trong
// thân `md-client` thì lần sau ai sửa thứ tự sẽ phải nhớ cả ba.
//
// ⚠️ Component này **tính hành trình MỘT LẦN** rồi chia cho cả Command Center
// lẫn *"Đơn hàng đang ở đâu?"*. Trước đây `MdOrderJourney` tự tính bên trong —
// nay hai chỗ cùng cần, mà tính hai lần là mở cửa cho **hai con số khác nhau
// trên cùng một màn hình**.
// ============================================================================
import { useMemo } from 'react';

import MdCommandCenter from './md-command-center';
import MdActionCards from './md-action-cards';
import MdRiskCenter from './md-risk-center';
import { tinhHanhTrinh, type ChungTuCon, type BienBanKiem, type HanhTrinh } from '@/lib/mos/md/order-journey';
import { tongQuanMd } from '@/lib/mos/md/command-center-kpi';
import type { BaoCaoNgay, DichCanhBao } from '@/lib/mos/md/daily-digest';
import type { MosAlert, MosTask } from '@/lib/mos/command-center.contract';

export interface DonChoHanhTrinh {
  id: string;
  po_number: string;
  status: string;
  customer_name: string;
  delivery_date: string;
}

export default function MdWorkspaceHead({
  pos, materials, productions, shipments, inspections, today,
  baoCao, tasks, alerts, loi, onDi, onTaoPo, onTaoKhach, onChietTinh,
}: {
  pos: readonly DonChoHanhTrinh[];
  materials: ChungTuCon[];
  productions: ChungTuCon[];
  shipments: ChungTuCon[];
  inspections: BienBanKiem[];
  today: string;
  baoCao: BaoCaoNgay;
  tasks: readonly MosTask[];
  alerts: readonly MosAlert[];
  loi?: string | null;
  onDi: (dich: DichCanhBao) => void;
  onTaoPo: () => void;
  onTaoKhach: () => void;
  onChietTinh: () => void;
}) {
  const hanhTrinh: HanhTrinh[] = useMemo(
    () => pos.map((p) => tinhHanhTrinh({
      poNumber: p.po_number,
      poStatus: p.status,
      materials, productions, shipments, inspections,
      deliveryDate: p.delivery_date,
      today,
    })),
    [pos, materials, productions, shipments, inspections, today],
  );

  const tq = useMemo(
    () => tongQuanMd(
      hanhTrinh,
      tasks.map((t) => ({ title: t.title, urgencyDays: t.urgencyDays })),
      baoCao,
    ),
    [hanhTrinh, tasks, baoCao],
  );

  const veKhuRuiRo = () => {
    document.getElementById('khu-rui-ro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const veViec = () => {
    document.getElementById('viec-hom-nay')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <MdCommandCenter
        tq={tq}
        onMoDon={() => onDi('po')}
        onMoViec={veViec}
        onMoRuiRo={veKhuRuiRo}
      />
      <MdActionCards
        onTaoPo={onTaoPo}
        onTaoKhach={onTaoKhach}
        onChietTinh={onChietTinh}
        onShipment={() => onDi('shipments')}
      />
      <MdRiskCenter canhBao={baoCao.canhBao} alerts={alerts} loi={loi} onDi={onDi} />
    </>
  );
}

/** Hành trình đã tính — để `md-client` chuyển thẳng cho *"Đơn hàng đang ở đâu?"*
 *  mà ⛔ không phải tính lần thứ hai. */
export function tinhHanhTrinhChoMd(
  pos: readonly DonChoHanhTrinh[],
  materials: ChungTuCon[],
  productions: ChungTuCon[],
  shipments: ChungTuCon[],
  inspections: BienBanKiem[],
  today: string,
): HanhTrinh[] {
  return pos.map((p) => tinhHanhTrinh({
    poNumber: p.po_number,
    poStatus: p.status,
    materials, productions, shipments, inspections,
    deliveryDate: p.delivery_date,
    today,
  }));
}
