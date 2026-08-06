// ============================================================================
// LÕI FINISHING — LUẬT SINH VIỆC · KPI TỔ HOÀN THÀNH
//
// ─── 🔴 LUẬT ĐẦU TIÊN ⛔ KHÔNG PHẢI VỀ NĂNG SUẤT — NÓ VỀ TIỀN ĐI RA ────
// Đóng thùng **vượt số của đơn** nghĩa là hàng rời nhà máy nhiều hơn số khách
// đặt, và ⛔ không ai đòi lại được sau khi container niêm phong.
//
// ⚠️ Cái bẫy: **mọi chỉ số khác vẫn đẹp** — QC đạt cao, ⛔ không lỗi, thùng
// đóng đều tay. Đây là lý do phép đo cho luật đó đứng **đầu tiên** trong tệp
// này, đúng cách `sewing.test.mjs` đặt kim gãy lên đầu.
// ============================================================================
import { scoreboard } from '../_lib/harness.mjs';
import {
  viecCuaHoanThanh, NGUONG_LOI_FINAL_QC, NGUONG_THUNG_CHO_NHAP, HOAN_THANH_NEO,
} from '../../lib/mos/workspace/hoan-thanh-work-items.ts';
import {
  kpiHoanThanh, duLieuHoanThanh, PO_KHONG_TEN, STAGE_SAN_SANG_DONG_THUNG,
} from '../../lib/mos/calculators/hoan-thanh-kpi.calculator.ts';

const s = scoreboard('LÕI FINISHING');

const NEN = {
  soBundle: 0, tongDat: 0, tongLoi: 0, tongKiem: 0,
  choDongThung: [], nghenUi: [], dongVuotPO: [], soThungTaiXuong: 0,
};
const voi = (them) => ({ ...NEN, ...them });
const ma = (v) => v.map((x) => x.id);

/** Bundle mẫu — mọi trường khai đủ để ⛔ không có `undefined` lọt vào phép cộng. */
const bundle = (t = {}) => ({
  bundle_code: 'B-001', quantity: 100, current_stage: 'SEWING',
  po_number: 'PO-1', po_total_qty: 1000,
  trimming_qty: 0, ironing_qty: 0, final_qc_passed_qty: 0, final_qc_defect_qty: 0,
  ...t,
});

console.log('\n① 🔴 ĐÓNG VƯỢT ĐƠN — ĐỨNG TRÊN MỌI VIỆC KHÁC');
{
  // Chỉ số đẹp toàn tập: kiểm 500 sp, ⛔ không một lỗi nào, ⛔ không bundle nào
  // đứng chờ. Và đơn vẫn đã bị đóng vượt 200 sp.
  const dep = voi({
    soBundle: 5, tongDat: 500, tongLoi: 0, tongKiem: 500,
    dongVuotPO: [{ po: 'PO-1', daDong: 1200, theoDon: 1000 }],
  });
  const v = viecCuaHoanThanh(dep);
  s.ok('Mọi chỉ số đẹp mà vẫn sinh việc đóng vượt đơn',
    ma(v).includes('hoanThanh.dong-vuot-po'));
  s.ok('🔑 Việc đó đứng ĐẦU TIÊN', v[0]?.id === 'hoanThanh.dong-vuot-po', ma(v).join(' · '));
  s.ok('Ở mức CRITICAL', v[0]?.severity === 'CRITICAL');
  s.ok('Dẫn tới DANH SÁCH THÙNG, ⛔ không tới bảng WIP',
    v[0]?.href === HOAN_THANH_NEO.thungTaiXuong, String(v[0]?.href));
  s.ok('Câu việc mang số đơn · đã đóng · theo đơn',
    v[0]?.vars?.po === 'PO-1' && v[0]?.vars?.daDong === 1200 && v[0]?.vars?.theoDon === 1000,
    JSON.stringify(v[0]?.vars));

  // Vế ngược: đóng ĐÚNG bằng số đơn thì ⛔ KHÔNG sinh việc. Đóng đủ là **xong
  // việc**, ⛔ không phải sự cố — báo động ở đây thì người dùng học cách tắt.
  s.ok('Đóng ĐÚNG số đơn ⇒ ⛔ KHÔNG sinh việc',
    !ma(viecCuaHoanThanh(voi({ soBundle: 5, tongKiem: 500, tongDat: 500 })))
      .includes('hoanThanh.dong-vuot-po'));
}

console.log('\n② NGƯỠNG TỶ LỆ LỖI — ĐO ĐÚNG BA ĐIỂM QUANH RANH GIỚI');
{
  // Luật là `>` ngưỡng, nên ĐÚNG BẰNG ngưỡng phải IM. Đây là chỗ một dấu `>=`
  // gõ nhầm sẽ sinh báo động cho mọi tổ đang chạy đúng chuẩn.
  const oNguong = voi({ soBundle: 1, tongKiem: 1000, tongLoi: NGUONG_LOI_FINAL_QC * 10, tongDat: 970 });
  s.ok(`Đúng ${NGUONG_LOI_FINAL_QC}% ⇒ ⛔ KHÔNG nổ`,
    !ma(viecCuaHoanThanh(oNguong)).includes('hoanThanh.ty-le-loi-cao'));

  const tren = voi({ soBundle: 1, tongKiem: 1000, tongLoi: 31, tongDat: 969 });
  s.ok('3,1% ⇒ NỔ', ma(viecCuaHoanThanh(tren)).includes('hoanThanh.ty-le-loi-cao'));

  const duoi = voi({ soBundle: 1, tongKiem: 1000, tongLoi: 29, tongDat: 971 });
  s.ok('2,9% ⇒ ⛔ KHÔNG nổ',
    !ma(viecCuaHoanThanh(duoi)).includes('hoanThanh.ty-le-loi-cao'));

  // Tập rỗng: ⛔ chưa kiểm cái nào thì ⛔ KHÔNG có tỷ lệ nào để phán. Đây là chỗ
  // phép chia cho 0 sinh ra `NaN`, và `NaN > 3` là `false` — tức nó sẽ **im
  // lặng đúng** vì một lý do **sai**. Đo tường minh để ⛔ không ai gỡ chốt đó.
  s.ok('⛔ Chưa kiểm cái nào ⇒ ⛔ KHÔNG phán tỷ lệ lỗi',
    !ma(viecCuaHoanThanh(voi({ soBundle: 3 }))).includes('hoanThanh.ty-le-loi-cao'));
}

console.log('\n③ `P33` — VIỆC CÓ NƠI XỬ LÝ MỚI ĐƯỢC CÓ `href`');
{
  const v = viecCuaHoanThanh(voi({
    soBundle: 4, tongKiem: 100, tongDat: 90, tongLoi: 10,
    choDongThung: [{ bundle: 'B-9', po: 'PO-1' }],
    nghenUi: [{ bundle: 'B-2', catChi: 100, ui: 40 }],
    soThungTaiXuong: NGUONG_THUNG_CHO_NHAP + 5,
  }));
  s.ok('Mọi việc CRITICAL/WARNING đều có href',
    v.filter((x) => x.severity !== 'INFO').every((x) => typeof x.href === 'string'),
    ma(v.filter((x) => x.severity !== 'INFO' && !x.href)).join(' · '));

  // Chiều ngược lại — quan trọng ngang chiều xuôi.
  const yen = viecCuaHoanThanh(voi({ soBundle: 2, tongKiem: 100, tongDat: 100 }));
  const info = yen.find((x) => x.id === 'hoanThanh.on-dinh');
  s.ok('Dòng trấn an tồn tại khi ⛔ không có việc thật', Boolean(info));
  s.ok('🔑 Và nó ⛔ KHÔNG có href', info?.href === undefined, String(info?.href));
}

console.log('\n④ CÓ VIỆC THẬT ⇒ GIẤU DÒNG TRẤN AN');
{
  const v = viecCuaHoanThanh(voi({
    soBundle: 2, tongKiem: 100, tongDat: 100,
    choDongThung: [{ bundle: 'B-1', po: 'PO-1' }],
  }));
  s.ok('⛔ KHÔNG vừa báo việc vừa báo "ổn định"',
    !ma(v).includes('hoanThanh.on-dinh'), ma(v).join(' · '));
}

console.log('\n⑤ KPI — GỌI LẠI `garment-math`, ⛔ KHÔNG VIẾT CÔNG THỨC THỨ HAI');
{
  const k = kpiHoanThanh([
    bundle({ trimming_qty: 100, ironing_qty: 80, final_qc_passed_qty: 70, final_qc_defect_qty: 5 }),
    bundle({ bundle_code: 'B-002', trimming_qty: 100, ironing_qty: 100, final_qc_passed_qty: 95, final_qc_defect_qty: 5 }),
  ], [{ quantity_per_carton: 24, po_number: 'PO-1' }]);
  s.ok('Cộng đúng', k.tongCatChi === 200 && k.tongUi === 180 && k.tongDat === 165 && k.tongLoi === 10);
  s.ok('Tổng kiểm = đạt + lỗi', k.tongKiem === 175);
  s.ok('Tỷ lệ lỗi ≈ 5,71%', Math.abs(k.tyLeLoi - (10 / 175) * 100) < 1e-9, String(k.tyLeLoi));
  s.ok('Tiến độ ủi = 90%', k.tienDoUi === 90, String(k.tienDoUi));
  s.ok('Đếm đúng số thùng', k.soThungTaiXuong === 1);

  const rong = kpiHoanThanh([], []);
  s.ok('Tập rỗng ⇒ toàn 0, ⛔ KHÔNG NaN',
    Object.values(rong).every((n) => n === 0),
    JSON.stringify(rong));
}

console.log('\n⑥ 🔑 TRẦN CỦA ĐƠN LẤY GIÁ TRỊ LỚN NHẤT, ⛔ KHÔNG CỘNG DỒN');
{
  // Ba bundle cùng một đơn 1000 sp. Mỗi bundle mang **tổng của cả đơn**, ⛔
  // không mang phần của riêng nó — cộng dồn sẽ ra trần 3000 và phép so **⛔
  // không bao giờ nổ**, tức mất hẳn cảnh báo về tiền.
  const d = duLieuHoanThanh(
    [bundle(), bundle({ bundle_code: 'B-2' }), bundle({ bundle_code: 'B-3' })],
    Array.from({ length: 50 }, () => ({ quantity_per_carton: 24, po_number: 'PO-1' })),
  );
  s.ok('1200 sp đã đóng / đơn 1000 sp ⇒ NỔ',
    d.dongVuotPO.length === 1 && d.dongVuotPO[0].theoDon === 1000,
    JSON.stringify(d.dongVuotPO));

  // Và chiều ngược: một bản ghi khai thiếu `0` ⛔ KHÔNG được kéo trần xuống 0.
  const lech = duLieuHoanThanh(
    [bundle({ po_total_qty: 0 }), bundle({ bundle_code: 'B-2', po_total_qty: 1000 })],
    [{ quantity_per_carton: 24, po_number: 'PO-1' }],
  );
  s.ok('Một bản ghi thiếu số đơn ⛔ KHÔNG kéo trần xuống 0',
    lech.dongVuotPO.length === 0, JSON.stringify(lech.dongVuotPO));
}

console.log('\n⑦ ĐƠN ⛔ CHƯA KHAI TỔNG SỐ ⇒ ⛔ KHÔNG ĐƯỢC PHÁN LÀ VƯỢT');
{
  // Trần `0` nghĩa là **⛔ chưa biết**, ⛔ không phải *"đơn 0 sp"*. Phán vượt ở
  // đây biến một cảnh báo về tiền thành tiếng ồn mà ⛔ không ai tắt được — và
  // khi cảnh báo thật xuất hiện thì ⛔ không còn ai đọc.
  const d = duLieuHoanThanh(
    [bundle({ po_total_qty: 0 })],
    [{ quantity_per_carton: 24, po_number: 'PO-1' }],
  );
  s.ok('Trần 0 ⇒ ⛔ KHÔNG phán vượt', d.dongVuotPO.length === 0);

  // Thùng ⛔ không khai đơn ⇒ gom vào một rổ CÓ TÊN, ⛔ không trộn vào đơn thật.
  const khuyet = duLieuHoanThanh(
    [bundle()],
    [{ quantity_per_carton: 24, po_number: '' }],
  );
  s.ok('Thùng ⛔ không tên đơn ⇒ ⛔ KHÔNG cộng nhầm vào PO-1',
    khuyet.dongVuotPO.length === 0);
  s.ok(`Nhãn rổ khuyết là "${PO_KHONG_TEN}"`, PO_KHONG_TEN.length > 0);
}

console.log('\n⑧ NGHẼN ỦI — CHỈ TÍNH BUNDLE ĐÃ BẮT ĐẦU CẮT CHỈ');
{
  // Bundle ⛔ chưa vào tổ có `0/0`. Nếu tính nó là "nghẽn" thì mọi bundle mới
  // vào đều nổ, và khối nghẽn ủi chỉ ra **tiếng ồn**.
  const d = duLieuHoanThanh([
    bundle({ trimming_qty: 0, ironing_qty: 0 }),
    bundle({ bundle_code: 'B-2', trimming_qty: 100, ironing_qty: 40 }),
    bundle({ bundle_code: 'B-3', trimming_qty: 100, ironing_qty: 100 }),
  ]);
  s.ok('Chỉ bundle ĐÃ cắt chỉ mà ủi tụt mới tính là nghẽn',
    d.nghenUi.length === 1 && d.nghenUi[0].bundle === 'B-2',
    JSON.stringify(d.nghenUi));
}

console.log('\n⑨ CHỜ ĐÓNG THÙNG ĐỌC TỪ BUSINESS CODE, ⛔ KHÔNG TỪ CHUỖI GÕ TAY');
{
  const d = duLieuHoanThanh([
    bundle({ current_stage: STAGE_SAN_SANG_DONG_THUNG }),
    bundle({ bundle_code: 'B-2', current_stage: 'PACKED' }),
    bundle({ bundle_code: 'B-3', current_stage: 'SEWING' }),
  ]);
  s.ok('Đúng 1 bundle chờ đóng thùng',
    d.choDongThung.length === 1 && d.choDongThung[0].bundle === 'B-001',
    JSON.stringify(d.choDongThung));
}

process.exit(s.ketThuc() ? 1 : 0);
