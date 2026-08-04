// ============================================================================
// A001 RUNTIME — ĐO BỀ MẶT PHƠI RA, BẰNG PHIÊN THẬT
//
// Board Directive 05/08/2026: *"Không cần yêu cầu Board chạy lại A001… Từ thời
// điểm này, trách nhiệm thuộc Implementation Team."*
//
// ─── TỆP NÀY KIỂM ĐƯỢC GÌ, VÀ KHÔNG KIỂM ĐƯỢC GÌ ─────────────────────────
//
// `supabase/audits/A001_view_security.sql` đọc `pg_class` · `pg_proc` ·
// `pg_default_acl` — **PostgREST không cho đọc `pg_catalog`**, nên bài kiểm này
// KHÔNG thay thế được A001. Nó đo phần **hành vi**, tức phần thật sự gây thiệt
// hại nếu hỏng:
//
// | A001 kiểm | Tệp này |
// |---|---|
// | view thiếu `security_invoker` | ⛔ không đo được *(cần `pg_class.reloptions`)* |
// | **view cho `anon` đọc** | ✅ **đo được — thử đọc thật** |
// | **hàm `SECURITY DEFINER` mà `anon` gọi được** | ✅ **đo được — thử gọi thật** |
// | `search_path` đã ghim | ⛔ không đo được *(cần `pg_proc.proconfig`)* |
// | quyền mặc định cho `anon` | ⛔ không đo được *(cần `pg_default_acl`)* |
//
// 🔑 Hai dòng ✅ là hai dòng **quan trọng nhất**: chúng đo thứ mà kẻ tấn công
// thật sự chạm được — không cần đăng nhập, không cần token. Ba dòng ⛔ là điều
// kiện *gián tiếp* dẫn tới hai dòng đó.
//
// ⚠️ **Vì vậy tệp này KHÔNG cho phép tuyên bố "A001 PASS".** Nó cho phép tuyên
// bố *"bề mặt phơi ra với `anon` đo được là sạch"*. Khác nhau, và phải ghi rõ.
// ============================================================================
import { requireDb, scoreboard, sessionFactory, boiCanh } from '../_lib/harness.mjs';

const { env, admin, anonClient, createClient } = requireDb();
const s = scoreboard('A001 RUNTIME — bề mặt phơi ra');
const phien = sessionFactory(admin, createClient, env, 'a001rt');

// 12 view trong `public` — danh sách lấy từ kết quả A001 chạy 05/08/2026.
const VIEW = [
  'v_costing_approved', 'v_assignment_report_status', 'v_assignment_timeline',
  'v_bin_path', 'v_inspection_score', 'v_material_roll_trace', 'v_order_risk',
  'v_po_material_readiness', 'v_po_shipment_readiness', 'v_po_shipments',
  'v_shade_board', 'vw_cut_ticket_summary',
];

// Hàm `SECURITY DEFINER` gọi được qua PostgREST RPC. Mỗi hàm là một lỗ khoét
// có chủ ý xuyên qua RLS (Hiến pháp V.3) — `anon` chạm được là hỏng nặng.
const HAM = [
  ['mos_current_role', {}],
  ['mos_is_buyer', {}],
  ['mos_is_subcon', {}],
  ['mos_is_external', {}],
  ['mos_is_partner', {}],
  ['mos_partner_id', {}],
  ['mos_buyer_customer_id', {}],
  ['mos_partner_subcontractor_id', {}],
];

try {
  await boiCanh(admin, {});
  const anon = anonClient();
  const md = (await phien.tao('md', 'md')).client;

  // ══ 1 · VIEW — `anon` KHÔNG được đọc bất kỳ view nào ─────────────────────
  console.log('\n1 · VIEW — anon phải bị chặn ở CẢ 12 view');
  let hoView = 0;
  for (const v of VIEW) {
    const { error } = await anon.from(v).select('*', { count: 'exact', head: true });
    // Không lỗi = đọc được. Với view, `anon` đọc được là cửa mở ra Internet.
    if (!error) { hoView++; s.ok(`${v} — anon bị chặn`, false, 'ANON ĐỌC ĐƯỢC'); }
    else s.ok(`${v} — anon bị chặn (${error.code})`, true);
  }

  // ⚠️ Vế KHẲNG ĐỊNH (K-3). Thiếu nó, một CSDL thu hồi sạch quyền của MỌI vai
  // cũng cho ra 12 dòng xanh ở trên — trong khi ứng dụng đã chết hoàn toàn.
  const { error: eMd } = await md.from('v_order_risk')
    .select('*', { count: 'exact', head: true });
  s.ok('⭐ ...nhưng vai nội bộ VẪN đọc được view (không chặn phẳng)', !eMd,
    `md cũng bị chặn: ${eMd?.code} — ứng dụng sẽ trắng màn hình`);

  // ══ 2 · HÀM SECURITY DEFINER — `anon` KHÔNG được gọi ─────────────────────
  console.log('\n2 · HÀM SECURITY DEFINER — anon phải bị chặn');
  for (const [ten, args] of HAM) {
    const { error } = await anon.rpc(ten, args);
    // `42883` = hàm không tồn tại / không thấy được ⇒ cũng là chặn.
    s.ok(`${ten}() — anon bị chặn`, !!error,
      'ANON GỌI ĐƯỢC — lỗ khoét xuyên RLS mở cho người chưa đăng nhập');
  }

  const { error: eRpc } = await md.rpc('mos_current_role', {});
  s.ok('⭐ ...nhưng vai nội bộ VẪN gọi được (không chặn phẳng)', !eRpc,
    `md cũng bị chặn: ${eRpc?.code} — policy dựa trên hàm này sẽ hỏng theo`);

  // ══ 3 · PHÉP CHIẾU KẾ TOÁN — `anon` tuyệt đối không chạm ─────────────────
  // Tách riêng vì `v_costing_approved` là view DUY NHẤT chạy dưới quyền chủ hàm
  // (SECURITY_DEFINER_REGISTRY §2.4). Nó vượt mặt RLS; nếu `anon` đọc được thì
  // cơ cấu giá thành phơi ra Internet mà không cần một lần đăng nhập nào.
  console.log('\n3 · v_costing_approved — ngoại lệ chạy quyền chủ hàm');
  const { error: eKt } = await anon.from('v_costing_approved').select('*').limit(1);
  s.ok('⭐⭐ anon KHÔNG chạm được phép chiếu giá thành', !!eKt,
    'ANON ĐỌC ĐƯỢC CƠ CẤU GIÁ THÀNH');

  await md.auth.signOut();
  if (hoView) console.log(`\n🔴 ${hoView}/12 view cho anon đọc.`);
} catch (e) {
  console.error('\n⛔ NGOẠI LỆ: ' + e.message);
  s.ok('Bài kiểm chạy trọn vẹn', false, e.message);
} finally {
  await phien.don();
  console.log('\nĐã dọn: tài khoản tạm. Không dòng nghiệp vụ nào được tạo ra.');
  console.log('⚠️ Tệp này KHÔNG thay thế A001. Nó không đo được `security_invoker`,');
  console.log('   `search_path` và quyền mặc định — ba thứ cần đọc `pg_catalog`.');
}

process.exit(s.ketThuc() ? 1 : 0);
