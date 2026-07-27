// ============================================================================
// MONICA GARMENT ERP — TypeScript Interfaces (Single Source of Truth)
// ============================================================================

export type Role =
  | 'superadmin' | 'giamdoc' | 'md' | 'qa' | 'totruongmay'
  | 'totruongcat' | 'kho' | 'ketoan' | 'subcon' | 'buyer';

export interface User {
  id: string;
  username: string;
  password: string; // ⚠️ DEMO ONLY — production dùng Supabase Auth + bcrypt
  role: Role;
  name: string;
  avatar: string; // chữ cái viết tắt
  subcon_id?: string | null; // gán cho tài khoản subcon
  buyer_brand?: string | null; // gán cho tài khoản buyer
  active: boolean;
}

export type OrderStatus = 'Mới' | 'Đang cắt' | 'Đang may' | 'Chờ QA' | 'Hoàn thành' | 'Đã xuất';

export interface Order {
  id: string;
  po_code: string;
  brand: string;
  product_name: string;
  target_qty: number;
  size_breakdown: Record<string, number>; // { S: 200, M: 300, ... }
  unit_price_cmt: number; // đơn giá gia công trả subcon/chuyền (VNĐ/SP)
  unit_price_fob: number; // giá bán buyer (VNĐ/SP) — KHÔNG dùng trả subcon
  status: OrderStatus;
  etd_date: string;       // ngày giao hàng cam kết
  xfactory_date: string;  // ngày xuất xưởng kế hoạch
  subcon_id: string | null; // null = may nội bộ
  line_id: string | null;
  created_at: string;
}

export type BomCategory = 'Vải' | 'Chỉ' | 'Cúc' | 'Khóa' | 'Nhãn' | 'Bao bì';
export type NplStatus = 'Đã về kho' | 'Đang về' | 'Chưa đặt' | 'Thiếu hụt';

export interface BomItem {
  id: string;
  order_id: string;
  item_name: string;
  category: BomCategory;
  unit: string; // m | kg | cuộn | cái | bộ
  norm_per_pcs: number;      // định mức / sản phẩm
  wastage_percent: number;   // % hao hụt cho phép
  npl_status: NplStatus;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  type: 'NPL' | 'Thành phẩm';
  qty_kg: number;
  qty_m: number;
  gsm: number;
  width_m: number;
  color_code: string;
  dye_lot: string;   // số lô nhuộm
  shade: 'A' | 'B' | 'C' | '';
  roll_count: number;
  safety_stock: number; // mức tồn an toàn (theo đơn vị chính của item)
  order_id: string | null; // thành phẩm gắn PO
}

export interface CuttingLog {
  id: string;
  order_id: string;
  marker_name: string;
  table_count: number;  // số bàn cắt
  ply_count: number;    // số lá vải / bàn
  size_ratio: Record<string, number>; // tỷ lệ phối size trên sơ đồ
  cut_qty: number;          // BTP cắt đạt
  fabric_used_m: number;    // vải xả cây thực tế
  marker_length_m: number;  // vải nằm trên sơ đồ
  waste_percent: number;    // tự tính từ garment-math
  created_at: string;
}

export interface Bundle {
  id: string;
  order_id: string;
  cutting_log_id: string;
  bundle_no: string; // PO-SIZE-STT
  size: string;
  qty: number;
  status: 'Đã cắt' | 'Đã giao chuyền';
}

export interface ProdLog {
  id: string;
  order_id: string;
  subcon_id: string | null;
  line_id: string | null;
  stage: string; // công đoạn: May thân, Tra tay, Vào khóa, Hoàn thiện...
  qty_ok: number;
  qty_defect: number;
  hour_slot: string; // '08h' ... '17h'
  photo_url: string | null;
  created_at: string;
}

export type DefectClass = 'Critical' | 'Major' | 'Minor';
export type AqlStatus = 'Pass' | 'Fail' | 'Pending';

export interface QALog {
  id: string;
  order_id: string;
  inspection_type: 'Inline' | 'Endline';
  lot_size: number;
  sample_size: number;
  ac_number: number;
  re_number: number;
  defect_type: string;       // tên lỗi: Bỏ mũi, Loang màu...
  defect_class: DefectClass;
  qty_defect: number;
  checked_qty: number;
  aql_status: AqlStatus;
  capa_note: string;
  created_at: string;
}

export type SampleStage = 'Proto' | 'Fit' | 'SMS' | 'PP' | 'TOP';
export type SampleStatus = 'Đang làm' | 'Đã gửi' | 'Approved' | 'Rejected';

export interface SampleRecord {
  id: string;
  order_id: string;
  stage: SampleStage;
  status: SampleStatus;
  buyer_comment: string;
  sent_date: string | null;
}

export interface FinancialRecord {
  id: string;
  order_id: string;
  subcon_id: string;
  qa_passed_qty: number;   // CĂN CỨ DUY NHẤT để thanh toán (từ QA Endline Pass)
  unit_price: number;      // đơn giá CMT của PO
  penalty_amount: number;  // đền bù vải hỏng / phạt trễ
  penalty_note: string;
  advance_pay: number;     // tạm ứng đã nhận (đối trừ)
  total_pay: number;       // = qa_passed_qty*unit_price - penalty - advance
  status: 'Chờ đối soát' | 'Đã chốt' | 'Đã thanh toán';
}

export type ApprovalType = 'Cấp bù NPL' | 'Hợp đồng Subcon' | 'Xuất vượt định mức';

export interface Approval {
  id: string;
  type: ApprovalType;
  requester: string;
  order_id: string | null;
  content: string;
  qty: number;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
  reason: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  carton_count: number;
  qty: number;
  gw_kg: number;
  nw_kg: number;
  etd: string;
  status: 'Chuẩn bị' | 'Đã xuất';
}

export interface AppNotification {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  roles: Role[]; // vai trò được nhận
  read: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  order_id: string;
  buyer_user: string;
  rating: number; // 1..5
  content: string;
  created_at: string;
}

export interface SystemLog {
  id: string;
  user: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface Subcon {
  id: string;
  name: string;
  contact: string;
  phone: string;
  capacity_per_day: number;
}

export interface SewingLine {
  id: string;
  name: string;
  worker_count: number;
  sam_default: number; // phút chuẩn / SP
}

export interface Setting {
  id: string;
  key: string;
  value: string;
}
