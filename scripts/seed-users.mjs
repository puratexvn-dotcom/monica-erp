#!/usr/bin/env node
// ============================================================================
// MONICA GARMENT ERP — Tạo tài khoản đăng nhập cho tất cả phòng ban
//
// CHẠY:  node scripts/seed-users.mjs
//        node scripts/seed-users.mjs --dry-run    (chỉ in ra, không ghi gì)
//        node scripts/seed-users.mjs --reset      (đặt lại mật khẩu tài khoản đã có)
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

// ─── Mật khẩu mặc định ───────────────────────────────────────────────────────
// Người dùng BUỘC phải đổi ở lần đăng nhập đầu (cờ force_password_change),
// nên mật khẩu này chỉ sống được đúng một phiên.
const DEFAULT_PASSWORD = env.SEED_DEFAULT_PASSWORD || 'Monica@2026';
const EMAIL_DOMAIN = env.SEED_EMAIL_DOMAIN || 'monicagarment.vn';

// role phải trùng khớp type Role trong types/erp.ts và bảng public.roles
const USERS = [
  { local: 'admin',      name: 'Quản Trị Hệ Thống',      role: 'superadmin',  dept: 'IT',     code: 'IT-001' },
  { local: 'giamdoc',    name: 'Nguyễn Văn Giám Đốc',    role: 'giamdoc',     dept: 'BOD',    code: 'BOD-001' },
  { local: 'md',         name: 'Trần Thị Merchandiser',  role: 'md',          dept: 'MD',     code: 'MD-001' },
  { local: 'md2',        name: 'Lê Văn Thu Mua',         role: 'md',          dept: 'MD',     code: 'MD-002' },
  { local: 'buyer',      name: 'Đối Tác Khách Hàng',     role: 'buyer',       dept: 'SALES',  code: 'SL-001' },
  { local: 'ketoan',     name: 'Phạm Thị Kế Toán',       role: 'ketoan',      dept: 'ACC',    code: 'ACC-001' },
  { local: 'kho',        name: 'Hoàng Văn Thủ Kho',      role: 'kho',         dept: 'WH',     code: 'WH-001' },
  { local: 'kho2',       name: 'Đỗ Thị Kho Thành Phẩm',  role: 'kho',         dept: 'WH',     code: 'WH-002' },
  { local: 'qa',         name: 'Vũ Thị Chất Lượng',      role: 'qa',          dept: 'QA',     code: 'QA-001' },
  { local: 'totruongcat', name: 'Bùi Văn Tổ Cắt',        role: 'totruongcat', dept: 'CUT',    code: 'CUT-001' },
  { local: 'totruongmay', name: 'Ngô Thị Tổ May',        role: 'totruongmay', dept: 'SEW',    code: 'SEW-001' },
  { local: 'hoanthanh',  name: 'Đinh Văn Hoàn Thành',    role: 'hoanthanh',   dept: 'FIN',    code: 'FIN-001' },
  { local: 'subcon',     name: 'Xưởng Gia Công Ngoài',   role: 'subcon',      dept: 'SUBCON', code: 'SUB-001' },
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
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        password: DEFAULT_PASSWORD,
        app_metadata: { role: u.role, department: u.dept },
        user_metadata: { full_name: u.name, employee_code: u.code, force_password_change: true },
      });
      if (error) throw new Error(error.message);
      console.log(`  ↻ ${email.padEnd(34)} đã đặt lại mật khẩu + cờ đổi mật khẩu`);
      updated++;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true, // nhà máy không dùng email thật để xác nhận
        app_metadata: { role: u.role, department: u.dept },
        user_metadata: { full_name: u.name, employee_code: u.code, force_password_change: true },
      });
      if (error) throw new Error(error.message);
      user = data.user;
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
    console.log(`  ✖ ${email.padEnd(34)} ${e.message}`);
    failed++;
  }
}

console.log(`\nXong: ${created} tạo mới · ${updated} đặt lại · ${skipped} bỏ qua · ${failed} lỗi`);

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
