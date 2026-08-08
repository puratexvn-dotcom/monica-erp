// ============================================================================
// KIỂM BẢO MẬT KHO BẰNG CHỨNG — ĐO BẰNG HÀNH VI, ⛔ KHÔNG ĐỌC POLICY
//
// 📐 Board Directive *EVIDENCE SECURITY IMPLEMENTATION* §7
// 📐 ADR-031 · migration `057` · `lib/mos/evidence/mime.ts`
//
// ⚠️ Bài này **ghi thật vào kho lưu trữ** rồi dọn. Tệp mang tiền tố `_kiem_`.
//    ⛔ KHÔNG chạm một tệp nghiệp vụ nào.
//
// 🔑 Vì sao có mục ⑤ *"allowlist hai tầng có khớp ⛔"*: `lib/mos/evidence/mime.ts`
//    là **bản gốc**, `storage.buckets.allowed_mime_types` là **bản chép**. SQL
//    ⛔ không đọc được TypeScript, nên *"một nguồn sự thật"* chỉ thành sự thật
//    nhờ **một phép đo phát hiện lúc hai bên trôi ra xa nhau**. Đúng khuyết tật
//    đã làm PDF hỏng suốt hai ngày.
//
// ─── CHẠY ────────────────────────────────────────────────────────────────
//   npm run build && npx next start -p 3100
//   node scripts/kiem-bang-chung.mjs
// ============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import { MIME_BANG_CHUNG } from '../lib/mos/evidence/mime.ts';

const BASE = process.env.UAT_BASE || 'http://localhost:3100';
const MAT_KHAU = process.env.SEED_PASSWORD || 'Monica12345@';

if (!existsSync('.env.local')) { console.log('⚪ BỎ QUA — ⛔ không có .env.local.'); process.exit(0); }
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
if (!env.SUPABASE_SERVICE_ROLE_KEY) { console.log('⚪ BỎ QUA — thiếu SERVICE_ROLE_KEY.'); process.exit(0); }

let dat = 0; const hong = [];
const ok = (t, dk, g = '') => {
  if (dk) { dat++; console.log(`  ĐẠT   ${t}`); return true; }
  hong.push(t); console.log(`  HỎNG  ${t}${g ? `\n          ${g}` : ''}`); return false;
};

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
  return { sb, user: data.user, ck: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ') };
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

const TEP = (ten, mime) => {
  // Byte đầu thật của từng định dạng — Supabase kiểm `Content-Type`, nhưng gửi
  // đúng byte đầu để phép thử ⛔ không phụ thuộc vào một chi tiết cài đặt.
  const dau = {
    'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    'image/jpeg': [0xff, 0xd8, 0xff, 0xe0],
    'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34],
    'text/plain': [0x68, 0x69],
  }[mime] ?? [0x00];
  return new Blob([new Uint8Array(dau)], { type: mime });
};

const md = await dangNhap('md001@monica.vn');
const qa = await dangNhap('qa001@monica.vn');
const rac = [];

console.log('KIỂM BẢO MẬT KHO BẰNG CHỨNG — md001 · qa001 · service_role\n');

try {
// ═══ ① TẢI LÊN — ba định dạng Board liệt kê ════════════════════════════════
console.log('① TẢI LÊN');
const duong = {};
for (const [ten, mime, ext] of [['PNG', 'image/png', 'png'], ['JPG', 'image/jpeg', 'jpg'], ['PDF', 'application/pdf', 'pdf']]) {
  const p = `po/_kiem_${Date.now()}_${ten}.${ext}`;
  const { error } = await md.sb.storage.from('evidences').upload(p, TEP(ten, mime), { contentType: mime });
  ok(`1.${ten} tải lên ${ten}`, !error, error?.message);
  if (!error) { duong[ten] = p; rac.push(p); }
}

// ⚠️ Cặp `K-3` cho allowlist: có phép CHO thì phải có phép CẤM.
{
  const p = `po/_kiem_${Date.now()}_XAU.txt`;
  const { error } = await md.sb.storage.from('evidences').upload(p, TEP('TXT', 'text/plain'), { contentType: 'text/plain' });
  ok('🔴 1.4 Định dạng ngoài allowlist BỊ TỪ CHỐI', !!error, error?.message?.slice(0, 80));
  if (!error) rac.push(p);
}

// ═══ ② KHO PHẢI RIÊNG TƯ ═══════════════════════════════════════════════════
console.log('\n② KHO RIÊNG TƯ');
{
  const { data: bk } = await admin.storage.listBuckets();
  const b = (bk || []).find((x) => x.id === 'evidences');
  ok('2.1 bucket `evidences` đặt riêng tư', b && b.public === false, `public=${b?.public}`);

  // 🔴 PHÉP THỬ QUAN TRỌNG NHẤT: gọi URL công khai bằng `fetch` TRẦN —
  //    ⛔ không cookie, ⛔ không apikey, ⛔ không đăng nhập.
  if (duong.PNG) {
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/evidences/${duong.PNG}`;
    const r = await fetch(url);
    ok('🔴 2.2 KHÁCH VÃNG LAI ⛔ KHÔNG đọc được URL công khai', !r.ok, `HTTP ${r.status}`);
  }
}

// ═══ ③ SIGNED URL — qua Server Action, có kiểm quyền nghiệp vụ ═════════════
console.log('\n③ SIGNED URL + PHÂN QUYỀN');
{
  // Dựng một tài liệu thật gắn vào một PO thật để đo đúng đường nghiệp vụ.
  const { data: po } = await admin.from('orders').select('id').limit(1).maybeSingle();
  if (po && duong.PDF) {
    const { data: doc } = await admin.from('md_documents').insert({
      entity_type: 'ORDER', entity_id: po.id, doc_type: 'OTHER',
      title: '_kiem_bang_chung', storage_path: duong.PDF, version: 1,
    }).select('id').single();

    const goi = async (phien, et, eid, path) => {
      const ACT = new Map();
      const quet = (d, a = []) => {
        for (const e of readdirSync(d, { withFileTypes: true })) {
          const p2 = `${d}/${e.name}`;
          if (e.isDirectory()) quet(p2, a); else if (e.name.endsWith('.js')) a.push(p2);
        }
        return a;
      };
      const re = /"?([0-9a-f]{40})"?:\(\)=>Promise[\s\S]{0,140}?\w+=>\w+\.(\w+)\)/g;
      for (const f of quet('.next/server/app')) {
        for (const m of readFileSync(f, 'utf8').matchAll(re)) if (!ACT.has(m[2])) ACT.set(m[2], m[1]);
      }
      const id = ACT.get('layUrlBangChung');
      if (!id) return { ok: false, message: '⛔ không tìm được action id' };
      // ⚠️ Gọi ở `/` chứ ⛔ không phải `/md`: `qa001` bị middleware chặn khỏi
      // `/md`, nên gọi ở đó sẽ ra "⛔ không đọc được kết quả" — một phép đo
      // hỏng vì **lý do sai**, che mất điều thật sự cần đo.
      const r = await fetch(`${BASE}/`, {
        method: 'POST',
        headers: { cookie: phien.ck, 'Next-Action': id, 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify([et, eid, path]), redirect: 'manual',
      });
      const t = await r.text();
      for (const dong of t.split('\n')) {
        const i = dong.indexOf(':'); if (i < 0) continue;
        const than = dong.slice(i + 1).trim();
        if (!than.startsWith('{')) continue;
        try { const o = JSON.parse(than); if ('ok' in o) return o; } catch { /* ⛔ không phải kết quả */ }
      }
      return { ok: false, message: '⛔ không đọc được kết quả' };
    };

    const r1 = await goi(md, 'ORDER', po.id, duong.PDF);
    ok('3.1 md001 xin được Signed URL cho đơn hàng', r1.ok === true, JSON.stringify(r1).slice(0, 140));
    ok('3.2 URL có HẠN 300 giây', r1.hanGiay === 300, `${r1.hanGiay}`);

    if (r1.ok && r1.url) {
      const r = await fetch(r1.url);
      ok('3.3 Signed URL mở được tệp', r.ok, `HTTP ${r.status}`);
    }

    // 🔴 CHỐNG IDOR: đúng người, đúng đơn, **SAI TỆP**.
    // 🔴 **HAI PHÉP DƯỚI CHỈ CÓ NGHĨA KHI `3.1` ĐÃ ĐẠT.**
    // ⚠️ Bài kiểm bản trước báo chúng "ĐẠT" trong khi Server Action **⛔ không
    // tồn tại trong gói dựng** — mọi lời gọi trả `ok:false`, và một phép thử
    // khẳng định `ok === false` thì **xanh vì lý do sai**. Đó đúng là loại
    // "đạt giả" mà `K-3` sinh ra để chặn.
    // 🔑 Ràng buộc `r1.ok === true` biến chúng thành phép đo thật: chỉ khi
    //    đường hợp lệ CHẠY ĐƯỢC thì việc chặn đường sai mới nói lên điều gì.
    const r2 = await goi(md, 'ORDER', po.id, 'po/khong-ton-tai/gia-mao.pdf');
    ok('🔴 3.4 Tệp ⛔ KHÔNG thuộc bản ghi ⇒ TỪ CHỐI (chống IDOR)',
      r1.ok === true && r2.ok === false, JSON.stringify(r2).slice(0, 140));

    // 🔴 Vai ⛔ không có quyền đọc đơn hàng.
    const r3 = await goi(qa, 'ORDER', po.id, duong.PDF);
    ok('🔴 3.5 qa001 ⛔ KHÔNG xin được URL cho đơn hàng',
      r1.ok === true && r3.ok === false, JSON.stringify(r3).slice(0, 140));

    if (doc) await admin.from('md_documents').update({ deleted_at: new Date().toISOString() }).eq('id', doc.id);
  } else {
    ok('3.x ⚪ BỎ QUA — ⛔ không có PO hoặc PDF để đo', false, 'thiếu tiền đề');
  }
}

// ═══ ④ XOÁ PHẢI BỊ CHẶN ════════════════════════════════════════════════════
console.log('\n④ XOÁ BỊ CHẶN');
if (duong.PNG) {
  const { data } = await md.sb.storage.from('evidences').remove([duong.PNG]);
  // ⚠️ **LỖI CỦA BÀI KIỂM, ĐÃ SỬA.** Bản trước xác minh bằng
  // `md.sb.storage.list()` — nhưng sau `057` kho **riêng tư và ⛔ không có
  // policy `SELECT`**, nên người dùng **⛔ không liệt kê được** dù tệp còn
  // nguyên. Bài kiểm vì thế đọc ra `0 tệp` và kết luận *"đã bị xoá"* — một
  // phép đo **báo động giả**.
  // 🔑 Xác minh bằng **khoá quản trị**: nó nhìn thấy sự thật của kho, ⛔ không
  //    bị chính hàng rào đang kiểm che mắt.
  const { data: con } = await admin.storage.from('evidences')
    .list('po', { search: duong.PNG.split('/').pop() });
  ok('🔴 4.1 md001 ⛔ KHÔNG xoá được bằng chứng',
    (con || []).length > 0,
    `xoá trả về ${JSON.stringify(data)} · kho còn ${(con || []).length} tệp`);
}

// ═══ ⑤ HAI TẦNG ALLOWLIST PHẢI KHỚP ════════════════════════════════════════
console.log('\n⑤ MỘT NGUỒN SỰ THẬT');
{
  const { data: bk } = await admin.storage.listBuckets();
  const b = (bk || []).find((x) => x.id === 'evidences');
  const kho = [...(b?.allowed_mime_types || [])].sort();
  const lib = [...MIME_BANG_CHUNG].sort();
  ok('🔴 5.1 allowlist của KHO khớp `lib/mos/evidence/mime.ts`',
    JSON.stringify(kho) === JSON.stringify(lib),
    `kho=${kho.join(',')}\n          lib=${lib.join(',')}`);
}

} finally {
  // ─── DỌN ────────────────────────────────────────────────────────────────
  // ⚠️ Dùng `service_role`: chính bài kiểm vừa chứng minh người dùng ⛔ không
  //    xoá được. Đây là đường hợp lệ duy nhất còn lại, và nó chỉ chạy tay.
  if (rac.length) await admin.storage.from('evidences').remove(rac);
}

console.log(`\n════════════════════════════════════════════════════════════`);
console.log(`BẢO MẬT KHO BẰNG CHỨNG: ${dat} đạt · ${hong.length} hỏng`);
if (hong.length) { console.log('\nHỏng:'); hong.forEach((h) => console.log(`  ⛔ ${h}`)); }
console.log(`════════════════════════════════════════════════════════════`);
process.exit(hong.length ? 1 : 0);
