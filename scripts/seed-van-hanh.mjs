// ============================================================================
// GIEO MỘT NGÀY VẬN HÀNH — để báo cáo và biểu đồ có nội dung THẬT
//
// Board 07/08/2026: *"hiện tại chưa bàn giao nên chưa có số liệu và báo cáo
// thật nên bạn hãy tự tìm cách để hoàn thành nhiệm vụ cho chính xác nhất"*.
//
// 🔑 Dữ liệu gieo ở đây CỐ Ý ⛔ KHÔNG PHẢI SỐ ĐẸP. Một ngày mà mọi chuyền đạt
// 100% kế hoạch và 0 lỗi thì biểu đồ trông "chạy được" nhưng ⛔ KHÔNG chứng
// minh được gì: đường ngưỡng ⛔ không bao giờ bị vượt, cột cảnh báo ⛔ không
// bao giờ đổi màu, và ta ⛔ không biết chúng có hoạt động hay không.
//
// ⇒ Gieo một ngày CÓ VẤN ĐỀ: giờ ăn trưa tụt sản lượng, một chuyền vượt ngưỡng
// lỗi, một bàn cắt hụt kế hoạch, một phiếu vượt định mức vải.
//
// ⚠️ Mọi bản ghi mang dấu `[GIEO 07/08]` trong `notes` để **xoá sạch được**.
// Bốn bảng này ⛔ KHÔNG nằm trong bộ ghi-thêm bất biến (`041`/`045`/`046` chỉ
// phủ `activity_log · profiles · costings · costing_items · customers`) — đã
// kiểm bằng LƯỢC ĐỒ chứ ⛔ không bằng ghi thử rồi xoá thử (`K-1`).
// ============================================================================
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const DAU = '[GIEO 07/08]';
const NGAY = '2026-08-07';
const XOA = process.argv.includes('--xoa');

// ── Đơn giá FOB theo chủng loại (USD/sp) ────────────────────────────────────
// 🔑 ⛔ KHÔNG bịa một con số duy nhất cho mọi mã hàng. Giá FOB ngành may bám
// theo **độ phức tạp và lượng vải**: áo thun < polo < sơ mi < quần < đầm <
// hoodie < áo khoác. Một bảng giá phẳng sẽ làm P&L ra margin y hệt nhau ở mọi
// đơn — và một báo cáo lãi lỗ như thế ⛔ không dùng để ra quyết định được.
const GIA_FOB = {
  'DEMO-ST-TEE01': 3.2, 'DEMO-ST-POLO02': 5.8, 'DEMO-ST-SHIRT03': 7.5,
  'DEMO-ST-JKT05': 18.5, 'DEMO-ST-CHINO04': 9.2, 'DEMO-ST-DRESS06': 11.0,
  'DEMO-ST-HOOD07': 12.5, 'DEMO-ST-KID08': 4.5,
  'JK-W26-M1': 22.0, 'TS-S26-M2': 4.2, 'RP6410-S': 6.8, 'RP6410': 6.8,
};

async function main() {
  if (XOA) return await donSach();

  // ── ① ĐƠN GIÁ FOB ─────────────────────────────────────────────────────────
  const { data: dons } = await sb.from('orders').select('id, po_number, style_code, unit_price');
  let daGia = 0;
  for (const o of dons) {
    if (o.unit_price != null) continue;
    const gia = GIA_FOB[o.style_code];
    if (gia == null) { console.log(`  ⚠️ ⛔ chưa có bảng giá cho ${o.style_code} — bỏ qua, ⛔ không bịa`); continue; }
    const { error } = await sb.from('orders').update({ unit_price: gia }).eq('id', o.id);
    if (error) console.log(`  ⛔ ${o.po_number}: ${error.message}`);
    else daGia++;
  }
  console.log(`① đơn giá FOB: ${daGia} đơn`);

  // ── ② SẢN LƯỢNG THEO GIỜ ─────────────────────────────────────────────────
  const { data: lines } = await sb.from('sewing_lines').select('id, line_name, target_pcs_per_hour').limit(3);
  const donSX = dons.filter((o) => o.po_number === 'PO-M2601' || o.po_number === 'SEED-PO-0001');
  // 🔑 Hình dạng một ca THẬT: khởi động chậm, đỉnh giữa buổi, **tụt sâu sau
  // giờ ăn trưa**, hồi lại cuối ca. Đây là hình dạng mà tổ trưởng nhận ra ngay
  // — và là thứ biểu đồ theo giờ sinh ra để chỉ.
  const CA = [
    ['07:30 - 08:30', 0.82, 'Đầu ca, công nhân vào chuyền chậm'],
    ['08:30 - 09:30', 1.02, 'Chuyền chạy ổn định'],
    ['09:30 - 10:30', 1.05, 'Đỉnh sản lượng buổi sáng'],
    ['10:30 - 11:30', 0.97, ''],
    ['12:30 - 13:30', 0.68, 'Tụt sau giờ ăn — máy 3 kim hỏng 20 phút'],
    ['13:30 - 14:30', 0.88, 'Đã thay máy, chuyền hồi dần'],
    ['14:30 - 15:30', 0.99, ''],
    ['15:30 - 16:30', 1.03, 'Tăng tốc bù phần hụt buổi trưa'],
  ];
  const hang = [];
  lines.slice(0, 2).forEach((line, iLine) => {
    const don = donSX[iLine % donSX.length];
    if (!don) return;
    const muc = line.target_pcs_per_hour || 60;
    CA.forEach(([slot, heSo, ghiChu], i) => {
      const thuc = Math.round(muc * heSo * (iLine === 1 ? 0.93 : 1));
      hang.push({
        line_id: line.id, order_id: don.id, log_date: NGAY, time_slot: slot,
        operator_count: 24 + iLine, target_qty: muc, actual_qty: thuc,
        // Hàng phải sửa dồn vào đúng giờ sự cố — lỗi ⛔ không rải đều, nó bám
        // theo nguyên nhân.
        rework_qty: i === 4 ? 6 + iLine * 2 : i === 0 ? 2 : 1,
        notes: `${DAU} ${line.line_name}${ghiChu ? ' — ' + ghiChu : ''}`,
      });
    });
  });
  const { error: eH } = await sb.from('hourly_production_logs').insert(hang);
  console.log(`② sản lượng theo giờ: ${eH ? '⛔ ' + eH.message : hang.length + ' bản ghi'}`);

  // ── ③ BIÊN BẢN QA ────────────────────────────────────────────────────────
  // 🔑 Một chuyền VƯỢT ngưỡng 3%, một chuyền DƯỚI ngưỡng — để biểu đồ ở
  // `/giam-doc` chứng minh được cả hai màu, ⛔ không chỉ một.
  const qa = [
    { don: donSX[0], line: 'Tổ May - Chuyền 1', kiem: 320, loi: 6, ghi: 'Lỗi đứt chỉ đường sườn, đã cho sửa tại chuyền' },
    { don: donSX[0], line: 'Tổ May - Chuyền 1', kiem: 280, loi: 4, ghi: 'Kiểm ca chiều' },
    { don: donSX[1] ?? donSX[0], line: 'Tổ May - Chuyền 2', kiem: 300, loi: 14, ghi: 'VƯỢT NGƯỠNG — lệch canh sợi thân trước, dừng chuyền rà lại rập' },
  ].filter((q) => q.don);
  const { error: eQ } = await sb.from('qa_audit_reports').insert(qa.map((q) => ({
    order_id: q.don.id, line_name: q.line, time_slot: '14:00 - 15:00',
    inspected_qty: q.kiem, passed_qty: q.kiem - q.loi, defect_qty: q.loi,
    notes: `${DAU} ${q.ghi}`,
  })));
  console.log(`③ biên bản QA: ${eQ ? '⛔ ' + eQ.message : qa.length + ' bản ghi'}`);

  // ── ④ PHIẾU CẮT HÔM NAY ──────────────────────────────────────────────────
  // Một phiếu ĐỦ, một phiếu HỤT kế hoạch và VƯỢT định mức vải — để hai biểu đồ
  // của tổ cắt chứng minh được cả cột xanh lẫn cột cảnh báo.
  const { data: roll } = await sb.from('fabric_rolls').select('id').limit(1);
  const phieu = [
    { no: `CT-${NGAY.replaceAll('-', '')}-01`, don: donSX[0], marker: 'MK-TEE-S-M-L', dai: 7.2, lop: 80,
      kh: 480, thuc: 480, dm: 1.35, dung: 640, dau: 8.5, loi: 1.2,
      ghi: 'Trải đủ, ⛔ không sự cố' },
    { no: `CT-${NGAY.replaceAll('-', '')}-02`, don: donSX[1] ?? donSX[0], marker: 'MK-JKT-M-L', dai: 9.8, lop: 60,
      kh: 360, thuc: 342, dm: 2.10, dung: 792, dau: 22.4, loi: 6.8,
      ghi: 'Hụt 18 sp do 2 lá vải lỗi dệt; vải dùng vượt định mức' },
  ].filter((p) => p.don);
  const { error: eC } = await sb.from('cut_tickets').insert(phieu.map((p) => ({
    ticket_no: p.no, order_id: p.don.id, marker_code: p.marker,
    marker_length_m: p.dai, ply_count: p.lop,
    total_planned_pcs: p.kh, total_actual_pcs: p.thuc,
    bom_allowance_m: p.dm,              // ⚠️ m/SẢN PHẨM — ADR-025 §2.2
    total_fabric_used_m: p.dung, remnant_length_m: p.dau, defect_length_m: p.loi,
    status: 'COMPLETED', roll_id: roll?.[0]?.id ?? null,
    notes: `${DAU} ${p.ghi}`,
  })));
  console.log(`④ phiếu cắt: ${eC ? '⛔ ' + eC.message : phieu.length + ' bản ghi'}`);

  // ── ⑤ NHẬT KÝ HOÀN THÀNH ─────────────────────────────────────────────────
  const { data: bd } = await sb.from('cut_bundles').select('id, bundle_code, quantity, cut_tickets(order_id)').limit(3);
  const ht = (bd ?? []).slice(0, 2).map((b, i) => ({
    bundle_id: b.id,
    order_id: b.cut_tickets?.order_id ?? b.cut_tickets?.[0]?.order_id ?? null,
    // Phễu phải GIẢM DẦN qua từng khâu — hàng ⛔ không tự sinh ra ở khâu sau.
    trimming_qty: 120 - i * 20,
    ironing_qty: 112 - i * 20,
    final_qc_passed_qty: 106 - i * 20,
    final_qc_defect_qty: 6 - i,
    notes: `${DAU} ${b.bundle_code}`,
  }));
  const { error: eF } = await sb.from('finishing_logs').insert(ht);
  console.log(`⑤ nhật ký hoàn thành: ${eF ? '⛔ ' + eF.message : ht.length + ' bản ghi'}`);
}

async function donSach() {
  console.log('DỌN dữ liệu gieo…');
  for (const t of ['finishing_logs', 'cut_tickets', 'qa_audit_reports', 'hourly_production_logs']) {
    const { error, count } = await sb.from(t).delete({ count: 'exact' }).like('notes', `${DAU}%`);
    console.log(`  ${t.padEnd(24)} ${error ? '⛔ ' + error.message : (count ?? 0) + ' dòng đã xoá'}`);
  }
  const { error } = await sb.from('orders').update({ unit_price: null }).not('unit_price', 'is', null);
  console.log(`  orders.unit_price → null   ${error ? '⛔ ' + error.message : 'xong'}`);
}

await main();
