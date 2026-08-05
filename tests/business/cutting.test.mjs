// ============================================================================
// LÕI CUTTING — LUẬT SINH VIỆC · KPI TỔ CẮT
//
// ─── VÌ SAO KHÂU CẮT ĐÁNG CANH CHẶT NHẤT ───────────────────────────────
// Vải chiếm phần lớn giá thành một mã hàng, và **cắt là khâu DUY NHẤT tiêu vải
// ⛔ không hoàn lại được**. Mọi khâu sau còn sửa được; vải đã cắt thì **mất
// vĩnh viễn**.
//
// ⚠️ Một luật sai ở đây ⛔ không làm sập gì cả — nó chỉ khiến tổ cắt **⛔ không
// thấy** một việc đáng thấy, và tới lúc phát hiện thì vải đã trên bàn cắt rồi.
// ============================================================================
import { scoreboard } from '../_lib/harness.mjs';
import {
  viecCuaCat, NGUONG_HAO_HUT, CAT_NEO,
} from '../../lib/mos/workspace/cat-work-items.ts';
import {
  kpiCat, duLieuCatHomNay, NGUONG_LECH,
} from '../../lib/mos/calculators/cat-kpi.calculator.ts';

const s = scoreboard('LÕI CUTTING');

const NEN = {
  soPhieuHomNay: 0, tongVaiDaTrai: 0, tongDauTam: 0, tongVaiLoi: 0,
  phieuThieu: [], phieuVuotDinhMuc: [],
};
const voi = (them) => ({ ...NEN, ...them });
const ma = (v) => v.map((x) => x.id);

console.log('\n① 🔴 CHƯA LẬP PHIẾU — VIỆC CHẶN CẢ KHÂU SAU');
{
  // Tổ cắt ⛔ không lập phiếu thì chuyền may **sắp đứng** — và bảng số liệu hôm
  // nay trông SẠCH BONG, vì ⛔ không có hao hụt nào được ghi.
  const v = viecCuaCat(NEN);
  s.ok('⛔ Chưa phiếu nào ⇒ sinh việc `cat.chua-lap-phieu`',
    ma(v).includes('cat.chua-lap-phieu'));
  s.ok('Ở mức CRITICAL', v[0]?.severity === 'CRITICAL');
  s.ok('Dẫn tới NƠI LẬP PHIẾU, ⛔ không tới bảng đang rỗng',
    v[0]?.href === CAT_NEO.lapPhieu, String(v[0]?.href));
  s.ok('⛔ KHÔNG kèm dòng "ổn định"', !ma(v).includes('cat.on-dinh'));
}

console.log('\n② NGƯỠNG HAO HỤT — ĐO ĐÚNG BA ĐIỂM QUANH RANH GIỚI');
{
  // `cuttingWastePercent(đã trải, trên sơ đồ)`. Hao hụt = đầu tấm + vải lỗi.
  // 1000m trải, hao 29m ⇒ 2,9% · 30m ⇒ 3,0% · 31m ⇒ 3,1%
  const lam = (hao) => voi({
    soPhieuHomNay: 4, tongVaiDaTrai: 1000, tongDauTam: hao, tongVaiLoi: 0,
  });
  s.ok(`dưới ngưỡng (${NGUONG_HAO_HUT}%) ⇒ ⛔ KHÔNG nổ`,
    !ma(viecCuaCat(lam(29))).includes('cat.vuot-hao-hut'));
  s.ok('ĐÚNG ngưỡng ⇒ ⛔ KHÔNG nổ (luật là "vượt", ⛔ không phải "đạt")',
    !ma(viecCuaCat(lam(30))).includes('cat.vuot-hao-hut'));
  s.ok('trên ngưỡng ⇒ NỔ', ma(viecCuaCat(lam(31))).includes('cat.vuot-hao-hut'));

  const v = viecCuaCat(lam(31)).find((x) => x.id === 'cat.vuot-hao-hut');
  s.ok('Câu việc mang cả tỷ lệ THẬT lẫn ngưỡng',
    v?.vars?.tyLe === '3.1' && v?.vars?.nguong === NGUONG_HAO_HUT,
    JSON.stringify(v?.vars));
}

console.log('\n③ 🔑 MỘT CÂU CHUYỆN, ⛔ KHÔNG PHẢI HAI CÂU NGƯỢC NHAU');
{
  const coViec = viecCuaCat(voi({
    soPhieuHomNay: 3, tongVaiDaTrai: 500, tongDauTam: 5, tongVaiLoi: 0,
    phieuThieu: [{ maPhieu: 'CT-01', thieu: 40 }],
  }));
  s.ok('Có việc thật ⇒ ⛔ KHÔNG kèm dòng "ổn định"', !ma(coViec).includes('cat.on-dinh'));

  const sach = viecCuaCat(voi({ soPhieuHomNay: 3, tongVaiDaTrai: 500, tongDauTam: 5 }));
  s.ok('⛔ Không việc thật ⇒ HIỆN dòng "ổn định"', ma(sach).join() === 'cat.on-dinh');
  s.ok('Dòng đó mang số phiếu đã lập', sach[0]?.vars?.soPhieu === 3);
}

console.log('\n④ 🔴 G-19 · MỌI VIỆC CẦN XỬ LÝ ĐỀU CÓ LỐI ĐI TIẾP');
{
  const canh = [
    ['⛔ chưa lập phiếu', NEN],
    ['vượt hao hụt', voi({ soPhieuHomNay: 4, tongVaiDaTrai: 1000, tongDauTam: 60 })],
    ['cắt thiếu', voi({ soPhieuHomNay: 4, tongVaiDaTrai: 500, tongDauTam: 2,
      phieuThieu: [{ maPhieu: 'CT-02', thieu: 12 }] })],
    ['vượt định mức', voi({ soPhieuHomNay: 4, tongVaiDaTrai: 500, tongDauTam: 2,
      phieuVuotDinhMuc: [{ maPhieu: 'CT-03', vuot: 8.5 }] })],
  ];
  for (const [ten, d] of canh) {
    const canXuLy = viecCuaCat(d).filter((v) => v.severity !== 'INFO');
    const cut = canXuLy.filter((v) => !v.href).map((v) => v.id);
    s.ok(`${ten}: mọi việc CRITICAL/WARNING đều có href (${canXuLy.length} việc)`,
      canXuLy.length > 0 && cut.length === 0, `ngõ cụt: ${cut.join(' · ')}`);
  }

  // Vế NGƯỢC LẠI, quan trọng ngang vế trên.
  const onDinh = viecCuaCat(voi({ soPhieuHomNay: 5, tongVaiDaTrai: 900, tongDauTam: 3 }));
  s.ok('Việc mức INFO ⛔ KHÔNG có href — ⛔ không giả vờ bấm được',
    onDinh.length === 1 && onDinh[0].severity === 'INFO' && !onDinh[0].href);

  s.ok('Mọi neo Cắt là neo trong trang',
    Object.values(CAT_NEO).every((h) => h.startsWith('#')),
    Object.values(CAT_NEO).join(' · '));
}

console.log('\n⑤ 🔴 CSDL TRẢ `NUMERIC` THÀNH CHUỖI — CỘNG THẲNG LÀ NỐI CHUỖI');
{
  // PostgREST trả `NUMERIC` dạng CHUỖI. `"12" + "8"` ra `"128"` — con số sai
  // đó ⛔ KHÔNG ném lỗi, nó chỉ lặng lẽ hiện ra màn hình.
  const k = kpiCat([
    { ticket_no: 'A', total_planned_pcs: 100, total_actual_pcs: 100,
      bom_allowance_m: '50', total_fabric_used_m: '12', remnant_length_m: '1', defect_length_m: '0' },
    { ticket_no: 'B', total_planned_pcs: 100, total_actual_pcs: 100,
      bom_allowance_m: '50', total_fabric_used_m: '8', remnant_length_m: '1', defect_length_m: '0' },
  ]);
  s.ok('Chuỗi số được CỘNG, ⛔ không bị NỐI ("12"+"8" = 20, ⛔ không phải 128)',
    k.tongVaiDaTrai === 20, String(k.tongVaiDaTrai));
  s.ok('Đầu tấm cộng đúng', k.tongDauTam === 2, String(k.tongDauTam));
  s.ok('Hao hụt = 2/20 = 10%', k.tyLeHaoHut === 10, String(k.tyLeHaoHut));

  const r = kpiCat([]);
  s.ok('Tập rỗng ⇒ toàn 0, ⛔ KHÔNG NaN',
    [r.tongBtp, r.tongVaiDaTrai, r.tongDauTam, r.tongVaiLoi, r.tyLeHaoHut].every((n) => n === 0),
    JSON.stringify(r));
}

console.log('\n⑥ 🔑 PHIẾU CHƯA CẮT ⛔ KHÔNG ĐƯỢC TÍNH LÀ "CẮT THIẾU"');
{
  // Phiếu vừa lập có `total_actual_pcs = 0`. Tính nó là *"thiếu toàn bộ"* sẽ
  // sinh một cảnh báo SAI ngay khi người ta vừa lập phiếu — và cảnh báo sai
  // làm người ta thôi đọc cảnh báo.
  const nay = new Date().toISOString();
  const d = duLieuCatHomNay([
    { ticket_no: 'CHUA-CAT', total_planned_pcs: 500, total_actual_pcs: 0,
      bom_allowance_m: '0', total_fabric_used_m: '0', remnant_length_m: '0',
      defect_length_m: '0', created_at: nay },
    { ticket_no: 'DA-CAT', total_planned_pcs: 500, total_actual_pcs: 480,
      bom_allowance_m: '0', total_fabric_used_m: '100', remnant_length_m: '2',
      defect_length_m: '0', created_at: nay },
  ]);
  s.ok('Phiếu ⛔ chưa cắt ⛔ KHÔNG bị coi là thiếu',
    d.phieuThieu.length === 1 && d.phieuThieu[0].maPhieu === 'DA-CAT',
    JSON.stringify(d.phieuThieu));
  s.ok(`Ngưỡng lệch là ${NGUONG_LECH} và phiếu thiếu 20 sp được bắt`,
    d.phieuThieu[0]?.thieu === 20);
}

console.log('\n⑦ 🔴 "HÔM NAY" THEO GIỜ VIỆT NAM — TỔ CẮT CÓ CA ĐÊM');
{
  const nay = new Date();
  const homQua = new Date(nay.getTime() - 36 * 3600 * 1000).toISOString();
  const d = duLieuCatHomNay([
    { ticket_no: 'HOM-NAY', total_planned_pcs: 100, total_actual_pcs: 100,
      bom_allowance_m: '0', total_fabric_used_m: '50', remnant_length_m: '1',
      defect_length_m: '0', created_at: nay.toISOString() },
    { ticket_no: 'HOM-QUA', total_planned_pcs: 100, total_actual_pcs: 100,
      bom_allowance_m: '0', total_fabric_used_m: '999', remnant_length_m: '900',
      defect_length_m: '0', created_at: homQua },
  ]);
  s.ok('Chỉ đếm phiếu HÔM NAY', d.soPhieuHomNay === 1, String(d.soPhieuHomNay));
  s.ok('Số liệu hôm qua ⛔ KHÔNG lẫn vào',
    d.tongVaiDaTrai === 50 && d.tongDauTam === 1);
}

console.log('\n⑧ VƯỢT ĐỊNH MỨC — CHỈ XÉT PHIẾU CÓ KHAI ĐỊNH MỨC');
{
  const nay = new Date().toISOString();
  const d = duLieuCatHomNay([
    // ⚠️ `bom_allowance_m = 0` nghĩa là **⛔ CHƯA KHAI** định mức, ⛔ không phải
    // *"định mức bằng 0"*. Coi nó là 0 thật thì MỌI phiếu đều "vượt định mức".
    { ticket_no: 'CHUA-KHAI', total_planned_pcs: 10, total_actual_pcs: 10,
      bom_allowance_m: '0', total_fabric_used_m: '80', remnant_length_m: '0',
      defect_length_m: '0', created_at: nay },
    { ticket_no: 'VUOT', total_planned_pcs: 10, total_actual_pcs: 10,
      bom_allowance_m: '50', total_fabric_used_m: '58.5', remnant_length_m: '0',
      defect_length_m: '0', created_at: nay },
  ]);
  s.ok('Phiếu ⛔ CHƯA KHAI định mức ⛔ KHÔNG bị coi là vượt',
    d.phieuVuotDinhMuc.length === 1 && d.phieuVuotDinhMuc[0].maPhieu === 'VUOT',
    JSON.stringify(d.phieuVuotDinhMuc));
  s.ok('Số mét vượt tính đúng (58,5 − 50 = 8,5)',
    Math.abs(d.phieuVuotDinhMuc[0].vuot - 8.5) < 1e-9,
    String(d.phieuVuotDinhMuc[0]?.vuot));
}

process.exit(s.ketThuc() ? 1 : 0);
