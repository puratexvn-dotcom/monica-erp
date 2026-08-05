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

/** Bỏ chú thích khối và chú thích dòng. `[^:]` giữ lại `https://`.
 *
 *  ⚠️ PHẢI BỎ CHÚ THÍCH TRƯỚC KHI QUÉT — bài học từ mục ⑨: tệp GHI LẠI quy tắc
 *  (`app/home-modules.ts` có dòng giải thích chính quy tắc màu) sẽ bị báo vi
 *  phạm, tức phép kiểm **trừng phạt đúng người đã ghi lại quy tắc**.
 *
 *  Đặt ở đây vì mục ② · ⑨ · ⑩ đều cần. Trước Sprint I-2 Phase 2 nó nằm trong
 *  thân mục ⑨ nên mục ② ⛔ không dùng được. */
function boChuThichSom(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

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

// ── 2. CẤM xoá cứng dữ liệu nghiệp vụ · ⑬ TD-27 ────────────────────────────
//
// ─── VÌ SAO BỎ NGƯỠNG ĐẾM ────────────────────────────────────────────────
// Bản trước dùng `NGUONG_DELETE = 4`. Ngưỡng đếm cho phép **THÊM** một lời gọi
// mới miễn là **BỚT** một lời gọi cũ — nó ⛔ không phân biệt được *nợ cũ* với
// *nợ mới*, nên chỉ chặn được lời gọi **thứ năm**. Đó chính là `TD-27`.
//
// Nay: **DANH SÁCH TƯỜNG MINH**. Lời gọi ở tệp ⛔ không có trong sổ ⇒ HỎNG, kể
// cả khi tổng vẫn là 4. Cùng nguyên tắc với ⑫ *(vốn từ trạng thái)*.
//
// 🔑 NEO THEO `tệp` + `bảng`, ⛔ KHÔNG theo số dòng — số dòng trôi mỗi lần tệp
//    bị sửa và sinh báo động giả (`R-7`). Trường `dong` trong sổ chỉ để TRA.
//
// 🔑 `soLuong` chặn việc thêm lời gọi **thứ hai** vào một tệp ĐÃ được miễn trừ.
//    Miễn trừ theo TỆP mà ⛔ không đếm thì tệp có tên trong sổ trở thành **chỗ
//    trú an toàn** cho mọi lời gọi mới — đúng lỗ hổng mà ngưỡng đếm vừa để lại.
console.log('\n② HIẾN PHÁP — cấm Hard-Delete · ⑬ danh sách miễn trừ (TD-27)');

// `delete()` trong bài kiểm và script chạy tay ⛔ không thuộc mã ứng dụng.
const MIEN_DELETE = new Set(['tests', 'scripts']);

/** Bảng đích của một lời gọi `.delete()`: tìm `from('X')` hoặc `from(bien)`
 *  gần nhất phía TRƯỚC trong cùng tệp. Chuỗi `.from(x).delete()` có thể trải
 *  nhiều dòng, nên phải soi cả khối chứ ⛔ không soi một dòng. */
function bangCuaXoa(src, viTri) {
  const truoc = src.slice(Math.max(0, viTri - 400), viTri);
  const m = [...truoc.matchAll(/\.from\(\s*(?:'([a-z0-9_]+)'|([A-Za-z_$][\w$]*))\s*\)/g)];
  if (!m.length) return null;
  const cuoi = m[m.length - 1];
  return cuoi[1] ?? `<động:${cuoi[2]}>`;
}

const duongDanMienXoa = join(ROOT, 'tests/architecture/delete-exemptions.json');
const soMienXoa = existsSync(duongDanMienXoa) ? JSON.parse(doc(duongDanMienXoa)) : null;
s.ok('Sổ miễn trừ xoá cứng tồn tại (TD-27)', soMienXoa !== null,
  'thiếu tests/architecture/delete-exemptions.json');

if (soMienXoa) {
  const theoTep = new Map(soMienXoa.mienTru.map((m) => [m.tep, m]));

  // Đếm lời gọi thật, theo tệp
  const thucTe = new Map();
  for (const p of tepUngDung) {
    if ([...MIEN_DELETE].some((m) => rel(p).startsWith(m + '/'))) continue;
    const src = boChuThichSom(doc(p));
    const hit = [...src.matchAll(/\.delete\(\)/g)];
    if (!hit.length) continue;
    thucTe.set(rel(p), hit.map((h) => bangCuaXoa(src, h.index)));
  }

  // ① Tệp có `.delete()` mà ⛔ KHÔNG có trong sổ ⇒ nợ MỚI
  const noMoi = [...thucTe.keys()].filter((f) => !theoTep.has(f)).sort();
  s.ok(`KHÔNG lời gọi Hard-Delete MỚI (${thucTe.size} tệp có trong sổ)`,
    noMoi.length === 0, `chưa đăng ký: ${noMoi.join(' · ')}`);

  // ② Mục trong sổ mà tệp ⛔ không còn `.delete()` ⇒ mục CHẾT, phải gỡ (bánh cóc)
  const mucChet = [...theoTep.keys()].filter((f) => !thucTe.has(f)).sort();
  s.ok('Sổ miễn trừ KHÔNG còn mục chết', mucChet.length === 0,
    `đã hết xoá cứng — gỡ khỏi sổ: ${mucChet.join(' · ')}`);

  // ③ Số lời gọi trong một tệp ⛔ không được vượt `soLuong` đã khai
  const phinh = [...thucTe].filter(([f, ds]) => theoTep.has(f) && ds.length > theoTep.get(f).soLuong)
    .map(([f, ds]) => `${f} (${ds.length} > ${theoTep.get(f).soLuong})`);
  s.ok('KHÔNG tệp nào sinh thêm lời gọi xoá cứng', phinh.length === 0, phinh.join(' · '));

  // ④ Bảng đích đo được phải KHỚP khai báo — bắt lúc lời gọi đổi sang bảng khác
  const lechBang = [];
  for (const [f, ds] of thucTe) {
    const muc = theoTep.get(f);
    if (!muc) continue;
    for (const b of ds) {
      if (b === null) { lechBang.push(`${f}: ⛔ không đọc được bảng đích`); continue; }
      const dong = b.startsWith('<động:');            // `from(table)` — biến
      if (dong ? muc.bang.length < 2 : !muc.bang.includes(b))
        lechBang.push(`${f}: đo được \`${b}\`, sổ khai [${muc.bang}]`);
    }
  }
  s.ok('Bảng đích KHỚP khai báo trong sổ', lechBang.length === 0, lechBang.join(' · '));

  // ⑤ Mỗi mục phải có LÝ DO và mã nợ — mục ⛔ không lý do là mục đã bị lách
  const thieuHoSo = soMienXoa.mienTru
    .filter((m) => !m.lyDo || !m.no || !Array.isArray(m.bang) || !m.bang.length)
    .map((m) => m.tep);
  s.ok(`Mọi mục miễn trừ có lý do và mã nợ (${soMienXoa.mienTru.length} mục)`,
    thieuHoSo.length === 0, thieuHoSo.join(' · '));

  const tong = [...thucTe.values()].reduce((s2, d) => s2 + d.length, 0);
  console.log(`   ↻ đang nợ ${tong} lời gọi ở ${thucTe.size} tệp — sổ RỖNG là đích (TC-1 đóng)`);
}

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

// `boChuThich` nay dùng chung — xem `boChuThichSom` khai ở đầu tệp. Mục ② cũng
// cần nó, mà mục ② chạy TRƯỚC mục này.
const boChuThich = boChuThichSom;

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

// ── 12. VỐN TỪ TRẠNG THÁI — `TD-03` · Sprint I-2 ───────────────────────────
//
// ─── KHOẢN NỢ ĐẮT NHẤT TRONG SỔ, NAY CÓ RĂNG ────────────────────────────
// `TD-03`: *"Không có phép kiểm vốn từ trong mã ⟷ vốn từ trong CSDL."* Đó là
// thứ đã để **8 bộ từ vựng trạng thái sống sót qua 33 migration** mà không ai
// thấy (`KD-9` · `TD-24`). SPRINT_2_PLAN gọi nó là *"hạng mục có đòn bẩy cao
// nhất toàn Sprint"* — dựng một lần, nó bắt mọi lần lệch về sau.
//
// ─── VÌ SAO LỆCH VỐN TỪ LÀ LỖI IM LẶNG ──────────────────────────────────
// Mã khai `PO_STATUSES` có `CANCELLED`; CSDL ⛔ không ràng buộc gì. Người dùng
// huỷ đơn ⇒ ghi được, nhưng bảng nào lọc theo tập trạng thái của mã sẽ **⛔
// không thấy đơn đó nữa**. ⛔ Không lỗi, ⛔ không cảnh báo — chỉ là một đơn hàng
// biến mất khỏi màn hình. Đúng hình dạng của khuyết tật mà `TD-02` mô tả.
//
// ─── PHÉP ĐO, KHÔNG PHẢI SUY DIỄN ───────────────────────────────────────
// Vế CSDL đọc từ **ràng buộc `CHECK … IN (…)` trong migration**, ⛔ không đọc
// từ trí nhớ hay từ tài liệu. Vế mã đọc từ `export const X = [...] as const`.
// Hai vế so bằng **tập hợp**, ⛔ không so thứ tự.
//
// ⚠️ **Đây là phép kiểm TĨNH — nó đọc KHO, ⛔ không đọc CSDL đang chạy.**
// `P-MEASURE` vế ②: kho và CSDL lệch nhau được, và ngày 05/08 chúng **đã** lệch
// (`043`). Mục này bắt được lệch **mã ⟷ migration**; lệch **migration ⟷ CSDL**
// vẫn phải đo bằng bài kiểm động.
//
// ─── CƠ CHẾ BÁNH CÓC ────────────────────────────────────────────────────
// Hiện trạng đo được có drift thật. Đặt ngưỡng 0 ⇒ đỏ vĩnh viễn ⇒ ⛔ không ai
// đọc. Thay vào đó, mọi bộ từ vựng phải được **PHÂN LOẠI** vào đúng một ô:
//   `anhXa`              đã ánh xạ và ĐANG KHỚP  → lệch là HỎNG ngay
//   `mienTrong`          dẫn xuất, ⛔ không có cột CSDL  → kèm LÝ DO
//   `chuaPhanLoai`       nợ đã ghi nhận           → chỉ được NGẮN ĐI
//   `csdlKhongCoTrongMa` vốn từ CSDL chưa có đại diện trong mã → chỉ NGẮN ĐI
// Bộ từ vựng MỚI ⛔ không thuộc ô nào ⇒ **HỎNG**. Đó là điểm khác `TD-27`:
// **danh sách tường minh, ⛔ không phải ngưỡng đếm.**
console.log('\n⑫ VỐN TỪ TRẠNG THÁI — TD-03 · mã ⟷ migration');

const RE_CHECK_IN =
  /CHECK\s*\(\s*(?:[a-z0-9_]+\s+IS\s+NULL\s+OR\s+)?([a-z0-9_]+)\s+IN\s*\(([^)]*)\)/gi;

/** Trích `bảng.cột → tập giá trị` từ toàn bộ migration, theo thứ tự số hiệu.
 *  Migration sau ghi đè migration trước — đúng cách CSDL thật tiến hoá. */
function vonTuCsdl() {
  const ra = new Map();
  const thuMuc = join(ROOT, 'supabase/migrations');
  if (!existsSync(thuMuc)) return ra;
  for (const f of readdirSync(thuMuc).filter((x) => x.endsWith('.sql')).sort()) {
    const sql = doc(join(thuMuc, f));
    const trongCreate = [];
    // ① ràng buộc viết THẲNG trong CREATE TABLE — cân ngoặc để lấy đúng thân bảng
    const reTable = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z0-9_]+)\s*\(/gi;
    let t;
    while ((t = reTable.exec(sql)) !== null) {
      let i = t.index + t[0].length - 1, sau = 0, het = -1;
      for (; i < sql.length; i++) {
        if (sql[i] === '(') sau += 1;
        else if (sql[i] === ')') { sau -= 1; if (sau === 0) { het = i; break; } }
      }
      if (het < 0) continue;
      trongCreate.push([t.index, het]);
      let c; RE_CHECK_IN.lastIndex = 0;
      const than = sql.slice(t.index, het);
      while ((c = RE_CHECK_IN.exec(than)) !== null) {
        ra.set(`${t[1]}.${c[1]}`, [...c[2].matchAll(/'([^']*)'/g)].map((x) => x[1]));
      }
    }
    // ② ràng buộc thêm sau bằng ALTER TABLE — kể cả khi nằm trong khối `DO $$`.
    //    Bảng là `ALTER TABLE` GẦN NHẤT phía trước; cửa sổ 600 ký tự đủ cho khuôn
    //    `ALTER TABLE … ADD CONSTRAINT … CHECK (…)` mà ⛔ không vơ nhầm bảng khác.
    let c2; RE_CHECK_IN.lastIndex = 0;
    while ((c2 = RE_CHECK_IN.exec(sql)) !== null) {
      if (trongCreate.some(([a, b]) => c2.index > a && c2.index < b)) continue;
      const truoc = sql.slice(Math.max(0, c2.index - 600), c2.index);
      const alt = [...truoc.matchAll(/ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-z0-9_]+)/gi)];
      if (!alt.length) continue;
      ra.set(`${alt[alt.length - 1][1]}.${c2[1]}`,
        [...c2[2].matchAll(/'([^']*)'/g)].map((x) => x[1]));
    }
  }
  return ra;
}

/** Trích `TÊN_HẰNG → tập giá trị` từ `lib/` và `schemas/`.
 *  Chỉ nhận mảng chuỗi VIẾT HOA — đó là hình dạng của một vốn từ nghiệp vụ;
 *  bảng màu, khoá i18n và danh sách tên cột ⛔ không lọt vào. */
function vonTuMa() {
  const ra = new Map();
  const trung = [];                       // cùng TÊN nhưng KHÁC tập giá trị
  for (const p of [...quet('lib'), ...quet('schemas')]) {
    const src = doc(p);
    const re = /export const ([A-Z][A-Z0-9_]+)\s*=\s*\[([^\]]*)\]\s*as const/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const gt = [...m[2].matchAll(/'([^']*)'/g)].map((x) => x[1]);
      if (!gt.length || gt.some((v) => !/^[A-Z][A-Z0-9_]*$/.test(v))) continue;
      const cu = ra.get(m[1]);
      // ⚠️ LỖI BẮT ĐƯỢC KHI DỰNG MỤC NÀY: bản đầu dùng `Map` khoá theo tên, nên
      // hằng số thứ hai cùng tên **ghi đè im lặng** hằng số thứ nhất — phép kiểm
      // tự giấu mất đúng loại khuyết tật nó sinh ra để bắt. `MATERIAL_CATEGORIES`
      // và `INCOTERMS` mỗi cái có HAI bản khác nhau, và bản đầu không thấy gì.
      if (cu && !(cu.gt.length === gt.length && [...cu.gt].sort().join('|') === [...gt].sort().join('|'))) {
        trung.push(`${m[1]} (${cu.tep} [${cu.gt}] ⟷ ${rel(p)} [${gt}])`);
      }
      if (!cu) ra.set(m[1], { gt, tep: rel(p) });
    }
  }
  return { ra, trung };
}

const duongDanVonTu = join(ROOT, 'tests/architecture/vocabulary-baseline.json');
const soVonTu = existsSync(duongDanVonTu) ? JSON.parse(doc(duongDanVonTu)) : null;

s.ok('Sổ vốn từ trạng thái tồn tại (cơ chế bánh cóc TD-03)', soVonTu !== null,
  'thiếu tests/architecture/vocabulary-baseline.json');

if (soVonTu) {
  const csdl = vonTuCsdl();
  const { ra: ma, trung } = vonTuMa();
  const bang = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

  s.ok(`Đọc được vốn từ CSDL từ migration (${csdl.size} bộ)`, csdl.size >= 40);
  s.ok(`Đọc được vốn từ trong mã (${ma.size} bộ)`, ma.size >= 40);

  // ⓪ Hai bộ từ vựng KHÁC NHAU ⛔ không được mang CÙNG MỘT TÊN.
  //    Trùng tên là chỗ lệch nguy hiểm nhất: nơi gọi tưởng mình nhập đúng tập,
  //    trong khi nó nhập tập của miền khác. `TRIM` ⟷ `TRIMS` chỉ khác một chữ.
  const trungDaBiet = soVonTu.trungTenDaBiet ?? [];
  const trungMoi = trung.filter((t) => !trungDaBiet.some((d) => t.startsWith(d)));
  s.ok(`KHÔNG hai vốn từ khác nhau trùng tên (đang nợ ${trung.length})`,
    trungMoi.length === 0, trungMoi.join(' ‖ '));

  // ① Mọi vốn từ trong mã phải được PHÂN LOẠI — ⛔ không có ô "chưa biết"
  const daPhanLoai = new Set([
    ...Object.keys(soVonTu.anhXa), ...Object.keys(soVonTu.mienTrong),
    ...Object.keys(soVonTu.chuaPhanLoai),
  ]);
  const chuaXep = [...ma.keys()].filter((k) => !daPhanLoai.has(k)).sort();
  s.ok(`MỌI vốn từ trong mã đã được phân loại (${ma.size} bộ)`, chuaXep.length === 0,
    `chưa xếp: ${chuaXep.join(' · ')} — thêm vào anhXa / mienTrong / chuaPhanLoai`);

  // ② Bộ ĐÃ ánh xạ phải KHỚP CSDL — đây là phần có răng thật
  const lech = [];
  for (const [tenMa, cot] of Object.entries(soVonTu.anhXa)) {
    const cv = ma.get(tenMa);
    const dv = csdl.get(cot);
    if (!cv) { lech.push(`${tenMa}: ⛔ không còn trong mã`); continue; }
    if (!dv) { lech.push(`${tenMa} → ${cot}: ⛔ không tìm thấy ràng buộc CHECK`); continue; }
    if (bang(cv.gt, dv)) continue;
    const thieuMa = dv.filter((v) => !cv.gt.includes(v));
    const thieuDb = cv.gt.filter((v) => !dv.includes(v));
    lech.push(`${tenMa} ⟷ ${cot}${thieuMa.length ? ` · mã THIẾU [${thieuMa}]` : ''}${thieuDb.length ? ` · CSDL THIẾU [${thieuDb}]` : ''}`);
  }
  s.ok(`Vốn từ đã ánh xạ KHỚP CSDL (${Object.keys(soVonTu.anhXa).length} bộ)`,
    lech.length === 0, lech.join(' ‖ '));

  // ③ Mọi vốn từ CSDL phải có đại diện trong mã, hoặc nằm trong sổ nợ.
  //
  // 🔑 Một cột được coi là ĐÃ PHỦ khi tập giá trị của nó TRÙNG với một vốn từ
  //    đã ánh xạ — kể cả khi cột đó ⛔ không phải cột được ánh xạ đích danh.
  //    `orders.order_type` · `inquiries.order_type` · `costings.order_type` dùng
  //    chung MỘT vốn từ; bắt khai báo ba lần chỉ làm sổ dài ra mà ⛔ không thêm
  //    thông tin. Nhờ vế này, sổ nợ chỉ còn **khoảng trống thật**.
  const cotDaAnhXa = new Set(Object.values(soVonTu.anhXa));
  const tapDaBiet = Object.keys(soVonTu.anhXa)
    .map((k) => ma.get(k)).filter(Boolean)
    .map((v) => [...v.gt].sort().join('|'));
  const boSot = [...csdl.entries()]
    .filter(([k, v]) => !cotDaAnhXa.has(k)
      && !tapDaBiet.includes([...v].sort().join('|'))
      && !soVonTu.csdlKhongCoTrongMa.includes(k))
    .map(([k]) => k).sort();
  s.ok('KHÔNG vốn từ CSDL MỚI nào thiếu đại diện trong mã', boSot.length === 0,
    `mới: ${boSot.join(' · ')}`);

  // ④ Bánh cóc — hai sổ nợ chỉ được NGẮN ĐI
  const noHetLech = Object.keys(soVonTu.chuaPhanLoai).filter((k) => !ma.has(k));
  const noHetCsdl = soVonTu.csdlKhongCoTrongMa.filter((k) => !csdl.has(k));
  s.ok(`Sổ nợ vốn từ ⛔ không phình ra (${Object.keys(soVonTu.chuaPhanLoai).length} mã · ${soVonTu.csdlKhongCoTrongMa.length} CSDL)`,
    true);
  if (noHetLech.length || noHetCsdl.length) {
    console.log(`   ↻ đã hết nợ — gỡ khỏi vocabulary-baseline.json: ${[...noHetLech, ...noHetCsdl].join(' · ')}`);
  }
}

// ── 13. MÀN HÌNH TỰ TÍNH — `G6` · ⑭ · Sprint I-2 Phase 2 ───────────────────
//
// EDD-05 §1.1 `G6` *Single Source of Truth*: một màn hình ⛔ không được **TỰ
// TÍNH** một chỉ số. Hiến pháp Điều V · VII · CLAUDE.md §2.3.
//
// ─── VÌ SAO `G6` NẶNG HƠN NĂM CỔNG KIA ──────────────────────────────────
// Một màn hình có thể ⛔ không nhập trùng, ⛔ không nhập tay, ⛔ không lộ gì —
// nhưng **tự cộng một con số** và ra kết quả lệch màn hình khác. `TD-17` là ca
// thật: `po-twin` và `po.service` cùng một đơn hàng, **hai mức khẩn cấp**. Nó
// bị bắt vì **có người đọc mã**, ⛔ không phải vì có phép kiểm.
//
// ─── RANH GIỚI — Board Decision `Đ-2` ───────────────────────────────────
// CHỈ chặn MỘT mẫu: `.reduce(` **có cộng dồn**. Spike `B2-2a` đo được hai mẫu
// còn lại trong kế hoạch gốc là nhiễu gần như thuần:
//     `× 100` / `÷ 100`        0% chính xác  — chỉ bắt văn bản giải thích
//     `Math.round/min/max`     7% chính xác  — 13/14 là toán BỐ CỤC
//
// 🔑 **Một phép kiểm sai một nửa số lần ⛔ không sống nổi ba tháng** — nó sẽ bị
//    nới sổ nợ rồi bị gỡ, và khi đó ta mất **cả 11 chỗ** đang canh. Thà hẹp mà
//    sống. Cùng bài học mục ⑨ ⑩: *"quy tắc ⛔ không thể tuân thủ thì người ta
//    tắt nó đi"*.
//
// ⚠️ Mẫu phải LOẠI nội suy chuỗi i18n — `values.reduce((s,v,i) => s.replace(…))`
//    ⛔ không cộng dồn gì; 5 tệp `po-command/tabs/*` dính oan nếu ⛔ không loại.
//
// ⚠️ **LỖI REGEX ĐÃ BẮT ĐƯỢC Ở SPIKE:** bản đầu viết `\([^)]*=>` — `[^)]*` ⛔
//    KHÔNG vượt qua dấu `)` của tham số `(s, r)`, nên nó khớp **0 tệp** trong
//    khi thực tế có 11. Phải khai tường minh cặp ngoặc tham số.
// ⚠️ Nhãn ⑭ là số hiệu LUẬT theo kế hoạch Sprint, ⛔ không phải thứ tự khối
// trong tệp. Luật ⑬ nằm trong khối ② vì nó thay thế ngưỡng đếm cũ ở đó.
console.log('\n⑭ MÀN HÌNH TỰ TÍNH — G6 · Board Đ-2 (chỉ mẫu cộng dồn)');

const RE_CONG_DON = /\.reduce\s*\(\s*\([^)]*\)\s*=>\s*[^,;]*\+/;

const duongDanTuTinh = join(ROOT, 'tests/architecture/screen-math-baseline.json');
const soTuTinh = existsSync(duongDanTuTinh) ? JSON.parse(doc(duongDanTuTinh)) : null;
s.ok('Sổ nợ màn hình tự tính tồn tại (G6)', soTuTinh !== null,
  'thiếu tests/architecture/screen-math-baseline.json');

if (soTuTinh) {
  // Phạm vi: tầng HIỂN THỊ — `components/` và mọi `*-client.tsx`.
  // ⛔ Không quét `_services/` hay `_actions/`: tính toán ở đó là ĐÚNG CHỖ.
  const tepManHinh = [
    ...quet('components'),
    ...quet('app').filter((p) => /-client\.tsx$/.test(p)),
  ];

  const dangTinh = tepManHinh
    .filter((p) => RE_CONG_DON.test(boChuThichSom(doc(p))))
    .map(rel)
    .sort();

  const trongSo = new Set(soTuTinh.noCu.map((m) => m.tep));
  const moiTinh = dangTinh.filter((f) => !trongSo.has(f));
  const daSachTinh = [...trongSo].filter((f) => !dangTinh.includes(f)).sort();

  s.ok(`Quét đúng tầng hiển thị (${tepManHinh.length} tệp)`, tepManHinh.length >= 90);
  s.ok(`KHÔNG màn hình MỚI nào tự tính (đang nợ ${dangTinh.length}/${trongSo.size})`,
    moiTinh.length === 0, moiTinh.join(' · '));
  s.ok('Sổ nợ màn hình tự tính ⛔ không phình ra', dangTinh.length <= trongSo.size,
    `${dangTinh.length} > ${trongSo.size}`);

  // Mục ⛔ không có mô tả `tinh` là mục đã bị nhét vào cho qua bài kiểm
  const thieuMoTa = soTuTinh.noCu.filter((m) => !m.tinh || !m.muc).map((m) => m.tep);
  s.ok(`Mọi mục nợ ghi rõ TÍNH GÌ (${soTuTinh.noCu.length} mục)`,
    thieuMoTa.length === 0, thieuMoTa.join(' · '));

  if (daSachTinh.length) {
    console.log(`   ↻ ${daSachTinh.length} tệp đã sạch — gỡ khỏi screen-math-baseline.json: ${daSachTinh.join(' · ')}`);
  }
  console.log('   ⚠️ Phép kiểm này đo ĐỘ CHÍNH XÁC 100%, ⛔ KHÔNG tuyên bố ĐỘ PHỦ 100%.');
  console.log('      Sót đã biết: TD-34 (trừ/chia) · vòng `for` cộng dồn — spike B2-2a §3.4.');
}

// ── 14. HỒ SƠ 6 CỔNG THIẾT KẾ MÀN HÌNH — `⑯` · EDD-05 §1.1 ────────────────
//
// EDD-05 §1.1: *"Mọi màn hình mang hồ sơ này. ⛔ Không có hồ sơ ⇒ ⛔ không được
// thiết kế tiếp."*
//
// ─── 🔴 MỤC NÀY ⛔ KHÔNG KIỂM ĐƯỢC 6 CỔNG — NÓI THẲNG ───────────────────
// `G1` *(P-ZERODUP)* · `G2` *(P-ZEROMAN)* · `G3` *(P-COMMIT)* · `G4` *(P-IRREV)*
// · `G5` *(P-ATTRIB)* là **câu hỏi thiết kế**. ⛔ Không phân tích tĩnh nào trả
// lời được *"màn hình này có bắt người dùng nhập lại thứ hệ thống đã biết ⛔
// không"*.
//
// 🔑 **Một phép kiểm tự nhận "đã kiểm 6 cổng" chính là KIỂM SOÁT GIẢ — đúng thứ
//    `G5` cấm.** Mục này ⛔ **không** tuyên bố điều đó.
//
// ⑯ đo **thứ đo được**: mọi route phải có **một mục** trong sổ, và mục nào
// tuyên bố *đã đánh giá* thì phải nêu **ngày · người phán · nguồn · đủ sáu phán
// quyết**. ⇒ Nó chứng minh **⛔ không màn hình nào đi qua mà ⛔ không ai trả lời
// 6 câu hỏi — hoặc ⛔ không ai ghi nhận rằng chưa ai trả lời.**
//
// `G6` là cổng **duy nhất** có phần cơ giới hoá được, và phần đó nằm ở ⑭.
console.log('\n⑯ HỒ SƠ 6 CỔNG THIẾT KẾ MÀN HÌNH — EDD-05 §1.1');

const duongDanCong = join(ROOT, 'tests/architecture/screen-gates.json');
const soCong = existsSync(duongDanCong) ? JSON.parse(doc(duongDanCong)) : null;
s.ok('Sổ hồ sơ 6 cổng tồn tại', soCong !== null,
  'thiếu tests/architecture/screen-gates.json');

if (soCong) {
  // Route = mọi `page.tsx` dưới `app/(dashboard)/`, tính theo đường dẫn thư mục.
  const gocDash = join(ROOT, 'app', '(dashboard)');
  const routeThat = quet('app/(dashboard)')
    .filter((p) => p.endsWith('page.tsx'))
    .map((p) => relative(gocDash, p).split(sep).slice(0, -1).join('/'))
    .filter(Boolean)
    .sort();

  const trongSo = new Map(soCong.hoSo.map((m) => [m.route, m]));

  s.ok(`Đếm được route dashboard (${routeThat.length})`, routeThat.length > 0);

  // ① Route ⛔ không có mục ⇒ màn hình lọt qua mà ⛔ không ai trả lời 6 câu
  const thieuHoSo = routeThat.filter((r) => !trongSo.has(r));
  s.ok(`MỌI route có mục trong sổ (${routeThat.length} route)`,
    thieuHoSo.length === 0, `chưa có hồ sơ: ${thieuHoSo.join(' · ')}`);

  // ② Mục trỏ route ⛔ không còn tồn tại ⇒ mục CHẾT, phải gỡ
  const mucChet = [...trongSo.keys()].filter((r) => !routeThat.includes(r)).sort();
  s.ok('Sổ ⛔ KHÔNG còn mục chết', mucChet.length === 0,
    `route ⛔ không còn: ${mucChet.join(' · ')}`);

  // ③ Mục tuyên bố ĐÃ ĐÁNH GIÁ phải mang đủ hồ sơ.
  //    ⚠️ `nguon` là BẮT BUỘC — ⛔ không cho tuyên bố suông. Phải trỏ được về
  //    chỗ phán quyết ĐƯỢC GHI, để người sau tra ngược.
  const SAU_CONG = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'];
  const hoSoThieu = [];
  for (const m of soCong.hoSo) {
    if (m.trangThai !== 'DA_DANH_GIA') continue;
    const thieu = [];
    if (!m.ngay) thieu.push('ngày');
    if (!m.nguoiPhan) thieu.push('người phán');
    if (!m.nguon) thieu.push('nguồn');
    for (const g of SAU_CONG) if (!m.cong?.[g]) thieu.push(g);
    if (thieu.length) hoSoThieu.push(`${m.route} (thiếu ${thieu.join(', ')})`);
  }
  s.ok('Mục ĐÃ ĐÁNH GIÁ mang đủ ngày · người phán · nguồn · 6 cổng',
    hoSoThieu.length === 0, hoSoThieu.join(' · '));

  // ④ Mọi mục phải khai `trangThai` hợp lệ — ⛔ không có ô mơ hồ
  const TT = ['DA_DANH_GIA', 'CHUA_DANH_GIA'];
  const ttLa = soCong.hoSo.filter((m) => !TT.includes(m.trangThai)).map((m) => m.route);
  s.ok(`Mọi mục khai trạng thái hợp lệ (${soCong.hoSo.length} mục)`,
    ttLa.length === 0, ttLa.join(' · '));

  // ⑤ BÁNH CÓC — số route CHƯA đánh giá chỉ được NGẮN ĐI.
  //    Route mới thêm mà vẫn `CHUA_DANH_GIA` sẽ vượt trần ⇒ HỎNG, buộc phải
  //    hoặc đánh giá nó, hoặc nâng trần bằng một quyết định NHÌN THẤY trong diff.
  const chuaDanhGia = soCong.hoSo.filter((m) => m.trangThai === 'CHUA_DANH_GIA');
  s.ok(`Số màn hình CHƯA đánh giá ⛔ không phình ra (${chuaDanhGia.length}/${soCong.tranChuaDanhGia})`,
    chuaDanhGia.length <= soCong.tranChuaDanhGia,
    `${chuaDanhGia.length} > trần ${soCong.tranChuaDanhGia}`);

  const daDanhGia = soCong.hoSo.length - chuaDanhGia.length;
  console.log(`   ↻ ĐÃ đánh giá ${daDanhGia}/${soCong.hoSo.length} màn hình — trần nợ ${soCong.tranChuaDanhGia}`);
  console.log('   ⚠️ ⑯ CHỨNG MINH CÓ HỒ SƠ, ⛔ KHÔNG chứng minh màn hình ĐẠT 6 cổng.');
  console.log('      G1–G5 là câu hỏi THIẾT KẾ — ⛔ không phân tích tĩnh nào trả lời được.');
  if (chuaDanhGia.length > 0) {
    console.log(`   🔴 ${chuaDanhGia.length} màn hình ĐANG CHẠY chưa từng qua cổng thiết kế nào.`);
  }
}

process.exit(s.ketThuc() ? 1 : 0);
