// Đăng ký loader phân giải đường dẫn — `TD-36`.
//
// Nạp bằng `node --import ./tests/_lib/register-loader.mjs <bài kiểm>`.
// Tách khỏi `ts-resolve.loader.mjs` vì `register()` phải chạy TRƯỚC khi tệp bài
// kiểm được phân giải; gộp chung một tệp thì chính nó đã bị nạp mất rồi.
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./ts-resolve.loader.mjs', pathToFileURL(import.meta.filename));
