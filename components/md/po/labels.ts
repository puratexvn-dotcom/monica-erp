// ============================================================================
// CẦU NỐI NHÃN CHO CÁC TAB PO 360°
//
// Các tab là client component, còn schema nằm ở '@/schemas/md' (dùng chung
// client + server). File này gom lại một cửa để tab chỉ import một chỗ, và
// thêm vài hàm tra nhãn AN TOÀN cho giá trị đến từ DB.
//
// Vì sao cần bản "an toàn": dữ liệu trong DB có thể chứa mã cũ không còn trong
// enum (ví dụ status 'Approved' viết hoa kiểu khác từ thời demo). Tra thẳng
// Record sẽ ra undefined và giao diện hiện ô trống — người vận hành không biết
// là thiếu nhãn hay thiếu dữ liệu. Bản an toàn trả về chính mã gốc.
// ============================================================================

export {
  ORDER_TYPE_LABEL,
  INCOTERM_LABEL,
  CURRENCY_LABEL,
  SHIP_MODE_LABEL,
  MATERIAL_CATEGORY_LABEL,
  PO_STATUS_LABEL,
  STYLE_STATUS_LABEL,
  GENDER_LABEL,
  MILESTONE_STATUS_LABEL,
  SAMPLE_STAGE_LABEL,
  SAMPLE_STATUS_LABEL,
  RISK_LEVEL_LABEL,
  COST_CATEGORY_LABEL,
  INQUIRY_STATUS_LABEL,
  COSTING_STATUS_LABEL,
  CHANGE_TYPE_LABEL,
  CHANGE_STATUS_LABEL,
  DOC_TYPE_LABEL,
  TASK_STATUS_LABEL,
  ENTITY_TYPE_LABEL,
  AUDIT_ACTION_LABEL,
  COST_CATEGORIES,
  INQUIRY_STATUSES,
  COSTING_STATUSES,
  CHANGE_TYPES,
  CHANGE_STATUSES,
  DOC_TYPES,
  TASK_STATUSES,
  ENTITY_TYPES,
  ORDER_TYPES,
  INCOTERMS,
  CURRENCIES,
  SHIP_MODES,
  PO_STATUSES,
  STYLE_STATUSES,
  GENDERS,
  MATERIAL_CATEGORIES,
  SAMPLE_STAGES,
  SAMPLE_STATUSES,
  RISK_WEIGHTS,
  resolveMilestoneState,
  sampleApprovalRate,
  buildSizeMatrix,
  previewRiskScore,
  riskLevelOf,
  criticalPath,
  vnToday,
  type OrderType,
  type Incoterm,
  type ShipMode,
  type PoStatus,
  type StyleStatus,
  type RiskLevel,
  type MilestoneStatus,
} from '@/schemas/md';

// Nhãn của hai bảng có từ trước Bước 4 (đề nghị mua NPL, lệnh sản xuất) nằm ở
// md-schema.ts. Tái xuất qua đây để mọi màn hình chỉ phải nhớ một cửa nhập.
export { MR_STATUS_LABEL, PROD_STATUS_LABEL } from '@/app/(dashboard)/md/md-schema';

import { ROLE_LABEL, isRole, ALL_ROLES } from '@/lib/rbac';

export { ALL_ROLES };

/** Tên bộ phận bằng tiếng Việt. Mã lạ thì trả nguyên mã, không trả rỗng. */
export function ROLE_LABEL_SAFE(code: string): string {
  return isRole(code) ? ROLE_LABEL[code] : code;
}

/** Tra nhãn an toàn cho mọi bản đồ nhãn */
export function labelOf(map: Record<string, string>, code: string | null | undefined): string {
  if (!code) return '—';
  return map[code] ?? code;
}
