// ============================================================================
// BỘ KIỂM NGHIỆP VỤ MD — BÀI ĐẦU TIÊN CỦA DỰ ÁN
//
// ─── VÌ SAO TỆP NÀY TỒN TẠI: `V-4` · `KD-11` · `TD-22` ───────────────────
// Phân hệ MD có **19.058 dòng mã và ⛔ KHÔNG một bài kiểm nghiệp vụ nào**. Toàn
// bộ bộ kiểm hiện có đo **phân quyền** — ai đọc được gì, ai ghi được gì. ⛔
// Không bài nào hỏi *"con số in ra màn hình có ĐÚNG không"*.
//
// Đó là hai câu hỏi khác nhau, và câu thứ hai chưa từng được hỏi.
//
// ─── EDD-06 §7 · ĐIỀU KIỆN RA CỦA SPRINT I-2 ────────────────────────────
// *"MD có bài kiểm nghiệp vụ"*. Tệp này mở hạng mục đó.
//
// ─── PHẠM VI CÓ CHỦ Ý: HÀM THUẦN, ⛔ KHÔNG CẦN CSDL ──────────────────────
// Chỉ đo `lib/garment-math.ts` và `lib/mos/calculators/`. Chúng là nơi **mọi
// con số nghiệp vụ được sinh ra** — quy đổi vải, định mức, AQL, DHU, năng suất,
// công nợ nhà thầu. Đo được ở đây thì ⛔ không cần CSDL, nên bài này chạy trên
// CI ⛔ không bí mật, cùng hạng với arch test.
//
// ⚠️ **Bài này ⛔ KHÔNG chứng minh màn hình hiển thị đúng.** Nó chứng minh
// **công thức** đúng. Lệch giữa công thức đúng và màn hình sai vẫn cần nghi
// thức nghiệm thu — UI_UX_STANDARDS §8.
//
// ⚠️ Cần Node ≥ 22.6 (`--experimental-strip-types`) để nạp thẳng `.ts`.
//    Bộ chạy truyền cờ; thiếu cờ thì bài HỎNG TO, ⛔ không im lặng bỏ qua.
// ============================================================================
import { scoreboard } from '../_lib/harness.mjs';
import {
  YARD_IN_METERS, kgToMeters, metersToKg, metersToYards, yardsToMeters,
  bomTotalNeed, cuttingWastePercent, expectedCutPieces,
  aqlLookup, aqlJudge,
  defectRatePercent, dhu, rftPercent,
  taktTimeMinutes, lineEfficiencyPercent,
  settleSubcon, isBelowSafetyStock, progressPercent, daysLate,
} from '../../lib/garment-math.ts';
import {
  laMocTre, demMocTre, mocTreTheoDon,
} from '../../lib/mos/calculators/milestone-lateness.calculator.ts';

const s = scoreboard('NGHIỆP VỤ MD — CÔNG THỨC');

/** So số thực có dung sai. Ngành may đo tới gam và centimét; 1e-9 là dư sức. */
const gan = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

console.log('\n① QUY ĐỔI VẢI — Kg ⟷ Mét ⟷ Yard');
{
  // Vải single jersey 180 GSM, khổ 1.6 m, nhập 500 kg.
  // Mét = (500 × 1000) / (180 × 1.6) = 500000 / 288 = 1736.111…
  const m = kgToMeters(500, 180, 1.6);
  s.ok('kgToMeters(500kg · 180 GSM · khổ 1.6m) = 1736.11 m', gan(m, 500000 / 288, 1e-6));
  s.ok('metersToKg là phép NGƯỢC đúng của kgToMeters', gan(metersToKg(m, 180, 1.6), 500, 1e-9));

  // 🔑 Chia cho 0 phải trả 0, ⛔ KHÔNG trả Infinity. `Infinity` in ra màn hình
  //    thành "∞ m" và ⛔ không ai biết nó đến từ đâu.
  s.ok('GSM = 0 ⇒ trả 0, ⛔ không trả Infinity', kgToMeters(500, 0, 1.6) === 0);
  s.ok('Khổ vải = 0 ⇒ trả 0', kgToMeters(500, 180, 0) === 0);

  s.ok('1 yard = 0.9144 m — hằng số quốc tế', YARD_IN_METERS === 0.9144);
  s.ok('metersToYards ⟷ yardsToMeters khứ hồi', gan(yardsToMeters(metersToYards(1234.5)), 1234.5, 1e-9));
  s.ok('100 m = 109.361 yard', gan(metersToYards(100), 100 / 0.9144, 1e-9));
}

console.log('\n② ĐỊNH MỨC BOM — hao hụt');
{
  // 10.000 SP × 1.35 m/SP × (1 + 3%) = 13.500 × 1.03 = 13.905 m
  s.ok('bomTotalNeed(10000 SP · 1.35 m · hao 3%) = 13905 m',
    gan(bomTotalNeed(10000, 1.35, 3), 13905, 1e-9));
  s.ok('Hao hụt 0% ⇒ đúng bằng định mức thô', gan(bomTotalNeed(10000, 1.35, 0), 13500, 1e-9));
  // Hao hụt ÂM là chiết giảm — công thức phải cho phép, vì có mã hàng tái sử dụng vải đầu tấm.
  s.ok('Hao hụt âm ⇒ giảm nhu cầu, ⛔ không kẹp về 0',
    gan(bomTotalNeed(1000, 1, -10), 900, 1e-9));
}

console.log('\n③ BÀN CẮT — hao hụt và số bán thành phẩm');
{
  // Xả 1000 m, sơ đồ ăn 940 m ⇒ hao 6%
  s.ok('cuttingWastePercent(1000 m xả · 940 m sơ đồ) = 6%',
    gan(cuttingWastePercent(1000, 940), 6, 1e-9));
  s.ok('Xả 0 m ⇒ trả 0, ⛔ không chia cho 0', cuttingWastePercent(0, 940) === 0);

  // 4 bàn × 60 lá × (S12 + M20 + L15 + XL8 = 55 SP/sơ đồ) = 13.200 BTP
  s.ok('expectedCutPieces(4 bàn · 60 lá · tỷ lệ 12/20/15/8) = 13200',
    expectedCutPieces(4, 60, { S: 12, M: 20, L: 15, XL: 8 }) === 13200);
  s.ok('Tỷ lệ rỗng ⇒ 0 BTP', expectedCutPieces(4, 60, {}) === 0);
}

console.log('\n④ AQL 2.5 — ISO 2859-1, mức II, phương án đơn');
{
  // 🔑 Đây là mục quan trọng nhất tệp này: AQL quyết định LÔ HÀNG ĐI HAY Ở LẠI.
  s.ok('Lô 90 SP (< 91) ⇒ null — phải kiểm 100%', aqlLookup(90) === null);
  s.ok('Lô 91 SP ⇒ mẫu 20 · Ac 1 · Re 2',
    JSON.stringify(aqlLookup(91)) === JSON.stringify({ sampleSize: 20, ac: 1, re: 2 }));
  s.ok('Biên 150 ⇒ vẫn mẫu 20', aqlLookup(150)?.sampleSize === 20);
  s.ok('Biên 151 ⇒ nhảy sang mẫu 32', aqlLookup(151)?.sampleSize === 32);
  s.ok('Lô 500 ⇒ mẫu 50 · Ac 3', aqlLookup(500)?.sampleSize === 50 && aqlLookup(500)?.ac === 3);
  s.ok('Lô 10001 ⇒ mẫu 315 · Ac 14', aqlLookup(10001)?.sampleSize === 315);
  // Lô lớn hơn dòng cuối bảng vẫn phải có phương án, ⛔ không được trả null.
  s.ok('Lô 50000 (vượt bảng) ⇒ dùng dòng cuối, ⛔ không trả null',
    aqlLookup(50000)?.sampleSize === 315);

  const p500 = aqlLookup(500);
  s.ok('Major = Ac (3) ⇒ ĐẠT', aqlJudge(0, 3, p500) === 'Pass');
  s.ok('Major = Re (4) ⇒ RỚT', aqlJudge(0, 4, p500) === 'Fail');
  s.ok('🔑 Critical = 1 ⇒ RỚT NGAY dù Major = 0', aqlJudge(1, 0, p500) === 'Fail');

  // ─── BẪY MÀ CHÍNH `garment-math.ts` CẢNH BÁO ─────────────────────────
  // *"⚠️ KHÔNG so sánh tỷ lệ lỗi % > 2.5 — phải tra bảng chọn mẫu chuẩn."*
  // Lô 500, mẫu 50, 4 lỗi Major ⇒ tỷ lệ 4/50 = 8% … nhưng nếu ai đó cài luật
  // theo phần trăm với ngưỡng 2.5% thì 1 lỗi (2%) đã ĐẠT, trong khi bảng nói
  // Ac = 3 nên 1 lỗi cũng ĐẠT — hai luật TRÙNG nhau ở đây, ⛔ không phân biệt được.
  //
  // Chỗ chúng TÁCH nhau là lô LỚN: lô 10001, mẫu 315, Ac 14.
  //   • Theo bảng      : 14 lỗi ⇒ ĐẠT
  //   • Theo phần trăm : 14/315 = 4.44% > 2.5% ⇒ RỚT   ← SAI
  // Bài kiểm dưới đây RỚT nếu ai đó thay bảng bằng phép so phần trăm.
  const pBig = aqlLookup(10001);
  s.ok('🔑 Lô 10001 · 14 Major (4.44% > 2.5%) ⇒ vẫn ĐẠT theo BẢNG, ⛔ không theo %',
    aqlJudge(0, 14, pBig) === 'Pass');
  s.ok('Lô 10001 · 15 Major ⇒ RỚT (chạm Re)', aqlJudge(0, 15, pBig) === 'Fail');
}

console.log('\n⑤ CHỈ SỐ CHẤT LƯỢNG HẰNG NGÀY');
{
  s.ok('defectRatePercent(30 lỗi / 1000 kiểm) = 3%', gan(defectRatePercent(30, 1000), 3, 1e-9));
  s.ok('Kiểm 0 SP ⇒ 0%, ⛔ không NaN', defectRatePercent(30, 0) === 0);

  // 🔑 DHU khác tỷ lệ lỗi: MỘT sản phẩm có thể mang NHIỀU lỗi, nên DHU vượt 100
  //    được và đó ⛔ không phải lỗi tính toán.
  s.ok('DHU(150 lỗi / 100 SP) = 150% — một SP nhiều lỗi là bình thường',
    gan(dhu(150, 100), 150, 1e-9));
  s.ok('rftPercent(920 đạt ngay / 1000) = 92%', gan(rftPercent(920, 1000), 92, 1e-9));
  s.ok('RFT khi kiểm 0 ⇒ 0, ⛔ không NaN', rftPercent(920, 0) === 0);
}

console.log('\n⑥ NĂNG SUẤT CHUYỀN MAY');
{
  // Ca 8h = 480 phút, mục tiêu 600 SP ⇒ takt 0.8 phút/SP
  s.ok('taktTimeMinutes(480 phút / 600 SP) = 0.8', gan(taktTimeMinutes(480, 600), 0.8, 1e-9));
  s.ok('Mục tiêu 0 ⇒ trả 0, ⛔ không Infinity', taktTimeMinutes(480, 0) === 0);

  // 800 SP × SAM 15 phút = 12.000 phút chuẩn; 30 CN × 8h × 60 = 14.400 phút
  // ⇒ hiệu suất 83.33%
  s.ok('lineEfficiencyPercent(800 SP · SAM 15 · 30 CN · 8h) = 83.33%',
    gan(lineEfficiencyPercent(800, 15, 30, 8), (12000 / 14400) * 100, 1e-9));
  s.ok('0 công nhân ⇒ trả 0, ⛔ không chia cho 0', lineEfficiencyPercent(800, 15, 0, 8) === 0);
}

console.log('\n⑦ QUYẾT TOÁN CÔNG NỢ NHÀ THẦU');
{
  // 🔑 THỨ TỰ TRỪ LÀ QUYẾT ĐỊNH NGHIỆP VỤ, ⛔ không phải chi tiết kỹ thuật:
  //    phạt trừ vào giá trị nghiệm thu TRƯỚC, tạm ứng đối trừ SAU.
  //    Đảo thứ tự ⇒ `afterPenalty` sai ⇒ chứng từ đối chiếu với nhà thầu sai.
  const r = settleSubcon(9500, 12000, 3000000, 50000000);
  s.ok('gross = 9500 SP × 12.000 đ = 114.000.000 đ', r.gross === 114000000);
  s.ok('afterPenalty = gross − phạt 3.000.000 = 111.000.000 đ', r.afterPenalty === 111000000);
  s.ok('net = afterPenalty − tạm ứng 50.000.000 = 61.000.000 đ', r.net === 61000000);
  s.ok('🔑 Tạm ứng ⛔ KHÔNG được trừ trước phạt', r.afterPenalty > r.net);

  // Tạm ứng vượt giá trị nghiệm thu ⇒ net ÂM. Phải giữ số âm, ⛔ không kẹp về 0:
  // số âm nghĩa là "nhà thầu còn nợ lại Monica" — một sự thật kế toán.
  const am = settleSubcon(100, 12000, 0, 5000000);
  s.ok('Tạm ứng vượt nghiệm thu ⇒ net ÂM, ⛔ không kẹp về 0', am.net === 1200000 - 5000000);
}

console.log('\n⑧ TỒN AN TOÀN · TIẾN ĐỘ · TRỄ HẠN');
{
  s.ok('Tồn 1000 < nhu cầu 1000 × 1.05 ⇒ CẢNH BÁO', isBelowSafetyStock(1000, 1000) === true);
  s.ok('Tồn 1050 = đúng ngưỡng ⇒ ⛔ KHÔNG cảnh báo', isBelowSafetyStock(1050, 1000) === false);
  s.ok('Hệ số tuỳ chỉnh 1.2 áp đúng', isBelowSafetyStock(1150, 1000, 1.2) === true);

  s.ok('progressPercent(50/200) = 25%', gan(progressPercent(50, 200), 25, 1e-9));
  s.ok('Mục tiêu 0 ⇒ 0%, ⛔ không NaN', progressPercent(50, 0) === 0);
  // Trần 999 là CÓ CHỦ Ý: sản lượng vượt kế hoạch gấp bội thường là dữ liệu
  // nhập sai, và một thanh tiến độ 12.000% làm hỏng cả bố cục màn hình.
  s.ok('Vượt kế hoạch ⇒ kẹp trần 999%', progressPercent(100000, 1) === 999);

  const moc = new Date('2026-08-20T00:00:00Z');
  s.ok('daysLate(15/08 · nay 20/08) = 5 ngày trễ', daysLate('2026-08-15', moc) === 5);
  s.ok('Chưa tới hạn ⇒ số ÂM (còn 5 ngày)', daysLate('2026-08-25', moc) === -5);
  s.ok('Ngày ⛔ không đọc được ⇒ 0, ⛔ không NaN', daysLate('khong-phai-ngay', moc) === 0);
}

console.log('\n⑨ MỐC TIẾN ĐỘ TRỄ — `TD-17`, hai màn hình phải ra CÙNG con số');
{
  const HOM_NAY = '2026-08-05';
  s.ok('Quá hạn, chưa có ngày thực tế ⇒ TRỄ',
    laMocTre({ planned_date: '2026-08-04', actual_date: null, status: 'PENDING' }, HOM_NAY));
  // 🔑 Biên: đúng ngày hôm nay thì CHƯA trễ. Sai biên này làm mọi mốc của hôm
  //    nay nhảy lên đỏ ngay từ sáng.
  s.ok('🔑 Đúng ngày hôm nay ⇒ CHƯA trễ',
    !laMocTre({ planned_date: HOM_NAY, actual_date: null, status: 'PENDING' }, HOM_NAY));
  s.ok('Đã có ngày thực tế ⇒ ⛔ không trễ dù quá hạn',
    !laMocTre({ planned_date: '2026-07-01', actual_date: '2026-08-01', status: 'DONE' }, HOM_NAY));
  s.ok('SKIPPED ⇒ ⛔ không tính trễ (bỏ qua có chủ ý)',
    !laMocTre({ planned_date: '2026-07-01', actual_date: null, status: 'SKIPPED' }, HOM_NAY));
  s.ok('⛔ Chưa đặt lịch (planned_date null) ⇒ ⛔ không tính trễ',
    !laMocTre({ planned_date: null, actual_date: null, status: 'PENDING' }, HOM_NAY));

  const moc = [
    { planned_date: '2026-08-01', actual_date: null, status: 'PENDING' },      // trễ
    { planned_date: '2026-08-02', actual_date: null, status: 'IN_PROGRESS' },  // trễ
    { planned_date: '2026-08-03', actual_date: '2026-08-03', status: 'DONE' }, // xong
    { planned_date: '2026-07-01', actual_date: null, status: 'SKIPPED' },      // bỏ qua
    { planned_date: '2026-09-01', actual_date: null, status: 'PENDING' },      // chưa tới
  ];
  s.ok('demMocTre trên 5 mốc hỗn hợp ⇒ đúng 2', demMocTre(moc, HOM_NAY) === 2);
  s.ok('Danh sách rỗng ⇒ 0', demMocTre([], HOM_NAY) === 0);

  const nhieuDon = [
    { order_id: 'A', planned_date: '2026-08-01', actual_date: null, status: 'PENDING' },
    { order_id: 'A', planned_date: '2026-08-02', actual_date: null, status: 'PENDING' },
    { order_id: 'B', planned_date: '2026-09-01', actual_date: null, status: 'PENDING' },
  ];
  const bando = mocTreTheoDon(nhieuDon, HOM_NAY);
  s.ok('mocTreTheoDon: đơn A ⇒ 2 mốc trễ', bando.get('A') === 2);
  // 🔑 Đơn ⛔ không trễ phải VẮNG MẶT, ⛔ không phải mang giá trị 0 — nơi gọi
  //    quy về 0 bằng `?? 0`. Giữ đúng hành vi cũ của `po.service.ts`.
  s.ok('🔑 Đơn B ⛔ không trễ ⇒ VẮNG MẶT khỏi bản đồ', bando.has('B') === false);

  // ─── ĐÂY LÀ PHÉP KIỂM CHỐNG TÁI PHÁT `TD-17` ────────────────────────
  // Hai màn hình gọi hai hàm KHÁC NHAU trên CÙNG dữ liệu; kết quả phải trùng.
  // Bản trước, `po-twin` truyền hằng số `0` và ⛔ không ai phát hiện.
  const denDon = demMocTre(nhieuDon.filter((m) => m.order_id === 'A'), HOM_NAY);
  s.ok('🔑 demMocTre (PO 360°) ⟷ mocTreTheoDon (bảng danh sách) ra CÙNG số',
    denDon === bando.get('A'));
}

process.exit(s.ketThuc() ? 1 : 0);
