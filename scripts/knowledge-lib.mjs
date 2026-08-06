// ============================================================================
// KNOWLEDGE SYSTEM — thư viện dùng chung
//
// Một nơi duy nhất đọc và dựng `docs/knowledge/objects/`. Cả bộ sinh chỉ mục
// (`scripts/build-knowledge-index.mjs`) lẫn phép kiểm toàn vẹn
// (`tests/governance/knowledge-objects.test.mjs`) đều gọi vào đây.
//
// ⚠️ CỐ Ý KHÔNG DÙNG THƯ VIỆN YAML. Kho ⛔ không có sẵn thư viện nào, và thêm
// một phụ thuộc chỉ để đọc siêu dữ liệu tài liệu là cái giá sai — ADR-023 §4.2.
// Bù lại, khuôn `related:` cố ý hẹp (SCHEMA §4.3) để bộ phân tích ⛔ không mơ hồ.
//
// 🔴 LƯỢC ĐỒ MỚI LÀ LUẬT — `docs/knowledge/SCHEMA.md`. Tệp này chỉ là RĂNG.
//    Hai bên lệch nhau ⇒ SCHEMA THẮNG, và tệp này phải sửa.
// ============================================================================
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const THU_MUC_DOI_TUONG = join(ROOT, 'docs/knowledge/objects');
export const DUONG_DAN_INDEX = join(ROOT, 'docs/knowledge/INDEX.md');

// ── Bảy loại — SCHEMA §1.1 ─────────────────────────────────────────────────
export const LOAI = {
  PRN: { type: 'Principle', thuMuc: 'principle', nhan: 'Principle' },
  DEC: { type: 'Decision', thuMuc: 'decision', nhan: 'Decision' },
  RUL: { type: 'Rule', thuMuc: 'rule', nhan: 'Rule' },
  REF: { type: 'Reference', thuMuc: 'reference', nhan: 'Reference' },
  LIM: { type: 'Limitation', thuMuc: 'limitation', nhan: 'Limitation' },
  PEN: { type: 'PendingDecision', thuMuc: 'pending', nhan: 'Pending Decision' },
  ADR: { type: 'AdrReference', thuMuc: 'adr', nhan: 'ADR Reference' },
};

export const TRUONG_BAT_BUOC = [
  'id', 'type', 'title', 'category', 'status',
  'source', 'approved_by', 'date', 'tier', 'related',
];

// ── Trạng thái hợp lệ theo loại — SCHEMA §3.1 ──────────────────────────────
const CHUAN = ['PROPOSED', 'UNDER_REVIEW', 'PENDING_BOARD', 'ADOPTED', 'SUPERSEDED', 'REJECTED'];
export const TRANG_THAI_THEO_LOAI = {
  Principle: CHUAN,
  Decision: CHUAN,
  Rule: CHUAN,
  AdrReference: CHUAN,
  Reference: ['ADOPTED', 'SUPERSEDED'],
  Limitation: ['OPEN', 'ACCEPTED', 'CLOSED'],
  PendingDecision: ['PENDING_BOARD', 'UNDER_REVIEW', 'CLOSED', 'REJECTED'],
};

export const NGUOI_DUYET = ['Board', 'CSA', 'Chưa có'];

// ── Bậc ADR-010 — số NHỎ = quyền CAO ───────────────────────────────────────
export const BAC = { '0': 0, "0'": 0.5, '1': 1, '2': 2, "2'": 2.5, '3': 3, '4': 4, '5': 5, '6': 6 };

// ── Chín vị từ ghi được + nghịch đảo do máy sinh — SCHEMA §4 ────────────────
export const NGHICH_DAO = {
  derives_from: 'grounds',
  implements: 'implemented_by',
  constrains: 'constrained_by',
  depends_on: 'required_by',
  supersedes: 'superseded_by',
  blocks: 'blocked_by',
  evidenced_by: 'evidence_for',
  refines: 'refined_by',
  conflicts_with: 'conflicts_with',   // đối xứng
};
export const VI_TU = Object.keys(NGHICH_DAO);

// Vị từ chịu luật bậc (bất biến thức ⑥): ⛔ không được vượt quyền nguồn.
export const VI_TU_CHIU_LUAT_BAC = ['constrains', 'supersedes'];

// ============================================================================
// ĐỌC — bộ phân tích frontmatter tối giản
// ============================================================================

/** Tách frontmatter và thân. Trả `{ loi }` nếu khuôn sai. */
export function phanTich(noiDung, duongDanTuongDoi) {
  const dong = noiDung.replace(/\r\n/g, '\n').split('\n');
  if (dong[0] !== '---') return { loi: 'thiếu `---` ở dòng 1' };
  const dongDong = dong.indexOf('---', 1);
  if (dongDong === -1) return { loi: 'thiếu `---` đóng khối frontmatter' };

  const meta = { related: [] };
  let trongRelated = false;

  for (let i = 1; i < dongDong; i++) {
    const d = dong[i];
    if (d.trim() === '') continue;

    if (trongRelated) {
      const m = d.match(/^ {2}- ([a-z_]+): (KO-[A-Z]{3}-\d{3})$/);
      if (m) { meta.related.push({ viTu: m[1], dich: m[2] }); continue; }
      if (/^ /.test(d)) return { loi: `dòng ${i + 1}: khuôn \`related\` sai — phải là "  - <vị từ>: KO-XXX-NNN"` };
      trongRelated = false;
    }

    const m = d.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) return { loi: `dòng ${i + 1}: ⛔ không phân tích được "${d}"` };
    const [, khoa, giaTri] = m;
    if (khoa === 'related') {
      if (giaTri.trim() === '[]') continue;
      if (giaTri.trim() !== '') return { loi: 'khuôn `related` sai — chỉ chấp nhận `[]` hoặc khối gạch đầu dòng' };
      trongRelated = true;
      continue;
    }
    meta[khoa] = giaTri.trim();
  }

  return {
    meta,
    than: dong.slice(dongDong + 1).join('\n'),
    soDongThan: dong.length - dongDong - 1,
    tep: duongDanTuongDoi,
  };
}

/** Nạp toàn bộ đối tượng. Trả `{ doiTuong[], loi[] }` — ⛔ không ném. */
export function napDoiTuong() {
  const doiTuong = [];
  const loi = [];
  if (!existsSync(THU_MUC_DOI_TUONG)) return { doiTuong, loi: ['⛔ không có docs/knowledge/objects/'] };

  for (const thuMuc of readdirSync(THU_MUC_DOI_TUONG)) {
    const duong = join(THU_MUC_DOI_TUONG, thuMuc);
    for (const ten of readdirSync(duong).filter((f) => f.endsWith('.md'))) {
      const tuongDoi = `docs/knowledge/objects/${thuMuc}/${ten}`;
      const kq = phanTich(readFileSync(join(duong, ten), 'utf8'), tuongDoi);
      if (kq.loi) { loi.push(`${tuongDoi}: ${kq.loi}`); continue; }
      doiTuong.push({ ...kq, thuMuc, tenTep: basename(ten, '.md') });
    }
  }
  doiTuong.sort((a, b) => (a.meta.id || '').localeCompare(b.meta.id || ''));
  return { doiTuong, loi };
}

/** Chiều nghịch do máy sinh — ⛔ KHÔNG tệp nào được ghi tay (SCHEMA §4.2). */
export function dungChieuNghich(doiTuong) {
  const nghich = new Map();
  for (const o of doiTuong) {
    for (const { viTu, dich } of o.meta.related) {
      const ten = NGHICH_DAO[viTu];
      if (!ten) continue;
      if (!nghich.has(dich)) nghich.set(dich, []);
      nghich.get(dich).push({ viTu: ten, dich: o.meta.id });
    }
  }
  return nghich;
}

// ============================================================================
// DỰNG CHỈ MỤC — hàm này là nguồn duy nhất của nội dung INDEX.md
// ============================================================================
export function dungChiMuc(doiTuong) {
  const nghich = dungChieuNghich(doiTuong);
  const d = [];
  const p = (s = '') => d.push(s);

  p('# KNOWLEDGE INDEX — chỉ mục sinh tự động');
  p();
  p('> 🤖 **TỆP NÀY DO MÁY SINH — ⛔ ĐỪNG SỬA TAY.**');
  p('> Sinh lại bằng `npm run knowledge`. Sửa tay sẽ bị phép kiểm ⑧ của');
  p('> [`tests/governance/knowledge-objects.test.mjs`](../../tests/governance/knowledge-objects.test.mjs) bắt.');
  p('>');
  p('> Chỉ mục này ⛔ **không** phải nguồn tri thức. Nguồn nằm ở trường `source`');
  p('> của từng đối tượng, bậc 0–4 — `README.md` §2.');
  p();
  p('---');
  p();

  // ── §1 · Board cần quyết gì — đặt ĐẦU TIÊN có chủ ý ──────────────────────
  const cho = doiTuong.filter((o) => o.meta.status === 'PENDING_BOARD');
  p('## §1 · 🔴 BOARD CẦN QUYẾT GÌ');
  p();
  if (cho.length === 0) {
    p('✅ ⛔ Không mục nào đang chờ Board.');
  } else {
    p(`🔴 **${cho.length} mục đang chờ Board phán quyết.**`);
    p();
    p('| ID | Tiêu đề | Loại | Từ ngày | Bị chặn bởi |');
    p('|---|---|---|---|---|');
    for (const o of cho) {
      const chan = (nghich.get(o.meta.id) || []).filter((r) => r.viTu === 'blocked_by').map((r) => r.dich);
      p(`| [\`${o.meta.id}\`](${duong(o)}) | ${o.meta.title} | ${nhanLoai(o)} | ${o.meta.date} | ${chan.length ? chan.map((c) => `\`${c}\``).join(' · ') : '—'} |`);
    }
  }
  p();

  // ── §2 · Thống kê ────────────────────────────────────────────────────────
  p('## §2 · THỐNG KÊ');
  p();
  p(`**Tổng: ${doiTuong.length} đối tượng.**`);
  p();
  p('| Loại | Số lượng | Trạng thái |');
  p('|---|---|---|');
  for (const [ma, l] of Object.entries(LOAI)) {
    const nhom = doiTuong.filter((o) => o.meta.type === l.type);
    const dem = {};
    for (const o of nhom) dem[o.meta.status] = (dem[o.meta.status] || 0) + 1;
    const mo = Object.entries(dem).map(([k, v]) => `${k} ×${v}`).join(' · ') || '—';
    p(`| ${l.nhan} \`KO-${ma}\` | ${nhom.length} | ${mo} |`);
  }
  p();

  // ── §3 · Sổ đăng ký đầy đủ ───────────────────────────────────────────────
  p('## §3 · SỔ ĐĂNG KÝ');
  p();
  p('| ID | Tiêu đề | Category | Status | Approved By | Date | Bậc | Phản chiếu |');
  p('|---|---|---|---|---|---|---|---|');
  for (const o of doiTuong) {
    const m = o.meta;
    p(`| [\`${m.id}\`](${duong(o)}) | ${m.title} | ${m.category} | ${m.status} | ${m.approved_by} | ${m.date} | ${m.tier} | ${m.mirrors || '—'} |`);
  }
  p();

  // ── §4 · Đồ thị quan hệ ──────────────────────────────────────────────────
  p('## §4 · ĐỒ THỊ QUAN HỆ');
  p();
  p('> Dòng **thuận** ghi trong tệp đối tượng. Dòng *nghịch* ⛔ **không** ghi ở đâu cả —');
  p('> máy dựng từ chiều thuận mỗi lần sinh chỉ mục *(SCHEMA §4.2)*.');
  p();
  for (const o of doiTuong) {
    const thuan = o.meta.related;
    const nguoc = nghich.get(o.meta.id) || [];
    if (!thuan.length && !nguoc.length) continue;
    p(`### \`${o.meta.id}\` — ${o.meta.title}`);
    p();
    for (const r of thuan) p(`- **${r.viTu}** → \`${r.dich}\``);
    for (const r of nguoc) p(`- *${r.viTu}* ← \`${r.dich}\``);
    p();
  }

  p('---');
  p();
  p('*Sinh bởi `scripts/build-knowledge-index.mjs`. ⛔ Đừng sửa tay.*');
  return d.join('\n') + '\n';
}

function duong(o) { return `objects/${o.thuMuc}/${o.tenTep}.md`; }
function nhanLoai(o) {
  const l = Object.values(LOAI).find((x) => x.type === o.meta.type);
  return l ? l.nhan : o.meta.type;
}
