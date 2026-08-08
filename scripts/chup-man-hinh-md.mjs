// ============================================================================
// CHỤP MÀN HÌNH BẰNG PHIÊN ĐĂNG NHẬP THẬT — CÔNG CỤ NGHIỆM THU THỊ GIÁC
//
// 📐 Board Directive *MD UI VISUAL FIX* §7 + *MD FINAL VISUAL UAT* + *GLOBAL
//    SEARCH* §17: *"Tự chụp screenshot… **Desktop · Tablet · Mobile**… Search
//    đang mở… Language dropdown đang mở… **⛔ Không chỉ đọc code rồi kết luận.**"*
//
// ─── 🔑 VÌ SAO PHẢI CÓ TỆP NÀY ──────────────────────────────────────────
// `next build` xanh **⛔ không chứng minh giao diện hiện ra**. Cái bẫy đã tốn
// giá ở `UI_UX_STANDARDS §8` mục 5: Tailwind cắt mất lớp màu ghép chuỗi ⇒ màn
// hình ra **trắng trơn** mà bộ dựng ⛔ không báo gì.
//
// ⚠️ ⛔ KHÔNG dùng Puppeteer/Playwright — kho này ⛔ không có, và thêm một phụ
//    thuộc nặng chỉ để chụp ảnh là cái giá ⛔ không đáng. Nói chuyện thẳng với
//    Chrome qua **CDP**, dùng `WebSocket` có sẵn trong Node ≥ 22.
//
// ⚠️ Đăng nhập bằng **`@supabase/ssr` y hệt bài UAT**, rồi bơm đúng cụm cookie
//    ấy vào Chrome — ⛔ KHÔNG gõ mật khẩu bằng bàn phím ảo.
//
// ─── CHẠY ────────────────────────────────────────────────────────────────
//   npm run build && npx next start -p 3100
//   node scripts/chup-man-hinh-md.mjs                    # bộ mặc định
//   ANH_URL=/md ANH_KHO=390x844 node scripts/…           # một khổ, một trang
//   ANH_BAM='[aria-label="Mở tìm kiếm toàn hệ thống"]' … # bấm rồi mới chụp
//   ANH_VUNG=x,y,w,h …                                   # cắt sát một khu
// ============================================================================
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServerClient } from '@supabase/ssr';

const BASE = process.env.UAT_BASE || 'http://localhost:3100';
const MAT_KHAU = process.env.SEED_PASSWORD || 'Monica12345@';
const EMAIL = process.env.SEED_EMAIL || 'md001@monica.vn';
const RA = process.env.ANH_RA || '.anh-man-hinh';
// ⚠️ Nhận **cả đường dẫn lẫn URL đầy đủ**. Git Bash trên Windows biến chuỗi
// `/` trần thành `C:/Program Files/Git/` *(MSYS path conversion)*, nên truyền
// URL đầy đủ là cách duy nhất chắc chắn — lỗi này đã mắc một lần.
const URL_THO = process.env.ANH_URL || '/md';
const URL_TRANG = /^https?:\/\//.test(URL_THO)
  ? URL_THO.replace(BASE, '') || '/'
  : (URL_THO.startsWith('/') ? URL_THO : `/${URL_THO}`);
const CONG = 9333;

/** Ba khổ Board chỉ định. ⚠️ `768` là **máy tính bảng dọc** — mốc `md` của
 *  Tailwind, tức đúng ranh giới nơi bố cục đổi nhánh và cũng là nơi lỗi tràn
 *  ngang hay xuất hiện nhất. */
const KHO_MAC_DINH = '1440x900,768x1024,390x844';
const KHO = (process.env.ANH_KHO || KHO_MAC_DINH).split(',').map((k) => {
  const [w, h] = k.trim().split('x').map(Number);
  return { w, h, ten: w >= 1280 ? 'desktop' : w >= 640 ? 'tablet' : 'mobile' };
});

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
console.log(`✅ Đăng nhập ${EMAIL} · trang ${URL_TRANG} · ${KHO.length} khổ`);

// ─── ② Mở Chrome không giao diện ───────────────────────────────────────────
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${CONG}`,
  `--user-data-dir=${process.env.TEMP || '/tmp'}/md-chup-${Date.now()}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--hide-scrollbars', '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' });

/** Chờ cổng gỡ lỗi mở. ⚠️ Hỏi liên tục thay vì `sleep` một khoảng đoán được. */
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

// ─── ③ Gắn vào tab, bơm cookie ─────────────────────────────────────────────
const { targetInfos } = await goi('Target.getTargets');
const tab = targetInfos.find((t) => t.type === 'page');
const { sessionId } = await goi('Target.attachToTarget', { targetId: tab.targetId, flatten: true });

await goi('Page.enable', {}, sessionId);
await goi('Network.enable', {}, sessionId);
await goi('Runtime.enable', {}, sessionId);
await goi('Network.setCookies', {
  cookies: [...jar.entries()].map(([name, value]) => ({
    name, value, domain: 'localhost', path: '/',
  })),
}, sessionId);

if (!existsSync(RA)) mkdirSync(RA, { recursive: true });

async function chay(bieuThuc) {
  const r = await goi('Runtime.evaluate', {
    expression: bieuThuc, returnByValue: true, awaitPromise: true,
  }, sessionId);
  return r.result?.value;
}

/** 🔴 **PHÉP ĐO TRÀN NGANG** — Board: *"Có tràn ngang không?"*
 *
 *  🔑 Đo bằng **DOM**, ⛔ không bằng mắt: một khối rộng hơn khung 3 px sinh
 *  thanh cuộn ngang mà ảnh chụp toàn trang **⛔ không hề cho thấy** — vì chụp
 *  toàn trang đã nới khung ra vừa nội dung. Nhìn ảnh mà kết luận *"⛔ không
 *  tràn"* là kết luận sai theo đúng cách khó phát hiện nhất. */
const DO_TRAN = `(() => {
  const w = document.documentElement.clientWidth;
  const thu = [];
  document.querySelectorAll('body *').forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.right > w + 1 || r.left < -1) {
      thu.push((e.tagName + '.' + String(e.className || '').split(' ').slice(0,2).join('.')).slice(0, 70)
        + ' [' + Math.round(r.left) + '→' + Math.round(r.right) + ']');
    }
  });
  return JSON.stringify({
    khung: w,
    cuonNgang: document.documentElement.scrollWidth > w + 1,
    scrollWidth: document.documentElement.scrollWidth,
    thuPham: thu.slice(0, 8),
  });
})()`;

// ⚠️ `ANH_KHUNG=1` ⇒ chụp ĐÚNG khung nhìn, ⛔ không nới ra vừa nội dung.
// **Bắt buộc với hộp thoại**: `Modal` dùng `position: fixed`, nên khi nới khung
// lên 3.500 px để chụp cả trang thì hộp thoại canh giữa **cái khung 3.500 px
// ấy** — tức trôi xuống tận đáy ảnh. Đó là hiện vật của phép chụp, ⛔ KHÔNG
// phải lỗi bố cục, và phân biệt được hai thứ đó là cả vấn đề.
async function chup(ten, rong, cao, { toanTrang = !process.env.ANH_KHUNG } = {}) {
  await goi('Emulation.setDeviceMetricsOverride', {
    width: rong, height: cao, deviceScaleFactor: 1, mobile: rong < 640,
  }, sessionId);

  await goi('Page.navigate', { url: BASE + URL_TRANG }, sessionId);
  // ⚠️ Chờ **mạng lặng**, ⛔ không chờ `load`: trang nạp dữ liệu sau khi dựng
  // xong khung, nên chụp lúc `load` sẽ ra một trang ⛔ chưa có số nào.
  await new Promise((s) => setTimeout(s, 5000));

  // Bấm một phần tử trước khi chụp — dùng để chụp Search / dropdown ĐANG MỞ.
  if (process.env.ANH_BAM) {
    // 🔑 `ANH_BAM` nhận **hai dạng**: bộ chọn CSS, hoặc `text=…` để tìm theo
    // chữ hiện trên nút. Dạng thứ hai cần thiết vì thẻ hành động ⛔ không có
    // `id` lẫn `aria-label` riêng — neo vào lớp Tailwind thì bài chụp sẽ hỏng
    // ngay lần đổi bố cục kế tiếp, mà **chữ trên nút thì ổn định**.
    const bam = await chay(
      `(() => {
        const dk = ${JSON.stringify(process.env.ANH_BAM)};
        let e = null;
        if (dk.startsWith('text=')) {
          const tu = dk.slice(5).toLowerCase();
          e = [...document.querySelectorAll('button, a, [role="button"]')]
            .find((x) => (x.innerText || '').toLowerCase().includes(tu));
        } else { e = document.querySelector(dk); }
        if (!e) return 'KHONG_THAY';
        e.click();
        return 'OK';
      })()`,
    );
    if (bam !== 'OK') console.log(`   ⚠️ ANH_BAM: ${bam} — ${process.env.ANH_BAM}`);
    if (process.env.ANH_GO) {
      // Gõ vào ô đang lấy nét bằng sự kiện React hợp lệ.
      await chay(`(() => {
        const el = document.activeElement;
        if (!el || el.tagName !== 'INPUT') return 'KHONG_CO_O_NHAP';
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(el, ${JSON.stringify(process.env.ANH_GO)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return 'OK';
      })()`);
      await new Promise((s) => setTimeout(s, 1800));
    }
    await new Promise((s) => setTimeout(s, 600));
  }

  // 🔴 **F5 · Ctrl+F5 — Board FINAL HANDOVER CHECK.**
  //
  // 🔑 Đo bằng **chữ ký DOM**, ⛔ không bằng ảnh: hai ảnh trông giống nhau vẫn
  // có thể đến từ hai cây DOM khác nhau, còn một trang hỏng sau khi tải lại
  // thường hỏng ở **số lượng nút** chứ ⛔ không ở màu.
  //
  // ⚠️ `ignoreCache: true` là **đúng nghĩa Ctrl+F5** — bỏ qua bộ nhớ đệm.
  // Chạy cả hai vì chúng đi hai đường khác nhau: `F5` dùng lại gói JS đã đệm,
  // `Ctrl+F5` tải lại từ đầu. Một lỗi hydrat hoá chỉ lộ ở đúng một trong hai.
  if (process.env.ANH_TAI_LAI) {
    const kyTen = async () => chay(
      "(() => document.querySelectorAll('body *').length + '|'"
      + " + (document.querySelector('main,[aria-label]') ? 'co-khoi' : 'thieu-khoi')"
      + " + '|' + document.body.innerText.replace(/\s+/g, ' ').trim().length)()",
    );
    const a = await kyTen();
    await goi('Page.reload', { ignoreCache: false }, sessionId);
    await new Promise((s) => setTimeout(s, 5000));
    const b = await kyTen();
    await goi('Page.reload', { ignoreCache: true }, sessionId);
    await new Promise((s) => setTimeout(s, 5000));
    const c = await kyTen();
    // ⚠️ Số ký tự chữ đổi vài đơn vị là BÌNH THƯỜNG *(đồng hồ, "còn 3 ngày")*.
    // So **số nút** và **có khối chính hay không** — hai thứ ⛔ không được đổi.
    const nut = (x) => x.split('|').slice(0, 2).join('|');
    const dat = nut(a) === nut(b) && nut(b) === nut(c);
    console.log(`   ${dat ? '✅' : '⛔'} F5 · Ctrl+F5 — nạp đầu ${a} · F5 ${b} · Ctrl+F5 ${c}`);
    if (!dat) sachTaiLai = false;
  }

  // 🔴 Đo tràn ngang **ở đúng khổ đang xét**, TRƯỚC khi nới khung để chụp.
  const tran = JSON.parse(await chay(DO_TRAN));
  const co = tran.cuonNgang;
  console.log(`   ${co ? '⛔ TRÀN NGANG' : '✅ ⛔ không tràn ngang'} · khung ${tran.khung} · scrollWidth ${tran.scrollWidth}`);
  if (co) tran.thuPham.forEach((t) => console.log(`      ↳ ${t}`));

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
  // nhỏ khi xem và **chi tiết 4 px thì biến mất**.
  const clip = process.env.ANH_VUNG
    ? (([x, y, cw, ch]) => ({ x, y, width: cw, height: ch, scale: 2 }))(process.env.ANH_VUNG.split(',').map(Number))
    : undefined;
  const { data } = await goi('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) }, sessionId);
  const duong = `${RA}/${ten}.png`;
  writeFileSync(duong, Buffer.from(data, 'base64'));
  console.log(`📸 ${duong}  (${w}×${h})`);
  return !co;
}

let sach = true;
let sachTaiLai = true;
try {
  for (const k of KHO) {
    console.log(`\n── ${k.ten} ${k.w}×${k.h} ──`);
    const ok = await chup(`${process.env.ANH_TEN || 'md'}-${k.ten}`, k.w, k.h);
    sach = sach && ok;
  }
} finally {
  ws.close();
  chrome.kill();
}
console.log(`\n${sach ? '✅' : '⛔'} Tràn ngang: ${sach ? 'ĐẠT ở mọi khổ' : 'HỎNG — xem thủ phạm ở trên'}`);
console.log('⚠️ Ảnh + phép đo tràn CHỨNG MINH bố cục ⛔ không vỡ; chúng ⛔ KHÔNG chứng minh nó ĐẸP.');
process.exit(sach && sachTaiLai ? 0 : 1);
