// ============================================================================
// HAI PHÉP QUÉT TOÀN CỤC
//
//   ① anon  — người CHƯA ĐĂNG NHẬP không được đọc bảng nào, không được gọi
//             hàm `SECURITY DEFINER` nào.
//   ② Buyer — khách hàng chỉ thấy đúng phạm vi Buyer Portal, không hơn.
//
// ─── VÌ SAO QUÉT TOÀN CỤC CHỨ KHÔNG QUÉT DANH SÁCH ────────────────────────
//
// Ba lần trong dự án này, một danh sách VIẾT CỨNG đã bỏ sót: `024` bật cờ view
// theo 7 tên · `025` khoá nhà thầu theo danh sách cho phép · `018` khoanh vùng
// buyer theo ảnh chụp một thời điểm. Danh sách viết cứng **không tự lớn lên
// theo lược đồ**.
//
// Nên bài này lấy danh sách quan hệ **ĐỘNG** từ OpenAPI của PostgREST: bảng
// mới xuất hiện là tự động bị soi, không cần ai nhớ thêm vào đâu cả.
// ============================================================================
import { requireDb, scoreboard, sessionFactory, dem } from '../_lib/harness.mjs';

const { env, admin, anonClient, createClient } = requireDb();
const s = scoreboard('QUÉT ANON + BUYER');
const phien = sessionFactory(admin, createClient, env, 'sweep');
let baId = null;

// Phạm vi Buyer Portal. Mọi quan hệ NGOÀI danh sách này mà Buyer thấy > 0 dòng
// đều là rò rỉ.
const PHAM_VI_BUYER = new Set([
  'orders', 'order_items', 'order_milestones', 'order_size_breakdown',
  'customers', 'styles', 'buyer_accounts',
  'shipments', 'shipment_cartons', 'cartons',
  'qa_audit_reports', 'hourly_production_logs', 'sample_submissions', 'bundles',
  'v_po_shipments', 'v_po_shipment_readiness', 'v_order_risk',
]);

try {
  const spec = await (await fetch(`${env.url}/rest/v1/`, {
    headers: { apikey: env.service, Authorization: `Bearer ${env.service}` },
  })).json();
  const quanHe = Object.keys(spec.definitions ?? {}).sort();
  console.log(`PostgREST expose ${quanHe.length} quan hệ.\n`);

  // ══ ① ANON ──────────────────────────────────────────────────────────────
  console.log('① CHƯA ĐĂNG NHẬP');
  const anon = anonClient();
  const anonDocDuoc = [];
  for (const t of quanHe) if ((await dem(anon, t)) ?? 0) anonDocDuoc.push(t);
  s.ok(`anon KHÔNG đọc được quan hệ nào (${quanHe.length} đã quét)`,
    anonDocDuoc.length === 0, anonDocDuoc.join(', '));

  // Hàm `SECURITY DEFINER` chạy dưới quyền chủ sở hữu — vượt mặt mọi RLS.
  // ⚠️ Truyền UUID không tồn tại: đủ để biết có qua được cổng quyền hay không,
  // mà không chạm một dòng dữ liệu thật nào.
  const MA_MA = '00000000-0000-4000-8000-000000000000';
  const HAM = [
    ['mos_is_buyer', {}], ['mos_is_external', {}], ['mos_is_subcon', {}],
    ['mos_is_partner', {}], ['mos_partner_id', {}], ['mos_buyer_customer_id', {}],
    ['mos_current_role', {}], ['mos_partner_subcontractor_id', {}],
    ['mos_can_read_assignment', { p_assignment_id: MA_MA }],
    ['mos_can_write_assignment', { p_assignment_id: MA_MA }],
    ['mos_buyer_can_see_order', { p_order_id: MA_MA }],
    ['mos_partner_can', { p_resource: 'ASSIGNMENT', p_action: 'READ' }],
    ['mos_soft_delete_commercial_term', { p_id: MA_MA }],
    ['mos_restore_commercial_term', { p_id: MA_MA }],
  ];
  const goiDuoc = [];
  for (const [ten, tham] of HAM) {
    const { error } = await anon.rpc(ten, tham);
    // 42501 = bị từ chối. PGRST202 = PostgREST không expose (cũng là chặn).
    // Mã KHÁC nghĩa là hàm ĐÃ CHẠY rồi mới hỏng ⇒ vẫn qua được cổng quyền.
    const biChan = error?.code === '42501' || error?.code === 'PGRST202';
    if (!biChan) goiDuoc.push(`${ten}(${error?.code ?? 'không lỗi'})`);
  }
  s.ok(`anon KHÔNG gọi được hàm SECURITY DEFINER nào (${HAM.length} đã thử)`,
    goiDuoc.length === 0, goiDuoc.join(', '));

  // ══ ② BUYER ─────────────────────────────────────────────────────────────
  console.log('\n② BUYER — chỉ thấy phạm vi Buyer Portal');
  const { data: khach } = await admin.from('customers').select('id')
    .eq('customer_code', 'KHZBY').maybeSingle();
  if (!khach) {
    s.chuaDo('Buyer', 'không có khách hàng KHZBY — chạy S001 trước');
  } else {
    const buyer = await phien.tao('buyer', 'b');
    const { data: ba } = await admin.from('buyer_accounts')
      .insert({ user_id: buyer.userId, customer_id: khach.id, is_active: true, note: 'ZZ sweep' })
      .select('id').single();
    baId = ba.id;

    const roRi = [], thay = [], rong = [];
    for (const t of quanHe) {
      const tong = await dem(admin, t);
      if (tong === null) continue;
      if (tong === 0) { rong.push(t); continue; }
      const b = await dem(buyer.client, t);
      if (PHAM_VI_BUYER.has(t)) { if (b) thay.push(`${t} ${b}/${tong}`); continue; }
      if (b) roRi.push(`${t} → ${b}/${tong}`);
    }
    s.ok('KHÔNG quan hệ nào NGOÀI phạm vi bị lộ cho Buyer',
      roRi.length === 0, roRi.join(' · '));
    // ⚠️ Vế KHẲNG ĐỊNH — nếu Buyer thấy 0 ở khắp nơi thì phép trên cũng xanh,
    // và ta sẽ không phân biệt được "khoanh đúng" với "Buyer Portal đã chết".
    s.ok('⭐ Buyer THẤY ĐƯỢC ít nhất một thứ trong phạm vi của mình',
      thay.length > 0, 'Buyer không thấy gì — cổng có thể đang hỏng');
    console.log(`     Buyer thấy: ${thay.join(' · ') || '(không có)'}`);
    console.log(`     ⚪ ${rong.length} quan hệ RỖNG — không kết luận được (Điều V.1)`);
    await buyer.client.auth.signOut();
  }
} catch (e) {
  console.error('\n⛔ NGOẠI LỆ: ' + e.message);
  s.ok('Bài kiểm chạy trọn vẹn', false, e.message);
} finally {
  if (baId) await admin.from('buyer_accounts').delete().eq('id', baId);
  await phien.don();
}

process.exit(s.ketThuc() ? 1 : 0);
