// ============================================================================
// TỪ ĐIỂN PHÂN HỆ MERCHANDISER — VN · EN · CN
//
// Điều XXI: mã MỚI phải đi qua i18n. Phần cũ của /md vẫn viết cứng tiếng Việt
// theo chiến lược "biên giới mới" đã chốt — không sửa lại, chỉ mã mới tuân thủ.
//
// ⚠️ Ba khối phải có ĐÚNG cùng bộ khoá; Record<MdKey, string> ép điều đó lúc
// biên dịch.
// ============================================================================

const VN = {
  // ─── Dòng chảy đơn hàng ─────────────────────────────────────────────────
  md_view_list: 'Danh sách',
  md_view_flow: 'Dòng chảy',
  md_flow_title: 'Dòng chảy đơn hàng',
  md_flow_hint: 'Bấm một cột hoặc một làn để lọc danh sách bên dưới',
  md_lane_title: 'Việc cần chạm hôm nay',

  // Giai đoạn
  md_stage_APPROVED: 'Đã duyệt',
  md_stage_IN_PRODUCTION: 'Đang sản xuất',
  md_stage_COMPLETED: 'Hoàn thành',
  md_stage_SHIPPED: 'Đã xuất',

  // Mức khẩn
  md_urg_OVERDUE: 'Quá hạn giao',
  md_urg_CRITICAL: 'Gấp',
  md_urg_WARNING: 'Cần theo dõi',
  md_urg_NORMAL: 'Đúng lịch',
  md_urg_OVERDUE_hint: 'Đã qua ngày giao mà chưa xuất',
  md_urg_CRITICAL_hint: 'Còn ≤ 7 ngày, hoặc đã trễ mốc T&A, hoặc rủi ro nguy kịch',
  md_urg_WARNING_hint: 'Còn ≤ 21 ngày, hoặc rủi ro cao',
  md_urg_NORMAL_hint: 'Chưa có dấu hiệu cần can thiệp',

  // Đếm ngược
  md_days_left: 'Còn {n} ngày',
  md_days_over: 'Quá hạn {n} ngày',
  md_days_today: 'Giao hôm nay',
  md_no_date: 'Chưa có ngày giao',

  // Đơn vị & nhãn
  md_po_count: 'đơn',
  md_pcs: 'sản phẩm',
  md_hot: 'cần gấp',
  md_flow_empty: 'Chưa có đơn hàng nào trong dòng chảy',
  md_flow_empty_hint: 'Đơn ở trạng thái Đã huỷ không nằm trong dòng chảy.',
  md_clear_filter: 'Bỏ lọc',
};

export type MdKey = keyof typeof VN;

const EN: Record<MdKey, string> = {
  md_view_list: 'List',
  md_view_flow: 'Flow',
  md_flow_title: 'Order flow',
  md_flow_hint: 'Click a column or a lane to filter the list below',
  md_lane_title: "Today's priorities",

  md_stage_APPROVED: 'Approved',
  md_stage_IN_PRODUCTION: 'In production',
  md_stage_COMPLETED: 'Completed',
  md_stage_SHIPPED: 'Shipped',

  md_urg_OVERDUE: 'Overdue',
  md_urg_CRITICAL: 'Urgent',
  md_urg_WARNING: 'Watch',
  md_urg_NORMAL: 'On schedule',
  md_urg_OVERDUE_hint: 'Past the delivery date and not shipped',
  md_urg_CRITICAL_hint: '≤ 7 days left, or a missed T&A milestone, or critical risk',
  md_urg_WARNING_hint: '≤ 21 days left, or high risk',
  md_urg_NORMAL_hint: 'No sign of trouble yet',

  md_days_left: '{n} days left',
  md_days_over: '{n} days overdue',
  md_days_today: 'Ships today',
  md_no_date: 'No delivery date',

  md_po_count: 'orders',
  md_pcs: 'pcs',
  md_hot: 'urgent',
  md_flow_empty: 'No order in the flow yet',
  md_flow_empty_hint: 'Cancelled orders are not part of the flow.',
  md_clear_filter: 'Clear filter',
};

const CN: Record<MdKey, string> = {
  md_view_list: '列表',
  md_view_flow: '流程',
  md_flow_title: '订单流程',
  md_flow_hint: '点击某一列或某一通道以筛选下方列表',
  md_lane_title: '今日待办',

  md_stage_APPROVED: '已批准',
  md_stage_IN_PRODUCTION: '生产中',
  md_stage_COMPLETED: '已完成',
  md_stage_SHIPPED: '已出货',

  md_urg_OVERDUE: '已逾期',
  md_urg_CRITICAL: '紧急',
  md_urg_WARNING: '需关注',
  md_urg_NORMAL: '按计划',
  md_urg_OVERDUE_hint: '已过交期但尚未出货',
  md_urg_CRITICAL_hint: '剩余 ≤ 7 天，或已延误 T&A 节点，或风险危急',
  md_urg_WARNING_hint: '剩余 ≤ 21 天，或高风险',
  md_urg_NORMAL_hint: '暂无需要介入的迹象',

  md_days_left: '剩 {n} 天',
  md_days_over: '逾期 {n} 天',
  md_days_today: '今日交货',
  md_no_date: '暂无交期',

  md_po_count: '张订单',
  md_pcs: '件',
  md_hot: '需紧急处理',
  md_flow_empty: '流程中暂无订单',
  md_flow_empty_hint: '已取消的订单不计入流程。',
  md_clear_filter: '清除筛选',
};

export const MD_DICT = { VN, EN, CN } as const;
