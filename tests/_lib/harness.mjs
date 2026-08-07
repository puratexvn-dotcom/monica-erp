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
import { readFileSync, existsSync, readdirSync } from 'node:fs';
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

// ════════════════════════════════════════════════════════════════════════════
// BỐI CẢNH ĐO — nguyên tắc kiểm chứng, Board Directive 05/08/2026 mục 6
// ════════════════════════════════════════════════════════════════════════════
//
// ─── VÌ SAO TỆP NÀY CÓ THÊM PHẦN NÀY ──────────────────────────────────────
//
// 05/08/2026, chuỗi ba sai lầm liên tiếp trên cùng một vấn đề:
//   ① suy diễn từ biểu thức policy, không đo  → ghi một lỗi 🔴 không có thật
//   ② ĐO THẬT, nhưng đo một CSDL đã bị chính bản vá của mình thay đổi mà không
//      biết → rút lại một kết luận đúng
//   ③ đo có kiểm soát → mới thấy bản vá đó đang mở một lỗ hổng toàn phần
//
// Sai lầm ② là sai lầm đắt nhất, và nó KHÔNG bị "đo trước, kết luận sau" chặn:
// phép đo hoàn toàn đúng kỹ thuật. Cái sai là **không biết mình đang đo cái gì**.
//
// ⇒ Board ban hành: *"Mọi phép đo phải ghi rõ trạng thái hệ thống, phiên bản
//   Migration, dữ liệu kiểm thử và điều kiện đo. Kết luận chỉ có giá trị đối với
//   đúng trạng thái đã được đo."*
//
// Phần dưới đây biến nguyên tắc đó thành **cơ chế**, không phải lời nhắc: mọi
// bài kiểm bảo mật in bối cảnh trước khi đo và nhắc lại giới hạn sau khi đo.

/**
 * In BỐI CẢNH ĐO trước khi chạy phép đo đầu tiên.
 *
 * ⚠️ Cột `migration trong KHO` đọc từ thư mục `supabase/migrations/`, tức là
 * **kho tin gì** — KHÔNG phải CSDL có gì. Hai thứ đó lệch nhau được, và ngày
 * 05/08/2026 chúng ĐÃ lệch: CSDL mang policy của `043` trong khi tệp `043` đã
 * bị xoá khỏi kho. Chính vì vậy dòng này phải in ra: nó là nửa đối chiếu, nửa
 * còn lại là `dauVan()` bên dưới.
 */
export async function boiCanh(admin, { bang = [] } = {}) {
  const env = loadEnv();
  const host = (() => { try { return new URL(env.url).host; } catch { return '(không rõ)'; } })();
  const ds = readdirSync(resolve(ROOT, 'supabase', 'migrations'))
    .filter((f) => f.endsWith('.sql')).sort();

  console.log('┌─ BỐI CẢNH ĐO ' + '─'.repeat(58));
  console.log(`│ CSDL              ${host}`);
  console.log(`│ Thời điểm         ${new Date().toISOString()}`);
  console.log(`│ Migration trong KHO  ${ds.length} tệp · mới nhất: ${ds.slice(-3).join(' · ')}`);
  for (const t of bang) {
    const { count, error } = await admin.from(t).select('*', { count: 'exact', head: true });
    console.log(`│ ${t.padEnd(24)} ${error ? 'LỖI ' + error.code : (count ?? 0) + ' dòng'}`);
  }
  console.log('└' + '─'.repeat(72));
}

/**
 * Ghi một DẤU VÂN hành vi — thứ CSDL thật đang làm, đối chiếu được với kho.
 *
 * Khác `ok()`: đây không phải phép kiểm đạt/hỏng mà là phép **mô tả trạng thái**.
 * Nó tồn tại để khi đọc lại log ba tuần sau, người đọc biết kết luận hôm đó
 * đứng trên nền nào — thay vì phải đoán như tôi đã đoán sai.
 */
export function dauVan(nhan, ketQua) {
  console.log(`  🔎 ${nhan.padEnd(46)} ${ketQua}`);
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
      // Board Directive 05/08/2026 mục 6. In ở CUỐI vì đây là chỗ người ta đọc
      // rồi đi kể lại — và câu bị bỏ quên khi kể lại chính là câu này.
      console.log('\n⚠️ Kết luận trên CHỈ có giá trị với trạng thái đã ghi ở khối'
        + ' BỐI CẢNH ĐO đầu log.\n   Chạy lại sau bất kỳ migration nào — kể cả'
        + ' migration của chính bài kiểm này.');
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
      let { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        app_metadata: { role: vaiTro }, user_metadata: { full_name: `ZZ ${tienTo} ${the}` },
      });

      // ══ 🔴 DỌN TÀI KHOẢN MỒ CÔI RỒI THỬ LẠI — vá 08/08/2026 ═══════════
      //
      // ⚠️ LỖI KIẾN TRÚC CỦA CHÍNH HARNESS NÀY, ⛔ KHÔNG PHẢI CỦA CSDL.
      //
      // `don()` chỉ xoá tài khoản do **lượt chạy hiện tại** tạo ra. Một lượt
      // chạy hỏng giữa chừng *(mạng đứt, `Ctrl+C`, một phép thử ném lỗi)* để
      // lại tài khoản `zz-*`, và từ đó **MỌI lượt chạy sau đều hỏng vĩnh
      // viễn** với *"email address has already been registered"*.
      //
      // 🔴 Đo được: `zz-rlsext-in@monica.vn` còn sót đúng **một** tài khoản,
      // và nó làm hai bài kiểm phân quyền đỏ liên tục nhiều phiên làm việc —
      // đủ lâu để mọi người quen mắt và coi đó là *"hai bài hỏng sẵn"*.
      //
      // 🔑 Đó là điều nguy hiểm nhất: một bài kiểm hỏng thường trực **thôi
      // được đọc**. Nó ⛔ không còn bảo vệ gì, mà vẫn chiếm chỗ như thể có.
      //
      // ⚠️ Xoá rồi tạo lại, ⛔ KHÔNG dùng lại tài khoản cũ: vai của nó có thể
      // khác lượt này, và một tài khoản mang vai sai sẽ làm bài kiểm phân
      // quyền **xanh nhầm** — tệ hơn hẳn đỏ.
      if (error && /already/i.test(error.message)) {
        const { data: ds } = await admin.auth.admin.listUsers({ perPage: 1000 });
        const cu = (ds?.users ?? []).find((u) => (u.email ?? '').toLowerCase() === email);
        if (cu) {
          await admin.from('profiles').delete().eq('id', cu.id);
          await admin.auth.admin.deleteUser(cu.id);
          console.log(`   ↻ dọn tài khoản mồ côi từ lượt chạy trước: ${email}`);
        }
        ({ data, error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
          app_metadata: { role: vaiTro }, user_metadata: { full_name: `ZZ ${tienTo} ${the}` },
        }));
      }

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
