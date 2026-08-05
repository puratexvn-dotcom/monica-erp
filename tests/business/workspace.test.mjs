// ============================================================================
// LÕI WORKSPACE — WORK ITEM · KPI QA
//
// ─── VÌ SAO BÀI KIỂM NÀY LÀ THỨ ĐÁNG TIN NHẤT TRONG CẢ SPRINT ──────────
// Toàn bộ câu trả lời cho *"hôm nay tôi cần làm gì?"* nằm ở **hàm thuần**:
// ⛔ không CSDL, ⛔ không React, ⛔ không trình duyệt. Nghĩa là nó **kiểm được
// đến tận cùng** — khác hẳn phần giao diện, nơi `F-8` vẫn còn nguyên.
//
// ⚠️ Việc sai ở đây ⛔ không làm sập gì cả. Nó chỉ khiến QA **⛔ không thấy**
// một việc đáng thấy — và đó là loại lỗi ⛔ không ai báo, vì ⛔ không ai biết
// mình đang thiếu thứ gì.
// ============================================================================
import { scoreboard } from '../_lib/harness.mjs';
import { chieuViec, demTheoMuc } from '../../lib/mos/workspace/work-item.ts';
import { viecCuaQA, NGUONG_TY_LE_LOI, NGUONG_LOI_LAP } from '../../lib/mos/workspace/qa-work-items.ts';
import { kpiQA, duLieuQAHomNay } from '../../lib/mos/calculators/qa-kpi.calculator.ts';

const s = scoreboard('LÕI WORKSPACE');

/** Dữ liệu QA rỗng — mọi phép đo bắt đầu từ đây rồi bật từng vế lên. */
const NEN = {
  soPhieuHomNay: 0, tongKiem: 0, tongLoi: 0,
  loiTheoChuyen: [], loiTheoLoai: [],
};
const voi = (them) => ({ ...NEN, ...them });
const ma = (viec) => viec.map((v) => v.id);

console.log('\n① 🔴 VIỆC QUAN TRỌNG NHẤT LÀ VIỆC CHƯA XẢY RA');
{
  // Chuyền chạy cả buổi mà ⛔ không ai rút kiểm ⇒ bảng số liệu trông SẠCH
  // BONG, vì ⛔ không có lỗi nào được ghi. Bảng càng đẹp thì rủi ro càng lớn.
  // ⛔ Không luật nào khác bắt được tình huống này.
  const v = viecCuaQA(NEN);
  s.ok('⛔ Chưa phiếu nào ⇒ sinh việc `qa.chua-kiem`', ma(v).includes('qa.chua-kiem'));
  s.ok('Việc đó ở mức CRITICAL', v[0]?.severity === 'CRITICAL');
  s.ok('⛔ KHÔNG kèm dòng "ổn định"', !ma(v).includes('qa.on-dinh'));
}

console.log('\n② NGƯỠNG TỶ LỆ LỖI — ĐÚNG MỘT VẾ, ⛔ KHÔNG LỆCH MỘT BƯỚC');
{
  // Ranh giới là chỗ dễ sai nhất: `>` hay `>=` lệch một nấc là ngưỡng đổi
  // nghĩa. Đo đúng ba điểm quanh ranh giới.
  const duoi = viecCuaQA(voi({ soPhieuHomNay: 5, tongKiem: 1000, tongLoi: 29 }));  // 2,9%
  const bang = viecCuaQA(voi({ soPhieuHomNay: 5, tongKiem: 1000, tongLoi: 30 }));  // 3,0%
  const tren = viecCuaQA(voi({ soPhieuHomNay: 5, tongKiem: 1000, tongLoi: 31 }));  // 3,1%

  s.ok(`dưới ngưỡng (${NGUONG_TY_LE_LOI}%) ⇒ ⛔ KHÔNG nổ`, !ma(duoi).includes('qa.vuot-nguong-loi'));
  s.ok('ĐÚNG ngưỡng ⇒ ⛔ KHÔNG nổ (luật là "vượt", ⛔ không phải "đạt")',
    !ma(bang).includes('qa.vuot-nguong-loi'));
  s.ok('trên ngưỡng ⇒ NỔ', ma(tren).includes('qa.vuot-nguong-loi'));

  const v = tren.find((x) => x.id === 'qa.vuot-nguong-loi');
  s.ok('Câu việc mang cả tỷ lệ THẬT lẫn ngưỡng',
    v?.vars?.tyLe === '3.1' && v?.vars?.nguong === NGUONG_TY_LE_LOI,
    JSON.stringify(v?.vars));
}

console.log('\n③ 🔑 MỘT CÂU CHUYỆN, ⛔ KHÔNG PHẢI HAI CÂU NGƯỢC NHAU');
{
  // Vế dễ làm sai nhất của cả bộ luật: nếu có việc thật, dòng "hôm nay ổn
  // định" PHẢI biến mất. Để hai dòng cạnh nhau thì người đọc sẽ tin dòng dễ
  // chịu hơn — và hộp thư việc thôi đáng tin.
  const co_loi = viecCuaQA(voi({
    soPhieuHomNay: 8, tongKiem: 500, tongLoi: 50,
    loiTheoChuyen: [{ chuyen: 'Chuyền 3', soLoi: 40 }],
  }));
  s.ok('Có việc thật ⇒ ⛔ KHÔNG kèm dòng "ổn định"', !ma(co_loi).includes('qa.on-dinh'));
  s.ok('Và các việc thật vẫn còn đủ', co_loi.length >= 2, ma(co_loi).join(' · '));

  const sach = viecCuaQA(voi({ soPhieuHomNay: 8, tongKiem: 500, tongLoi: 0 }));
  s.ok('⛔ Không việc thật ⇒ HIỆN dòng "ổn định"', ma(sach).join() === 'qa.on-dinh');
  s.ok('Dòng đó mang số phiếu đã ghi', sach[0]?.vars?.soPhieu === 8);
}

console.log('\n④ XẾP THEO MỨC KHẨN — VÀ ỔN ĐỊNH GIỮA HAI LẦN TẢI');
{
  const d = voi({
    soPhieuHomNay: 4, tongKiem: 200, tongLoi: 40,
    loiTheoChuyen: [{ chuyen: 'A', soLoi: 10 }, { chuyen: 'B', soLoi: 30 }],
    loiTheoLoai: [{ loai: 'Bỏ mũi', soLan: 4 }],
  });
  const v = viecCuaQA(d);
  const muc = v.map((x) => x.severity);
  s.ok('CRITICAL đứng trước WARNING',
    muc.indexOf('CRITICAL') === 0 && muc.lastIndexOf('CRITICAL') < muc.indexOf('WARNING'),
    muc.join(' · '));

  // Danh sách nhảy chỗ mỗi lần làm mới là thứ khiến người dùng thôi tin nó.
  s.ok('Chạy hai lần ⇒ THỨ TỰ Y HỆT', ma(viecCuaQA(d)).join('|') === ma(v).join('|'));

  const dem = demTheoMuc(v);
  s.ok('demTheoMuc trả ĐỦ ba khoá kể cả khi bằng 0',
    ['CRITICAL', 'WARNING', 'INFO'].every((k) => typeof dem[k] === 'number'));
  s.ok('Tổng đếm khớp số việc',
    dem.CRITICAL + dem.WARNING + dem.INFO === v.length);
}

console.log('\n⑤ CHUYỀN NHIỀU LỖI NHẤT — MỘT VIỆC, ⛔ KHÔNG PHẢI MƯỜI DÒNG');
{
  const v = viecCuaQA(voi({
    soPhieuHomNay: 6, tongKiem: 900, tongLoi: 12,
    loiTheoChuyen: [{ chuyen: 'A', soLoi: 2 }, { chuyen: 'B', soLoi: 9 }, { chuyen: 'C', soLoi: 1 }],
  }));
  const x = v.find((i) => i.id === 'qa.chuyen-nhieu-loi');
  s.ok('Chọn ĐÚNG chuyền lỗi nhiều nhất', x?.vars?.chuyen === 'B' && x?.vars?.soLoi === 9,
    JSON.stringify(x?.vars));
  s.ok('Ba chuyền có lỗi ⇒ vẫn CHỈ MỘT dòng việc (`WI-2`)',
    v.filter((i) => i.id === 'qa.chuyen-nhieu-loi').length === 1);
}

console.log('\n⑥ LỖI LẶP LẠI — ĐẾM THEO SỐ PHIẾU, ⛔ KHÔNG THEO SỐ LƯỢNG');
{
  const duoi = viecCuaQA(voi({ soPhieuHomNay: 3, tongKiem: 900, tongLoi: 2,
    loiTheoLoai: [{ loai: 'Sụp mí', soLan: NGUONG_LOI_LAP - 1 }] }));
  const dat = viecCuaQA(voi({ soPhieuHomNay: 3, tongKiem: 900, tongLoi: 2,
    loiTheoLoai: [{ loai: 'Sụp mí', soLan: NGUONG_LOI_LAP }] }));
  s.ok(`dưới ${NGUONG_LOI_LAP} lần ⇒ ⛔ KHÔNG nổ`, !ma(duoi).includes('qa.loi-lap-lai'));
  s.ok(`ĐÚNG ${NGUONG_LOI_LAP} lần ⇒ NỔ (luật là "≥")`, ma(dat).includes('qa.loi-lap-lai'));
}

console.log('\n⑦ KPI — GỌI LẠI `garment-math`, ⛔ KHÔNG VIẾT CÔNG THỨC THỨ HAI');
{
  const phieu = [
    { line_name: 'A', inspected_qty: 100, passed_qty: 95, defect_qty: 5 },
    { line_name: 'B', inspected_qty: 100, passed_qty: 90, defect_qty: 10 },
  ];
  const k = kpiQA(phieu);
  s.ok('Cộng đúng', k.tongKiem === 200 && k.tongDat === 185 && k.tongLoi === 15);
  s.ok('Tỷ lệ lỗi = 7,5%', k.tyLeLoi === 7.5, String(k.tyLeLoi));
  s.ok('RFT = 92,5%', k.rft === 92.5, String(k.rft));

  // ⚠️ Tập RỖNG phải ra 0, ⛔ KHÔNG ra NaN. `NaN` lọt ra HTML là đúng thứ
  // nghi thức nghiệm thu §5 mục 3 bắt phải chặn — và nó ⛔ không làm hỏng build.
  const r = kpiQA([]);
  s.ok('Tập rỗng ⇒ toàn 0, ⛔ KHÔNG NaN',
    [r.tongKiem, r.tongDat, r.tongLoi, r.tyLeLoi, r.dhu, r.rft].every((n) => n === 0),
    JSON.stringify(r));
}

console.log('\n⑧ 🔴 "HÔM NAY" TÍNH THEO GIỜ VIỆT NAM');
{
  // Máy chủ chạy UTC. Từ 00:00 tới 07:00 giờ VN, phép so theo UTC coi ca đêm
  // là "hôm qua" — và hộp thư việc của QA ca đêm sẽ TRỐNG TRƠN đúng lúc họ
  // cần nó nhất. `laHomNayVN` tồn tại chính vì chuyện đó.
  const nay = new Date();
  const homQua = new Date(nay.getTime() - 36 * 3600 * 1000).toISOString();
  const d = duLieuQAHomNay([
    { line_name: 'A', inspected_qty: 100, passed_qty: 90, defect_qty: 10, created_at: nay.toISOString(),
      qa_defects: [{ defect_type: 'Bỏ mũi', quantity: 4 }] },
    { line_name: 'B', inspected_qty: 999, passed_qty: 0, defect_qty: 999, created_at: homQua,
      qa_defects: [{ defect_type: 'Dơ vải', quantity: 999 }] },
  ]);
  s.ok('Chỉ đếm phiếu HÔM NAY', d.soPhieuHomNay === 1, String(d.soPhieuHomNay));
  s.ok('Số liệu hôm qua ⛔ KHÔNG lẫn vào', d.tongKiem === 100 && d.tongLoi === 10);
  s.ok('Loại lỗi hôm qua ⛔ KHÔNG lẫn vào',
    d.loiTheoLoai.length === 1 && d.loiTheoLoai[0].loai === 'Bỏ mũi');
  s.ok('Đếm theo SỐ PHIẾU, ⛔ không theo số lượng (4 cái ⇒ 1 lần)',
    d.loiTheoLoai[0].soLan === 1, String(d.loiTheoLoai[0].soLan));
}

console.log('\n⑨ ENGINE CHIẾU VIỆC — ⛔ KHÔNG BIẾT DOMAIN NÀO CẢ');
{
  // `chieuViec` phải chạy được với BẤT KỲ hình dạng dữ liệu nào — đó là điều
  // kiện để Workspace thứ hai dùng lại nó mà ⛔ không sửa một dòng engine.
  const luat = [
    { id: 'a', severity: 'INFO', labelKey: 'x.a', danhGia: () => ({ nổ: true }) },
    { id: 'b', severity: 'CRITICAL', labelKey: 'x.b', danhGia: () => ({ nổ: true }) },
    { id: 'c', severity: 'WARNING', labelKey: 'x.c', danhGia: () => ({ nổ: false }) },
  ];
  const v = chieuViec(luat, { batKy: 'gì cũng được' });
  s.ok('Luật ⛔ không nổ thì ⛔ không sinh việc', v.length === 2);
  s.ok('Xếp lại theo mức khẩn', v.map((x) => x.id).join('|') === 'b|a');
  s.ok('Danh sách luật rỗng ⇒ ⛔ không sinh việc', chieuViec([], {}).length === 0);
}

process.exit(s.ketThuc() ? 1 : 0);
