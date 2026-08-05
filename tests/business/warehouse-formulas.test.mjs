// ============================================================================
// BỘ KIỂM NGHIỆP VỤ KHO — `B2-5` · Sprint I-2 Phase 2
//
// ─── VÌ SAO TỆP NÀY TỒN TẠI ──────────────────────────────────────────────
// `lib/mos/` có **921 dòng công thức thuần** và ⛔ **0 bài kiểm**: hệ 4 điểm
// quyết định NHẬN hay TRẢ một cuộn vải, mức sẵn sàng NPL quyết định đơn hàng có
// thả chuyền được ⛔ không. Cùng hình dạng với MD trước Phase 1.
//
// ─── 🔴 PHẠM VI THẬT — ⛔ KHÔNG PHẢI PHẠM VI ĐÃ ĐỊNH ─────────────────────
// Backlog `B2-5` định phủ **5** mô-đun. Đo được: **chỉ 2 nạp được**.
//
//   ✅ four-point.ts          ⛔ không import gì
//   ✅ material-readiness.ts  ⛔ không import gì
//   ⛔ quality.ts             → `./po-flow` — Node ESM đòi ĐUÔI tệp
//   ⛔ shipment.ts            → `./po-flow` — cùng lý do
//   ⛔ po-health.ts           → `@/schemas/md` — bí danh, Node ⛔ không phân giải
//
// 🔑 Bài kiểm MD ở Phase 1 chạy được là nhờ `garment-math.ts` và
// `milestone-lateness.calculator.ts` **⛔ không import gì**. Cách nạp `.ts`
// trực tiếp **chỉ hợp với mô-đun ⛔ không phụ thuộc** — nó ⛔ không mở rộng được,
// và đây là lần đầu ta đụng trần đó.
//
// ⛔ **KHÔNG sửa mã sản phẩm để bài kiểm nạp được.** Thêm đuôi `.ts` và bỏ bí
// danh trong `lib/` là sửa mã sản xuất cho tiện bài kiểm — đúng thứ `AC-1` cấm.
// ⇒ `W-3` *(`paretoOf`)* và `W-4` *(`deriveHealth`)* **CHƯA ĐO ĐƯỢC**, ghi rõ ở
//   cuối log. Trình Board quyết cách gỡ.
//
// ⚠️ Bài này chứng minh **công thức** đúng, ⛔ không chứng minh **màn hình**
// đúng — nghi thức nghiệm thu UI_UX_STANDARDS §8 vẫn cần người thật.
// ============================================================================
import { scoreboard } from '../_lib/harness.mjs';
import {
  M_TO_YD, M_TO_INCH, SQM_TO_SQYD, DEFAULT_ACCEPTANCE_LIMIT,
  toMeters, fromMeters, totalPointsOf, scoreFourPoint,
} from '../../lib/mos/four-point.ts';
// ⚠️ `four-point.ts:39` khai LẠI `YARD_IN_METERS` thành hằng số RIÊNG, ⛔ không
// export — trong khi `garment-math.ts:7` đã export đúng hằng số đó. **Một hằng
// số vật lý, khai ở HAI nơi.** Hôm nay cả hai là `0.9144` nên ⛔ chưa lệch;
// nhưng sửa độ chính xác ở một nơi thì nơi kia ⛔ không đi theo, và mọi phép quy
// đổi vải sẽ lệch âm thầm. Nhập bản ĐÃ EXPORT về để **đo hai bên có khớp không**.
import { YARD_IN_METERS } from '../../lib/garment-math.ts';
import {
  readLegacyStatus, judgeLine, summarise,
} from '../../lib/mos/material-readiness.ts';

const s = scoreboard('NGHIỆP VỤ KHO — CÔNG THỨC');
const gan = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ── Khuôn dựng dòng định mức: chỉ khai trường CẦN cho từng phép đo ──────────
const dong = (o = {}) => ({
  required: null, available: 0, onHand: 0, reservedForPo: 0, blocked: 0,
  inInspection: 0, rollsTotal: 0, rollsFailed: 0, rollsPending: 0,
  inspectionsFailed: 0, ...o,
});

console.log('\n① HẰNG SỐ QUY ĐỔI — hệ 4 điểm');
{
  s.ok('1 yard = 0.9144 m (garment-math)', YARD_IN_METERS === 0.9144);
  s.ok('M_TO_YD = 1/0.9144 ≈ 1.09361', gan(M_TO_YD, 1 / 0.9144));
  // 🔑 Phép đo CHỐNG LỆCH giữa hai bản khai của cùng một hằng số. `four-point`
  //    ⛔ không export hằng số riêng của nó, nên đo GIÁN TIẾP qua `M_TO_YD`.
  s.ok('🔑 Hằng số yard của `four-point` KHỚP bản đã export ở `garment-math`',
    gan(M_TO_YD, 1 / YARD_IN_METERS));
  s.ok('🔑 SQM_TO_SQYD cũng dẫn xuất từ CÙNG hằng số đó',
    gan(SQM_TO_SQYD, 1 / (YARD_IN_METERS * YARD_IN_METERS)));
  // 1 inch = 1/36 yard ⇒ 1 m = 39.3700787… inch
  s.ok('M_TO_INCH ≈ 39.37008', gan(M_TO_INCH, 36 / 0.9144));
  s.ok('SQM_TO_SQYD ≈ 1.19599', gan(SQM_TO_SQYD, 1 / (0.9144 * 0.9144)));
  s.ok('Ngưỡng mặc định = 20 điểm/100 yd²', DEFAULT_ACCEPTANCE_LIMIT === 20);
}

console.log('\n② QUY ĐỔI ĐƠN VỊ NGƯỜI KIỂM NHẬP');
{
  s.ok('toMeters(100, METERS) = 100 — đơn vị gốc ⛔ không đụng', toMeters(100, 'METERS') === 100);
  s.ok('toMeters(100, YARDS) = 91.44 m', gan(toMeters(100, 'YARDS'), 91.44));
  s.ok('fromMeters(91.44, YARDS) = 100 yd', gan(fromMeters(91.44, 'YARDS'), 100));
  s.ok('Khứ hồi YARDS ⇒ ⛔ không trôi số', gan(fromMeters(toMeters(137.5, 'YARDS'), 'YARDS'), 137.5));
  s.ok('Khứ hồi METERS ⇒ đồng nhất', fromMeters(toMeters(137.5, 'METERS'), 'METERS') === 137.5);
}

console.log('\n③ TỔNG ĐIỂM PHẠT — trọng số 1·2·3·4');
{
  s.ok('p1 tính 1 điểm', totalPointsOf({ p1: 7, p2: 0, p3: 0, p4: 0 }) === 7);
  s.ok('p2 tính 2 điểm', totalPointsOf({ p1: 0, p2: 7, p3: 0, p4: 0 }) === 14);
  s.ok('p3 tính 3 điểm', totalPointsOf({ p1: 0, p2: 0, p3: 7, p4: 0 }) === 21);
  s.ok('p4 tính 4 điểm', totalPointsOf({ p1: 0, p2: 0, p3: 0, p4: 7 }) === 28);
  s.ok('Cộng hỗn hợp 2+4+9+16 = 31',
    totalPointsOf({ p1: 2, p2: 2, p3: 3, p4: 4 }) === 2 + 4 + 9 + 16);
  s.ok('⛔ Không lỗi nào ⇒ 0 điểm', totalPointsOf({ p1: 0, p2: 0, p3: 0, p4: 0 }) === 0);
}

console.log('\n④ 🔑 W-2 · CHẤM CUỘN — BIÊN NHẬN/TRẢ Ở ĐÚNG NGƯỠNG 20');
{
  // Dựng một cuộn có ĐÚNG 20 điểm/100 yd²:
  //   điểm = 20 ⇒ cần areaSqYd = 20×100/20 = 100 yd²
  //   100 yd² = 100 × 0.9144² m² = 83.612736 m²  ⇒ khổ 1.5 m ⇒ dài 55.741824 m
  const KHO = 1.5;
  const DAI_20 = (100 * 0.9144 * 0.9144) / KHO;
  const loi20 = { p1: 20, p2: 0, p3: 0, p4: 0 };

  const r = scoreFourPoint(loi20, DAI_20, KHO);
  s.ok('Diện tích quy đúng 100 yd²', gan(r.areaSqYd, 100, 1e-9));
  s.ok('Điểm/100yd² = 20.00', gan(r.pointsPer100SqYd, 20, 1e-9));

  // ⚠️ BÀI KIỂM NÀY TỪNG BÁO ĐỎ OAN — và mã thì đúng.
  //
  // Bản đầu khẳng định `verdict === 'PASSED'` cho chính cuộn dựng ở trên. Nó
  // đỏ, vì `DAI_20` sinh ra `areaSqYd = 99.999999999999985…` ⇒
  // `pointsPer100SqYd = 20.000000000000003…` — LỚN HƠN 20 thật, nên `FAILED`
  // là **kết luận đúng**. Sai nằm ở cách TÔI dựng số, ⛔ không nằm ở công thức.
  //
  // 🔑 Muốn đo ngữ nghĩa `≤` thì phải đo nó TRỰC TIẾP, ⛔ không đi vòng qua một
  //    phép nhân–chia dấu phẩy động: đặt ngưỡng ĐÚNG BẰNG điểm vừa tính.
  const bienChinhXac = scoreFourPoint(loi20, DAI_20, KHO, r.pointsPer100SqYd);
  s.ok('🔑 Ngưỡng ĐÚNG BẰNG điểm ⇒ ĐẠT — phép so là `≤`, ⛔ không phải `<`',
    bienChinhXac.verdict === 'PASSED');
  s.ok('Ngưỡng nhỏ hơn điểm một chút ⇒ RỚT',
    scoreFourPoint(loi20, DAI_20, KHO, r.pointsPer100SqYd * 0.999).verdict === 'FAILED');

  // Hai phía CÁCH XA biên — ⛔ không phụ thuộc dấu phẩy động
  s.ok('🔑 25 điểm trên cùng diện tích ⇒ RỚT',
    scoreFourPoint({ p1: 25, p2: 0, p3: 0, p4: 0 }, DAI_20, KHO).verdict === 'FAILED');
  s.ok('15 điểm ⇒ ĐẠT',
    scoreFourPoint({ p1: 15, p2: 0, p3: 0, p4: 0 }, DAI_20, KHO).verdict === 'PASSED');

  // Ngưỡng riêng của khách hàng
  s.ok('Khách khai ngưỡng 15 ⇒ cuộn 20 điểm RỚT',
    scoreFourPoint(loi20, DAI_20, KHO, 15).verdict === 'FAILED');
  s.ok('Khách khai ngưỡng 25 ⇒ cuộn 20 điểm ĐẠT',
    scoreFourPoint(loi20, DAI_20, KHO, 25).verdict === 'PASSED');
  s.ok('Ngưỡng đang áp được trả về nguyên vẹn',
    scoreFourPoint(loi20, DAI_20, KHO, 15).limit === 15);
}

console.log('\n⑤ CHẤM CUỘN — THIẾU KÍCH THƯỚC PHẢI LÀ `PENDING`');
{
  const loi = { p1: 5, p2: 0, p3: 0, p4: 0 };
  for (const [ten, dai, kho] of [
    ['dài = null', null, 1.5],
    ['khổ = null', 50, null],
    ['dài = 0', 0, 1.5],
    ['khổ = 0', 50, 0],
    ['dài âm', -5, 1.5],
  ]) {
    const r = scoreFourPoint(loi, dai, kho);
    s.ok(`${ten} ⇒ PENDING`, r.verdict === 'PENDING');
  }

  const r = scoreFourPoint(loi, null, 1.5);
  // 🔑 `null` KHÁC `0`. Trả 0 nghĩa là "vải hoàn hảo"; sự thật là "chưa biết".
  s.ok('🔑 Chưa tính được ⇒ điểm/100yd² là `null`, ⛔ KHÔNG phải 0',
    r.pointsPer100SqYd === null);
  s.ok('Diện tích cũng `null`', r.areaSqYd === null);
  s.ok('Nhưng TỔNG ĐIỂM vẫn đếm được — nó ⛔ không cần kích thước', r.totalPoints === 5);
  s.ok('lengthYd · widthInch `null` khi chưa đủ dữ liệu',
    r.lengthYd === null && r.widthInch === null);
}

console.log('\n⑥ CHẤM CUỘN — SỐ ĐỐI CHIẾU PHIẾU GIẤY NHÀ CUNG CẤP');
{
  const r = scoreFourPoint({ p1: 1, p2: 0, p3: 0, p4: 0 }, 91.44, 1.4224);
  s.ok('91.44 m = 100 yd', gan(r.lengthYd, 100, 1e-9));
  s.ok('1.4224 m = 56 inch (khổ vải thông dụng)', gan(r.widthInch, 56, 1e-9));
}

console.log('\n⑦ 🔑 W-1 · ĐỌC NHÃN TIẾNG VIỆT CỦA BẢNG CŨ');
{
  // ⚠️ ĐÂY LÀ LOẠI LỖI ĐÃ TỪNG XẢY RA: `po-twin` so `npl_status` với `'READY'`
  //    trong khi giá trị THẬT trong CSDL là tiếng Việt. Mọi dòng bị đếm là
  //    thiếu ⇒ điểm rủi ro NPL luôn nhảy 100. Chưa nổ chỉ vì bảng còn rỗng.
  s.ok('"Đã về kho" ⇒ READY', readLegacyStatus('Đã về kho') === 'READY');
  s.ok('"Thiếu hụt" ⇒ MISSING', readLegacyStatus('Thiếu hụt') === 'MISSING');
  s.ok('"Đang về" ⇒ PARTIAL', readLegacyStatus('Đang về') === 'PARTIAL');
  s.ok('"Chưa đặt" ⇒ MISSING', readLegacyStatus('Chưa đặt') === 'MISSING');
  s.ok('"Đủ" ⇒ READY', readLegacyStatus('Đủ') === 'READY');
  s.ok('"Đang đặt" ⇒ PARTIAL', readLegacyStatus('Đang đặt') === 'PARTIAL');

  s.ok('⛔ Không phân biệt HOA/thường', readLegacyStatus('ĐÃ VỀ KHO') === 'READY');
  s.ok('Cắt khoảng trắng thừa', readLegacyStatus('  Thiếu hụt  ') === 'MISSING');

  // 🔑 Phép đo chống tái phát chính xác lỗi cũ
  s.ok('🔑 "READY" (tiếng Anh) ⇒ UNKNOWN — ĐÚNG lỗi `po-twin` từng mắc',
    readLegacyStatus('READY') === 'UNKNOWN');
  s.ok('Chuỗi lạ ⇒ UNKNOWN, ⛔ KHÔNG phải MISSING (báo động giả cũng mất niềm tin)',
    readLegacyStatus('abc xyz') === 'UNKNOWN');
  s.ok('null ⇒ UNKNOWN', readLegacyStatus(null) === 'UNKNOWN');
  s.ok('undefined ⇒ UNKNOWN', readLegacyStatus(undefined) === 'UNKNOWN');
  s.ok('chuỗi rỗng ⇒ UNKNOWN', readLegacyStatus('') === 'UNKNOWN');
}

console.log('\n⑧ 🔑 CHẤM DÒNG ĐỊNH MỨC — HÀNG GIỮ CHỖ LÀ HÀNG ĐÃ CÓ');
{
  // 🔑 `available_qty` ĐÃ TRỪ phần giữ chỗ (migration 017, cột sinh tự động).
  //    Chỉ nhìn `available` sẽ báo THIẾU đúng những đơn đã chuẩn bị hàng đầy đủ
  //    nhất — sai NGƯỢC hoàn toàn. Đây là phép đo bảo vệ điều đó.
  const daGiuDu = judgeLine(dong({ required: 1000, available: 0, reservedForPo: 1000 }));
  s.ok('🔑 Giữ chỗ đủ 1000, khả dụng 0 ⇒ READY (⛔ KHÔNG phải MISSING)',
    daGiuDu.status === 'READY');
  s.ok('Độ phủ 100%', gan(daGiuDu.coverage, 100));
  s.ok('⛔ Không thiếu', daGiuDu.shortage === 0);

  const nua = judgeLine(dong({ required: 1000, available: 300, reservedForPo: 200 }));
  s.ok('Khả dụng 300 + giữ chỗ 200 / cần 1000 ⇒ PARTIAL', nua.status === 'PARTIAL');
  s.ok('Độ phủ 50%', gan(nua.coverage, 50));
  s.ok('Thiếu 500', nua.shortage === 500);

  const khong = judgeLine(dong({ required: 1000, available: 0, reservedForPo: 0 }));
  s.ok('⛔ Không có gì ⇒ MISSING', khong.status === 'MISSING');
  s.ok('Độ phủ 0', khong.coverage === 0);
  s.ok('Thiếu đủ 1000', khong.shortage === 1000);

  const du = judgeLine(dong({ required: 500, available: 900 }));
  s.ok('Dư hàng ⇒ READY', du.status === 'READY');
  s.ok('Độ phủ 180% — ⛔ KHÔNG kẹp về 100', gan(du.coverage, 180));
  s.ok('Thiếu = 0, ⛔ không phải số âm', du.shortage === 0);
}

console.log('\n⑨ CHẤM DÒNG — CHƯA BIẾT NHU CẦU, VÀ CỜ CHẤT LƯỢNG');
{
  for (const [ten, v] of [
    ['nhu cầu null', dong({ required: null, available: 500 })],
    ['nhu cầu 0', dong({ required: 0, available: 500 })],
    ['nhu cầu âm', dong({ required: -5, available: 500 })],
  ]) {
    const r = judgeLine(v);
    s.ok(`${ten} ⇒ UNKNOWN`, r.status === 'UNKNOWN');
    s.ok(`${ten} ⇒ độ phủ và thiếu hụt đều null, ⛔ không phải 0`,
      r.coverage === null && r.shortage === null);
  }

  // 🔑 Đủ SỐ nhưng có cuộn trượt kiểm ⇒ hạ xuống PARTIAL. Số mét đó có thể
  //    ⛔ không dùng được; gọi là "sẵn sàng" là hứa một thứ chưa chắc có.
  const truotKiem = judgeLine(dong({ required: 100, available: 100, rollsFailed: 1 }));
  s.ok('🔑 Đủ số + có cuộn TRƯỢT KIỂM ⇒ hạ xuống PARTIAL', truotKiem.status === 'PARTIAL');
  s.ok('Cờ chất lượng bật', truotKiem.qaFlag === true);
  s.ok('Nhưng thiếu hụt vẫn = 0 — đủ số là sự thật riêng', truotKiem.shortage === 0);

  s.ok('Hàng bị chặn ⇒ bật cờ',
    judgeLine(dong({ required: 100, available: 100, blocked: 5 })).qaFlag === true);
  s.ok('Phiếu kiểm trượt ⇒ bật cờ',
    judgeLine(dong({ required: 100, available: 100, inspectionsFailed: 2 })).qaFlag === true);
  s.ok('Sạch ⇒ ⛔ không bật cờ',
    judgeLine(dong({ required: 100, available: 100 })).qaFlag === false);
  s.ok('Cờ vẫn tính được cả khi nhu cầu chưa biết',
    judgeLine(dong({ required: null, rollsFailed: 3 })).qaFlag === true);
}

console.log('\n⑩ 🔑 GỘP SỨC KHOẺ NPL — MẪU SỐ LÀ SỐ DÒNG TÍNH ĐƯỢC');
{
  const V = (status) => ({ status, coverage: null, shortage: null, qaFlag: false });

  // 🔑 8 dòng đủ + 2 dòng CHƯA CÓ ĐỊNH MỨC. Lấy TỔNG làm mẫu ⇒ 80%, nghe như
  //    thiếu hàng. Sự thật là thiếu THÔNG TIN. Hai chuyện phải tách.
  const h = summarise([...Array(8).fill(V('READY')), ...Array(2).fill(V('UNKNOWN'))]);
  s.ok('🔑 8 READY + 2 UNKNOWN ⇒ readyPct = 100%, ⛔ KHÔNG phải 80%', gan(h.readyPct, 100));
  s.ok('Tổng vẫn đếm đủ 10 dòng', h.total === 10);
  s.ok('Đếm đúng 2 dòng chưa biết', h.unknown === 2);
  s.ok('⛔ Không chặn sản xuất — ⛔ không dòng nào thiếu', h.blocking === false);

  const h2 = summarise([V('READY'), V('PARTIAL'), V('MISSING'), V('UNKNOWN')]);
  s.ok('1/3 dòng tính được là READY ⇒ 33.33%', gan(h2.readyPct, (1 / 3) * 100));
  s.ok('Có dòng MISSING ⇒ chặn sản xuất', h2.blocking === true);
  s.ok('Chỉ PARTIAL cũng chặn',
    summarise([V('READY'), V('PARTIAL')]).blocking === true);

  // 🔑 Chia cho 0 ra NaN rồi hiện thẳng ra màn hình là "NaN%".
  const toanUnknown = summarise([V('UNKNOWN'), V('UNKNOWN')]);
  s.ok('🔑 Toàn UNKNOWN ⇒ readyPct = `null`, ⛔ KHÔNG phải 0 và ⛔ KHÔNG phải NaN',
    toanUnknown.readyPct === null);
  s.ok('Danh sách rỗng ⇒ readyPct `null`', summarise([]).readyPct === null);
  s.ok('Danh sách rỗng ⇒ ⛔ không chặn', summarise([]).blocking === false);
}

console.log('\n⚠️ CHƯA ĐO ĐƯỢC — ⛔ KHÔNG phải đã đạt');
s.chuaDo('W-3 · paretoOf (quality.ts)',
  "Node ESM đòi đuôi tệp ở `./po-flow`; sửa mã sản phẩm cho bài kiểm nạp được là AC-1");
s.chuaDo('W-4 · deriveHealth (po-health.ts)',
  'bí danh `@/schemas/md` — Node ⛔ không phân giải; cần Board quyết cách gỡ');
s.chuaDo('shipment.ts · cờ bất thường',
  'cùng lý do với quality.ts');

process.exit(s.ketThuc() ? 1 : 0);
