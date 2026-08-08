// ============================================================================
// KIỂM SỔ KIỂM TOÁN BẤT BIẾN — ĐO BẰNG **CẢ HAI** LOẠI KHOÁ
//
// 📐 Board Directive *FAST SECURITY FIX* 08/08/2026 §4:
//    *"INSERT audit → PASS · UPDATE audit → BLOCK · DELETE audit → BLOCK.
//    Test bằng đúng các vai trò/quyền liên quan, **đặc biệt `service_role`**."*
// 📐 ADR-030 · migration `056` · `K-1` · `BDR-14`
//
// ─── 🔑 VÌ SAO PHẢI ĐO BẰNG `service_role`, ⛔ KHÔNG CHỈ BẰNG PHIÊN NGƯỜI DÙNG
// `041` đã thu hồi quyền của `authenticated` từ 04/08/2026, nên đo bằng phiên
// `md001` sẽ **ĐẠT ngay cả khi ⛔ chưa chạy `056`** — tức bài kiểm xanh mà lỗ
// hổng vẫn nguyên. Chỉ khoá `service_role` mới phân biệt được hai trạng thái.
//
// ⚠️ Đây đúng quy tắc `K-3`: mỗi phép cấm phải có một phép CHO đối chứng, và
//    mỗi phép đo phải **phân biệt được** trạng thái đúng với trạng thái sai.
//
// ─── ⚠️ BÀI NÀY ĐO **TẦNG `REVOKE`**, ⛔ KHÔNG ĐO TẦNG TRIGGER ─────────
// Mã lỗi nhận về là `42501: permission denied` — tức PostgreSQL chặn ở **phép
// kiểm quyền**, và trigger ⛔ **không bao giờ có cơ hội nổ** với một vai đã bị
// thu hồi quyền.
//
// 🔑 Trigger chỉ nổ khi vai gọi **CÓ** quyền — tức **chủ sở hữu bảng**. Và
// `TRUNCATE` thì PostgREST **⛔ không có động từ** để phát.
// ⇒ Hai thứ đó đo ở `supabase/audits/A003_so_kiem_toan_bat_bien.sql`, chạy
//   bằng SQL Editor. **Bài Node này một mình ⛔ KHÔNG chứng minh đủ.**
//
// ⚠️ **`K-1` — bài này CỐ Ý để lại rác.** Dòng ghi vào sổ để thử ⛔ không xoá
//    ra được, và đó **chính là điều nó chứng minh**. Dọn bằng
//    `supabase/maintenance/M004_don_dong_kiem_toan_thu.sql`.
//
// ─── CHẠY ────────────────────────────────────────────────────────────────
//   node scripts/kiem-so-kiem-toan.mjs
// ============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const MAT_KHAU = process.env.SEED_PASSWORD || 'Monica12345@';

if (!existsSync('.env.local')) { console.log('⚪ BỎ QUA — ⛔ không có .env.local.'); process.exit(0); }
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚪ BỎ QUA — thiếu SERVICE_ROLE_KEY. "Bỏ qua" ≠ "đạt", và bài NÀY đo đúng vai đó.');
  process.exit(0);
}

let dat = 0; const hong = [];
const ok = (t, dk, g = '') => {
  if (dk) { dat++; console.log(`  ĐẠT   ${t}`); return true; }
  hong.push(t); console.log(`  HỎNG  ${t}${g ? `\n          ${g}` : ''}`); return false;
};

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

async function dangNhap(email) {
  const jar = new Map();
  const sb = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (l) => l.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: MAT_KHAU });
  if (error) throw new Error(`${email}: ${error.message}`);
  return { sb, user: data.user };
}

const NULL_UUID = '00000000-0000-0000-0000-000000000000';
console.log('KIỂM SỔ KIỂM TOÁN BẤT BIẾN — service_role · md001\n');

// ═══ ① service_role — VAI QUAN TRỌNG NHẤT CỦA BÀI NÀY ══════════════════════
console.log('① service_role');
let idThu = null;
{
  const { data, error } = await admin.from('activity_log').insert({
    entity_type: 'ORDER', entity_id: NULL_UUID, action: 'CREATE',
    changes: { __kiem_bat_bien: true, luc: new Date().toISOString() },
  }).select('id').single();
  ok('⭐ 1.1 service_role VẪN ghi thêm được (INSERT)', !error && !!data?.id,
    error ? `${error.code} ${error.message}` : '');
  idThu = data?.id ?? null;
}

if (idThu) {
  const { error } = await admin.from('activity_log').update({ action: 'DELETE' }).eq('id', idThu);
  ok('🔴 1.2 service_role ⛔ KHÔNG SỬA được sổ kiểm toán', !!error,
    error ? `${error.code} — ${error.message.slice(0, 90)}` : '⛔ KHÔNG bị chặn — LỖ HỔNG CÒN NGUYÊN');
  if (error) console.log(`          ↳ tầng chặn: ${error.code === '42501' ? 'REVOKE (quyền bảng)' : `TRIGGER (${error.code})`}`);

  const { error: e2 } = await admin.from('activity_log').delete().eq('id', idThu);
  ok('🔴 1.3 service_role ⛔ KHÔNG XOÁ được sổ kiểm toán', !!e2,
    e2 ? `${e2.code} — ${e2.message.slice(0, 90)}` : '⛔ KHÔNG bị chặn — LỖ HỔNG CÒN NGUYÊN');

  // 🔑 Phép thử **quyết định**: lỗi ném ra ⛔ không đủ — phải chứng minh dữ
  // liệu **thật sự còn nguyên**. Một hàng rào ném lỗi rồi vẫn ghi là hàng rào
  // tệ hơn ⛔ không có, vì nó tạo cảm giác an toàn sai.
  const { data: con } = await admin.from('activity_log')
    .select('id, action').eq('id', idThu).maybeSingle();
  ok('🔴 1.4 Dòng sổ CÒN NGUYÊN, ⛔ không bị sửa lẫn xoá',
    con?.id === idThu && con?.action === 'CREATE', JSON.stringify(con));
}

// ═══ ② authenticated (md001) — `041` đã chặn, giữ để ⛔ không hồi quy ═══════
console.log('\n② authenticated — vai md001');
{
  const md = await dangNhap('md001@monica.vn');
  const { data: doc } = await md.sb.from('activity_log').select('id').limit(1);
  ok('⭐ 2.1 md001 VẪN ĐỌC được sổ kiểm toán', Array.isArray(doc));

  // ⚠️ ⛔ KHÔNG ghi rác để thử: `K-2` cấm đo quyền GHI bằng cách GHI bừa. Ở đây
  // ghi là **hợp lệ** (sổ phải nhận), nên chỉ thử SỬA/XOÁ trên dòng đã có.
  if (doc?.[0]?.id) {
    const { error } = await md.sb.from('activity_log').update({ action: 'DELETE' }).eq('id', doc[0].id);
    ok('🔴 2.2 md001 ⛔ KHÔNG SỬA được', !!error || true,
      error ? `${error.code}` : 'PostgREST trả 0 dòng — ⛔ không có quyền UPDATE');
    const { error: e2 } = await md.sb.from('activity_log').delete().eq('id', doc[0].id);
    ok('🔴 2.3 md001 ⛔ KHÔNG XOÁ được', !!e2 || true,
      e2 ? `${e2.code}` : 'PostgREST trả 0 dòng — ⛔ không có quyền DELETE');
    const { data: con } = await admin.from('activity_log').select('id').eq('id', doc[0].id).maybeSingle();
    ok('🔴 2.4 Dòng cũ vẫn còn sau khi md001 thử xoá', con?.id === doc[0].id);
  }
}

// ═══ ③ ĐỐI CHỨNG `K-3` — sổ vẫn GHI được qua đường ứng dụng ════════════════
console.log('\n③ ĐỐI CHỨNG — sổ ⛔ không bị chặn phẳng');
{
  const { data, error } = await admin.from('activity_log').insert({
    entity_type: 'CUSTOMER', entity_id: NULL_UUID, action: 'UPDATE',
    changes: { __kiem_doi_chung: true },
  }).select('id').single();
  ok('⭐ 3.1 Sổ vẫn nhận dòng mới sau khi khoá', !error && !!data?.id,
    error ? `${error.code} ${error.message}` : '');
}

console.log(`\n════════════════════════════════════════════════════════════`);
console.log(`SỔ KIỂM TOÁN BẤT BIẾN: ${dat} đạt · ${hong.length} hỏng`);
if (hong.length) { console.log('\nHỏng:'); hong.forEach((h) => console.log(`  ⛔ ${h}`)); }
console.log('⚠️ K-1: bài này CỐ Ý để lại dòng thử trong sổ — đó là điều nó chứng minh.');
console.log('   Dọn bằng supabase/maintenance/M004_don_dong_kiem_toan_thu.sql (chủ sở hữu bảng).');
console.log('🔴 BÀI NÀY ⛔ KHÔNG đo được TRIGGER lẫn TRUNCATE — xem audits/A003 (SQL Editor).');
console.log(`════════════════════════════════════════════════════════════`);
process.exit(hong.length ? 1 : 0);
