-- ============================================================================
-- MONICA MOS — 025 · KHOÁ QUYỀN NHÀ THẦU PHỤ
--
-- ⚠️ VÁ RÒ RỈ BÍ MẬT KINH DOANH.
--
-- ─── ĐO ĐƯỢC TRÊN CSDL ĐANG CHẠY, BẰNG PHIÊN ĐĂNG NHẬP THẬT ──────────────
-- Vai trò `subcon` — một CÔNG TY BÊN NGOÀI — đọc được TOÀN BỘ:
--
--   orders             2/2     financial_records  2/2   ← đơn giá, tiền phạt,
--   fabric_rolls       2/2     stock_levels       4/4     tạm ứng, tổng thanh
--   materials          4/4     qa_logs           10/10    toán CHO NHÀ THẦU KHÁC
--   profiles          14/14
--
-- Nguyên nhân: `mos_is_buyer()` của migration 018 CHỈ bao phủ vai trò `buyer`.
-- Vòng lặp `buyer_denied` vì thế bỏ sót hoàn toàn `subcon`.
--
-- ─── KHAI THEO KIỂU CHO PHÉP, GIỐNG 018 ──────────────────────────────────
-- Liệt kê thứ nhà thầu ĐƯỢC xem rồi chặn phần còn lại. Bảng sinh sau này mặc
-- định BỊ CHẶN cho tới khi ai đó khai tường minh — sai sót phải nghiêng về
-- phía khoá lại.
--
-- Danh sách cho phép lấy từ mã nguồn THẬT của module /subcon (đã đọc
-- app/(dashboard)/subcon/actions.ts), không phải đoán:
--   subcontractors · subcon_orders · subcon_issue_logs · subcon_receipt_logs
--   cut_bundles · cut_tickets · orders   (ba cái sau vào qua phép nhúng quan hệ)
--
-- ⚠️ `subcon` chỉ vào được route `/subcon` (lib/rbac.ts). Họ KHÔNG mở được
-- /md, nên PO Command Center không nằm trong phạm vi cần mở.
--
-- ⚠️ CHƯA khoanh vùng "chỉ đơn của chính mình": hệ thống KHÔNG có bảng nối
-- người dùng → nhà thầu (không có thứ tương đương `buyer_accounts`). Vì vậy
-- nhà thầu vẫn thấy mọi dòng của 7 bảng được phép. Kiến trúc sư đã quyết để
-- việc khoanh vùng sang phase sau. Ghi ở đây để không ai tưởng đã xong.
--
-- CHỈ THÊM POLICY MỚI. Không sửa, không xoá policy nào của 018.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. HÀM NHẬN DIỆN NGƯỜI DÙNG BÊN NGOÀI
-- ════════════════════════════════════════════════════════════════════════════
-- Bao phủ CẢ buyer LẪN subcon. Không sửa `mos_is_buyer()` — hàng chục policy
-- của 018 đang gọi nó, đổi ngữ nghĩa của nó là đổi hành vi của tất cả cùng lúc.
-- ⚠️ DÙNG ĐÚNG BIỂU THỨC CỦA `mos_is_buyer()` TRONG 018, không dùng auth.jwt().
-- NULLIF chống lỗi ép kiểu: current_setting(...,true) trả NULL khi chưa đặt,
-- nhưng ở một số ngữ cảnh (trigger, job nền) lại trả CHUỖI RỖNG, mà ''::jsonb
-- là lỗi cú pháp làm hỏng nguyên truy vấn thay vì chỉ trả về false.
-- Đọc không được claim → FALSE → coi như KHÔNG phải người ngoài → policy không
-- chặn ai. Đúng hướng an toàn: sai sót không được khoá hệ thống của mười hai
-- vai trò nội bộ.
CREATE OR REPLACE FUNCTION public.mos_is_external()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb
       -> 'app_metadata' ->> 'role') IN ('buyer', 'subcon'),
    FALSE
  );
$$;

COMMENT ON FUNCTION public.mos_is_external() IS
  'TRUE khi người gọi là người dùng BÊN NGOÀI nhà máy (khách hàng hoặc nhà thầu phụ).';

GRANT EXECUTE ON FUNCTION public.mos_is_external() TO authenticated;

-- Hàm riêng cho nhà thầu, để policy đọc lên là hiểu ngay ai đang bị chặn.
CREATE OR REPLACE FUNCTION public.mos_is_subcon()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb
       -> 'app_metadata' ->> 'role') = 'subcon',
    FALSE
  );
$$;

GRANT EXECUTE ON FUNCTION public.mos_is_subcon() TO authenticated;
-- Giống 018: thu hồi quyền của `anon`. Người chưa đăng nhập không có việc gì
-- phải gọi hàm phân quyền.
REVOKE EXECUTE ON FUNCTION public.mos_is_external() FROM anon;
REVOKE EXECUTE ON FUNCTION public.mos_is_subcon()   FROM anon;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. CHẶN NHÀ THẦU Ở MỌI BẢNG NGOÀI DANH SÁCH CHO PHÉP
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t TEXT;
  allowed TEXT[] := ARRAY[
    'subcontractors',       -- danh sách nhà thầu (module /subcon hiển thị)
    'subcon_orders',        -- đơn gia công
    'subcon_issue_logs',    -- phiếu xuất hàng đi gia công
    'subcon_receipt_logs',  -- phiếu thu hồi hàng về
    'cut_bundles',          -- bó bán thành phẩm
    'cut_tickets',          -- vào qua phép nhúng cut_bundles → cut_tickets
    'orders'                -- vào qua phép nhúng, chỉ để lấy po_number
  ];
  n INT := 0;
BEGIN
  FOR t IN
    SELECT p.tablename FROM pg_tables p
    WHERE p.schemaname = 'public'
      AND NOT (p.tablename = ANY(allowed))
      -- ⚠️ Bài học 018: chỉ đụng bảng MÌNH sở hữu. Bảng do extension tạo sẽ
      -- ném "must be owner of table" và làm dừng cả migration giữa chừng.
      AND p.tableowner = current_user
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "subcon_denied" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "subcon_denied" ON public.%I '
      'AS RESTRICTIVE FOR ALL TO authenticated '
      'USING (NOT public.mos_is_subcon()) '
      'WITH CHECK (NOT public.mos_is_subcon())', t);
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'Đã chặn nhà thầu phụ ở % bảng ngoài phạm vi module /subcon.', n;
END $$;

-- ─── VÌ SAO KHÔNG CẦN ĐỤNG TỚI VIEW ──────────────────────────────────────
-- Bảy view đã bật `security_invoker = true` ở Mục 7 của migration 024, nên
-- chúng chạy dưới quyền NGƯỜI GỌI. Chặn nhà thầu ở bảng gốc là tự động chặn ở
-- mọi view đọc bảng đó — không phải liệt kê view lần nữa, và view sinh sau này
-- cũng được che sẵn.

-- ════════════════════════════════════════════════════════════════════════════
-- 3. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Hàm mos_is_external + mos_is_subcon' AS muc,
       (SELECT COUNT(*)::TEXT FROM pg_proc
         WHERE proname IN ('mos_is_external', 'mos_is_subcon')
           AND pronamespace = 'public'::regnamespace) AS ket_qua,
       '2' AS ky_vong
UNION ALL
SELECT 'mos_is_external bao phủ CẢ buyer lẫn subcon',
       (SELECT (prosrc LIKE '%buyer%' AND prosrc LIKE '%subcon%')::TEXT
          FROM pg_proc WHERE proname = 'mos_is_external'
           AND pronamespace = 'public'::regnamespace), 'true'
UNION ALL
SELECT 'Số bảng đã chặn nhà thầu',
       (SELECT COUNT(DISTINCT tablename)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND policyname = 'subcon_denied'), '> 0'
UNION ALL
SELECT '⚠️ financial_records ĐÃ chặn nhà thầu (tiền bạc)',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'financial_records'
           AND policyname = 'subcon_denied'), '1'
UNION ALL
SELECT '⚠️ profiles ĐÃ chặn nhà thầu (danh sách nhân sự)',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'profiles'
           AND policyname = 'subcon_denied'), '1'
UNION ALL
SELECT '⚠️ Hồ sơ QC nội bộ ĐÃ chặn nhà thầu',
       (SELECT COUNT(DISTINCT tablename)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND policyname = 'subcon_denied'
           AND tablename IN ('qa_logs','qa_audit_reports','qa_defects','capa_logs','defect_catalog')), '5'
UNION ALL
SELECT 'Kho và định mức ĐÃ chặn nhà thầu',
       (SELECT COUNT(DISTINCT tablename)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND policyname = 'subcon_denied'
           AND tablename IN ('fabric_rolls','stock_levels','materials','style_bom')), '4'
UNION ALL
SELECT 'Bảy bảng module /subcon KHÔNG bị chặn (không làm hỏng màn hình thật)',
       (SELECT COUNT(DISTINCT tablename)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND policyname = 'subcon_denied'
           AND tablename IN ('subcontractors','subcon_orders','subcon_issue_logs',
                             'subcon_receipt_logs','cut_bundles','cut_tickets','orders')), '0'
UNION ALL
SELECT 'Policy của buyer (018) còn nguyên, không bị đụng',
       (SELECT COUNT(DISTINCT tablename)::TEXT FROM pg_policies
         WHERE schemaname = 'public' AND policyname = 'buyer_denied'), '> 0';
