// ============================================================================
// KIỂM: HỘP THƯ DUYỆT GIÁ + BÁO CÁO NGÀY CỦA MD
//
// Hàm thuần, ⛔ không cần CSDL.
//
// 🔴 Canh đúng ba chỗ khiến một bản báo cáo gửi sếp trở thành LỜI NÓI DỐI:
//   ① "0 sản phẩm" khi thật ra là "⚪ chưa ai báo cáo"  (`V.1`)
//   ② tỉ lệ lỗi `0%` khi ⛔ chưa ai kiểm
//   ③ cùng một bản chiết tính hiện SAI VIỆC cho sai vai
// ============================================================================
import { xepHopThu } from '../../lib/mos/md/costing-inbox.ts';
import { tongHopNgay } from '../../lib/mos/md/daily-digest.ts';

let dat = 0; const hong = [];
const ok = (t, dk, g = '') => { if (dk) { dat++; console.log(`  ✅ ${t}`); return; } hong.push(t); console.log(`  ⛔ ${t}${g ? `\n       ${g}` : ''}`); };

console.log('═'.repeat(74));
console.log('MD — HỘP THƯ DUYỆT GIÁ + BÁO CÁO NGÀY');
console.log('═'.repeat(74));

const ban = (o) => ({
  id: o.id ?? 'x', costing_no: o.no ?? 'CT-1', customer_name: 'Uniqlo',
  status: o.status, reject_reason: o.ly ?? null, quoted_price: 5, currency: 'USD',
});

console.log('\n① 🔴 CÙNG MỘT BẢN, HAI VAI, HAI Ý NGHĨA NGƯỢC NHAU');
{
  const ds = [ban({ status: 'SUBMITTED' })];
  const gd = xepHopThu(ds, 'giamdoc');
  const md = xepHopThu(ds, 'md');
  ok('Giám đốc: SUBMITTED ⇒ việc CẦN XỬ LÝ', gd.canXuLy.length === 1 && gd.dangCho.length === 0);
  ok('MD: SUBMITTED ⇒ chỉ THEO DÕI', md.dangCho.length === 1 && md.canXuLy.length === 0,
    'gộp chung là bắt mỗi người tự lọc bằng mắt');
  ok('Giám đốc thấy đúng câu việc', gd.canXuLy[0].viec.includes('Chờ bạn duyệt'));
  ok('MD thấy đúng câu việc', md.dangCho[0].viec.includes('đang chờ'));
}

console.log('\n② BỊ TRẢ LẠI LÀ VIỆC CỦA NGƯỜI LẬP');
{
  const ds = [ban({ status: 'REJECTED', ly: 'Giá vải cao hơn thị trường 12%' })];
  const md = xepHopThu(ds, 'md');
  const gd = xepHopThu(ds, 'giamdoc');
  ok('MD: bị từ chối ⇒ CẦN XỬ LÝ', md.canXuLy.length === 1);
  ok('Giám đốc: chỉ theo dõi', gd.dangCho.length === 1 && gd.canXuLy.length === 0);
  ok('🔴 Lý do hiện NGAY trong hộp thư', md.canXuLy[0].lyDo.includes('Giá vải cao hơn'),
    '⛔ không biết sửa gì thì vòng trình duyệt chạy vô tận');
  ok('REVISE cũng vào việc của MD', xepHopThu([ban({ status: 'REVISE', ly: 'x' })], 'md').canXuLy.length === 1);
}

console.log('\n③ ⛔ KHÔNG CÓ LÝ DO ⇒ NÓI THẲNG, ⛔ KHÔNG ĐỂ TRỐNG');
{
  const md = xepHopThu([ban({ status: 'REJECTED', ly: null })], 'md');
  ok('Báo rõ là ⛔ không ghi lý do', md.canXuLy[0].lyDo.includes('Không ghi lý do'));
  ok('⛔ Không trả chuỗi rỗng', md.canXuLy[0].lyDo.trim().length > 0);
}

console.log('\n④ Trạng thái khác ⛔ không lọt vào hộp thư');
{
  const h = xepHopThu([ban({ status: 'DRAFT' }), ban({ status: 'APPROVED' })], 'md');
  ok('DRAFT và APPROVED ⛔ không vào hộp thư', h.canXuLy.length === 0 && h.dangCho.length === 0);
  ok('⛔ Không có gì ⇒ tomTat = null (⛔ không hiện dải)', h.tomTat === null);
}

// ─── BÁO CÁO NGÀY ──────────────────────────────────────────────────────────
const NGAY = '2026-08-06';
const rong = { ngay: NGAY, sanLuong: [], subcon: [], kiem: [], don: [], nplTre: [] };

console.log('\n⑤ 🔴 NGÀY CHƯA AI BÁO CÁO ⇒ "⚪ CHƯA ĐO ĐƯỢC", ⛔ KHÔNG PHẢI "0"');
{
  const b = tongHopNgay(rong);
  ok('Đánh dấu là rỗng', b.rong === true);
  ok('Sản lượng = null, ⛔ không phải 0', b.chiSo.find((c) => c.nhan.includes('Sản lượng nội bộ')).gia === null,
    'ghi "0 sp" khi ⛔ chưa ai báo là để báo cáo NÓI DỐI sếp');
  ok('Tỉ lệ lỗi = null khi ⛔ chưa kiểm', b.chiSo.find((c) => c.nhan.includes('Tỉ lệ lỗi')).gia === null);
  ok('Mỗi chỉ số rỗng đều có câu giải thích', b.chiSo.filter((c) => c.gia === null).every((c) => (c.vi ?? '').length > 0));
  ok('Nhắc việc: đi đòi báo cáo', b.nhacViec.some((v) => v.includes('nhắc') || v.includes('Nhắc')));
}

console.log('\n⑥ Ngày có số liệu thật');
{
  const b = tongHopNgay({
    ...rong,
    sanLuong: [{ department: 'Chuyền 1', target_qty: 1000, actual_qty: 950, defect_qty: 20 }],
    subcon: [{ subcon: 'Xưởng A', output_qty: 300, issues: 0 }],
    kiem: [{ inspected_qty: 200, defect_qty: 4 }],
  });
  ok('⛔ Không còn rỗng', b.rong === false);
  ok('Sản lượng nội bộ = 950', b.chiSo.find((c) => c.nhan.includes('Sản lượng nội bộ')).gia === 950);
  ok('Đạt kế hoạch = 95%', b.chiSo.find((c) => c.nhan.includes('Đạt kế hoạch')).gia === 95);
  ok('Gia công ngoài = 300', b.chiSo.find((c) => c.nhan.includes('gia công ngoài')).gia === 300);
  ok('Tỉ lệ lỗi = 2%', b.chiSo.find((c) => c.nhan.includes('Tỉ lệ lỗi')).gia === 2);
  ok('95% ⇒ ⛔ chưa cảnh báo sản lượng', !b.canhBao.some((c) => c.tieuDe.includes('dưới kế hoạch')));
}

console.log('\n⑦ Cảnh báo — và xếp NGHIÊM TRỌNG lên trước');
{
  const b = tongHopNgay({
    ...rong,
    sanLuong: [{ department: 'C1', target_qty: 1000, actual_qty: 600, defect_qty: 0 }],
    kiem: [{ inspected_qty: 100, defect_qty: 12 }],
    subcon: [{ subcon: 'A', output_qty: 100, issues: 2 }],
    don: [{ po_number: 'PO-1', delivery_date: '2026-08-01', status: 'IN_PRODUCTION' }],
    nplTre: [{ request_no: 'NPL-9', needed_date: '2026-08-02' }],
  });
  ok('Sản lượng 60% ⇒ NGHIÊM TRỌNG', b.canhBao.some((c) => c.tieuDe.includes('dưới kế hoạch') && c.mucDo === 'NGHIEM_TRONG'));
  ok('Lỗi 12% ⇒ NGHIÊM TRỌNG', b.canhBao.some((c) => c.tieuDe.includes('lỗi vượt ngưỡng') && c.mucDo === 'NGHIEM_TRONG'));
  ok('Nhà thầu báo sự cố ⇒ có cảnh báo', b.canhBao.some((c) => c.tieuDe.includes('sự cố')));
  ok('Đơn quá hạn ⇒ NGHIÊM TRỌNG', b.canhBao.some((c) => c.tieuDe.includes('quá hạn giao')));
  ok('NPL quá mốc ⇒ NGHIÊM TRỌNG', b.canhBao.some((c) => c.tieuDe.includes('quá mốc cần hàng')));
  ok('NGHIÊM TRỌNG xếp trước CẢNH BÁO', b.canhBao[0].mucDo === 'NGHIEM_TRONG');
}

console.log('\n⑧ 🔴 ⛔ KHÔNG SINH NaN / Infinity TRONG BÁO CÁO GỬI SẾP');
{
  const b = tongHopNgay({
    ...rong,
    sanLuong: [{ department: 'C1', target_qty: 0, actual_qty: 0, defect_qty: 0 }],
    kiem: [{ inspected_qty: 0, defect_qty: 0 }],
  });
  ok('Kế hoạch 0 ⇒ Đạt kế hoạch = null', b.chiSo.find((c) => c.nhan.includes('Đạt kế hoạch')).gia === null);
  ok('Kiểm 0 sp ⇒ tỉ lệ lỗi = null', b.chiSo.find((c) => c.nhan.includes('Tỉ lệ lỗi')).gia === null);
  ok('Mọi chỉ số đều hữu hạn hoặc null',
    b.chiSo.every((c) => c.gia === null || Number.isFinite(c.gia)));
  ok('Ngày giao hỏng khuôn ⇒ bỏ qua, ⛔ không nổ',
    tongHopNgay({ ...rong, don: [{ po_number: 'X', delivery_date: 'sai-ngay', status: 'IN_PRODUCTION' }] }).canhBao.length === 0);
  ok('⛔ Không ngày giao ⇒ bỏ qua',
    tongHopNgay({ ...rong, don: [{ po_number: 'X', delivery_date: null, status: 'IN_PRODUCTION' }] }).canhBao.length === 0);
}

console.log('\n⑨ Đơn đã hoàn thành ⛔ không cảnh báo nữa');
{
  const b = tongHopNgay({ ...rong, don: [{ po_number: 'P', delivery_date: '2026-08-01', status: 'COMPLETED' }] });
  ok('⛔ Không cảnh báo đơn đã đóng', b.canhBao.length === 0);
}

console.log('\n' + '═'.repeat(74));
console.log(`${dat} đạt · ${hong.length} hỏng`);
console.log('═'.repeat(74));
process.exit(hong.length ? 1 : 0);
