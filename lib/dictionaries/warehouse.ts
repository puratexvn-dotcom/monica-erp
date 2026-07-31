// ============================================================================
// TỪ ĐIỂN PHÂN HỆ KHO — VN · EN · CN
//
// Điều XXI của Hiến pháp: giai đoạn 1 chạy 100% tiếng Việt, NHƯNG mọi nhãn,
// thông báo, lỗi kiểm tra và tên trạng thái đều phải đi qua i18n. Không viết
// cứng chuỗi trong component.
//
// ─── VÌ SAO TÁCH RA TỆP RIÊNG THAY VÌ NHÉT VÀO lib/i18n.tsx ───────────────
// Từ điển gốc gộp cả ba ngôn ngữ trong một khối. Thêm năm mươi khoá của kho
// vào đó thì tệp phình lên và mỗi lần sửa một nhãn phải cuộn qua nhãn của phân
// hệ khác. Tách theo phân hệ rồi trộn lại ở lib/i18n.tsx: kiểu dữ liệu vẫn suy
// ra đủ mọi khoá nên `t()` vẫn báo lỗi biên dịch nếu gõ sai tên khoá.
//
// ⚠️ Ba khối VN/EN/CN phải có ĐÚNG cùng bộ khoá. Kiểu `Record<Key, string>`
// bên dưới ép điều đó lúc biên dịch — thiếu một khoá ở bản EN là lỗi tsc ngay,
// không phải tới lúc người dùng bấm sang tiếng Anh mới lòi ra chữ trống.
// ============================================================================

const VN = {
  // ─── Màn chấm điểm 4-Point ───────────────────────────────────────────────
  wh_fp_title: 'Chấm điểm vải 4-Point',
  wh_fp_subtitle: 'Kiểm chất lượng nguyên phụ liệu theo hệ 4 điểm của ngành dệt',
  wh_fp_new: 'Lập phiếu kiểm',
  wh_fp_history: 'Phiếu đã kiểm',
  wh_fp_no_history: 'Chưa có phiếu kiểm nào',
  wh_fp_no_history_hint: 'Chọn một cuộn vải rồi bấm Lập phiếu kiểm để bắt đầu.',
  wh_fp_no_roll: 'Không có cuộn vải nào chờ kiểm',
  wh_fp_no_roll_hint: 'Cuộn vải xuất hiện ở đây sau khi được nhập kho.',

  // ─── Chọn cuộn ───────────────────────────────────────────────────────────
  wh_roll: 'Cuộn vải',
  wh_roll_select: 'Chọn cuộn cần kiểm',
  wh_material: 'Vật tư',
  wh_lot: 'Lô',
  wh_shade: 'Tông màu',
  wh_shade_none: 'Chưa gán tông',
  wh_bin: 'Vị trí',
  wh_customer: 'Khách hàng',
  wh_customer_none: 'Chưa chọn — dùng ngưỡng mặc định nhà máy',

  // ─── Kích thước & đơn vị ─────────────────────────────────────────────────
  wh_entry_uom: 'Đơn vị nhập',
  wh_uom_meters: 'Mét',
  wh_uom_yards: 'Yard',
  wh_length: 'Chiều dài đã kiểm',
  wh_width: 'Khổ vải',
  wh_convert_note: 'Hệ thống lưu theo mét và tự quy đổi sang yard vuông để chấm điểm.',
  wh_as_yd_inch: 'Theo phiếu nhà cung cấp',

  // ─── Đếm lỗi ─────────────────────────────────────────────────────────────
  wh_defects: 'Đếm lỗi theo chiều dài vết',
  wh_defect_p1: 'Tới 3 inch',
  wh_defect_p2: 'Trên 3 – 6 inch',
  wh_defect_p3: 'Trên 6 – 9 inch',
  wh_defect_p4: 'Trên 9 inch',
  wh_point_unit: 'điểm',

  // ─── Kết quả ─────────────────────────────────────────────────────────────
  wh_total_points: 'Tổng điểm phạt',
  wh_area: 'Diện tích đã kiểm',
  wh_score: 'Điểm trên 100 yd²',
  wh_limit: 'Ngưỡng chấp nhận',
  wh_limit_from_customer: 'theo khách hàng',
  wh_limit_from_default: 'mặc định nhà máy',
  wh_verdict: 'Kết luận',
  wh_passed: 'ĐẠT',
  wh_failed: 'TRƯỢT',
  wh_pending: 'CHƯA ĐỦ DỮ LIỆU',
  wh_pending_hint: 'Nhập chiều dài và khổ vải để hệ thống chấm điểm.',
  wh_fail_warning: 'Cuộn TRƯỢT sẽ bị khoá ngay, luồng phân bổ không bốc vào được. Gỡ khoá cần quyền Tổ trưởng Kho trở lên và phải ghi lý do.',

  // ─── Bốn phép thử còn lại ────────────────────────────────────────────────
  wh_extra_tests: 'Các phép thử khác',
  wh_shade_variation: 'Lệch tông',
  wh_shade_ok: 'Đạt',
  wh_shade_slight: 'Lệch nhẹ',
  wh_shade_severe: 'Lệch nặng',
  wh_shrinkage: 'Độ co (%)',
  wh_color_fastness: 'Độ bền màu (1–5)',
  wh_yarn_note: 'Ghi chú lỗi sợi',

  // ─── Hành động & trạng thái ──────────────────────────────────────────────
  wh_save: 'Lưu phiếu kiểm',
  wh_saving: 'Đang lưu...',
  wh_saved: 'Đã lưu phiếu kiểm',
  wh_cancel: 'Huỷ',
  wh_loading: 'Đang tải...',
  wh_retry: 'Thử lại',
  wh_error_load: 'Không đọc được dữ liệu',
  wh_error_save: 'Chưa lưu được phiếu kiểm',
  wh_inspection_no: 'Số phiếu',
  wh_inspected_at: 'Ngày kiểm',
  wh_qa_status: 'Trạng thái kiểm',
  wh_qa_pending: 'Chờ kiểm',
  wh_qa_conditional: 'Dùng có điều kiện',

  // ─── Kiểm tra dữ liệu nhập ───────────────────────────────────────────────
  wh_v_roll_required: 'Phải chọn cuộn vải cần kiểm',
  wh_v_length_positive: 'Chiều dài phải lớn hơn 0',
  wh_v_width_positive: 'Khổ vải phải lớn hơn 0',
  wh_v_defect_negative: 'Số lỗi không được âm',
  wh_v_defect_integer: 'Số lỗi phải là số nguyên',
  wh_v_shrinkage_range: 'Độ co phải trong khoảng -50% đến 50%',
  wh_v_fastness_range: 'Độ bền màu phải từ 1 đến 5',
};

/** Khoá của từ điển kho — ép ba ngôn ngữ có cùng bộ khoá */
export type WarehouseKey = keyof typeof VN;

const EN: Record<WarehouseKey, string> = {
  wh_fp_title: '4-Point Fabric Inspection',
  wh_fp_subtitle: 'Material quality inspection using the textile industry 4-point system',
  wh_fp_new: 'New inspection',
  wh_fp_history: 'Past inspections',
  wh_fp_no_history: 'No inspection recorded yet',
  wh_fp_no_history_hint: 'Pick a fabric roll and click New inspection to start.',
  wh_fp_no_roll: 'No roll awaiting inspection',
  wh_fp_no_roll_hint: 'Rolls appear here once they are received into the warehouse.',

  wh_roll: 'Roll',
  wh_roll_select: 'Select roll to inspect',
  wh_material: 'Material',
  wh_lot: 'Lot',
  wh_shade: 'Shade',
  wh_shade_none: 'No shade assigned',
  wh_bin: 'Location',
  wh_customer: 'Buyer',
  wh_customer_none: 'Not selected — factory default limit applies',

  wh_entry_uom: 'Entry unit',
  wh_uom_meters: 'Meters',
  wh_uom_yards: 'Yards',
  wh_length: 'Inspected length',
  wh_width: 'Fabric width',
  wh_convert_note: 'Stored in meters and converted to square yards for scoring.',
  wh_as_yd_inch: 'As on supplier sheet',

  wh_defects: 'Defect count by defect length',
  wh_defect_p1: 'Up to 3 inches',
  wh_defect_p2: 'Over 3 – 6 inches',
  wh_defect_p3: 'Over 6 – 9 inches',
  wh_defect_p4: 'Over 9 inches',
  wh_point_unit: 'points',

  wh_total_points: 'Total penalty points',
  wh_area: 'Inspected area',
  wh_score: 'Points per 100 sq.yd',
  wh_limit: 'Acceptance limit',
  wh_limit_from_customer: 'buyer standard',
  wh_limit_from_default: 'factory default',
  wh_verdict: 'Verdict',
  wh_passed: 'PASS',
  wh_failed: 'FAIL',
  wh_pending: 'NOT ENOUGH DATA',
  wh_pending_hint: 'Enter length and width so the system can score it.',
  wh_fail_warning: 'A failed roll is blocked immediately and cannot be allocated. Unblocking requires Warehouse Supervisor rights and a written reason.',

  wh_extra_tests: 'Other tests',
  wh_shade_variation: 'Shade variation',
  wh_shade_ok: 'OK',
  wh_shade_slight: 'Slight',
  wh_shade_severe: 'Severe',
  wh_shrinkage: 'Shrinkage (%)',
  wh_color_fastness: 'Colour fastness (1–5)',
  wh_yarn_note: 'Yarn defect note',

  wh_save: 'Save inspection',
  wh_saving: 'Saving...',
  wh_saved: 'Inspection saved',
  wh_cancel: 'Cancel',
  wh_loading: 'Loading...',
  wh_retry: 'Retry',
  wh_error_load: 'Could not load data',
  wh_error_save: 'Could not save the inspection',
  wh_inspection_no: 'Inspection no.',
  wh_inspected_at: 'Inspected on',
  wh_qa_status: 'QA status',
  wh_qa_pending: 'Awaiting inspection',
  wh_qa_conditional: 'Conditional use',

  wh_v_roll_required: 'A roll must be selected',
  wh_v_length_positive: 'Length must be greater than 0',
  wh_v_width_positive: 'Width must be greater than 0',
  wh_v_defect_negative: 'Defect count cannot be negative',
  wh_v_defect_integer: 'Defect count must be a whole number',
  wh_v_shrinkage_range: 'Shrinkage must be between -50% and 50%',
  wh_v_fastness_range: 'Colour fastness must be between 1 and 5',
};

const CN: Record<WarehouseKey, string> = {
  wh_fp_title: '四分制验布',
  wh_fp_subtitle: '按纺织行业四分制标准检验原辅料质量',
  wh_fp_new: '新建验布单',
  wh_fp_history: '历史验布单',
  wh_fp_no_history: '尚无验布记录',
  wh_fp_no_history_hint: '选择一卷面料并点击新建验布单即可开始。',
  wh_fp_no_roll: '没有待检验的布卷',
  wh_fp_no_roll_hint: '布卷入库后会显示在此处。',

  wh_roll: '布卷',
  wh_roll_select: '选择待检布卷',
  wh_material: '物料',
  wh_lot: '批号',
  wh_shade: '色号',
  wh_shade_none: '未分配色号',
  wh_bin: '库位',
  wh_customer: '客户',
  wh_customer_none: '未选择 — 采用工厂默认标准',

  wh_entry_uom: '录入单位',
  wh_uom_meters: '米',
  wh_uom_yards: '码',
  wh_length: '检验长度',
  wh_width: '布幅',
  wh_convert_note: '系统以米存储，并自动换算为平方码进行评分。',
  wh_as_yd_inch: '按供应商单据',

  wh_defects: '按疵点长度计数',
  wh_defect_p1: '3 英寸以内',
  wh_defect_p2: '3 – 6 英寸',
  wh_defect_p3: '6 – 9 英寸',
  wh_defect_p4: '9 英寸以上',
  wh_point_unit: '分',

  wh_total_points: '总扣分',
  wh_area: '检验面积',
  wh_score: '每 100 平方码分数',
  wh_limit: '合格上限',
  wh_limit_from_customer: '客户标准',
  wh_limit_from_default: '工厂默认',
  wh_verdict: '结论',
  wh_passed: '合格',
  wh_failed: '不合格',
  wh_pending: '数据不足',
  wh_pending_hint: '请输入长度和布幅以便系统评分。',
  wh_fail_warning: '不合格布卷将立即锁定，配料流程无法选用。解锁需仓库主管以上权限并填写原因。',

  wh_extra_tests: '其他检验',
  wh_shade_variation: '色差',
  wh_shade_ok: '合格',
  wh_shade_slight: '轻微色差',
  wh_shade_severe: '严重色差',
  wh_shrinkage: '缩率 (%)',
  wh_color_fastness: '色牢度 (1–5)',
  wh_yarn_note: '纱疵备注',

  wh_save: '保存验布单',
  wh_saving: '保存中...',
  wh_saved: '验布单已保存',
  wh_cancel: '取消',
  wh_loading: '加载中...',
  wh_retry: '重试',
  wh_error_load: '无法读取数据',
  wh_error_save: '验布单保存失败',
  wh_inspection_no: '单号',
  wh_inspected_at: '检验日期',
  wh_qa_status: '检验状态',
  wh_qa_pending: '待检验',
  wh_qa_conditional: '有条件使用',

  wh_v_roll_required: '必须选择布卷',
  wh_v_length_positive: '长度必须大于 0',
  wh_v_width_positive: '布幅必须大于 0',
  wh_v_defect_negative: '疵点数不能为负',
  wh_v_defect_integer: '疵点数必须为整数',
  wh_v_shrinkage_range: '缩率须在 -50% 至 50% 之间',
  wh_v_fastness_range: '色牢度须在 1 至 5 之间',
};

export const WAREHOUSE_DICT = { VN, EN, CN } as const;
