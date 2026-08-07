'use client';

// ============================================================================
// MD HOME V2 — BỐ CỤC BA CỘT
//
// Board Directive 07/08/2026 *(MD Home V2)*:
//
//   > *"⛔ Không làm Dashboard dài phải cuộn … Desktop: **bố cục 3 cột**. ⛔
//   > Không dùng 1 cột dài."*
//
//   ┌───────────────────────────────────────┐
//   │ Action Center                         │
//   ├──────────────┬────────────────┬───────┤
//   │ MY WORK      │ ORDER CENTER   │ RISK  │
//   └──────────────┴────────────────┴───────┘
//   Dashboard  ← đặt DƯỚI ba cột
//
// ─── 🔑 BA CỘT ĐỔI **HÌNH DẠNG**, ⛔ KHÔNG ĐỔI **THỨ TỰ ƯU TIÊN** ────────
// `WORKSPACE_DESIGN_DNA.md` khoá **trình tự câu hỏi trong đầu người dùng**, ⛔
// không khoá *"phải xếp dọc"*. Ba cột giữ nguyên trình tự đó bằng **vị trí
// ngang**: mắt đọc trái→phải, và cột phải là chỗ **duy nhất** có màu đỏ nên nó
// hút mắt trước dù nằm cuối hàng.
//
// ⚠️ ĐIỆN THOẠI XẾP DỌC THEO ĐÚNG THỨ TỰ BOARD KHAI:
//     Action → Risk → Today Work → Orders → Dashboard
// 🔑 Trên điện thoại **Risk lên TRƯỚC My Work** — ngược với máy bàn. Có lý do:
// máy bàn thấy cả ba cột cùng lúc nên vị trí ⛔ không quyết định thứ tự đọc;
// điện thoại thì thứ tự **là** tất cả, và cái đang cháy phải lên trước.
// Thực hiện bằng `order-*` của Tailwind, ⛔ không nhân đôi JSX.
// ============================================================================
import { useMemo } from 'react';

import MdCommandCenter from './md-command-center';
import MdActionCards, { type HanhDongMd } from './md-action-cards';
import MdRiskCenter from './md-risk-center';
import MdDailyFocus from './md-daily-focus';
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
  baoCao, tasks, alerts, loi, onDi, hanhDong,
  orderCenter, hopThuViec, hoatDong, dashboard,
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
  hanhDong: HanhDongMd;
  /** Cột giữa — hành trình đơn + bảng PO. */
  orderCenter: React.ReactNode;
  /** Cột trái — hộp thư việc đầy đủ. */
  hopThuViec: React.ReactNode;
  /** Cột trái, đáy — nhật ký gần đây. Board §3: *"đưa xuống cuối cột"*. */
  hoatDong?: React.ReactNode;
  /** Dưới ba cột. */
  dashboard: React.ReactNode;
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
      {/* ═══ ACTION CENTER — trên cùng, full chiều ngang ═══════════════════ */}
      <MdActionCards hd={hanhDong} />

      {/* ═══ BA CỘT ═══════════════════════════════════════════════════════
          `lg:grid-cols-12` chia 3 / 6 / 3: cột giữa **gấp đôi** hai cột bên
          vì nó chứa bảng dữ liệu — chia đều thì bảng PO bị bóp còn một nửa
          chiều ngang và phải cuộn ngang, thứ Board vừa yêu cầu tránh. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ─── CỘT TRÁI · MY WORK ────────────────────────────────────────
            Điện thoại: `order-2` — sau Risk. Máy bàn: cột đầu. */}
        <section aria-label="Công việc của tôi" className="order-2 space-y-5 lg:order-1 lg:col-span-3">
          <MdCommandCenter
            tq={tq}
            onMoDon={() => onDi('po')}
            onMoViec={veViec}
            onMoRuiRo={veKhuRuiRo}
          />
          <div id="viec-hom-nay" className="scroll-mt-24 space-y-5">
            <MdDailyFocus bc={baoCao} onDi={onDi} />
            {hopThuViec}
          </div>
          {/* Board §3: *"Recent Activity — đưa xuống cuối cột."* */}
          {hoatDong}
        </section>

        {/* ─── CỘT GIỮA · ORDER CENTER ───────────────────────────────────
            Điện thoại: `order-3`. Board xếp Orders sau Today Work. */}
        <section aria-label="Order Center" className="order-3 space-y-5 lg:order-2 lg:col-span-6">
          {orderCenter}
        </section>

        {/* ─── CỘT PHẢI · RISK ───────────────────────────────────────────
            🔴 Điện thoại: `order-1` — LÊN ĐẦU, trước cả My Work. Cái đang
            cháy phải đọc trước khi cuộn tay mỏi. */}
        <section aria-label="Cần xử lý ngay" className="order-1 lg:order-3 lg:col-span-3">
          <MdRiskCenter canhBao={baoCao.canhBao} alerts={alerts} loi={loi} onDi={onDi} />
        </section>
      </div>

      {/* ═══ DASHBOARD — DƯỚI ba cột, Board §6 ════════════════════════════ */}
      <div className="mt-5">{dashboard}</div>
    </>
  );
}
