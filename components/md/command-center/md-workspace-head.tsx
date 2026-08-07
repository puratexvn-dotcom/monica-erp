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
import WorkspaceHomeGrid from '@/components/workspace/workspace-home-grid';
import MdBusinessLauncher, { type OLauncher } from './md-business-launcher';
import { tinhHanhTrinh, type ChungTuCon, type BienBanKiem, type HanhTrinh } from '@/lib/mos/md/order-journey';
import { tongQuanMd } from '@/lib/mos/md/command-center-kpi';
import { tieuDiemHomNay } from '@/lib/mos/md/daily-focus';
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
  baoCao, tasks, alerts, loi, onDi, hanhDong, oLauncher, onMoTab,
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
  /** ① Business Identity — 10 ô, luôn trên cùng. */
  oLauncher: readonly OLauncher[];
  onMoTab: (tab: string) => void;
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

  // 🔑 Tính MỘT LẦN rồi chia cho cả hai khối: *Hôm nay* bày chúng, *Cần xử lý
  // ngay* bỏ chúng ra. Tính hai lần là mở cửa cho hai danh sách lệch nhau.
  const tieuDiem = useMemo(() => tieuDiemHomNay(baoCao), [baoCao]);
  const daBayOTieuDiem = useMemo(() => tieuDiem.map((v) => v.viec), [tieuDiem]);

  const veKhuRuiRo = () => {
    document.getElementById('khu-rui-ro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const veViec = () => {
    document.getElementById('viec-hom-nay')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    // ═══════════════════════════════════════════════════════════════════════
    // BỐ CỤC V4 — Board Directive *MD V4 Coding* §2:
    //
    //   Header → Business Launcher → Action Center
    //   → [ Today | KPI | Risk ]  (3 cột)
    //   → Order Journey → PO Workspace → Management (thu gọn)
    //
    // ⚠️ ĐỔI SO VỚI V2: ba cột nay là **Today | KPI | Risk**, còn Order
    // Journey xuống **full chiều ngang** bên dưới. Journey cần cả bề ngang để
    // sáu chặng đọc được; nhét nó vào một cột 606px là ép nó thành bảng.
    // ═══════════════════════════════════════════════════════════════════════
    <>
      {/* ① BUSINESS IDENTITY */}
      <MdBusinessLauncher o={oLauncher} onMoTab={onMoTab} />

      {/* ② ACTION CENTER */}
      <MdActionCards hd={hanhDong} />

      {/* ③ TODAY | KPI | RISK — ba cột ngang nhau, ⛔ không cột nào gấp đôi:
          cả ba đều là khối ĐỌC NHANH, ⛔ không khối nào chứa bảng. */}
      <WorkspaceHomeGrid
        deu
        myWork={
          <div id="viec-hom-nay" className="scroll-mt-24">
            <MdDailyFocus bc={baoCao} onDi={onDi} onXemTatCa={() => onMoTab('audit')} />
          </div>
        }
        workCenter={
          <MdCommandCenter
            tq={tq}
            onMoDon={() => onDi('po')}
            onMoViec={veViec}
            onMoRuiRo={veKhuRuiRo}
          />
        }
        risk={
          <MdRiskCenter
            canhBao={baoCao.canhBao}
            alerts={alerts}
            loi={loi}
            onDi={onDi}
            boQua={daBayOTieuDiem}
          />
        }
      />

      {/* ④ ORDER JOURNEY + ⑤ PO WORKSPACE — full chiều ngang */}
      <div className="mt-5 space-y-5">{orderCenter}</div>

      {/* ⑥ MANAGEMENT — mặc định thu gọn */}
      <div className="mt-5 space-y-3">
        {hopThuViec}
        {hoatDong}
        {dashboard}
      </div>
    </>
  );
}
