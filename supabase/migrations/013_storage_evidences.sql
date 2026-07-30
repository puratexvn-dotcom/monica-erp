-- ============================================================================
-- MONICA GARMENT ERP — 013: BUCKET LƯU ẢNH BẰNG CHỨNG
--
-- Tạo bucket `evidences` để lưu ảnh công nhân chụp khi khai báo sản lượng
-- (bó hàng, bảng ghi tay, phiếu bàn cắt...).
--
-- CHẠY: dán toàn bộ vào Supabase Dashboard > SQL Editor > Run.
-- Chạy được nhiều lần (idempotent).
--
-- ⚠️ CẢNH BÁO VỀ "PUBLIC ĐỌC ĐƯỢC" ─────────────────────────────────────────
-- Bucket đặt public = true theo yêu cầu, nghĩa là BẤT KỲ AI có đường dẫn đều
-- xem được ảnh, không cần đăng nhập. Ảnh bằng chứng sản xuất có thể chứa mã PO,
-- tên khách hàng, số lượng trên bảng ghi — tức là dữ liệu kinh doanh.
--
-- Đường dẫn có chứa UUID nên không đoán được, nhưng "khó đoán" KHÔNG phải là
-- kiểm soát truy cập: URL bị dán vào Zalo, gửi qua email, hay lọt vào lịch sử
-- trình duyệt là ai cũng mở được mãi mãi.
--
-- Khi cần siết lại: đổi bucket thành private (public = false), xoá policy
-- "evidences_public_read" bên dưới, rồi cho ứng dụng phát Signed URL có hạn
-- (supabase.storage.from('evidences').createSignedUrl(path, 3600)).
-- Phần code đọc URL nằm gọn trong app/actions/upload-action.ts nên chỉ phải
-- sửa một chỗ.
-- ============================================================================

-- ─── 1. TẠO BUCKET ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidences',
  'evidences',
  TRUE,
  8388608,  -- 8 MB, khớp giới hạn đang kiểm ở client
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 2. POLICY TRÊN storage.objects ─────────────────────────────────────────
-- storage.objects đã bật RLS sẵn từ Supabase. Ta chỉ thêm policy giới hạn
-- trong đúng bucket này, KHÔNG đụng tới các bucket khác.
DROP POLICY IF EXISTS "evidences_public_read"        ON storage.objects;
DROP POLICY IF EXISTS "evidences_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "evidences_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "evidences_authenticated_delete" ON storage.objects;

-- Đọc: ai cũng được (xem cảnh báo ở đầu file)
CREATE POLICY "evidences_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'evidences');

-- Ghi: chỉ người đã đăng nhập
CREATE POLICY "evidences_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'evidences' AND auth.uid() IS NOT NULL);

-- Sửa/xoá: CHỈ chủ sở hữu tệp đó.
-- Cố ý không cho mọi authenticated xoá chung: ảnh bằng chứng mà ai cũng xoá
-- được thì mất luôn giá trị đối chiếu khi có tranh chấp sản lượng.
CREATE POLICY "evidences_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'evidences' AND owner = auth.uid());

CREATE POLICY "evidences_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'evidences' AND owner = auth.uid());

-- ─── 3. TỰ KIỂM TRA ─────────────────────────────────────────────────────────
DO $$
DECLARE n INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'evidences') THEN
    RAISE EXCEPTION 'Không tạo được bucket evidences';
  END IF;

  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname LIKE 'evidences_%';

  IF n < 4 THEN
    RAISE EXCEPTION 'Chỉ có % policy cho evidences, cần 4', n;
  END IF;

  RAISE NOTICE 'OK: bucket evidences đã sẵn sàng với % policy.', n;
END $$;

-- Bảng chẩn đoán — chụp lại gửi nếu upload vẫn lỗi
SELECT id AS bucket, public AS cong_khai, file_size_limit AS gioi_han_byte
FROM storage.buckets WHERE id = 'evidences';

SELECT policyname AS policy, cmd AS thao_tac, roles AS ap_cho_role
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'evidences_%'
ORDER BY policyname;
