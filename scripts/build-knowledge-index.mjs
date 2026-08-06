// ============================================================================
// SINH `docs/knowledge/INDEX.md` — `npm run knowledge`
//
// Chạy lại sau MỌI thay đổi trong `docs/knowledge/objects/`. Quên chạy ⇒ phép
// kiểm ⑧ của `tests/governance/knowledge-objects.test.mjs` đỏ.
//
// ⚠️ Script này CỐ Ý ⛔ KHÔNG kiểm tính hợp lệ. Nó chỉ dựng chỉ mục. Việc kiểm
// là của phép kiểm — một công cụ vừa sinh vừa tự chấm điểm mình thì ⛔ không ai
// biết nó bỏ qua cái gì.
// ============================================================================
import { writeFileSync } from 'node:fs';
import { napDoiTuong, dungChiMuc, DUONG_DAN_INDEX } from './knowledge-lib.mjs';

const { doiTuong, loi } = napDoiTuong();

if (loi.length) {
  console.error('⛔ ⛔ KHÔNG phân tích được một số đối tượng:');
  for (const l of loi) console.error(`   · ${l}`);
  console.error('\nChỉ mục ⛔ KHÔNG được sinh. Sửa khuôn frontmatter rồi chạy lại.');
  console.error('Lược đồ: docs/knowledge/SCHEMA.md §2 · §4.3');
  process.exit(1);
}

writeFileSync(DUONG_DAN_INDEX, dungChiMuc(doiTuong), 'utf8');

const cho = doiTuong.filter((o) => o.meta.status === 'PENDING_BOARD').length;
console.log(`✅ Đã sinh docs/knowledge/INDEX.md — ${doiTuong.length} đối tượng.`);
console.log(cho ? `🔴 ${cho} mục đang CHỜ BOARD — xem INDEX.md §1.` : '✅ ⛔ Không mục nào chờ Board.');
console.log('⚠️ Sinh chỉ mục ⛔ KHÔNG phải kiểm tính hợp lệ. Chạy `npm run test:arch` để kiểm.');
