// ============================================================================
// MA TRẬN GHI — 14 VAI × 5 BẢNG · UPDATE Verification
//
// Board Directive 05/08/2026: *"UPDATE Verification… báo PASS/FAIL, bằng chứng
// đo, trạng thái hệ thống khi đo, migration nền khi đo."*
//
// ─── VÌ SAO CẦN BÀI RIÊNG CHO `UPDATE` ────────────────────────────────────
//
// `md-read-matrix` đo quyền ĐỌC. `md-internal-scope` đo quyền `DELETE`/`TRUNCATE`
// ở **tầng GRANT**. Không bài nào đo `UPDATE` **theo vai** — mà `042` tách policy
// thành `_read` / `_insert` / `_update` chính là để ba quyền đó khác nhau.
//
// Một vai đọc được nhưng không được sửa là thiết kế; nếu nó sửa được thì cả
// tầng phân quyền ghi của `042` chỉ là trang trí. Chưa ai đo điều đó.
//
// ─── K-2 · KHÔNG ĐO QUYỀN GHI BẰNG CÁCH GHI BỪA ──────────────────────────
//
// Mỗi phép thử sửa **một cột vô hại** trên **dòng do chính bài kiểm gieo ra**,
// rồi đọc lại bằng `service_role` để biết sự thật. Không đụng dòng nghiệp vụ
// nào đang có.
//
// ─── K-3 · MỖI BẢNG PHẢI CÓ MỘT VAI GHI ĐƯỢC ─────────────────────────────
//
// Thiếu vế khẳng định thì một policy chặn phẳng cũng xanh — mà chặn phẳng đúng
// là lỗi vừa tìm thấy ở `costings` (`042` chặn luôn cả phép duyệt).
// ============================================================================
import { randomUUID } from 'node:crypto';
import { requireDb, scoreboard, sessionFactory, boiCanh } from '../_lib/harness.mjs';

const { env, admin, anonClient, createClient } = requireDb();
const s = scoreboard('MA TRẬN GHI — UPDATE Verification');
const phien = sessionFactory(admin, createClient, env, 'updmx');

const VAI = [
  'superadmin', 'giamdoc', 'md', 'qa', 'totruongmay', 'totruongcat',
  'hoanthanh', 'kho', 'ketoan', 'khotruong', 'thukho', 'ketoanvattu',
  'subcon', 'buyer',
];
const MD_GHI = ['superadmin', 'md'];
const KHO_GHI = ['superadmin', 'md', 'kho', 'khotruong', 'ketoanvattu'];

const rac = [];
const gieo = async (bang, hang) => {
  const { data, error } = await admin.from(bang).insert(hang).select('id').single();
  if (error) throw new Error(`gieo ${bang}: ${error.message}`);
  rac.unshift({ bang, id: data.id });
  return data.id;
};

try {
  const { data: khach } = await admin.from('customers')
    .select('id').eq('is_active', true).limit(1).maybeSingle();
  if (!khach) {
    console.log('⚪ BỎ QUA — chưa có khách hàng nền. Chạy S001 rồi chạy lại.');
    console.log('   ⚠️ Bỏ qua KHÔNG phải là đạt (Hiến pháp V.1).');
    process.exit(0);
  }

  await boiCanh(admin, { bang: ['costings', 'costing_items', 'inquiries', 'style_bom', 'seasons'] });

  const ma = randomUUID().slice(0, 8);
  const styleId = await gieo('styles', {
    style_no: `ZZUP-${ma}`, style_name: 'ZZ update-matrix', customer_id: khach.id,
  });
  // ⚠️ `costings` gieo ở `DRAFT`: policy `costings_no_edit_after_approve` khoá
  // dòng đã duyệt với MỌI vai, nên gieo `APPROVED` sẽ đo nhầm — cả 14 vai đều
  // hỏng và ta không phân biệt được "chặn theo vai" với "chặn theo trạng thái".
  const costingId = await gieo('costings', {
    costing_no: `ZZUP-CST-${ma}`, customer_id: khach.id, style_id: styleId,
    order_type: 'FOB', quoted_price: 10, status: 'DRAFT',
  });

  const BANG = [
    { ten: 'costings', id: costingId, cot: 'quoted_price', cu: 10, moi: 11,
      duoc: MD_GHI, nguon: 'T1 · ADR-018 §5.1' },
    { ten: 'costing_items', cot: 'unit_price', cu: 2, moi: 5,
      id: await gieo('costing_items', { costing_id: costingId, category: 'FABRIC',
        item_name: 'ZZ', unit: 'M', consumption: 1, unit_price: 2 }),
      duoc: MD_GHI, nguon: 'T1 · Cost Breakdown' },
    { ten: 'inquiries', cot: 'expected_qty', cu: 100, moi: 200,
      id: await gieo('inquiries', { inquiry_no: `ZZUP-INQ-${ma}`,
        customer_id: khach.id, product_name: 'ZZ', order_type: 'FOB', expected_qty: 100 }),
      duoc: MD_GHI, nguon: 'T1 · dữ liệu thương lượng' },
    { ten: 'style_bom', cot: 'wastage_percent', cu: 3, moi: 7,
      id: await gieo('style_bom', { style_id: styleId, item_name: 'ZZ', category: 'FABRIC',
        unit: 'M', consumption_per_pcs: 1.5, wastage_percent: 3 }),
      duoc: MD_GHI, nguon: '🔑 VR-004 · kho ĐỌC nhưng KHÔNG GHI' },
    { ten: 'seasons', cot: 'name', cu: null, moi: 'ZZ đã sửa',
      id: await gieo('seasons', { code: `ZZUP-SS-${ma}`, name: 'ZZ mùa' }),
      duoc: MD_GHI, nguon: 'T3 · dữ liệu chủ' },
  ];

  const phienVai = {};
  for (const v of VAI) phienVai[v] = (await phien.tao(v, v)).client;
  const anon = anonClient();

  for (const b of BANG) {
    console.log(`\n── ${b.ten}.${b.cot}  (${b.nguon})`);
    const doc = async () => (await admin.from(b.ten)
      .select(b.cot).eq('id', b.id).single()).data[b.cot];

    // Vế KHẲNG ĐỊNH trước (K-3).
    for (const v of b.duoc) {
      await admin.from(b.ten).update({ [b.cot]: b.cu ?? 'ZZ mùa' }).eq('id', b.id);
      await phienVai[v].from(b.ten).update({ [b.cot]: b.moi }).eq('id', b.id);
      s.ok(`⭐ ${b.ten} · ${v} GHI ĐƯỢC`, String(await doc()) === String(b.moi),
        `giá trị vẫn là ${await doc()} — chặn quá tay`);
    }
    // Vế PHỦ ĐỊNH.
    for (const v of VAI.filter((x) => !b.duoc.includes(x))) {
      await admin.from(b.ten).update({ [b.cot]: b.cu ?? 'ZZ mùa' }).eq('id', b.id);
      await phienVai[v].from(b.ten).update({ [b.cot]: b.moi }).eq('id', b.id);
      s.ok(`${b.ten} · ${v} BỊ CHẶN`, String(await doc()) !== String(b.moi),
        `GHI ĐƯỢC — giá trị thành ${b.moi}`);
    }
    await admin.from(b.ten).update({ [b.cot]: b.cu ?? 'ZZ mùa' }).eq('id', b.id);
    await anon.from(b.ten).update({ [b.cot]: b.moi }).eq('id', b.id);
    s.ok(`${b.ten} · anon BỊ CHẶN`, String(await doc()) !== String(b.moi), 'GHI ĐƯỢC');
  }

  for (const v of VAI) await phienVai[v].auth.signOut();
} catch (e) {
  console.error('\n⛔ NGOẠI LỆ: ' + e.message);
  s.ok('Bài kiểm chạy trọn vẹn', false, e.message);
} finally {
  for (const { bang, id } of rac) await admin.from(bang).delete().eq('id', id);
  await phien.don();
  console.log(`\nĐã dọn: ${rac.length} dòng gieo tạm + 14 tài khoản tạm.`);
}

process.exit(s.ketThuc() ? 1 : 0);
