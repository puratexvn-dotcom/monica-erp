// ============================================================================
// SINH BỘ ICON ỨNG DỤNG TỪ LOGO CHÍNH THỨC
//
//   node scripts/build-icons.mjs
//
// ═══ ⚠️ KHÔNG VẼ LẠI LOGO ════════════════════════════════════════════════
// Nguồn DUY NHẤT là `public/MONICA.png` đã có sẵn trong kho. Script này chỉ
// ĐẶT nó lên một khung vuông nền trắng và xuất ra các cỡ mà iOS · Android ·
// Windows đòi hỏi. Không đổi một điểm ảnh nào của phần chữ.
//
// ═══ ⚠️ VÌ SAO PHẢI GHÉP LÊN KHUNG VUÔNG ═══════════════════════════════
// Logo là wordmark NGANG, tỷ lệ 1096×270 ≈ 4:1. Mọi hệ điều hành đều đòi icon
// VUÔNG. Không thể dùng thẳng tệp gốc: iOS sẽ tự bóp méo hoặc tự cắt, và cắt
// một wordmark thì ra mấy chữ cái vô nghĩa.
//
// Nền TRẮNG chứ không trong suốt: iOS **tô nền đen** cho icon có kênh alpha,
// và chữ nhiều màu của logo trên nền đen thì mất sạch sắc độ.
//
// ═══ HAI HỌ ICON, HAI VÙNG AN TOÀN KHÁC NHAU ═══════════════════════════
//   thường   logo rộng 88% khung — dùng cho favicon, apple-touch-icon
//   maskable Android CẮT icon thành hình tròn/vuông bo tuỳ máy. Vùng an toàn
//            chỉ là 80% ở giữa, nên logo phải thu còn 62% mới chắc chắn không
//            bị xén mất chữ đầu và chữ cuối.
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NGUON = join(ROOT, 'public', 'MONICA.png');
const RA = join(ROOT, 'public', 'icons');
mkdirSync(RA, { recursive: true });

const TRANG = { r: 255, g: 255, b: 255, alpha: 1 };

/** Đặt logo vào giữa một khung vuông nền trắng. `tyLe` = bề rộng logo / cạnh. */
async function vuong(canh, tyLe) {
  const rongLogo = Math.round(canh * tyLe);
  const logo = await sharp(NGUON)
    .resize({ width: rongLogo, fit: 'inside', withoutEnlargement: false })
    .toBuffer();
  const { height: caoLogo } = await sharp(logo).metadata();

  return sharp({
    create: { width: canh, height: canh, channels: 4, background: TRANG },
  })
    .composite([
      {
        input: logo,
        left: Math.round((canh - rongLogo) / 2),
        top: Math.round((canh - caoLogo) / 2),
      },
    ])
    .png()
    .toBuffer();
}

const CAN_SINH = [
  // [tên tệp, cạnh, tỷ lệ bề rộng logo]
  ['icon-192.png', 192, 0.88],
  ['icon-512.png', 512, 0.88],
  ['apple-icon.png', 180, 0.86],
  ['icon.png', 512, 0.88],
  // Android cắt icon — logo phải nằm gọn trong vùng an toàn 80% ở giữa.
  ['maskable-192.png', 192, 0.62],
  ['maskable-512.png', 512, 0.62],
];

for (const [ten, canh, tyLe] of CAN_SINH) {
  writeFileSync(join(RA, ten), await vuong(canh, tyLe));
  console.log(`  ✓ icons/${ten}  ${canh}×${canh}`);
}

// favicon.ico gộp ba cỡ: 16 cho tab, 32 cho thanh dấu trang, 48 cho lối tắt
// trên màn hình nền Windows. Ở 16px thì wordmark chỉ còn là một vệt màu —
// không tránh được với logo tỷ lệ 4:1, đã ghi rõ ở báo cáo.
const icoBuffers = await Promise.all([16, 32, 48].map((c) => vuong(c, 0.94)));
writeFileSync(join(ROOT, 'app', 'favicon.ico'), await pngToIco(icoBuffers));
console.log('  ✓ app/favicon.ico  16+32+48');

// ─── ẢNH KHỞI ĐỘNG cho iOS ────────────────────────────────────────────────
// iOS KHÔNG dùng `background_color` của manifest. Thiếu ảnh khởi động thì mở
// app từ màn hình chính sẽ thấy một khung trắng trống trơn cho tới khi trang
// vẽ xong. Sinh sẵn cho các khổ máy phổ biến nhất.
const KHOI_DONG = [
  ['splash-1290x2796.png', 1290, 2796], // iPhone 14/15/16 Pro Max
  ['splash-1179x2556.png', 1179, 2556], // iPhone 14/15/16 Pro
  ['splash-1170x2532.png', 1170, 2532], // iPhone 12/13/14
  ['splash-1125x2436.png', 1125, 2436], // iPhone X/XS/11 Pro
  ['splash-828x1792.png', 828, 1792],   // iPhone XR/11
  ['splash-1536x2048.png', 1536, 2048], // iPad
];

for (const [ten, rong, cao] of KHOI_DONG) {
  const rongLogo = Math.round(rong * 0.62);
  const logo = await sharp(NGUON).resize({ width: rongLogo }).toBuffer();
  const { height: caoLogo } = await sharp(logo).metadata();
  const anh = await sharp({
    create: { width: rong, height: cao, channels: 4, background: TRANG },
  })
    .composite([
      { input: logo, left: Math.round((rong - rongLogo) / 2), top: Math.round((cao - caoLogo) / 2) },
    ])
    .png()
    .toBuffer();
  writeFileSync(join(RA, ten), anh);
  console.log(`  ✓ icons/${ten}  ${rong}×${cao}`);
}

console.log('\nXong. Nguồn: public/MONICA.png — KHÔNG sửa một điểm ảnh nào của logo.');
