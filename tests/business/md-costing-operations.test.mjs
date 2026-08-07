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
// 🔴 Board Decision 07/08/2026 — `BUG-4` (khoá theo workflow · Re-open) và
// `BUG-5` (lưu trữ ⛔ không mượn trạng thái mang nghĩa khác).
import {
  phanQuyetSuaPo, phanQuyetMoLaiPo, phanQuyetSua, duocMoLai, luuTruDuoc,
  PO_SAU_KHI_MO_LAI, LUAT,
} from '../../lib/mos/md/document-lock.ts';
// 🔴 Board Directive *MD Final Input Experience* 08/08/2026 §A — hạn mức công
// nợ `0` ⟷ `NULL`.
//
// ⚠️ Nhập từ `common.ts`, ⛔ KHÔNG từ `commercial.schema.ts`: tệp đó viết
// `from './common'` (⛔ không đuôi), mà bộ nạp ES module của Node ⛔ không phân
// giải nổi đường dẫn thiếu đuôi ⇒ `ERR_MODULE_NOT_FOUND`. `common.ts` chỉ phụ
// thuộc `zod` nên nạp thẳng được.
//
// 🔑 Và kiểm ở đây **đúng chỗ hơn**: `nonNegativeDecimal` là nơi quy tắc SỐNG.
import { positiveDecimal, nonNegativeDecimal } from '../../schemas/md/common.ts';

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
  // 🔴 4 ⇒ 6 · Board Decision 07/08/2026 (`BUG-4`).
  //
  // ⚠️ **BÀI KIỂM NÀY TỪNG NEO SỐ `4` — VÀ SỐ ĐÓ LÀ MỘT LỖ HỔNG.**
  // `PO_TIEN_DO` thiếu `SHIPPED` và `CANCELLED`, trong khi `PO_STATUSES` ở
  // `schemas/md/order.schema.ts` đã khai đủ sáu từ lâu. Hậu quả: Board ra luật
  // *"SHIPPED: Khóa"* nhưng `kiemSuaPo` **bác mọi lượt đặt `SHIPPED`** ⇒ trạng
  // thái ấy ⛔ không tới được từ màn hình MD, và điều luật về nó là điều luật
  // chết. `CANCELLED` cũng vậy — nó là **lối lưu trữ duy nhất** của PO.
  //
  // 🔑 Kiểm **DANH SÁCH**, ⛔ không kiểm **SỐ ĐẾM**. Một con số trần chỉ nói
  // *"có sáu cái"*; nó ⛔ không phát hiện được ai đó đổi `SHIPPED` thành
  // `SHIPED`. Đây đúng bài học "số viết cứng trong bài kiểm" đã hai lần gây
  // báo động giả, ghi ở `arch.test.mjs` mục ③.
  ok('Đủ 6 trạng thái tiến độ, ĐÚNG TÊN (Board BUG-4 · 07/08/2026)',
    JSON.stringify([...PO_TIEN_DO].sort())
      === JSON.stringify(['APPROVED', 'CANCELLED', 'COMPLETED', 'DRAFT', 'IN_PRODUCTION', 'SHIPPED']));
  ok('SHIPPED đặt được — ⛔ không thì luật "SHIPPED: Khóa" là luật chết',
    kiemSuaPo({ ...hopLe, status: 'SHIPPED' }).ok === true);
  ok('CANCELLED đặt được — lối LƯU TRỮ duy nhất của PO',
    kiemSuaPo({ ...hopLe, status: 'CANCELLED' }).ok === true);
}

// ⑨b 🔴 KHOÁ THEO **WORKFLOW**, ⛔ KHÔNG THEO **STATUS ĐƠN THUẦN**
//
// Board Decision 07/08/2026 · `BUG-4` + mục *"Khóa theo Workflow"*:
//   > *"⛔ Không khóa theo Status đơn thuần. Ví dụ: **PO đã sinh Production
//   > Order thì phải khóa.** ⛔ Không dựa duy nhất vào trạng thái APPROVED."*
console.log('\n⑨b 🔴 KHOÁ THEO WORKFLOW — ⛔ KHÔNG theo status đơn thuần');
{
  const suaDuoc = (bc) => phanQuyetSuaPo(bc).muc === 'SUA';

  ok('DRAFT · ⛔ chưa có lệnh sản xuất ⇒ SỬA ĐƯỢC',
    suaDuoc({ status: 'DRAFT', daSinhLenhSanXuat: false }));
  ok('APPROVED · ⛔ chưa có lệnh sản xuất ⇒ SỬA ĐƯỢC (Board: "Update + Audit Log")',
    suaDuoc({ status: 'APPROVED', daSinhLenhSanXuat: true }) === false
      && suaDuoc({ status: 'APPROVED', daSinhLenhSanXuat: false }));

  // 🔑 PHÉP THỬ CỐT LÕI: **cùng một `status`**, hai kết quả khác nhau — chỉ vì
  // dữ liệu hạ nguồn khác nhau. Đây là thứ một `switch (status)` ⛔ không làm
  // được, và là toàn bộ nội dung của chỉ thị.
  ok('🔴 CÙNG status DRAFT, có lệnh sản xuất ⇒ ⛔ KHÔNG sửa trực tiếp',
    suaDuoc({ status: 'DRAFT', daSinhLenhSanXuat: false })
      && !suaDuoc({ status: 'DRAFT', daSinhLenhSanXuat: true }));
  ok('Đã sinh lệnh sản xuất ⇒ lối ra là YÊU CẦU THAY ĐỔI, ⛔ không phải ngõ cụt',
    phanQuyetSuaPo({ status: 'DRAFT', daSinhLenhSanXuat: true }).muc === 'YEU_CAU_THAY_DOI');

  ok('SHIPPED ⇒ KHOÁ', phanQuyetSuaPo({ status: 'SHIPPED', daSinhLenhSanXuat: false }).muc === 'KHOA');
  ok('COMPLETED ⇒ KHOÁ TUYỆT ĐỐI',
    phanQuyetSuaPo({ status: 'COMPLETED', daSinhLenhSanXuat: false }).muc === 'KHOA_TUYET_DOI');
  ok('🔴 COMPLETED khoá KỂ CẢ khi ⛔ chưa sinh lệnh sản xuất',
    !suaDuoc({ status: 'COMPLETED', daSinhLenhSanXuat: false }));
  ok('Mọi phán quyết KHOÁ đều NÓI VÌ SAO',
    ['SHIPPED', 'COMPLETED', 'CANCELLED']
      .every((s) => phanQuyetSuaPo({ status: s, daSinhLenhSanXuat: false }).vi.length > 0));

  // Chữ thường / hoa lẫn lộn trong dữ liệu cũ — `002` ⛔ không có CHECK trên cột.
  ok('So trạng thái ⛔ KHÔNG phân biệt hoa thường (dữ liệu cũ lẫn "Completed")',
    phanQuyetSuaPo({ status: 'completed', daSinhLenhSanXuat: false }).muc === 'KHOA_TUYET_DOI');
}

// ⑨c 🔴 RE-OPEN — *"Completed chỉ được Re-open bởi CEO hoặc Director"*
console.log('\n⑨c 🔴 RE-OPEN — chỉ Giám đốc / Super Admin');
{
  ok('Giám đốc mở lại được', duocMoLai('giamdoc'));
  ok('Super Admin mở lại được', duocMoLai('superadmin'));
  // 🔴 Đây là TOÀN BỘ ý nghĩa của điều khoản: MD tự mở lại được thì "khoá
  // tuyệt đối" chỉ là một hộp thoại xác nhận.
  ok('🔴 MD ⛔ KHÔNG mở lại được', duocMoLai('md') === false);
  ok('QA ⛔ không mở lại được', duocMoLai('qa') === false);
  ok('⛔ Chưa đăng nhập ⇒ ⛔ không mở lại được', duocMoLai(null) === false);

  ok('COMPLETED + giamdoc ⇒ CHO mở lại',
    phanQuyetMoLaiPo('COMPLETED', 'giamdoc').muc === 'SUA');
  ok('COMPLETED + md ⇒ CHẶN, và nói rõ phải trình ai',
    phanQuyetMoLaiPo('COMPLETED', 'md').muc === 'KHOA_TUYET_DOI'
      && phanQuyetMoLaiPo('COMPLETED', 'md').loiRa !== null);
  // Mở lại một đơn ⛔ chưa đóng là thao tác vô nghĩa — cho qua sẽ sinh một dòng
  // nhật ký "đã mở lại" trên đơn chưa từng đóng, làm nhiễu sổ kiểm toán.
  ok('Đơn ⛔ CHƯA đóng ⇒ ⛔ không có gì để mở lại, kể cả với Giám đốc',
    phanQuyetMoLaiPo('APPROVED', 'giamdoc').muc !== 'SUA');
  ok('Mở lại đưa về APPROVED, ⛔ KHÔNG về DRAFT (⛔ không xoá bằng chứng phê duyệt)',
    PO_SAU_KHI_MO_LAI === 'APPROVED');
}

// ⑨d 🔴 LƯU TRỮ ⛔ KHÔNG ĐƯỢC MƯỢN MỘT TRẠNG THÁI MANG NGHĨA KHÁC
console.log('\n⑨d 🔴 LƯU TRỮ — chỉ dùng trạng thái CÓ THẬT và ĐÚNG NGHĨA');
{
  ok('Khách hàng lưu trữ được (cờ is_active có sẵn từ 014)', luuTruDuoc('CUSTOMER'));
  ok('Mã hàng lưu trữ được (DISCONTINUED có trong CHECK của 015)', luuTruDuoc('STYLE'));
  ok('Yêu cầu báo giá lưu trữ được (CANCELLED có trong CHECK của 015)', luuTruDuoc('INQUIRY'));
  ok('Chiết tính lưu trữ được (SUPERSEDED — đúng đường reviseCosting)', luuTruDuoc('COSTING'));

  // 🟢 08/08/2026 · migration `052` — BA LOẠI NÀY NAY LƯU TRỮ ĐƯỢC.
  //
  // ⚠️ Bài kiểm cũ ở đây khẳng định chúng **⛔ CHƯA làm được**, và ghi rõ *"nó
  // sẽ ĐỎ đúng lúc ADR-027 được chạy, và đó là lời nhắc phải quay lại mở khoá"*.
  // 🔑 Nó **đã đỏ đúng lúc**, và đây là lượt quay lại đó. Một bài kiểm mô tả
  // trạng thái CHƯA XONG phải được sửa khi việc xong — ⛔ không phải xoá đi.
  ok('🟢 Tech Pack lưu trữ được (052 · deleted_at)', luuTruDuoc('TECH_PACK'));
  ok('🟢 BOM lưu trữ được (052 · deleted_at)', luuTruDuoc('BOM'));
  ok('🟢 Yêu cầu NPL lưu trữ được (052 · deleted_at)', luuTruDuoc('MATERIAL_REQUEST'));
  // 🔴 VẪN ⛔ KHÔNG mượn `REJECTED`: "bị từ chối" là sự kiện nghiệp vụ KHÁC.
  ok('🔴 Yêu cầu NPL lưu trữ bằng `deleted_at`, ⛔ KHÔNG bằng `REJECTED`',
    LUAT.MATERIAL_REQUEST.trangThaiLuuTru === 'deleted_at');
  ok('Cả 8 chứng từ nay đều có chỗ lưu trữ trung thực',
    ['CUSTOMER','INQUIRY','COSTING','STYLE','TECH_PACK','BOM','MATERIAL_REQUEST','ORDER']
      .every((k) => luuTruDuoc(k)));

  // Chiết tính ĐÃ DUYỆT bị ba tầng CSDL khoá (RLS 042 · trigger 045 · con 046).
  // Tầng luật phải khai ĐÚNG như vậy, ⛔ không thì người dùng nhận mã 23514.
  ok('Chiết tính APPROVED ⇒ KHOÁ, và chỉ đường sang "Làm bản mới"',
    phanQuyetSua('COSTING', 'APPROVED').muc === 'KHOA'
      && (phanQuyetSua('COSTING', 'APPROVED').loiRa ?? '').includes('bản mới'));
  ok('Chiết tính DRAFT ⇒ sửa được', phanQuyetSua('COSTING', 'DRAFT').muc === 'SUA');
  ok('Khách hàng ⛔ không có status ⇒ luôn sửa được', phanQuyetSua('CUSTOMER', null).muc === 'SUA');
  ok('Yêu cầu NPL đã NHẬN KHO ⇒ KHOÁ TUYỆT ĐỐI (sửa là lệch tồn kho)',
    phanQuyetSua('MATERIAL_REQUEST', 'RECEIVED').muc === 'KHOA_TUYET_DOI');

  // 🔑 Gọi nhầm PO qua đường bảng ⇒ PHẢI NỔ, ⛔ không được trả phán quyết dễ
  // dãi trong im lặng: bảng ⛔ không nhìn thấy lệnh sản xuất.
  let daNo = false;
  try { phanQuyetSua('ORDER', 'DRAFT'); } catch { daNo = true; }
  ok('🔴 phanQuyetSua("ORDER") NỔ — PO buộc phải đi qua phanQuyetSuaPo()', daNo);
}

// ⑨e 🔴 HẠN MỨC CÔNG NỢ — `0` VÀ `NULL` LÀ HAI ĐIỀU KHÁC NHAU
//
// Board Directive *MD Final Input Experience* §A:
//   > *"`0` = ⛔ không cho nợ · `NULL` = ⛔ chưa khai báo.
//   >  **⛔ Không được dùng chung.**"*
console.log('\n⑨e 🔴 HẠN MỨC CÔNG NỢ — 0 ⟷ NULL ⛔ KHÔNG được dùng chung');
{
  const han = nonNegativeDecimal('Hạn mức công nợ', 2, 999_999_999);
  const tuyChon = han.optional();

  // 🔴 Lỗi THẬT tìm ra trong UAT 07/08/2026: `customerFormSchema` dùng
  // `positiveDecimal` nên bác `0`, mà **5/17 khách hàng trên CSDL đang chạy**
  // mang `credit_limit = 0` ⇒ năm hồ sơ đó ⛔ KHÔNG lưu nổi từ hộp thoại Sửa.
  ok('🔴 `positiveDecimal` BÁC số 0 — chính là gốc của lỗi',
    positiveDecimal('x').safeParse(0).success === false);
  ok('🔴 `nonNegativeDecimal` CHẤP NHẬN 0 ("⛔ không cho nợ")',
    han.safeParse(0).success === true);
  ok('Số 0 giữ nguyên là 0, ⛔ KHÔNG bị nuốt thành undefined',
    han.safeParse(0).data === 0);
  ok('⛔ Chưa khai (undefined) vẫn hợp lệ, và KHÁC 0',
    tuyChon.safeParse(undefined).success === true
      && tuyChon.safeParse(undefined).data === undefined);
  ok('Số ÂM vẫn bị chặn — "⛔ không cho nợ" khác "nợ ngược"',
    han.safeParse(-1).success === false);
  ok('Số dương bình thường vẫn qua', han.safeParse(100000).data === 100000);
  ok('Quá 2 chữ số thập phân vẫn bị chặn', han.safeParse(1.234).success === false);
}

// ⑨f ⚠️ ORDER MASTER — `poFormSchema` ⛔ KHÔNG kiểm được ở bài kiểm này.
//
// Nó viết `from './common'` (⛔ không đuôi) nên bộ nạp ES module của Node ⛔ không
// phân giải nổi. Dựng thêm một bước biên dịch cho riêng một bài kiểm là đắt
// hơn giá trị nó mang lại.
//
// 🔑 Phần đó được canh bằng **UAT qua HTTP**: gọi thẳng `createPo` bằng phiên
// md001 thật rồi đọc lại dòng vừa ghi để xác nhận PO CÓ `customer_id` và
// `style_id`. Ghi rõ ở đây để người sau ⛔ không tưởng là đã bỏ sót.

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
