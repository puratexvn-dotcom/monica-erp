// ============================================================================
// VÒNG ĐỜI CHIẾT TÍNH — `DRAFT → SUBMITTED → APPROVED → SUPERSEDED`
//
// ─── VÌ SAO TỆP NÀY TỒN TẠI ───────────────────────────────────────────────
//
// Migration `042` đi qua bốn cổng: một ADR chín mục · phê duyệt Board ·
// `90/90` bài kiểm đọc · `A001` đạt. **Không cổng nào bắt được lỗi `B-1`.**
//
// Vì sao: cả bốn đều đo **quyền ĐỌC** và **quyền GHI ở mức bảng**. Không cổng
// nào đi theo một **vòng đời chứng từ** rồi hỏi *"mỗi phép chuyển có còn chạy
// được không?"*
//
// `042` cấm `UPDATE` trên dòng `status IN ('APPROVED','SUPERSEDED')` — đúng ý
// định *(Hiến pháp Điều 8: chứng từ đã duyệt không được sửa)*, nhưng nó cấm
// luôn phép chuyển **hợp lệ** `APPROVED → SUPERSEDED` mà `reviseCosting` cần.
// Và vì lời gọi đó không kiểm lỗi, hệ thống sinh ra **hai chiết tính cùng
// APPROVED** cho một mã hàng, trong khi người dùng thấy báo thành công.
//
// Hồ sơ: `docs/review/ADR-018-review.md` §B-1 · migration `043`.
//
// ─── BÀI KIỂM NÀY PHẢI HỎNG TRƯỚC KHI `043` CHẠY ─────────────────────────
//
// Nó mô tả trạng thái ĐÍCH. Xanh trước khi `043` chạy nghĩa là bài kiểm sai.
//
// ─── HAI VẾ LUÔN ĐI THÀNH CẶP — K-3 ──────────────────────────────────────
//
// Mỗi phép cấm đi kèm một phép ĐỐI CHỨNG rằng thao tác hợp lệ vẫn chạy được.
// Chỉ đo vế cấm thì một policy chặn phẳng cũng xanh — mà chặn phẳng chính là
// lỗi `B-1`.
// ============================================================================
import { randomUUID } from 'node:crypto';
import { requireDb, scoreboard, sessionFactory } from '../_lib/harness.mjs';

const { env, admin, createClient } = requireDb();
const s = scoreboard('VÒNG ĐỜI CHIẾT TÍNH');
const phien = sessionFactory(admin, createClient, env, 'cstlife');

const rac = [];
const gieo = async (bang, hang) => {
  const { data, error } = await admin.from(bang).insert(hang).select('id').single();
  if (error) throw new Error(`gieo ${bang}: ${error.message}`);
  rac.unshift({ bang, id: data.id });
  return data.id;
};
/** Trạng thái thật của dòng, đọc bằng `service_role` — không tin lệnh vừa gửi. */
const trangThai = async (id) => {
  const { data } = await admin.from('costings').select('status').eq('id', id).single();
  return data?.status ?? null;
};

try {
  const { data: khach } = await admin.from('customers')
    .select('id').eq('is_active', true).limit(1).maybeSingle();
  if (!khach) {
    console.log('⚪ BỎ QUA — chưa có khách hàng nền. Chạy S001 rồi chạy lại.');
    console.log('   ⚠️ Bỏ qua KHÔNG phải là đạt (Hiến pháp V.1).');
    process.exit(0);
  }

  const ma = randomUUID().slice(0, 8);
  const md = (await phien.tao('md', 'md')).client;
  // ⚠️ `costings_no_version_unique UNIQUE (costing_no, version)` — hai lời gọi
  // cùng trạng thái sẽ trùng khoá nếu chỉ lấy tên theo trạng thái. Đếm tăng dần.
  let dem = 0;
  const moi = (tt) => gieo('costings', {
    costing_no: `ZZLC-${ma}-${++dem}`, customer_id: khach.id, order_type: 'FOB',
    currency: 'USD', quantity: 100, quoted_price: 10, status: tt,
  });

  // ══ A · PHÉP CHUYỂN HỢP LỆ PHẢI CHẠY ĐƯỢC ────────────────────────────────
  console.log('\nA · Phép chuyển HỢP LỆ — vế đối chứng, thiếu nó thì chặn phẳng cũng xanh');

  const cDraft = await moi('DRAFT');
  await md.from('costings').update({ status: 'SUBMITTED' }).eq('id', cDraft);
  s.ok('⭐ DRAFT → SUBMITTED', (await trangThai(cDraft)) === 'SUBMITTED');

  await md.from('costings')
    .update({ status: 'APPROVED', approved_at: new Date().toISOString() }).eq('id', cDraft);
  s.ok('⭐ SUBMITTED → APPROVED', (await trangThai(cDraft)) === 'APPROVED');

  // 🔴 ĐÂY LÀ PHÉP ĐO BẮT ĐƯỢC `B-1`. `reviseCosting` cần đúng phép chuyển này.
  const cApp = await moi('APPROVED');
  await md.from('costings').update({ status: 'SUPERSEDED' }).eq('id', cApp);
  s.ok('⭐ APPROVED → SUPERSEDED (reviseCosting cần)',
    (await trangThai(cApp)) === 'SUPERSEDED',
    'BỊ CHẶN — lỗi B-1, chạy migration 043');

  // ══ B · PHÉP CẤM PHẢI BỊ CHẶN ────────────────────────────────────────────
  console.log('\nB · Phép CẤM — Hiến pháp Điều 8, chứng từ đã duyệt bất động');

  const cGia = await moi('APPROVED');
  await md.from('costings').update({ quoted_price: 999.99 }).eq('id', cGia);
  const { data: sauGia } = await admin.from('costings')
    .select('quoted_price').eq('id', cGia).single();
  s.ok('⭐ KHÔNG sửa được giá của chiết tính ĐÃ DUYỆT',
    Number(sauGia.quoted_price) === 10, `giá thành ${sauGia.quoted_price}`);

  const cSup = await moi('SUPERSEDED');
  await md.from('costings').update({ status: 'DRAFT' }).eq('id', cSup);
  s.ok('⭐ SUPERSEDED là trạng thái CUỐI — không quay lui được',
    (await trangThai(cSup)) === 'SUPERSEDED');

  // ══ C · KHOẢN MỤC CỦA CHIẾT TÍNH ĐÃ DUYỆT — `B-3` ────────────────────────
  // Khoản mục sửa được trong khi `margin_percent` của bảng cha bị khoá ⇒ số
  // liệu lệch âm thầm. Cùng họ lỗi với `B-1`: thành công một nửa, không ai báo.
  console.log('\nC · Khoản mục — B-3');

  const cItem = await moi('DRAFT');
  const itemId = await gieo('costing_items', {
    costing_id: cItem, category: 'FABRIC', item_name: 'ZZ vải', unit: 'M',
    consumption: 1, unit_price: 2,
  });
  // Vế đối chứng TRƯỚC: trên bản nháp phải sửa được.
  await md.from('costing_items').update({ unit_price: 3 }).eq('id', itemId);
  const { data: nhap } = await admin.from('costing_items')
    .select('unit_price').eq('id', itemId).single();
  s.ok('⭐ Khoản mục của bản NHÁP vẫn sửa được', Number(nhap.unit_price) === 3);

  await admin.from('costings').update({ status: 'APPROVED' }).eq('id', cItem);
  await md.from('costing_items').update({ unit_price: 88 }).eq('id', itemId);
  const { data: duyet } = await admin.from('costing_items')
    .select('unit_price').eq('id', itemId).single();
  s.ok('⭐ Khoản mục của bản ĐÃ DUYỆT bị khoá',
    Number(duyet.unit_price) === 3, `giá thành ${duyet.unit_price} — B-3 còn hở`);

  await md.auth.signOut();
} catch (e) {
  console.error('\n⛔ NGOẠI LỆ: ' + e.message);
  s.ok('Bài kiểm chạy trọn vẹn', false, e.message);
} finally {
  // Dòng đã chuyển sang APPROVED/SUPERSEDED vẫn xoá được bằng `service_role`:
  // `042` chỉ thu hồi `DELETE` của `authenticated`, không đụng khoá quản trị.
  for (const { bang, id } of rac) await admin.from(bang).delete().eq('id', id);
  await phien.don();
  console.log(`\nĐã dọn: ${rac.length} dòng gieo tạm + tài khoản tạm.`);
}

process.exit(s.ketThuc() ? 1 : 0);
