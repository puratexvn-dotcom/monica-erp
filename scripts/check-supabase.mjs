// ============================================================================
// MONICA ERP — Chẩn đoán kết nối Supabase (chạy: node scripts/check-supabase.mjs)
// Tự đọc .env.local, gọi thử REST API và báo ĐÚNG BỆNH + cách chữa.
// ============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Đọc .env.local (nếu có) ─────────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local');
const env = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  console.log('✓ Đã đọc .env.local');
} else {
  console.log('ℹ Không thấy .env.local — dùng giá trị fallback trong lib/supabase.ts');
}

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://xbqnbnziwsjqxrrmxvic.supabase.co';
const KEY = env.NEXT_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_jFhxcGYaLy_5LANOPFeWhA_IMOBOUgX';

console.log('→ URL :', URL_);
console.log('→ KEY :', KEY.slice(0, 22) + '…' + KEY.slice(-6), `(dài ${KEY.length} ký tự)`);

// Cảnh báo ký tự dễ nhầm
const suspicious = [...KEY].filter((c) => c === 'O' || c === '0').length;
if (suspicious > 0) {
  console.log(`ℹ Key chứa ${suspicious} ký tự O/0 — nếu lỗi 401, hãy COPY lại key thay vì gõ tay.`);
}

// ── Gọi thử REST ────────────────────────────────────────────────────────────
const endpoint = `${URL_}/rest/v1/settings?select=*&limit=3`;
try {
  const res = await fetch(endpoint, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const body = await res.text();

  console.log('\n===== KẾT QUẢ =====');
  console.log('HTTP', res.status, res.statusText);

  if (res.status === 200) {
    const rows = JSON.parse(body);
    console.log(`✅ KẾT NỐI OK — bảng settings trả về ${rows.length} dòng.`);
    if (rows.length === 0) {
      console.log('ℹ Bảng đang TRỐNG → app sẽ hiển thị mock data. Chạy supabase/schema.sql và supabase/seed.sql để có dữ liệu thật.');
    }
  } else if (res.status === 401) {
    console.log('❌ 401 UNAUTHORIZED — API KEY SAI.');
    console.log('   Chi tiết:', body);
    console.log('\n👉 CÁCH CHỮA DỨT ĐIỂM:');
    console.log('   1. Mở Supabase Dashboard → Project Settings → API Keys');
    console.log('   2. Bấm nút COPY cạnh "Publishable key" (sb_publishable_…) — KHÔNG gõ tay');
    console.log('      (hoặc dùng key "anon public" dạng eyJhbGciOi… cũng được)');
    console.log('   3. Dán vào .env.local:  NEXT_PUBLIC_SUPABASE_KEY=<key vừa copy>');
    console.log('   4. Tắt hẳn rồi chạy lại `npm run dev` (bắt buộc restart mới nhận env)');
    console.log('   5. Chạy lại: node scripts/check-supabase.mjs → phải ra HTTP 200');
  } else if (res.status === 404) {
    console.log('❌ 404 — URL sai project hoặc Data API đang tắt.');
    console.log('   Kiểm tra: Project Settings → API → "Project URL" phải trùng NEXT_PUBLIC_SUPABASE_URL,');
    console.log('   và Project Settings → API → Data API đang bật (exposed schema: public).');
  } else if (res.status === 403) {
    console.log('❌ 403 — Key đúng nhưng bị chặn bởi RLS/policy. Với demo: tắt RLS hoặc thêm policy SELECT cho anon.');
  } else {
    console.log('❌ Lỗi khác:', body.slice(0, 400));
  }
} catch (e) {
  console.log('\n❌ KHÔNG GỌI ĐƯỢC MẠNG:', e.message);
  console.log('   Kiểm tra internet/proxy/firewall — hoặc URL project gõ sai.');
}
