// ============================================================================
// KIỂM KIẾN TRÚC — KHÔNG CẦN CƠ SỞ DỮ LIỆU, CHẠY ĐƯỢC TRÊN CI
//
// Đây là bài kiểm DUY NHẤT chạy được mà không có bí mật kết nối, nên nó là
// hàng rào rẻ nhất và thường trực nhất của dự án.
//
// ⚠️ NGƯỠNG THAY VÌ SỐ KHÔNG: vài mục dưới đây đặt NGƯỠNG bằng đúng hiện
// trạng đã đo, không đặt 0. Lý do: đặt 0 khi thực tế là 65 thì bài kiểm đỏ
// vĩnh viễn, và bài kiểm đỏ vĩnh viễn thì người ta ngừng đọc nó.
//
// Ngưỡng là **trần không được vượt** — nợ cũ được ghi nhận, nợ MỚI bị chặn.
// Giảm được thì SIẾT ngưỡng xuống ngay trong cùng lần sửa.
// ============================================================================
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { scoreboard, ROOT } from '../_lib/harness.mjs';

const s = scoreboard('KIỂM KIẾN TRÚC');

function quet(thuMuc, duoi = ['.ts', '.tsx']) {
  const ra = [];
  const di = (d) => {
    if (!existsSync(d)) return;
    for (const t of readdirSync(d)) {
      if (t === 'node_modules' || t === '.next' || t.startsWith('.')) continue;
      const p = join(d, t);
      if (statSync(p).isDirectory()) di(p);
      else if (duoi.some((e) => t.endsWith(e))) ra.push(p);
    }
  };
  di(join(ROOT, thuMuc));
  return ra;
}
const doc = (p) => readFileSync(p, 'utf8');
const rel = (p) => relative(ROOT, p).split(sep).join('/');

const tepUngDung = [...quet('app'), ...quet('lib'), ...quet('components'), ...quet('hooks')];
console.log(`Quét ${tepUngDung.length} tệp nguồn.\n`);

// ── 1. CẤM `any` — guardrail bất di bất dịch ───────────────────────────────
console.log('① GUARDRAIL — cấm `any`');
const NGUONG_ANY = 0;
const viPhamAny = [];
for (const p of tepUngDung) {
  const noiDung = doc(p);
  noiDung.split('\n').forEach((dong, i) => {
    if (dong.trimStart().startsWith('//') || dong.trimStart().startsWith('*')) return;
    if (/(:\s*any\b|<any>|as any\b|any\[\])/.test(dong)) viPhamAny.push(`${rel(p)}:${i + 1}`);
  });
}
s.ok(`\`any\` ≤ ${NGUONG_ANY} (đang có ${viPhamAny.length})`, viPhamAny.length <= NGUONG_ANY,
  viPhamAny.slice(0, 8).join(' · '));

// ── 2. CẤM xoá cứng dữ liệu nghiệp vụ ──────────────────────────────────────
console.log('\n② HIẾN PHÁP — cấm Hard-Delete dữ liệu nghiệp vụ');
// `delete()` trên bảng nối thuần tuý (không mang dữ liệu nghiệp vụ) được miễn.
const MIEN_DELETE = new Set(['tests', 'scripts']);
const xoaCung = [];
for (const p of tepUngDung) {
  if ([...MIEN_DELETE].some((m) => rel(p).startsWith(m + '/'))) continue;
  doc(p).split('\n').forEach((dong, i) => {
    if (dong.trimStart().startsWith('//')) return;
    if (/\.delete\(\)/.test(dong)) xoaCung.push(`${rel(p)}:${i + 1}`);
  });
}
// Ngưỡng = hiện trạng sau khi Audit gỡ `deleteRow()`. Bốn chỗ còn lại là nợ
// đã ghi nhận (TD-02), KHÔNG được sinh thêm chỗ thứ năm.
const NGUONG_DELETE = 4;
s.ok(`Hard-Delete ≤ ${NGUONG_DELETE} (đang có ${xoaCung.length})`, xoaCung.length <= NGUONG_DELETE,
  xoaCung.join(' · '));
s.ok('Thư viện dùng chung KHÔNG xuất hàm xoá cứng tổng quát',
  !doc(join(ROOT, 'lib/supabase.ts')).includes('export async function deleteRow'));

// ── 3. CHIỀU PHỤ THUỘC — `lib/` và `components/` không được phụ thuộc `app/`
console.log('\n③ KIẾN TRÚC — chiều phụ thuộc (Điều XII)');
const dem = (tep, mau) => tep.filter((p) => mau.test(doc(p))).length;
const libNguoc = quet('lib').filter((p) => /from '@\/app\//.test(doc(p)));
const compNguoc = quet('components').filter((p) => /from '@\/app\//.test(doc(p)));
// Ngưỡng = hiện trạng. Sửa tận gốc đòi dời server action ra khỏi `app/` — một
// refactor lớn, đã ghi vào Architecture Debt AD-01. Ở đây chỉ CHẶN NỢ MỚI.
// ⚠️ Ngưỡng dưới đây là SỐ ĐO THẬT ngày 03/08/2026, không phải con số ước
// lượng. Bản đầu tôi đặt 6 và 22 theo trí nhớ từ một phép `grep` đếm DÒNG,
// trong khi bài kiểm đếm TỆP — và nó đỏ ngay lần chạy đầu. Đúng cùng một lỗi
// với "số viết cứng trong bài kiểm" đã hai lần gây báo động giả.
const NGUONG_LIB_NGUOC = 9;
const NGUONG_COMP_NGUOC = 39;
s.ok(`lib/ → app/ ≤ ${NGUONG_LIB_NGUOC} tệp (đang có ${libNguoc.length})`,
  libNguoc.length <= NGUONG_LIB_NGUOC, libNguoc.map(rel).join(' · '));
s.ok(`components/ → app/ ≤ ${NGUONG_COMP_NGUOC} tệp (đang có ${compNguoc.length})`,
  compNguoc.length <= NGUONG_COMP_NGUOC);
s.ok('lib/mos/domain KHÔNG phụ thuộc bất cứ thứ gì ngoài chính nó',
  quet('lib/mos/domain').every((p) => !/from '@\/(app|components|hooks)\//.test(doc(p))));
s.ok('lib/mos/value-objects KHÔNG phụ thuộc `@/lib/i18n` (khớp bài học 029)',
  quet('lib/mos/value-objects').every((p) => !/from '@\/lib\/i18n'/.test(doc(p))));

// ── 4. MÚI GIỜ — cấm số ma thuật ───────────────────────────────────────────
console.log('\n④ MÚI GIỜ — một nguồn sự thật');
const soMaThuat = [];
for (const p of tepUngDung) {
  if (rel(p) === 'lib/time.ts') continue;      // chính nó là nơi định nghĩa
  doc(p).split('\n').forEach((dong, i) => {
    if (dong.trimStart().startsWith('//') || dong.trimStart().startsWith('*')) return;
    if (/7\s*\*\s*3600\s*\*\s*1000|7\s*\*\s*60\s*\*\s*60\s*\*\s*1000/.test(dong))
      soMaThuat.push(`${rel(p)}:${i + 1}`);
  });
}
s.ok(`Không còn số ma thuật bù giờ VN (đang có ${soMaThuat.length})`, soMaThuat.length === 0,
  soMaThuat.join(' · '));
s.ok('Có `lib/time.ts` làm nguồn sự thật duy nhất cho giờ Việt Nam',
  existsSync(join(ROOT, 'lib/time.ts')));

// ── 5. KÍCH THƯỚC TỆP — God Object ─────────────────────────────────────────
console.log('\n⑤ BẢO TRÌ — God Object');
const NGUONG_DONG = 900;   // = hiện trạng lớn nhất trong app/components
const qua = tepUngDung
  .filter((p) => !rel(p).startsWith('lib/dictionaries/'))   // từ điển là dữ liệu, không phải logic
  .map((p) => [rel(p), doc(p).split('\n').length])
  .filter(([, n]) => n > NGUONG_DONG)
  .sort((a, b) => b[1] - a[1]);
s.ok(`Không tệp logic nào > ${NGUONG_DONG} dòng (đang có ${qua.length})`, qua.length === 0,
  qua.map(([f, n]) => `${f}(${n})`).join(' · '));

// ── 6. TÀI LIỆU BẮT BUỘC ───────────────────────────────────────────────────
console.log('\n⑥ QUẢN TRỊ — tài liệu bắt buộc phải tồn tại');
for (const f of [
  'docs/MONICA_CONSTITUTION.md',
  'docs/ENGINEERING_PLAYBOOK.md',
  'docs/RLS_COVERAGE_MATRIX.md',
  'docs/SECURITY_DEFINER_REGISTRY.md',
  'docs/MUTATION_POLICY.md',
  'docs/DOMAIN_GLOSSARY.md',
]) s.ok(f, existsSync(join(ROOT, f)));

// ── 7. MIGRATION — không được sửa tệp đã chạy ──────────────────────────────
console.log('\n⑦ MIGRATION — kỷ luật đánh số');
const mig = existsSync(join(ROOT, 'supabase/migrations'))
  ? readdirSync(join(ROOT, 'supabase/migrations')).filter((f) => f.endsWith('.sql'))
  : [];
s.ok(`Có migration (${mig.length} tệp)`, mig.length > 0);
s.ok('Mọi migration theo khuôn <số><hậu tố?>_<tên>.sql',
  mig.every((f) => /^\d{3}[a-z]?\d?_[a-z0-9_]+\.sql$/.test(f)),
  mig.filter((f) => !/^\d{3}[a-z]?\d?_[a-z0-9_]+\.sql$/.test(f)).join(' · '));
s.ok('Bản nháp CHƯA hoàn chỉnh không nằm trong thư mục migrations',
  !mig.some((f) => /INCOMPLETE|draft|nhap/i.test(f)));

// ── 8. ADR — Hiến pháp IV ──────────────────────────────────────────────────
console.log('\n⑧ ADR — bất biến, không ghi đè');
const adr = existsSync(join(ROOT, 'docs/adr'))
  ? readdirSync(join(ROOT, 'docs/adr')).filter((f) => /^ADR-\d{3}/.test(f))
  : [];
s.ok(`Có ADR (${adr.length} bản)`, adr.length >= 6);
const so = adr.map((f) => Number(f.slice(4, 7))).sort((a, b) => a - b);
s.ok('Số hiệu ADR không trùng', new Set(so).size === so.length);

// ── 9. MÀU HIẾN ĐỊNH — Điều 44.6 · TD-08 ───────────────────────────────────
//
// Điều 44.6: *"No colour value shall be written directly into a business
// screen."* Mục này là RĂNG của điều khoản đó.
//
// ─── VÌ SAO PHẢI CÓ PHÉP KIỂM, KHÔNG CHỈ CÓ ĐIỀU KHOẢN ───────────────────
// Cùng một họ bài học với TD-03: thứ để lỗi sống sót không phải sự bất cẩn,
// mà là **thiếu một phép thử chứng minh quy tắc đang được tuân thủ**. Ban hành
// Điều 44 mà không dựng mục này thì sáu tháng nữa sẽ có đợt màu viết thẳng thứ
// hai, chỉ khác tên tệp.
//
// ─── CƠ CHẾ BÁNH CÓC, KHÔNG PHẢI CỔNG CHẶN ──────────────────────────────
// 109 tệp đang vi phạm. Đặt ngưỡng 0 thì bài kiểm đỏ vĩnh viễn, và bài kiểm đỏ
// vĩnh viễn thì người ta ngừng đọc nó. Thay vào đó: danh sách nợ ĐÓNG BĂNG.
//   • Tệp MỚI vi phạm            → HỎNG
//   • Tệp trong danh sách đã sạch → báo tiến độ, nhắc gỡ khỏi danh sách
// Danh sách chỉ được phép NGẮN ĐI. Đó là TD-07 tự thu hẹp theo thời gian.
//
// ⚠️ PHẢI BỎ CHÚ THÍCH TRƯỚC KHI QUÉT. `app/home-modules.ts` có dòng chú
// thích giải thích chính quy tắc này (“không viết thẳng `bg-blue-50`”). Quét
// cả chú thích thì tệp SẠCH NHẤT lại bị báo vi phạm — tức phép kiểm trừng phạt
// đúng người đã ghi lại quy tắc. Đây là lỗi đã bắt được khi dựng mục này.
//
// ⚠️ Sắc TRUNG TÍNH (`slate` `gray` `zinc` `neutral` `white` `black`) KHÔNG bị
// chặn: chúng là màu khung nền dùng khắp nơi, không phải màu định danh. Chặn cả
// chúng sẽ khiến quy tắc không thể tuân thủ, và quy tắc không thể tuân thủ thì
// người ta tắt nó đi.
console.log('\n⑨ MÀU HIẾN ĐỊNH — Điều 44.6 · mọi màu phải lấy từ thẻ màu');

const SAC_DINH_DANH =
  'indigo|orange|red|teal|blue|emerald|green|cyan|purple|amber|rose|sky|fuchsia|stone|violet|pink|lime|yellow';
const TIEN_TO =
  'bg|text|ring|border|from|via|to|fill|stroke|divide|outline|accent|decoration|placeholder|shadow';
const RE_MAU = new RegExp(`\\b(?:${TIEN_TO})-(?:${SAC_DINH_DANH})-[0-9]{2,3}\\b`);

/** Bỏ chú thích khối và chú thích dòng. `[^:]` giữ lại `https://`. */
function boChuThich(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const NGUON_THE_MAU = 'lib/design/tokens.ts';
const duongDanNo = join(ROOT, 'tests/architecture/color-debt-baseline.json');
const danhSachNo = existsSync(duongDanNo)
  ? new Set(JSON.parse(doc(duongDanNo)).files)
  : new Set();

const viPham = [...quet('app'), ...quet('components')]
  .filter((p) => RE_MAU.test(boChuThich(doc(p))))
  .map(rel)
  .sort();

const moiViPham = viPham.filter((f) => !danhSachNo.has(f));
const daSach = [...danhSachNo].filter((f) => !viPham.includes(f)).sort();

s.ok(`Thẻ màu hiến định tồn tại (${NGUON_THE_MAU})`,
  existsSync(join(ROOT, NGUON_THE_MAU)));
s.ok('Danh sách nợ màu tồn tại (cơ chế bánh cóc TD-07)', danhSachNo.size > 0);
s.ok(`KHÔNG tệp MỚI nào viết màu thẳng (đang nợ ${viPham.length}/${danhSachNo.size})`,
  moiViPham.length === 0,
  moiViPham.join(' · '));
s.ok('Danh sách nợ không phình ra', viPham.length <= danhSachNo.size,
  `${viPham.length} > ${danhSachNo.size}`);

if (daSach.length) {
  console.log(`   ↻ ${daSach.length} tệp đã sạch — gỡ khỏi color-debt-baseline.json: ${daSach.slice(0, 5).join(' · ')}${daSach.length > 5 ? ' …' : ''}`);
}

// ── 10. CHỮ HIẾN ĐỊNH — TD-10 ──────────────────────────────────────────────
//
// Quyết nghị Board 03/08/2026: *"Direct Tailwind typography utilities shall not
// be introduced into new code once the token system is established."*
//
// Cùng cơ chế bánh cóc với mục ⑨, vì cùng một bài học: một điều khoản không có
// phép kiểm là một điều khoản sống được khoảng ba tháng.
//
// ⚠️ Phạm vi chặn hẹp hơn màu một cách có chủ ý. Chỉ chặn bốn nhóm THỰC SỰ
// dựng nên thứ bậc chữ: cỡ · độ đậm · giãn dòng · giãn chữ. KHÔNG chặn
// `text-center`, `truncate`, `uppercase`, `italic` — đó là bố cục và ngữ nghĩa,
// không phải thang chữ, và chặn chúng sẽ biến quy tắc thành thứ không ai theo nổi.
console.log('\n⑩ CHỮ HIẾN ĐỊNH — TD-10 · thang chữ phải lấy từ thẻ chữ');

const RE_CHU = new RegExp(
  [
    'text-\\[[0-9.]+px\\]',
    '\\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\\b',
    '\\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\\b',
    '\\bleading-[a-z0-9[]',
    '\\btracking-[a-z0-9[]',
  ].join('|'),
);

const NGUON_THE_CHU = 'lib/design/typography.ts';
const duongDanNoChu = join(ROOT, 'tests/architecture/type-debt-baseline.json');
const danhSachNoChu = existsSync(duongDanNoChu)
  ? new Set(JSON.parse(doc(duongDanNoChu)).files)
  : new Set();

const viPhamChu = [...quet('app'), ...quet('components')]
  .filter((p) => RE_CHU.test(boChuThich(doc(p))))
  .map(rel)
  .sort();

const moiViPhamChu = viPhamChu.filter((f) => !danhSachNoChu.has(f));
const daSachChu = [...danhSachNoChu].filter((f) => !viPhamChu.includes(f)).sort();

s.ok(`Thẻ chữ hiến định tồn tại (${NGUON_THE_CHU})`,
  existsSync(join(ROOT, NGUON_THE_CHU)));
s.ok('Danh sách nợ chữ tồn tại (cơ chế bánh cóc TD-10)', danhSachNoChu.size > 0);
s.ok(`KHÔNG tệp MỚI nào tự đặt thang chữ (đang nợ ${viPhamChu.length}/${danhSachNoChu.size})`,
  moiViPhamChu.length === 0,
  moiViPhamChu.join(' · '));
s.ok('Danh sách nợ chữ không phình ra', viPhamChu.length <= danhSachNoChu.size,
  `${viPhamChu.length} > ${danhSachNoChu.size}`);

if (daSachChu.length) {
  console.log(`   ↻ ${daSachChu.length} tệp đã sạch — gỡ khỏi type-debt-baseline.json: ${daSachChu.slice(0, 5).join(' · ')}${daSachChu.length > 5 ? ' …' : ''}`);
}

// ── 11. QUỐC TẾ HOÁ — Hiến pháp Điều 45 ────────────────────────────────────
//
// Ba phép kiểm, ba loại sai sót khác nhau:
//   ① BỘ KHOÁ PHẢI TRÙNG KHỚP ở cả ba ngôn ngữ. Đây là thứ bắt được "tiếng
//      Trung chưa dịch xong" ngay lúc CI, thay vì lúc khách hàng Trung Quốc mở
//      màn hình và thấy một nửa tiếng Việt.
//   ② KHÔNG khoá rỗng. Khoá tồn tại mà giá trị rỗng còn tệ hơn khoá thiếu:
//      phép kiểm ① thấy đủ, còn màn hình thì trống trơn.
//   ③ TỪ HIẾN ĐỊNH giữ nguyên chữ ở mọi ngôn ngữ (§45.3).
console.log('\n⑪ QUỐC TẾ HOÁ — Điều 45 · ba ngôn ngữ ngang hàng');

const NGON_NGU = [
  ['vi', 'messages/vi.json'],
  ['en', 'messages/en.json'],
  ['zh', 'messages/zh.json'],
];

for (const [, p] of NGON_NGU) s.ok(`Có ${p}`, existsSync(join(ROOT, p)));

function phangJson(obj, tienTo = '') {
  const ra = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === '_meta') continue;
    const khoa = tienTo ? `${tienTo}.${k}` : k;
    if (typeof v === 'string') ra[khoa] = v;
    else if (v && typeof v === 'object') Object.assign(ra, phangJson(v, khoa));
  }
  return ra;
}

const catalog = {};
for (const [ma, p] of NGON_NGU) {
  catalog[ma] = existsSync(join(ROOT, p)) ? phangJson(JSON.parse(doc(join(ROOT, p)))) : {};
}

const khoaVi = Object.keys(catalog.vi).sort();
s.ok(`Từ điển gốc có khoá (${khoaVi.length} khoá)`, khoaVi.length > 0);

for (const ma of ['en', 'zh']) {
  const khoa = Object.keys(catalog[ma]);
  const thieu = khoaVi.filter((k) => !khoa.includes(k));
  const thua = khoa.filter((k) => !khoaVi.includes(k));
  s.ok(`${ma}: đủ ${khoaVi.length} khoá, không thiếu`, thieu.length === 0,
    `thiếu: ${thieu.slice(0, 8).join(' · ')}`);
  s.ok(`${ma}: không có khoá thừa`, thua.length === 0,
    `thừa: ${thua.slice(0, 8).join(' · ')}`);
}

for (const [ma] of NGON_NGU) {
  const rong = Object.entries(catalog[ma]).filter(([, v]) => !v || !v.trim()).map(([k]) => k);
  s.ok(`${ma}: không có khoá rỗng`, rong.length === 0, rong.slice(0, 8).join(' · '));
}

// ③ Từ hiến định — §45.3. Đọc danh sách từ chính tệp cưỡng chế, không chép lại
//    ở đây: hai bản danh sách là hai bản sẽ lệch nhau.
const tepTu = join(ROOT, 'lib/constitutional-terms.ts');
s.ok('Có lib/constitutional-terms.ts', existsSync(tepTu));
const TU_HIEN_DINH = existsSync(tepTu)
  ? [...doc(tepTu).matchAll(/^\s*'([^']+)',$/gm)].map((m) => m[1])
  : [];
s.ok(`Danh sách từ hiến định đọc được (${TU_HIEN_DINH.length} từ)`, TU_HIEN_DINH.length >= 25);

// Khoá nào ở bản tiếng Việt mang đúng một từ hiến định thì hai bản kia phải
// mang y hệt. Đây là phép so CHÉO — nó bắt được cả trường hợp dịch sót lẫn
// trường hợp "dịch cho đẹp".
const saiTu = [];
for (const k of khoaVi) {
  const goc = catalog.vi[k]?.trim();
  if (!TU_HIEN_DINH.includes(goc)) continue;
  for (const ma of ['en', 'zh']) {
    if (catalog[ma][k]?.trim() !== goc) saiTu.push(`${ma}:${k}`);
  }
}
s.ok('Từ hiến định KHÔNG bị dịch ở bất kỳ ngôn ngữ nào', saiTu.length === 0,
  saiTu.slice(0, 8).join(' · '));

process.exit(s.ketThuc() ? 1 : 0);
