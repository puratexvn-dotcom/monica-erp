// ============================================================================
// MONICA MOS — KHÁM TỔNG QUÁT LỖI 401 (chạy: node scripts/diag.mjs)
// Đọc file lib/supabase.ts THẬT trên máy → so từng ký tự với bản chuẩn
// → tự gọi Supabase bằng cả 2 bộ giá trị → in kết luận + cách sửa.
// ============================================================================
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const EXPECTED_URL = 'https://xbqnbnziwsjqxrrmxvic.supabase.co';
const EXPECTED_KEY = 'sb_publishable_jFhxcGYaLy_5LAN0PFeWhA_IMOBOUgX';

console.log('Thư mục đang chạy :', process.cwd());

// ── 1. Đọc file thật ────────────────────────────────────────────────────────
let src = '';
try {
  src = readFileSync(resolve('lib/supabase.ts'), 'utf8');
  console.log('✓ Đã đọc lib/supabase.ts');
} catch {
  console.log('❌ KHÔNG TÌM THẤY lib/supabase.ts — bạn đang đứng sai thư mục.');
  console.log('   Chạy:  cd D:\\monicagarmenterp\\monica-erp  rồi chạy lại lệnh này.');
  process.exit(1);
}

// ── 2. Trích URL & KEY thật trong file (bỏ qua dòng comment mẫu XXXX) ──────
const urls = [...new Set(src.match(/https:\/\/[^\s'"()]+\.supabase\.co/g) ?? [])];
const keys = [...new Set((src.match(/sb_publishable_[A-Za-z0-9_]{10,}/g) ?? []).filter((k) => !k.includes('XXX')))];
const fileUrl = urls[urls.length - 1] ?? '(không tìm thấy)';
const fileKey = keys[keys.length - 1] ?? '(không tìm thấy)';
console.log('\nURL trong file  :', fileUrl);
console.log('KEY trong file  :', fileKey, `(dài ${fileKey.length})`);

// ── 3. So từng ký tự với bản chuẩn ─────────────────────────────────────────
function soSanh(ten, got, expected) {
  if (got === expected) {
    console.log(`✓ ${ten}: KHỚP 100% với bản chuẩn`);
    return true;
  }
  const n = Math.max(got.length, expected.length);
  for (let i = 0; i < n; i++) {
    if (got[i] !== expected[i]) {
      console.log(`❌ ${ten}: SAI tại vị trí ${i + 1}:`);
      console.log(`   Trong file : "${got.slice(Math.max(0, i - 5), i + 6)}"  (ký tự sai: "${got[i] ?? '(thiếu)'}" mã ${got.codePointAt(i) ?? '—'})`);
      console.log(`   Bản chuẩn  : "${expected.slice(Math.max(0, i - 5), i + 6)}"  (đúng phải là: "${expected[i] ?? '(bỏ ký tự thừa)'}" mã ${expected.codePointAt(i) ?? '—'})`);
      return false;
    }
  }
  return false;
}
console.log('');
const urlOk = soSanh('URL', fileUrl, EXPECTED_URL);
const keyOk = soSanh('KEY', fileKey, EXPECTED_KEY);

// ── 4. Gọi thử Supabase bằng cả 2 bộ giá trị ───────────────────────────────
async function goiThu(ten, url, key) {
  try {
    const r = await fetch(`${url}/rest/v1/settings?select=*&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    console.log(`${ten}: HTTP ${r.status} ${r.status === 200 ? '✅' : '❌'}`);
    return r.status;
  } catch (e) {
    console.log(`${ten}: ❌ không gọi được (${e.message})`);
    return 0;
  }
}
console.log('\n— Gọi thử Supabase —');
const a = await goiThu('Bằng giá trị TRONG FILE ', fileUrl, fileKey);
const b = await goiThu('Bằng giá trị BẢN CHUẨN  ', EXPECTED_URL, EXPECTED_KEY);

// ── 5. KẾT LUẬN ─────────────────────────────────────────────────────────────
console.log('\n================ KẾT LUẬN ================');
if (a === 200) {
  console.log('✅ File code của bạn HOÀN TOÀN ĐÚNG và Supabase chấp nhận nó.');
  console.log('→ Vậy app bị 401 nghĩa là server dev đang chạy ở THƯ MỤC KHÁC hoặc code cũ:');
  console.log('  1. So sánh "Thư mục đang chạy" in ở dòng đầu với thư mục bạn gõ npm run dev.');
  console.log('  2. Tắt TẤT CẢ cửa sổ terminal đang mở (có thể có 2 server chạy song song).');
  console.log('  3. Xóa thư mục .next → npm run dev → Ctrl+Shift+R trình duyệt.');
} else if (a !== 200 && b === 200) {
  console.log('❌ Giá trị trong FILE bị sai (xem vị trí ký tự sai in phía trên).');
  console.log('→ Mở lib/supabase.ts, sửa đúng ký tự đó (hoặc chép đè file chuẩn), lưu, restart.');
} else {
  console.log('❌ CẢ BẢN CHUẨN CŨNG BỊ TỪ CHỐI → key này đã bị ĐỔI/THU HỒI trên Supabase');
  console.log('   (hoặc project bị tạm dừng). Cách xử lý:');
  console.log('  1. Vào Dashboard → Project Settings → API Keys → bấm COPY Publishable key MỚI NHẤT.');
  console.log('  2. Mở lib/supabase.ts → thay chuỗi sb_publishable_... ở dòng ~21 bằng key vừa copy.');
  console.log('  3. Lưu (Ctrl+S) → tắt server (Ctrl+C) → npm run dev → Ctrl+Shift+R.');
}
console.log('==========================================');
