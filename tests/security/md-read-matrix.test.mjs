// ============================================================================
// MA TRẬN ĐỌC — 14 VAI × 5 ĐỐI TƯỢNG · PHÁN QUYẾT `VR-004` + `VR-005`
//
// Board Directive 05/08/2026: *"Chạy lại toàn bộ các bài kiểm tra READ trên CSDL
// thật… Báo cáo kết quả theo từng bảng và từng vai trò (PASS/FAIL), kèm bằng
// chứng kiểm thử. Không bỏ sót bất kỳ bảng nào liên quan đến VR-004 và VR-005."*
//
// ─── VÌ SAO BÀI KIỂM NÀY PHẢI TỰ GIEO DỮ LIỆU ─────────────────────────────
//
// 22 bảng Merchandising đang **rỗng**. Trên bảng rỗng, "RLS khoanh đúng phạm vi"
// và "policy chặn phẳng tất cả" cho ra **cùng một số 0**. Hiến pháp **V.1** cấm
// kết luận ở đó, và bài kiểm `md-internal-scope` vẫn đang ghi `⚪ chưa đo được`
// cho đúng bốn bảng mà Board vừa phán quyết.
//
// Báo cáo "toàn bộ READ đều PASS" dựa trên bảng rỗng sẽ là **đúng loại kết luận
// sai mà V.1 được viết ra để chặn** — nó xanh kể cả khi policy chặn sạch mọi
// vai, kể cả khi policy mở toang cho mọi vai.
//
// Nên bài kiểm này **gieo dữ liệu dùng-một-lần** bằng `service_role`, đo, rồi
// dọn sạch trong `finally`. Nhờ vậy nó cho kết luận thật **ngay hôm nay**, không
// phải chờ Cổng C.
//
// ─── HAI VẾ, LUÔN ĐI THÀNH CẶP — QUY TẮC K-3 ──────────────────────────────
//
// Mỗi đối tượng có ít nhất MỘT vai **chờ thấy > 0**. Bài kiểm chỉ gồm vai chờ-0
// sẽ xanh cả khi policy chặn phẳng — mà chặn phẳng là HỎNG, không phải ĐẠT.
//
// ─── HAI TẦNG, ĐÚNG YÊU CẦU BOARD ─────────────────────────────────────────
//
//   ① PostgREST — `SELECT` trực tiếp bằng phiên đăng nhập thật. Đây là tầng
//      người dùng gọi thẳng được, không đi qua mã ứng dụng lần nào.
//   ② Ứng dụng  — `MODULE_ACCESS` trong `lib/rbac.ts` quyết định vai nào vào
//      được `/md`. Đọc tĩnh từ mã nguồn, không đoán.
//
// ⚠️ Tầng ② KHÔNG thay được tầng ①: ai có token hợp lệ đều gọi PostgREST thẳng.
// Nó chỉ trả lời "giao diện có mời người dùng bấm vào chỗ chắc chắn bị từ chối
// hay không".
// ============================================================================
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requireDb, scoreboard, sessionFactory, ROOT } from '../_lib/harness.mjs';

const { env, admin, anonClient, createClient } = requireDb();
const s = scoreboard('MA TRẬN ĐỌC — VR-004 · VR-005');
const phien = sessionFactory(admin, createClient, env, 'readmx');

const VAI = [
  'superadmin', 'giamdoc', 'md', 'qa', 'totruongmay', 'totruongcat',
  'hoanthanh', 'kho', 'ketoan', 'khotruong', 'thukho', 'ketoanvattu',
  'subcon', 'buyer',
];

// ─── MA TRẬN KỲ VỌNG — nguồn: phán quyết Board 05/08/2026 ──────────────────
const T1_DOC   = ['superadmin', 'giamdoc', 'md'];
const KHO      = ['kho', 'khotruong', 'thukho', 'ketoanvattu'];
const DOI_TUONG = [
  { ten: 'costings',            duoc: T1_DOC,               nguon: 'VR-005 · Draft Costing ⛔' },
  { ten: 'costing_items',       duoc: T1_DOC,               nguon: 'VR-005 · Cost Breakdown ⛔' },
  { ten: 'inquiries',           duoc: T1_DOC,               nguon: 'VR-005 · dữ liệu thương lượng ⛔' },
  { ten: 'style_bom',           duoc: [...T1_DOC, ...KHO],  nguon: 'VR-004 · kho ĐỌC để cấp phát NPL' },
  { ten: 'v_costing_approved',  duoc: [...T1_DOC, 'ketoan'], nguon: 'VR-005 · kế toán đọc PHÉP CHIẾU' },
];

const rac = [];   // { bang, id } — dọn ngược thứ tự trong `finally`
const gieo = async (bang, hang) => {
  const { data, error } = await admin.from(bang).insert(hang).select('id').single();
  if (error) throw new Error(`gieo ${bang}: ${error.message}`);
  rac.unshift({ bang, id: data.id });
  return data.id;
};

/** Số dòng vai này ĐỌC được. `null` = bị chặn ở tầng GRANT (lỗi 42501). */
const dem = async (client, doiTuong) => {
  const { count, error } = await client
    .from(doiTuong).select('*', { count: 'exact', head: true });
  return error ? null : (count ?? 0);
};

try {
  // ══ GIEO ─────────────────────────────────────────────────────────────────
  // Dùng khách hàng có sẵn của dữ liệu nền; KHÔNG tạo khách mới, và KHÔNG sửa
  // dòng nghiệp vụ nào đang có.
  // ⚠️ `customers` KHÔNG có cột `deleted_at` — lọc theo cột đó làm cả câu truy
  // vấn lỗi, và `maybeSingle()` trả `null` y hệt lúc bảng rỗng. Bài kiểm sẽ
  // "bỏ qua" trong khi dữ liệu nền vẫn còn nguyên 5 khách hàng.
  const { data: khach } = await admin.from('customers')
    .select('id').eq('is_active', true).limit(1).maybeSingle();
  if (!khach) {
    console.log('⚪ BỎ QUA — chưa có khách hàng nền. Chạy S001 rồi chạy lại.');
    console.log('   ⚠️ Bỏ qua KHÔNG phải là đạt (Hiến pháp V.1).');
    process.exit(0);
  }

  const ma = randomUUID().slice(0, 8);
  const styleId = await gieo('styles', {
    style_no: `ZZRD-${ma}`, style_name: 'ZZ read-matrix', customer_id: khach.id,
  });
  await gieo('style_bom', {
    style_id: styleId, item_name: 'ZZ vải chính', category: 'FABRIC',
    unit: 'M', consumption_per_pcs: 1.5, wastage_percent: 3,
  });
  await gieo('inquiries', {
    inquiry_no: `ZZRD-INQ-${ma}`, customer_id: khach.id,
    product_name: 'ZZ read-matrix', order_type: 'FOB',
  });
  // ⚠️ `status = 'APPROVED'` là BẮT BUỘC: `v_costing_approved` tự mang bộ lọc
  // đó, nên một dòng DRAFT sẽ làm mọi vai thấy 0 và bài kiểm báo đỏ oan.
  const costingId = await gieo('costings', {
    costing_no: `ZZRD-CST-${ma}`, customer_id: khach.id, style_id: styleId,
    order_type: 'FOB', currency: 'USD', quantity: 100,
    target_price: 9.5, quoted_price: 10.25, margin_percent: 12.5,
    status: 'APPROVED',
  });
  await gieo('costing_items', {
    costing_id: costingId, category: 'FABRIC', item_name: 'ZZ vải chính',
    unit: 'M', consumption: 1.5, unit_price: 3.2,
  });
  console.log(`Đã gieo 5 dòng dùng-một-lần (mã ${ma}). Dọn sạch ở cuối.\n`);

  // ══ ĐĂNG NHẬP 14 VAI ─────────────────────────────────────────────────────
  const phienVai = {};
  for (const v of VAI) phienVai[v] = (await phien.tao(v, v)).client;
  const anon = anonClient();

  // ══ ① POSTGREST — SELECT TRỰC TIẾP ───────────────────────────────────────
  console.log('① POSTGREST — SELECT trực tiếp bằng phiên đăng nhập thật');
  for (const dt of DOI_TUONG) {
    console.log(`\n  ── ${dt.ten}  (${dt.nguon})`);

    // Vế KHẲNG ĐỊNH trước — thiếu nó thì policy chặn phẳng cũng xanh (K-3).
    for (const v of dt.duoc) {
      const n = await dem(phienVai[v], dt.ten);
      s.ok(`⭐ ${dt.ten} · ${v} ĐỌC ĐƯỢC (${n})`, n !== null && n > 0,
        n === null ? 'bị chặn ở tầng GRANT' : `thấy ${n} dòng, chờ > 0`);
    }
    // Vế PHỦ ĐỊNH.
    for (const v of VAI.filter((x) => !dt.duoc.includes(x))) {
      const n = await dem(phienVai[v], dt.ten);
      s.ok(`${dt.ten} · ${v} BỊ CHẶN`, n === null || n === 0, `ĐỌC ĐƯỢC ${n} dòng`);
    }
    const nAnon = await dem(anon, dt.ten);
    s.ok(`${dt.ten} · anon BỊ CHẶN`, nAnon === null || nAnon === 0, `ĐỌC ĐƯỢC ${nAnon}`);
  }

  // ══ ② PHÉP CHIẾU KHÔNG ĐƯỢC RÒ CỘT ───────────────────────────────────────
  // `VR-005` cấm kế toán thấy dữ liệu thương lượng. Đếm dòng không chứng minh
  // được điều đó — phải soi CỘT. Năm cột dưới đây bị bỏ khỏi view CÓ CHỦ Ý.
  console.log('\n② PHÉP CHIẾU — 5 cột thương lượng phải KHÔNG tồn tại');
  const { data: hangKt } = await phienVai.ketoan
    .from('v_costing_approved').select('*').limit(1).maybeSingle();
  if (!hangKt) s.chuaDo('cột của v_costing_approved', 'kế toán không đọc được dòng nào');
  else {
    for (const cot of ['target_price', 'notes', 'reject_reason', 'inquiry_id', 'created_by'])
      s.ok(`⭐ v_costing_approved KHÔNG có cột \`${cot}\``,
        !(cot in hangKt), 'CỘT BỊ RÒ RA PHÉP CHIẾU');
    s.ok('⭐ ...nhưng VẪN có `quoted_price` và `margin_percent`',
      'quoted_price' in hangKt && 'margin_percent' in hangKt,
      'thiếu cột Board CHO PHÉP xem — chặn quá tay');
  }

  // ══ ③ PHÉP CHIẾU CHỈ LỘ DÒNG ĐÃ DUYỆT ────────────────────────────────────
  console.log('\n③ PHÉP CHIẾU — chỉ lộ dòng status = APPROVED');
  const draftId = await gieo('costings', {
    costing_no: `ZZRD-DRAFT-${ma}`, customer_id: khach.id, style_id: styleId,
    order_type: 'FOB', quoted_price: 99.99, status: 'DRAFT',
  });
  const { data: dsKt } = await phienVai.ketoan.from('v_costing_approved').select('id');
  s.ok('⭐ Kế toán KHÔNG thấy chiết tính DRAFT',
    !(dsKt ?? []).some((r) => r.id === draftId), 'Draft Costing bị lộ');
  s.ok('⭐ ...nhưng VẪN thấy bản APPROVED (không chặn quá tay)',
    (dsKt ?? []).some((r) => r.id === costingId));

  // ══ ④ TẦNG ỨNG DỤNG — MODULE_ACCESS ──────────────────────────────────────
  console.log('\n④ TẦNG ỨNG DỤNG — lib/rbac.ts · MODULE_ACCESS');
  const rbac = readFileSync(resolve(ROOT, 'lib/rbac.ts'), 'utf8');
  const khoiMA = rbac.slice(rbac.indexOf('MODULE_ACCESS'));
  const vaoDuocMd = (v) => {
    const m = khoiMA.match(new RegExp(`\\n\\s*${v}:\\s*\\[([^\\]]*)\\]`));
    return !!m && (m[1].includes("'*'") || m[1].includes("'/md'"));
  };
  for (const v of ['qa', 'totruongmay', 'kho', 'ketoan', 'subcon', 'buyer'])
    s.ok(`${v} KHÔNG có /md trong MODULE_ACCESS`, !vaoDuocMd(v), 'vào được /md');
  s.ok('⭐ md CÓ /md (đối chứng — không chặn quá tay)', vaoDuocMd('md'));

  for (const v of VAI) await phienVai[v].auth.signOut();
} catch (e) {
  console.error('\n⛔ NGOẠI LỆ: ' + e.message);
  s.ok('Bài kiểm chạy trọn vẹn', false, e.message);
} finally {
  // Dọn NGƯỢC thứ tự gieo: con trước, cha sau, tránh vướng khoá ngoại.
  for (const { bang, id } of rac) await admin.from(bang).delete().eq('id', id);
  await phien.don();
  console.log(`\nĐã dọn: ${rac.length} dòng gieo tạm + 14 tài khoản tạm.`);
}

process.exit(s.ketThuc() ? 1 : 0);
