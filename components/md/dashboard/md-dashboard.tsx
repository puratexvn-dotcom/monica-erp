'use client';

import { Loader2 } from 'lucide-react';

import type { MdDashboardData } from '@/app/(dashboard)/md/_services/dashboard.service';
import { ChartFrame, BarSeries, LineSeries, PieSeries, CHART_COLORS } from '../chart-kit';
import { MR_STATUS_LABEL, RISK_LEVEL_LABEL, ROLE_LABEL_SAFE, labelOf } from '../po/labels';

// ============================================================================
// BỐN BIỂU ĐỒ PHÂN TÍCH — ĐẶT Ở CUỐI TRANG
//
// ─── VÌ SAO Ở CUỐI, KHÔNG PHẢI ĐẦU ─────────────────────────────────────────
// Merchandiser mở màn hình để LÀM VIỆC, không phải để ngắm biểu đồ. Đặt biểu
// đồ lên đầu thì mỗi lần vào phải cuộn qua gần một màn hình mới tới được bảng
// đơn hàng. Biểu đồ là thứ xem một lần mỗi sáng; danh sách đơn là thứ mở hàng
// chục lần mỗi ngày.
//
// ─── VÌ SAO NHẬN SỐ LIỆU QUA PROP ──────────────────────────────────────────
// Khối chỉ số ở trên và khối này dùng CHUNG một bộ số liệu (xem
// use-md-dashboard.ts). Mỗi khối tự gọi thì vừa tính hai lần, vừa có nguy cơ
// hai khối hiện hai con số lệch nhau nếu có ai ghi dữ liệu xen vào giữa.
//
// ⚠️ Thư viện biểu đồ nặng gần 100 kB nên file này được nạp bằng next/dynamic
// từ md-client.tsx, không import thẳng.
// ============================================================================

/** Rủi ro tô theo MỨC ĐỘ chứ không theo thứ tự bảng màu: đỏ phải luôn là nguy
 *  kịch, xanh phải luôn là thấp. Đảo màu giữa các lần vẽ là mời người đọc hiểu
 *  nhầm chính xác cái mà biểu đồ định cảnh báo. */
const RISK_COLOR: Record<string, string> = {
  'Nguy kịch': '#e11d48',
  'Cao': '#f97316',
  'Trung bình': '#d97706',
  'Thấp': '#059669',
};

export default function MdCharts({ data }: { data: MdDashboardData | null }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-12 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-sm font-medium">Đang dựng biểu đồ...</span>
      </div>
    );
  }

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

  return (
    <section aria-label="Biểu đồ phân tích" className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Biểu đồ phân tích</h2>

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
          emptyText="Không có mốc tiến độ nào đang trễ"
        >
          <BarSeries data={lateData} xKey="role" yKey="late" name="Mốc trễ" color={CHART_COLORS[2]} />
        </ChartFrame>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ChartFrame
            title="Tiến độ nguyên phụ liệu"
            hint="đề nghị mua NPL theo trạng thái"
            error={e.materials}
            isEmpty={materialData.length === 0}
            emptyText="Chưa có đề nghị mua NPL nào"
          >
            <PieSeries data={materialData} nameKey="name" valueKey="value" />
          </ChartFrame>

          <ChartFrame
            title="Phân bố mức rủi ro"
            hint="theo điểm chấm của từng đơn"
            error={e.risks}
            isEmpty={riskData.length === 0}
            emptyText="Chưa đơn nào được chấm điểm rủi ro"
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
