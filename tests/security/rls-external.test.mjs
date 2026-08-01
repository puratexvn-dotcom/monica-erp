// ============================================================================
// KIỂM PHÂN QUYỀN NGƯỜI DÙNG BÊN NGOÀI — 031a · 031b · 031c · 031c3 · I-11
//
// Đây là bài kiểm quan trọng nhất của dự án. Nó chứng minh bằng **phiên đăng
// nhập thật** rằng nhà thầu và khách hàng chỉ thấy đúng phần của họ.
//
// ─── PHỤ THUỘC DỮ LIỆU NỀN ────────────────────────────────────────────────
// Cần `supabase/seeds/S001_business_baseline.sql` đã chạy. Thiếu dữ liệu nền
// thì bài kiểm **tuyên bố bỏ qua**, KHÔNG báo đạt (Hiến pháp V.1).
//
// ─── SÁU VAI ──────────────────────────────────────────────────────────────
//   GIAT   SUB-GIAT-02 · nhà thầu dịch vụ, có phần việc + đơn gia công
//   IN-01  SUB-IN-01   · nhà thầu dịch vụ KHÁC — dùng để đo Ownership
//   SC1    xưởng may   · PRODUCTION_PARTNER, không có hồ sơ nhà thầu dịch vụ
//   Buyer  khách hàng ZIBUYU
//   Monica nội bộ
//   anon   chưa đăng nhập
// ============================================================================
import { randomUUID } from 'node:crypto';
import { requireDb, scoreboard, sessionFactory, dem } from '../_lib/harness.mjs';

const { env, admin, anonClient, createClient } = requireDb();
const s = scoreboard('KIỂM PHÂN QUYỀN NGƯỜI NGOÀI');
const phien = sessionFactory(admin, createClient, env, 'rlsext');

const rac = [];            // dòng do phép thử tạo ra — phải dọn
const acctIds = [];
let baId = null;

try {
  // ══ BỐI CẢNH ─────────────────────────────────────────────────────────────
  const { data: khach } = await admin.from('customers').select('id')
    .eq('customer_code', 'KHZBY').maybeSingle();
  const { data: dsDoiTac } = await admin.from('partners')
    .select('id, partner_code, subcontractor_id').is('deleted_at', null);
  const P = Object.fromEntries((dsDoiTac ?? []).map((p) => [p.partner_code, p]));
  const { data: don } = await admin.from('orders').select('id')
    .eq('po_number', 'SEED-PO-0001').maybeSingle();
  const { data: chuyen } = await admin.from('sewing_lines')
    .select('id, target_pcs_per_hour').eq('line_code', 'SEED-LINE-01').maybeSingle();

  if (!khach || !don || !chuyen || !P['SUB-GIAT-02'] || !P['SUB-IN-01'] || !P.SC1) {
    console.log('⚪ BỎ QUA — chưa có dữ liệu nền S001.');
    console.log('   Chạy `supabase/seeds/S001_business_baseline.sql` rồi chạy lại.');
    console.log('   ⚠️ Bỏ qua KHÔNG phải là đạt (Hiến pháp V.1).');
    process.exit(0);
  }

  const giat = await phien.tao('subcon', 'giat');
  const inpr = await phien.tao('subcon', 'in');
  const sc1 = await phien.tao('subcon', 'sc1');
  for (const [ng, ma] of [[giat, 'SUB-GIAT-02'], [inpr, 'SUB-IN-01'], [sc1, 'SC1']]) {
    const { data: a } = await admin.from('partner_accounts')
      .insert({ user_id: ng.userId, partner_id: P[ma].id, is_active: true, note: 'ZZ test' })
      .select('id').single();
    acctIds.push(a.id);
  }
  const buyer = await phien.tao('buyer', 'buyer');
  const { data: ba } = await admin.from('buyer_accounts')
    .insert({ user_id: buyer.userId, customer_id: khach.id, is_active: true, note: 'ZZ test' })
    .select('id').single();
  baId = ba.id;
  const md = await phien.tao('md', 'md');
  const anon = anonClient();

  // ══ A · 031a — NGƯỜI NGOÀI KHÔNG GHI ĐƯỢC BỐN BẢNG LÕI ──────────────────
  // ⚠️ K-2: gửi bản ghi HỢP LỆ và ĐẦY ĐỦ, không gửi `{}` rồi đọc mã lỗi.
  console.log('\nA · 031a — CHẶN GHI');
  const mau = {
    orders: () => ({
      po_number: 'ZZT-' + randomUUID().slice(0, 8), style_code: 'ZZ',
      customer_name: 'ZZ', total_quantity: 1, delivery_date: '2026-12-31', status: 'APPROVED',
    }),
    qa_audit_reports: () => ({
      order_id: don.id, line_name: 'ZZ', time_slot: '21:00-21:59',
      inspected_qty: 1, passed_qty: 1, defect_qty: 0,
    }),
  };
  for (const [ten, c] of [['Nhà thầu', sc1.client], ['Buyer', buyer.client]])
    for (const bang of Object.keys(mau)) {
      const { data } = await c.from(bang).insert(mau[bang]()).select('id');
      if (data?.[0]?.id) rac.push({ bang, id: data[0].id });
      s.ok(`${ten} KHÔNG tạo được ${bang}`, !data?.[0]?.id, 'TẠO ĐƯỢC');
    }
  const { data: qa } = await admin.from('qa_audit_reports')
    .select('id, defect_qty').not('assignment_id', 'is', null).limit(1).maybeSingle();
  if (qa) {
    await sc1.client.from('qa_audit_reports').update({ defect_qty: 999 }).eq('id', qa.id);
    const { data: sau } = await admin.from('qa_audit_reports')
      .select('defect_qty').eq('id', qa.id).single();
    s.ok('Nhà thầu KHÔNG sửa được kết quả QA', sau.defect_qty === qa.defect_qty);
  } else s.chuaDo('sửa kết quả QA', 'không có dòng QA gắn phần việc');

  // ══ B · 031b — MỞ ĐỌC THEO PHẠM VI ──────────────────────────────────────
  console.log('\nB · 031b — LINE MAP + order_items');
  s.ok('SC1 thấy ĐÚNG 1 chuyền được giao', (await dem(sc1.client, 'sewing_lines')) === 1);
  s.ok('IN-01 (không gắn chuyền) thấy 0', (await dem(inpr.client, 'sewing_lines')) === 0);
  const tongItem = await dem(admin, 'order_items');
  s.ok(`Buyer thấy order_items của mình (${tongItem})`,
    (await dem(buyer.client, 'order_items')) === tongItem);
  await sc1.client.from('sewing_lines')
    .update({ target_pcs_per_hour: 555 }).eq('id', chuyen.id);
  const { data: cSau } = await admin.from('sewing_lines')
    .select('target_pcs_per_hour').eq('id', chuyen.id).single();
  s.ok('Nhà thầu KHÔNG sửa được chuyền HỌ NHÌN THẤY',
    cSau.target_pcs_per_hour === chuyen.target_pcs_per_hour);

  // ══ C · 031c — HỒ SƠ NHÀ THẦU ───────────────────────────────────────────
  // ⚠️ K-3: mỗi vế phủ định đi kèm một vế KHẲNG ĐỊNH. "Không thấy của người
  // khác" một mình sẽ xanh cả khi policy chặn sạch.
  console.log('\nC · 031c — không thấy nhà thầu khác');
  s.ok('GIAT thấy ĐÚNG 1 hồ sơ', (await dem(giat.client, 'subcontractors')) === 1);
  const { data: hsG } = await giat.client.from('subcontractors').select('id');
  s.ok('...và đúng hồ sơ của chính mình',
    hsG?.[0]?.id === P['SUB-GIAT-02'].subcontractor_id);
  s.ok('IN-01 cũng thấy ĐÚNG 1', (await dem(inpr.client, 'subcontractors')) === 1);
  const { data: hsI } = await inpr.client.from('subcontractors').select('id');
  s.ok('...và KHÔNG phải hồ sơ của GIAT',
    hsI?.[0]?.id === P['SUB-IN-01'].subcontractor_id);
  s.ok('SC1 (xưởng may, không cầu nối) thấy 0',
    (await dem(sc1.client, 'subcontractors')) === 0);

  // ══ D · 031c3 — OWNERSHIP · GIÁ · ORPHAN ────────────────────────────────
  console.log('\nD · 031c3 — đơn gia công: ownership · giá · mồ côi');
  const tongDon = await dem(admin, 'subcon_orders');
  if (!tongDon) s.chuaDo('subcon_orders', 'bảng rỗng');
  else {
    const { data: dG } = await giat.client.from('subcon_orders')
      .select('subcon_order_no, unit_price');
    const { data: dI } = await inpr.client.from('subcon_orders')
      .select('subcon_order_no, unit_price');
    const ma = (x) => (x ?? []).map((r) => r.subcon_order_no).sort().join(',');
    console.log(`     GIAT [${ma(dG)}]   IN-01 [${ma(dI)}]`);

    s.ok('⭐ GIAT THẤY đơn của chính mình',
      (dG ?? []).some((r) => r.subcon_order_no === 'SEED-SO-GIAT'));
    s.ok('⭐ GIAT KHÔNG thấy đơn của IN-01',
      !(dG ?? []).some((r) => r.subcon_order_no === 'SEED-SO-IN'));
    s.ok('⭐ IN-01 THẤY đơn của chính mình',
      (dI ?? []).some((r) => r.subcon_order_no === 'SEED-SO-IN'));
    s.ok('⭐ IN-01 KHÔNG thấy đơn của GIAT',
      !(dI ?? []).some((r) => r.subcon_order_no === 'SEED-SO-GIAT'));
    s.ok('⭐ GIÁ — GIAT thấy đúng đơn giá 4500 của mình',
      (dG ?? []).some((r) => Number(r.unit_price) === 4500));
    s.ok('⭐ GIÁ — GIAT KHÔNG thấy đơn giá 7800 của IN-01',
      !(dG ?? []).some((r) => Number(r.unit_price) === 7800));
    const { data: dS } = await sc1.client.from('subcon_orders').select('subcon_order_no');
    s.ok('⭐ MỒ CÔI — không vai ngoài nào thấy đơn mồ côi',
      ![...(dG ?? []), ...(dI ?? []), ...(dS ?? [])]
        .some((r) => r.subcon_order_no === 'SEED-SO-ORPHAN'));
    s.ok('Buyer KHÔNG thấy đơn gia công nào', (await dem(buyer.client, 'subcon_orders')) === 0);
    s.ok('Monica thấy đủ', (await dem(md.client, 'subcon_orders')) === tongDon);
  }

  for (const bang of ['subcon_issue_logs', 'subcon_receipt_logs']) {
    const tong = await dem(admin, bang);
    if (!tong) { s.chuaDo(bang, 'bảng rỗng — chờ ADR-008'); continue; }
    s.ok(`Buyer KHÔNG thấy ${bang}`, (await dem(buyer.client, bang)) === 0);
    const g = await dem(giat.client, bang);
    s.ok(`${bang} — GIAT không thấy dòng mồ côi`, g !== null && g < tong, `${g}/${tong}`);
  }

  // ══ E · I-11 — DOMAIN INTEGRITY ─────────────────────────────────────────
  // Dữ liệu vi phạm bất biến KHÔNG được tồn tại để kiểm RLS. Thay vào đó ta
  // THỬ TẠO nó và chờ bị từ chối — kèm một phép ĐỐI CHỨNG rằng đơn hợp lệ vẫn
  // tạo được, để biết bất biến không chặn quá tay.
  console.log('\nE · I-11 — Commercial Ownership Integrity');
  const { data: vGiat } = await admin.from('assignments').select('id')
    .eq('partner_id', P['SUB-GIAT-02'].id).is('deleted_at', null).limit(1).maybeSingle();
  const { data: vSc1 } = await admin.from('assignments').select('id')
    .eq('partner_id', P.SC1.id).is('deleted_at', null).limit(1).maybeSingle();
  if (!vGiat || !vSc1) s.chuaDo('I-11', 'thiếu phần việc nền');
  else {
    const goc = {
      vendor_id: P['SUB-GIAT-02'].subcontractor_id, order_id: don.id,
      process_type: 'GIAT', total_sent_qty: 1, unit_price: 4500,
    };
    const { data: cheo } = await admin.from('subcon_orders')
      .insert({ ...goc, subcon_order_no: 'ZZI11-' + randomUUID().slice(0, 8),
        assignment_id: vSc1.id }).select('id');
    if (cheo?.[0]?.id) rac.push({ bang: 'subcon_orders', id: cheo[0].id });
    s.ok('⭐ I-11 TỪ CHỐI đơn có vendor không khớp chủ phần việc', !cheo?.[0]?.id, 'TẠO ĐƯỢC');

    const { data: hopLe, error: hlErr } = await admin.from('subcon_orders')
      .insert({ ...goc, subcon_order_no: 'ZZI11OK-' + randomUUID().slice(0, 8),
        assignment_id: vGiat.id }).select('id');
    if (hopLe?.[0]?.id) rac.push({ bang: 'subcon_orders', id: hopLe[0].id });
    s.ok('⭐ ...nhưng đơn HỢP LỆ vẫn tạo được (không chặn quá tay)',
      !!hopLe?.[0]?.id, `BỊ CHẶN: ${hlErr?.code} ${hlErr?.message}`);
  }

  // ══ F · XOÁ MỀM ─────────────────────────────────────────────────────────
  console.log('\nF · Xoá mềm — dòng đã xoá phải VÔ HÌNH');
  const tongAct = await dem(admin, 'assignment_commercial_terms');
  const { count: conHieuLuc } = await admin.from('assignment_commercial_terms')
    .select('*', { count: 'exact', head: true }).is('deleted_at', null);
  if (tongAct === conHieuLuc) s.chuaDo('xoá mềm', 'chưa có dòng nào bị xoá mềm để đo');
  else {
    s.ok('⭐ Monica đọc KHÔNG thấy dòng đã xoá mềm',
      (await dem(md.client, 'assignment_commercial_terms')) === conHieuLuc);
    s.ok('Nhà thầu KHÔNG thấy điều khoản (TIỀN)',
      (await dem(giat.client, 'assignment_commercial_terms')) === 0);
    s.ok('Buyer KHÔNG thấy điều khoản (TIỀN)',
      (await dem(buyer.client, 'assignment_commercial_terms')) === 0);
  }

  // ══ G · SỔ CÁI CHỈ-GHI-THÊM ─────────────────────────────────────────────
  // ⚠️ K-1: KHÔNG ghi thử vào sổ cái. Ghi vào là không xoá ra được.
  // Chỉ thử SỬA — lệnh sửa bị chặn thì không để lại dư lượng nào.
  console.log('\nG · Sổ cái chỉ-ghi-thêm');
  const { data: soCai } = await admin.from('assignment_daily_reports')
    .select('id, parent_report_id, output_qty');
  if (!soCai?.length) s.chuaDo('sổ cái', 'bảng rỗng');
  else {
    const hienHanh = soCai.filter((r) => !soCai.some((c) => c.parent_report_id === r.id));
    s.ok('ĐÚNG một dòng hiện hành (không có con)', hienHanh.length === 1,
      `${hienHanh.length} dòng`);
    const d0 = hienHanh[0];
    for (const [ten, c] of [['Nhà thầu', sc1.client], ['Monica', md.client]]) {
      await c.from('assignment_daily_reports').update({ output_qty: 1 }).eq('id', d0.id);
      const { data: sau } = await admin.from('assignment_daily_reports')
        .select('output_qty').eq('id', d0.id).single();
      s.ok(`${ten} KHÔNG sửa được sổ cái`, String(sau.output_qty) === String(d0.output_qty));
    }
  }

  // ══ H · CHƯA ĐĂNG NHẬP ──────────────────────────────────────────────────
  console.log('\nH · anon');
  let anonThay = 0;
  for (const t of ['orders', 'subcon_orders', 'assignment_daily_reports',
                   'assignment_commercial_terms', 'sewing_lines', 'subcontractors'])
    if ((await dem(anon, t)) ?? 0) anonThay++;
  s.ok('anon KHÔNG đọc được bảng nào', anonThay === 0, `${anonThay} bảng`);

  for (const c of [giat, inpr, sc1, buyer, md]) await c.client.auth.signOut();
} catch (e) {
  console.error('\n⛔ NGOẠI LỆ: ' + e.message);
  s.ok('Bài kiểm chạy trọn vẹn', false, e.message);
} finally {
  for (const { bang, id } of rac) await admin.from(bang).delete().eq('id', id);
  if (baId) await admin.from('buyer_accounts').delete().eq('id', baId);
  for (const a of acctIds) await admin.from('partner_accounts').delete().eq('id', a);
  await phien.don();
  console.log('\nĐã dọn: tài khoản tạm, dòng probe.');
}

process.exit(s.ketThuc() ? 1 : 0);
