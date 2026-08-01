-- ============================================================================
-- MONICA MOS — 029c · REQUEST ID
--
-- Thiết kế: docs/adr/ADR-003-request-id.md (đã phê duyệt)
-- Chuẩn thực thi: docs/MUTATION_POLICY.md
--
-- ─── VẤN ĐỀ ──────────────────────────────────────────────────────────────
-- `assignment_no` sinh từ `nextval` (029 Mục 2). Hai lần INSERT = HAI SỐ
-- NGHIỆP VỤ THẬT, không thu hồi được, và KHÔNG ngoại lệ nào nổ ra.
--
-- `retry: 0` ở tầng ứng dụng chỉ chặn được MỘT trong bốn đường gửi trùng:
--     ✅ React Query tự thử lại khi mạng chập
--     ❌ người dùng bấm nút hai lần
--     ❌ trình duyệt gửi lại sau khi mất kết nối
--     ❌ hai tab · bấm Back rồi Gửi lại
--
-- ─── PHẠM VI (Addendum mục 4: KHÔNG Big Bang) ────────────────────────────
--   029c  assignments · assignment_daily_reports   ← 0 dòng, thêm lúc này rẻ nhất
--   033   shipments · orders · qa_logs · capa_logs · subcon_orders ·
--         subcon_receipt_logs · financial_records   ← có dữ liệu và mã ĐANG CHẠY
--
-- ⚠️ Chia giai đoạn KHÔNG phải để đỡ việc. Thêm cột vào `orders` mà chưa sửa
-- service của nó để bắt 23505 sẽ ném lỗi khoá trùng thô vào giữa luồng nhập đơn
-- hàng — làm hỏng một phân hệ đang chạy để phòng một lỗi chưa xảy ra. Cột và
-- cách xử lý lỗi phải đi cùng nhau, từng miền một.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. KHUÔN CHUẨN — một hàm dùng cho mọi bảng chứng từ
-- ════════════════════════════════════════════════════════════════════════════
-- Bảy đoạn ALTER chép tay sẽ có bảy cách đặt tên chỉ mục, và tới bảng thứ tư sẽ
-- có người quên mệnh đề WHERE. Một hàm thì không.
CREATE OR REPLACE FUNCTION public.mos_add_request_id(p_table TEXT)
RETURNS VOID LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
  EXECUTE format(
    'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS request_id UUID', p_table);

  -- ⚠️ KHÔNG kèm `WHERE deleted_at IS NULL`, khác mọi chỉ mục duy nhất khác
  -- của 029. Đây là khác biệt về BẢN CHẤT, không phải sơ suất:
  --
  --   các chỉ mục kia canh DANH TÍNH NGHIỆP VỤ
  --      (một bó chỉ thuộc một phần việc ĐANG HIỆU LỰC)
  --   chỉ mục này canh MỘT LƯỢT YÊU CẦU
  --      (một yêu cầu đã xử lý thì VĨNH VIỄN đã xử lý)
  --
  -- Xoá mềm bản ghi không làm cho lần gửi đó chưa từng xảy ra.
  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_%s_request_id '
    'ON public.%I (request_id) WHERE request_id IS NOT NULL',
    p_table, p_table);

  -- ⚠️ Chú thích này là MỘT TRONG BA LỚP chống điền nhầm (ADR-003 Mục 2.4).
  -- Bốn khái niệm dưới đây đều là UUID, đều đi kèm một lượt gọi, và rất dễ
  -- điền nhầm cái nọ vào chỗ cái kia — điền nhầm thì KHÔNG lỗi nào nổ ra, chỉ
  -- có lớp bảo vệ biến mất trong im lặng.
  EXECUTE format(
    'COMMENT ON COLUMN public.%I.request_id IS %L',
    p_table,
    'Business Mutation ID — khoá chống lập chứng từ hai lần. '
    'Sinh bởi trình duyệt lúc MỞ BIỂU MẪU, và GIỮ NGUYÊN qua mọi lần gửi lại. '
    'KHÔNG phải HTTP Request ID. KHÔNG phải Trace ID. KHÔNG phải Correlation ID '
    '— ba thứ đó ĐỔI mỗi lượt gọi, và điền chúng vào đây là vô hiệu hoá bảo vệ. '
    'Phép thử: bấm Gửi hai lần thì hai lần đó PHẢI cùng giá trị này.');
END $$;

COMMENT ON FUNCTION public.mos_add_request_id(TEXT) IS
  'Thêm request_id + chỉ mục duy nhất theo khuôn chuẩn. Mọi bảng chứng từ '
  'nghiệp vụ mới BẮT BUỘC gọi hàm này — Điều XXXIV, ADR-003.';

-- ════════════════════════════════════════════════════════════════════════════
-- 2. ÁP DỤNG — GIAI ĐOẠN 1
-- ════════════════════════════════════════════════════════════════════════════
SELECT public.mos_add_request_id('assignments');

-- Sổ cái cũng là chứng từ có thể lập mới, và là chứng từ NẶNG NHẤT: báo cáo
-- ngày là CĂN CỨ THANH TOÁN. Gửi trùng ở đây là trả tiền hai lần.
--
-- Cổng đối tác chưa mở (029 Mục 11 chặn sạch người ngoài), nhưng thêm cột lúc
-- bảng còn 0 dòng rẻ hơn hẳn thêm sau — và nó phải sẵn sàng TRƯỚC 031.
SELECT public.mos_add_request_id('assignment_daily_reports');

-- ⚠️ CỐ Ý CHƯA ĐỤNG bảy bảng của giai đoạn 033. Xem lý do ở đầu tệp.

-- ════════════════════════════════════════════════════════════════════════════
-- 3. HỢP ĐỒNG VỚI TẦNG SERVICE — ghi ở đây vì SQL không ép được
-- ════════════════════════════════════════════════════════════════════════════
-- Cột và chỉ mục chỉ là MỘT trong ba mảnh. Hai mảnh còn lại nằm ở tầng ứng
-- dụng, và thiếu một trong hai thì cột này vô dụng:
--
--   ② SERVICE: bắt 23505 trên uq_<bảng>_request_id
--              → đọc lại dòng cũ theo request_id
--              → trả { ok: true, id: <dòng cũ> }        ← THÀNH CÔNG
--
--      ⚠️ Để 23505 nổi lên là PHẢN TÁC DỤNG: người dùng thấy "Mã này đã tồn
--      tại" cho một thao tác ĐÃ THÀNH CÔNG, tưởng là hỏng, rồi bấm lại với
--      khoá mới — tạo ra đúng bản trùng mà cả cơ chế sinh ra để chặn.
--
--   ③ CLIENT:  crypto.randomUUID() lúc MỞ biểu mẫu, KHÔNG phải lúc bấm.
--              Sinh lúc bấm thì mỗi lần bấm một khoá mới, và cột này thành
--              đồ trang trí.

-- ════════════════════════════════════════════════════════════════════════════
-- 4. KHẢ NĂNG HOÀN TÁC
-- ════════════════════════════════════════════════════════════════════════════
--   DROP INDEX IF EXISTS public.uq_assignments_request_id;
--   DROP INDEX IF EXISTS public.uq_assignment_daily_reports_request_id;
--   ALTER TABLE public.assignments              DROP COLUMN IF EXISTS request_id;
--   ALTER TABLE public.assignment_daily_reports DROP COLUMN IF EXISTS request_id;
--   DROP FUNCTION IF EXISTS public.mos_add_request_id(TEXT);
--
-- Hoàn tác SẠCH: cột chỉ thêm vào, không đổi nghĩa cột nào đang có, và cả hai
-- bảng hiện 0 dòng.
--
-- ⚠️ Sau khi có chứng từ thật, gỡ cột làm MẤT khả năng nhận diện lần gửi đã xử
-- lý — những lần gửi lại về sau tạo bản trùng trở lại. Dữ liệu không mất, nhưng
-- lớp bảo vệ thì mất.

-- ════════════════════════════════════════════════════════════════════════════
-- 5. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Hàm khuôn chuẩn mos_add_request_id' AS muc,
       (SELECT COUNT(*)::TEXT FROM pg_proc WHERE proname = 'mos_add_request_id') AS ket_qua,
       '1' AS ky_vong
UNION ALL
SELECT 'Hai cột request_id (giai đoạn 1)',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema = 'public' AND column_name = 'request_id'
           AND table_name IN ('assignments','assignment_daily_reports')), '2'
UNION ALL
SELECT 'Cả hai đều CHO PHÉP NULL (dữ liệu cũ · lệnh từ máy chủ)',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema = 'public' AND column_name = 'request_id'
           AND is_nullable = 'YES'
           AND table_name IN ('assignments','assignment_daily_reports')), '2'
UNION ALL
SELECT 'Hai chỉ mục duy nhất',
       (SELECT COUNT(*)::TEXT FROM pg_indexes
         WHERE schemaname = 'public' AND indexname IN
           ('uq_assignments_request_id','uq_assignment_daily_reports_request_id')), '2'
UNION ALL
SELECT '⚠️ Chỉ mục KHÔNG lọc theo deleted_at (canh LƯỢT YÊU CẦU, không phải DÒNG)',
       (SELECT COUNT(*)::TEXT FROM pg_indexes
         WHERE schemaname = 'public'
           AND indexname IN ('uq_assignments_request_id','uq_assignment_daily_reports_request_id')
           AND indexdef NOT ILIKE '%deleted_at%'), '2'
UNION ALL
SELECT 'Chú thích phân biệt 4 loại ID đã ghi vào cột',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns c
         WHERE c.table_schema = 'public' AND c.column_name = 'request_id'
           AND c.table_name IN ('assignments','assignment_daily_reports')
           AND col_description(format('public.%I', c.table_name)::regclass,
                               c.ordinal_position) ILIKE '%KHÔNG phải Trace ID%'), '2'
UNION ALL
SELECT '⚠️ CỐ Ý chưa đụng 7 bảng của giai đoạn 033',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema = 'public' AND column_name = 'request_id'
           AND table_name IN ('orders','shipments','qa_logs','capa_logs',
                              'subcon_orders','subcon_receipt_logs','financial_records')), '0'
UNION ALL
SELECT '029 · 029b còn nguyên',
       ((SELECT COUNT(*) FROM public.assignments)::TEXT || ' phần việc / ' ||
        (SELECT COUNT(*) FROM public.partners)::TEXT || ' đối tác'),
       '0 phần việc / 5 đối tác';
