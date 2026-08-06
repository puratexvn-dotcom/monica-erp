// ============================================================================
// KIỂM: "ĐƠN HÀNG ĐANG Ở ĐÂU?" — `lib/mos/md/order-journey.ts`
//
// Hàm thuần, ⛔ không cần CSDL ⇒ chạy được trên CI ⛔ không bí mật.
//
// 🔴 Bài kiểm này canh ĐÚNG BỐN chỗ dễ sai nhất, và cả bốn đều sinh ra từ quy
// tắc thật của dự án:
//   ① chứng từ đã HUỶ ⛔ không được tính là bằng chứng
//   ② chặng KIỂM HÀNG phải trả `KHONG_DO_DUOC`, ⛔ KHÔNG phải `CHUA_TOI` (`V.1`)
//   ③ chặng ⛔ không đo được ⛔ không được KHOÁ vị trí của cả đơn
//   ④ "xong" nghĩa là MỌI chứng từ con đã xong, ⛔ không phải "có một cái xong"
// ============================================================================
import {
  tinhHanhTrinh, demTheoChang, CHANG, tinhPhanTram, soNgayConLai,
} from '../../lib/mos/md/order-journey.ts';

let dat = 0;
const hong = [];
const ok = (ten, dk, ghi = '') => {
  if (dk) { dat++; console.log(`  ✅ ${ten}`); return; }
  hong.push(ten); console.log(`  ⛔ ${ten}${ghi ? `\n       ${ghi}` : ''}`);
};
const chang = (h, c) => h.chang.find((x) => x.chang === c).trangThai;

console.log('═'.repeat(74));
console.log('MD — ĐƠN HÀNG ĐANG Ở ĐÂU?');
console.log('═'.repeat(74));

const PO = 'PO-001';
const base = { poNumber: PO, poStatus: 'IN_PRODUCTION', materials: [], productions: [], shipments: [] };

console.log('\n① Đơn vừa lập — chưa có chứng từ con nào');
{
  const h = tinhHanhTrinh(base);
  ok('PO luôn XONG', chang(h, 'PO') === 'XONG');
  ok('Vật tư CHUA_TOI', chang(h, 'VAT_TU') === 'CHUA_TOI');
  ok('Đơn đang đứng ở Vật tư', h.dangO === 'VAT_TU', `dangO=${h.dangO}`);
  ok('Đủ 6 chặng, đúng thứ tự', h.chang.map((c) => c.chang).join() === CHANG.join());
}

console.log('\n② 🔴 Chứng từ đã HUỶ ⛔ không được tính là bằng chứng');
{
  const h = tinhHanhTrinh({
    ...base,
    materials: [{ po_number: PO, status: 'CANCELLED' }, { po_number: PO, status: 'REJECTED' }],
  });
  ok('Vật tư vẫn CHUA_TOI khi mọi phiếu đã huỷ', chang(h, 'VAT_TU') === 'CHUA_TOI',
    'phiếu huỷ mà tính là "đang làm" ⇒ đơn trông như đang chạy trong khi ⛔ không có gì chạy');
}

console.log('\n③ 🔴 "Xong" = MỌI chứng từ xong, ⛔ không phải "có một cái xong"');
{
  const h = tinhHanhTrinh({
    ...base,
    materials: [{ po_number: PO, status: 'RECEIVED' }, { po_number: PO, status: 'ORDERED' }],
  });
  ok('1/2 phiếu nhận ⇒ DANG_LAM', chang(h, 'VAT_TU') === 'DANG_LAM');
  const t = tinhHanhTrinh({
    ...base,
    materials: [{ po_number: PO, status: 'RECEIVED' }, { po_number: PO, status: 'RECEIVED' }],
  });
  ok('2/2 phiếu nhận ⇒ XONG', chang(t, 'VAT_TU') === 'XONG');
}

console.log('\n④ 🔴 KIỂM HÀNG phải là ⚪ KHONG_DO_DUOC — `V.1`');
{
  const h = tinhHanhTrinh(base);
  ok('Kiểm hàng = KHONG_DO_DUOC', chang(h, 'KIEM_HANG') === 'KHONG_DO_DUOC',
    '🔴 MD ⛔ chưa có đường dữ liệu QA. Trả CHUA_TOI là để giao diện NÓI DỐI');
  ok('Có nói rõ "chưa đo được"', h.chang.find((c) => c.chang === 'KIEM_HANG').vi.includes('Chưa đo được'));
}

console.log('\n⑤ Chặng ⛔ không đo được ⛔ KHÔNG được khoá vị trí của cả đơn');
{
  const h = tinhHanhTrinh({
    ...base,
    materials: [{ po_number: PO, status: 'RECEIVED' }],
    productions: [{ po_number: PO, status: 'COMPLETED' }],
    shipments: [{ po_number: PO, status: 'BOOKED' }],
  });
  ok('Đơn nhảy qua Kiểm hàng, đứng ở Giao hàng', h.dangO === 'GIAO_HANG', `dangO=${h.dangO}`);
}

console.log('\n⑥ Đơn đã đóng');
{
  const h = tinhHanhTrinh({ ...base, poStatus: 'COMPLETED' });
  ok('Hoàn tất = XONG', chang(h, 'HOAN_TAT') === 'XONG');
  ok('⛔ Không còn chặng đang đứng', h.dangO === null);
}

console.log('\n⑦ Chứng từ của ĐƠN KHÁC ⛔ không được lẫn vào');
{
  const h = tinhHanhTrinh({ ...base, materials: [{ po_number: 'PO-999', status: 'RECEIVED' }] });
  ok('Lọc đúng theo po_number', chang(h, 'VAT_TU') === 'CHUA_TOI');
  const n = tinhHanhTrinh({ ...base, materials: [{ po_number: null, status: 'RECEIVED' }] });
  ok('po_number null ⛔ không gắn vào đơn nào', chang(n, 'VAT_TU') === 'CHUA_TOI');
}

console.log('\n⑧ Đếm theo chặng');
{
  const a = tinhHanhTrinh(base);
  const b = tinhHanhTrinh({ ...base, materials: [{ po_number: PO, status: 'RECEIVED' }] });
  const dem = demTheoChang([a, b]);
  ok('2 đơn được xếp vào đúng 2 chặng', dem.VAT_TU === 1 && dem.SAN_XUAT === 1,
    JSON.stringify(dem));
}

console.log('\n⑨ SỨC KHOẺ — 🟢 / 🟡 / 🔴');
{
  const g = (over) => tinhHanhTrinh({ ...base, today: '2026-08-06', ...over });
  ok('Còn 60 ngày ⇒ ON_TRACK', g({ deliveryDate: '2026-10-05' }).sucKhoe === 'ON_TRACK');
  ok('Còn 15 ngày ⇒ AT_RISK', g({ deliveryDate: '2026-08-21' }).sucKhoe === 'AT_RISK');
  ok('Còn 3 ngày ⇒ DELAYED', g({ deliveryDate: '2026-08-09' }).sucKhoe === 'DELAYED');
  ok('Quá hạn ⇒ DELAYED', g({ deliveryDate: '2026-08-01' }).sucKhoe === 'DELAYED');
  ok('⛔ Không có ngày giao ⇒ AT_RISK + nói rõ chưa đo được',
    g({}).sucKhoe === 'AT_RISK' && g({}).viSucKhoe.includes('Chưa có ngày giao'),
    '⛔ không được kết luận "đúng tiến độ" khi ⛔ không có ngày giao (`V.1`)');
  ok('Đơn đã đóng ⇒ ON_TRACK', g({ poStatus: 'COMPLETED', deliveryDate: '2026-08-01' }).sucKhoe === 'ON_TRACK');
}

console.log('\n⑩ 🔴 MỘT MỐC CON QUÁ HẠN ⇒ ĐỎ, dù ngày giao còn xa');
{
  const h = tinhHanhTrinh({
    ...base,
    today: '2026-08-06',
    deliveryDate: '2026-12-31',
    materials: [{ po_number: PO, status: 'ORDERED', so: 'NPL-01', moc: '2026-08-01' }],
  });
  ok('Phiếu NPL trễ ⇒ DELAYED', h.sucKhoe === 'DELAYED',
    'phiếu NPL trễ hôm nay là chuyền đói hàng ba tuần nữa — đó là điểm của việc theo dòng chảy');
}

console.log('\n⑪ 🔴 % HOÀN THÀNH bỏ chặng ⛔ không đo được khỏi MẪU SỐ');
{
  const h = tinhHanhTrinh(base);
  ok('Chỉ PO xong ⇒ 20% (1/5, ⛔ không phải 1/6)', h.phanTram === 20, `${h.phanTram}%`);
  const t = tinhHanhTrinh({
    ...base, poStatus: 'COMPLETED',
    materials: [{ po_number: PO, status: 'RECEIVED' }],
    productions: [{ po_number: PO, status: 'COMPLETED' }],
    shipments: [{ po_number: PO, status: 'DELIVERED' }],
  });
  ok('Xong hết 5 chặng đo được ⇒ 100%', t.phanTram === 100,
    `${t.phanTram}% — tính Kiểm hàng vào mẫu số thì ⛔ KHÔNG đơn nào đạt 100% được`);
  ok('tinhPhanTram bỏ đúng chặng KHONG_DO_DUOC',
    tinhPhanTram([
      { chang: 'PO', trangThai: 'XONG' }, { chang: 'KIEM_HANG', trangThai: 'KHONG_DO_DUOC' },
    ]) === 100);
}

console.log('\n⑫ VIỆC KẾ TIẾP');
{
  const h = tinhHanhTrinh({ ...base, today: '2026-08-06' });
  ok('Đang ở Vật tư ⇒ mở tab materials', h.viecKeTiep?.moTab === 'materials');
  ok('Có nêu VAI phụ trách', Boolean(h.viecKeTiep?.ai));
  const d = tinhHanhTrinh({ ...base, poStatus: 'COMPLETED' });
  ok('Đơn đã đóng ⇒ ⛔ KHÔNG có việc kế tiếp', d.viecKeTiep === null,
    'dựng nút bấm ⛔ không dẫn tới đâu là lời nói dối của giao diện');
}

console.log('\n⑬ BẰNG CHỨNG + MỐC + VAI');
{
  const h = tinhHanhTrinh({
    ...base,
    materials: [
      { po_number: PO, status: 'ORDERED', so: 'NPL-02', moc: '2026-09-01', evidence_path: 'x.pdf' },
      { po_number: PO, status: 'ORDERED', so: 'NPL-01', moc: '2026-08-20', evidence_path: null },
    ],
  });
  const c = h.chang.find((x) => x.chang === 'VAT_TU');
  ok('Gom đủ 2 bằng chứng', c.bangChung.length === 2);
  ok('Phân biệt được chứng từ CÓ tệp và CHƯA có tệp',
    c.bangChung.filter((b) => b.coTep).length === 1);
  ok('Mốc lấy ngày SỚM NHẤT', c.moc === '2026-08-20', c.moc);
  ok('Có vai phụ trách', c.chuTrach.length > 0);
}

console.log('\n⑭ soNgayConLai');
{
  ok('Cùng ngày ⇒ 0', soNgayConLai('2026-08-06', '2026-08-06') === 0);
  ok('Quá hạn ⇒ âm', soNgayConLai('2026-08-01', '2026-08-06') === -5);
  ok('Thiếu dữ liệu ⇒ null', soNgayConLai(null, '2026-08-06') === null);
}

console.log('\n' + '═'.repeat(74));
console.log(`${dat} đạt · ${hong.length} hỏng`);
console.log('═'.repeat(74));
process.exit(hong.length ? 1 : 0);
