-- ============================================================================
-- MONICA ONE — 057 · KHO BẰNG CHỨNG RIÊNG TƯ · BẤT BIẾN · NHẬN PDF
--
-- 📐 Board Directive *EVIDENCE SECURITY IMPLEMENTATION* 08/08/2026
-- 📐 ADR-031 (kèm theo) · `MONICA_ONE_EVIDENCE_SECURITY_PLAN.md`
--
-- ⚠️ Chạy SAU `056`. Idempotent. ⛔ KHÔNG xoá một tệp nào.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ① 🔴 BA KHUYẾT TẬT ĐÃ ĐO BẰNG HÀNH VI, ⛔ KHÔNG SUY ĐOÁN
-- ════════════════════════════════════════════════════════════════════════════
-- Đo 08/08/2026 trên kho lưu trữ đang chạy:
--
--   ⓐ Tải tệp bằng phiên `md001`, rồi gọi URL bằng `fetch` TRẦN
--     *(⛔ không cookie, ⛔ không apikey, ⛔ không đăng nhập)*  →  **HTTP 200**
--     ⇒ Ảnh sản lượng · packing list · **PO của khách** — ai có URL đều mở
--       được. Đây là dữ liệu thương mại của **bên thứ ba** mà nhà máy giữ hộ.
--
--   ⓑ `md001` **tự xoá được** tệp mình tải  →  ĐƯỢC, ⛔ không một dòng vết.
--     ⇒ Cùng họ khuyết tật với lỗ hổng `activity_log` mà `056` vừa đóng:
--       người ghi con số tự xoá được bằng chứng của chính con số đó.
--
--   ⓒ Tải PDF  →  **BỊ TỪ CHỐI**: `mime type application/pdf is not supported`
--     ⇒ `upload-action.ts` CÓ `application/pdf`; `allowed_mime_types` của
--       bucket thì ⛔ KHÔNG. Hai allowlist, chỉ một cái được sửa hôm 06/08.
--       Người dùng chọn được PDF trên màn hình rồi Supabase từ chối.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ② 🔑 THỜI ĐIỂM — VÌ SAO CHẠY BÂY GIỜ RẺ HƠN HẲN
-- ════════════════════════════════════════════════════════════════════════════
--   Tệp trong bucket ............... **0**
--   Tham chiếu tệp trong CSDL ...... **0**  (đã đếm 11 cột)
--   Nơi mã gọi `getPublicUrl` ...... **1**
--
-- ⇒ ⛔ Không tệp nào phải chuyển, ⛔ không URL nào phải viết lại, ⛔ không màn
--   hình nào gãy. Vá lúc này tốn **một migration**; vá khi có 5.000 tệp tốn
--   thêm một cuộc di trú và một khoảng hệ thống chạy nửa chừng.
--
-- ⚠️ Và điều quan trọng hơn: **⛔ CHƯA có URL công khai nào từng được phát ra
--    ngoài.** Lùi được lỗ hổng, nhưng ⛔ không lùi được một URL đã rò.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ③ MÔ HÌNH SAU MIGRATION
-- ════════════════════════════════════════════════════════════════════════════
--   ĐỌC     ⛔ KHÔNG policy nào cho phép. Chỉ vào được bằng **Signed URL** do
--           `app/actions/evidence-url-action.ts` phát, SAU KHI:
--             ① tra `md_documents` xem tệp có THUỘC bản ghi đó ⛔  (chống IDOR)
--             ② đọc bản ghi cha bằng **phiên của chính người gọi**  (hỏi RLS)
--   GHI     `authenticated` — giữ nguyên. Sổ ngừng nhận là hỏng nặng hơn.
--   SỬA     ⛔ KHÔNG AI. Thay tệp = tải tệp mới, ⛔ không ghi đè.
--   XOÁ     ⛔ KHÔNG AI. Board §4: *"Evidence là bằng chứng nghiệp vụ. ⛔ Không
--           cho user tự xoá vật lý… cùng mindset với activity_log."*
--
-- 🔑 **Điểm khác biệt cốt lõi so với 4 policy cũ:** chúng chỉ hỏi *"đã đăng
--    nhập chưa"* và *"có phải người tải lên ⛔"*. ⛔ Không cái nào hỏi *"người
--    này có quyền với ĐƠN HÀNG đó ⛔"*. Phép kiểm nghiệp vụ nay nằm ở Server
--    Action, nơi **hỏi được RLS của bảng cha**.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ④ ⚠️ GIỚI HẠN — NÓI THẲNG
-- ════════════════════════════════════════════════════════════════════════════
--   anon · authenticated ........ ✅ ⛔ không đọc trực tiếp được
--   service_role ................ ⚠️ **VẪN ĐỌC/XOÁ ĐƯỢC** — `BYPASSRLS`, và
--                                 storage ⛔ không có trigger như `056`.
--                                 ⇒ Khoá `service_role` **⛔ KHÔNG được để lọt
--                                   xuống trình duyệt** *(đã đúng: nó chỉ ở
--                                   máy chủ và script chạy tay)*.
--   superuser ................... 🔴 ⛔ KHÔNG chặn được — như mọi thứ khác.
--
-- ⇒ Phát biểu trung thực: **kín với mọi đường ứng dụng và mọi người dùng cuối;
--   ⛔ KHÔNG kín trước người cầm khoá `service_role` hay superuser.**
--
-- ════════════════════════════════════════════════════════════════════════════
-- ⑤ TÍNH ĐẢO NGƯỢC — ĐẢO ĐƯỢC HOÀN TOÀN
-- ════════════════════════════════════════════════════════════════════════════
--   UPDATE storage.buckets SET public = true WHERE id = 'evidences';
--   CREATE POLICY "evidences_public_read" ON storage.objects
--     FOR SELECT TO public USING (bucket_id = 'evidences');
--   CREATE POLICY "evidences_authenticated_delete" ON storage.objects
--     FOR DELETE TO authenticated USING (bucket_id='evidences' AND owner=auth.uid());
--   ⚠️ Đảo là **mở lại lỗ hổng P0 và P1**. Chỉ làm khi có quyết định Board.
-- ============================================================================

BEGIN;

-- ─── 1. BUCKET: RIÊNG TƯ + NHẬN PDF ────────────────────────────────────────
-- 🔴 Danh sách MIME dưới đây là **BẢN CHÉP** của `lib/mos/evidence/mime.ts`.
--    SQL ⛔ không đọc được TypeScript, nên *"một nguồn sự thật"* ở đây thi hành
--    bằng **một phép ĐO**: `scripts/kiem-bang-chung.mjs` so hai bên và **HỎNG**
--    nếu lệch. Đó là thứ duy nhất khiến lời hứa ấy thành sự thật — hai tầng ⛔
--    không tự đồng bộ được, nhưng **phát hiện được lúc chúng trôi ra xa nhau**.
UPDATE storage.buckets
   SET public = false,
       file_size_limit = 8388608,
       allowed_mime_types = ARRAY[
         'image/jpeg', 'image/png', 'image/webp',
         'image/heic', 'image/heif', 'application/pdf'
       ]
 WHERE id = 'evidences';

-- ─── 2. GỠ BỐN POLICY CŨ ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "evidences_public_read"           ON storage.objects;
DROP POLICY IF EXISTS "evidences_authenticated_update"  ON storage.objects;
DROP POLICY IF EXISTS "evidences_authenticated_delete"  ON storage.objects;
-- ⚠️ `evidences_authenticated_insert` gỡ rồi dựng lại để tệp này **tự đứng
--    vững**, ⛔ không phụ thuộc thứ tự chạy của `013`.
DROP POLICY IF EXISTS "evidences_authenticated_insert"  ON storage.objects;

-- ─── 3. GHI: GIỮ. ĐỌC · SỬA · XOÁ: ⛔ KHÔNG AI ─────────────────────────────
-- 🔑 ⛔ **Không dựng policy `SELECT` nào.** `createSignedUrl` chạy ở tầng
--    Storage API và **⛔ không cần** policy `SELECT` — nó ký bằng khoá dự án.
--    Nhờ vậy đường đọc duy nhất đi qua Server Action, nơi có phép kiểm nghiệp
--    vụ. Dựng thêm một policy `SELECT` "cho tiện" là mở lại đúng cửa vừa đóng.
CREATE POLICY "evidences_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'evidences' AND auth.uid() IS NOT NULL);

-- ════════════════════════════════════════════════════════════════════════════
-- ⑥ TỰ KIỂM — ĐO LƯỢC ĐỒ. Hành vi đo bằng `scripts/kiem-bang-chung.mjs`.
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_public BOOLEAN; v_mime TEXT[]; v_dem INT;
BEGIN
  SELECT public, allowed_mime_types INTO v_public, v_mime
    FROM storage.buckets WHERE id = 'evidences';

  IF v_public IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.1: ⛔ không tìm thấy bucket `evidences`.';
  END IF;
  IF v_public THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.2: bucket VẪN CÔNG KHAI.';
  END IF;
  IF NOT ('application/pdf' = ANY(v_mime)) THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.3: bucket VẪN ⛔ không nhận PDF (thấy %).', v_mime;
  END IF;
  IF array_length(v_mime, 1) <> 6 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.4: allowlist có % mục, cần 6 — lệch lib/mos/evidence/mime.ts.',
      array_length(v_mime, 1);
  END IF;

  -- 6.5 🔴 ⛔ KHÔNG policy nào cho ĐỌC · SỬA · XOÁ
  SELECT count(*) INTO v_dem FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects'
     AND policyname LIKE 'evidences_%' AND cmd IN ('SELECT', 'UPDATE', 'DELETE');
  IF v_dem <> 0 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.5: còn % policy đọc/sửa/xoá trên bucket.', v_dem;
  END IF;

  -- ⭐ 6.6 CẶP `K-3`: GHI phải CÒN. Chặn phẳng ⛔ không phải khoanh đúng.
  SELECT count(*) INTO v_dem FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects'
     AND policyname = 'evidences_authenticated_insert' AND cmd = 'INSERT';
  IF v_dem <> 1 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 6.6: MẤT policy GHI — kho ⛔ không nhận bằng chứng nữa.';
  END IF;

  RAISE NOTICE '✅ TỰ KIỂM 057: 6/6 ĐẠT.';
END $$;

COMMIT;

-- ── BÁO CÁO KỲ VỌNG ⟷ THỰC TẾ ──────────────────────────────────────────────
SELECT 'bucket evidences còn công khai' AS muc,
       (SELECT public::text FROM storage.buckets WHERE id = 'evidences') AS thuc_te,
       'false' AS ky_vong
UNION ALL
SELECT 'số định dạng nhận (khớp lib/mos/evidence/mime.ts)',
       (SELECT array_length(allowed_mime_types, 1)::text FROM storage.buckets WHERE id = 'evidences'), '6'
UNION ALL
SELECT 'nhận PDF',
       (SELECT ('application/pdf' = ANY(allowed_mime_types))::text FROM storage.buckets WHERE id = 'evidences'), 'true'
UNION ALL
SELECT 'policy ĐỌC/SỬA/XOÁ còn lại',
       (SELECT count(*)::text FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
         AND policyname LIKE 'evidences_%' AND cmd IN ('SELECT','UPDATE','DELETE')), '0'
UNION ALL
SELECT '⭐ policy GHI vẫn còn',
       (SELECT count(*)::text FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
         AND policyname = 'evidences_authenticated_insert'), '1';

-- ⚠️ SAU KHI CHẠY:  node scripts/kiem-bang-chung.mjs
-- ============================================================================
