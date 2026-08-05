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
import {
  canSeeModule, visibleModules, modulePermissionState, moduleClickable,
} from '../../lib/mos/capability/visible-modules.ts';
import { ALL_ROLES, ROLE_HOME, MODULE_ACCESS, canAccess, isProtectedPath } from '../../lib/rbac.ts';

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

// ════════════════════════════════════════════════════════════════════════
// PHẦN HAI — TRẠNG THÁI QUYỀN CỦA Ô LAUNCHER · `UI-3` · ADR-022
//
// ⚠️ Phần một phía trên đo `visibleModules` — bộ luật **CÓ LỌC**, nay dùng cho
// cổng đối tác. Phần này đo `modulePermissionState` — bộ luật của **TRANG CHỦ**,
// nơi ⛔ **không lọc gì cả**.
//
// Hai bộ luật **cùng tồn tại có chủ ý**. Chúng ⛔ không được lẫn vào nhau, và
// đó chính là thứ phần này canh.
// ════════════════════════════════════════════════════════════════════════

console.log('\n⑧ 🔴 TRANG CHỦ HIỆN TOÀN BỘ — ⛔ KHÔNG Ô NÀO BIẾN MẤT');
{
  const TAT_CA = [READY('/md'), READY('/kho'), READY('/ke-toan'), SOON];

  // Đây là phép đo **đảo chiều** của mục ①. Mục ① canh *"khách ⛔ không thấy
  // gì"*; mục này canh *"khách thấy ĐỦ"*. Cùng một hệ thống, hai đời chỉ thị —
  // giữ cả hai phép đo để ngày nào có ai lặng lẽ bật lại lối lọc, một trong
  // hai sẽ đỏ.
  for (const vai of [null, undefined, 'md', 'kho', 'vai_khong_co_that']) {
    const trangThai = TAT_CA.map((m) => modulePermissionState(vai, m));
    s.ok(`vai=${String(vai)} ⇒ đủ ${TAT_CA.length} ô, ⛔ không ô nào rơi`,
      trangThai.length === TAT_CA.length && trangThai.every(Boolean));
  }
}

console.log('\n⑨ BỐN TRẠNG THÁI — ĐÚNG MỘT TRẠNG THÁI CHO MỖI TÌNH HUỐNG');
{
  s.ok('⛔ chưa đăng nhập + có route ⇒ ANONYMOUS',
    modulePermissionState(null, READY('/md')) === 'ANONYMOUS');
  s.ok('có quyền ⇒ AUTHORIZED',
    modulePermissionState('md', READY('/md')) === 'AUTHORIZED');
  s.ok('đã đăng nhập, ⛔ không quyền ⇒ UNAUTHORIZED',
    modulePermissionState('qa', READY('/ke-toan')) === 'UNAUTHORIZED');
  s.ok('⛔ chưa có route ⇒ COMING_SOON',
    modulePermissionState('md', SOON) === 'COMING_SOON');

  // 🔑 `LI-2` — vế dễ hỏng nhất trong cả bài, và hỏng thì ⛔ không ai thấy.
  //
  // Với khách, hệ thống **⛔ không biết** họ sẽ có quyền gì. Làm mờ ô của họ là
  // **nói dối** — và nó giết đúng giá trị bán hàng mà Board mua bằng việc hiện
  // toàn bộ. Một dòng `if (!canAccess(role, href))` viết hớ là đủ để mọi ô của
  // khách chuyển sang mờ, mà giao diện vẫn "chạy bình thường".
  const khachThay = [READY('/md'), READY('/kho'), READY('/giam-doc'), READY('/admin')]
    .map((m) => modulePermissionState(null, m));
  s.ok('🔴 LI-2 · khách ⛔ KHÔNG BAO GIỜ nhận UNAUTHORIZED',
    khachThay.every((tt) => tt === 'ANONYMOUS'), khachThay.join(' · '));
}

console.log('\n⑩ COMING_SOON XÉT TRƯỚC PHIÊN — ô ⛔ không đổi mặt theo người xem');
{
  // Một App ⛔ chưa có route thì ⛔ không ai mở được, kể cả `superadmin`. Nếu
  // thứ tự hai vế bị đảo, ô `COMING_SOON` sẽ hiện `ANONYMOUS` với khách và mời
  // họ bấm — dẫn tới `/login`, đăng nhập xong vẫn ⛔ không có gì để mở.
  const moiVai = [null, undefined, ...ALL_ROLES];
  const lech = moiVai.filter((v) => modulePermissionState(v, SOON) !== 'COMING_SOON');
  s.ok(`COMING_SOON giữ nguyên với cả ${moiVai.length} người xem`,
    lech.length === 0, `lệch ở: ${lech.join(' · ')}`);

  s.ok('COMING_SOON ⇒ ⛔ không bấm được', moduleClickable('COMING_SOON') === false);
  for (const tt of ['AUTHORIZED', 'UNAUTHORIZED', 'ANONYMOUS']) {
    s.ok(`${tt} ⇒ bấm được`, moduleClickable(tt) === true);
  }
}

console.log('\n⑪ CÙNG MỘT BỘ LUẬT VỚI `canAccess` — ⛔ không phải bản chép tay');
{
  // 🔑 Đây là `G6` áp cho trang chủ. `middleware.ts` chặn bằng `canAccess`;
  // nếu ô Launcher tự so tiền tố theo cách thứ hai, hai bộ luật sẽ trôi khỏi
  // nhau — và ngày chúng lệch, ô sáng rõ sẽ dẫn thẳng vào màn 403.
  const lech = [];
  for (const vai of ALL_ROLES) {
    for (const href of ['/md', '/kho', '/qa', '/ke-toan', '/giam-doc', '/admin', '/subcon', '/buyer']) {
      const tt = modulePermissionState(vai, READY(href));
      const cho = canAccess(vai, href) ? 'AUTHORIZED' : 'UNAUTHORIZED';
      if (tt !== cho) lech.push(`${vai}→${href}: ${tt} ≠ ${cho}`);
    }
  }
  s.ok(`Trạng thái khớp canAccess ở cả ${ALL_ROLES.length} vai × 8 route`,
    lech.length === 0, lech.slice(0, 5).join(' · '));

  // Vai có ROLE_HOME thì ô tương ứng PHẢI sáng — nếu ⛔ không, người dùng nhìn
  // vào chính Workspace mình sắp bị đá tới mà thấy nó mờ đi.
  const nhaLech = ALL_ROLES.filter(
    (v) => modulePermissionState(v, READY(ROLE_HOME[v])) !== 'AUTHORIZED');
  s.ok('Mọi vai thấy ROLE_HOME của mình ở trạng thái AUTHORIZED',
    nhaLech.length === 0, nhaLech.join(' · '));
}

console.log('\n⑫ 🔴 LUỒNG BOARD CHỈ ĐỊNH — bấm Module ⇒ Login ⇒ Workspace');
{
  // Board `Build Mode v1`: *"click Module → Login; sau Login → Workspace của
  // Module"*.
  //
  // ⚠️ Luồng đó có **một mắt xích thầm lặng**: `middleware.ts` chỉ đá sang
  // `/login?next=…` khi đường dẫn nằm trong `PROTECTED_PREFIXES`. Một Module
  // `READY` trỏ tới route **⛔ không được bảo vệ** sẽ mở thẳng ra cho khách —
  // ⛔ không qua Login, ⛔ không qua `guard.ts`. Trang vẫn dựng, build vẫn
  // xanh, và ⛔ không ai biết.
  //
  // Và nó hỏng thêm một nấc nữa: `safeNext()` ở `app/login/actions.ts` **loại
  // bỏ** mọi `?next=` ⛔ không phải route được bảo vệ. Nên kể cả khi tới được
  // Login, người dùng đăng nhập xong sẽ bị đá về `ROLE_HOME` — ⛔ **không**
  // quay lại ô họ vừa bấm.
  //
  // 🔑 `PROTECTED_PREFIXES` vì vậy ⛔ không chỉ là danh sách bảo mật — nó là
  //    **điều kiện để luồng sản phẩm của Board chạy đúng**.
  const HREF_READY = ['/giam-doc', '/buyer', '/md', '/to-truong-cat', '/to-truong-may',
    '/hoan-thanh', '/qa', '/kho', '/xuat-hang', '/subcon', '/ke-toan', '/admin'];

  const hoLot = HREF_READY.filter((h) => !isProtectedPath(h));
  s.ok(`Cả ${HREF_READY.length} Module READY đều là route ĐƯỢC BẢO VỆ`,
    hoLot.length === 0,
    `${hoLot.join(' · ')} — khách bấm vào sẽ mở THẲNG, ⛔ không qua Login`);

  // Chiều ngược lại: trang chủ phải công khai, nếu ⛔ không thì Launcher ⛔
  // không bao giờ tới được mắt khách — và toàn bộ lý do hiện 16 ô sụp đổ.
  s.ok('Trang chủ `/` KHÔNG bị bảo vệ — khách vào được Launcher',
    isProtectedPath('/') === false);

  // Mỗi Module READY phải có ÍT NHẤT MỘT vai mở được. Một ô sáng mà ⛔ không
  // vai nào vào nổi là một ô dẫn thẳng vào 403 với **mọi** người dùng.
  const moCoi = HREF_READY.filter((h) => !ALL_ROLES.some((v) => canAccess(v, h)));
  s.ok('Mọi Module READY có ≥ 1 vai mở được',
    moCoi.length === 0, `${moCoi.join(' · ')} — ô dẫn thẳng vào 403 với MỌI vai`);
}

process.exit(s.ketThuc() ? 1 : 0);
