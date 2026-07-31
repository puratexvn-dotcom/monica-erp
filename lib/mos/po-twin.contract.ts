// ============================================================================
// PO DIGITAL TWIN — HỢP ĐỒNG MIỀN NGHIỆP VỤ
//
// PO là AGGREGATE ROOT của MONICA MOS. Buyer → PO → NPL → Kho → Sản xuất → QA
// → Xuất hàng → Kế toán → Bảng giám đốc: mọi phân hệ đều xoay quanh nó.
//
// ─── VÌ SAO KIỂU DỮ LIỆU KHÔNG XẾP THEO TAB ──────────────────────────────
// Tám tab chỉ là CÁCH BÀY. Nếu đặt kiểu theo tab (ExecutiveTabData,
// ProductionTabData...) thì ngày mai gộp hai tab làm một là phải sửa cả tầng
// miền. Ở đây kiểu xếp theo LĨNH VỰC nghiệp vụ; tab tự chọn lấy lát cắt nó cần.
//
// ─── VÌ SAO MỌI SỐ ĐỀU number | null ─────────────────────────────────────
// Điều XX: 0 là 0, không đọc được là "—". Một PO có 0 sản phẩm đã may khác hẳn
// một PO chưa ai nhập sản lượng. Dùng 0 cho cả hai là xoá mất một sự thật.
// ============================================================================

import type { PoStage, Urgency } from '@/lib/mos/po-flow';

/** Tám lát cắt của Digital Twin. Là VIEW, không phải miền nghiệp vụ. */
export const PO_VIEWS = [
  'executive', 'production', 'material', 'quality',
  'buyer', 'shipment', 'activity', 'finance',
] as const;
export type PoView = (typeof PO_VIEWS)[number];

// ─── LÕI ĐỊNH DANH ──────────────────────────────────────────────────────────

export interface PoIdentity {
  id: string;
  poNumber: string;
  customerId: string | null;
  customerName: string;
  styleNo: string | null;
  styleName: string | null;
  totalQuantity: number;
  orderDate: string | null;
  deliveryDate: string | null;
  exFactoryDate: string | null;
  factoryName: string | null;
  orderType: string | null;
  currency: string | null;
  unitPrice: number | null;
  status: string;
}

// ─── RỦI RO ─────────────────────────────────────────────────────────────────

/** Bốn điểm thành phần lấy từ bảng risk_assessments. Không tự chấm lại ở giao
 *  diện: điểm phải giống hệt bảng tổng của giám đốc. */
export interface PoRisk {
  materialScore: number | null;
  scheduleScore: number | null;
  qualityScore: number | null;
  capacityScore: number | null;
  totalScore: number | null;
  /** LOW · MEDIUM · HIGH · CRITICAL — do view v_order_risk quy đổi */
  level: string | null;
  computedAt: string | null;
}

// ─── CÁC LĨNH VỰC ───────────────────────────────────────────────────────────

export interface PoProgress {
  /** Số sản phẩm đã may đạt. null = chưa đọc được, KHÁC 0 = chưa may cái nào */
  sewnOk: number | null;
  sewnDefect: number | null;
  cutPlanned: number | null;
  cutActual: number | null;
  packedCartons: number | null;
  /** Phần trăm so với tổng đặt hàng. null khi chưa đủ dữ liệu để tính. */
  sewnPct: number | null;
}

export interface PoMaterial {
  bomLines: number | null;
  readyLines: number | null;
  missingLines: number | null;
  reservedRolls: number | null;
}

export interface PoQuality {
  inspected: number | null;
  defects: number | null;
  /** Lỗi trên trăm sản phẩm. null khi chưa kiểm cái nào — KHÔNG trả 0. */
  dhu: number | null;
  aqlPassed: number | null;
  aqlFailed: number | null;
}

export interface PoFinance {
  unitPrice: number | null;
  currency: string | null;
  /** Giá trị đơn = đơn giá × sản lượng. null khi thiếu một trong hai. */
  orderValue: number | null;
  advancePay: number | null;
  totalPay: number | null;
  penalty: number | null;
  outstanding: number | null;
}

export interface PoShipment {
  shipments: number | null;
  cartons: number | null;
  earliestEtd: string | null;
}

export interface PoCollaboration {
  comments: number | null;
  documents: number | null;
  openChanges: number | null;
  pendingSamples: number | null;
}

// ─── GỘP ────────────────────────────────────────────────────────────────────

/** Dữ liệu cho THANH ĐẦU và Tab 1. Bảy tab còn lại tự nạp lát cắt của mình khi
 *  người dùng bấm vào — nạp cả tám lúc mở trang là tám lượt truy vấn mà bảy
 *  trong số đó có thể không ai xem. */
export interface PoTwinHeader {
  identity: PoIdentity;
  risk: PoRisk;
  progress: PoProgress;
  material: PoMaterial;
  quality: PoQuality;
  finance: PoFinance;
  shipment: PoShipment;
  collab: PoCollaboration;
  /** Giai đoạn và mức khẩn suy từ lib/mos/po-flow.ts — MỘT nguồn logic duy nhất
   *  dùng chung với dòng chảy ở bảng danh sách. */
  stage: PoStage | null;
  urgency: Urgency;
  daysLeft: number | null;
}

export type PoTwinResult =
  | { ok: true; data: PoTwinHeader; partial: string[] }
  | { ok: false; message: string };

/**
 * `partial` liệt kê những lĩnh vực ĐỌC KHÔNG ĐƯỢC.
 *
 * Không gộp thành một lỗi chung: một PO có thể đọc được sản xuất nhưng hỏng
 * phần tài chính. Báo "lỗi tải trang" khi chỉ một mảng hỏng là lấy đi bảy phần
 * dữ liệu còn dùng được. Ô nào hỏng thì ô đó hiện "—" kèm lý do.
 */
