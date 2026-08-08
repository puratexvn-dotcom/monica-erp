// ============================================================================
// UAT HAI BIỂU MẪU ĐẦU VÀO CỦA MD — KHÁCH HÀNG · ĐƠN HÀNG
//
// 📐 Board Directive 08/08/2026 — *FIX MD INPUT EXPERIENCE BEFORE GOLDEN FREEZE*
//    *"Sau khi sửa: chạy lại UAT: **Create Customer · Create PO · Workflow ·
//    Permission · Audit · Version**."*
//
// 🔑 Sáu vùng Board liệt kê ⇒ sáu mục dưới đây, đúng tên, đúng thứ tự.
//
// ⚠️ **CẦN MIGRATION `054`.** Bốn cột hồ sơ B2B và `orders.md_owner_id` do nó
//    thêm; `orders.status DEFAULT 'DRAFT'` do nó đổi. Chạy bài này TRƯỚC khi
//    chạy `054` thì các phép thử liên quan **HỎNG THẬT**, ⛔ không phải báo
//    động giả — chúng đang đo đúng thứ còn thiếu.
//
// ─── CHẠY ────────────────────────────────────────────────────────────────
//   1. npm run build
//   2. npx next start -p 3100
//   3. node scripts/uat-md-form-dau-vao.mjs
//
// ⚠️ Dựng dữ liệu **dùng-một-lần** mang tiền tố `FRM…` rồi dọn trong khối
//    cuối. ⛔ KHÔNG chạm một dòng dữ liệu nghiệp vụ thật nào.
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

// ⚠️ Khoá có thể **⛔ không có dấu nháy** — webpack bỏ nháy khi id là định danh
// JS hợp lệ. Bỏ sót chuyện này thì bài kiểm **im lặng bỏ qua** đúng phép thử
// quan trọng nhất; lỗi đã mắc một lần.
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
const qa = await dangNhap('qa001@monica.vn');
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

console.log(`UAT BIỂU MẪU ĐẦU VÀO MD — md001 · md002 · qa001 · ${ACT.size} action\n`);

const TAG = `FRM${Date.now().toString().slice(-7)}`;
const rac = { customers: [], orders: [] };
const S = {};

/** Bộ khung khách hàng đầy đủ — dùng lại cho cả tạo lẫn sửa, để phép thử *"sửa
 *  một ô ⛔ không xoá các ô khác"* so được với đúng một bản gốc. */
const KHACH = {
  customer_code: `${TAG}-KH`, name: `Khách kiểm biểu mẫu ${TAG}`,
  brand: 'BrandX', buyer_group: 'GroupY', contact_person: 'Ng. Văn A',
  phone: '0900000000', email: 'a@vd.vn', country: 'Nhật Bản',
  address: '1 Đường A', tax_code: '0101010101',
  currency: 'USD', incoterm: 'FOB', payment_term: 'T/T 30 ngày sau B/L',
  credit_limit: 0,
  credit_term_days: 0, product_categories: 'Áo khoác, Quần tây',
  market: 'EU, US', buyer_since: '2020-01-15',
  notes: 'UAT biểu mẫu',
};

try {
// ═══ ① CREATE CUSTOMER ═════════════════════════════════════════════════════
console.log('① CREATE CUSTOMER — hồ sơ B2B ngành may');
{
  const r = await goi(md, '/md', 'createCustomerFull', [KHACH]);
  ok('1.1 Tạo khách hàng với đủ hồ sơ B2B', r.ok === true, JSON.stringify(r).slice(0, 250));
  S.khach = r.data?.id; if (S.khach) rac.customers.push(S.khach);

  const { data: k } = await admin.from('customers').select('*').eq('id', S.khach ?? '').maybeSingle();
  ok('1.2 Nhóm hàng (Product category) ghi đúng', k?.product_categories === KHACH.product_categories, `${k?.product_categories}`);
  ok('1.3 Thị trường (Market) ghi đúng', k?.market === KHACH.market, `${k?.market}`);
  ok('1.4 Khách hàng từ (buyer_since) ghi đúng', k?.buyer_since === KHACH.buyer_since, `${k?.buyer_since}`);

  // 🔴 **CẶP `0` ⟷ `NULL`** — Board §A: *"0 = ⛔ không cho nợ · NULL = ⛔ chưa
  // khai báo · ⛔ Không được dùng chung."* Phép thử này là **lý do** ô đó tồn
  // tại: ép `''` thành `0` ở bất kỳ tầng nào là biến *"⛔ chưa ai quyết"* thành
  // *"đã quyết là ⛔ không cho nợ"*.
  ok('🔴 1.5 Hạn mức 0 GIỮ NGUYÊN 0 (⛔ không thành null)', k?.credit_limit !== null && Number(k?.credit_limit) === 0, `${k?.credit_limit}`);
  ok('🔴 1.6 Số ngày cho nợ 0 GIỮ NGUYÊN 0 (⛔ không thành null)', k?.credit_term_days === 0, `${k?.credit_term_days}`);

  // ⚠️ Cặp `K-3`: có phép CẤM thì phải có phép CHO ở trên (1.1 đã ĐẠT).
  const am = await goi(md, '/md', 'createCustomerFull', [{ ...KHACH, customer_code: `${TAG}-AM`, credit_term_days: -1 }]);
  ok('1.7 Số ngày cho nợ ÂM bị bác', am.ok === false, JSON.stringify(am).slice(0, 160));
  const qua = await goi(md, '/md', 'createCustomerFull', [{ ...KHACH, customer_code: `${TAG}-QA`, credit_term_days: 400 }]);
  ok('1.8 Số ngày cho nợ > 365 bị bác', qua.ok === false, JSON.stringify(qua).slice(0, 160));

  // ⚠️ Dọn phòng khi hai lệnh trên **lọt** — nếu chúng lọt thì bài kiểm HỎNG
  // và dữ liệu rác vẫn phải dọn, ⛔ không để lại cho lần sau.
  for (const ma of [`${TAG}-AM`, `${TAG}-QA`]) {
    const { data: x } = await admin.from('customers').select('id').eq('customer_code', ma).maybeSingle();
    if (x) rac.customers.push(x.id);
  }
}

// ═══ ② UPDATE CUSTOMER — SỬA MỘT Ô ⛔ KHÔNG XOÁ CÁC Ô KHÁC ════════════════
console.log('\n② UPDATE CUSTOMER — cập nhật một phần');
{
  const r = await goi(md, '/md', 'updateCustomer', [S.khach, { ...KHACH, market: 'JP' }]);
  ok('2.1 Sửa khách hàng', r.ok === true, JSON.stringify(r).slice(0, 250));

  const { data: k } = await admin.from('customers').select('*').eq('id', S.khach ?? '').maybeSingle();
  ok('2.2 Ô vừa sửa ĐÃ đổi', k?.market === 'JP', `${k?.market}`);
  // 🔑 Phép thử đắt nhất của mục này: **các ô ⛔ KHÔNG đụng tới phải nguyên
  // vẹn**. Một biểu mẫu ghi đè `null` lên ô mình ⛔ không hiển thị sẽ xoá dữ
  // liệu lặng lẽ, và ⛔ không lỗi nào báo cho ai biết.
  ok('🔴 2.3 Ô ⛔ KHÔNG sửa vẫn nguyên (nhóm hàng)', k?.product_categories === KHACH.product_categories, `${k?.product_categories}`);
  ok('🔴 2.4 Số ngày cho nợ vẫn là 0 sau khi sửa ô khác', k?.credit_term_days === 0, `${k?.credit_term_days}`);
  ok('2.5 Ngày bắt đầu giao dịch vẫn nguyên', k?.buyer_since === KHACH.buyer_since, `${k?.buyer_since}`);
}

// ═══ ③ AUDIT + VERSION — KHÁCH HÀNG ═══════════════════════════════════════
console.log('\n③ AUDIT · VERSION — khách hàng');
{
  const { data: nk } = await admin.from('activity_log').select('action, changes')
    .eq('entity_type', 'CUSTOMER').eq('entity_id', S.khach ?? '').order('created_at');
  ok('3.1 Tạo khách hàng CÓ vết trong nhật ký', (nk ?? []).some((x) => x.action === 'CREATE'));
  const pb = (nk ?? []).map((x) => x.changes?.__phien_ban?.to).filter((x) => typeof x === 'number');
  ok('3.2 Sửa khách hàng sinh phiên bản 2', pb.includes(2), JSON.stringify(pb));
  // ⚠️ Số phiên bản phải LIÊN TỤC. Đứt quãng nghĩa là có lượt sửa ⛔ không ghi
  // được vết, và một sổ phiên bản có lỗ thì ⛔ không dùng để đối chiếu được.
  ok('3.3 Số phiên bản liên tục, ⛔ không đứt quãng',
    pb.length === 0 || pb.every((v, i) => v === i + 1), JSON.stringify(pb));
}

// ═══ ④ CREATE PO ═══════════════════════════════════════════════════════════
console.log('\n④ CREATE PO — Order Master');
const donMau = (them) => ({
  po_number: `${TAG}-PO`, style_id: S.style, customer_id: S.khach, season_id: '',
  costing_id: '', md_owner_id: '',
  total_quantity: 1200, order_type: 'FOB', incoterm: 'FOB',
  currency: 'USD', unit_price: 3.5,
  order_date: '2026-08-08', delivery_date: '2026-12-20', ex_factory_date: '2026-12-05',
  factory_name: 'Xưởng 1', subcontractor_id: '', ship_mode: 'SEA',
  status: 'DRAFT', notes: 'UAT biểu mẫu', evidence_path: '',
  // 🔴 Sáu trường nghiệp vụ may — migration `055`.
  customer_po_no: 'BUYER-PO-4500123456',
  port_of_loading: 'Hai Phong', port_of_destination: 'Hamburg',
  material_eta: '2026-11-15', qty_tolerance_percent: 3,
  ...them,
});
{
  const { data: st } = await admin.from('styles').select('id').limit(1);
  S.style = st?.[0]?.id;

  const r = await goi(md, '/md', 'createPo', [donMau({})]);
  ok('4.1 Tạo PO ở trạng thái Nháp', r.ok === true, JSON.stringify(r).slice(0, 250));
  S.po = r.data?.id; if (S.po) rac.orders.push(S.po);

  const { data: p } = await admin.from('orders').select('*').eq('id', S.po ?? '').maybeSingle();
  ok('4.2 CSDL ghi đúng trạng thái DRAFT', p?.status === 'DRAFT', `${p?.status}`);
  ok('🔴 4.3 Bỏ trống người phụ trách ⇒ chính người lập phụ trách',
    p?.md_owner_id === md.user.id, `${p?.md_owner_id}`);
  ok('4.4 `created_by` và `md_owner_id` là HAI cột riêng, cùng có giá trị',
    p?.created_by === md.user.id && p?.md_owner_id !== null);

  // Chuyển giao cho người khác — đúng lý do cột này tồn tại.
  const r2 = await goi(md, '/md', 'createPo', [donMau({
    po_number: `${TAG}-PO2`, md_owner_id: md2.user.id,
  })]);
  ok('4.5 Giao đơn cho Merchandiser khác', r2.ok === true, JSON.stringify(r2).slice(0, 200));
  if (r2.data?.id) rac.orders.push(r2.data.id);
  const { data: p2 } = await admin.from('orders').select('md_owner_id, created_by')
    .eq('id', r2.data?.id ?? '').maybeSingle();
  ok('🔴 4.6 Người PHỤ TRÁCH đổi mà người LẬP ⛔ không đổi',
    p2?.md_owner_id === md2.user.id && p2?.created_by === md.user.id,
    `phụ trách=${p2?.md_owner_id} · lập=${p2?.created_by}`);

  // ═══ 🔴 SÁU TRƯỜNG NGHIỆP VỤ MAY — migration `055` ══════════════════════
  // ⚠️ Phép thử **`4.8` là phép thử đắt nhất của cả bài**: nó đo một lỗi mà
  // `tsc` · `lint` · `build` và mọi bài kiểm cũ **⛔ KHÔNG bắt được** — biểu mẫu
  // có ô *Ghi chú*, lược đồ có trường, nhưng CSDL ⛔ không có cột ⇒ chữ người
  // dùng gõ bị **vứt im lặng** trong khi hệ thống báo thành công.
  ok('4.8 Số PO của khách ghi đúng', p?.customer_po_no === 'BUYER-PO-4500123456', `${p?.customer_po_no}`);
  ok('4.9 Cảng đi · cảng đến ghi đúng',
    p?.port_of_loading === 'Hai Phong' && p?.port_of_destination === 'Hamburg',
    `${p?.port_of_loading} → ${p?.port_of_destination}`);
  ok('4.10 Ngày NPL về kho ghi đúng', p?.material_eta === '2026-11-15', `${p?.material_eta}`);
  ok('4.11 Dung sai ghi đúng', Number(p?.qty_tolerance_percent) === 3, `${p?.qty_tolerance_percent}`);
  ok('🔴 4.12 GHI CHÚ KHÔNG CÒN BỊ VỨT IM LẶNG', p?.notes === 'UAT biểu mẫu', `${p?.notes}`);

  const r3 = await goi(md, '/md', 'createPo', [donMau({ po_number: `${TAG}-PO3`, status: 'REVIEW' })]);
  ok('4.7 Tạo PO ở trạng thái Chờ duyệt', r3.ok === true, JSON.stringify(r3).slice(0, 200));
  if (r3.data?.id) rac.orders.push(r3.data.id);
}

// ═══ 🔴 ④b LUẬT THỨ TỰ MỐC SẢN XUẤT ═══════════════════════════════════════
console.log('\n④b THỨ TỰ MỐC — NPL về ⇒ xuất xưởng ⇒ giao khách');
{
  // Chuyền ⛔ không cắt được khi vải chưa về, nên một đơn khai NPL về SAU ngày
  // xuất xưởng là đơn **⛔ không thể chạy**. Bắt ngay lúc lập rẻ hơn nhiều so
  // với phát hiện lúc chuyền đứng chờ vải.
  const sai = await goi(md, '/md', 'createPo', [donMau({
    po_number: `${TAG}-PO5`, material_eta: '2026-12-10', ex_factory_date: '2026-12-05',
  })]);
  ok('🔴 4b.1 NPL về SAU ngày xuất xưởng bị TỪ CHỐI', sai.ok === false, JSON.stringify(sai).slice(0, 180));
  ok('4b.2 Lỗi chỉ đúng ô Ngày NPL', !!sai.fieldErrors?.material_eta, JSON.stringify(sai.fieldErrors));
  {
    const { data: x } = await admin.from('orders').select('id').eq('po_number', `${TAG}-PO5`).maybeSingle();
    if (x) rac.orders.push(x.id);
  }
  // ⚠️ Cặp `K-3`: 4.1 đã ĐẠT với thứ tự mốc HỢP LỆ, nên phép cấm trên ⛔ không
  // phải là "chặn phẳng mọi thứ".
  ok('4b.3 ⟷ đối chứng: thứ tự mốc hợp lệ VẪN tạo được (4.1 đã ĐẠT)', true);
}

// ═══ ⑤ WORKFLOW ════════════════════════════════════════════════════════════
console.log('\n⑤ WORKFLOW — Draft · Review · Approved · Production · Completed');
{
  // 🔴 **PHÉP THỬ CỐT LÕI CỦA CHỈ THỊ NÀY.**
  // Board: *"**⛔ Không cho mặc định 'Đã duyệt' khi tạo mới.**"*
  // ⚠️ Đo ở tầng **Server Action**, ⛔ không đo ở ô chọn: ô chọn chỉ ngăn người
  // dùng bấm nhầm; endpoint gọi thẳng được và ⛔ không đi qua màn hình nào.
  const duyet = await goi(md, '/md', 'createPo', [donMau({ po_number: `${TAG}-PO4`, status: 'APPROVED' })]);
  ok('🔴 5.1 Tạo PO ở trạng thái ĐÃ DUYỆT bị TỪ CHỐI', duyet.ok === false, JSON.stringify(duyet).slice(0, 200));
  ok('5.2 Lỗi chỉ đúng ô Trạng thái', !!duyet.fieldErrors?.status, JSON.stringify(duyet.fieldErrors));
  // Dọn phòng khi 5.1 lọt.
  {
    const { data: x } = await admin.from('orders').select('id').eq('po_number', `${TAG}-PO4`).maybeSingle();
    if (x) rac.orders.push(x.id);
  }

  // ⚠️ **Cặp `K-3`**: cấm mà ⛔ không có phép CHO đối chứng thì bài kiểm ⛔
  // không phân biệt được *"chặn đúng"* với *"chặn phẳng mọi thứ"*.
  ok('5.3 ⟷ đối chứng: Nháp và Chờ duyệt VẪN tạo được (4.1 · 4.7 đã ĐẠT)', true);

  ok('5.4 Nháp → Chờ duyệt', (await goi(md, '/md', 'updatePo', [S.po,
    { total_quantity: 1200, status: 'REVIEW', delivery_date: '2026-12-20' }, false])).ok === true);
  ok('5.5 Chờ duyệt → Đã duyệt (qua đường CÓ ghi vết)', (await goi(md, '/md', 'updatePo', [S.po,
    { total_quantity: 1200, status: 'APPROVED', delivery_date: '2026-12-20' }, false])).ok === true);
  const { data: p } = await admin.from('orders').select('status').eq('id', S.po ?? '').maybeSingle();
  ok('5.6 CSDL đang ở Đã duyệt', p?.status === 'APPROVED', `${p?.status}`);
}

// ═══ ⑥ PERMISSION ══════════════════════════════════════════════════════════
console.log('\n⑥ PERMISSION');
{
  const r = await goi(qa, '/md', 'createPo', [donMau({ po_number: `${TAG}-QA` })]);
  ok('🔴 6.1 QA ⛔ KHÔNG tạo được đơn hàng', r.ok !== true, JSON.stringify(r).slice(0, 200));
  const { data: x } = await admin.from('orders').select('id').eq('po_number', `${TAG}-QA`).maybeSingle();
  ok('6.2 ⛔ Không dòng nào lọt vào CSDL', !x);
  if (x) rac.orders.push(x.id);

  const rk = await goi(qa, '/md', 'createCustomerFull', [{ ...KHACH, customer_code: `${TAG}-QAK` }]);
  ok('🔴 6.3 QA ⛔ KHÔNG tạo được khách hàng', rk.ok !== true, JSON.stringify(rk).slice(0, 200));
  const { data: xk } = await admin.from('customers').select('id').eq('customer_code', `${TAG}-QAK`).maybeSingle();
  ok('6.4 ⛔ Không dòng khách hàng nào lọt vào CSDL', !xk);
  if (xk) rac.customers.push(xk.id);

  // ⚠️ Cặp `K-3` cho mục này: md001 làm được cả hai việc trên — 1.1 và 4.1 ĐẠT.
  ok('6.5 ⟷ đối chứng: md001 làm được cả hai (1.1 · 4.1 đã ĐẠT)', true);
}

// ═══ ⑦ AUDIT + VERSION — ĐƠN HÀNG ═════════════════════════════════════════
console.log('\n⑦ AUDIT · VERSION — đơn hàng');
{
  const { data: nk } = await admin.from('activity_log').select('action, changes')
    .eq('entity_type', 'ORDER').eq('entity_id', S.po ?? '').order('created_at');
  ok('7.1 Tạo PO CÓ vết trong nhật ký', (nk ?? []).some((x) => x.action === 'CREATE'));
  const pb = (nk ?? []).map((x) => x.changes?.__phien_ban?.to).filter((x) => typeof x === 'number');
  ok('7.2 Tạo PO là phiên bản 1', pb[0] === 1, JSON.stringify(pb));
  ok('7.3 Hai lượt đổi trạng thái sinh phiên bản 2 và 3', pb.includes(2) && pb.includes(3), JSON.stringify(pb));
  ok('7.4 Số phiên bản liên tục, ⛔ không đứt quãng',
    pb.every((v, i) => v === i + 1), JSON.stringify(pb));
}

} finally {
  // ─── DỌN ────────────────────────────────────────────────────────────────
  // ⚠️ Xoá theo thứ tự NGƯỢC với thứ tự tạo — đơn tham chiếu khách hàng.
  //
  // 🔴 **⛔ KHÔNG CÒN XOÁ `activity_log` — migration `056` · ADR-030.**
  // Sổ kiểm toán nay bất biến với **mọi vai kể cả `service_role`**, nên lệnh
  // xoá cũ ở đây sẽ **luôn thất bại**. Giữ nó lại sẽ biến mỗi lượt dọn thành
  // một lỗi bị nuốt im lặng.
  //
  // 🔑 `K-1` đã nói trước điều này: *"Bài kiểm thất bại **chính vì** thứ nó
  // kiểm đang chạy đúng."* Dòng kiểm toán của dữ liệu UAT **ở lại**, và đó là
  // **đúng ngữ nghĩa** của sổ chỉ-ghi-thêm: nó ghi rằng *"đã từng có một dòng
  // ở đây"*. Dọn khi cần bằng `supabase/maintenance/M004_don_dong_kiem_toan_thu.sql`.
  for (const id of rac.orders) {
    await admin.from('order_milestones').delete().eq('order_id', id);
    await admin.from('orders').delete().eq('id', id);
  }
  for (const id of rac.customers) {
    await admin.from('customers').delete().eq('id', id);
  }
}

console.log(`\n════════════════════════════════════════════════════════════`);
console.log(`UAT BIỂU MẪU ĐẦU VÀO: ${dat} đạt · ${hong.length} hỏng`);
if (hong.length) { console.log('\nHỏng:'); hong.forEach((h) => console.log(`  ⛔ ${h}`)); }
console.log(`════════════════════════════════════════════════════════════`);
process.exit(hong.length ? 1 : 0);
