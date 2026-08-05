// ============================================================================
// BỘ KIỂM NGHIỆP VỤ KHO — `B2-5` · Sprint I-2 Phase 2
//
// ─── VÌ SAO TỆP NÀY TỒN TẠI ──────────────────────────────────────────────
// `lib/mos/` có **921 dòng công thức thuần** và ⛔ **0 bài kiểm**: hệ 4 điểm
// quyết định NHẬN hay TRẢ một cuộn vải, mức sẵn sàng NPL quyết định đơn hàng có
// thả chuyền được ⛔ không. Cùng hình dạng với MD trước Phase 1.
//
// ─── PHẠM VI: ĐỦ 5/5 MÔ-ĐUN ─────────────────────────────────────────────
//
//   ✅ four-point.ts · material-readiness.ts · quality.ts · shipment.ts
//   ✅ po-health.ts
//
// ⚠️ **Bản đầu chỉ phủ 2/5.** `quality` · `shipment` *(qua `./po-flow`)* và
// `po-health` *(qua `@/schemas/md`)* ⛔ **không nạp được**, nên `W-3` và `W-4`
// — hai phép đo **bắt buộc** — ⛔ không đo được.
//
// 🔑 Bài kiểm MD ở Phase 1 chạy được là nhờ `garment-math.ts` và
// `milestone-lateness.calculator.ts` **⛔ không import gì**. Cách nạp `.ts`
// trực tiếp **chỉ hợp với mô-đun ⛔ không phụ thuộc**, và `B2-5` là lần đầu
// đụng trần đó.
//
// ⛔ **KHÔNG sửa mã sản phẩm để bài kiểm nạp được** — thêm đuôi `.ts` và bỏ bí
// danh trong `lib/` là sửa mã **sản xuất** cho tiện **bài kiểm**, đúng thứ
// `AC-1` cấm.
//
// ✅ **`TD-36` đã trả — Board Decision phương án ①:** vấn đề nằm ở **hạ tầng
// kiểm thử** nên nó được sửa ở đó — `tests/_lib/ts-resolve.loader.mjs`.
// ⛔ Không một dòng mã sản phẩm nào bị đụng.
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
// ✅ `TD-36` ĐÃ TRẢ 05/08/2026 — loader `tests/_lib/ts-resolve.loader.mjs` phân
//    giải bí danh `@/…` và import thiếu đuôi. Ba mô-đun dưới đây trước bản đó
//    ⛔ KHÔNG nạp được, và `W-3` · `W-4` ⛔ không đo được.
import {
  readAqlStatus, judgeAql, dhuOf, paretoOf, capaAgeingOf, summariseCapa,
  CAPA_DUE_SOON_DAYS,
} from '../../lib/mos/quality.ts';
import { deriveHealth, DHU_CRITICAL } from '../../lib/mos/po-health.ts';
import {
  SHIPMENT_FLOW, INCOTERMS, isShipmentStatus, stageIndexOf, delayLevelOf,
} from '../../lib/mos/shipment.ts';

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

console.log('\n⑪ CHỈ SỐ CHẤT LƯỢNG — đọc kết luận và tính DHU');
{
  s.ok('"ĐẠT" ⇒ PASS', readAqlStatus('ĐẠT') === 'PASS');
  s.ok('"DAT" (⛔ không dấu) ⇒ PASS', readAqlStatus('DAT') === 'PASS');
  s.ok('"KHÔNG ĐẠT" ⇒ FAIL', readAqlStatus('KHÔNG ĐẠT') === 'FAIL');
  s.ok('"pass" thường ⇒ PASS', readAqlStatus('pass') === 'PASS');
  s.ok('Chuỗi lạ ⇒ PENDING', readAqlStatus('abc') === 'PENDING');
  s.ok('null ⇒ PENDING', readAqlStatus(null) === 'PENDING');

  s.ok('Lỗi ≤ Ac ⇒ PASS', judgeAql(3, 3, 4) === 'PASS');
  s.ok('Lỗi ≥ Re ⇒ FAIL', judgeAql(4, 3, 4) === 'FAIL');
  // 🔑 Vùng GIỮA Ac và Re là CÓ THẬT trong bảng AQL đôi mẫu — chưa đủ nhận,
  //    chưa đủ loại. Gộp nó vào PASS hay FAIL đều là **bịa ra một kết luận**.
  s.ok('🔑 Lỗi giữa Ac và Re ⇒ PENDING, ⛔ KHÔNG bịa ra kết luận',
    judgeAql(4, 3, 6) === 'PENDING');
  s.ok('Chưa đếm lỗi ⇒ PENDING', judgeAql(null, 3, 4) === 'PENDING');
  s.ok('⛔ Không có Ac ⇒ PENDING', judgeAql(3, null, 4) === 'PENDING');

  s.ok('dhuOf(5/200) = 2.5', dhuOf(5, 200) === 2.5);
  s.ok('Làm tròn 2 chữ số', dhuOf(1, 3) === 33.33);
  s.ok('🔑 Chưa kiểm cái nào ⇒ `null`, ⛔ KHÔNG phải 0', dhuOf(5, 0) === null);
  s.ok('checked null ⇒ null', dhuOf(5, null) === null);
}

console.log('\n⑫ 🔑 W-3 · PARETO — THỨ TỰ PHẢI ỔN ĐỊNH');
{
  // 🔑 Hai loại lỗi BẰNG NHAU: cùng dữ liệu phải cho cùng biểu đồ ở MỌI lần vẽ,
  //    ⛔ không được nhảy chỗ theo thứ tự đầu vào.
  const xuoi = paretoOf([{ code: null, label: 'B lỗi', qty: 10 }, { code: null, label: 'A lỗi', qty: 10 }]);
  const nguoc = paretoOf([{ code: null, label: 'A lỗi', qty: 10 }, { code: null, label: 'B lỗi', qty: 10 }]);
  s.ok('🔑 Hoà điểm ⇒ thứ tự KHÔNG phụ thuộc thứ tự đầu vào',
    xuoi.rows.map((r) => r.label).join('|') === nguoc.rows.map((r) => r.label).join('|'));
  s.ok('Hoà điểm ⇒ xếp theo tên, "A lỗi" đứng trước', xuoi.rows[0].label === 'A lỗi');

  // 🔑 Mã lỗi và chữ tự do là HAI KHÔNG GIAN KHOÁ khác nhau — ⛔ không được đụng nhau
  const haiKhong = paretoOf([
    { code: 'CHI_THUA', label: 'Chỉ thừa', qty: 5 },
    { code: null, label: 'Chỉ thừa', qty: 3 },
  ]);
  s.ok('🔑 Mã lỗi ⛔ KHÔNG đụng khoá với chữ tự do cùng tên', haiKhong.rows.length === 2);
  s.ok('Tổng vẫn đủ 8', haiKhong.total === 8);

  // Gộp đuôi vào "Khác" để đường cộng dồn luôn chạm 100%
  const bay = paretoOf(Array.from({ length: 7 }, (_, i) => ({
    code: `L${i}`, label: `Lỗi ${i}`, qty: 10 - i,
  })));
  s.ok('7 loại · top 5 ⇒ 6 cột (5 + "Khác")', bay.rows.length === 6);
  s.ok('Gộp đúng 2 loại vào "Khác"', bay.merged === 2);
  s.ok('🔑 Đường cộng dồn chạm 100%', gan(bay.rows[bay.rows.length - 1].cumPct, 100, 0.05));

  // 🔑 `vitalFew` tính trên danh sách ĐẦY ĐỦ, ⛔ không trên số cột đang hiện —
  //    nếu ⛔ không, con số phụ thuộc chuyện TRÌNH BÀY chứ ⛔ không phải chất lượng.
  const it = paretoOf([{ code: 'A', label: 'A', qty: 80 }, { code: 'B', label: 'B', qty: 20 }]);
  s.ok('🔑 Một loại chiếm 80% ⇒ vitalFew = 1', it.vitalFew === 1);
  s.ok('vitalFew của 7 loại đều nhau ⛔ không bằng số cột hiện', bay.vitalFew !== bay.rows.length);

  s.ok('Số lượng ≤ 0 bị bỏ qua',
    paretoOf([{ code: 'A', label: 'A', qty: 0 }, { code: 'B', label: 'B', qty: -5 }]).total === 0);
  const rong = paretoOf([]);
  s.ok('Đầu vào rỗng ⇒ ⛔ không hàng nào', rong.rows.length === 0);
  s.ok('Đầu vào rỗng ⇒ tổng 0 · gộp 0 · vitalFew 0',
    rong.total === 0 && rong.merged === 0 && rong.vitalFew === 0);
}

console.log('\n⑬ CAPA — PHIẾU ĐÃ ĐÓNG ⛔ KHÔNG BAO GIỜ LÀ QUÁ HẠN');
{
  const HOM_NAY = '2026-08-05';
  s.ok('🔑 CLOSED dù hạn đã qua ⇒ DONE, ⛔ KHÔNG phải OVERDUE',
    capaAgeingOf('2026-01-01', 'CLOSED', HOM_NAY) === 'DONE');
  s.ok('CANCELLED dù hạn đã qua ⇒ DONE',
    capaAgeingOf('2026-01-01', 'CANCELLED', HOM_NAY) === 'DONE');
  s.ok('Đang mở, hạn đã qua ⇒ OVERDUE',
    capaAgeingOf('2026-08-04', 'OPEN', HOM_NAY) === 'OVERDUE');
  s.ok(`Còn đúng ${CAPA_DUE_SOON_DAYS} ngày ⇒ DUE_SOON`,
    capaAgeingOf('2026-08-08', 'OPEN', HOM_NAY) === 'DUE_SOON');
  s.ok('Còn 4 ngày ⇒ ON_TRACK', capaAgeingOf('2026-08-09', 'OPEN', HOM_NAY) === 'ON_TRACK');
  s.ok('Đúng hôm nay ⇒ DUE_SOON', capaAgeingOf(HOM_NAY, 'OPEN', HOM_NAY) === 'DUE_SOON');
  s.ok('⛔ Chưa đặt hạn ⇒ ON_TRACK', capaAgeingOf(null, 'OPEN', HOM_NAY) === 'ON_TRACK');

  // 🔑 Phiếu HUỶ nghĩa là lập nhầm. Đếm nó vào mẫu số sẽ THỔI PHỒNG tỉ lệ đóng.
  const cs = summariseCapa([
    { status: 'CLOSED', ageing: 'DONE' },
    { status: 'CANCELLED', ageing: 'DONE' },
    { status: 'OPEN', ageing: 'OVERDUE' },
  ]);
  s.ok('🔑 Phiếu HUỶ bị loại khỏi mẫu số ⇒ closeRate 50%, ⛔ không phải 33.3%',
    cs.closeRate === 50);
  s.ok('Đếm đủ 3 phiếu', cs.total === 3);
  s.ok('Đang mở = 1 — huỷ ⛔ không tính là đang mở', cs.open === 1);
  s.ok('Quá hạn = 1', cs.overdue === 1);
  s.ok('⛔ Chưa có phiếu nào ⇒ closeRate `null`, ⛔ không phải 0',
    summariseCapa([]).closeRate === null);
}

console.log('\n⑭ 🔑 W-4 · SỨC KHOẺ ĐƠN HÀNG — THIẾU DỮ LIỆU PHẢI RA `null`');
{
  const H = (o = {}) => ({
    bomLines: null, missingLines: null, sewnPct: null,
    daysLeft: null, totalDays: null, dhu: null, ...o,
  });

  // 🔑 PHÉP ĐO QUAN TRỌNG NHẤT MỤC NÀY. `0` ở ô rủi ro đọc thành "đơn hàng
  //    hoàn hảo". Sự thật là "chưa biết gì".
  const trong = deriveHealth(H());
  s.ok('🔑 Mọi đầu vào `null` ⇒ tổng `null`, ⛔ KHÔNG phải 0', trong.total === null);
  s.ok('🔑 Mức rủi ro cũng `null`, ⛔ không phải "LOW"', trong.level === null);
  s.ok('Nguồn = NONE', trong.source === 'NONE');
  s.ok('Số thành phần có dữ liệu = 0', trong.basis === 0);
  s.ok('Vẫn trả đủ 4 thành phần để giao diện hiện "—"', trong.parts.length === 4);

  // 🔑 CHUẨN HOÁ TRỌNG SỐ. Chỉ có dữ liệu NPL, thiếu 5/10 dòng ⇒ điểm 50.
  //    ⛔ KHÔNG chuẩn hoá thì ra 50×0.35 = 17.5 ⇒ mức "LOW", trông AN TOÀN dù
  //    thiếu một nửa nguyên liệu — đúng kiểu sai lặng lẽ nguy hiểm nhất.
  const chiNpl = deriveHealth(H({ bomLines: 10, missingLines: 5 }));
  s.ok('🔑 Chỉ có NPL, thiếu 5/10 ⇒ tổng 50 (đã chuẩn hoá trọng số)', chiNpl.total === 50);
  s.ok('🔑 Mức = HIGH, ⛔ KHÔNG phải LOW (⛔ không chuẩn hoá sẽ ra 17.5)',
    chiNpl.level === 'HIGH');
  s.ok('Chỉ 1 thành phần có dữ liệu', chiNpl.basis === 1);
  s.ok('Nguồn = DERIVED', chiNpl.source === 'DERIVED');
  s.ok('Câu giải thích được ghi lại để kiểm chứng',
    chiNpl.parts.find((p) => p.key === 'material').because === '5/10');

  // Quá hạn ⇒ rủi ro tiến độ 100 ngay
  const quaHan = deriveHealth(H({ daysLeft: -3 }));
  s.ok('🔑 Quá hạn ⇒ điểm tiến độ 100 ngay, ⛔ không cần tính gì thêm',
    quaHan.parts.find((p) => p.key === 'schedule').score === 100);
  s.ok('Quá hạn 3 ngày ⇒ tổng 100 (chỉ thành phần này có dữ liệu)', quaHan.total === 100);
  s.ok('Mức = CRITICAL', quaHan.level === 'CRITICAL');

  // Kẹp trần: DHU gấp 5 lần ngưỡng nguy kịch vẫn chỉ 100
  const dhuCao = deriveHealth(H({ dhu: DHU_CRITICAL * 5 }));
  s.ok('🔑 DHU gấp 5 lần ngưỡng ⇒ điểm kẹp trần 100, ⛔ không vượt',
    dhuCao.parts.find((p) => p.key === 'quality').score === 100);
  s.ok('DHU = 0 ⇒ điểm chất lượng 0 — đã kiểm và ⛔ không lỗi',
    deriveHealth(H({ dhu: 0 })).parts.find((p) => p.key === 'quality').score === 0);

  // Năng lực xưởng CHƯA có nguồn dữ liệu ⇒ luôn null, ⛔ không đoán
  s.ok('🔑 Năng lực xưởng luôn `null` — ⛔ chưa có dữ liệu nhịp ngày, ⛔ không đoán',
    deriveHealth(H({ bomLines: 10, missingLines: 0, dhu: 1 }))
      .parts.find((p) => p.key === 'capacity').score === null);
}

console.log('\n⑮ LÔ XUẤT — DÒNG CHẢY VÀ MỨC TRỄ');
{
  s.ok('Dòng chảy đủ 8 chặng', SHIPMENT_FLOW.length === 8);
  s.ok('Incoterms 2020 đủ 11 điều kiện', INCOTERMS.length === 11);
  s.ok('DRAFT ở vị trí 0', stageIndexOf('DRAFT') === 0);
  s.ok('DELIVERED ở vị trí cuối', stageIndexOf('DELIVERED') === 7);
  // 🔑 Lô đã huỷ ⛔ KHÔNG đứng ở bước nào — vẽ nó lên thanh tiến trình làm sai
  //    mọi phép đếm.
  s.ok('🔑 CANCELLED ⇒ `null`, ⛔ KHÔNG phải một vị trí trên thanh tiến trình',
    stageIndexOf('CANCELLED') === null);
  s.ok('CANCELLED vẫn là trạng thái HỢP LỆ', isShipmentStatus('CANCELLED') === true);
  s.ok('Chuỗi lạ ⇒ ⛔ không hợp lệ', isShipmentStatus('KHONG_CO') === false);
  s.ok('null ⇒ ⛔ không hợp lệ', isShipmentStatus(null) === false);
  s.ok('stageIndexOf chuỗi lạ ⇒ null', stageIndexOf('KHONG_CO') === null);

  s.ok('Trễ 1 ngày ⇒ LATE', delayLevelOf(1) === 'LATE');
  s.ok('Đúng hạn (0) ⇒ ON_TIME', delayLevelOf(0) === 'ON_TIME');
  s.ok('Sớm ⇒ EARLY', delayLevelOf(-2) === 'EARLY');
  s.ok('⛔ Chưa biết ⇒ UNKNOWN, ⛔ không phải ON_TIME', delayLevelOf(null) === 'UNKNOWN');
}

process.exit(s.ketThuc() ? 1 : 0);
