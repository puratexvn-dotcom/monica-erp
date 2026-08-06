// ============================================================================
// PHÉP KIỂM TOÀN VẸN KNOWLEDGE SYSTEM — chín bất biến thức
//
// Cưỡng chế `docs/knowledge/SCHEMA.md` §5. ⛔ Không cần CSDL ⇒ chạy được ở mọi
// nơi, kể cả CI ⛔ không bí mật. Chạy trong `npm test` và `npm run test:arch`.
//
// 🔴 BẤT BIẾN THỨC ⑥ LÀ MỤC QUAN TRỌNG NHẤT: một đối tượng ⛔ KHÔNG được ràng
//    buộc hay thay thế thứ có thẩm quyền CAO HƠN nguồn của chính nó. ⛔ Không có
//    mục này, tuyên bố "Knowledge Object là chỉ mục, ⛔ không phải nguồn" chỉ là
//    văn xuôi — và hệ thống sẽ thành bộ luật thứ tám (ADR-023 §2.2).
//
// ⚠️ LƯỢC ĐỒ MỚI LÀ LUẬT. Tệp này lệch `SCHEMA.md` ⇒ SCHEMA THẮNG, sửa tệp này.
// ============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT, DUONG_DAN_INDEX, LOAI, TRUONG_BAT_BUOC, TRANG_THAI_THEO_LOAI,
  NGUOI_DUYET, BAC, VI_TU, VI_TU_CHIU_LUAT_BAC,
  napDoiTuong, dungChiMuc, dungChieuNghich,
} from '../../scripts/knowledge-lib.mjs';

const TRAN_DONG_THAN = 60;   // SCHEMA §6 — đối tượng dài hơn thế ⛔ không phải chỉ mục nữa

let dat = 0;
const hong = [];
function ok(ten, dieuKien, chiTiet = '') {
  if (dieuKien) { dat++; return; }
  hong.push(`${ten}${chiTiet ? `  → ${chiTiet}` : ''}`);
  console.log(`  ⛔ ${ten}${chiTiet ? `\n       ${chiTiet}` : ''}`);
}

console.log('═'.repeat(78));
console.log('KNOWLEDGE SYSTEM — toàn vẹn đối tượng · SCHEMA.md §5');
console.log('═'.repeat(78));

const { doiTuong, loi } = napDoiTuong();

// Khuôn frontmatter hỏng ⇒ ⛔ không kiểm tiếp được gì cả. Dừng sớm, nói rõ.
if (loi.length) {
  console.log('\n⛔ ⛔ KHÔNG phân tích được frontmatter:');
  for (const l of loi) console.log(`   · ${l}`);
  console.log('\nLược đồ: docs/knowledge/SCHEMA.md §2 · §4.3');
  process.exit(1);
}

console.log(`\nĐã nạp ${doiTuong.length} đối tượng.\n`);
ok('Có đối tượng để kiểm', doiTuong.length > 0, 'docs/knowledge/objects/ rỗng');

const theoId = new Map(doiTuong.map((o) => [o.meta.id, o]));

// ── ① TÊN TỆP ⟷ id ⟷ type ⟷ THƯ MỤC ───────────────────────────────────────
console.log('① DANH TÍNH — tên tệp ⟷ id ⟷ type ⟷ thư mục');
for (const o of doiTuong) {
  const { meta, tenTep, tep } = o;
  const m = tenTep.match(/^(KO-(PRN|DEC|RUL|REF|LIM|PEN|ADR)-\d{3})-[a-z0-9-]+$/);
  ok(`${tep} — khuôn tên tệp`, !!m, 'phải là KO-<TYPE>-<NNN>-<slug-khong-dau>.md');
  if (!m) continue;
  ok(`${tep} — id khớp tên tệp`, meta.id === m[1], `id=${meta.id} ⟷ tệp=${m[1]}`);
  const l = LOAI[m[2]];
  ok(`${tep} — type khớp tiền tố`, meta.type === l.type, `type=${meta.type}, chờ ${l.type}`);
  ok(`${tep} — thư mục khớp loại`, o.thuMuc === l.thuMuc, `nằm ở ${o.thuMuc}/, chờ ${l.thuMuc}/`);
}

// ── ② ĐỦ TRƯỜNG · id DUY NHẤT ──────────────────────────────────────────────
console.log('② SIÊU DỮ LIỆU — đủ 10 trường · id duy nhất');
for (const o of doiTuong) {
  for (const t of TRUONG_BAT_BUOC) {
    const co = t === 'related' ? Array.isArray(o.meta.related) : !!(o.meta[t] || '').trim?.();
    ok(`${o.tep} — có trường \`${t}\``, co);
  }
  ok(`${o.tep} — \`date\` ISO`, /^\d{4}-\d{2}-\d{2}$/.test(o.meta.date || ''), o.meta.date);
  ok(`${o.tep} — \`tier\` hợp lệ`, o.meta.tier in BAC, `tier=${o.meta.tier}`);
}
const ids = doiTuong.map((o) => o.meta.id);
const trung = ids.filter((x, i) => ids.indexOf(x) !== i);
ok('id duy nhất toàn kho', trung.length === 0, [...new Set(trung)].join(' · '));

// ── ③ TRẠNG THÁI ⟷ NGƯỜI DUYỆT — răng chống TỰ PHONG ───────────────────────
console.log('③ THẨM QUYỀN — trạng thái hợp lệ · ⛔ không tự phong');
for (const o of doiTuong) {
  const { id, type, status, approved_by: nguoi } = o.meta;
  const chophep = TRANG_THAI_THEO_LOAI[type] || [];
  ok(`${id} — status hợp lệ cho ${type}`, chophep.includes(status), `${status} ∉ [${chophep.join(' ')}]`);
  ok(`${id} — approved_by hợp lệ`, NGUOI_DUYET.includes(nguoi), `"${nguoi}"`);
  if (status === 'ADOPTED')
    ok(`${id} — ADOPTED phải có người duyệt`, nguoi !== 'Chưa có',
      '🔴 tri thức TỰ PHONG đã ban hành — SCHEMA §3.2');
  if (status === 'PENDING_BOARD')
    ok(`${id} — PENDING_BOARD phải là "Chưa có"`, nguoi === 'Chưa có',
      `🔴 mục chờ Board mà đã ghi approved_by=${nguoi} — nó CHE MẤT một mục đang chờ`);
}

// ── ④ NGUỒN CÓ THẬT — chống tri thức MẤT GỐC ───────────────────────────────
console.log('④ NGUỒN — mọi đường dẫn trong `source` tồn tại thật');
for (const o of doiTuong) {
  for (const phan of (o.meta.source || '').split('·').map((s) => s.trim()).filter(Boolean)) {
    // ⚠️ Literal "Board …" phải xét TRƯỚC đường dẫn. `Board Directive 06/08/2026`
    // có dấu `/` trong NGÀY THÁNG — xét đường dẫn trước thì nó bị coi là tệp và
    // báo "mất gốc" oan. Chính phép kiểm này bắt được lỗi đó của chính nó.
    if (/^Board\b/.test(phan)) { dat++; continue; }
    const duong = phan.split('#')[0].trim();
    ok(`${o.meta.id} — nguồn \`${duong}\` tồn tại`,
      duong.includes('/') && existsSync(join(ROOT, duong)),
      duong.includes('/')
        ? '🔴 tri thức MẤT GỐC — nguồn đã bị xoá hoặc đổi tên'
        : 'chỉ chấp nhận đường dẫn có thật hoặc literal bắt đầu bằng "Board"');
  }
}

// ── ⑤ QUAN HỆ — vị từ đóng · ⛔ không treo · ⛔ không tự trỏ ────────────────
console.log('⑤ QUAN HỆ — vị từ đóng · đích có thật · ⛔ không tự trỏ');
for (const o of doiTuong) {
  const daThay = new Set();
  for (const { viTu, dich } of o.meta.related) {
    ok(`${o.meta.id} — vị từ \`${viTu}\` được phép`, VI_TU.includes(viTu),
      `⛔ không thuộc 9 vị từ ghi được — SCHEMA §4.1 (nghịch đảo do MÁY sinh, ⛔ không ghi tay)`);
    ok(`${o.meta.id} — \`${viTu}: ${dich}\` trỏ tới đối tượng có thật`, theoId.has(dich),
      '🔴 QUAN HỆ TREO — đồ thị đang nói dối');
    ok(`${o.meta.id} — ⛔ không tự trỏ`, dich !== o.meta.id);
    const khoa = `${viTu}:${dich}`;
    ok(`${o.meta.id} — ⛔ không lặp \`${khoa}\``, !daThay.has(khoa));
    daThay.add(khoa);
  }
}

// ── ⑥ 🔴 ⛔ KHÔNG ĐƯỢC VƯỢT QUYỀN NGUỒN — bất biến thức hiến định ───────────
console.log('⑥ 🔴 THẨM QUYỀN — đối tượng ⛔ không được vượt bậc nguồn của nó');
for (const o of doiTuong) {
  for (const { viTu, dich } of o.meta.related) {
    if (!VI_TU_CHIU_LUAT_BAC.includes(viTu)) continue;
    const kia = theoId.get(dich);
    if (!kia) continue;
    const bacMinh = BAC[o.meta.tier], bacKia = BAC[kia.meta.tier];
    ok(`${o.meta.id} \`${viTu}\` ${dich} — ⛔ không vượt quyền`, bacKia >= bacMinh,
      `🔴 bậc ${o.meta.tier} ⛔ KHÔNG được ${viTu} bậc ${kia.meta.tier} (cao quyền hơn). `
      + 'Cần điều đó ⇒ TU CHÍNH HIẾN PHÁP theo Điều 42, ⛔ không phải sửa Knowledge Object.');
  }
}

// ── ⑦ THÂN — chỉ mục, ⛔ không phải bản sao của nguồn ───────────────────────
console.log('⑦ THÂN — ≤ 60 dòng · có mục bắt buộc');
for (const o of doiTuong) {
  ok(`${o.meta.id} — thân ≤ ${TRAN_DONG_THAN} dòng`, o.soDongThan <= TRAN_DONG_THAN,
    `${o.soDongThan} dòng — dài thế này thì nó là NGUỒN, và nguồn thuộc bậc 0–4`);
  ok(`${o.meta.id} — có \`## Phát biểu\``, /^## Phát biểu$/m.test(o.than));
  ok(`${o.meta.id} — có \`## Nguồn đầy đủ\``, /^## Nguồn đầy đủ$/m.test(o.than),
    'thiếu mục này ⇒ ⛔ không ai biết toàn văn ở đâu');
}

// ── ⑧ CHỈ MỤC ĐỒNG BỘ ──────────────────────────────────────────────────────
console.log('⑧ CHỈ MỤC — INDEX.md đồng bộ với objects/');
if (!existsSync(DUONG_DAN_INDEX)) {
  ok('INDEX.md tồn tại', false, 'chạy `npm run knowledge`');
} else {
  const tren = readFileSync(DUONG_DAN_INDEX, 'utf8').replace(/\r\n/g, '\n');
  ok('INDEX.md khớp objects/', tren === dungChiMuc(doiTuong),
    'chỉ mục LỖI THỜI ⇒ Board rà soát trên bản cũ mà ⛔ không biết. Chạy `npm run knowledge`');
}

// ── ⑨ ⛔ KHÔNG MỒ CÔI — trừ Reference ───────────────────────────────────────
console.log('⑨ ĐỒ THỊ — ⛔ không đối tượng nào mồ côi (trừ Reference)');
const nghich = dungChieuNghich(doiTuong);
for (const o of doiTuong) {
  if (o.meta.type === 'Reference') continue;
  const bac = o.meta.related.length + (nghich.get(o.meta.id) || []).length;
  ok(`${o.meta.id} — có ít nhất một quan hệ`, bac > 0,
    'tri thức rời rạc ⇒ đúng cái bệnh "tài liệu tuyến tính" mà Board đã bác');
}

// ── TÓM TẮT ────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(78));
console.log(`✅ ${dat} phép đo đạt · ${hong.length ? `⛔ ${hong.length} HỎNG` : '⛔ 0 hỏng'}`);
console.log('═'.repeat(78));
if (hong.length) {
  console.log('\nDanh sách hỏng:');
  for (const h of hong) console.log(`  ⛔ ${h}`);
  console.log('\nLược đồ chuẩn tắc: docs/knowledge/SCHEMA.md §5');
  process.exit(1);
}
console.log('⚠️ Phép kiểm này bắt được ĐƯỜNG DẪN CHẾT, ⛔ KHÔNG bắt được NỘI DUNG LỆCH.');
console.log('   Đối tượng ⟷ nguồn lệch nội dung ⇒ NGUỒN THẮNG (nợ `TD-KS2`).');
process.exit(0);
