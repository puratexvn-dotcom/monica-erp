// ============================================================================
// CHỤP MÀN HÌNH `/md` BẰNG PHIÊN ĐĂNG NHẬP THẬT
//
// 📐 Board Directive *MD UI VISUAL FIX* 08/08/2026 §7: *"Chạy app · mở `/md` ·
//    **tự chụp screenshot desktop** · **tự chụp screenshot mobile** · so sánh
//    với hình tham chiếu · nếu chưa giống → tự sửa tiếp."*
//
// ─── 🔑 VÌ SAO PHẢI CÓ TỆP NÀY ──────────────────────────────────────────
// `next build` xanh **⛔ không chứng minh giao diện hiện ra đúng**. Cái bẫy đã
// tốn giá ở `UI_UX_STANDARDS §8` mục 5: Tailwind cắt mất lớp màu ghép chuỗi ⇒
// màn hình ra **trắng trơn** mà bộ dựng ⛔ không báo gì. Chỉ có **ảnh chụp
// thật** mới bắt được loại lỗi đó.
//
// ⚠️ ⛔ KHÔNG dùng Puppeteer/Playwright — kho này ⛔ không có, và thêm một phụ
//    thuộc nặng chỉ để chụp ảnh là cái giá ⛔ không đáng. Nói chuyện thẳng với
//    Chrome qua **CDP**, dùng `WebSocket` có sẵn trong Node ≥ 22.
//
// ⚠️ Đăng nhập bằng **`@supabase/ssr` y hệt bài UAT**, rồi bơm đúng cụm cookie
//    ấy vào Chrome. ⛔ KHÔNG gõ mật khẩu vào ô đăng nhập bằng bàn phím ảo:
//    chậm, giòn, và ⛔ không đo thêm được gì.
//
// ─── CHẠY ────────────────────────────────────────────────────────────────
//   1. npm run build && npx next start -p 3100
//   2. node scripts/chup-man-hinh-md.mjs
//   ⇒ ảnh ra thư mục `.anh-man-hinh/`
// ============================================================================
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServerClient } from '@supabase/ssr';

const BASE = process.env.UAT_BASE || 'http://localhost:3100';
const MAT_KHAU = process.env.SEED_PASSWORD || 'Monica12345@';
const EMAIL = process.env.SEED_EMAIL || 'md001@monica.vn';
const RA = process.env.ANH_RA || '.anh-man-hinh';
const CONG = 9333;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

if (!CHROME) { console.log('⚪ BỎ QUA — ⛔ không tìm thấy Chrome/Edge.'); process.exit(0); }
if (!existsSync('.env.local')) { console.log('⚪ BỎ QUA — ⛔ không có .env.local.'); process.exit(0); }

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));

// ─── ① Đăng nhập thật, lấy cụm cookie phiên ────────────────────────────────
const jar = new Map();
{
  const sb = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (l) => l.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { error } = await sb.auth.signInWithPassword({ email: EMAIL, password: MAT_KHAU });
  if (error) { console.log(`⛔ ⛔ không đăng nhập được ${EMAIL}: ${error.message}`); process.exit(1); }
}
console.log(`✅ Đăng nhập ${EMAIL} — ${jar.size} cookie phiên`);

// ─── ② Mở Chrome không giao diện ───────────────────────────────────────────
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${CONG}`,
  `--user-data-dir=${process.env.TEMP || '/tmp'}/md-chup-${Date.now()}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--hide-scrollbars', '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' });

/** Chờ cổng gỡ lỗi mở. ⚠️ Hỏi liên tục thay vì `sleep` một khoảng đoán được:
 *  máy chậm thì đoán thiếu, máy nhanh thì phí thời gian. */
async function choCdp() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${CONG}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* ⛔ chưa mở */ }
    await new Promise((s) => setTimeout(s, 250));
  }
  throw new Error('⛔ Chrome ⛔ không mở cổng gỡ lỗi');
}

const wsUrl = await choCdp();
const ws = new WebSocket(wsUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });

let dem = 0;
const cho = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && cho.has(m.id)) { cho.get(m.id)(m); cho.delete(m.id); }
};
function goi(method, params = {}, sessionId) {
  const id = ++dem;
  return new Promise((ok, no) => {
    cho.set(id, (m) => (m.error ? no(new Error(`${method}: ${m.error.message}`)) : ok(m.result)));
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

// ─── ③ Gắn vào tab, bơm cookie, chụp ───────────────────────────────────────
const { targetInfos } = await goi('Target.getTargets');
const tab = targetInfos.find((t) => t.type === 'page');
const { sessionId } = await goi('Target.attachToTarget', { targetId: tab.targetId, flatten: true });

await goi('Page.enable', {}, sessionId);
await goi('Network.enable', {}, sessionId);
await goi('Network.setCookies', {
  cookies: [...jar.entries()].map(([name, value]) => ({
    name, value, domain: 'localhost', path: '/',
  })),
}, sessionId);

if (!existsSync(RA)) mkdirSync(RA, { recursive: true });

async function chup(ten, rong, cao, { toanTrang = true } = {}) {
  await goi('Emulation.setDeviceMetricsOverride', {
    width: rong, height: cao, deviceScaleFactor: 1,
    mobile: rong < 640,
  }, sessionId);

  await goi('Page.navigate', { url: `${BASE}/md` }, sessionId);
  // ⚠️ Chờ **mạng lặng**, ⛔ không chờ `load`: `/md` nạp dữ liệu sau khi dựng
  // xong khung, nên chụp lúc `load` sẽ ra một trang ⛔ chưa có số nào.
  await new Promise((s) => setTimeout(s, 5000));

  let w = rong, h = cao;
  if (toanTrang) {
    const { cssContentSize } = await goi('Page.getLayoutMetrics', {}, sessionId);
    w = Math.ceil(cssContentSize.width); h = Math.ceil(cssContentSize.height);
    await goi('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile: rong < 640,
    }, sessionId);
    await new Promise((s) => setTimeout(s, 800));
  }

  // 🔑 `clip` — cắt sát đúng khu đang sửa. Ảnh cả trang cao 1.700 px bị thu
  // nhỏ khi xem, và **chi tiết 4 px thì biến mất** — đúng những chi tiết cần
  // đối chiếu với ảnh mẫu *(mép thẻ · vạch chân · vị trí huy hiệu)*.
  const clip = process.env.ANH_VUNG
    ? (([x, y, w, h]) => ({ x, y, width: w, height: h, scale: 2 }))(process.env.ANH_VUNG.split(',').map(Number))
    : undefined;
  const { data } = await goi('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) }, sessionId);
  const duong = `${RA}/${ten}.png`;
  writeFileSync(duong, Buffer.from(data, 'base64'));
  console.log(`📸 ${duong}  (${w}×${h})`);
  return duong;
}

try {
  await chup('md-desktop', 1440, 900);
  await chup('md-mobile', 390, 844);
} finally {
  ws.close();
  chrome.kill();
}
console.log('\n✅ Xong. ⚠️ Ảnh CHỨNG MINH trang hiện ra được, ⛔ KHÔNG chứng minh nó ĐẸP — phần đó phải nhìn.');
