'use client';

import { useEffect, useState } from 'react';
import {
  Boxes, CalendarClock, ClipboardList, FileQuestion, Loader2, RefreshCw,
  ShoppingCart, TriangleAlert,
} from 'lucide-react';

import { StatCard } from '@/components/ui';
import { getMdDashboardClient } from '@/app/(dashboard)/md/_actions/md4.client';
import type { MdDashboardData } from '@/app/(dashboard)/md/_services/dashboard.service';
import { ChartFrame, BarSeries, LineSeries, PieSeries, CHART_COLORS } from '../chart-kit';
import { MR_STATUS_LABEL, RISK_LEVEL_LABEL, ROLE_LABEL_SAFE, labelOf } from '../po/labels';
import { fmtNum } from '../po/tab-kit';

// ============================================================================
// BẢNG TỔNG QUAN ĐẦU TRANG MERCHANDISER
//
// Tám ô chỉ số + bốn biểu đồ. Trả lời đúng bốn câu người điều hành hỏi mỗi
// sáng: đang chạy bao nhiêu đơn, chỗ nào đang trễ, NPL đã về chưa, đơn nào
// nguy hiểm nhất.
//
// Ô nào đọc không được thì hiện "—", KHÔNG hiện 0 — trong nhà máy, "không có
// đơn nào trễ" và "không đọc được dữ liệu trễ" là hai chuyện hoàn toàn khác.
// ============================================================================

const dash = (n: number | null) => (n === null ? '—' : fmtNum(n));

export default function MdDashboard() {
  const [data, setData] = useState<MdDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    void getMdDashboardClient().then((d) => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(load, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-12 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-sm font-medium">Đang tính số liệu tổng quan...</span>
      </div>
    );
  }
  if (!data) return null;

  const k = data.kpi;
  const e = data.errors;

  const materialData = data.materialByStatus.map((m) => ({
    name: labelOf(MR_STATUS_LABEL, m.status),
    value: m.count,
  }));
  const riskData = data.riskByLevel.map((r) => ({
    name: labelOf(RISK_LEVEL_LABEL, r.level),
    value: r.count,
  }));
  const lateData = data.lateByRole.map((r) => ({
    role: ROLE_LABEL_SAFE(r.role),
    late: r.late,
  }));

  // Rủi ro tô theo mức độ, không tô theo thứ tự bảng màu: đỏ phải là nguy kịch
  const RISK_COLOR: Record<string, string> = {
    'Nguy kịch': '#e11d48', 'Cao': '#f97316', 'Trung bình': '#d97706', 'Thấp': '#059669',
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Tổng quan điều hành</h2>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Tính lại
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label="Đơn đang chạy"
          value={dash(k.runningOrders)}
          sub={k.runningQuantity === null ? 'chưa đọc được' : `${fmtNum(k.runningQuantity)} sản phẩm`}
          tone="indigo"
        />
        <StatCard
          icon={CalendarClock}
          label="Mốc T&A trễ"
          value={dash(k.lateMilestones)}
          sub={k.ordersWithLate === null ? 'chưa đọc được' : `thuộc ${fmtNum(k.ordersWithLate)} đơn`}
          tone={k.lateMilestones && k.lateMilestones > 0 ? 'rose' : 'emerald'}
          alert={Boolean(k.lateMilestones && k.lateMilestones > 0)}
        />
        <StatCard
          icon={Boxes}
          label="NPL chưa về kho"
          value={dash(k.pendingMaterials)}
          sub="đề nghị mua chưa nhận hàng"
          tone={k.pendingMaterials && k.pendingMaterials > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          icon={TriangleAlert}
          label="Đơn rủi ro cao"
          value={dash(k.criticalRisks)}
          sub="mức Cao và Nguy kịch"
          tone={k.criticalRisks && k.criticalRisks > 0 ? 'rose' : 'emerald'}
          alert={Boolean(k.criticalRisks && k.criticalRisks > 0)}
        />
        <StatCard
          icon={FileQuestion}
          label="Yêu cầu báo giá mở"
          value={dash(k.openInquiries)}
          sub="chưa chốt thắng/thua"
          tone="indigo"
        />
        <StatCard
          icon={ClipboardList}
          label="Yêu cầu thay đổi chờ duyệt"
          value={dash(k.openChangeRequests)}
          sub="cần quyết định"
          tone={k.openChangeRequests && k.openChangeRequests > 0 ? 'amber' : 'slate'}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartFrame
          title="Số lượng giao theo tháng"
          hint="12 tháng gần nhất, tính theo ngày giao khách"
          error={e.orders}
          isEmpty={data.deliveryByMonth.every((m) => m.quantity === 0)}
          emptyText="Chưa có đơn hàng nào trong 12 tháng gần đây"
        >
          <BarSeries data={data.deliveryByMonth} xKey="month" yKey="quantity" name="Sản phẩm" />
        </ChartFrame>

        <ChartFrame
          title="Số đơn giao theo tháng"
          hint="đếm số PO có ngày giao rơi vào tháng đó"
          error={e.orders}
          isEmpty={data.deliveryByMonth.every((m) => m.orders === 0)}
          emptyText="Chưa có đơn hàng nào trong 12 tháng gần đây"
        >
          <LineSeries data={data.deliveryByMonth} xKey="month" yKey="orders" name="Đơn hàng" />
        </ChartFrame>

        <ChartFrame
          title="Mốc T&A trễ theo bộ phận"
          hint="quá ngày kế hoạch mà chưa có ngày thực tế"
          error={e.milestones}
          isEmpty={lateData.length === 0}
          emptyText="Không có mốc nào đang trễ"
        >
          <BarSeries data={lateData} xKey="role" yKey="late" name="Mốc trễ" color={CHART_COLORS[2]} />
        </ChartFrame>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <ChartFrame
            title="Tiến độ nguyên phụ liệu"
            hint="đề nghị mua NPL theo trạng thái"
            error={e.materials}
            isEmpty={materialData.length === 0}
            emptyText="Chưa có đề nghị mua NPL nào"
            height={240}
          >
            <PieSeries data={materialData} nameKey="name" valueKey="value" />
          </ChartFrame>

          <ChartFrame
            title="Phân bố mức rủi ro"
            hint="theo điểm chấm của từng đơn"
            error={e.risks}
            isEmpty={riskData.length === 0}
            emptyText="Chưa đơn nào được chấm điểm rủi ro"
            height={240}
          >
            <PieSeries
              data={riskData}
              nameKey="name"
              valueKey="value"
              colors={riskData.map((r) => RISK_COLOR[r.name] ?? CHART_COLORS[6])}
            />
          </ChartFrame>
        </div>
      </div>
    </section>
  );
}
