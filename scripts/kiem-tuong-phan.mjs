// ============================================================================
// KIỂM TƯƠNG PHẢN WCAG — ĐO MÀU **ĐÃ DỰNG THẬT**, ⛔ KHÔNG ĐỌC MÃ NGUỒN
//
// 📐 Board Directive *FINAL MD RELEASE CHECK* §3: *"Kiểm contrast của toàn bộ
//    màu mới — Business Launcher · Action Center · text · icon · badge ·
//    button · trạng thái disabled. **Ưu tiên WCAG AA**."*
//
// ─── 🔑 VÌ SAO PHẢI ĐO TRONG TRÌNH DUYỆT ────────────────────────────────
// Nền của thẻ Launcher là `bg-blue-50/70` — **70% độ đục**. Màu thật mắt nhìn
// thấy là kết quả **chồng alpha lên nền trang**, ⛔ không phải giá trị trong
// bảng màu Tailwind. Tra bảng rồi tính là tính **một màu ⛔ không tồn tại trên
// màn hình**, và con số ra sẽ **lạc quan hơn sự thật**.
//
// ⚠️ Ngưỡng WCAG 2.1 AA:
//     chữ thường (< 18.66px hoặc ⛔ không đậm) ....... **4.5**
//     chữ lớn (≥ 24px, hoặc ≥ 18.66px và đậm) ....... **3.0**
//     thành phần giao diện / viền / biểu tượng ....... **3.0**
//
// ⚠️ **Chữ bị làm mờ CÓ CHỦ Ý** *(ô Launcher đang khoá)* được ghi riêng: WCAG
// miễn trừ thành phần `disabled`. Nhưng ⛔ không im lặng bỏ qua — in ra để
// người đọc tự phán, vì *"đã khoá"* ⛔ không có nghĩa *"⛔ không cần đọc"*.
//
// ─── CHẠY ────────────────────────────────────────────────────────────────
//   npm run build && npx next start -p 3100
//   node scripts/kiem-tuong-phan.mjs
// ============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServerClient } from '@supabase/ssr';

const BASE = process.env.UAT_BASE || 'http://localhost:3100';
const MAT_KHAU = process.env.SEED_PASSWORD || 'Monica12345@';
const EMAIL = process.env.SEED_EMAIL || 'md001@monica.vn';
const CONG = 9334;
const TRANG = (process.env.TP_URL || '/md,/').split(',');

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

const jar = new Map();
{
  const sb = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (l) => l.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { error } = await sb.auth.signInWithPassword({ email: EMAIL, password: MAT_KHAU });
  if (error) { console.log(`⛔ ${EMAIL}: ${error.message}`); process.exit(1); }
}

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${CONG}`,
  `--user-data-dir=${process.env.TEMP || '/tmp'}/tp-${Date.now()}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' });

async function choCdp() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${CONG}/json/version`); if (r.ok) return (await r.json()).webSocketDebuggerUrl; }
    catch { /* ⛔ chưa mở */ }
    await new Promise((s) => setTimeout(s, 250));
  }
  throw new Error('⛔ Chrome ⛔ không mở cổng gỡ lỗi');
}
const ws = new WebSocket(await choCdp());
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let dem = 0; const cho = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && cho.has(m.id)) { cho.get(m.id)(m); cho.delete(m.id); } };
function goi(method, params = {}, sessionId) {
  const id = ++dem;
  return new Promise((ok, no) => {
    cho.set(id, (m) => (m.error ? no(new Error(`${method}: ${m.error.message}`)) : ok(m.result)));
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
const { targetInfos } = await goi('Target.getTargets');
const tab = targetInfos.find((t) => t.type === 'page');
const { sessionId } = await goi('Target.attachToTarget', { targetId: tab.targetId, flatten: true });
await goi('Page.enable', {}, sessionId);
await goi('Network.enable', {}, sessionId);
await goi('Runtime.enable', {}, sessionId);
await goi('Network.setCookies', {
  cookies: [...jar.entries()].map(([name, value]) => ({ name, value, domain: 'localhost', path: '/' })),
}, sessionId);

// ─── PHÉP ĐO, chạy TRONG trang ─────────────────────────────────────────────
const DO = `(() => {
  const rgb = (s) => {
    const m = String(s).match(/[\\d.]+/g);
    if (!m) return null;
    return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 };
  };
  const tron = (tren, duoi) => ({
    r: tren.r * tren.a + duoi.r * (1 - tren.a),
    g: tren.g * tren.a + duoi.g * (1 - tren.a),
    b: tren.b * tren.a + duoi.b * (1 - tren.a),
    a: 1,
  });
  /** Nền THẬT: chồng alpha của mọi tổ tiên, từ ngoài vào trong. */
  const nenThat = (el) => {
    const day = [];
    for (let e = el; e; e = e.parentElement) {
      const c = rgb(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) day.push(c);
      if (c && c.a === 1) break;
    }
    let ra = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = day.length - 1; i >= 0; i--) ra = tron(day[i], ra);
    return ra;
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const tyLe = (a, b) => { const L1 = lum(a), L2 = lum(b); const hi = Math.max(L1, L2), lo = Math.min(L1, L2); return (hi + 0.05) / (lo + 0.05); };

  const ra = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    // Chỉ xét phần tử có chữ RIÊNG của nó, hoặc là biểu tượng SVG.
    const laSvg = el.tagName === 'svg';
    const chuRieng = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!laSvg && !chuRieng) return;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) return;

    const mau = rgb(laSvg ? (st.color) : st.color);
    if (!mau) return;
    let truoc = mau;
    // 'opacity' của chính phần tử làm nhạt màu chữ đi — phải tính vào.
    const op = +st.opacity;
    // 🔴 **BẮT ĐẦU TỪ CHÍNH PHẦN TỬ**, ⛔ không từ cha.
    // Bản trước đo từ 'el.parentElement' ⇒ một nút 'text-white bg-rose-600'
    // bị đem so với nền TRẮNG của khối chứa nó ⇒ ra tỷ lệ '1' và bị báo hỏng,
    // trong khi thực tế nó là chữ trắng trên đỏ đặc — đạt thừa.
    // ⚠️ Đây là lỗi của PHÉP ĐO, ⛔ không phải của giao diện. Một phép đo báo
    // động giả hàng loạt sẽ bị người ta tắt đi, và lúc đó nó ⛔ không còn bảo
    // vệ được gì.
    const nen = nenThat(el);
    if (op < 1) truoc = tron({ ...truoc, a: truoc.a * op }, nen);
    else if (truoc.a < 1) truoc = tron(truoc, nen);

    const co = parseFloat(st.fontSize);
    const dam = +st.fontWeight >= 700;
    const chuLon = co >= 24 || (co >= 18.66 && dam);
    const nguong = laSvg ? 3 : (chuLon ? 3 : 4.5);
    const t = tyLe(truoc, nen);

    ra.push({
      the: el.tagName,
      lop: String(el.className.baseVal ?? el.className ?? '').split(' ').slice(0, 3).join('.').slice(0, 52),
      chu: (el.textContent || '').trim().slice(0, 28),
      co, dam, nguong: nguong,
      ty: Math.round(t * 100) / 100,
      mo: op < 1 || (el.closest('[aria-disabled="true"]') !== null),
      dat: t >= nguong,
    });
  });
  return JSON.stringify(ra);
})()`;

let tongHong = 0; let tongMo = 0; let tongDo = 0;
try {
  for (const tr of TRANG) {
    await goi('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    await goi('Page.navigate', { url: BASE + tr }, sessionId);
    await new Promise((s) => setTimeout(s, 5000));
    const r = await goi('Runtime.evaluate', { expression: DO, returnByValue: true, awaitPromise: true }, sessionId);
    const ds = JSON.parse(r.result.value);
    const hong = ds.filter((x) => !x.dat && !x.mo);
    const mo = ds.filter((x) => !x.dat && x.mo);
    tongDo += ds.length; tongHong += hong.length; tongMo += mo.length;

    console.log(`\n══ ${tr} — đo ${ds.length} phần tử có chữ/biểu tượng ══`);
    if (hong.length === 0) console.log('  ✅ ⛔ KHÔNG phần tử nào dưới ngưỡng WCAG AA');
    // Gom theo lớp CSS: 40 dòng cùng một lỗi là MỘT lỗi, ⛔ không phải 40.
    const gom = new Map();
    for (const h of hong) {
      const k = `${h.lop}|${h.ty}|${h.nguong}`;
      if (!gom.has(k)) gom.set(k, { ...h, dem: 0 });
      gom.get(k).dem++;
    }
    [...gom.values()].sort((a, b) => a.ty - b.ty).slice(0, 15).forEach((h) => {
      console.log(`  ⛔ ${h.ty} < ${h.nguong}  ${h.the} ${h.co}px${h.dam ? ' đậm' : ''} ×${h.dem}`);
      console.log(`      lớp: ${h.lop}`);
      console.log(`      chữ: "${h.chu}"`);
    });
    if (mo.length) console.log(`  ⚪ ${mo.length} phần tử dưới ngưỡng nhưng ĐANG BỊ LÀM MỜ CÓ CHỦ Ý (disabled) — WCAG miễn trừ`);
  }
} finally {
  ws.close(); chrome.kill();
}

console.log(`\n════════════════════════════════════════════════════════════`);
console.log(`TƯƠNG PHẢN: đo ${tongDo} · hỏng ${tongHong} · miễn trừ (disabled) ${tongMo}`);
console.log(`⚠️ Phép đo này ⛔ KHÔNG xét chữ đè trên ẢNH hay dải chuyển sắc — nó đọc`);
console.log(`   màu nền ĐẶC sau khi chồng alpha. Chữ trên gradient phải soi bằng mắt.`);
console.log(`════════════════════════════════════════════════════════════`);
process.exit(tongHong ? 1 : 0);
