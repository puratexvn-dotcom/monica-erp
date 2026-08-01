-- ============================================================================
-- MONICA MOS — 030 · PERMISSION ENGINE (ĐỊNH NGHĨA)
--
-- Thiết kế: docs/adr/ADR-006-permission-engine.md
-- Bộ luật gốc: lib/mos/permission/assignment-permission.ts
--
-- ⚠️ TỆP NÀY KHÔNG ĐỔI HÀNH VI CỦA BẤT KỲ AI.
-- Nó chỉ tạo một bảng master data và năm hàm. **Không policy nào tham chiếu
-- tới chúng cho tới 031.** Chạy xong, mọi phép kiểm hiện có phải xanh y nguyên.
--
-- Đó là cả điểm của việc tách 030 khỏi 031: định nghĩa được rà soát, đo đạc và
-- kiểm thử **trước khi** nó có quyền lực gì.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. partner_permissions — CHIỀU THỨ NHẤT: ĐỘNG VÀO BẢNG NÀO
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ BẢNG NÀY KHÔNG PHẢI CỔNG CHÍNH. Cổng chính là ASSIGNMENT.
--
--     partner_permissions  →  động vào BẢNG nào   (thô, theo LOẠI đối tác)
--     Assignment           →  động vào DÒNG nào   (tinh, theo phạm vi + cửa sổ)
--
-- Hai chiều TRỰC GIAO. Nhầm chúng với nhau là quay lại phân quyền theo vai trò
-- — đúng thứ Playbook Điều XXX sinh ra để bỏ.
--
-- Bảng này trả lời đúng một câu: *"loại đối tác này về nguyên tắc chạm vào
-- những bảng nào"*. Forwarder ghi mốc vận chuyển chứ không ghi sản lượng may;
-- Auditor ghi kết quả giám định chứ không ghi tiêu hao vật tư.
CREATE TABLE IF NOT EXISTS public.partner_permissions (
  partner_type VARCHAR(30) NOT NULL,
  resource     VARCHAR(60) NOT NULL,
  action       VARCHAR(10) NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (partner_type, resource, action),

  CONSTRAINT pp_action_valid CHECK (action IN ('READ', 'WRITE')),

  -- ⚠️ Danh sách này LẶP LẠI `partners_type_valid` của 027, và lặp lại là có
  -- chủ ý. Không có nó thì một loại gõ sai (`PRODUCTION_PARNER`) sẽ được nhận
  -- vào bảng, rồi **không khớp với đối tác nào** — đối tác mất quyền một cách
  -- bí ẩn mà không lỗi nào nổ ra.
  --
  -- Thất bại TO TIẾNG lúc seed tốt hơn hẳn im lặng lúc chạy. Đổi danh sách thì
  -- phải đổi cả hai chỗ — ghi ở đây để không ai quên.
  CONSTRAINT pp_partner_type_valid CHECK (partner_type IN (
    'BUYER',
    'PRODUCTION_PARTNER', 'SERVICE_PARTNER', 'SUPPLIER',
    'FORWARDER', 'INSPECTION', 'AUDITOR'))
);

COMMENT ON TABLE public.partner_permissions IS
  'Chiều THÔ của phân quyền: loại đối tác nào chạm vào bảng nào. Chiều TINH '
  '(dòng nào) do Assignment quyết. ADR-006.';

-- ════════════════════════════════════════════════════════════════════════════
-- 2. SEED — CHỈ HAI LOẠI ĐANG CÓ THẬT
-- ════════════════════════════════════════════════════════════════════════════
-- Đo được: `partners` có 5 dòng — 3 × PRODUCTION_PARTNER, 2 × SERVICE_PARTNER.
-- **0 Supplier · 0 Forwarder · 0 Inspection · 0 Auditor.**
--
-- ⚠️ CỐ Ý KHÔNG khai bốn loại còn lại. Khai trước là suy đoán quyền cho một
-- nghiệp vụ chưa tồn tại (Playbook Điều XXIX), và một dòng suy đoán trong bảng
-- PHÂN QUYỀN thì nguy hiểm hơn hẳn một dòng suy đoán trong bảng danh mục.
--
-- Phân công dưới đây lấy từ tài liệu 09 Mục 4 — đã duyệt, không phải tôi đoán:
--     Subcon (Production)  ghi  sản lượng · lỗi · tiêu hao · báo cáo ngày
--     Service              ghi  nhận · trả · lỗi · báo cáo ngày
INSERT INTO public.partner_permissions (partner_type, resource, action, note) VALUES
  -- ─── ĐỌC · chung cho cả hai loại ────────────────────────────────────
  ('PRODUCTION_PARTNER', 'assignments',                 'READ',  'việc được giao'),
  ('PRODUCTION_PARTNER', 'assignment_commercial_terms', 'READ',  'đơn giá CỦA CHÍNH MÌNH'),
  ('PRODUCTION_PARTNER', 'assignment_daily_reports',    'READ',  'sổ cái của chính mình'),
  ('PRODUCTION_PARTNER', 'assignment_bundles',          'READ',  'bó được giao'),
  ('PRODUCTION_PARTNER', 'cut_bundles',                 'READ',  'chi tiết bó trong phạm vi'),
  ('PRODUCTION_PARTNER', 'cut_tickets',                 'READ',  'phiếu cắt của bó trong phạm vi'),
  ('PRODUCTION_PARTNER', 'orders',                      'READ',  'chỉ đơn có việc của mình'),

  ('SERVICE_PARTNER',    'assignments',                 'READ',  'việc được giao'),
  ('SERVICE_PARTNER',    'assignment_commercial_terms', 'READ',  'đơn giá CỦA CHÍNH MÌNH'),
  ('SERVICE_PARTNER',    'assignment_daily_reports',    'READ',  'sổ cái của chính mình'),
  ('SERVICE_PARTNER',    'assignment_bundles',          'READ',  'bó được giao'),
  ('SERVICE_PARTNER',    'cut_bundles',                 'READ',  'chi tiết bó trong phạm vi'),
  ('SERVICE_PARTNER',    'cut_tickets',                 'READ',  'phiếu cắt của bó trong phạm vi'),
  ('SERVICE_PARTNER',    'orders',                      'READ',  'chỉ đơn có việc của mình'),

  -- ─── GHI · Điều XXX mục 6: đối tác BẮT BUỘC phải ghi ────────────────
  ('PRODUCTION_PARTNER', 'assignment_daily_reports',    'WRITE', 'báo cáo sản lượng ngày'),
  ('PRODUCTION_PARTNER', 'hourly_production_logs',      'WRITE', 'sản lượng theo giờ'),
  ('PRODUCTION_PARTNER', 'qa_audit_reports',            'WRITE', 'kiểm tra nội bộ theo giờ'),
  ('PRODUCTION_PARTNER', 'subcon_receipt_logs',         'WRITE', 'khai nhận hàng về'),

  ('SERVICE_PARTNER',    'assignment_daily_reports',    'WRITE', 'báo cáo sản lượng ngày'),
  ('SERVICE_PARTNER',    'qa_audit_reports',            'WRITE', 'kết quả kiểm'),
  ('SERVICE_PARTNER',    'subcon_receipt_logs',         'WRITE', 'khai nhận / trả hàng')

  -- ⚠️ SERVICE_PARTNER KHÔNG có `hourly_production_logs`: xưởng giặt và xưởng
  -- in không vận hành chuyền may, nên sản lượng theo giờ không có nghĩa với họ.
ON CONFLICT (partner_type, resource, action) DO NOTHING;

-- ⚠️ KHÔNG loại nào được ghi `assignments`. Đối tác đổi trạng thái phần việc
-- (nhận/từ chối/báo xong) qua Service, KHÔNG qua quyền ghi thẳng bảng — nếu
-- ghi thẳng được thì họ sửa luôn `planned_finish`, tức TỰ GIA HẠN QUYỀN của
-- chính mình. Đó là lý do 034 tồn tại, và là ranh giới không được nhoè.

-- ════════════════════════════════════════════════════════════════════════════
-- 3. NĂM HÀM PHÂN GIẢI
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ MỌI HÀM ĐỀU `STABLE` + `SECURITY DEFINER`. Cả hai đều BẮT BUỘC:
--
--   SECURITY DEFINER — đối tác KHÔNG được `SELECT` `partner_accounts`. Thiếu nó
--     thì hàm không đọc nổi thứ nó cần; và vì `partner_accounts` cũng bật RLS,
--     một policy gọi hàm mà hàm lại đọc bảng đó sẽ thành ĐỆ QUY VÔ HẠN.
--
--   STABLE — RLS chạy policy CHO TỪNG DÒNG. Hàm `VOLATILE` sẽ tra
--     `partner_accounts` một lần cho MỖI DÒNG. `STABLE` cho phép PostgreSQL
--     tính một lần cho cả câu lệnh.
--
-- ⚠️ Mọi hàm đều ghim `search_path` và `REVOKE ALL FROM PUBLIC` — bài học 036b:
-- `SECURITY DEFINER` + `PUBLIC` là công thức của lỗ hổng leo thang đặc quyền.

-- ─── 3.1 · Người gọi thuộc đối tác nào ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.mos_partner_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT pa.partner_id
    FROM public.partner_accounts pa
    JOIN public.partners p ON p.id = pa.partner_id
   WHERE pa.user_id = auth.uid()
     -- ⚠️ BA điều kiện, thiếu một là thủng.
     --   ① tài khoản còn hiệu lực
     --   ② hồ sơ đối tác còn hoạt động   ← ngừng hợp tác thường tắt ở ĐÂY
     --   ③ hồ sơ chưa bị gỡ
     -- Chỉ nhìn ① thì một đối tác đã ngừng hợp tác VẪN VÀO ĐƯỢC, và không ai
     -- phát hiện cho tới khi có sự cố.
     AND pa.is_active
     AND p.is_active
     AND p.deleted_at IS NULL
   LIMIT 1;
$$;

COMMENT ON FUNCTION public.mos_partner_id() IS
  'Đối tác của người đang gọi, đọc từ partner_accounts. TUYỆT ĐỐI KHÔNG đọc '
  'JWT — claim được ghi lúc cấp tài khoản và KHÔNG đổi khi quan hệ đối tác '
  'thay đổi. "JWT chỉ mang Identity." Trả NULL ⇒ fail-closed.';

-- ─── 3.2 · Có phải đối tác ngoài đang hoạt động ─────────────────────────
CREATE OR REPLACE FUNCTION public.mos_is_partner()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT public.mos_partner_id() IS NOT NULL;
$$;

-- ─── 3.3 · Tra bảng quyền thô ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mos_partner_can(p_resource TEXT, p_action TEXT)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.partner_permissions pp
      JOIN public.partners p ON p.partner_type = pp.partner_type
     WHERE p.id = public.mos_partner_id()
       AND pp.resource = p_resource
       AND pp.action   = p_action
  );
$$;

COMMENT ON FUNCTION public.mos_partner_can(TEXT, TEXT) IS
  'Chiều THÔ: loại đối tác này có được chạm vào bảng đó không. KHÔNG trả lời '
  'được "dòng nào" — đó là việc của mos_can_read/write_assignment.';

-- ─── 3.4 · Thấy phần việc này không ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mos_can_read_assignment(p_assignment_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
     WHERE a.id = p_assignment_id
       AND a.deleted_at IS NULL
       -- ⚠️ Viết `IS NOT NULL` TƯỜNG MINH thay vì dựa vào việc `x = NULL` cho
       -- `NULL`. SQL an toàn hơn JS ở điểm này, nhưng dựa vào một đặc tính dễ
       -- quên là cách để người sau viết lại và làm thủng.
       AND public.mos_partner_id() IS NOT NULL
       AND a.partner_id = public.mos_partner_id()
       -- Khớp `PARTNER_ACCESS_BY_STATUS` của Domain: DRAFT ẩn vì Monica đang
       -- soạn (cho thấy là để đối tác đọc đơn giá dự kiến trước khi đàm phán
       -- xong); CANCELLED ẩn vì đã biến mất khỏi công việc của họ.
       AND a.status NOT IN ('DRAFT', 'CANCELLED')
  );
$$;

-- ─── 3.5 · Ghi dữ liệu vận hành được không ──────────────────────────────
CREATE OR REPLACE FUNCTION public.mos_can_write_assignment(p_assignment_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
     WHERE a.id = p_assignment_id
       AND a.deleted_at IS NULL
       AND public.mos_partner_id() IS NOT NULL
       AND a.partner_id = public.mos_partner_id()
       -- ① trạng thái
       AND a.status IN ('ACCEPTED', 'IN_PROGRESS')
       -- ② cửa sổ thời gian — dùng KẾ HOẠCH, không dùng THỰC TẾ
       AND a.planned_start  IS NOT NULL
       AND a.planned_finish IS NOT NULL
       AND (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE
             BETWEEN a.planned_start AND a.planned_finish
  );
$$;

COMMENT ON FUNCTION public.mos_can_write_assignment(UUID) IS
  'Ba điều kiện, khớp từng chữ với canWriteOperational() phía TypeScript. '
  'Cửa sổ dùng planned_* chứ KHÔNG dùng actual_*: lấy actual_finish nghĩa là '
  'đối tác tự quyết khi nào quyền của mình hết — chỉ cần chưa điền ngày xong.';

-- ⚠️ MÚI GIỜ VIỆT NAM TƯỜNG MINH. Máy chủ chạy UTC; từ 0h đến 7h sáng nó trả
-- ngày HÔM QUA — đúng khung ca đêm của xưởng, và quyền ghi sẽ tắt sớm một ngày.

-- ════════════════════════════════════════════════════════════════════════════
-- 4. CẤP QUYỀN — HẸP NHẤT CÓ THỂ
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'mos_partner_id()', 'mos_is_partner()',
    'mos_partner_can(TEXT, TEXT)',
    'mos_can_read_assignment(UUID)', 'mos_can_write_assignment(UUID)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;

-- `anon` KHÔNG được cấp. Khách vãng lai không có danh tính để phân giải.

-- ════════════════════════════════════════════════════════════════════════════
-- 5. RLS CHO CHÍNH BẢNG QUYỀN
-- ════════════════════════════════════════════════════════════════════════════
-- Bảng này là **bản đồ phân quyền của toàn hệ thống**. Đối tác không cần đọc nó
-- — năm hàm ở trên là `SECURITY DEFINER` nên đọc được thay họ.
ALTER TABLE public.partner_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_permissions FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_internal_only" ON public.partner_permissions;
CREATE POLICY "pp_internal_only" ON public.partner_permissions
  FOR ALL TO authenticated
  USING (NOT public.mos_is_external())
  WITH CHECK (NOT public.mos_is_external());

GRANT SELECT ON public.partner_permissions TO authenticated;
REVOKE DELETE, TRUNCATE ON public.partner_permissions FROM authenticated, anon;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. HOÀN TÁC — SẠCH TUYỆT ĐỐI
-- ════════════════════════════════════════════════════════════════════════════
--   DROP FUNCTION IF EXISTS mos_can_write_assignment(UUID), mos_can_read_assignment(UUID),
--                           mos_partner_can(TEXT,TEXT), mos_is_partner(), mos_partner_id();
--   DROP TABLE IF EXISTS partner_permissions;
--
-- ⚠️ Hoàn tác 030 KHÔNG đổi hành vi của bất kỳ ai, vì **chưa policy nào tham
-- chiếu tới nó**. Đó là cả lý do 030 tách khỏi 031.

-- ════════════════════════════════════════════════════════════════════════════
-- 7. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Bảng partner_permissions' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.tables
         WHERE table_schema='public' AND table_name='partner_permissions') AS ket_qua,
       '1' AS ky_vong
UNION ALL
SELECT 'Năm hàm phân giải',
       (SELECT COUNT(*)::TEXT FROM pg_proc WHERE proname IN
         ('mos_partner_id','mos_is_partner','mos_partner_can',
          'mos_can_read_assignment','mos_can_write_assignment')), '5'
UNION ALL
SELECT '⚠️ Cả năm đều STABLE (RLS chạy CHO TỪNG DÒNG)',
       (SELECT COUNT(*)::TEXT FROM pg_proc WHERE proname IN
         ('mos_partner_id','mos_is_partner','mos_partner_can',
          'mos_can_read_assignment','mos_can_write_assignment')
         AND provolatile = 's'), '5'
UNION ALL
SELECT '⚠️ Cả năm đều SECURITY DEFINER',
       (SELECT COUNT(*)::TEXT FROM pg_proc WHERE proname IN
         ('mos_partner_id','mos_is_partner','mos_partner_can',
          'mos_can_read_assignment','mos_can_write_assignment')
         AND prosecdef), '5'
UNION ALL
SELECT '⚠️ Cả năm đều ghim search_path',
       (SELECT COUNT(*)::TEXT FROM pg_proc WHERE proname IN
         ('mos_partner_id','mos_is_partner','mos_partner_can',
          'mos_can_read_assignment','mos_can_write_assignment')
         AND array_to_string(proconfig, ',') ILIKE '%search_path%'), '5'
UNION ALL
SELECT 'Seed 21 dòng quyền',
       (SELECT COUNT(*)::TEXT FROM public.partner_permissions), '21'
UNION ALL
SELECT '⚠️ CHỈ hai loại đối tác ĐANG CÓ THẬT',
       (SELECT string_agg(DISTINCT partner_type, ' · ' ORDER BY partner_type)
          FROM public.partner_permissions), 'PRODUCTION_PARTNER · SERVICE_PARTNER'
UNION ALL
SELECT '⚠️ KHÔNG loại nào được GHI vào assignments',
       (SELECT COUNT(*)::TEXT FROM public.partner_permissions
         WHERE resource='assignments' AND action='WRITE'), '0'
UNION ALL
SELECT 'SERVICE_PARTNER không ghi sản lượng theo giờ',
       (SELECT COUNT(*)::TEXT FROM public.partner_permissions
         WHERE partner_type='SERVICE_PARTNER' AND resource='hourly_production_logs'), '0'
UNION ALL
SELECT 'Người nội bộ gọi mos_partner_id() ⇒ NULL (không phải đối tác)',
       COALESCE(public.mos_partner_id()::TEXT, 'NULL'), 'NULL'
UNION ALL
SELECT '⭐ 030 KHÔNG đổi hành vi — chưa policy nào tham chiếu',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public'
           AND (qual ILIKE '%mos_can_read_assignment%'
             OR qual ILIKE '%mos_can_write_assignment%'
             OR qual ILIKE '%mos_partner_can%')), '0'
UNION ALL
SELECT 'Dữ liệu cũ còn nguyên',
       ((SELECT COUNT(*) FROM public.partners)::TEXT || ' đối tác / ' ||
        (SELECT COUNT(*) FROM public.defect_catalog)::TEXT || ' mã lỗi'),
       '5 đối tác / 20 mã lỗi';
