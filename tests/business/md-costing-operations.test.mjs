// ============================================================================
// KIỂM: CHIẾT TÍNH THEO CÔNG ĐOẠN — `lib/mos/md/operations.ts`
//
// Hàm thuần, ⛔ không cần CSDL ⇒ chạy được trên CI ⛔ không bí mật.
//
// 🔴 Bài kiểm canh đúng những chỗ làm SAI GIÁ THÀNH — mà giá sai thì chỉ lộ ra
// sau khi đã ký hợp đồng:
//   ① biên lợi nhuận phải CHIA (1−b), ⛔ không NHÂN (1+b)
//   ② hiệu suất chuyền ⛔ không được bỏ qua
//   ③ ⛔ không bao giờ để `NaN` / `Infinity` chạy ra màn hình báo giá
// ============================================================================
import {
  CONG_DOAN, congDoanTheoNhom, macDinhTheoNhom, tinhCM, giaChaoBan, bienThucTe,
  NHOM_SAN_PHAM, KHAU,
} from '../../lib/mos/md/operations.ts';
import { duocDuyet, duocTrinh, kiemQuyen } from '../../lib/mos/md/costing-approval.ts';
import { duocSuaPo, kiemSuaPo, canhBaoGiamSoLuong, PO_TIEN_DO } from '../../lib/mos/md/po-edit.ts';

let dat = 0; const hong = [];
const ok = (t, dk, g = '') => { if (dk) { dat++; console.log(`  ✅ ${t}`); return; } hong.push(t); console.log(`  ⛔ ${t}${g ? `\n       ${g}` : ''}`); };
const gan = (a, b, eps = 0.005) => Math.abs(a - b) < eps;

console.log('═'.repeat(74));
console.log('MD — CHIẾT TÍNH THEO CÔNG ĐOẠN');
console.log('═'.repeat(74));

console.log('\n① Danh mục công đoạn');
{
  ok('Mã công đoạn duy nhất', new Set(CONG_DOAN.map((c) => c.ma)).size === CONG_DOAN.length);
  ok('Mọi SAM đều > 0', CONG_DOAN.every((c) => c.sam > 0));
  ok('Mọi khâu đều hợp lệ', CONG_DOAN.every((c) => KHAU.includes(c.khau)));
  ok('Mọi nhóm sản phẩm đều có công đoạn',
    NHOM_SAN_PHAM.every((n) => congDoanTheoNhom(n).length > 0));
  ok('Áo thun ⛔ KHÔNG có "Tra lưng quần"',
    !congDoanTheoNhom('TSHIRT').some((c) => c.ma === 'SEW-WAIST'),
    'lọc theo nhóm sai thì người dùng tích nhầm công đoạn của sản phẩm khác');
  ok('Quần CÓ "Tra lưng quần"', congDoanTheoNhom('TROUSER').some((c) => c.ma === 'SEW-WAIST'));
  ok('Mỗi nhóm đều có sẵn công đoạn tích mặc định',
    NHOM_SAN_PHAM.every((n) => macDinhTheoNhom(n).length > 0));
}

console.log('\n② Tính CM — cộng SAM và chia hiệu suất');
{
  const dong = [
    { ma: 'A', ten: 'a', khau: 'CAT', sam: 2 },
    { ma: 'B', ten: 'b', khau: 'MAY', sam: 8 },
  ];
  const r = tinhCM(dong, { giaPhut: 0.05, hieuSuat: 80, overhead: 0 });
  ok('Tổng SAM = 10', r.tongSam === 10);
  ok('SAM thực tế = 10 / 0,8 = 12,5', gan(r.samThucTe, 12.5), `${r.samThucTe}`);
  ok('Nhân công = 12,5 × 0,05 = 0,625', gan(r.nhanCong, 0.625), `${r.nhanCong}`);
  ok('Gom đúng theo khâu', r.theoKhau.CAT === 2 && r.theoKhau.MAY === 8);
}

console.log('\n③ 🔴 HIỆU SUẤT CHUYỀN ⛔ KHÔNG ĐƯỢC BỎ QUA');
{
  const dong = [{ ma: 'A', ten: 'a', khau: 'MAY', sam: 10 }];
  const day = tinhCM(dong, { giaPhut: 0.05, hieuSuat: 100, overhead: 0 });
  const that = tinhCM(dong, { giaPhut: 0.05, hieuSuat: 70, overhead: 0 });
  ok('Hiệu suất 70% đắt hơn 100%', that.cmMotSanPham > day.cmMotSanPham,
    'bỏ qua hiệu suất = báo giá THẤP HƠN giá thành thật');
  ok('Đắt hơn đúng tỉ lệ 1/0,7', gan(that.cmMotSanPham / day.cmMotSanPham, 1 / 0.7));
}

console.log('\n④ Phụ phí quản lý xưởng');
{
  const dong = [{ ma: 'A', ten: 'a', khau: 'MAY', sam: 10 }];
  const r = tinhCM(dong, { giaPhut: 0.1, hieuSuat: 100, overhead: 20 });
  ok('Nhân công = 1,0', gan(r.nhanCong, 1));
  ok('Overhead 20% = 0,2', gan(r.overhead, 0.2));
  ok('CM = 1,2', gan(r.cmMotSanPham, 1.2), `${r.cmMotSanPham}`);
}

console.log('\n⑤ 🔴 BIÊN LỢI NHUẬN: CHIA (1−b), ⛔ KHÔNG NHÂN (1+b)');
{
  const { gia, hopLe } = giaChaoBan(8.5, 15);
  ok('Giá vốn 8,5 · biên 15% ⇒ 10,00', gan(gia, 10), `${gia}`);
  ok('Hợp lệ', hopLe);
  ok('⛔ KHÔNG phải 9,775 (cách nhân 1,15)', !gan(gia, 9.775),
    'nhân 1,15 cho ra biên THỰC 13%, ⛔ không phải 15% — ăn thẳng vào lãi cả đơn');
  ok('Kiểm ngược: biên thực đúng 15%', gan(bienThucTe(gia, 8.5), 15), `${bienThucTe(gia, 8.5)}`);
}

console.log('\n⑥ 🔴 ⛔ KHÔNG BAO GIỜ TRẢ NaN / Infinity RA MÀN HÌNH BÁO GIÁ');
{
  const so = (x) => Number.isFinite(x);
  const r0 = tinhCM([], { giaPhut: 0, hieuSuat: 0, overhead: 0 });
  ok('⛔ Không công đoạn · mọi tham số 0 ⇒ toàn số hữu hạn',
    so(r0.tongSam) && so(r0.samThucTe) && so(r0.nhanCong) && so(r0.cmMotSanPham));
  ok('Hiệu suất 0 ⇒ ⛔ không chia cho 0',
    so(tinhCM([{ ma: 'A', ten: 'a', khau: 'MAY', sam: 5 }], { giaPhut: 1, hieuSuat: 0, overhead: 0 }).cmMotSanPham));
  ok('SAM âm bị bỏ qua, ⛔ không trừ ngược',
    tinhCM([{ ma: 'A', ten: 'a', khau: 'MAY', sam: -5 }], { giaPhut: 1, hieuSuat: 100, overhead: 0 }).tongSam === 0);
  ok('Biên 100% ⇒ báo ⛔ KHÔNG hợp lệ, ⛔ không trả Infinity',
    giaChaoBan(10, 100).hopLe === false && so(giaChaoBan(10, 100).gia));
  ok('Biên âm ⇒ ⛔ không hợp lệ', giaChaoBan(10, -5).hopLe === false);
  ok('Biên 99% vẫn tính được', giaChaoBan(1, 99).hopLe === true);
  ok('Giá bán 0 ⇒ biên thực 0, ⛔ không NaN', bienThucTe(0, 5) === 0);
}

console.log('\n⑦ Một mẫu áo polo thật — đi hết đường tính');
{
  const nhom = 'POLO';
  const chon = congDoanTheoNhom(nhom).filter((c) => macDinhTheoNhom(nhom).includes(c.ma))
    .map((c) => ({ ma: c.ma, ten: c.ten, khau: c.khau, sam: c.sam }));
  const cm = tinhCM(chon, { giaPhut: 0.045, hieuSuat: 75, overhead: 12 });
  const giaVon = cm.cmMotSanPham + 4.2; // + NPL
  const { gia } = giaChaoBan(giaVon, 18);
  ok(`Polo: ${chon.length} công đoạn · tổng SAM ${cm.tongSam}′`, chon.length >= 8 && cm.tongSam > 10);
  ok('CM ra số dương hợp lý', cm.cmMotSanPham > 0 && cm.cmMotSanPham < 5, `${cm.cmMotSanPham}`);
  ok('Giá chào > giá vốn', gia > giaVon, `${gia} vs ${giaVon}`);
  ok('Biên kiểm ngược đúng 18%', gan(bienThucTe(gia, giaVon), 18));
  console.log(`       → tổng SAM ${cm.tongSam}′ · CM ${cm.cmMotSanPham} · giá vốn ${giaVon.toFixed(4)} · chào ${gia}`);
}

console.log('\n⑧ 🔴 AI ĐƯỢC DUYỆT — MD TRÌNH, MD ⛔ KHÔNG DUYỆT');
{
  ok('MD được trình', duocTrinh('md'));
  ok('🔴 MD ⛔ KHÔNG được duyệt', !duocDuyet('md'),
    'MD tự duyệt giá của chính mình là SoD thủng ở đúng chỗ đắt nhất');
  ok('Giám đốc được duyệt', duocDuyet('giamdoc'));
  ok('superadmin được duyệt', duocDuyet('superadmin'));
  ok('QA ⛔ không được duyệt', !duocDuyet('qa'));
  ok('Kho ⛔ không được duyệt', !duocDuyet('kho'));
  ok('Buyer ⛔ không được trình', !duocTrinh('buyer'));
  ok('⛔ Không đăng nhập ⇒ ⛔ không quyền nào', !duocDuyet(null) && !duocTrinh(null));
  const r = kiemQuyen('md', 'APPROVED');
  ok('Bị chặn thì NÓI RÕ VÌ SAO', r.ok === false && r.vi.includes('Giám đốc sản xuất'),
    'chặn mà ⛔ không giải thích thì người dùng bấm lại rồi gọi hỗ trợ');
  ok('MD trình thì cho qua', kiemQuyen('md', 'SUBMITTED').ok === true);
  ok('Giám đốc từ chối thì cho qua', kiemQuyen('giamdoc', 'REJECTED').ok === true);
}

console.log('\n⑨ SỬA PO — ai được sửa, và chặn dữ liệu vô nghĩa');
{
  ok('MD được sửa PO', duocSuaPo('md'));
  ok('Giám đốc sản xuất được sửa PO', duocSuaPo('giamdoc'));
  ok('QA ⛔ không được sửa PO', !duocSuaPo('qa'));
  ok('Nhà thầu ngoài ⛔ không được sửa PO', !duocSuaPo('subcon'));
  ok('⛔ Chưa đăng nhập ⇒ ⛔ không sửa được', !duocSuaPo(null));

  const hopLe = { total_quantity: 5000, status: 'IN_PRODUCTION', delivery_date: '2026-09-30' };
  ok('Dữ liệu đúng thì cho qua', kiemSuaPo(hopLe).ok === true);
  ok('Số lượng 0 bị chặn', kiemSuaPo({ ...hopLe, total_quantity: 0 }).ok === false);
  ok('Số lượng âm bị chặn', kiemSuaPo({ ...hopLe, total_quantity: -5 }).ok === false);
  ok('Số lẻ bị chặn (⛔ không có sản phẩm nửa cái)',
    kiemSuaPo({ ...hopLe, total_quantity: 10.5 }).ok === false);
  ok('Trạng thái lạ bị chặn', kiemSuaPo({ ...hopLe, status: 'XYZ' }).ok === false);
  ok('Ngày sai khuôn bị chặn', kiemSuaPo({ ...hopLe, delivery_date: '30/09/2026' }).ok === false);
  ok('Lỗi có chỉ đúng TRƯỜNG nào sai',
    kiemSuaPo({ ...hopLe, total_quantity: 0 }).truong === 'total_quantity');
  ok('Đủ 4 trạng thái tiến độ', PO_TIEN_DO.length === 4);
}

console.log('\n⑩ 🔴 CẢNH BÁO GIẢM SỐ LƯỢNG THẤP HƠN SỐ ĐÃ SẢN XUẤT');
{
  ok('Giảm 5.000 → 3.000 trong khi đã làm 4.800 ⇒ CÓ cảnh báo',
    canhBaoGiamSoLuong(3000, 4800) !== null,
    'tiến độ sẽ thành 160% và mọi báo cáo sản lượng đọc ra là dối');
  ok('Cảnh báo nêu cả hai con số',
    (canhBaoGiamSoLuong(3000, 4800) ?? '').includes('3.000')
    && (canhBaoGiamSoLuong(3000, 4800) ?? '').includes('4.800'));
  ok('Tăng số lượng ⇒ ⛔ không cảnh báo', canhBaoGiamSoLuong(6000, 4800) === null);
  ok('Bằng nhau ⇒ ⛔ không cảnh báo', canhBaoGiamSoLuong(4800, 4800) === null);
  ok('⛔ Chưa sản xuất gì ⇒ ⛔ không cảnh báo', canhBaoGiamSoLuong(1000, 0) === null);
}

console.log('\n' + '═'.repeat(74));
console.log(`${dat} đạt · ${hong.length} hỏng`);
console.log('═'.repeat(74));
process.exit(hong.length ? 1 : 0);
