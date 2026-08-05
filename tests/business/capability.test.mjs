// ============================================================================
// LỌC BUSINESS APP THEO QUYỀN — `UI-1.2`
//
// ─── VÌ SAO BÀI KIỂM NÀY QUAN TRỌNG HƠN VẺ NGOÀI ────────────────────────
// Nó canh hai thứ ngược chiều nhau, và **cả hai đều hỏng được**:
//
//   ① LỘ QUÁ NHIỀU — người chưa đăng nhập thấy bản đồ phân hệ *(`UI-F1`)*
//   ② CHE QUÁ NHIỀU — một vai đăng nhập vào rồi thấy **màn hình trống**, hoặc
//     ⛔ không thấy chính Workspace mà `ROLE_HOME` sắp đá họ tới
//
// Lỗi ② âm thầm hơn hẳn: nó ⛔ không ném ngoại lệ, ⛔ không đỏ ở đâu cả — người
// dùng chỉ đơn giản ⛔ không tìm thấy đường vào việc của mình.
//
// ⚠️ Đây là phép đo về **BÀY CÁI GÌ**, ⛔ không phải về **CHO VÀO HAY KHÔNG**.
// Hàng rào thật là `middleware` · `guard.ts` · RLS.
// ============================================================================
import { scoreboard } from '../_lib/harness.mjs';
import { canSeeModule, visibleModules } from '../../lib/mos/capability/visible-modules.ts';
import { ALL_ROLES, ROLE_HOME, MODULE_ACCESS, canAccess } from '../../lib/rbac.ts';

const s = scoreboard('LỌC BUSINESS APP THEO QUYỀN');

const READY = (href) => ({ status: 'READY', href });
const SOON = { status: 'COMING_SOON' };

console.log('\n① 🔴 CHƯA ĐĂNG NHẬP — ⛔ KHÔNG THẤY APP NÀO (`UI-F1`)');
{
  // Đây là phép đo đóng `UI-F1`. Trước bản UI-1, trang chủ dựng thẳng cả 16
  // thẻ cho bất kỳ ai gõ đúng địa chỉ.
  for (const vai of [null, undefined]) {
    s.ok(`role = ${String(vai)} ⇒ ⛔ không thấy App đã có route`,
      canSeeModule(vai, READY('/md')) === false);
    s.ok(`role = ${String(vai)} ⇒ ⛔ không thấy cả App "sắp có"`,
      canSeeModule(vai, SOON) === false);
  }
  const ds = visibleModules([READY('/md'), READY('/kho'), SOON], null);
  s.ok('🔑 Danh sách lọc cho khách ⇒ RỖNG', ds.length === 0);
}

console.log('\n② APP "SẮP CÓ" — hiện với MỌI vai đã đăng nhập (Board `Q2`)');
{
  // Board `Q2`: hiện · khoá · gắn nhãn. ⛔ Không ẩn — ẩn đi thì người dùng ⛔
  // không biết hệ thống sẽ có gì.
  for (const vai of ALL_ROLES) {
    s.ok(`${vai} thấy App "sắp có"`, canSeeModule(vai, SOON) === true);
  }
}

console.log('\n③ APP ĐÃ CÓ ROUTE — khớp ĐÚNG `canAccess` của middleware');
{
  // 🔑 Phép đo chống hai-bộ-luật. Nếu `canSeeModule` tự viết phép so tiền tố
  //    riêng, ngày nó lệch khỏi `canAccess` giao diện sẽ mời người dùng bấm
  //    vào đúng thứ middleware chắc chắn từ chối.
  const DUONG_DAN = ['/md', '/kho', '/qa', '/admin', '/buyer', '/subcon',
    '/ke-toan', '/xuat-hang', '/giam-doc', '/orders', '/to-truong-may'];
  let lech = 0;
  for (const vai of ALL_ROLES) {
    for (const p of DUONG_DAN) {
      if (canSeeModule(vai, READY(p)) !== canAccess(vai, p)) lech += 1;
    }
  }
  s.ok(`🔑 ${ALL_ROLES.length} vai × ${DUONG_DAN.length} route ⇒ khớp canAccess tuyệt đối`,
    lech === 0, `${lech} chỗ lệch`);

  s.ok('superadmin (`*`) thấy mọi route', canSeeModule('superadmin', READY('/ke-toan')) === true);
  s.ok('md thấy /md', canSeeModule('md', READY('/md')) === true);
  s.ok('md ⛔ KHÔNG thấy /ke-toan', canSeeModule('md', READY('/ke-toan')) === false);
  s.ok('buyer chỉ thấy /buyer', canSeeModule('buyer', READY('/buyer')) === true);
  s.ok('buyer ⛔ KHÔNG thấy /md', canSeeModule('buyer', READY('/md')) === false);
  s.ok('subcon ⛔ KHÔNG thấy /kho', canSeeModule('subcon', READY('/kho')) === false);

  // Khớp tiền tố phải TRỌN ĐOẠN — '/kho' ⛔ không được khớp '/kho-thanh-pham'
  s.ok('🔑 Tiền tố khớp TRỌN đoạn — `/kho` ⛔ không khớp `/kho-thanh-pham`',
    canSeeModule('thukho', READY('/kho-thanh-pham')) === false);
  s.ok('`/kho/abc` VẪN khớp `/kho`', canSeeModule('thukho', READY('/kho/abc')) === true);
}

console.log('\n④ 🔑 MỌI VAI PHẢI THẤY ÍT NHẤT MỘT APP');
{
  // Quy tắc K-3 áp cho giao diện: một bộ lọc mà mọi vai đều ra RỖNG thì ⛔
  // không phân biệt được "khoanh đúng" với "chặn hết".
  const TAT_CA = [
    READY('/giam-doc'), READY('/buyer'), READY('/md'), SOON,
    READY('/to-truong-may'), READY('/qa'), READY('/kho'), READY('/xuat-hang'),
    READY('/subcon'), READY('/ke-toan'), SOON, SOON, SOON, SOON, SOON,
    READY('/admin'),
  ];
  for (const vai of ALL_ROLES) {
    const thay = visibleModules(TAT_CA, vai);
    s.ok(`${vai} thấy ≥ 1 App (${thay.length}/16)`, thay.length >= 1);
  }
}

console.log('\n⑤ 🔴 `ROLE_HOME` PHẢI NẰM TRONG DANH SÁCH THẤY ĐƯỢC');
{
  // Đây là phép đo bắt lỗi ÂM THẦM nhất: đăng nhập xong bị đá tới `ROLE_HOME`,
  // nhưng trên trang chủ lại ⛔ không thấy lối vào chính nơi đó. Người dùng
  // ⛔ không hiểu vì sao mình "vào được mà ⛔ không thấy".
  for (const vai of ALL_ROLES) {
    const nha = ROLE_HOME[vai];
    s.ok(`${vai}: thấy được ROLE_HOME (${nha})`,
      canSeeModule(vai, READY(nha)) === true, `${vai} ⛔ không thấy ${nha}`);
  }
}

console.log('\n⑥ GIỮ NGUYÊN THỨ TỰ HIẾN ĐỊNH');
{
  // Sắp lại sẽ làm vị trí một App nhảy chỗ giữa hai người dùng, và trí nhớ cơ
  // bắp là thứ đắt nhất để xây lại.
  const ds = [READY('/md'), READY('/kho'), READY('/qa'), READY('/admin')];
  const thay = visibleModules(ds, 'superadmin');
  s.ok('Thứ tự đầu ra khớp thứ tự đầu vào',
    thay.map((m) => m.href).join('|') === '/md|/kho|/qa|/admin');
  s.ok('⛔ Không nhân bản mục nào', thay.length === ds.length);
  s.ok('Danh sách rỗng ⇒ rỗng', visibleModules([], 'md').length === 0);
}

console.log('\n⑦ VAI LẠ — ⛔ không sập, và ⛔ không mở toang');
{
  // Vai ⛔ không có trong `MODULE_ACCESS` phải bị coi như ⛔ không có quyền, ⛔
  // không phải "cho qua vì ⛔ không tra được".
  s.ok('Vai ⛔ không tồn tại ⇒ ⛔ không thấy App có route',
    canSeeModule('vai_khong_co_that', READY('/md')) === false);
  s.ok('⛔ Không ném ngoại lệ với chuỗi rỗng',
    canSeeModule('', READY('/md')) === false);
  s.ok('Mọi vai trong ALL_ROLES đều có mục trong MODULE_ACCESS',
    ALL_ROLES.every((v) => Array.isArray(MODULE_ACCESS[v])));
}

process.exit(s.ketThuc() ? 1 : 0);
