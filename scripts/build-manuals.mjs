// ============================================================================
// GOM CÁC TỆP .md TRONG lib/manuals THÀNH MỘT MODULE TYPESCRIPT
//
// ─── VÌ SAO CẦN BƯỚC NÀY ──────────────────────────────────────────────────
// Khung hướng dẫn là client component nằm ở thanh điều hướng dưới đáy, tức là
// nó có mặt ở MỌI trang. Ba cách nạp Markdown khác đều có nhược điểm thật:
//
//   • import thẳng tệp .md — Next.js 14 không có loader sẵn cho .md, phải sửa
//     webpack config, mà đó là thứ dễ vỡ nhất khi nâng phiên bản.
//   • đọc bằng fs lúc chạy — cần khai báo outputFileTracing cho từng tệp, quên
//     một tệp là lỗi CHỈ xuất hiện trên máy chủ thật, không thấy khi chạy máy.
//   • fetch từ thư mục public — thêm một lượt mạng cho một khung TRỢ GIÚP, tức
//     đúng lúc người dùng đang bí thì họ phải chờ tải.
//
// Gộp sẵn vào mã nguồn: hướng dẫn mở ra tức thì, không lượt mạng nào, không
// cấu hình nào. Đổi lại phải chạy lại lệnh này sau khi sửa .md — đã móc vào
// predev/prebuild trong package.json nên không phải nhớ.
//
// ─── VÌ SAO DÙNG JSON.stringify ───────────────────────────────────────────
// Nội dung Markdown đầy dấu nháy ngược (khối mã, mã nội tuyến) và ký tự ${}.
// Nhét vào chuỗi mẫu của JS là hỏng cú pháp hoặc tệ hơn là nội suy nhầm.
// JSON.stringify thoát đúng mọi trường hợp, kể cả xuống dòng và ký tự Unicode.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'lib', 'manuals');
const OUT = path.join(DIR, 'manifest.generated.ts');

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.md'))
  .sort();

if (files.length === 0) {
  console.error('[manuals] Không tìm thấy tệp .md nào trong lib/manuals — dừng lại.');
  process.exit(1);
}

const entries = files.map((f) => {
  const slug = f.replace(/\.md$/, '');
  const body = fs.readFileSync(path.join(DIR, f), 'utf8');
  return `  ${JSON.stringify(slug)}: ${JSON.stringify(body)},`;
});

const out = `// TỆP SINH TỰ ĐỘNG — ĐỪNG SỬA TAY.
// Nguồn: lib/manuals/*.md · Sinh bởi: scripts/build-manuals.mjs
// Sửa nội dung hướng dẫn ở tệp .md rồi chạy: npm run manuals

export const MANUALS: Readonly<Record<string, string>> = {
${entries.join('\n')}
};

export type ManualSlug = keyof typeof MANUALS;
`;

// Chỉ ghi khi nội dung THỰC SỰ đổi: ghi vô điều kiện sẽ đổi mtime mỗi lần chạy
// và làm trình biên dịch của Next dựng lại cả cây phụ thuộc dù không có gì mới.
const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (old === out) {
  console.log(`[manuals] ${files.length} tệp — không có thay đổi.`);
} else {
  fs.writeFileSync(OUT, out, 'utf8');
  console.log(`[manuals] Đã gộp ${files.length} tệp: ${files.join(', ')}`);
}
