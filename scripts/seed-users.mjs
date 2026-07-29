#!/usr/bin/env node
// ============================================================================
// MONICA GARMENT ERP — Tạo tài khoản đăng nhập cho tất cả phòng ban
//
// CHẠY:  node scripts/seed-users.mjs
//        node scripts/seed-users.mjs --dry-run    (chỉ in ra, không ghi gì)
//        node scripts/seed-users.mjs --reset      (đặt lại mật khẩu tài khoản đã có)
//        node scripts/seed-users.mjs --prune      (XOÁ tài khoản của các đợt seed cũ)
//
// ⚠️ CẦN service_role key. Thêm vào .env.local:
//        SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
//    Lấy tại: Supabase Dashboard > Project Settings > API > service_role.
//
// ⚠️ KHÓA NÀY LÀ TOÀN QUYỀN, BỎ QUA MỌI RLS.
//    • TUYỆT ĐỐI không đặt tên biến bắt đầu bằng NEXT_PUBLIC_ — làm vậy là
//      đóng gói khoá toàn quyền vào bundle trình duyệt cho cả thế giới xem.
//    • Chỉ dùng trong script chạy tay như file này, không dùng trong app.
//    • .env.local đã nằm trong .gitignore, đừng commit nó.
//
// CHẠY MIGRATION 010 TRƯỚC khi chạy script này: script cần bảng roles và
// departments đã có dữ liệu để gán vai trò.
//
// Script chạy lại nhiều lần được: tài khoản đã tồn tại thì bỏ qua (hoặc đặt
// lại mật khẩu nếu có cờ --reset).
// ============================================================================

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ─── Đọc .env.local ──────────────────────────────────────────────────────────
function loadEnv(file = '.env.local') {
  try {
    const out = {};
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith('#')) continue;
      const i = s.indexOf('=');
      if (i < 0) continue;
      out[s.slice(0, i).trim()] = s.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
    return out;
  } catch {
    return {};
  }
}

const env = { ...loadEnv(), ...process.env };
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const DRY = process.argv.includes('--dry-run');
const RESET = process.argv.includes('--reset');
const PRUNE = process.argv.includes('--prune');

// ─── Mật khẩu mặc định ───────────────────────────────────────────────────────
// Người dùng BUỘC phải đổi ở lần đăng nhập đầu (cờ force_password_change),
// nên mật khẩu này chỉ sống được đúng một phiên.
const DEFAULT_PASSWORD = env.SEED_DEFAULT_PASSWORD || 'monica123';
const EMAIL_DOMAIN = env.SEED_EMAIL_DOMAIN || 'monica.vn';

// Các miền email của những đợt seed trước. Dùng cho cờ --prune để dọn tài
// khoản cũ khi đổi quy ước đặt tên, tránh để lại hai bộ tài khoản song song.
const LEGACY_DOMAINS = ['monicagarment.vn'];

// role phải trùng khớp type Role trong types/erp.ts và bảng public.roles
const USERS = [
  { local: 'admin001', name: 'Quản Trị Hệ Thống',     role: 'superadmin',  dept: 'IT',     code: 'IT-001' },
  { local: 'gd001',    name: 'Nguyễn Văn Giám Đốc',   role: 'giamdoc',     dept: 'BOD',    code: 'BOD-001' },
  { local: 'md001',    name: 'Trần Thị Merchandiser', role: 'md',          dept: 'MD',     code: 'MD-001' },
  { local: 'md002',    name: 'Lê Văn Thu Mua',        role: 'md',          dept: 'MD',     code: 'MD-002' },
  { local: 'kh001',    name: 'Đối Tác Khách Hàng',    role: 'buyer',       dept: 'SALES',  code: 'SL-001' },
  { local: 'kt001',    name: 'Phạm Thị Kế Toán',      role: 'ketoan',      dept: 'ACC',    code: 'ACC-001' },
  { local: 'kho001',   name: 'Hoàng Văn Thủ Kho',     role: 'kho',         dept: 'WH',     code: 'WH-001' },
  { local: 'kho002',   name: 'Đỗ Thị Kho Thành Phẩm', role: 'kho',         dept: 'WH',     code: 'WH-002' },
  { local: 'qa001',    name: 'Vũ Thị Chất Lượng',     role: 'qa',          dept: 'QA',     code: 'QA-001' },
  { local: 'cat001',   name: 'Bùi Văn Tổ Cắt',        role: 'totruongcat', dept: 'CUT',    code: 'CUT-001' },
  { local: 'may001',   name: 'Ngô Thị Tổ May',        role: 'totruongmay', dept: 'SEW',    code: 'SEW-001' },
  { local: 'ht001',    name: 'Đinh Văn Hoàn Thành',   role: 'hoanthanh',   dept: 'FIN',    code: 'FIN-001' },
  { local: 'sub001',   name: 'Xưởng Gia Công Ngoài',  role: 'subcon',      dept: 'SUBCON', code: 'SUB-001' },
];

// ─── Kiểm tra đầu vào ────────────────────────────────────────────────────────
if (!URL) {
  console.error('✖ Thiếu NEXT_PUBLIC_SUPABASE_URL trong .env.local');
  process.exit(1);
}
if (!SERVICE_KEY && !DRY) {
  console.error(`
✖ Thiếu SUPABASE_SERVICE_ROLE_KEY.

  Không có khoá này thì KHÔNG tạo được tài khoản: việc tạo user và ghi
  app_metadata (nơi chứa vai trò) chỉ làm được bằng service_role.

  Cách lấy:
    1. Supabase Dashboard > Project Settings > API
    2. Chép giá trị ở mục "service_role"  (KHÔNG phải "anon")
    3. Thêm vào .env.local:
         SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

  Muốn xem trước danh sách sẽ tạo mà chưa cần khoá:
         node scripts/seed-users.mjs --dry-run
`);
  process.exit(1);
}

if (SERVICE_KEY && SERVICE_KEY === env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('✖ SUPABASE_SERVICE_ROLE_KEY đang bằng đúng anon key. Chép nhầm rồi — cần khoá "service_role".');
  process.exit(1);
}

// ─── In bảng tài khoản ───────────────────────────────────────────────────────
console.log(`\nMONICA ERP — seed ${USERS.length} tài khoản  (miền: @${EMAIL_DOMAIN})`);
console.log(`Mật khẩu mặc định: ${DEFAULT_PASSWORD}   [buộc đổi ở lần đăng nhập đầu]\n`);
console.log('  ' + 'EMAIL'.padEnd(34) + 'VAI TRÒ'.padEnd(14) + 'HỌ TÊN');
console.log('  ' + '-'.repeat(78));
for (const u of USERS) {
  console.log('  ' + `${u.local}@${EMAIL_DOMAIN}`.padEnd(34) + u.role.padEnd(14) + u.name);
}
console.log('');

if (DRY) {
  console.log('— Chế độ --dry-run: không ghi gì vào cơ sở dữ liệu. —\n');
  process.exit(0);
}

// ─── Thực thi ────────────────────────────────────────────────────────────────
const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Tìm user theo email — phân trang vì listUsers mặc định chỉ trả 50 dòng */
async function findByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers lỗi: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Gọi lại tối đa 3 lần khi Supabase từ chối tạm thời.
 *
 * Lần chạy đầu tiên của đợt seed này bị lỗi cả 13 tài khoản với thân phản hồi
 * RỖNG (in ra thành "{}") — dấu hiệu điển hình của giới hạn tần suất trên
 * endpoint auth admin khi gọi liên tiếp. Chạy lại y nguyên thì thành công cả
 * 13. Vì vậy phải tự thử lại thay vì để người dùng đoán.
 */
async function withRetry(label, fn) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await fn();
    if (!error) return data;
    last = error;
    const detail = error.message || JSON.stringify(error);
    if (attempt < 3) {
      console.log(`      ${label}: lần ${attempt} lỗi (${detail}), thử lại sau ${attempt}s...`);
      await sleep(attempt * 1000);
    }
  }
  throw new Error(`${label}: ${last?.message || JSON.stringify(last)}`);
}

// Nạp sẵn id của roles / departments để gán quan hệ
const { data: roleRows, error: roleErr } = await admin.from('roles').select('id, code');
const { data: deptRows, error: deptErr } = await admin.from('departments').select('id, code');

if (roleErr || deptErr || !roleRows?.length) {
  console.error(`
✖ Chưa đọc được bảng roles/departments (${roleErr?.message || deptErr?.message || 'bảng rỗng'}).

  Nhiều khả năng bạn chưa chạy migration:
      supabase/migrations/010_auth_rbac_rls_lockdown.sql

  Hãy dán file đó vào Supabase Dashboard > SQL Editor > Run, rồi chạy lại script này.
`);
  process.exit(1);
}

const roleId = new Map(roleRows.map((r) => [r.code, r.id]));
const deptId = new Map((deptRows ?? []).map((d) => [d.code, d.id]));

let created = 0;
let updated = 0;
let skipped = 0;
let failed = 0;

for (const u of USERS) {
  const email = `${u.local}@${EMAIL_DOMAIN}`;

  if (!roleId.has(u.role)) {
    console.log(`  ✖ ${email.padEnd(34)} vai trò '${u.role}' không có trong bảng roles`);
    failed++;
    continue;
  }

  try {
    let user = await findByEmail(email);

    if (user && !RESET) {
      console.log(`  • ${email.padEnd(34)} đã tồn tại, bỏ qua`);
      skipped++;
    } else if (user && RESET) {
      await withRetry('updateUser', () => admin.auth.admin.updateUserById(user.id, {
        password: DEFAULT_PASSWORD,
        app_metadata: { role: u.role, department: u.dept },
        user_metadata: { full_name: u.name, employee_code: u.code, force_password_change: true },
      }));
      console.log(`  ↻ ${email.padEnd(34)} đã đặt lại mật khẩu + cờ đổi mật khẩu`);
      updated++;
    } else {
      const created_ = await withRetry('createUser', () => admin.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true, // nhà máy không dùng email thật để xác nhận
        app_metadata: { role: u.role, department: u.dept },
        user_metadata: { full_name: u.name, employee_code: u.code, force_password_change: true },
      }));
      user = created_.user;
      await sleep(250); // giãn nhịp, tránh chạm giới hạn tần suất
      console.log(`  ✔ ${email.padEnd(34)} đã tạo  [${u.role}]`);
      created++;
    }

    if (!user) continue;

    // Đồng bộ hồ sơ nhân sự. Trigger on_auth_user_created đã tạo dòng profiles,
    // ở đây bổ sung mã nhân viên và phòng ban.
    await admin.from('profiles').upsert(
      {
        id: user.id,
        full_name: u.name,
        employee_code: u.code,
        department_id: deptId.get(u.dept) ?? null,
        is_active: true,
      },
      { onConflict: 'id' },
    );

    await admin
      .from('user_roles')
      .upsert({ user_id: user.id, role_id: roleId.get(u.role) }, { onConflict: 'user_id,role_id' });
  } catch (e) {
    const detail = e?.message || JSON.stringify(e);
    const where = (e && e.stack ? String(e.stack).split(String.fromCharCode(10))[1] : '') || '';
    console.log(`  ✖ ${email.padEnd(34)} ${detail}`);
    if (where) console.log(`      tại ${where}`);
    failed++;
  }
}

// ─── Dọn tài khoản của đợt seed cũ ──────────────────────────────────────────
// Đổi quy ước đặt tên email mà không dọn thì hệ thống còn lại hai bộ tài khoản
// song song, cùng vai trò — quản trị viên rất dễ khoá nhầm hoặc cấp nhầm.
let pruned = 0;
if (PRUNE && failed > 0) {
  // Không bao giờ xoá tài khoản cũ khi bộ mới chưa dựng xong: làm vậy là để hệ
  // thống trắng tài khoản, không ai đăng nhập được nữa.
  console.log(`
  BỎ QUA --prune: còn ${failed} tài khoản mới tạo lỗi.`);
  console.log('  Chạy lại script cho tới khi 0 lỗi rồi mới dọn được bộ cũ.');
} else if (PRUNE) {
  const keep = new Set(USERS.map((u) => `${u.local}@${EMAIL_DOMAIN}`.toLowerCase()));
  const { data: all, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (listErr) {
    console.log(`\n  Khong liet ke duoc tai khoan de don: ${listErr.message}`);
  } else {
    const victims = all.users.filter((u) => {
      const mail = (u.email ?? '').toLowerCase();
      if (!mail || keep.has(mail)) return false;
      const domain = mail.split('@')[1] ?? '';
      return LEGACY_DOMAINS.includes(domain);
    });

    if (victims.length === 0) {
      console.log('\n  Khong co tai khoan cu nao can don.');
    } else {
      console.log(`\n  Don ${victims.length} tai khoan thuoc mien cu (${LEGACY_DOMAINS.join(', ')}):`);
      for (const v of victims) {
        const { error } = await admin.auth.admin.deleteUser(v.id);
        if (error) console.log(`    [loi] ${v.email} - ${error.message}`);
        else { console.log(`    [da xoa] ${v.email}`); pruned++; }
      }
    }
  }
} else {
  console.log('\n  (Chua dung --prune: tai khoan cua cac dot seed truoc van con nguyen.)');
}

console.log(`
Xong: ${created} tao moi | ${updated} dat lai | ${skipped} bo qua | ${failed} loi | ${pruned} da don`);

if (created > 0 || updated > 0) {
  console.log(`
Bước tiếp theo:
  1. Đăng nhập thử tại /login bằng một tài khoản bất kỳ ở trên.
  2. Hệ thống sẽ ép sang /update-password ngay — đó là hành vi đúng.
  3. Sau khi đổi, người dùng vào thẳng phân hệ của bộ phận mình.

Nhắc: mật khẩu mặc định '${DEFAULT_PASSWORD}' giống nhau cho mọi tài khoản.
Hãy gửi riêng cho từng người, đừng dán chung vào nhóm chat.
`);
}
