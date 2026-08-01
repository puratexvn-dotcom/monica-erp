// ============================================================================
// BỘ KHUNG DÙNG CHUNG CHO MỌI BÀI KIỂM
//
// ─── VÌ SAO TỆP NÀY TỒN TẠI ───────────────────────────────────────────────
//
// Toàn bộ bài kiểm bảo mật của Monica MOS từng nằm trong MỘT THƯ MỤC TẠM của
// máy lập trình viên. Chúng chứng minh 031a/031b/031c an toàn — và nếu thư mục
// ấy bị dọn, năng lực chứng minh biến mất cùng nó.
//
// Enterprise Architecture Audit 03/08/2026 xếp việc đó là **P0**: không phải
// vì bài kiểm sai, mà vì **không ai ngoài người viết chạy lại được**.
//
// ─── BỐN QUY TẮC MỌI BÀI KIỂM PHẢI THEO ───────────────────────────────────
//
// K-1 · Bảng chỉ-ghi-thêm kiểm bằng LƯỢC ĐỒ, không bằng ghi thử.
//       Ghi vào sổ cái là CỬA MỘT CHIỀU — xoá không được, kể cả service_role.
//
// K-2 · KHÔNG đo quyền GHI bằng cách GHI bừa. Gửi bản ghi HỢP LỆ và ĐẦY ĐỦ;
//       nếu lọt thì phát hiện chắc chắn và dọn ngay.
//
// K-3 · Policy không được truy vấn bảng mà chính người gọi không đọc được.
//       Và: mỗi kịch bản phải có ÍT NHẤT MỘT vai CHỜ THẤY > 0 — bài kiểm chỉ
//       gồm những vai chờ 0 không phân biệt được "khoanh đúng" với "chặn hết".
//
// V.1 · Không kết luận trên bảng RỖNG. Ghi `⚪ chưa đo được`, không ghi `⛔`.
// ============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '..', '..');

/** Đọc `.env.local`, rồi để biến môi trường thật ĐÈ LÊN — CI không có tệp. */
export function loadEnv() {
  const f = resolve(ROOT, '.env.local');
  const fromFile = existsSync(f)
    ? Object.fromEntries(
        readFileSync(f, 'utf8')
          .split(/\r?\n/)
          .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
          .map((l) => {
            const i = l.indexOf('=');
            return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
          }),
      )
    : {};
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || fromFile.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fromFile.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || fromFile.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Bài kiểm cần cơ sở dữ liệu thì gọi hàm này TRƯỚC.
 *
 * ⚠️ Thiếu thông tin kết nối thì BỎ QUA CÓ TUYÊN BỐ (mã thoát 0) chứ KHÔNG
 * báo xanh. Bỏ qua trong im lặng rồi báo đạt là đúng lỗi `live-023` từng mắc:
 * nó âm thầm nhảy qua một phép kiểm RLS suốt nhiều lần chạy mà vẫn xanh.
 */
export function requireDb() {
  const env = loadEnv();
  if (!env.url || !env.service || !env.anon) {
    console.log('⚪ BỎ QUA — thiếu NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY.');
    console.log('   Bài kiểm này CẦN cơ sở dữ liệu thật. Nó KHÔNG báo đạt khi bị bỏ qua.');
    process.exit(0);
  }
  const { createClient } = createRequire(resolve(ROOT, 'package.json'))('@supabase/supabase-js');
  return {
    env,
    admin: createClient(env.url, env.service, { auth: { persistSession: false } }),
    anonClient: () => createClient(env.url, env.anon, { auth: { persistSession: false } }),
    createClient,
  };
}

// ─── Sổ điểm ────────────────────────────────────────────────────────────────
export function scoreboard(ten) {
  let dat = 0, hong = 0;
  const dsHong = [], dsChuaDo = [];
  return {
    ok(nhan, dieuKien, themVao = '') {
      if (dieuKien) { dat++; console.log(`  ✅ ${nhan}`); }
      else { hong++; dsHong.push(nhan); console.log(`  ⛔ ${nhan}${themVao ? '   ← ' + themVao : ''}`); }
      return !!dieuKien;
    },
    /** Bảng rỗng / chưa có vai để đăng nhập ⇒ KHÔNG tính đạt, cũng KHÔNG tính hỏng. */
    chuaDo(nhan, viSao) {
      dsChuaDo.push(nhan);
      console.log(`  ⚪ ${nhan} — ${viSao}`);
    },
    eq(nhan, nhan_duoc, cho) {
      return this.ok(nhan, JSON.stringify(nhan_duoc) === JSON.stringify(cho),
        `nhận ${JSON.stringify(nhan_duoc)}, chờ ${JSON.stringify(cho)}`);
    },
    ketThuc() {
      console.log('\n' + '═'.repeat(72));
      console.log(`${ten}: ${dat} đạt · ${hong} hỏng`
        + (dsChuaDo.length ? ` · ${dsChuaDo.length} chưa đo được` : ''));
      if (dsHong.length) { console.log('\nHỏng:'); for (const h of dsHong) console.log('  ⛔ ' + h); }
      if (dsChuaDo.length) console.log(`\n⚪ Chưa đo được: ${dsChuaDo.join(', ')}`);
      console.log('═'.repeat(72));
      return hong;
    },
  };
}

// ─── Phiên đăng nhập tạm — LUÔN dọn trong `finally` ─────────────────────────
export function sessionFactory(admin, createClient, env, tienTo) {
  const users = [];
  return {
    users,
    async tao(vaiTro, the) {
      const email = `zz-${tienTo}-${the}@monica.vn`;
      const password = `Zz-${tienTo}-${the}-tmp!`;
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        app_metadata: { role: vaiTro }, user_metadata: { full_name: `ZZ ${tienTo} ${the}` },
      });
      if (error) throw new Error(`${the}: ${error.message}`);
      users.push(data.user.id);
      await admin.from('profiles').upsert({ id: data.user.id, full_name: `ZZ ${tienTo} ${the}` });
      const c = createClient(env.url, env.anon, { auth: { persistSession: false } });
      const { error: e2 } = await c.auth.signInWithPassword({ email, password });
      if (e2) throw new Error(`${the} đăng nhập: ${e2.message}`);
      return { client: c, userId: data.user.id };
    },
    async don() {
      for (const u of users) {
        await admin.from('profiles').delete().eq('id', u);
        await admin.auth.admin.deleteUser(u);
      }
    },
  };
}

/** Số dòng vai này ĐỌC được. `null` = lỗi (không đọc nổi bảng). */
export const dem = async (client, bang) => {
  const { count, error } = await client.from(bang).select('*', { count: 'exact', head: true });
  return error ? null : (count ?? 0);
};
