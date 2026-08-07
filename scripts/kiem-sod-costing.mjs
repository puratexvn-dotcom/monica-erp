// ============================================================================
// ĐO PHÂN TÁCH TRÁCH NHIỆM DUYỆT GIÁ — BẰNG PHIÊN ĐĂNG NHẬP THẬT
//
// 🔴 VÌ SAO PHẢI CÓ TỆP NÀY RIÊNG
// Khối tự kiểm trong `049_po_workflow_lock_and_costing_sod.sql` đo được
// **trigger** nhưng ⛔ KHÔNG đo được **policy**: SQL Editor chạy dưới quyền
// chủ sở hữu, ⛔ không có JWT, nên `mos_current_role()` ⛔ không phản ánh vai
// thật và RLS ⛔ không áp lên chủ sở hữu bảng.
//
// ⇒ Điều khoản SoD chỉ được coi là ĐÃ VÁ khi tệp này in `ĐẠT`.
// `V.1`: ⛔ không kết luận trên phép đo chưa thực hiện.
//
// CHẠY:  node scripts/kiem-sod-costing.mjs
// CẦN:   .env.local có NEXT_PUBLIC_SUPABASE_URL · ANON_KEY · SERVICE_ROLE_KEY
//        và bốn tài khoản seed (admin001 · gd001 · md001).
//
// ⚠️ Bài kiểm dựng một bản chiết tính **dùng-một-lần** rồi dọn trong `finally`.
// ⛔ KHÔNG chạm một dòng dữ liệu nghiệp vụ thật nào.
// ============================================================================
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const MAT_KHAU = process.env.SEED_PASSWORD || 'Monica12345@';
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SRV = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SRV) {
  console.log('⚪ BỎ QUA — thiếu bí mật trong .env.local. "Bỏ qua" ≠ "đạt".');
  process.exit(0);
}

const admin = createClient(URL, SRV, { auth: { persistSession: false } });

let dat = 0; const hong = [];
const ok = (t, dk, g = '') => {
  if (dk) { dat++; console.log(`  ĐẠT   ${t}`); return; }
  hong.push(t); console.log(`  HỎNG  ${t}${g ? `\n          ${g}` : ''}`);
};

async function phien(email) {
  const sb = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password: MAT_KHAU });
  if (error) throw new Error(`${email}: ${error.message}`);
  return sb;
}

const so = `SOD-${Date.now().toString().slice(-8)}`;
let id = null;

try {
  const { data: tao, error: eTao } = await admin.from('costings')
    .insert({ costing_no: so, version: 1, order_type: 'FOB', currency: 'USD', status: 'SUBMITTED' })
    .select('id').single();
  if (eTao) throw new Error(`⛔ không dựng được bản chiết tính thử: ${eTao.message}`);
  id = tao.id;

  console.log('PHÂN TÁCH TRÁCH NHIỆM DUYỆT GIÁ — đo bằng phiên thật\n');

  /** Đặt lại trạng thái rồi cho một vai thử chuyển sang `tt`. Trả số dòng đổi. */
  const thu = async (sb, tt, tuTrangThai = 'SUBMITTED') => {
    await admin.from('costings').update({ status: tuTrangThai }).eq('id', id);
    const { data } = await sb.from('costings').update({ status: tt }).eq('id', id).select('id');
    return (data ?? []).length;
  };

  const sa = await phien('admin001@monica.vn');
  const gd = await phien('gd001@monica.vn');
  const md = await phien('md001@monica.vn');

  ok('superadmin DUYỆT được (SUBMITTED → APPROVED)', (await thu(sa, 'APPROVED')) === 1);
  ok('🔴 giamdoc DUYỆT được — trước 049 là NGÕ CỤT (0 dòng)',
    (await thu(gd, 'APPROVED')) === 1,
    'vẫn 0 dòng ⇒ policy `costings_update` chưa có `giamdoc`, hoặc 049 chưa chạy');
  ok('🔴 md ⛔ KHÔNG duyệt được — trước 049 là LỖ HỔNG SoD (1 dòng)',
    (await thu(md, 'APPROVED')) === 0,
    'vẫn 1 dòng ⇒ policy `costings_only_director_approves` chưa có hiệu lực');
  ok('md VẪN trình được (DRAFT → SUBMITTED) — ⛔ không mất quyền cũ',
    (await thu(md, 'SUBMITTED', 'DRAFT')) === 1);
  ok('giamdoc TỪ CHỐI được (SUBMITTED → REJECTED)',
    (await thu(gd, 'REJECTED')) === 1);

  // ─── ĐIỀU 8 · EVIDENCE FIRST ────────────────────────────────────────────
  //
  // 🔴 SỬA 08/08/2026 — PHÉP KIỂM CŨ Ở ĐÂY ĐO SAI THỨ, VÀ NÓ TỪNG "ĐẠT" VÌ
  //    LÝ DO SAI. Nó thử `giamdoc` đổi `status` của bản `APPROVED` và chờ **0
  //    dòng**. Trước `049`, kết quả đúng là 0 — nhưng **⛔ không phải vì Điều 8
  //    được bảo vệ**, mà vì `giamdoc` ⛔ KHÔNG có quyền ghi `costings` chút nào
  //    (chính là ngõ cụt `049` vừa gỡ). Một phép kiểm xanh nhờ một lỗi khác.
  //
  // 🔑 Điều 8 nói *"bằng chứng phê duyệt phải giữ được"* — tức **NỘI DUNG**
  //    (giá chào) ⛔ không đổi. Nó ⛔ KHÔNG nói *"status ⛔ không đổi"*: phép
  //    chuyển `APPROVED → SUPERSEDED` là đường sống của `reviseCosting`, và
  //    ranh giới `W.1` giao phép chuyển cho Workflow Engine.
  //
  // ⇒ Đo ĐÚNG hai vế: giá KHOÁ, phép chuyển CÒN SỐNG.
  const doiGia = async (sb) => {
    await admin.from('costings').update({ status: 'APPROVED', quoted_price: 10 }).eq('id', id);
    await sb.from('costings').update({ quoted_price: 777 }).eq('id', id).select('id');
    const { data } = await admin.from('costings').select('quoted_price').eq('id', id).maybeSingle();
    return Number(data?.quoted_price);
  };
  ok('🔴 Điều 8 · md ⛔ KHÔNG sửa được GIÁ bản đã duyệt', (await doiGia(md)) === 10);
  ok('🔴 Điều 8 · giamdoc ⛔ KHÔNG sửa được GIÁ bản đã duyệt', (await doiGia(gd)) === 10);
  ok('🔴 Điều 8 · superadmin cũng ⛔ KHÔNG sửa được — trigger 045 ⛔ không nể vai nào',
    (await doiGia(sa)) === 10);
  ok('reviseCosting còn sống (APPROVED → SUPERSEDED)',
    (await thu(md, 'SUPERSEDED', 'APPROVED')) === 1,
    'chết ⇒ ⛔ không lập được phiên bản chiết tính mới');
} finally {
  if (id) await admin.from('costings').delete().eq('id', id);
}

console.log(`\n${'='.repeat(66)}\n${dat} đạt · ${hong.length} hỏng`);
if (hong.length) { console.log('HỎNG:'); hong.forEach((h) => console.log(`  · ${h}`)); }
process.exit(hong.length ? 1 : 0);
