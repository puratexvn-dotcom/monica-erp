-- ============================================================================
-- MONICA MOS — 028 · ĐỊA ĐIỂM SẢN XUẤT
--
-- Bước 2/6 của Assignment Core Domain.
-- Quyết định: docs/assignment/ADR-001-site-and-operation.md (đã được duyệt)
--
-- ─── MIGRATION NHẸ NHẤT TRONG SÁU CÁI ────────────────────────────────────
-- MỘT bảng mới · MỘT cột thêm · KHÔNG một dòng dữ liệu nào.
--
-- ─── HAI ĐIỀU ADR ĐÃ LOẠI BỎ KHỎI MIGRATION NÀY ──────────────────────────
--
-- ① KHÔNG tạo bảng `operations`.
--    `style_operations` ĐÃ TỒN TẠI (id · style_id · seq_no · operation ·
--    machine_type · sam_minutes) và đang được bốn tệp của /md dùng. Nó mô hình
--    hoá TỐT HƠN một danh mục toàn cục vì có `style_id`: Assignment luôn thuộc
--    một PO → một mã hàng, nên công đoạn PHẢI là công đoạn CỦA mã hàng đó.
--    Danh mục toàn cục sẽ cho phép giao "Tra tay" cho mã hàng không có công
--    đoạn tra tay, và không gì chặn được.
--
-- ② KHÔNG tạo `buildings` / `floors`.
--    QUYẾT ĐỊNH CÓ CHỦ ĐÍCH, không phải bỏ sót. Đo được: 3 chuyền · 1 kho ·
--    11 phòng ban · 0 dữ liệu đa toà nhà ở bất kỳ đâu trong lược đồ. Không màn
--    hình nào cần biết chuyền 1 ở tầng mấy. Thêm sau là ADD COLUMN — rẻ; dựng
--    sẵn hai bảng rỗng thì phải bảo trì mãi.
--
-- ─── VÌ SAO `production_sites` CHỨ KHÔNG `factories` ─────────────────────
-- "Factory" hàm ý xưởng CỦA MONICA. Bảng này phải chứa cả Xưởng Minh Phát, Nhà
-- máy giặt Củ Chi, Xưởng in Tân Bình — địa điểm của ĐỐI TÁC. Chi phí đổi tên
-- bằng KHÔNG vì `factories` chưa tồn tại, và `orders.factory_name` là chữ tự do
-- với CẢ HAI đơn thật đều NULL.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. production_sites
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.production_sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_code   VARCHAR(50) NOT NULL,
  name        TEXT NOT NULL,

  site_type   VARCHAR(20) NOT NULL DEFAULT 'MIXED',

  -- ⚠️ NULL ở đây LÀ NGỮ NGHĨA HỢP LỆ, không phải "chưa xác định":
  --      NULL      = địa điểm CỦA MONICA
  --      NOT NULL  = địa điểm của đối tác đó
  -- Có đúng hai khả năng và NULL biểu diễn một trong hai. Khác hẳn quy ước
  -- "NULL = tất cả" mà ADR đã loại bỏ khỏi phạm vi Assignment.
  owner_partner_id UUID REFERENCES public.partners(id) ON DELETE RESTRICT,

  address     TEXT,
  country     VARCHAR(100),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ,
  updated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at  TIMESTAMPTZ,
  deleted_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  CONSTRAINT production_sites_type_valid CHECK (site_type IN
    ('SEWING', 'CUTTING', 'FINISHING', 'WASHING', 'PRINTING', 'MIXED'))
);

-- ⚠️ `ON DELETE RESTRICT` chứ KHÔNG `SET NULL` cho `owner_partner_id`.
-- `SET NULL` sẽ biến địa điểm của một đối tác vừa bị xoá thành "địa điểm của
-- Monica" một cách âm thầm — đổi hẳn ngữ nghĩa của dòng đó. Thà chặn việc xoá
-- và bắt người dùng xử lý địa điểm trước.

CREATE UNIQUE INDEX IF NOT EXISTS uq_production_sites_code_active
  ON public.production_sites (site_code) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_production_sites_owner
  ON public.production_sites (owner_partner_id) WHERE deleted_at IS NULL AND is_active;

COMMENT ON TABLE public.production_sites IS
  'Địa điểm vật lý nơi sản xuất diễn ra — của Monica LẪN của đối tác. '
  'owner_partner_id NULL = địa điểm của Monica.';

-- ⚠️ KHÔNG chèn dòng nào. Nghiệp vụ tự khai địa điểm.
-- Hệ thống không biết Monica có mấy xưởng, tên gì, ở đâu — bịa ra một "Xưởng
-- chính" là tạo dữ liệu giả mà mọi báo cáo về sau sẽ dựa vào.

-- ════════════════════════════════════════════════════════════════════════════
-- 2. sewing_lines — GẮN CHUYỀN VÀO ĐỊA ĐIỂM
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.sewing_lines
  ADD COLUMN IF NOT EXISTS site_id UUID
    REFERENCES public.production_sites(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_sewing_lines_site ON public.sewing_lines (site_id);

-- ─── NULL Ở ĐÂY ĐÚNG NGHĨA "CHƯA XÁC ĐỊNH" ───────────────────────────────
-- Ba chuyền hiện có (LINE-01, LINE-02, LINE-03) chưa biết thuộc địa điểm nào —
-- vì trước migration này hệ thống KHÔNG CÓ khái niệm địa điểm.
--
-- ⚠️ TRẠNG THÁI CHUYỂN TIẾP, KHÔNG PHẢI ĐÍCH ĐẾN (Chỉ thị Mục 6).
-- Mục tiêu cuối: MỌI sewing_line thuộc một production_site hợp lệ, và cột này
-- thành NOT NULL.
--
-- Không đặt NOT NULL ngay được vì chưa có địa điểm nào để gán, và tự sinh một
-- địa điểm giả để lấp chỗ là đúng thứ ADR đã loại bỏ.
--
-- Lộ trình siết lại:
--   1. Nghiệp vụ khai địa điểm thật qua màn hình quản trị
--   2. Gán từng chuyền vào địa điểm
--   3. Khi truy vấn đối chiếu cuối tệp này trả về 0, chạy:
--        ALTER TABLE public.sewing_lines ALTER COLUMN site_id SET NOT NULL;
--
-- Truy vấn ở Mục 5 báo con số đó mỗi lần chạy lại migration — nợ này không
-- biến mất khỏi tầm mắt.

-- ════════════════════════════════════════════════════════════════════════════
-- 3. ĐÓNG DẤU  (Quyết định 5: trigger chỉ VALIDATE · REJECT · AUDIT)
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.production_site_stamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  ELSE
    NEW.updated_by := auth.uid();
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      NEW.deleted_by := COALESCE(NEW.deleted_by, auth.uid());
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Hàm riêng thay vì dùng lại `partner_stamp()`: hàm đó rẽ nhánh theo
-- TG_TABLE_NAME để biết bảng nào có `deleted_at`. Nhồi thêm một nhánh nữa vào
-- đó sẽ biến nó thành hàm biết quá nhiều bảng — mỗi bảng mới là một lần sửa
-- một hàm dùng chung, và một lần có thể làm hỏng bảng khác.
DROP TRIGGER IF EXISTS production_sites_stamp_trg ON public.production_sites;
CREATE TRIGGER production_sites_stamp_trg
  BEFORE INSERT OR UPDATE ON public.production_sites
  FOR EACH ROW EXECUTE FUNCTION public.production_site_stamp();

-- ════════════════════════════════════════════════════════════════════════════
-- 4. RLS — CHẶN SẠCH NGƯỜI NGOÀI Ở GIAI ĐOẠN NÀY
-- ════════════════════════════════════════════════════════════════════════════
-- Cùng lý lẽ với migration 027: `mos_partner_id()` thuộc Permission Engine và
-- sinh ra ở 030. Mở quyền "đối tác đọc được địa điểm của chính mình" trước khi
-- có hàm phân giải là mở bằng một điều kiện chưa tồn tại.
--
-- Sai sót phải nghiêng về phía KHOÁ LẠI. 030 sẽ nới đúng mức.
ALTER TABLE public.production_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_sites FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "production_sites_internal_only" ON public.production_sites;
CREATE POLICY "production_sites_internal_only" ON public.production_sites
  FOR ALL TO authenticated
  USING      (NOT public.mos_is_external())
  WITH CHECK (NOT public.mos_is_external());

GRANT SELECT, INSERT, UPDATE ON public.production_sites TO authenticated;
-- Không cấp DELETE: bảng dùng xoá mềm.

-- ════════════════════════════════════════════════════════════════════════════
-- 5. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Bảng production_sites' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'production_sites') AS ket_qua,
       '1' AS ky_vong
UNION ALL
SELECT 'KHÔNG sinh dữ liệu mẫu (nghiệp vụ tự khai)',
       (SELECT COUNT(*)::TEXT FROM public.production_sites), '0'
UNION ALL
SELECT 'KHÔNG tạo bảng operations (dùng style_operations có sẵn)',
       (SELECT COUNT(*)::TEXT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'operations'), '0'
UNION ALL
SELECT 'style_operations vẫn còn nguyên, không bị đụng',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name = 'style_operations'
           AND column_name IN ('style_id','seq_no','operation','machine_type','sam_minutes')), '5'
UNION ALL
SELECT 'KHÔNG tạo buildings / floors (có chủ đích)',
       (SELECT COUNT(*)::TEXT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN ('buildings','floors')), '0'
UNION ALL
SELECT 'Cột site_id trên sewing_lines',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name = 'sewing_lines' AND column_name = 'site_id'), '1'
UNION ALL
SELECT 'owner_partner_id dùng RESTRICT, không SET NULL',
       (SELECT COUNT(*)::TEXT FROM pg_constraint
         WHERE conrelid = 'public.production_sites'::regclass
           AND contype = 'f' AND confdeltype = 'r'), '1'
UNION ALL
SELECT 'RLS bật + cưỡng chế',
       (SELECT (relrowsecurity AND relforcerowsecurity)::TEXT FROM pg_class
         WHERE oid = 'public.production_sites'::regclass), 'true'
UNION ALL
SELECT '⚠️ NỢ CHUYỂN TIẾP — chuyền CHƯA gán địa điểm',
       (SELECT COUNT(*)::TEXT FROM public.sewing_lines WHERE site_id IS NULL),
       '3 lúc này · MỤC TIÊU 0 rồi SET NOT NULL'
UNION ALL
SELECT 'orders.factory_name KHÔNG bị đụng',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_name = 'orders' AND column_name = 'factory_name'), '1'
UNION ALL
SELECT 'partners (027) còn nguyên 5 dòng',
       (SELECT COUNT(*)::TEXT FROM public.partners), '5';
