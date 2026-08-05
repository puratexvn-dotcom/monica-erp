// ============================================================================
// LOADER PHÂN GIẢI ĐƯỜNG DẪN CHO BÀI KIỂM — `TD-36`
//
// ─── VÌ SAO TỆP NÀY TỒN TẠI ──────────────────────────────────────────────
// Bài kiểm nghiệp vụ nạp thẳng `.ts` để đo **đúng mã đang chạy**, ⛔ không đo
// một bản chép sang `.mjs` — bản chép sẽ lệch đúng vào ngày công thức đổi mà ⛔
// không ai nhớ sửa hai chỗ.
//
// Nhưng Node ESM ⛔ **không** phân giải hai thứ TypeScript cho phép:
//
//     @/schemas/md      bí danh đường dẫn (quy ước Next.js, dùng khắp dự án)
//     ./po-flow         import THIẾU ĐUÔI tệp
//
// ⇒ `B2-5` chỉ nạp được **2/5** mô-đun Kho. `W-3` và `W-4` — hai phép đo bắt
//   buộc — ⛔ không đo được.
//
// ─── 🔑 VÌ SAO SỬA Ở ĐÂY, ⛔ KHÔNG SỬA `lib/` ────────────────────────────
// Thêm đuôi `.ts` và bỏ bí danh trong `lib/` sẽ làm bài kiểm chạy được — và đó
// **đúng thứ `AC-1` cấm**: sửa mã **sản xuất** cho tiện **bài kiểm**. `@/` là
// quy ước của Next.js; bỏ nó đi là đổi quy ước toàn dự án để phục vụ một bộ
// kiểm.
//
// **Board Decision 05/08/2026 — phương án ①.** Vấn đề nằm ở **hạ tầng kiểm
// thử**, nên nó được sửa ở **hạ tầng kiểm thử**.
//
// ─── PHẠM VI CÓ CHỦ Ý — HẸP ─────────────────────────────────────────────
// Loader này ⛔ **không** biên dịch gì, ⛔ **không** đổi ngữ nghĩa gì. Nó chỉ trả
// lời một câu: *"đường dẫn này trỏ tới tệp nào"*. Việc bóc kiểu vẫn do
// `--experimental-strip-types` của Node làm.
//
// ⚠️ Nó chỉ chạy trong **bài kiểm**. `next build` ⛔ không dùng tệp này —
// Next.js tự phân giải `@/` bằng `tsconfig.json`. Hai đường hoàn toàn tách.
// ============================================================================
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

/** Đuôi thử theo đúng thứ tự TypeScript/Next.js dùng. */
const DUOI = ['.ts', '.tsx', '.mts', '.js', '.mjs'];

/** ⚠️ LỖI ĐÃ BẮT ĐƯỢC KHI DỰNG LOADER NÀY — đừng dùng `extname()` để hỏi
 *  *"đường dẫn này đã có đuôi chưa"*.
 *
 *  `extname('./commercial.schema')` trả về **`.schema`**, nên phép kiểm
 *  `!extname(specifier)` coi nó là *"đã có đuôi"* và bỏ qua nhánh thêm đuôi.
 *  Hậu quả đo được: `schemas/md/index.ts` ⛔ không nạp được ⇒ `po-health.ts` vẫn
 *  hỏng, và loader dừng ở **4/5** thay vì 5/5.
 *
 *  Dấu chấm trong tên tệp là quy ước phổ biến của dự án — `*.schema.ts`,
 *  `*.service.ts`, `*.actions.ts`, `*.calculator.ts`. Phải hỏi đúng câu:
 *  *"đuôi có phải là một đuôi MÔ-ĐUN ⛔ không"*. */
const CO_DUOI_MODULE = /\.(ts|tsx|mts|cts|js|mjs|cjs|json|node)$/i;

/** Tìm tệp thật cho một đường dẫn ⛔ không có đuôi mô-đun.
 *  Thử `x.ts` trước, rồi `x/index.ts` — đúng thứ tự `moduleResolution` của dự án. */
function timTep(duongDanTho) {
  if (CO_DUOI_MODULE.test(duongDanTho) && existsSync(duongDanTho)) return duongDanTho;
  for (const d of DUOI) {
    const p = duongDanTho + d;
    if (existsSync(p)) return p;
  }
  for (const d of DUOI) {
    const p = join(duongDanTho, 'index' + d);
    if (existsSync(p)) return p;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  // ① Bí danh `@/…` — gốc là thư mục dự án, đúng như `tsconfig.json` khai.
  if (specifier.startsWith('@/')) {
    const tep = timTep(join(ROOT, specifier.slice(2)));
    if (tep) return { url: pathToFileURL(tep).href, shortCircuit: true };
    // ⛔ Không tìm thấy ⇒ để Node báo lỗi NGUYÊN VĂN. Nuốt lỗi ở đây sẽ biến
    // một đường dẫn sai thành một thông báo khó hiểu hơn.
  }

  // ② Import tương đối THIẾU ĐUÔI MÔ-ĐUN — `./po-flow`, `./commercial.schema`.
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !CO_DUOI_MODULE.test(specifier)) {
    const goc = context.parentURL ? dirname(fileURLToPath(context.parentURL)) : ROOT;
    const tep = timTep(join(goc, specifier));
    if (tep) return { url: pathToFileURL(tep).href, shortCircuit: true };
  }

  // ③ Mọi thứ còn lại — gói npm, `node:*`, đường dẫn đã đủ đuôi — Node tự lo.
  return nextResolve(specifier, context);
}
