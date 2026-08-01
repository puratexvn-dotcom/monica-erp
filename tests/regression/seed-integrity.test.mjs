// ============================================================================
// TOÀN VẸN DỮ LIỆU NỀN — chạy TRƯỚC mọi bài kiểm cần cơ sở dữ liệu
//
// ─── VÌ SAO ĐỨNG RIÊNG MỘT BÀI ────────────────────────────────────────────
//
// Hiến pháp V.1: *không được audit bằng bảng rỗng*. Bài kiểm phân quyền chạy
// trên dữ liệu nền sai sẽ cho kết luận sai mà vẫn xanh — nguy hiểm hơn là đỏ.
//
// Bài này KHÔNG kiểm phân quyền. Nó chỉ trả lời một câu: **dữ liệu nền có đúng
// hình dạng mà các bài kiểm khác giả định hay không.**
//
// Nó cũng là nơi duy nhất báo cáo **những gì CHƯA đo được** — để con số "đạt"
// của cả bộ không bị hiểu nhầm là "đã phủ hết".
// ============================================================================
import { requireDb, scoreboard, dem } from '../_lib/harness.mjs';

const { admin } = requireDb();
const s = scoreboard('TOÀN VẸN DỮ LIỆU NỀN');

const soDong = async (bang, loc) => {
  let q = admin.from(bang).select('*', { count: 'exact', head: true });
  if (loc) q = loc(q);
  const { count, error } = await q;
  return error ? null : (count ?? 0);
};

console.log('① Chuỗi nghiệp vụ nền (S001 Phần A)');
s.ok('Khách hàng thật KHZBY tồn tại',
  (await soDong('customers', (q) => q.eq('customer_code', 'KHZBY'))) === 1);
s.ok('⭐ Có đơn hàng GẮN customer_id (nếu không, Buyer Portal không thể trả dòng nào)',
  (await soDong('orders', (q) => q.not('customer_id', 'is', null))) >= 1);
s.ok('Có chuyền may gắn địa điểm',
  (await soDong('sewing_lines', (q) => q.not('site_id', 'is', null))) >= 1);
s.ok('Có phần việc', (await soDong('assignments', (q) => q.is('deleted_at', null))) >= 2);
s.ok('Có bó gắn phần việc', (await soDong('assignment_bundles')) >= 1);
s.ok('Có kiểm QA gắn phần việc',
  (await soDong('qa_audit_reports', (q) => q.not('assignment_id', 'is', null))) >= 1);

console.log('\n② Kịch bản phân quyền (S001 Phần B)');
const tongDon = await soDong('subcon_orders');
if (!tongDon) s.chuaDo('subcon_orders', 'bảng rỗng — chạy S001 Phần B');
else {
  s.ok('Có đơn gia công MỒ CÔI để đo (assignment_id NULL)',
    (await soDong('subcon_orders', (q) => q.is('assignment_id', null))) >= 1);
  const { data: gia } = await admin.from('subcon_orders').select('unit_price');
  const mucGia = new Set((gia ?? []).map((r) => Number(r.unit_price)));
  // ⚠️ Hai mức giá KHÁC NHAU là điều kiện CẦN để bắt được rò rỉ giá. Cùng giá
  // thì nhà thầu thấy nhầm đơn của nhau cũng không phép đo nào phát hiện ra.
  s.ok('⭐ Có ÍT NHẤT HAI mức giá khác nhau (điều kiện cần để đo rò rỉ giá)',
    mucGia.size >= 2, `chỉ có ${mucGia.size} mức`);
  s.ok('Có ít nhất hai nhà thầu dịch vụ cùng có phần việc (điều kiện cần để đo Ownership)',
    (await soDong('partners',
      (q) => q.eq('partner_type', 'SERVICE_PARTNER').is('deleted_at', null))) >= 2);
}

console.log('\n③ Bất biến I-11 — Commercial Ownership');
const { data: viPham } = await admin
  .from('subcon_orders')
  .select('subcon_order_no, vendor_id, assignments(partner_id, partners(subcontractor_id))')
  .not('assignment_id', 'is', null);
const lech = (viPham ?? []).filter((r) => {
  const a = Array.isArray(r.assignments) ? r.assignments[0] : r.assignments;
  const p = a && (Array.isArray(a.partners) ? a.partners[0] : a.partners);
  return !p || p.subcontractor_id !== r.vendor_id;
});
s.ok('KHÔNG có đơn gia công nào vi phạm I-11', lech.length === 0,
  lech.map((r) => r.subcon_order_no).join(', '));

console.log('\n④ Sổ cái chỉ-ghi-thêm');
const { data: soCai } = await admin.from('assignment_daily_reports')
  .select('id, parent_report_id');
if (!soCai?.length) s.chuaDo('sổ cái', 'bảng rỗng');
else {
  const hienHanh = soCai.filter((r) => !soCai.some((c) => c.parent_report_id === r.id));
  s.ok(`Sổ cái có ${soCai.length} dòng, ĐÚNG 1 dòng hiện hành`, hienHanh.length === 1,
    `${hienHanh.length} dòng hiện hành`);
  s.ok('Có chuỗi đính chính cha→con để đo', soCai.some((r) => r.parent_report_id));
}

console.log('\n⑤ Xoá mềm');
const tongAct = await soDong('assignment_commercial_terms');
const conHl = await soDong('assignment_commercial_terms', (q) => q.is('deleted_at', null));
if (!tongAct) s.chuaDo('xoá mềm', 'assignment_commercial_terms rỗng');
else s.ok('Có ít nhất một dòng ĐÃ XOÁ MỀM để đo', tongAct - conHl >= 1,
  `${tongAct} tổng / ${conHl} còn hiệu lực`);

console.log('\n⑥ Những gì CHƯA đo được — báo cáo trung thực');
for (const t of ['subcon_issue_logs', 'subcon_receipt_logs', 'capa_logs',
                 'daily_production_logs', 'stock_movements', 'shipment_cartons']) {
  const n = await soDong(t);
  if (!n) s.chuaDo(t, 'bảng rỗng — mọi kết luận về quyền trên bảng này đều vô nghĩa');
}

process.exit(s.ketThuc() ? 1 : 0);
