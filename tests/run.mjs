// ============================================================================
// BỘ CHẠY — `npm test`
//
// Chạy tuần tự, in tóm tắt, thoát khác 0 nếu có bài hỏng.
//
// ─── THỨ TỰ CÓ CHỦ Ý ──────────────────────────────────────────────────────
//
//   ① architecture  — không cần CSDL, chạy được cả trên CI không bí mật
//   ② regression    — toàn vẹn dữ liệu nền. Chạy TRƯỚC bảo mật, vì bài bảo mật
//                     chạy trên nền sai sẽ cho kết luận sai mà vẫn xanh
//   ③ security      — phân quyền, cần CSDL
//
// Bài cần CSDL mà thiếu bí mật kết nối thì **tự tuyên bố bỏ qua** và thoát 0.
// ⚠️ "Bỏ qua" KHÁC "đạt", và tóm tắt cuối in rõ hai thứ đó tách nhau.
// ============================================================================
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const chiKienTruc = process.argv.includes('--arch-only');

// Cột 4 `co`: tham số truyền thêm cho Node. Bài nghiệp vụ nạp thẳng `.ts` để
// đo ĐÚNG mã đang chạy, ⛔ không đo một bản chép sang `.mjs` — bản chép sẽ lệch
// đúng vào ngày công thức đổi mà ⛔ không ai nhớ sửa hai chỗ.
//
// `--import register-loader` dựng loader phân giải bí danh `@/…` và import
// thiếu đuôi — `TD-36`. ⛔ Không có nó, chỉ mô-đun ⛔ KHÔNG PHỤ THUỘC mới nạp
// được, và bộ kiểm Kho dừng ở 2/5 mô-đun.
const CO_TS = [
  '--experimental-strip-types',
  '--no-warnings',
  '--import', './tests/_lib/register-loader.mjs',
];

const BAI = [
  ['architecture/arch.test.mjs', 'Kiến trúc', false],
  // Hàm thuần, ⛔ không cần CSDL ⇒ chạy được trên CI ⛔ không bí mật, cùng hạng
  // với arch test. Mở hạng mục *"MD có bài kiểm nghiệp vụ"* — EDD-06 §7, I-2.
  ['business/md-formulas.test.mjs', 'Nghiệp vụ MD — công thức', false, CO_TS],
  // ✅ `TD-36` đã trả — loader phân giải bí danh `@/…` và import thiếu đuôi, nên
  // bài này nay phủ ĐỦ 5/5 mô-đun Kho. Trước đó chỉ nạp được 2/5.
  ['business/warehouse-formulas.test.mjs', 'Nghiệp vụ Kho — công thức', false, CO_TS],
  // `UI-1.2` — canh HAI chiều: lộ quá nhiều (UI-F1) và che quá nhiều.
  ['business/capability.test.mjs', 'Lọc Business App theo quyền', false, CO_TS],
  ['business/workspace.test.mjs', 'Lõi Workspace — việc & KPI', false, CO_TS],
  ['regression/seed-integrity.test.mjs', 'Toàn vẹn dữ liệu nền', true],
  ['security/anon-and-buyer.test.mjs', 'Quét anon + Buyer', true],
  ['security/rls-external.test.mjs', 'Phân quyền người ngoài', true],
  // ⚠️ Bài dưới đây HỎNG CÓ CHỦ Ý cho tới khi migration thu hẹp
  // `authenticated_only` được Board duyệt và chạy. Nó mô tả trạng thái ĐÍCH.
  // Xanh sớm nghĩa là bài kiểm sai, không phải hệ thống đúng.
  ['security/md-internal-scope.test.mjs', 'Phân quyền người trong', true],
  // Bài này TỰ GIEO dữ liệu dùng-một-lần rồi dọn trong `finally`, nên nó cho
  // kết luận thật trên 4 bảng đang rỗng — thứ mà phép đếm suông không làm được
  // (Hiến pháp V.1).
  ['security/md-read-matrix.test.mjs', 'Ma trận đọc VR-004 · VR-005', true],
  // Đi hết vòng đời chứng từ thay vì chỉ đo quyền ở mức bảng. Sinh ra sau khi
  // một bản phản biện suy diễn hành vi policy mà không chạy thử — xem
  // docs/review/ADR-018-review.md, Phụ lục.
  ['security/costing-lifecycle.test.mjs', 'Vòng đời chiết tính', true],
  ['security/md-update-matrix.test.mjs', 'Ma trận ghi (UPDATE)', true],
  // KHÔNG thay thế `supabase/audits/A001` — nó chỉ đo phần HÀNH VI mà PostgREST
  // với tới được. Ba phép kiểm cần `pg_catalog` vẫn phải chạy A001 thật.
  ['security/a001-runtime.test.mjs', 'A001 runtime — bề mặt phơi ra', true],
];

const ketQua = [];
for (const [duongDan, ten, canDb, co = []] of BAI) {
  if (chiKienTruc && canDb) { ketQua.push([ten, 'bỏ qua', '--arch-only']); continue; }
  const tep = join(HERE, duongDan);
  if (!existsSync(tep)) { ketQua.push([ten, 'thiếu', duongDan]); continue; }
  console.log('\n' + '█'.repeat(78));
  console.log('█ ' + ten);
  console.log('█'.repeat(78));
  const r = spawnSync(process.execPath, [...co, tep], { stdio: 'inherit' });
  ketQua.push([ten, r.status === 0 ? 'đạt' : 'HỎNG', `mã thoát ${r.status}`]);
}

console.log('\n' + '═'.repeat(78));
console.log('TÓM TẮT');
console.log('═'.repeat(78));
for (const [ten, tt, ghiChu] of ketQua)
  console.log(`  ${tt === 'đạt' ? '✅' : tt === 'HỎNG' ? '⛔' : '⚪'} ${ten.padEnd(32)} ${tt}   ${ghiChu}`);
const hong = ketQua.filter(([, t]) => t === 'HỎNG').length;
console.log('═'.repeat(78));
console.log(hong ? `⛔ ${hong} bài HỎNG.` : '✅ Không bài nào hỏng.');
console.log('⚠️ Bài in "⚪ BỎ QUA" là CHƯA ĐO ĐƯỢC, không phải đã đạt.');
process.exit(hong ? 1 : 0);
