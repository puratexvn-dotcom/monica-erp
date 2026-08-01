// ============================================================================
// ĐO CHI PHÍ HIỆU NĂNG CỦA RLS
//
// ⚠️ ĐÂY LÀ PHÉP ĐO, KHÔNG PHẢI PHÉP KIỂM. Nó KHÔNG bao giờ trả mã lỗi khác 0.
// Lý do: ngưỡng hiệu năng phụ thuộc mạng và kích thước dữ liệu, nên biến nó
// thành cổng chặn sẽ sinh báo động giả — và báo động giả lặp lại thì người ta
// bắt đầu bỏ qua cả báo động thật.
//
// ─── CÂU HỎI NÓ TRẢ LỜI ───────────────────────────────────────────────────
//
// `STABLE` có cứu được không?
//
//   hàm KHÔNG tham số   `mos_partner_id()`            → PostgreSQL nhớ 1 lần/câu lệnh
//   hàm CÓ tham số      `mos_can_read_assignment(id)` → gọi lại cho MỖI GIÁ TRỊ
//
// Đây là căn cứ của Quyết định ② ("RLS là nơi tối ưu tốc độ"), và là lý do mọi
// policy của 031 viết dạng TẬP HỢP thay vì gọi hàm-mỗi-dòng.
//
// ⚠️ GIỚI HẠN ĐÃ BIẾT: dữ liệu nền hiện chỉ vài chục dòng, nên MỌI con số dưới
// đây nằm trong nhiễu mạng (~180ms/vòng). Chúng chứng minh **không có gì thảm
// hoạ**, KHÔNG chứng minh policy chịu được tải. Muốn kết luận thật phải đo lại
// với vài nghìn dòng — đã ghi vào Technical Debt.
// ============================================================================
import { requireDb, loadEnv } from '../_lib/harness.mjs';

const { env, admin, createClient } = requireDb();

const VONG = Number(process.env.BENCH_ROUNDS || 8);
const KHOI_DONG = 3;
const trungVi = (a) => {
  const x = [...a].sort((p, q) => p - q), m = x.length >> 1;
  return x.length % 2 ? x[m] : (x[m - 1] + x[m]) / 2;
};

let uid = null, acctId = null;
try {
  const { data: dsDoiTac } = await admin.from('partners')
    .select('id, partner_code').eq('partner_type', 'PRODUCTION_PARTNER')
    .is('deleted_at', null).limit(1);
  const doiTac = dsDoiTac?.[0];
  const { data: viec } = await admin.from('assignments').select('id')
    .is('deleted_at', null).limit(1).maybeSingle();
  if (!doiTac || !viec) {
    console.log('⚪ BỎ QUA — chưa có dữ liệu nền. Chạy S001 trước.');
    process.exit(0);
  }

  const email = 'zz-bench@monica.vn', password = 'Zz-bench-tmp!';
  const { data: mk, error: mkErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { role: 'subcon' }, user_metadata: { full_name: 'ZZ Bench' },
  });
  if (mkErr) throw new Error(mkErr.message);
  uid = mk.user.id;
  await admin.from('profiles').upsert({ id: uid, full_name: 'ZZ Bench' });
  const { data: acc } = await admin.from('partner_accounts')
    .insert({ user_id: uid, partner_id: doiTac.id, is_active: true, note: 'ZZ bench' })
    .select('id').single();
  acctId = acc.id;
  const sub = createClient(env.url, env.anon, { auth: { persistSession: false } });
  await sub.auth.signInWithPassword({ email, password });

  const PHEP = [
    ['nền · orders', () => sub.from('orders').select('id').limit(50)],
    ['mos_partner_id() — KHÔNG tham số', () => sub.rpc('mos_partner_id')],
    ['mos_can_read_assignment(id) — CÓ tham số',
      () => sub.rpc('mos_can_read_assignment', { p_assignment_id: viec.id })],
    ['assignments — policy khoanh theo phần việc', () => sub.from('assignments').select('id')],
    ['sewing_lines — policy có truy vấn con (031b)', () => sub.from('sewing_lines').select('id')],
    ['subcon_orders — policy có truy vấn con (031c3)', () => sub.from('subcon_orders').select('id')],
    ['subcontractors — policy so cột qua hàm bắc cầu (031c2)',
      () => sub.from('subcontractors').select('id')],
  ];

  const mau = PHEP.map(() => []);
  for (let v = 0; v < VONG + KHOI_DONG; v += 1)
    for (let i = 0; i < PHEP.length; i += 1) {
      const t0 = performance.now();
      await PHEP[i][1]();
      if (v >= KHOI_DONG) mau[i].push(performance.now() - t0);
    }

  const nen = trungVi(mau[0]);
  console.log(`\nĐO XEN KẼ · ${VONG} vòng (bỏ ${KHOI_DONG} vòng khởi động)`);
  console.log('─'.repeat(78));
  console.log('phép đo'.padEnd(52) + 'trung vị'.padStart(11) + 'so nền'.padStart(10));
  console.log('─'.repeat(78));
  for (let i = 0; i < PHEP.length; i += 1) {
    const tv = trungVi(mau[i]);
    console.log(PHEP[i][0].padEnd(52) + `${tv.toFixed(0)} ms`.padStart(11) +
      (i === 0 ? '—' : `${(tv / nen).toFixed(2)}×`).padStart(10));
  }
  console.log('─'.repeat(78));
  console.log(`Nền ${nen.toFixed(0)} ms — bị chi phối bởi vòng mạng tới Supabase.`);
  console.log('\n⚠️ Ở quy mô hiện tại MỌI con số trên nằm trong nhiễu mạng.');
  console.log('   Chúng chứng minh KHÔNG có gì thảm hoạ, KHÔNG chứng minh chịu được tải.');
} catch (e) {
  console.error('⛔ NGOẠI LỆ: ' + e.message);
} finally {
  if (acctId) await admin.from('partner_accounts').delete().eq('id', acctId);
  if (uid) {
    await admin.from('profiles').delete().eq('id', uid);
    await admin.auth.admin.deleteUser(uid);
  }
  console.log('\nĐã dọn tài khoản tạm.');
}

// Phép ĐO, không phải phép KIỂM — luôn thoát 0.
process.exit(0);
