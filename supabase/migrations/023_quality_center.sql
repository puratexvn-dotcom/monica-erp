-- ============================================================================
-- MONICA MOS — 023 · TRUNG TÂM CHẤT LƯỢNG
--
-- BA VIỆC:
--   1. Danh mục lỗi chuẩn hoá  → biểu đồ Pareto mới có nghĩa
--   2. Vị trí lỗi trên sản phẩm → dựng được bản đồ nhiệt
--   3. Bảng CAPA đúng nghĩa     → thay cho ô ghi chú tự do đang có
--
-- ─── VÌ SAO PHẢI CÓ DANH MỤC LỖI ─────────────────────────────────────────
-- Đo trên cơ sở dữ liệu đang chạy: 10 dòng qa_logs cho ra 10 giá trị
-- defect_type KHÁC NHAU, mỗi giá trị đúng một lần. Pareto gom theo chuỗi sẽ ra
-- mười cột bằng nhau — không chỉ ra được lỗi nào phổ biến, tức mất trọn mục
-- đích của biểu đồ.
--
-- Tệ hơn, có dòng ghi HAI lỗi trong một ô: "Nhăn mũi may + Loang màu", trong
-- khi "Nhăn mũi may" và "Loang màu (khác shade)" đã là hai dòng riêng. Gom theo
-- chuỗi sẽ đếm cặp đó thành một loại thứ ba không tồn tại.
--
-- ─── VÌ SAO KHÔNG DÙNG KIỂU ENUM CỦA POSTGRES ────────────────────────────
-- ALTER TYPE ... ADD VALUE không chạy được trong giao dịch ở nhiều phiên bản,
-- và giá trị đã thêm thì KHÔNG XOÁ ĐƯỢC. Thêm một vị trí áo mới sẽ thành một
-- cuộc phẫu thuật. Toàn bộ codebase này dùng VARCHAR + CHECK (qa_status,
-- entity_type, npl_status...) — giữ đúng lối đó.
--
-- ⚠️ KHÔNG xoá cột `capa_note` đang có trên qa_logs. Dữ liệu cũ nằm ở đó.
-- Việc bỏ hẳn nên là một bước riêng, sau khi chắc chắn đã chuyển hết.
--
-- CHỈ THÊM MỚI. Không sửa bảng đang chạy, không sửa policy của 11 vai trò.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. DANH MỤC LỖI  (Phương án B đã được duyệt)
-- ════════════════════════════════════════════════════════════════════════════
-- Đây là DỮ LIỆU DANH MỤC, không phải nhãn giao diện: người dùng thêm bớt được
-- mà không cần migration. Vì vậy tên nằm trong bảng chứ không nằm ở từ điển
-- i18n — từ điển chỉ chứa chuỗi do lập trình viên viết.
CREATE TABLE IF NOT EXISTS public.defect_catalog (
  code        VARCHAR(30) PRIMARY KEY,
  name_vi     VARCHAR(120) NOT NULL,
  name_en     VARCHAR(120),
  -- Nhóm để lọc nhanh: lỗi may · lỗi vải · lỗi phụ liệu · lỗi hoàn thiện
  category    VARCHAR(20) NOT NULL DEFAULT 'SEWING'
              CHECK (category IN ('SEWING', 'FABRIC', 'TRIM', 'FINISHING', 'PACKING')),
  -- Mức mặc định khi QC chọn lỗi này; QC vẫn đổi được trên từng phiếu
  default_class VARCHAR(20) NOT NULL DEFAULT 'MINOR'
              CHECK (default_class IN ('CRITICAL', 'MAJOR', 'MINOR')),
  sort_order  INTEGER NOT NULL DEFAULT 100,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Danh mục khởi tạo: các lỗi chuẩn của ngành may, KHÔNG phải dữ liệu giả.
-- Đây là dữ liệu cấu hình — cùng loại với bảng `roles` được seed ở 017.
-- ON CONFLICT DO NOTHING: chạy lại không ghi đè phần người dùng đã sửa tên.
INSERT INTO public.defect_catalog (code, name_vi, name_en, category, default_class, sort_order) VALUES
  ('SKIP_STITCH',   'Bỏ mũi',                    'Skipped stitch',      'SEWING',    'MAJOR', 10),
  ('BROKEN_THREAD', 'Đứt chỉ',                   'Broken thread',       'SEWING',    'MAJOR', 20),
  ('LOOSE_THREAD',  'Chỉ thừa',                  'Loose thread',        'SEWING',    'MINOR', 30),
  ('PUCKERING',     'Nhăn mũi may',              'Puckering',           'SEWING',    'MAJOR', 40),
  ('SKEWED_SEAM',   'Lệch đường may',            'Skewed seam',         'SEWING',    'MAJOR', 50),
  ('OPEN_SEAM',     'Sổ đường may',              'Open seam',           'SEWING',    'CRITICAL', 60),
  ('UNEVEN_STITCH', 'Mũi may không đều',         'Uneven stitching',    'SEWING',    'MINOR', 70),
  ('SHADE_VAR',     'Loang màu / khác tông',     'Shade variation',     'FABRIC',    'MAJOR', 110),
  ('FABRIC_HOLE',   'Thủng vải',                 'Fabric hole',         'FABRIC',    'CRITICAL', 120),
  ('FABRIC_STAIN',  'Vết bẩn trên vải',          'Fabric stain',        'FABRIC',    'MAJOR', 130),
  ('SLUB',          'Gút sợi',                   'Slub',                'FABRIC',    'MINOR', 140),
  ('STRIPE_MISMATCH','Lệch sọc / lệch caro',     'Stripe mismatch',     'FABRIC',    'MAJOR', 150),
  ('ZIPPER_DEFECT', 'Khoá kéo hỏng',             'Zipper defect',       'TRIM',      'CRITICAL', 210),
  ('BUTTON_DEFECT', 'Nút lỗi / lệch',            'Button defect',       'TRIM',      'MAJOR', 220),
  ('LABEL_WRONG',   'Sai nhãn mác',              'Wrong label',         'TRIM',      'CRITICAL', 230),
  ('OIL_STAIN',     'Dơ dầu máy',                'Oil stain',           'FINISHING', 'MAJOR', 310),
  ('POOR_IRONING',  'Ủi không phẳng',            'Poor ironing',        'FINISHING', 'MINOR', 320),
  ('WRONG_FOLD',    'Gấp sai quy cách',          'Wrong folding',       'PACKING',   'MINOR', 410),
  ('WRONG_QTY',     'Sai số lượng đóng gói',     'Wrong packing qty',   'PACKING',   'CRITICAL', 420),
  ('OTHER',         'Lỗi khác',                  'Other',               'SEWING',    'MINOR', 900)
ON CONFLICT (code) DO NOTHING;

GRANT SELECT ON public.defect_catalog TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. qa_logs — MÃ LỖI CHUẨN + VỊ TRÍ LỖI
-- ════════════════════════════════════════════════════════════════════════════
-- Cột defect_type CŨ giữ nguyên làm nhãn dự phòng: dòng chưa gán mã vẫn đọc
-- được, và luồng nhập liệu QA hiện có không phải sửa một dòng nào.
ALTER TABLE public.qa_logs
  ADD COLUMN IF NOT EXISTS defect_code     VARCHAR(30)
    REFERENCES public.defect_catalog(code) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS defect_location VARCHAR(30);

-- Hai mươi vị trí, mã tiếng Anh để không vỡ khi đổi ngôn ngữ hiển thị.
-- CỐ Ý cho phép NULL: lỗi vải phát hiện lúc kiểm nguyên phụ liệu không thuộc
-- vị trí may nào, và các dòng cũ đang có sẽ NULL hết — ép NOT NULL là buộc
-- phải bịa vị trí cho chúng.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qa_logs_defect_location_valid') THEN
    ALTER TABLE public.qa_logs ADD CONSTRAINT qa_logs_defect_location_valid
      CHECK (defect_location IS NULL OR defect_location IN (
        'COLLAR','SHOULDER','SLEEVE','CUFF','PLACKET',
        'FRONT_BODY','BACK_BODY','SIDE_SEAM','POCKET','HEM',
        'WAISTBAND','FLY','RISE','THIGH','KNEE','LEG_OPENING','BELT_LOOP',
        'FABRIC','LABEL','PACKING','OTHER'));
  END IF;
END $$;

-- Gán mã cho dữ liệu cũ ở mức CHẮC CHẮN ĐÚNG. Cố ý KHÔNG đoán:
-- "Nhăn mũi may + Loang màu" là HAI lỗi trong một ô — không có mã nào đúng cho
-- nó, nên để NULL và giao diện sẽ hiện nhãn chữ cũ. Đoán bừa một trong hai sẽ
-- làm sai chính con số Pareto mà cả việc này sinh ra để sửa.
UPDATE public.qa_logs SET defect_code = 'PUCKERING'      WHERE defect_code IS NULL AND defect_type = 'Nhăn mũi may';
UPDATE public.qa_logs SET defect_code = 'BROKEN_THREAD'  WHERE defect_code IS NULL AND defect_type IN ('Đứt chỉ', 'Đứt chỉ diễu');
UPDATE public.qa_logs SET defect_code = 'LOOSE_THREAD'   WHERE defect_code IS NULL AND defect_type = 'Chỉ thừa';
UPDATE public.qa_logs SET defect_code = 'SKIP_STITCH'    WHERE defect_code IS NULL AND defect_type = 'Bỏ mũi';
UPDATE public.qa_logs SET defect_code = 'SHADE_VAR'      WHERE defect_code IS NULL AND defect_type = 'Loang màu (khác shade)';
UPDATE public.qa_logs SET defect_code = 'STRIPE_MISMATCH' WHERE defect_code IS NULL AND defect_type = 'Lệch sọc lưng';
UPDATE public.qa_logs SET defect_code = 'ZIPPER_DEFECT'  WHERE defect_code IS NULL AND defect_type = 'Khóa/dây kéo hỏng';
UPDATE public.qa_logs SET defect_code = 'OIL_STAIN'      WHERE defect_code IS NULL AND defect_type = 'Dơ dầu máy';

CREATE INDEX IF NOT EXISTS idx_qa_logs_order_code ON public.qa_logs (order_id, defect_code);
CREATE INDEX IF NOT EXISTS idx_qa_logs_order_loc  ON public.qa_logs (order_id, defect_location);

-- ════════════════════════════════════════════════════════════════════════════
-- 3. BẢNG CAPA
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.capa_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_no           VARCHAR(50) UNIQUE NOT NULL,
  order_id          UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  -- CỐ Ý cho NULL: CAPA thường mở từ XU HƯỚNG ("ba ngày liền lỗi bỏ mũi") chứ
  -- không từ một phiếu kiểm cụ thể. Ép NOT NULL sẽ buộc người dùng chọn bừa.
  qa_log_id         UUID REFERENCES public.qa_logs(id) ON DELETE SET NULL,

  -- Chụp lại tại thời điểm mở phiếu: phiếu kiểm gốc có thể bị sửa hoặc xoá,
  -- mà một CAPA đóng cách đây sáu tháng phải đọc lại được nguyên trạng.
  defect_code       VARCHAR(30) REFERENCES public.defect_catalog(code) ON DELETE SET NULL,
  defect_label      VARCHAR(200),
  defect_location   VARCHAR(30),
  severity          VARCHAR(20) NOT NULL DEFAULT 'MAJOR'
                    CHECK (severity IN ('CRITICAL', 'MAJOR', 'MINOR')),

  -- ⚠️ BẮT BUỘC. Đây chính là thứ phân biệt CAPA với cột capa_note đã có:
  -- một hành động không kèm nguyên nhân gốc chỉ là ghi chú, và nó sẽ lặp lại
  -- ở lô sau.
  root_cause        TEXT NOT NULL CHECK (LENGTH(TRIM(root_cause)) >= 10),
  action            TEXT NOT NULL CHECK (LENGTH(TRIM(action)) >= 10),
  preventive_action TEXT,

  pic_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pic_role          VARCHAR(50),
  -- ⚠️ BẮT BUỘC: hành động không có hạn thì không bao giờ xong.
  due_date          DATE NOT NULL,

  -- VERIFYING nằm giữa IN_PROGRESS và CLOSED vì trong may mặc, CAPA KHÔNG đóng
  -- khi làm xong hành động — nó đóng khi LẦN KIỂM SAU chứng minh lỗi đã hết.
  status            VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'VERIFYING', 'CLOSED', 'CANCELLED')),
  verification_note TEXT,
  closed_at         TIMESTAMPTZ,
  closed_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  evidence_path     VARCHAR(500),

  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Đóng CAPA phải chứng minh đã kiểm chứng. Không có ràng buộc này thì bảng
  -- CAPA thành một danh sách việc đã đánh dấu hoàn thành mà lỗi vẫn nguyên.
  CONSTRAINT capa_close_needs_proof CHECK (
    status <> 'CLOSED'
    OR (closed_at IS NOT NULL AND verification_note IS NOT NULL
        AND LENGTH(TRIM(verification_note)) >= 10)
  )
);

CREATE INDEX IF NOT EXISTS idx_capa_order_status ON public.capa_logs (order_id, status);
-- Chỉ mục một phần: màn hình chỉ quan tâm CAPA CHƯA ĐÓNG. Đánh chỉ mục cả
-- những phiếu đã đóng từ ba năm trước là trả phí cho dữ liệu không ai hỏi.
CREATE INDEX IF NOT EXISTS idx_capa_due_open ON public.capa_logs (due_date)
  WHERE status <> 'CLOSED' AND status <> 'CANCELLED';

-- ── Đóng dấu người tạo và thời điểm sửa ở MÁY CHỦ ──────────────────────────
CREATE OR REPLACE FUNCTION public.capa_stamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
  END IF;
  NEW.updated_at := NOW();
  -- Chuyển sang CLOSED mà chưa ghi mốc thì tự đóng dấu, để ràng buộc bên trên
  -- không đá ngược một thao tác hợp lệ chỉ vì thiếu một trường máy tự điền được.
  IF NEW.status = 'CLOSED' AND NEW.closed_at IS NULL THEN
    NEW.closed_at := NOW();
    NEW.closed_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capa_stamp_trg ON public.capa_logs;
CREATE TRIGGER capa_stamp_trg BEFORE INSERT OR UPDATE ON public.capa_logs
  FOR EACH ROW EXECUTE FUNCTION public.capa_stamp();

-- ════════════════════════════════════════════════════════════════════════════
-- 4. RLS
--
-- ⚠️ BÀI HỌC CỦA MIGRATION 018: vòng lặp gắn policy `buyer_denied` chỉ chạy
-- trên danh sách bảng TẠI THỜI ĐIỂM ĐÓ. Hai bảng sinh ra ở đây KHÔNG được vòng
-- lặp ấy che — mặc định của bảng mới là "có policy nào cho phép thì lọt".
--
-- CAPA chứa NGUYÊN NHÂN GỐC nội bộ: tay nghề công nhân, thiết bị hỏng, sai sót
-- của tổ trưởng. Khách hàng đọc được chỗ đó là chuyện khác hẳn việc họ xem tiến
-- độ. Chặn tuyệt đối.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.defect_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capa_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capa_logs      FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "defect_catalog_read"  ON public.defect_catalog;
DROP POLICY IF EXISTS "capa_internal_only"   ON public.capa_logs;

-- Danh mục lỗi: mọi vai trò nội bộ đọc được; buyer không cần và không được.
CREATE POLICY "defect_catalog_read" ON public.defect_catalog
  FOR SELECT TO authenticated
  USING (NOT public.mos_is_buyer());

CREATE POLICY "capa_internal_only" ON public.capa_logs
  FOR ALL TO authenticated
  USING      (NOT public.mos_is_buyer())
  WITH CHECK (NOT public.mos_is_buyer());

GRANT SELECT, INSERT, UPDATE ON public.capa_logs TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. REALTIME
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['capa_logs', 'qa_logs'] LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Danh mục lỗi' AS muc,
       (SELECT COUNT(*)::TEXT FROM public.defect_catalog) AS ket_qua, '20' AS ky_vong
UNION ALL
SELECT 'Hai cột mới trên qa_logs',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name = 'qa_logs' AND column_name IN ('defect_code', 'defect_location')), '2'
UNION ALL
SELECT 'Dòng cũ đã gán được mã lỗi',
       (SELECT COUNT(*)::TEXT FROM public.qa_logs WHERE defect_code IS NOT NULL), '9'
UNION ALL
SELECT 'Dòng cố ý để trống (ô ghi hai lỗi)',
       (SELECT COUNT(*)::TEXT FROM public.qa_logs WHERE defect_code IS NULL), '1'
UNION ALL
SELECT 'Bảng capa_logs',
       (SELECT COUNT(*)::TEXT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'capa_logs'), '1'
UNION ALL
SELECT 'RLS bật + cưỡng chế trên capa_logs',
       (SELECT (relrowsecurity AND relforcerowsecurity)::TEXT FROM pg_class
         WHERE oid = 'public.capa_logs'::regclass), 'true'
UNION ALL
SELECT 'Ràng buộc đóng CAPA phải có bằng chứng',
       (SELECT COUNT(*)::TEXT FROM pg_constraint WHERE conname = 'capa_close_needs_proof'), '1'
UNION ALL
SELECT 'Hai bảng đã vào realtime',
       (SELECT COUNT(*)::TEXT FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime' AND tablename IN ('capa_logs', 'qa_logs')), '2'
UNION ALL
SELECT 'Cột capa_note cũ VẪN CÒN (cố ý không xoá)',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name = 'qa_logs' AND column_name = 'capa_note'), '1';
