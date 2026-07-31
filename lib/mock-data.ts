// ============================================================================
// MONICA MOS — Fallback Mock Data (Single Source khi mất kết nối)
// Bộ dữ liệu được thiết kế "có chuyện để kể": có PO trễ >3 ngày, xưởng lỗi >3%,
// NPL dưới tồn an toàn, lô QA rớt AQL, yêu cầu chờ duyệt… để MỌI trạng thái UI
// đều hiển thị sinh động, không bao giờ trắng màn hình.
// ============================================================================

import type {
  Order, BomItem, InventoryItem, CuttingLog, Bundle, ProdLog, QALog,
  SampleRecord, FinancialRecord, Approval, Shipment, AppNotification,
  Feedback, SystemLog, Subcon, SewingLine, Setting,
} from '@/types/erp';
import { settleSubcon, cuttingWastePercent } from '@/lib/garment-math';

// ── Tiện ích thời gian tương đối (mock luôn "tươi" so với hôm nay) ──────────
const daysAgo = (n: number, hour = 9, minute = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const daysAhead = (n: number): string => daysAgo(-n, 17);

// PRNG có seed cố định → dữ liệu ổn định giữa các lần render
const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
};

// ── (ĐÃ BỎB) USERS — bảng users cùng mật khẩu dạng chữ thường đã bị xoá ở
//    migration 010. Nhân sự nay đọc từ profiles + user_roles (xem lib/staff.ts),
//    đăng nhập do Supabase Auth quản lý. Không dựng lại mock cho bảng này:
//    danh sách tài khoản mà hiện dữ liệu giả là mời quản trị viên thao tác nhầm.

// ── DANH MỤC XƯỞNG & CHUYỀN ─────────────────────────────────────────────────
export const MOCK_SUBCONS: Subcon[] = [
  { id: 'SC1', name: 'Xưởng Minh Phát', contact: 'A. Phát', phone: '0903 111 222', capacity_per_day: 900 },
  { id: 'SC2', name: 'Xưởng An Khang',  contact: 'C. Khang', phone: '0913 333 444', capacity_per_day: 1200 },
  { id: 'SC3', name: 'Xưởng Đại Lộc',   contact: 'A. Lộc',  phone: '0938 555 666', capacity_per_day: 700 },
];
export const MOCK_LINES: SewingLine[] = [
  { id: 'L1', name: 'Chuyền 1', worker_count: 28, sam_default: 12 },
  { id: 'L2', name: 'Chuyền 2', worker_count: 30, sam_default: 15 },
  { id: 'L3', name: 'Chuyền 3', worker_count: 26, sam_default: 10 },
];

// ── ORDERS: 6 PO đủ trạng thái; PO-M2602 TRỄ 4 ngày (cảnh báo đỏ) ───────────
export const MOCK_ORDERS: Order[] = [
  {
    id: 'O1', po_code: 'PO-M2601', brand: 'MONICA', product_name: 'Áo Polo Nam Piqué',
    target_qty: 2000, size_breakdown: { S: 300, M: 700, L: 700, XL: 300 },
    unit_price_cmt: 32000, unit_price_fob: 185000, status: 'Đang may',
    etd_date: daysAhead(12), xfactory_date: daysAhead(6),
    subcon_id: null, line_id: 'L1', created_at: daysAgo(18),
  },
  {
    id: 'O2', po_code: 'PO-M2602', brand: 'NORDIC EU', product_name: 'Quần Jogger Nỉ Da Cá',
    target_qty: 3500, size_breakdown: { S: 500, M: 1200, L: 1200, XL: 600 },
    unit_price_cmt: 38000, unit_price_fob: 230000, status: 'Đang may',
    etd_date: daysAhead(2), xfactory_date: daysAgo(4), // ⚠️ trễ 4 ngày
    subcon_id: 'SC1', line_id: null, created_at: daysAgo(35),
  },
  {
    id: 'O3', po_code: 'PO-M2603', brand: 'SAKURA JP', product_name: 'Váy Sơ Mi Lụa',
    target_qty: 1200, size_breakdown: { S: 300, M: 500, L: 400 },
    unit_price_cmt: 45000, unit_price_fob: 320000, status: 'Chờ QA',
    etd_date: daysAhead(9), xfactory_date: daysAhead(4),
    subcon_id: null, line_id: 'L2', created_at: daysAgo(28),
  },
  {
    id: 'O4', po_code: 'PO-M2604', brand: 'NORDIC EU', product_name: 'Áo Khoác Gió 2 Lớp',
    target_qty: 5000, size_breakdown: { S: 800, M: 1700, L: 1700, XL: 800 },
    unit_price_cmt: 52000, unit_price_fob: 410000, status: 'Đang cắt',
    etd_date: daysAhead(30), xfactory_date: daysAhead(24),
    subcon_id: 'SC2', line_id: null, created_at: daysAgo(10),
  },
  {
    id: 'O5', po_code: 'PO-M2605', brand: 'URBAN VN', product_name: 'Áo Thun Cotton Compact',
    target_qty: 800, size_breakdown: { M: 300, L: 300, XL: 200 },
    unit_price_cmt: 21000, unit_price_fob: 125000, status: 'Đã xuất',
    etd_date: daysAgo(3), xfactory_date: daysAgo(5),
    subcon_id: null, line_id: 'L3', created_at: daysAgo(45),
  },
  {
    id: 'O6', po_code: 'PO-M2606', brand: 'MONICA', product_name: 'Đầm Maxi Voan Hoa',
    target_qty: 1500, size_breakdown: { S: 400, M: 600, L: 500 },
    unit_price_cmt: 48000, unit_price_fob: 350000, status: 'Mới',
    etd_date: daysAhead(45), xfactory_date: daysAhead(38),
    subcon_id: null, line_id: null, created_at: daysAgo(2),
  },
];

// ── BOM ─────────────────────────────────────────────────────────────────────
export const MOCK_BOM: BomItem[] = [
  { id: 'B01', order_id: 'O1', item_name: 'Vải Piqué CD 235GSM - Navy',   category: 'Vải',   unit: 'm',    norm_per_pcs: 0.85, wastage_percent: 3,   npl_status: 'Đã về kho' },
  { id: 'B02', order_id: 'O1', item_name: 'Chỉ Poly 40/2 - Navy',          category: 'Chỉ',   unit: 'cuộn', norm_per_pcs: 0.04, wastage_percent: 2,   npl_status: 'Đã về kho' },
  { id: 'B03', order_id: 'O1', item_name: 'Cúc 4 lỗ 15L',                  category: 'Cúc',   unit: 'cái',  norm_per_pcs: 3,    wastage_percent: 1.5, npl_status: 'Đã về kho' },
  { id: 'B04', order_id: 'O1', item_name: 'Nhãn chính + nhãn giặt MONICA', category: 'Nhãn',  unit: 'bộ',   norm_per_pcs: 1,    wastage_percent: 1,   npl_status: 'Đã về kho' },
  { id: 'B05', order_id: 'O2', item_name: 'Vải Nỉ Da Cá 320GSM - Xám',    category: 'Vải',   unit: 'm',    norm_per_pcs: 1.2,  wastage_percent: 5,   npl_status: 'Thiếu hụt' }, // ⚠️
  { id: 'B06', order_id: 'O2', item_name: 'Dây luồn lưng + Khoen',         category: 'Khóa',  unit: 'bộ',   norm_per_pcs: 1,    wastage_percent: 2,   npl_status: 'Đã về kho' },
  { id: 'B07', order_id: 'O3', item_name: 'Vải Lụa Habutai - Kem',         category: 'Vải',   unit: 'm',    norm_per_pcs: 1.6,  wastage_percent: 4,   npl_status: 'Đã về kho' },
  { id: 'B08', order_id: 'O4', item_name: 'Vải Gió Poly 75D Tráng PU',     category: 'Vải',   unit: 'm',    norm_per_pcs: 2.1,  wastage_percent: 4,   npl_status: 'Đang về' },
  { id: 'B09', order_id: 'O4', item_name: 'Khóa Nylon #5 - Đen',           category: 'Khóa',  unit: 'cái',  norm_per_pcs: 1,    wastage_percent: 2,   npl_status: 'Đã về kho' },
  { id: 'B10', order_id: 'O6', item_name: 'Vải Voan Hoa Nhí',              category: 'Vải',   unit: 'm',    norm_per_pcs: 2.4,  wastage_percent: 5,   npl_status: 'Chưa đặt' },
  { id: 'B11', order_id: 'O6', item_name: 'Thùng carton 60x40x40 5 lớp',   category: 'Bao bì', unit: 'cái', norm_per_pcs: 0.034, wastage_percent: 2,  npl_status: 'Chưa đặt' },
];

// ── INVENTORY: Vải Nỉ dưới tồn an toàn (cảnh báo) ───────────────────────────
export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'I01', item_name: 'Vải Piqué CD 235GSM - Navy',  type: 'NPL', qty_kg: 720,  qty_m: 1802.5, gsm: 235, width_m: 1.7,  color_code: 'NV-19', dye_lot: 'DL-2415', shade: 'A', roll_count: 32, safety_stock: 400, order_id: 'O1' },
  { id: 'I02', item_name: 'Vải Nỉ Da Cá 320GSM - Xám',   type: 'NPL', qty_kg: 310,  qty_m: 605.5,  gsm: 320, width_m: 1.6,  color_code: 'GR-07', dye_lot: 'DL-2398', shade: 'B', roll_count: 14, safety_stock: 1500, order_id: 'O2' }, // ⚠️ dưới an toàn
  { id: 'I03', item_name: 'Vải Gió Poly 75D Tráng PU',   type: 'NPL', qty_kg: 980,  qty_m: 8909,   gsm: 110, width_m: 1.5,  color_code: 'BK-01', dye_lot: 'DL-2422', shade: 'A', roll_count: 58, safety_stock: 6000, order_id: 'O4' },
  { id: 'I04', item_name: 'Vải Lụa Habutai - Kem',       type: 'NPL', qty_kg: 130,  qty_m: 1911.7, gsm: 68,  width_m: 1.4,  color_code: 'CR-02', dye_lot: 'DL-2401', shade: 'A', roll_count: 21, safety_stock: 500, order_id: 'O3' },
  { id: 'I05', item_name: 'Chỉ Poly 40/2 - Navy',        type: 'NPL', qty_kg: 0,    qty_m: 0,      gsm: 0,   width_m: 0,    color_code: 'NV-19', dye_lot: '', shade: '', roll_count: 160, safety_stock: 60, order_id: 'O1' },
  { id: 'I06', item_name: 'Khóa Nylon #5 - Đen',         type: 'NPL', qty_kg: 0,    qty_m: 0,      gsm: 0,   width_m: 0,    color_code: 'BK', dye_lot: '', shade: '', roll_count: 5600, safety_stock: 5100, order_id: 'O4' },
  { id: 'I07', item_name: 'TP: Áo Thun Cotton (PO-M2605)', type: 'Thành phẩm', qty_kg: 0, qty_m: 0, gsm: 0, width_m: 0, color_code: '', dye_lot: '', shade: '', roll_count: 800, safety_stock: 0, order_id: 'O5' },
  { id: 'I08', item_name: 'TP: Váy Sơ Mi Lụa (PO-M2603)', type: 'Thành phẩm', qty_kg: 0, qty_m: 0, gsm: 0, width_m: 0, color_code: '', dye_lot: '', shade: '', roll_count: 460, safety_stock: 0, order_id: 'O3' },
];

// ── CUTTING LOGS + BUNDLES ──────────────────────────────────────────────────
const cut1Issued = 920, cut1Marker = 895.4;
const cut2Issued = 610, cut2Marker = 588.2;
const cut3Issued = 2100, cut3Marker = 2013.9; // hao hụt 4.1% > trần 3.5% ⚠️
export const MOCK_CUTTING: CuttingLog[] = [
  { id: 'C01', order_id: 'O1', marker_name: 'SD-Polo-A', table_count: 6, ply_count: 60, size_ratio: { S: 1, M: 2, L: 2, XL: 1 },
    cut_qty: 2140, fabric_used_m: cut1Issued, marker_length_m: cut1Marker, waste_percent: cuttingWastePercent(cut1Issued, cut1Marker), created_at: daysAgo(9, 16) },
  { id: 'C02', order_id: 'O1', marker_name: 'SD-Polo-B (bù)', table_count: 1, ply_count: 40, size_ratio: { M: 1, L: 1 },
    cut_qty: 80, fabric_used_m: cut2Issued / 8, marker_length_m: cut2Marker / 8, waste_percent: cuttingWastePercent(cut2Issued, cut2Marker), created_at: daysAgo(6, 10) },
  { id: 'C03', order_id: 'O4', marker_name: 'SD-Jacket-A', table_count: 8, ply_count: 45, size_ratio: { S: 1, M: 2, L: 2, XL: 1 },
    cut_qty: 2160, fabric_used_m: cut3Issued, marker_length_m: cut3Marker, waste_percent: cuttingWastePercent(cut3Issued, cut3Marker), created_at: daysAgo(2, 15) },
];
export const MOCK_BUNDLES: Bundle[] = [
  { id: 'BD1', order_id: 'O1', cutting_log_id: 'C01', bundle_no: 'PO-M2601-S-01',  size: 'S',  qty: 30, status: 'Đã giao chuyền' },
  { id: 'BD2', order_id: 'O1', cutting_log_id: 'C01', bundle_no: 'PO-M2601-M-01',  size: 'M',  qty: 30, status: 'Đã giao chuyền' },
  { id: 'BD3', order_id: 'O1', cutting_log_id: 'C01', bundle_no: 'PO-M2601-M-02',  size: 'M',  qty: 30, status: 'Đã giao chuyền' },
  { id: 'BD4', order_id: 'O1', cutting_log_id: 'C01', bundle_no: 'PO-M2601-L-01',  size: 'L',  qty: 30, status: 'Đã giao chuyền' },
  { id: 'BD5', order_id: 'O1', cutting_log_id: 'C01', bundle_no: 'PO-M2601-XL-01', size: 'XL', qty: 30, status: 'Đã cắt' },
  { id: 'BD6', order_id: 'O4', cutting_log_id: 'C03', bundle_no: 'PO-M2604-M-01',  size: 'M',  qty: 45, status: 'Đã cắt' },
  { id: 'BD7', order_id: 'O4', cutting_log_id: 'C03', bundle_no: 'PO-M2604-L-01',  size: 'L',  qty: 45, status: 'Đã cắt' },
];

// ── PROD LOGS: 7 ngày × giờ; SC1 (Minh Phát) tỷ lệ lỗi ~4,3% ⚠️ ─────────────
const STAGES = ['May thân', 'Tra tay', 'Vào lưng/khóa', 'Hoàn thiện'];
const buildProdLogs = (): ProdLog[] => {
  const rnd = seeded(20260726);
  const out: ProdLog[] = [];
  let n = 0;
  const push = (day: number, hour: number, orderId: string, subconId: string | null, lineId: string | null, base: number, defectRate: number) => {
    const ok = Math.max(6, Math.round(base + rnd() * base * 0.4));
    const defect = Math.round(ok * defectRate * (0.6 + rnd() * 0.9));
    out.push({
      id: `P${++n}`, order_id: orderId, subcon_id: subconId, line_id: lineId,
      stage: STAGES[Math.floor(rnd() * STAGES.length)],
      qty_ok: ok, qty_defect: defect, hour_slot: `${String(hour).padStart(2, '0')}h`,
      photo_url: rnd() > 0.5 ? 'https://placehold.co/800x600/e2e8f0/475569?text=Bao+cao+san+xuat' : null,
      created_at: daysAgo(day, hour, Math.floor(rnd() * 50)),
    });
  };
  for (let day = 6; day >= 0; day--) {
    for (const hour of [8, 9, 10, 11, 13, 14, 15, 16]) {
      push(day, hour, 'O1', null, 'L1', 26, 0.012);        // Chuyền 1 — polo, lỗi ~1,2%
      if (hour % 2 === 0) push(day, hour, 'O3', null, 'L2', 14, 0.02); // Chuyền 2 — váy lụa
      push(day, hour, 'O2', 'SC1', null, 42, 0.043);       // ⚠️ Minh Phát lỗi ~4,3%
      if (hour % 3 === 0) push(day, hour, 'O4', 'SC2', null, 18, 0.015);
    }
  }
  return out;
};
export const MOCK_PROD_LOGS: ProdLog[] = buildProdLogs();

// ── QA LOGS: 1 lô Endline RỚT AQL (O3), Pareto lỗi từ Inline ────────────────
export const MOCK_QA: QALog[] = [
  // Endline O3 — lô 1.200 SP → n=80, Ac=5/Re=6; 6 lỗi Major → FAIL ⚠️
  { id: 'Q01', order_id: 'O3', inspection_type: 'Endline', lot_size: 1200, sample_size: 80, ac_number: 5, re_number: 6,
    defect_type: 'Nhăn mũi may + Loang màu', defect_class: 'Major', qty_defect: 6, checked_qty: 80, aql_status: 'Fail',
    capa_note: 'Tái chế toàn lô, chỉnh lại chân vịt máy 2 kim, tách cuộn khác shade', created_at: daysAgo(1, 14) },
  // Endline O3 lô đầu — Pass
  { id: 'Q02', order_id: 'O3', inspection_type: 'Endline', lot_size: 460, sample_size: 50, ac_number: 3, re_number: 4,
    defect_type: 'Đứt chỉ diễu', defect_class: 'Major', qty_defect: 2, checked_qty: 50, aql_status: 'Pass',
    capa_note: '', created_at: daysAgo(3, 10) },
  // Endline O5 — Pass toàn bộ
  { id: 'Q03', order_id: 'O5', inspection_type: 'Endline', lot_size: 800, sample_size: 80, ac_number: 5, re_number: 6,
    defect_type: 'Chỉ thừa', defect_class: 'Minor', qty_defect: 3, checked_qty: 80, aql_status: 'Pass',
    capa_note: '', created_at: daysAgo(6, 15) },
  // Endline O2 (Minh Phát) đợt 1 — Pass sát nút
  { id: 'Q04', order_id: 'O2', inspection_type: 'Endline', lot_size: 1800, sample_size: 125, ac_number: 7, re_number: 8,
    defect_type: 'Lệch sọc lưng', defect_class: 'Major', qty_defect: 7, checked_qty: 125, aql_status: 'Pass',
    capa_note: 'Yêu cầu xưởng kiểm 100% trước khi giao đợt 2', created_at: daysAgo(4, 16) },
  // Inline O1 — dữ liệu cho Pareto Top 5 lỗi
  { id: 'Q05', order_id: 'O1', inspection_type: 'Inline', lot_size: 0, sample_size: 0, ac_number: 0, re_number: 0,
    defect_type: 'Bỏ mũi', defect_class: 'Major', qty_defect: 14, checked_qty: 240, aql_status: 'Pending', capa_note: 'Thay kim DBx1 #11, kiểm tra độ căng chỉ', created_at: daysAgo(2, 9) },
  { id: 'Q06', order_id: 'O1', inspection_type: 'Inline', lot_size: 0, sample_size: 0, ac_number: 0, re_number: 0,
    defect_type: 'Đứt chỉ', defect_class: 'Major', qty_defect: 9, checked_qty: 240, aql_status: 'Pending', capa_note: '', created_at: daysAgo(2, 10) },
  { id: 'Q07', order_id: 'O2', inspection_type: 'Inline', lot_size: 0, sample_size: 0, ac_number: 0, re_number: 0,
    defect_type: 'Loang màu (khác shade)', defect_class: 'Major', qty_defect: 7, checked_qty: 180, aql_status: 'Pending', capa_note: 'Tách cuộn lô DL-2398 shade B ra khỏi bàn cắt', created_at: daysAgo(1, 9) },
  { id: 'Q08', order_id: 'O1', inspection_type: 'Inline', lot_size: 0, sample_size: 0, ac_number: 0, re_number: 0,
    defect_type: 'Nhăn mũi may', defect_class: 'Minor', qty_defect: 5, checked_qty: 240, aql_status: 'Pending', capa_note: '', created_at: daysAgo(1, 11) },
  { id: 'Q09', order_id: 'O2', inspection_type: 'Inline', lot_size: 0, sample_size: 0, ac_number: 0, re_number: 0,
    defect_type: 'Khóa/dây kéo hỏng', defect_class: 'Major', qty_defect: 3, checked_qty: 180, aql_status: 'Pending', capa_note: '', created_at: daysAgo(0, 9) },
  { id: 'Q10', order_id: 'O1', inspection_type: 'Inline', lot_size: 0, sample_size: 0, ac_number: 0, re_number: 0,
    defect_type: 'Dơ dầu máy', defect_class: 'Minor', qty_defect: 2, checked_qty: 240, aql_status: 'Pending', capa_note: 'Vệ sinh ổ máy đầu giờ, lót giấy chống dầu', created_at: daysAgo(0, 10) },
];

// ── SAMPLES (Proto → Fit → SMS → PP → TOP) ─────────────────────────────────
export const MOCK_SAMPLES: SampleRecord[] = [
  { id: 'S01', order_id: 'O1', stage: 'Proto', status: 'Approved', buyer_comment: 'OK form', sent_date: daysAgo(30) },
  { id: 'S02', order_id: 'O1', stage: 'Fit',   status: 'Approved', buyer_comment: 'Nới vòng ngực +1cm đã chỉnh', sent_date: daysAgo(24) },
  { id: 'S03', order_id: 'O1', stage: 'SMS',   status: 'Approved', buyer_comment: '', sent_date: daysAgo(18) },
  { id: 'S04', order_id: 'O1', stage: 'PP',    status: 'Đã gửi',   buyer_comment: '', sent_date: daysAgo(3) },
  { id: 'S05', order_id: 'O2', stage: 'PP',    status: 'Approved', buyer_comment: 'Approved with comment: đổi dây luồn tròn', sent_date: daysAgo(20) },
  { id: 'S06', order_id: 'O2', stage: 'TOP',   status: 'Đang làm', buyer_comment: '', sent_date: null },
  { id: 'S07', order_id: 'O6', stage: 'Proto', status: 'Đang làm', buyer_comment: '', sent_date: null },
];

// ── FINANCIAL RECORDS (tính bằng đúng công thức settleSubcon) ───────────────
const f1 = settleSubcon(1800, 38000, 4500000, 20000000);
const f2 = settleSubcon(0, 52000, 0, 15000000);
export const MOCK_FINANCE: FinancialRecord[] = [
  { id: 'F01', order_id: 'O2', subcon_id: 'SC1', qa_passed_qty: 1800, unit_price: 38000,
    penalty_amount: 4500000, penalty_note: 'Đền bù 120m vải nỉ hỏng vượt định mức hao hụt 5%',
    advance_pay: 20000000, total_pay: f1.net, status: 'Chờ đối soát' },
  { id: 'F02', order_id: 'O4', subcon_id: 'SC2', qa_passed_qty: 0, unit_price: 52000,
    penalty_amount: 0, penalty_note: '', advance_pay: 15000000, total_pay: f2.net, status: 'Chờ đối soát' },
];

// ── APPROVALS ───────────────────────────────────────────────────────────────
export const MOCK_APPROVALS: Approval[] = [
  { id: 'A01', type: 'Cấp bù NPL', requester: 'Xưởng Minh Phát', order_id: 'O2',
    content: 'Xin cấp bù 120m Vải Nỉ Da Cá 320GSM (lỗi loang màu lô DL-2398 shade B)', qty: 120,
    status: 'Chờ duyệt', reason: '', created_at: daysAgo(1, 8) },
  { id: 'A02', type: 'Hợp đồng Subcon', requester: 'Lê Thu Hà (MD)', order_id: null,
    content: 'Ký hợp đồng gia công với Xưởng Đại Lộc — năng lực 700 SP/ngày, đơn giá CMT đàm phán 35.000đ', qty: 0,
    status: 'Chờ duyệt', reason: '', created_at: daysAgo(2, 14) },
  { id: 'A03', type: 'Xuất vượt định mức', requester: 'Bùi Thủ Kho', order_id: 'O1',
    content: 'Xuất thêm 40m Vải Piqué bù bàn cắt lại size M', qty: 40,
    status: 'Đã duyệt', reason: 'Trong giới hạn 3% cho phép', created_at: daysAgo(5, 9) },
];

// ── SHIPMENTS ───────────────────────────────────────────────────────────────
export const MOCK_SHIPMENTS: Shipment[] = [
  { id: 'SH1', order_id: 'O5', carton_count: 34, qty: 800, gw_kg: 428, nw_kg: 396, etd: daysAgo(3), status: 'Đã xuất' },
  { id: 'SH2', order_id: 'O3', carton_count: 19, qty: 460, gw_kg: 232, nw_kg: 214, etd: daysAhead(9), status: 'Chuẩn bị' },
];

// ── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'N01', severity: 'critical', message: '⚠ PO-M2602 (Quần Jogger Nỉ) TRỄ 4 ngày so với ngày xuất xưởng kế hoạch', roles: ['giamdoc', 'md', 'superadmin'], read: false, created_at: daysAgo(0, 7) },
  { id: 'N02', severity: 'critical', message: 'Xưởng Minh Phát có tỷ lệ lỗi 4,3% — vượt ngưỡng 3%', roles: ['giamdoc', 'qa', 'superadmin'], read: false, created_at: daysAgo(0, 8) },
  { id: 'N03', severity: 'critical', message: 'Lô Endline PO-M2603 RỚT AQL 2.5 (6 lỗi Major / Ac=5) — yêu cầu tái chế', roles: ['giamdoc', 'md', 'qa', 'superadmin'], read: false, created_at: daysAgo(1, 14) },
  { id: 'N04', severity: 'warning', message: 'Vải Nỉ Da Cá 320GSM dưới mức tồn an toàn (605m / cần 1.500m)', roles: ['kho', 'md', 'giamdoc', 'superadmin'], read: false, created_at: daysAgo(1, 9) },
  { id: 'N05', severity: 'warning', message: 'Yêu cầu cấp bù 120m vải nỉ của Xưởng Minh Phát đang chờ Giám đốc duyệt', roles: ['giamdoc', 'superadmin'], read: true, created_at: daysAgo(1, 8) },
  { id: 'N06', severity: 'info', message: 'Mẫu PP của PO-M2601 đã gửi buyer, chờ approve', roles: ['md', 'giamdoc', 'superadmin'], read: true, created_at: daysAgo(3, 10) },
];

// ── FEEDBACKS + SYSTEM LOGS + SETTINGS ──────────────────────────────────────
export const MOCK_FEEDBACKS: Feedback[] = [
  { id: 'FB1', order_id: 'O5', buyer_user: 'NORDIC EU Buyer', rating: 4,
    content: 'On-time delivery, packing tốt. Cần cải thiện độ đồng đều màu giữa các lô. / Giao đúng hạn, cần đều màu hơn.', created_at: daysAgo(2, 16) },
];
export const MOCK_SYSLOGS: SystemLog[] = [
  { id: 'SL1', user: 'giamdoc', action: 'DUYỆT', detail: 'Duyệt xuất vượt định mức 40m Piqué (PO-M2601)', created_at: daysAgo(5, 9) },
  { id: 'SL2', user: 'qa', action: 'AQL_FAIL', detail: 'Rớt lô Endline PO-M2603 (6 Major/Ac 5)', created_at: daysAgo(1, 14) },
  { id: 'SL3', user: 'kho', action: 'NHẬP KHO', detail: 'Nhập 58 cuộn Vải Gió Poly 75D (DL-2422, shade A)', created_at: daysAgo(4, 10) },
  { id: 'SL4', user: 'md', action: 'TẠO PO', detail: 'Tạo PO-M2606 Đầm Maxi Voan Hoa (1.500 SP)', created_at: daysAgo(2, 11) },
  { id: 'SL5', user: 'subcon', action: 'YÊU CẦU NPL', detail: 'Minh Phát xin cấp bù 120m vải nỉ', created_at: daysAgo(1, 8) },
];
export const MOCK_SETTINGS: Setting[] = [
  { id: 'ST1', key: 'gsm_default', value: '220' },
  { id: 'ST2', key: 'max_cutting_waste_percent', value: '3.5' },
  { id: 'ST3', key: 'defect_warning_percent', value: '3' },
  { id: 'ST4', key: 'safety_stock_factor', value: '1.05' },
  { id: 'ST5', key: 'four_point_threshold', value: '40' },
];

// ── GOM TẤT CẢ THEO TÊN BẢNG (fetchTable dùng làm fallback) ─────────────────
export const MOCK: Record<string, unknown[]> = {
  subcons: MOCK_SUBCONS,
  sewing_lines: MOCK_LINES,
  orders: MOCK_ORDERS,
  bom: MOCK_BOM,
  inventory: MOCK_INVENTORY,
  cutting_logs: MOCK_CUTTING,
  bundles: MOCK_BUNDLES,
  prod_logs: MOCK_PROD_LOGS,
  qa_logs: MOCK_QA,
  samples: MOCK_SAMPLES,
  financial_records: MOCK_FINANCE,
  approvals: MOCK_APPROVALS,
  shipments: MOCK_SHIPMENTS,
  notifications: MOCK_NOTIFICATIONS,
  feedbacks: MOCK_FEEDBACKS,
  system_logs: MOCK_SYSLOGS,
  settings: MOCK_SETTINGS,
};
