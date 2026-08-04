// ============================================================================
// KIỂM PHÂN QUYỀN NỘI BỘ — 23 BẢNG CÒN ĐỨNG DƯỚI `authenticated_only`
//
// ─── VÌ SAO TỆP NÀY TỒN TẠI ───────────────────────────────────────────────
//
// Bài kiểm `rls-external.test.mjs` chứng minh **người NGOÀI** không nhìn quá
// phần của họ. Nó không nói gì về **người TRONG**. Và chỗ hở thật nằm ở đó.
//
// Migration `014` và `015` cấp cho 23 bảng đúng một policy duy nhất:
//
//     CREATE POLICY "authenticated_only" ON public.<bảng>
//       FOR ALL TO authenticated
//       USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
//     GRANT ALL ON public.<bảng> TO authenticated;
//
// Đọc cho kỹ: **`FOR ALL`** + **`GRANT ALL`** + điều kiện duy nhất là *"có đăng
// nhập"*. Vai trò không hề xuất hiện trong biểu thức. Nghĩa là mọi người dùng
// nội bộ — thủ kho, tổ trưởng may, tổ trưởng hoàn thành — có **đủ bốn quyền
// SELECT · INSERT · UPDATE · DELETE trên MỌI DÒNG** của `costings`,
// `costing_items`, `style_bom`, `activity_log`…
//
// `costings` là cơ cấu giá thành và biên lợi nhuận. `activity_log` là sổ kiểm
// toán.
//
// ─── ĐÍNH CHÍNH MỘT PHÁT HIỆN SAI CỦA CHÍNH TÔI ──────────────────────────
//
// Audit Report từng ghi *"costings và style_bom không có policy nào — người
// ngoài đọc được"*. **Sai.** Người ngoài BỊ CHẶN, bằng hai policy RESTRICTIVE
// quét toàn bộ bảng: `buyer_denied` (018) và `subcon_denied` (025). Tôi đã tìm
// theo `CREATE POLICY ... ON costings` rồi kết luận trên chỗ không tìm thấy —
// đúng lỗi mà Hiến pháp V.1 gọi tên: **không kết luận trên phép đo rỗng.**
//
// Lỗ hổng thật KHÁC lỗ hổng tôi báo: nó nằm ở phía NỘI BỘ, và không ai đo.
//
// ─── VÌ SAO BÀI KIỂM NÀY CHẠY ĐƯỢC KHI BẢNG CÒN RỖNG ─────────────────────
//
// Phép đo quyền ĐỌC cần có dòng để đọc (Hiến pháp V.1) — 23 bảng này đang rỗng,
// nên phần đọc sẽ ghi `⚪ chưa đo được` cho tới khi có dữ liệu nền (Cổng C).
//
// Nhưng phép đo quyền GHI **không cần dòng nào**: ta gửi lệnh `UPDATE`/`DELETE`
// nhắm vào một khoá KHÔNG TỒN TẠI.
//
//   • Bị `REVOKE` ở tầng GRANT  ⇒ Postgres ném `42501` TRƯỚC khi tìm dòng.
//   • Được phép                 ⇒ lệnh chạy, khớp 0 dòng, **không tác dụng phụ**.
//
// Đây chính là cách K-1 đòi hỏi: **kiểm sổ cái bằng LƯỢC ĐỒ, không bằng ghi
// thử.** Không dòng nào được tạo ra, nên không dòng nào phải dọn — và ta không
// bao giờ phải mở cửa một chiều của `activity_log` để xem nó có khoá hay không.
//
// ─── BÀI KIỂM NÀY PHẢI HỎNG NGAY LẦN CHẠY ĐẦU ────────────────────────────
//
// Nó mô tả trạng thái ĐÍCH, không mô tả trạng thái hiện tại. Xanh ngay từ đầu
// nghĩa là bài kiểm sai, không phải hệ thống đúng.
// ============================================================================
import { randomUUID } from 'node:crypto';
import { requireDb, scoreboard, sessionFactory, dem } from '../_lib/harness.mjs';

const { env, admin, createClient } = requireDb();
const s = scoreboard('KIỂM PHÂN QUYỀN NỘI BỘ — authenticated_only');
const phien = sessionFactory(admin, createClient, env, 'mdscope');

// ─── 23 bảng do vòng lặp `014`/`015` cấp policy `authenticated_only` ───────
// `nhay` = dữ liệu thương mại/kiểm toán. Vai vận hành KHÔNG được đọc.
const BANG = [
  { ten: 'costings',             nhay: true,  ghiChu: 'cơ cấu giá thành' },
  { ten: 'costing_items',        nhay: true,  ghiChu: 'chi tiết giá thành' },
  { ten: 'inquiries',            nhay: true,  ghiChu: 'hỏi giá' },
  { ten: 'style_bom',            nhay: true,  ghiChu: 'định mức nguyên phụ liệu' },
  { ten: 'activity_log',         nhay: true,  ghiChu: 'SỔ KIỂM TOÁN — chỉ-ghi-thêm', soCai: true },
  { ten: 'change_requests',      nhay: false, ghiChu: '' },
  { ten: 'risk_assessments',     nhay: false, ghiChu: '' },
  { ten: 'order_milestones',     nhay: false, ghiChu: '' },
  { ten: 'production_orders',    nhay: false, ghiChu: '' },
  { ten: 'material_requests',    nhay: false, ghiChu: '' },
  { ten: 'seasons',              nhay: false, ghiChu: '' },
  { ten: 'customer_contacts',    nhay: false, ghiChu: '' },
  { ten: 'styles',               nhay: false, ghiChu: '' },
  { ten: 'style_colorways',      nhay: false, ghiChu: '' },
  { ten: 'style_sizes',          nhay: false, ghiChu: '' },
  { ten: 'style_operations',     nhay: false, ghiChu: '' },
  { ten: 'order_size_breakdown', nhay: false, ghiChu: '' },
  { ten: 'ta_templates',         nhay: false, ghiChu: '' },
  { ten: 'ta_template_items',    nhay: false, ghiChu: '' },
  { ten: 'sample_submissions',   nhay: false, ghiChu: '' },
  { ten: 'md_documents',         nhay: false, ghiChu: '' },
  { ten: 'md_comments',          nhay: false, ghiChu: '' },
  { ten: 'customers',            nhay: false, ghiChu: '' },
];

/**
 * Gửi một lệnh GHI nhắm vào khoá KHÔNG TỒN TẠI và trả về mã lỗi Postgres.
 *
 * Khoá chính của các bảng này khi thì `uuid`, khi thì `bigint`. Gửi sai kiểu,
 * Postgres ném `22P02` — **rất giống bị chặn nếu chỉ nhìn "có lỗi hay không"**.
 * Vì vậy hàm này thử lần lượt cả hai kiểu và chỉ kết luận khi mã lỗi có nghĩa.
 *
 * @returns {'CHAN'|'LOT'|'KHONG_DO_DUOC'}
 *   CHAN          = `42501` — quyền đã bị thu hồi ở tầng GRANT ✅
 *   LOT           = lệnh chạy được (khớp 0 dòng, không tác dụng phụ) ⛔
 *   KHONG_DO_DUOC = lỗi khác — không suy diễn, xem Hiến pháp V.1
 */
async function thuGhi(client, bang, hanhDong) {
  let cuoi = null;
  for (const khoaGia of [randomUUID(), -1]) {
    const q = client.from(bang);
    const { error } =
      hanhDong === 'delete'
        ? await q.delete().eq('id', khoaGia)
        : await q.update({ id: khoaGia }).eq('id', khoaGia);

    if (!error) return 'LOT';
    if (error.code === '42501') return 'CHAN';
    if (error.code === '22P02') { cuoi = error; continue; }  // sai kiểu khoá — thử kiểu kia
    cuoi = error;
  }
  return cuoi?.code === '42501' ? 'CHAN' : 'KHONG_DO_DUOC';
}

try {
  // ── Hai vai nội bộ, khác nhau ở chỗ CÓ NGHIỆP VỤ VỚI DỮ LIỆU NÀY HAY KHÔNG
  //    md  · merchandiser — sở hữu nghiệp vụ 23 bảng này ⇒ vế KHẲNG ĐỊNH (K-3)
  //    kho · thủ kho      — không liên quan giá thành    ⇒ vế PHỦ ĐỊNH
  const md = await phien.tao('md', 'md');
  const kho = await phien.tao('kho', 'kho');

  // ══ A · QUYỀN XOÁ CỨNG ───────────────────────────────────────────────────
  // Hiến pháp bắt buộc XOÁ MỀM (`deleted_at`). Arch test chặn `.delete()` trong
  // MÃ ỨNG DỤNG — nhưng đó là chốt chặn ở tầng sai. Bất kỳ ai có token hợp lệ
  // đều gọi thẳng PostgREST được, không đi qua mã ứng dụng lần nào.
  // Chốt chặn thật phải là `REVOKE DELETE`, theo đúng lý lẽ của `029b`.
  console.log('\nA · XOÁ CỨNG — phải bị REVOKE ở tầng CSDL, không phải ở arch test');
  for (const b of BANG) {
    const kq = await thuGhi(md.client, b.ten, 'delete');
    // Nhãn `[F-1]` / `[F-2]` để đọc được TIẾN ĐỘ, không chỉ đọc được ĐỎ/XANH:
    // `041` vá F-1 (một bảng), ADR-018 vá F-2 (22 bảng còn lại). Không tách
    // nhãn thì sau khi `041` chạy, bảng kết quả vẫn đỏ 23 dòng và không ai biết
    // hotfix đã ăn hay chưa.
    const dau = b.soCai ? '[F-1]' : '[F-2]';
    if (kq === 'KHONG_DO_DUOC') s.chuaDo(`DELETE ${b.ten}`, 'mã lỗi không kết luận được');
    else s.ok(`${dau} ${b.ten} — vai nội bộ KHÔNG xoá cứng được${b.nhay ? '  ⭐' : ''}`,
      kq === 'CHAN', 'GRANT ALL còn nguyên — DELETE chạy được');
  }

  // ══ B · SỔ CÁI CHỈ-GHI-THÊM ──────────────────────────────────────────────
  // ⚠️ K-1: KHÔNG ghi thử vào sổ cái. Chỉ đo QUYỀN, trên khoá không tồn tại.
  // BDR-14 (Board 04/08/2026): Audit Log là bất biến. `FOR ALL` + `GRANT ALL`
  // cho phép UPDATE ⇒ người sửa dữ liệu tự xoá được dấu vết của chính mình.
  console.log('\nB · SỔ KIỂM TOÁN — BDR-14 đòi bất biến');
  for (const b of BANG.filter((x) => x.soCai)) {
    const kqU = await thuGhi(md.client, b.ten, 'update');
    if (kqU === 'KHONG_DO_DUOC') s.chuaDo(`UPDATE ${b.ten}`, 'mã lỗi không kết luận được');
    else s.ok(`[F-1] ⭐ ${b.ten} — KHÔNG ai sửa được (BDR-14)`, kqU === 'CHAN',
      'UPDATE chạy được — sổ kiểm toán KHÔNG bất biến. Chạy migration 041.');
  }

  // ══ C · PHÂN TÁCH NỘI BỘ ─────────────────────────────────────────────────
  // Vế khẳng định + vế phủ định luôn đi thành cặp (K-3). Chỉ đo vế phủ định
  // thì một policy CHẶN PHẲNG cũng xanh, mà chặn phẳng là hỏng chứ không đạt.
  console.log('\nC · PHÂN TÁCH NỘI BỘ — thủ kho không được thấy giá thành');
  for (const b of BANG.filter((x) => x.nhay && !x.soCai)) {
    const tong = await dem(admin, b.ten);
    if (!tong) { s.chuaDo(`${b.ten} (${b.ghiChu})`, 'bảng rỗng — chờ dữ liệu nền, Cổng C'); continue; }
    const nMd = await dem(md.client, b.ten);
    const nKho = await dem(kho.client, b.ten);
    s.ok(`⭐ ${b.ten} — MD THẤY được (${nMd}/${tong})`, nMd !== null && nMd > 0);
    s.ok(`⭐ ${b.ten} — thủ kho KHÔNG thấy (${b.ghiChu})`, nKho === null || nKho === 0,
      `thủ kho đọc được ${nKho}/${tong} dòng`);
  }

  for (const c of [md, kho]) await c.client.auth.signOut();
} catch (e) {
  console.error('\n⛔ NGOẠI LỆ: ' + e.message);
  s.ok('Bài kiểm chạy trọn vẹn', false, e.message);
} finally {
  // Không tạo dòng nghiệp vụ nào ⇒ chỉ phải dọn tài khoản tạm.
  await phien.don();
  console.log('\nĐã dọn: tài khoản tạm. Không dòng nghiệp vụ nào được tạo ra.');
}

process.exit(s.ketThuc() ? 1 : 0);
