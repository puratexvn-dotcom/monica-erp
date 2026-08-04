-- ============================================================================
-- MONICA ONE — 042 · THU HẸP `authenticated_only` TRÊN 22 BẢNG MERCHANDISING
--
-- 📐 ADR-018 — ✅ Board phê duyệt VỀ NGUYÊN TẮC 05/08/2026
-- 🔴 Phát hiện `F-2` — docs/audit/VR-001-KET-QUA.md §2.1, `[VERIFIED]`
--
-- ⛔⛔ TỆP NÀY CHƯA ĐƯỢC PHÉP CHẠY ⛔⛔
--     SECURITY FREEZE (MOS §XI.1) VẪN GIỮ NGUYÊN — Board chưa cắt Cổng B `B2`.
--     ADR-018 CHƯA đi qua phản biện độc lập (ADR-011 §2.2).
--     Chạy tệp này trước hai điều kiện đó là vi phạm quy trình.
--
-- ─── LỖ HỔNG, ĐÃ ĐO TRÊN CSDL ĐANG CHẠY ──────────────────────────────────
--
-- Vòng lặp `014:120` và `015:504` cấp cho 23 bảng đúng một policy:
--     CREATE POLICY "authenticated_only" ... FOR ALL TO authenticated
--       USING (auth.uid() IS NOT NULL);
--     GRANT ALL ON public.<bảng> TO authenticated;
--
-- Điều kiện duy nhất là "có đăng nhập". Vai trò không có mặt trong biểu thức.
-- Đo bằng phiên đăng nhập thật vai `md`: **23/23 bảng xoá cứng được.**
-- `activity_log` đã vá riêng ở `041`; tệp này xử 22 bảng còn lại.
--
-- ─── HAI TẦNG, KHÔNG PHẢI MỘT ────────────────────────────────────────────
--
--   Privilege (GRANT/REVOKE) → "hành động này có BAO GIỜ hợp lệ không?"
--   Policy    (RLS)          → "DÒNG NÀO được chạm?"
--
-- Thao tác không bao giờ hợp lệ phải chặn ở tầng Privilege. Policy **không áp
-- cho `TRUNCATE`** — chặn `TRUNCATE` bằng policy là dùng sai công cụ.
-- Lý lẽ này lấy nguyên từ `029b:34`.
--
-- ─── VÌ SAO KHÔNG DÙNG `mos_is_external()` CHO PHẦN NỘI BỘ ───────────────
--
-- `NOT mos_is_external()` gộp cả 12 vai nội bộ làm một — đúng thứ đang hỏng.
-- Tệp này dùng `mos_current_role()` (`019:34`): `SECURITY DEFINER`, `STABLE`,
-- và **KHÔNG truy vấn bảng nào** — nó chỉ đọc claim trong JWT.
--
-- 🔑 Đây là điều kiện bắt buộc theo quy tắc **K-3**: policy truy vấn bảng mà
-- chính người gọi không đọc được sẽ biến *khoanh vùng* thành *chặn phẳng*. Đó
-- là lỗi đã trả giá một lần ở `031c`. Hàm chỉ đọc JWT miễn nhiễm với bẫy đó.
--
-- ─── KHÔNG ĐỤNG TỚI ──────────────────────────────────────────────────────
--   ⛔ `buyer_denied` (018:307) · `subcon_denied` (025:111) — người ngoài đã
--      bị chặn đúng, và ADR-018 §2.1 xác nhận bằng phép đo
--   ⛔ 6 bảng của chuỗi `031` · `service_role` · lược đồ · Business Rule
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- 0. DANH SÁCH VAI — ĐẶT MỘT CHỖ
-- ════════════════════════════════════════════════════════════════════════════
-- Không tạo bảng cấu hình cho mấy danh sách này: policy sẽ phải `SELECT` bảng
-- đó, và rơi thẳng vào bẫy K-3 nói trên. Viết thẳng vào biểu thức là **cố ý**.
--
--   NỘI BỘ (12)  superadmin giamdoc md qa totruongmay totruongcat hoanthanh
--                kho ketoan khotruong thukho ketoanvattu
--   NGOÀI  (2)   subcon buyer   ← đã bị buyer_denied / subcon_denied chặn
--   KHO    (4)   kho khotruong thukho ketoanvattu
--   MD-GHI (2)   superadmin md

DO $$
DECLARE
  t TEXT;

  -- ── T1 · THƯƠNG MẠI MẬT ────────────────────────────────────────────────
  -- ADR-018 §5.1. `ketoan` KHÔNG có mặt: phán quyết `VR-005` của Board là
  -- phân quyền theo CỘT, mà RLS chỉ lọc DÒNG ⇒ kế toán đi qua phép chiếu
  -- `v_costing_approved` ở Mục 4, không chạm bảng gốc.
  t1_doc   TEXT := 'superadmin,giamdoc,md';
  t1_ghi   TEXT := 'superadmin,md';

  -- `style_bom` rộng hơn ba bảng T1 kia đúng 4 vai kho — phán quyết `VR-004`.
  -- ⚠️ CHỈ ĐỌC. Bốn vai này không xuất hiện ở bất kỳ policy ghi nào bên dưới.
  bom_doc  TEXT := 'superadmin,giamdoc,md,kho,khotruong,thukho,ketoanvattu';

  -- ── T2 · CHỨNG TỪ VẬN HÀNH · T3 · DỮ LIỆU CHỦ ─────────────────────────
  noi_bo   TEXT := 'superadmin,giamdoc,md,qa,totruongmay,totruongcat,'
                   'hoanthanh,kho,ketoan,khotruong,thukho,ketoanvattu';
BEGIN
  RAISE NOTICE 'ADR-018 · thu hẹp 22 bảng — T1 đọc [%] · BOM đọc [%]',
    t1_doc, bom_doc;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 1. TẦNG PRIVILEGE — GỠ HẲN HÀNH ĐỘNG KHÔNG BAO GIỜ HỢP LỆ
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1a. TRUNCATE · TRIGGER · REFERENCES — cả 22 bảng, không ngoại lệ ──────
-- TRUNCATE bỏ qua trigger, bỏ qua RLS, không sinh dòng audit nào.
-- TRIGGER cho phép gắn trigger lên bảng — một đường can thiệp nội dung KHÔNG
-- đi qua policy nào. `GRANT ALL` đã cấp sẵn cả hai. Không lời gọi hợp lệ nào
-- của ứng dụng cần tới chúng.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'costings','costing_items','inquiries','style_bom',
    'production_orders','material_requests','order_milestones',
    'change_requests','risk_assessments','sample_submissions',
    'order_size_breakdown','seasons','customers','customer_contacts',
    'styles','style_colorways','style_sizes','style_operations',
    'ta_templates','ta_template_items','md_documents','md_comments'
  ] LOOP
    EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM authenticated', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- ─── 1b. DELETE — 16 bảng ─────────────────────────────────────────────────
-- Xoá mềm là bắt buộc (CLAUDE.md §2.5). Xoá cứng không bao giờ hợp lệ ⇒ gỡ
-- hành động, không lọc dòng.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'costings','inquiries','style_bom',
    'production_orders','material_requests','order_milestones',
    'change_requests','risk_assessments','sample_submissions',
    'seasons','customers','customer_contacts','styles',
    'ta_templates','ta_template_items','md_comments'
  ] LOOP
    EXECUTE format('REVOKE DELETE ON public.%I FROM authenticated', t);
  END LOOP;
END $$;

-- ─── 1c. SÁU BẢNG CỐ Ý GIỮ `DELETE` — NỢ CÓ THỜI HẠN `TD-25` ──────────────
--   costing_items         commercial.actions.ts:270
--   order_size_breakdown  po.actions.ts:161        (xoá-rồi-chèn-lại)
--   md_documents          collaboration.actions.ts:60
--   style_colorways · style_sizes · style_operations   style.actions.ts:211
--
-- Thu hồi ngay sẽ làm BỐN CHỨC NĂNG ĐANG DÙNG gãy tại chỗ với lỗi `42501` mà
-- người dùng không hiểu. Phải chuyển bốn lời gọi đó sang xoá mềm hoặc RPC
-- TRƯỚC, rồi mới thu hồi — `costing_items` còn phải thêm cột `deleted_at`,
-- tức đổi lược đồ, tức cần một ADR riêng.
--
-- ⚠️ `TRUNCATE` của sáu bảng này VẪN bị thu hồi ở 1a. Giữ `DELETE` từng dòng
-- không có nghĩa là giữ quyền xoá sạch bảng.


-- ════════════════════════════════════════════════════════════════════════════
-- 2. TẦNG POLICY — THAY `authenticated_only` BẰNG POLICY TÁCH THEO HÀNH ĐỘNG
-- ════════════════════════════════════════════════════════════════════════════
-- Tách `FOR SELECT` / `FOR INSERT` / `FOR UPDATE` thay vì một `FOR ALL` là CÓ
-- CHỦ Ý: `FOR ALL` dán "đọc được" và "sửa được" thành một quyết định duy nhất,
-- và đó chính là cách `authenticated_only` biến một dòng SQL thành bốn quyền.

CREATE OR REPLACE FUNCTION public.mos_narrow_md_table(
  p_bang TEXT, p_doc TEXT, p_ghi TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_bang);
  EXECUTE format('ALTER TABLE public.%I FORCE  ROW LEVEL SECURITY', p_bang);

  -- Gỡ policy nền cũ. `DROP ... IF EXISTS` ⇒ chạy lại tệp này vô hại.
  EXECUTE format('DROP POLICY IF EXISTS "authenticated_only" ON public.%I', p_bang);
  EXECUTE format('DROP POLICY IF EXISTS "%s_read"   ON public.%I', p_bang, p_bang);
  EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', p_bang, p_bang);
  EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', p_bang, p_bang);

  EXECUTE format(
    'CREATE POLICY "%s_read" ON public.%I FOR SELECT TO authenticated '
    'USING (public.mos_current_role() = ANY (string_to_array(%L, '','')))',
    p_bang, p_bang, p_doc);

  EXECUTE format(
    'CREATE POLICY "%s_insert" ON public.%I FOR INSERT TO authenticated '
    'WITH CHECK (public.mos_current_role() = ANY (string_to_array(%L, '','')))',
    p_bang, p_bang, p_ghi);

  -- ⚠️ `USING` **và** `WITH CHECK` đều bắt buộc ở UPDATE. Thiếu `WITH CHECK`,
  -- người sửa được một dòng có thể sửa nó thành dòng lẽ ra họ không đụng tới.
  EXECUTE format(
    'CREATE POLICY "%s_update" ON public.%I FOR UPDATE TO authenticated '
    'USING (public.mos_current_role() = ANY (string_to_array(%L, '','')))  '
    'WITH CHECK (public.mos_current_role() = ANY (string_to_array(%L, '','')))',
    p_bang, p_bang, p_ghi, p_ghi);

  -- Cấp lại đúng phần cần. `GRANT` không thu hẹp được, nên Mục 1 phải chạy
  -- TRƯỚC — thứ tự hai mục này không đảo được.
  EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.%I TO authenticated', p_bang);
END $$;

COMMENT ON FUNCTION public.mos_narrow_md_table(TEXT, TEXT, TEXT) IS
  'Hàm dựng dùng MỘT LẦN cho migration 042 (ADR-018). Bị DROP ở Mục 5.';

DO $$
DECLARE
  t        TEXT;
  t1_doc   TEXT := 'superadmin,giamdoc,md';
  t1_ghi   TEXT := 'superadmin,md';
  bom_doc  TEXT := 'superadmin,giamdoc,md,kho,khotruong,thukho,ketoanvattu';
  noi_bo   TEXT := 'superadmin,giamdoc,md,qa,totruongmay,totruongcat,'
                   'hoanthanh,kho,ketoan,khotruong,thukho,ketoanvattu';
BEGIN
  -- ── T1 · THƯƠNG MẠI MẬT ────────────────────────────────────────────────
  PERFORM public.mos_narrow_md_table('costings',      t1_doc,  t1_ghi);
  PERFORM public.mos_narrow_md_table('costing_items', t1_doc,  t1_ghi);
  PERFORM public.mos_narrow_md_table('inquiries',     t1_doc,  t1_ghi);
  -- `VR-004`: kho ĐỌC được định mức để cấp phát NPL, và CHỈ đọc.
  PERFORM public.mos_narrow_md_table('style_bom',     bom_doc, t1_ghi);

  -- ── T2 · CHỨNG TỪ VẬN HÀNH — đọc: mọi vai nội bộ; ghi: chức năng sở hữu ─
  PERFORM public.mos_narrow_md_table('production_orders',    noi_bo, 'superadmin,md');
  PERFORM public.mos_narrow_md_table('order_milestones',     noi_bo, 'superadmin,md');
  PERFORM public.mos_narrow_md_table('order_size_breakdown', noi_bo, 'superadmin,md');
  PERFORM public.mos_narrow_md_table('material_requests',    noi_bo,
    'superadmin,md,kho,khotruong,ketoanvattu');
  PERFORM public.mos_narrow_md_table('change_requests',      noi_bo, 'superadmin,md,giamdoc');
  PERFORM public.mos_narrow_md_table('risk_assessments',     noi_bo, 'superadmin,md,giamdoc');
  PERFORM public.mos_narrow_md_table('sample_submissions',   noi_bo, 'superadmin,md,qa');

  -- ── T3 · DỮ LIỆU CHỦ & CỘNG TÁC ────────────────────────────────────────
  FOREACH t IN ARRAY ARRAY[
    'seasons','customers','customer_contacts','styles','style_colorways',
    'style_sizes','style_operations','ta_templates','ta_template_items'
  ] LOOP
    PERFORM public.mos_narrow_md_table(t, noi_bo, 'superadmin,md');
  END LOOP;

  -- Cộng tác đa bộ phận: mọi vai nội bộ ghi được — CỐ Ý. Bình luận và tài liệu
  -- mà chỉ MD đăng được thì nó không còn là chỗ cộng tác.
  PERFORM public.mos_narrow_md_table('md_documents', noi_bo, noi_bo);
  PERFORM public.mos_narrow_md_table('md_comments',  noi_bo, noi_bo);
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 3. `costings` — CHẶN SỬA CHỨNG TỪ ĐÃ DUYỆT
-- ════════════════════════════════════════════════════════════════════════════
-- Hiến pháp Điều 8 (Evidence First) + CLAUDE.md §2.5: chứng từ đã Duyệt/Đóng
-- không được `UPDATE`. Rủi ro `R-3` của ADR-018 §3.1 là sửa giá SAU khi duyệt —
-- Mục 2 mới chỉ giới hạn AI được sửa, chưa giới hạn sửa được DÒNG NÀO.
--
-- Policy RESTRICTIVE ⇒ nhân VÀO điều kiện của `costings_update`, không thay nó.
DROP POLICY IF EXISTS "costings_no_edit_after_approve" ON public.costings;
CREATE POLICY "costings_no_edit_after_approve" ON public.costings
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (status NOT IN ('APPROVED','SUPERSEDED'));

-- ⚠️ CỐ Ý KHÔNG có `WITH CHECK` ở đây. Có `WITH CHECK` cùng biểu thức sẽ chặn
-- luôn phép chuyển hợp lệ `SUBMITTED → APPROVED` (dòng MỚI có status
-- 'APPROVED' ⇒ vi phạm CHECK). `USING` một mình cho đúng ngữ nghĩa cần:
-- "được sửa dòng CHƯA duyệt, kể cả để duyệt nó; không được sửa dòng ĐÃ duyệt."


-- ════════════════════════════════════════════════════════════════════════════
-- 4. PHÉP CHIẾU CHO KẾ TOÁN — PHÁN QUYẾT `VR-005`
-- ════════════════════════════════════════════════════════════════════════════
-- Board: "Accounting được phép xem Approved Cost, Contribution Margin, Full Cost
-- và giá đã được phê duyệt. Không được truy cập Cost Breakdown, Draft Costing,
-- AI Simulation hoặc dữ liệu thương lượng."
--
-- Đó là phân quyền theo **CỘT**. RLS chỉ lọc **DÒNG**. Và `GRANT SELECT (cột)`
-- cấp theo VAI CSDL, trong khi mọi người dùng Monica đều là `authenticated` —
-- nó không phân biệt được `ketoan` với `md`.
--
-- ⇒ Kế toán KHÔNG chạm bảng gốc; đọc phép chiếu này. Đúng khuôn **Disclosure
--   Projection** `DL-057` (EDD-03), vốn viết cho vai NGOÀI, áp cho một vai TRONG
--   vì yêu cầu có cùng hình dạng.
--
-- ⚠️ VIEW NÀY CỐ Ý **KHÔNG** ĐẶT `security_invoker`.
-- Đặt `security_invoker = true` ⇒ view chạy dưới quyền `ketoan` ⇒ `ketoan` bị
-- `costings_read` cấm ⇒ view trả RỖNG ⇒ phán quyết Board không thi hành được.
-- Đánh đổi này bắt buộc, và kèm ba nghĩa vụ (ADR-018 §5.1.1):
--   ① ghi vào docs/SECURITY_DEFINER_REGISTRY.md   ② chạy lại A001
--   ③ view TỰ mang bộ lọc, không dựa vào policy nào ở dưới  ← thi hành ngay đây
DROP VIEW IF EXISTS public.v_costing_approved;
CREATE VIEW public.v_costing_approved AS
SELECT
  c.id, c.costing_no, c.version, c.style_id, c.customer_id,
  c.order_type, c.currency, c.quantity,
  c.quoted_price,        -- giá ĐÃ DUYỆT
  c.margin_percent,      -- Contribution Margin
  c.status, c.approved_by, c.approved_at, c.created_at
  -- ⛔ CỐ Ý BỎ, theo đúng phán quyết Board:
  --    target_price   giá mục tiêu khách đưa  → dữ liệu THƯƠNG LƯỢNG
  --    notes          trao đổi nội bộ         → dữ liệu THƯƠNG LƯỢNG
  --    reject_reason  lý do bác               → dữ liệu THƯƠNG LƯỢNG
  --    inquiry_id     trỏ vào hồ sơ hỏi giá   → dữ liệu THƯƠNG LƯỢNG
  --    created_by     ai lập bản nháp         → Draft Costing
FROM public.costings c
WHERE c.status = 'APPROVED'            -- ⛔ chặn Draft Costing
  AND public.mos_current_role() = ANY (ARRAY[
        'superadmin','giamdoc','md','ketoan']);

COMMENT ON VIEW public.v_costing_approved IS
  'Phép chiếu chiết tính ĐÃ DUYỆT cho kế toán — ADR-018 §5.1.1, phán quyết Board '
  'VR-005 ngày 05/08/2026. CỐ Ý không security_invoker: kế toán bị cấm bảng gốc '
  'costings, nên view phải chạy dưới quyền chủ hàm. Bù lại, view TỰ mang bộ lọc '
  'status=APPROVED và tự giới hạn danh sách vai. ⛔ Không thêm cột vào view này '
  'nếu chưa có phán quyết Board — mỗi cột thêm là một quyết định tiết lộ.';

REVOKE ALL     ON public.v_costing_approved FROM anon;
GRANT  SELECT  ON public.v_costing_approved TO   authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 5. DỌN HÀM DỰNG
-- ════════════════════════════════════════════════════════════════════════════
-- Hàm ở Mục 2 chỉ phục vụ lần chạy này. Để lại là để lại một công cụ đổi policy
-- hàng loạt nằm sẵn trong CSDL — thứ không nên tồn tại ngoài lúc migration chạy.
DROP FUNCTION IF EXISTS public.mos_narrow_md_table(TEXT, TEXT, TEXT);


-- ─── HOÀN TÁC ───────────────────────────────────────────────────────────────
-- Không dòng dữ liệu nào bị đụng ⇒ hoàn tác tức thời, vô hại. ADR-018 §7.1:
--   DROP POLICY "<bảng>_read"/"_insert"/"_update"; DROP POLICY
--   "costings_no_edit_after_approve"; DROP VIEW v_costing_approved;
--   CREATE POLICY "authenticated_only" ... FOR ALL ...; GRANT ALL ...;
-- ⚠️ Hoàn tác đưa hệ thống về đúng trạng thái `F-2` đang vi phạm.
--
-- Chặn nhầm MỘT bảng thì ĐỪNG hoàn tác cả migration — cấp thêm đúng vai thiếu
-- cho đúng bảng đó (ADR-018 §7.3), và ghi vào RLS_COVERAGE_MATRIX.md kèm lý do.


-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY — chép TOÀN BỘ kết quả về hồ sơ
-- ============================================================================
SELECT 'Bảng CÒN hở TRUNCATE cho authenticated' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='authenticated' AND privilege_type='TRUNCATE'
           AND table_schema='public' AND table_name IN (
             'costings','costing_items','inquiries','style_bom',
             'production_orders','material_requests','order_milestones',
             'change_requests','risk_assessments','sample_submissions',
             'order_size_breakdown','seasons','customers','customer_contacts',
             'styles','style_colorways','style_sizes','style_operations',
             'ta_templates','ta_template_items','md_documents','md_comments')) AS ket_qua,
       '0' AS ky_vong
UNION ALL
SELECT 'Bảng CÒN hở DELETE (chờ 6 bảng của TD-25)',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='authenticated' AND privilege_type='DELETE'
           AND table_schema='public' AND table_name IN (
             'costings','costing_items','inquiries','style_bom',
             'production_orders','material_requests','order_milestones',
             'change_requests','risk_assessments','sample_submissions',
             'order_size_breakdown','seasons','customers','customer_contacts',
             'styles','style_colorways','style_sizes','style_operations',
             'ta_templates','ta_template_items','md_documents','md_comments')), '6'
UNION ALL
SELECT 'Bảng CÒN policy authenticated_only',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND policyname='authenticated_only'
           AND tablename IN (
             'costings','costing_items','inquiries','style_bom',
             'production_orders','material_requests','order_milestones',
             'change_requests','risk_assessments','sample_submissions',
             'order_size_breakdown','seasons','customers','customer_contacts',
             'styles','style_colorways','style_sizes','style_operations',
             'ta_templates','ta_template_items','md_documents','md_comments')), '0'
UNION ALL
SELECT '⭐ Policy _read mới (phải đủ 22)',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND policyname LIKE '%\_read'), '22'
UNION ALL
SELECT '⭐ buyer_denied VẪN nguyên vẹn (không được đụng)',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND policyname='buyer_denied'
           AND tablename='costings'), '1'
UNION ALL
SELECT '⭐ subcon_denied VẪN nguyên vẹn (không được đụng)',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND policyname='subcon_denied'
           AND tablename='costings'), '1'
UNION ALL
SELECT '⭐ Phép chiếu kế toán đã dựng',
       (SELECT COUNT(*)::TEXT FROM pg_views
         WHERE schemaname='public' AND viewname='v_costing_approved'), '1'
UNION ALL
SELECT 'Hàm dựng đã được dọn',
       (SELECT COUNT(*)::TEXT FROM pg_proc
         WHERE proname='mos_narrow_md_table'), '0'
UNION ALL
SELECT '⭐ service_role GIỮ NGUYÊN DELETE trên costings',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='service_role' AND privilege_type='DELETE'
           AND table_schema='public' AND table_name='costings'), '1';
