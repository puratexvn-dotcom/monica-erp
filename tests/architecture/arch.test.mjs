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

process.exit(s.ketThuc() ? 1 : 0);
