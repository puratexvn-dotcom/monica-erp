// ============================================================================
// LÕI SEWING — LUẬT SINH VIỆC · KPI CHUYỀN MAY
//
// ─── 🔴 MỘT LUẬT Ở ĐÂY ⛔ KHÔNG PHẢI VỀ NĂNG SUẤT — NÓ VỀ AN TOÀN ──────
// Kim gãy mà **⛔ không tìm thấy đủ mảnh** nghĩa là **một mảnh kim loại có thể
// đang nằm trong lô hàng**. Hệ quả ⛔ không phải *"trừ điểm"* — nó là **giữ
// hàng, thu hồi, hoặc cắt đơn**.
//
// ⚠️ ⛔ Không bảng số liệu nào tự nói ra chuyện đó: sản lượng vẫn đẹp, hiệu
// suất vẫn cao, và mảnh kim vẫn ở trong thùng hàng. Đây là lý do phép đo cho
// luật đó đứng **đầu tiên** trong tệp này.
// ============================================================================
import { scoreboard } from '../_lib/harness.mjs';
import {
  viecCuaMay, NGUONG_HIEU_SUAT, NGUONG_SUA_LAI, MAY_NEO,
} from '../../lib/mos/workspace/may-work-items.ts';
import {
  kpiMay, duLieuMayHomNay, CHUYEN_KHONG_TEN,
} from '../../lib/mos/calculators/may-kpi.calculator.ts';

const s = scoreboard('LÕI SEWING');

const NEN = {
  soPhieuHomNay: 0, tongDat: 0, tongMucTieu: 0, tongSuaLai: 0,
  hieuSuatTheoChuyen: [], kimGayChuaTimThay: [],
};
const voi = (them) => ({ ...NEN, ...them });
const ma = (v) => v.map((x) => x.id);

console.log('\n① 🔴 KIM GÃY CHƯA TÌM ĐỦ MẢNH — ĐỨNG TRÊN MỌI VIỆC KHÁC');
{
  // Chuyền chạy tốt, sản lượng vượt mục tiêu, ⛔ không lỗi nào — và vẫn có một
  // mảnh kim loại có thể đang trong thùng hàng. Đây đúng là tình huống mà
  // ⛔ KHÔNG bảng số liệu nào tự nói ra.
  const dep = voi({
    soPhieuHomNay: 8, tongDat: 1000, tongMucTieu: 900, tongSuaLai: 0,
    hieuSuatTheoChuyen: [{ chuyen: 'C1', hieuSuat: 111 }],
    kimGayChuaTimThay: [{ chuyen: 'C1', may: 'M-07' }],
  });
  const v = viecCuaMay(dep);
  s.ok('Mọi chỉ số đẹp mà vẫn sinh việc kim gãy',
    ma(v).includes('may.kim-gay-chua-tim-thay'));
  s.ok('🔑 Việc đó đứng ĐẦU TIÊN', v[0]?.id === 'may.kim-gay-chua-tim-thay',
    ma(v).join(' · '));
  s.ok('Ở mức CRITICAL', v[0]?.severity === 'CRITICAL');
  s.ok('Dẫn tới NHẬT KÝ KIM GÃY, ⛔ không tới bảng sản lượng',
    v[0]?.href === MAY_NEO.kimGay, String(v[0]?.href));
  s.ok('Câu việc mang số vụ · chuyền · máy',
    v[0]?.vars?.soVu === 1 && v[0]?.vars?.chuyen === 'C1' && v[0]?.vars?.may === 'M-07',
    JSON.stringify(v[0]?.vars));

  // Vế ngược lại: tìm ĐỦ mảnh thì ⛔ KHÔNG sinh việc. Sự cố đã xử lý xong ⛔
  // không được nằm lại trong hộp thư — đó là cách hộp thư tích rác.
  const daTim = voi({ soPhieuHomNay: 8, tongDat: 1000, tongMucTieu: 900 });
  s.ok('Tìm đủ mảnh ⇒ ⛔ KHÔNG còn việc kim gãy',
    !ma(viecCuaMay(daTim)).includes('may.kim-gay-chua-tim-thay'));
}

console.log('\n② NGƯỠNG HIỆU SUẤT — ĐO ĐÚNG BA ĐIỂM QUANH RANH GIỚI');
{
  const lam = (dat) => voi({ soPhieuHomNay: 5, tongDat: dat, tongMucTieu: 1000 });
  s.ok(`trên ngưỡng (${NGUONG_HIEU_SUAT}%) ⇒ ⛔ KHÔNG nổ`,
    !ma(viecCuaMay(lam(860))).includes('may.hieu-suat-thap'));
  s.ok('ĐÚNG ngưỡng ⇒ ⛔ KHÔNG nổ (luật là "dưới", ⛔ không phải "chưa đạt")',
    !ma(viecCuaMay(lam(850))).includes('may.hieu-suat-thap'));
  s.ok('dưới ngưỡng ⇒ NỔ', ma(viecCuaMay(lam(840))).includes('may.hieu-suat-thap'));
}

console.log('\n③ CHUYỀN TỤT LẠI — ⛔ KHÔNG NHẮC KHI CẢ NHÀ MÁY ĐANG TỐT');
{
  // Chuyền thấp NHẤT ⛔ không đồng nghĩa chuyền CÓ VẤN ĐỀ. Nhắc chuyền thấp
  // nhất khi mọi chuyền đều trên ngưỡng là dạy người dùng bỏ qua cảnh báo.
  const deu_tot = voi({
    soPhieuHomNay: 5, tongDat: 950, tongMucTieu: 1000,
    hieuSuatTheoChuyen: [{ chuyen: 'A', hieuSuat: 97 }, { chuyen: 'B', hieuSuat: 92 }],
  });
  s.ok('Mọi chuyền trên ngưỡng ⇒ ⛔ KHÔNG nhắc chuyền nào',
    !ma(viecCuaMay(deu_tot)).includes('may.chuyen-tut-lai'));

  const co_kem = voi({
    soPhieuHomNay: 5, tongDat: 900, tongMucTieu: 1000,
    hieuSuatTheoChuyen: [{ chuyen: 'A', hieuSuat: 97 }, { chuyen: 'B', hieuSuat: 61 }],
  });
  const v = viecCuaMay(co_kem).find((x) => x.id === 'may.chuyen-tut-lai');
  s.ok('Có chuyền dưới ngưỡng ⇒ chỉ ĐÚNG chuyền đó', v?.vars?.chuyen === 'B',
    JSON.stringify(v?.vars));
}

console.log('\n④ TỶ LỆ SỬA LẠI');
{
  const lam = (sua) => voi({ soPhieuHomNay: 5, tongDat: 1000, tongMucTieu: 1000, tongSuaLai: sua });
  s.ok(`ĐÚNG ngưỡng ${NGUONG_SUA_LAI}% ⇒ ⛔ KHÔNG nổ`,
    !ma(viecCuaMay(lam(50))).includes('may.sua-lai-nhieu'));
  s.ok('vượt ngưỡng ⇒ NỔ', ma(viecCuaMay(lam(51))).includes('may.sua-lai-nhieu'));
}

console.log('\n⑤ 🔴 G-19 · MỌI VIỆC CẦN XỬ LÝ ĐỀU CÓ LỐI ĐI TIẾP');
{
  const canh = [
    ['kim gãy', voi({ soPhieuHomNay: 5, tongDat: 900, tongMucTieu: 1000,
      kimGayChuaTimThay: [{ chuyen: 'A', may: 'M1' }] })],
    ['⛔ chưa ghi sản lượng', NEN],
    ['hiệu suất thấp', voi({ soPhieuHomNay: 5, tongDat: 500, tongMucTieu: 1000 })],
    ['chuyền tụt lại', voi({ soPhieuHomNay: 5, tongDat: 900, tongMucTieu: 1000,
      hieuSuatTheoChuyen: [{ chuyen: 'B', hieuSuat: 40 }] })],
    ['sửa lại nhiều', voi({ soPhieuHomNay: 5, tongDat: 1000, tongMucTieu: 1000, tongSuaLai: 200 })],
  ];
  for (const [ten, d] of canh) {
    const canXuLy = viecCuaMay(d).filter((v) => v.severity !== 'INFO');
    const cut = canXuLy.filter((v) => !v.href).map((v) => v.id);
    s.ok(`${ten}: mọi việc CRITICAL/WARNING đều có href`,
      canXuLy.length > 0 && cut.length === 0, `ngõ cụt: ${cut.join(' · ')}`);
  }

  const onDinh = viecCuaMay(voi({ soPhieuHomNay: 6, tongDat: 1000, tongMucTieu: 1000 }));
  s.ok('Việc mức INFO ⛔ KHÔNG có href',
    onDinh.length === 1 && onDinh[0].severity === 'INFO' && !onDinh[0].href);
  s.ok('Mọi neo May là neo trong trang',
    Object.values(MAY_NEO).every((h) => h.startsWith('#')));
}

console.log('\n⑥ KPI — GỌI LẠI `garment-math`, ⛔ KHÔNG VIẾT CÔNG THỨC THỨ HAI');
{
  const k = kpiMay([
    { line_name: 'A', target_qty: 500, actual_qty: 450, rework_qty: 10 },
    { line_name: 'B', target_qty: 500, actual_qty: 400, rework_qty: 20 },
  ]);
  s.ok('Cộng đúng', k.tongDat === 850 && k.tongMucTieu === 1000 && k.tongSuaLai === 30);
  s.ok('Hiệu suất = 85%', k.hieuSuat === 85, String(k.hieuSuat));

  const r = kpiMay([]);
  s.ok('Tập rỗng ⇒ toàn 0, ⛔ KHÔNG NaN',
    [r.tongDat, r.tongMucTieu, r.tongSuaLai, r.hieuSuat, r.tyLeSuaLai].every((n) => n === 0),
    JSON.stringify(r));
}

console.log('\n⑦ 🔑 CHUYỀN CHƯA ĐẶT MỤC TIÊU ⛔ KHÔNG ĐƯỢC TÍNH LÀ 0%');
{
  // Một chuyền hiện `0%` chỉ vì **⛔ chưa ai khai mục tiêu** sẽ LUÔN đứng đầu
  // danh sách *"tụt lại"* — che mất chuyền đang THẬT SỰ có vấn đề.
  const nay = new Date().toISOString();
  const d = duLieuMayHomNay([
    { line_name: 'CHUA-KHAI', target_qty: 0, actual_qty: 0, rework_qty: 0, created_at: nay },
    { line_name: 'CO-VAN-DE', target_qty: 100, actual_qty: 40, rework_qty: 0, created_at: nay },
  ]);
  s.ok('Chuyền ⛔ chưa khai mục tiêu bị LOẠI khỏi bảng hiệu suất',
    d.hieuSuatTheoChuyen.length === 1 && d.hieuSuatTheoChuyen[0].chuyen === 'CO-VAN-DE',
    JSON.stringify(d.hieuSuatTheoChuyen));

  // Bản ghi ⛔ không khai tên chuyền phải có nhãn RÕ RÀNG, ⛔ không gộp vào ''.
  const d2 = duLieuMayHomNay([
    { target_qty: 100, actual_qty: 50, rework_qty: 0, created_at: nay },
  ]);
  s.ok('Bản ghi ⛔ không tên chuyền ⇒ nhãn rõ ràng, ⛔ không phải chuỗi rỗng',
    d2.hieuSuatTheoChuyen[0]?.chuyen === CHUYEN_KHONG_TEN,
    JSON.stringify(d2.hieuSuatTheoChuyen));
}

console.log('\n⑧ 🔴 KIM GÃY — CHỈ ĐẾM VỤ TRONG NGÀY VÀ CHƯA TÌM ĐỦ MẢNH');
{
  const nay = new Date();
  const homQua = new Date(nay.getTime() - 36 * 3600 * 1000).toISOString();
  const d = duLieuMayHomNay(
    [{ line_name: 'A', target_qty: 100, actual_qty: 100, rework_qty: 0, created_at: nay.toISOString() }],
    [
      { line_name: 'A', machine_code: 'M1', fragments_found: false, created_at: nay.toISOString() },
      { line_name: 'A', machine_code: 'M2', fragments_found: true, created_at: nay.toISOString() },
      { line_name: 'A', machine_code: 'M3', fragments_found: false, created_at: homQua },
    ],
  );
  s.ok('Chỉ vụ HÔM NAY và CHƯA tìm đủ mảnh mới thành việc',
    d.kimGayChuaTimThay.length === 1 && d.kimGayChuaTimThay[0].may === 'M1',
    JSON.stringify(d.kimGayChuaTimThay));
}

process.exit(s.ketThuc() ? 1 : 0);
