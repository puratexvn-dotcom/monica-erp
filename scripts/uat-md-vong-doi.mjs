// ============================================================================
// UAT VÒNG ĐỜI PHÂN HỆ MD — ĐI HẾT MỘT ĐƠN HÀNG THẬT
//
// 📐 Board Directive *MD HANDOVER MODE* 08/08/2026: *"⛔ Không test component.
//    **Test nghiệp vụ.**"*
//
//   Customer → RFQ → Costing → duyệt giá → Style → Tech Pack → BOM
//   → PO → Production → khoá workflow → NPL → QA → Shipment
//   → Completed → Re-open → Completed
//
// 🔑 Mọi lời gọi đi qua **ĐÚNG endpoint mà trình duyệt gọi** (`Next-Action`),
//    bằng **phiên đăng nhập THẬT**. ⛔ Không SQL nghiệp vụ, ⛔ không
//    `service_role` để làm việc thay người dùng — nó CHỈ dùng để dựng bối cảnh
//    và DỌN, đúng như một bài kiểm hồi quy được phép làm.
//
// ─── CHẠY ────────────────────────────────────────────────────────────────
//   1. npm run build                    (bảng Server Action đọc từ gói đã dựng)
//   2. npx next start -p 3100
//   3. node scripts/uat-md-vong-doi.mjs
//
// ⚠️ CẦN: bốn tài khoản seed md001 · md002 · gd001 · qa001, và
//    `SUPABASE_SERVICE_ROLE_KEY` để dọn. Thiếu ⇒ in `⚪ BỎ QUA` và thoát 0.
//    **"Bỏ qua" ≠ "đạt"** — đọc log, đừng đọc mỗi mã thoát.
//
// ⚠️ Bài kiểm dựng dữ liệu **dùng-một-lần** mang tiền tố `UAT…` rồi dọn sạch
//    trong khối cuối. ⛔ KHÔNG chạm một dòng dữ liệu nghiệp vụ thật nào.
// ============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const BASE = process.env.UAT_BASE || 'http://localhost:3100';
const MAT_KHAU = process.env.SEED_PASSWORD || 'Monica12345@';

if (!existsSync('.env.local')) { console.log('⚪ BỎ QUA — ⛔ không có .env.local.'); process.exit(0); }
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
if (!env.SUPABASE_SERVICE_ROLE_KEY) { console.log('⚪ BỎ QUA — thiếu SERVICE_ROLE_KEY. "Bỏ qua" ≠ "đạt".'); process.exit(0); }
if (!existsSync('.next/server/app')) { console.log('⚪ BỎ QUA — ⛔ chưa `npm run build`.'); process.exit(0); }

let dat = 0; const hong = [];
const ok = (t, dk, g = '') => {
  if (dk) { dat++; console.log(`  ĐẠT   ${t}`); return true; }
  hong.push(t); console.log(`  HỎNG  ${t}${g ? `\n          ${g}` : ''}`); return false;
};

async function dangNhap(email) {
  const jar = new Map();
  const sb = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (l) => l.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: MAT_KHAU });
  if (error) throw new Error(`${email}: ${error.message}`);
  return { sb, user: data.user, ck: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ') };
}

// ─── Bảng Server Action, đọc từ gói ĐÃ DỰNG ───────────────────────────────
// ⚠️ Khoá có thể **⛔ không có dấu nháy**: id bắt đầu bằng chữ cái là định danh
// JS hợp lệ nên webpack bỏ nháy. Bỏ sót chuyện này thì bài kiểm **im lặng bỏ
// qua** đúng phép thử quan trọng nhất — lỗi đã mắc một lần.
const ACT = new Map();
{
  const quet = (d, a = []) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) quet(p, a); else if (e.name.endsWith('.js')) a.push(p);
    }
    return a;
  };
  const re = /"?([0-9a-f]{40})"?:\(\)=>Promise[\s\S]{0,140}?\w+=>\w+\.(\w+)\)/g;
  for (const f of quet('.next/server/app')) {
    for (const m of readFileSync(f, 'utf8').matchAll(re)) if (!ACT.has(m[2])) ACT.set(m[2], m[1]);
  }
}

/** Đọc kết quả từ luồng RSC.
 *  ⚠️ ⛔ KHÔNG neo vào dòng `1:` — số thứ tự đổi theo số tham chiếu mà lượt gọi
 *  sinh ra (lượt có `revalidatePath` cho ra `2:`/`3:`). Quét MỌI dòng. */
function docKq(t) {
  for (const dong of String(t).split('\n')) {
    const i = dong.indexOf(':'); if (i < 0) continue;
    const than = dong.slice(i + 1).trim();
    if (!than.startsWith('{') && !than.startsWith('[')) continue;
    try {
      const o = JSON.parse(than);
      if (o && typeof o === 'object' && ('ok' in o || 'rows' in o || 'muc' in o)) return o;
    } catch { /* dòng này ⛔ không phải kết quả */ }
  }
  return {};
}
async function goi(phien, path, ten, args) {
  const id = ACT.get(ten);
  if (!id) return { ok: false, message: `⛔ ⛔ không tìm được action id: ${ten}` };
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { cookie: phien.ck, 'Next-Action': id, 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(args), redirect: 'manual',
  });
  return docKq(await r.text());
}

const md = await dangNhap('md001@monica.vn');
const md2 = await dangNhap('md002@monica.vn');
const gd = await dangNhap('gd001@monica.vn');
const qa = await dangNhap('qa001@monica.vn');
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

console.log(`UAT VÒNG ĐỜI MD — md001 · md002 · gd001 · qa001 · ${ACT.size} action\n`);

const TAG = `UAT${Date.now().toString().slice(-7)}`;
const rac = { customers: [], inquiries: [], costings: [], styles: [], orders: [], docs: [], mr: [], po: [], sh: [] };
const S = {};

try {
// ═══ ① CUSTOMER ════════════════════════════════════════════════════════════
console.log('① CUSTOMER');
{
  const r = await goi(md, '/md', 'createCustomerFull', [{
    customer_code: `${TAG}-KH`, name: `Khách UAT ${TAG}`, brand: 'BrandX',
    buyer_group: 'GroupY', contact_person: 'Ms. A', phone: '0900000000',
    email: 'a@x.com', country: 'Nhật Bản', address: 'Tokyo', tax_code: '123',
    currency: 'USD', incoterm: 'FOB', payment_term: 'T/T 30 ngày', credit_limit: 0, notes: 'UAT',
  }]);
  ok('1.1 Tạo khách hàng', r.ok === true, JSON.stringify(r).slice(0, 200));
  S.khach = r.data?.id; if (S.khach) rac.customers.push(S.khach);
  const { data: c } = await admin.from('customers').select('*').eq('id', S.khach ?? '').maybeSingle();
  ok('1.2 Hạn mức 0 lưu ra 0, ⛔ không thành NULL', c && Number(c.credit_limit) === 0 && c.credit_limit !== null);
  const { data: nk } = await admin.from('activity_log').select('action')
    .eq('entity_type', 'CUSTOMER').eq('entity_id', S.khach ?? '');
  ok('1.3 Tạo khách CÓ Audit Log', (nk ?? []).length > 0);
}

// ═══ ② RFQ ═════════════════════════════════════════════════════════════════
console.log('\n② RFQ');
{
  const r = await goi(md, '/md', 'createInquiry', [{
    inquiry_no: `${TAG}-RFQ`, customer_id: S.khach, season_id: '',
    product_name: 'Áo khoác UAT', description: 'mô tả', expected_qty: 5000,
    target_price: 4.2, currency: 'USD', order_type: 'FOB',
    received_date: '2026-08-08', due_date: '2026-08-20', status: 'NEW', notes: '',
  }]);
  ok('2.1 Tạo RFQ', r.ok === true, JSON.stringify(r).slice(0, 200));
  const { data: i } = await admin.from('inquiries').select('id').eq('inquiry_no', `${TAG}-RFQ`).maybeSingle();
  S.rfq = i?.id; if (S.rfq) rac.inquiries.push(S.rfq);
  ok('2.2 Đẩy RFQ sang COSTING', (await goi(md, '/md', 'setInquiryStatus', [S.rfq, 'COSTING'])).ok === true);
}

// ═══ ③ COSTING + DUYỆT GIÁ ════════════════════════════════════════════════
console.log('\n③ COSTING — MD trình · GIÁM ĐỐC duyệt');
{
  const r = await goi(md, '/md', 'createCosting', [{
    costing_no: `${TAG}-CT`, inquiry_id: S.rfq, style_id: '', customer_id: S.khach,
    order_type: 'FOB', currency: 'USD', quantity: 5000,
    target_price: 4.2, quoted_price: 4.65, notes: 'UAT',
  }]);
  ok('3.1 Tạo chiết tính', r.ok === true, JSON.stringify(r).slice(0, 200));
  S.costing = r.data?.id; if (S.costing) rac.costings.push(S.costing);

  ok('3.2 Thêm khoản mục', (await goi(md, '/md', 'addCostingItem', [{
    costing_id: S.costing, category: 'FABRIC', item_name: 'Vải chính',
    unit: 'm', consumption: 1.8, unit_price: 2.1, notes: '',
  }])).ok === true);

  ok('3.3 MD TRÌNH được', (await goi(md, '/md', 'setCostingStatus', [S.costing, 'SUBMITTED', ''])).ok === true);
  ok('🔴 3.4 MD ⛔ KHÔNG tự duyệt (SoD)',
    (await goi(md, '/md', 'setCostingStatus', [S.costing, 'APPROVED', ''])).ok === false);

  // 🔴 Giám đốc duyệt ở BÀN CỦA GIÁM ĐỐC — `giamdoc` ⛔ không vào được `/md`.
  const rho = await goi(gd, '/giam-doc', 'listChoDuyet', []);
  ok('3.5 Giám đốc ĐỌC được hộp thư duyệt giá', Array.isArray(rho.rows));
  ok('3.6 Bản vừa trình CÓ trong hộp thư',
    (rho.rows ?? []).some((x) => x.costing_no === `${TAG}-CT`));

  const rgd = await goi(gd, '/giam-doc', 'duyetChietTinh', [S.costing, 'APPROVED', '']);
  ok('🔴 3.7 GIÁM ĐỐC DUYỆT ĐƯỢC — trước 049 là NGÕ CỤT', rgd.ok === true, JSON.stringify(rgd).slice(0, 300));
  const { data: ct } = await admin.from('costings').select('status, approved_by').eq('id', S.costing ?? '').maybeSingle();
  ok('3.8 CSDL = APPROVED và ghi đúng người duyệt',
    ct?.status === 'APPROVED' && ct?.approved_by === gd.user.id);
  const { data: nkc } = await admin.from('activity_log').select('action, changes')
    .eq('entity_type', 'COSTING').eq('entity_id', S.costing ?? '');
  ok('3.9 Duyệt giá CÓ Audit Log + phiên bản',
    (nkc ?? []).some((x) => x.action === 'APPROVE' && x.changes?.__phien_ban));
}

// ═══ ④ STYLE ═══════════════════════════════════════════════════════════════
console.log('\n④ STYLE');
{
  const r = await goi(md, '/md', 'createStyle', [{
    style_no: `${TAG}-ST`, style_name: 'Áo khoác UAT', customer_id: S.khach,
    season_id: '', product_group: 'Áo khoác', gender: 'WOMEN', hs_code: '6202',
    fabric_type: 'Polyester', sam_minutes: 22.7, needle_type: 'DBx1',
    machine_types: '1 kim', marker_code: 'MK-1', marker_length_m: 1.85,
    marker_efficiency: 82, tech_pack_url: '', status: 'DEVELOPMENT', notes: '',
  }]);
  ok('4.1 Tạo mã hàng', r.ok === true, JSON.stringify(r).slice(0, 200));
  S.style = r.data?.id; if (S.style) rac.styles.push(S.style);
  ok('4.2 Thêm bảng màu', (await goi(md, '/md', 'addColorway', [{
    style_id: S.style, color_code: 'NAVY', color_name: 'Xanh navy', pantone: '19-4024', hex_preview: '#1F2A44',
  }])).ok === true);
  ok('4.3 Thêm dải size', (await goi(md, '/md', 'addSizeRange', [{ style_id: S.style, sizes: 'S,M,L,XL' }])).ok === true);
  ok('4.4 Thêm công đoạn', (await goi(md, '/md', 'addOperation', [{
    style_id: S.style, seq_no: 1, operation: 'May thân', machine_type: '1 kim', sam_minutes: 5.5, notes: '',
  }])).ok === true);
}

// ═══ ⑤ TECH PACK ═══════════════════════════════════════════════════════════
console.log('\n⑤ TECH PACK');
{
  ok('5.1 Lưu Tech Pack', (await goi(md, '/md', 'saveDocument', [{
    entity_type: 'STYLE', entity_id: S.style, doc_type: 'TECH_PACK',
    title: `${TAG} Tech Pack v1`, storage_path: `uat/${TAG}/tp.pdf`,
    file_size: 1024, mime_type: 'application/pdf', version: 1,
  }])).ok === true);
  const { data: d } = await admin.from('md_documents').select('id').eq('title', `${TAG} Tech Pack v1`).maybeSingle();
  S.doc = d?.id; if (S.doc) rac.docs.push(S.doc);

  ok('5.2 Sửa Tech Pack — đổi tệp ⇒ TĂNG phiên bản',
    (await goi(md, '/md', 'updateTechPack', [S.doc, {
      title: `${TAG} Tech Pack v1 (sửa)`, doc_type: 'TECH_PACK',
      storage_path: `uat/${TAG}/tp-v2.pdf`, mime_type: 'application/pdf',
    }])).ok === true);
  const { data: d2 } = await admin.from('md_documents').select('version').eq('id', S.doc ?? '').maybeSingle();
  ok('5.3 Phiên bản = 2, tệp cũ ⛔ không mất', Number(d2?.version) === 2);

  ok('🔴 5.4 Xoá vật lý BỊ CHẶN (Board cấm)',
    (await goi(md, '/md', 'deleteDocument', [S.doc])).ok === false);
  const { data: d3 } = await admin.from('md_documents').select('id').eq('id', S.doc ?? '').maybeSingle();
  ok('5.5 Tài liệu VẪN CÒN', Boolean(d3?.id));
}

// ═══ ⑥ BOM ═════════════════════════════════════════════════════════════════
console.log('\n⑥ BOM');
{
  ok('6.1 Thêm định mức NPL', (await goi(md, '/md', 'addStyleBom', [{
    style_id: S.style, colorway_id: '', material_id: '', item_name: 'Vải chính 180gsm',
    category: 'FABRIC', unit: 'm', consumption_per_pcs: 1.8, wastage_percent: 3,
    supplier: 'NCC A', notes: '',
  }])).ok === true);
  const { data: b } = await admin.from('style_bom').select('id, net_consumption').eq('style_id', S.style ?? '').maybeSingle();
  S.bom = b?.id;
  ok('6.2 `net_consumption` do CSDL tự tính (1.8 × 1.03 = 1.854)',
    b && Math.abs(Number(b.net_consumption) - 1.854) < 0.0005, `${b?.net_consumption}`);

  ok('6.3 SỬA định mức được', (await goi(md, '/md', 'updateBom', [S.bom, {
    style_id: S.style, colorway_id: '', material_id: '', item_name: 'Vải chính 200gsm',
    category: 'FABRIC', unit: 'm', consumption_per_pcs: 2.0, wastage_percent: 5,
    supplier: 'NCC A', notes: '',
  }])).ok === true);
  const { data: b2 } = await admin.from('style_bom').select('net_consumption').eq('id', S.bom ?? '').maybeSingle();
  ok('6.4 CSDL tính lại (2.0 × 1.05 = 2.10)', b2 && Math.abs(Number(b2.net_consumption) - 2.1) < 0.0005);
}

// ═══ ⑦ PO (ORDER MASTER) ═══════════════════════════════════════════════════
console.log('\n⑦ PURCHASE ORDER');
{
  const { data: se } = await admin.from('seasons').select('id').limit(1);
  const r = await goi(md, '/md', 'createPo', [{
    po_number: `${TAG}-PO`, style_id: S.style, customer_id: S.khach, season_id: se[0].id,
    costing_id: S.costing, total_quantity: 5000, order_type: 'FOB', incoterm: 'FOB',
    currency: 'USD', unit_price: 4.65,
    order_date: '2026-08-08', delivery_date: '2026-12-20', ex_factory_date: '2026-12-05',
    factory_name: 'Xưởng 1', subcontractor_id: '', ship_mode: 'SEA',
    status: 'DRAFT', notes: 'UAT', evidence_path: '',
  }]);
  ok('7.1 Tạo PO', r.ok === true, JSON.stringify(r).slice(0, 250));
  S.po = r.data?.id; if (S.po) rac.orders.push(S.po);

  const { data: p } = await admin.from('orders').select('*').eq('id', S.po ?? '').maybeSingle();
  ok('7.2 PO gắn ĐỦ khoá ngoại (khách · mã hàng · mùa vụ · chiết tính)',
    p && p.customer_id === S.khach && p.style_id === S.style && p.costing_id === S.costing);
  const { data: moc } = await admin.from('order_milestones').select('id').eq('order_id', S.po ?? '');
  ok('7.3 Sinh đủ 15 mốc T&A', (moc ?? []).length === 15, `${moc?.length}`);
  const { data: nk } = await admin.from('activity_log').select('changes')
    .eq('entity_type', 'ORDER').eq('entity_id', S.po ?? '');
  ok('7.4 Tạo PO CÓ Audit Log + phiên bản 1', (nk ?? [])[0]?.changes?.__phien_ban?.to === 1);
  ok('7.5 PO ⛔ chưa có lệnh SX ⇒ SỬA ĐƯỢC',
    (await goi(md, '/md', 'updatePo', [S.po,
      { total_quantity: 5200, status: 'APPROVED', delivery_date: '2026-12-20' }, false])).ok === true);
}

// ═══ ⑧ PRODUCTION + KHOÁ WORKFLOW ═════════════════════════════════════════
console.log('\n⑧ PRODUCTION — khoá theo WORKFLOW');
{
  ok('8.1 Tạo lệnh sản xuất', (await goi(md, '/md', 'createProductionOrder', [{
    order_no: `${TAG}-LSX`, order_id: S.po, planned_qty: 5200,
    start_date: '2026-10-01', due_date: '2026-11-20', notes: '', evidence_path: '',
  }])).ok === true);
  const { data: po } = await admin.from('production_orders').select('id').eq('order_no', `${TAG}-LSX`).maybeSingle();
  S.lsx = po?.id; if (S.lsx) rac.po.push(S.lsx);

  ok('🔴 8.2 PO đã sinh lệnh SX ⇒ CHỈ ĐƯỢC YÊU CẦU THAY ĐỔI',
    (await goi(md, '/md', 'docKhoaPo', [S.po])).muc === 'YEU_CAU_THAY_DOI');
  ok('🔴 8.3 Sửa trực tiếp BỊ TỪ CHỐI (tầng ứng dụng)',
    (await goi(md, '/md', 'updatePo', [S.po,
      { total_quantity: 9999, status: 'APPROVED', delivery_date: '2026-12-20' }, true])).ok === false);

  // 🔴 HÀNG RÀO THẬT — `049`. Đi thẳng PostgREST, ⛔ không qua Server Action.
  const { error: eDb } = await md.sb.from('orders').update({ total_quantity: 9999 }).eq('id', S.po);
  ok('🔴 8.4 HÀNG RÀO CSDL chặn (049) — ⛔ không đi vòng qua PostgREST được',
    eDb?.code === '23514', eDb ? `${eDb.code}: ${eDb.message}` : 'KHÔNG có lỗi ⇒ hàng rào thật ⛔ CHƯA có');
  const { data: p } = await admin.from('orders').select('total_quantity').eq('id', S.po ?? '').maybeSingle();
  ok('8.5 Số lượng GIỮ NGUYÊN 5200', Number(p?.total_quantity) === 5200, `${p?.total_quantity}`);

  ok('8.6 Lối ra CÓ THẬT: lập được Yêu cầu thay đổi',
    (await goi(md, '/md', 'createChangeRequest', [{
      request_no: `${TAG}-CR`, order_id: S.po, style_id: S.style, change_type: 'QUANTITY',
      old_value: '5200', new_value: '5500', reason: 'Khách tăng đơn', impact_note: 'Cần thêm vải',
    }])).ok === true);
}

// ═══ ⑨ MATERIAL REQUEST ════════════════════════════════════════════════════
console.log('\n⑨ MATERIAL REQUEST');
{
  ok('9.1 Tạo yêu cầu NPL', (await goi(md, '/md', 'createMaterialRequest', [{
    request_no: `${TAG}-NPL`, order_id: S.po, material_name: 'Vải chính 200gsm',
    category: 'FABRIC', quantity: 10920, unit: 'm', needed_date: '2026-09-15',
    notes: '', evidence_path: '',
  }])).ok === true);
  const { data: m } = await admin.from('material_requests').select('id').eq('request_no', `${TAG}-NPL`).maybeSingle();
  S.mr = m?.id; if (S.mr) rac.mr.push(S.mr);
  ok('9.2 Sửa yêu cầu NPL khi ⛔ chưa đặt hàng', (await goi(md, '/md', 'updateMaterialRequest', [S.mr, {
    request_no: `${TAG}-NPL`, order_id: S.po, material_name: 'Vải chính 200gsm',
    category: 'FABRIC', quantity: 11550, unit: 'm', needed_date: '2026-09-15',
    notes: 'điều chỉnh theo CR', evidence_path: '',
  }])).ok === true);
}

// ═══ ⑩ QA ══════════════════════════════════════════════════════════════════
console.log('\n⑩ QA');
{
  // ⚠️ Bảng THẬT là `qa_audit_reports` (⛔ KHÔNG phải `qa_reports`), và
  // `createQAReport` nhận **FormData** ⇒ đo ở tầng RLS: QA ghi được biên bản
  // cho PO của MD ⛔ không — tức hai phân hệ có thông nhau ⛔ không.
  const { error: eQa } = await qa.sb.from('qa_audit_reports').insert({
    order_id: S.po, line_name: 'Chuyền UAT', time_slot: '08:00-09:00',
    inspected_qty: 200, passed_qty: 197, defect_qty: 3, notes: 'UAT',
  });
  ok('10.1 QA GHI được biên bản kiểm cho PO của MD', !eQa, eQa ? `${eQa.code}: ${eQa.message}` : '');
  const { data: qr } = await admin.from('qa_audit_reports').select('id').eq('order_id', S.po ?? '');
  ok('10.2 Biên bản gắn ĐÚNG đơn hàng', (qr ?? []).length > 0);
}

// ═══ ⑪ SHIPMENT ════════════════════════════════════════════════════════════
console.log('\n⑪ SHIPMENT');
{
  ok('11.1 Tạo lệnh giao hàng', (await goi(md, '/md', 'createShipmentOrder', [{
    shipment_no: `${TAG}-SH`, order_id: S.po, ship_mode: 'SEA',
    etd_date: '2026-12-18', eta_date: '2027-01-10', destination: 'Tokyo',
    booking_no: 'BK-1', container_no: '', notes: '', evidence_path: '',
  }])).ok === true);
  const { data: s } = await admin.from('shipments').select('id').eq('shipment_no', `${TAG}-SH`).maybeSingle();
  if (s?.id) rac.sh.push(s.id);
}

// ═══ ⑫ COMPLETED ═══════════════════════════════════════════════════════════
console.log('\n⑫ HOÀN THÀNH → KHOÁ TUYỆT ĐỐI');
{
  // 🔑 `status` VẪN đổi được dù đang có lệnh SX — ⛔ không thì PO ⛔ không bao
  // giờ đóng được. Đây đúng là điều `049` §6.3c canh.
  await admin.from('production_orders').update({ status: 'CANCELLED' }).eq('id', S.lsx ?? '');
  ok('12.1 Đóng đơn sang COMPLETED', (await goi(md, '/md', 'updatePo', [S.po,
    { total_quantity: 5200, status: 'COMPLETED', delivery_date: '2026-12-20' }, true])).ok === true);
  ok('🔴 12.2 COMPLETED ⇒ MD ⛔ không sửa được', (await goi(md, '/md', 'updatePo', [S.po,
    { total_quantity: 1, status: 'COMPLETED', delivery_date: '2026-12-20' }, true])).ok === false);
  ok('🔴 12.3 COMPLETED ⇒ MD ⛔ không huỷ được',
    (await goi(md, '/md', 'archivePo', [S.po, 'thử huỷ đơn đã hoàn thành'])).ok === false);

  const { error: eDb } = await md.sb.from('orders').update({ total_quantity: 1 }).eq('id', S.po);
  ok('🔴 12.4 HÀNG RÀO CSDL chặn đơn COMPLETED (049)', eDb?.code === '23514',
    eDb ? `${eDb.code}` : 'KHÔNG lỗi ⇒ hàng rào thật ⛔ CHƯA có');
}

// ═══ ⑬ RE-OPEN ═════════════════════════════════════════════════════════════
console.log('\n⑬ RE-OPEN — chỉ Giám đốc');
{
  ok('🔴 13.1 MD ⛔ KHÔNG mở lại được',
    (await goi(md, '/orders', 'reopenOrder', [S.po, 'MD thử mở lại đơn đã đóng'])).ok === false);
  ok('13.2 Thiếu lý do ⇒ bị chặn',
    (await goi(gd, '/orders', 'reopenOrder', [S.po, 'ngắn'])).ok === false);
  ok('🔴 13.3 GIÁM ĐỐC mở lại được',
    (await goi(gd, '/orders', 'reopenOrder', [S.po, 'Khách bổ sung 500 sp, đã có mail xác nhận'])).ok === true);
  const { data: p } = await admin.from('orders').select('status').eq('id', S.po ?? '').maybeSingle();
  ok('13.4 Về APPROVED, ⛔ không về DRAFT', p?.status === 'APPROVED');
  const { data: nk } = await admin.from('activity_log').select('changes')
    .eq('entity_type', 'ORDER').eq('entity_id', S.po ?? '').eq('action', 'APPROVE');
  ok('13.5 CÓ nhật ký APPROVE kèm lý do',
    (nk ?? []).length > 0 && JSON.stringify(nk[0].changes).includes('ly_do_mo_lai'));
}

// ═══ ⑭ ĐÓNG LẠI + LỊCH SỬ ══════════════════════════════════════════════════
console.log('\n⑭ ĐÓNG LẠI');
{
  ok('14.1 Sửa số lượng rồi đóng lại', (await goi(md, '/md', 'updatePo', [S.po,
    { total_quantity: 5500, status: 'COMPLETED', delivery_date: '2026-12-20' }, true])).ok === true);
  const { data: nk } = await admin.from('activity_log').select('changes')
    .eq('entity_type', 'ORDER').eq('entity_id', S.po ?? '').order('created_at');
  const pb = (nk ?? []).map((x) => x.changes?.__phien_ban?.to).filter((x) => typeof x === 'number');
  ok('🔴 14.2 Chuỗi phiên bản LIÊN TỤC', pb.length >= 4 && pb.every((v, i) => i === 0 || v === pb[i - 1] + 1),
    `chuỗi: ${pb.join('→')}`);
  const cuoi = (nk ?? [])[nk.length - 1]?.changes?.__anh_chup;
  ok('14.3 Ảnh chụp cuối dựng lại được toàn bộ đơn',
    Boolean(cuoi?.to?.po_number && cuoi?.to?.customer_id && cuoi?.to?.style_id));
}

// ═══ ⑮ LƯU TRỮ MỀM (052) ═══════════════════════════════════════════════════
console.log('\n⑮ LƯU TRỮ MỀM — 3 bảng có `deleted_at`');
{
  // 🔴 Phép thử QUAN TRỌNG NHẤT của `052`: PostgREST bọc PATCH trong CTE có
  // RETURNING, nên nếu lưu trữ đi bằng UPDATE thẳng thì nó BÁO LỖI dù dữ liệu
  // đã đổi. Ở đây phải thấy `ok:true` — tức RPC đã làm đúng việc.
  const rTp = await goi(md, '/md', 'archiveTechPack', [S.doc]);
  ok('🔴 15.1 Lưu trữ Tech Pack ⇒ ok (RPC, ⛔ không báo lỗi giả)',
    rTp.ok === true, JSON.stringify(rTp).slice(0, 250));

  const { data: dRaw } = await admin.from('md_documents').select('deleted_at').eq('id', S.doc ?? '').maybeSingle();
  ok('15.2 CSDL ĐÃ ghi `deleted_at`', Boolean(dRaw?.deleted_at));

  // Dòng đã lưu trữ phải BIẾN MẤT khỏi câu đọc thường của người dùng.
  const { data: mdThay } = await md.sb.from('md_documents').select('id').eq('id', S.doc ?? '');
  ok('🔴 15.3 Policy ẨN dòng đã lưu trữ khỏi phiên md', (mdThay ?? []).length === 0);

  // ⚠️ Và phải TÌM LẠI được — ⛔ không thì lưu trữ là cửa MỘT CHIỀU.
  const rDs = await goi(md, '/md', 'listDaLuuTru', ['md_documents']);
  ok('🔴 15.4 Vẫn LIỆT KÊ được dòng đã lưu trữ (⛔ không phải cửa một chiều)',
    (rDs.rows ?? []).some((x) => x.id === S.doc), JSON.stringify(rDs).slice(0, 200));

  const rKp = await goi(md, '/md', 'restoreTechPack', [S.doc]);
  ok('15.5 Khôi phục được', rKp.ok === true, JSON.stringify(rKp).slice(0, 200));
  const { data: mdThay2 } = await md.sb.from('md_documents').select('id').eq('id', S.doc ?? '');
  ok('15.6 Khôi phục xong thì HIỆN LẠI', (mdThay2 ?? []).length === 1);

  // BOM
  ok('15.7 Lưu trữ BOM', (await goi(md, '/md', 'archiveBom', [S.bom])).ok === true);
  const { data: bomThay } = await md.sb.from('style_bom').select('id').eq('id', S.bom ?? '');
  ok('15.8 BOM đã lưu trữ biến khỏi danh sách', (bomThay ?? []).length === 0);

  // 🔴 Yêu cầu NPL ĐÃ NHẬN KHO ⇒ CSDL phải TỪ CHỐI lưu trữ (luật nghiệp vụ).
  await admin.from('material_requests').update({ status: 'RECEIVED' }).eq('id', S.mr ?? '');
  const rMr = await goi(md, '/md', 'archiveMaterialRequest', [S.mr]);
  ok('🔴 15.9 Phiếu NPL ĐÃ NHẬN KHO ⇒ ⛔ KHÔNG lưu trữ được (lệch tồn kho)',
    rMr.ok === false, JSON.stringify(rMr).slice(0, 200));
  await admin.from('material_requests').update({ status: 'DRAFT' }).eq('id', S.mr ?? '');
  ok('15.10 Phiếu chưa nhận kho thì lưu trữ được',
    (await goi(md, '/md', 'archiveMaterialRequest', [S.mr])).ok === true);

  // 🔴 Chỉ mục MỘT PHẦN: số phiếu đã lưu trữ phải DÙNG LẠI được.
  const rLai = await goi(md, '/md', 'createMaterialRequest', [{
    request_no: `${TAG}-NPL`, order_id: S.po, material_name: 'Lập lại sau khi lưu trữ',
    category: 'FABRIC', quantity: 100, unit: 'm', needed_date: '2026-09-15',
    notes: '', evidence_path: '',
  }]);
  ok('🔴 15.11 Lập LẠI được số phiếu đã lưu trữ (chỉ mục MỘT PHẦN)',
    rLai.ok === true, JSON.stringify(rLai).slice(0, 200));
  const { data: mrLai } = await admin.from('material_requests').select('id')
    .eq('request_no', `${TAG}-NPL`).is('deleted_at', null);
  for (const r of mrLai ?? []) rac.mr.push(r.id);
}

// ═══ ⑯ PHÂN QUYỀN ══════════════════════════════════════════════════════════
console.log('\n⑯ PHÂN QUYỀN');
{
  const ban = {
    customer_code: `${TAG}-KH`, name: `Khách UAT ${TAG} (md002)`, brand: 'BrandX',
    buyer_group: 'GroupY', contact_person: 'Ms. A', phone: '0900000000',
    email: 'a@x.com', country: 'Nhật Bản', address: 'Tokyo', tax_code: '123',
    currency: 'USD', incoterm: 'FOB', payment_term: 'T/T 30 ngày', credit_limit: 0, notes: 'UAT',
  };
  ok('16.1 md002 (cùng vai MD) sửa được khách hàng',
    (await goi(md2, '/md', 'updateCustomer', [S.khach, ban])).ok === true);
  const { data: nk } = await admin.from('activity_log').select('actor_id')
    .eq('entity_type', 'CUSTOMER').eq('entity_id', S.khach ?? '')
    .order('created_at', { ascending: false }).limit(1);
  ok('🔴 16.2 Nhật ký ghi ĐÚNG md002 là người sửa', nk?.[0]?.actor_id === md2.user.id);

  // QA bị **middleware** chặn TRƯỚC khi action chạy ⇒ phản hồi ⛔ không mang
  // `ok`. "⛔ Không có kết quả" CŨNG là bị chặn — thậm chí chặn SỚM HƠN.
  ok('🔴 16.3 QA ⛔ KHÔNG sửa được dữ liệu MD',
    (await goi(qa, '/md', 'updateCustomer', [S.khach, ban])).ok !== true);
  const { data: qUp } = await qa.sb.from('customers').update({ name: 'QA-HACK' }).eq('id', S.khach ?? '').select('id');
  ok('🔴 16.4 RLS chặn QA ghi thẳng vào `customers`', (qUp ?? []).length === 0);
  ok('🔴 16.5 md ⛔ KHÔNG tự duyệt giá được ở tầng CSDL (SoD thật — 049)',
    ((await md.sb.from('costings').update({ status: 'APPROVED' }).eq('id', S.costing ?? '').select('id')).data ?? []).length === 0);
}

} finally {
  // ═══ DỌN ════════════════════════════════════════════════════════════════
  console.log('\nDỌN DẤU VẾT');
  const co = (a) => (a.length ? a : ['00000000-0000-0000-0000-000000000000']);
  await admin.from('order_milestones').delete().in('order_id', co(rac.orders));
  await admin.from('change_requests').delete().in('order_id', co(rac.orders));
  await admin.from('qa_audit_reports').delete().in('order_id', co(rac.orders));
  await admin.from('shipments').delete().in('id', co(rac.sh));
  await admin.from('production_orders').delete().in('id', co(rac.po));
  await admin.from('material_requests').delete().in('id', co(rac.mr));
  // ⚠️ Trigger `049` chặn cả `service_role`? ⛔ Không — trigger chặn UPDATE nội
  // dung, ⛔ không chặn DELETE. Nhưng đơn đã COMPLETED thì phải gỡ trạng thái
  // trước nếu có ràng buộc khác; ở đây DELETE thẳng là đủ.
  await admin.from('orders').delete().in('id', co(rac.orders));
  await admin.from('md_documents').delete().in('id', co(rac.docs));
  await admin.from('style_bom').delete().in('style_id', co(rac.styles));
  await admin.from('style_colorways').delete().in('style_id', co(rac.styles));
  await admin.from('style_sizes').delete().in('style_id', co(rac.styles));
  await admin.from('style_operations').delete().in('style_id', co(rac.styles));
  await admin.from('costing_items').delete().in('costing_id', co(rac.costings));
  await admin.from('costings').delete().in('id', co(rac.costings));
  await admin.from('styles').delete().in('id', co(rac.styles));
  await admin.from('inquiries').delete().in('id', co(rac.inquiries));
  await admin.from('customers').delete().in('id', co(rac.customers));
  const { data: con } = await admin.from('orders').select('po_number').ilike('po_number', `${TAG}%`);
  ok('Dọn sạch — ⛔ không còn dữ liệu UAT', (con ?? []).length === 0);
}

console.log(`\n${'='.repeat(74)}\nUAT VÒNG ĐỜI MD: ${dat} đạt · ${hong.length} hỏng`);
if (hong.length) { console.log('HỎNG:'); hong.forEach((h) => console.log(`  · ${h}`)); }
process.exit(hong.length ? 1 : 0);
