-- ============================================================================
-- MONICA ONE — 056 · SỔ KIỂM TOÁN BẤT BIẾN **TUYỆT ĐỐI**, KỂ CẢ `service_role`
--
-- 📐 Board Directive *FAST SECURITY FIX* 08/08/2026
-- 📐 ADR-030 (kèm theo) · `K-1` · `BDR-14` · `Hiến pháp Điều 8`
--
-- ⚠️ Chạy SAU `055`. Idempotent. ⛔ KHÔNG xoá dữ liệu. Hỏng phép tự kiểm nào
--    ⇒ `RAISE` ⇒ **toàn bộ giao dịch quay lui**.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ① 🔴 ĐÂY LÀ ĐẢO MỘT QUYẾT ĐỊNH CÓ CHỦ Ý, ⛔ KHÔNG PHẢI VÁ MỘT SƠ SUẤT
-- ════════════════════════════════════════════════════════════════════════════
-- `041` **CỐ Ý** để `service_role` giữ đủ quyền. Nguyên văn trong tệp đó:
--
--   *"`service_role` GIỮ NGUYÊN mọi quyền… Ba đường hợp lệ để sửa dữ liệu bất
--   biến (Migration · Maintenance Script · Recovery Procedure) đều đi bằng
--   khoá đó, và cả ba đều để lại dấu vết."*
--
-- ⇒ Trạng thái hiện nay là **THIẾT KẾ**, ⛔ không phải lỗ lọt lưới.
--
-- ⚠️ NHƯNG nó mâu thuẫn với `K-1` ở `tests/README.md`, vốn phát biểu ngược
--    lại: *"⛔ không xoá ra được, **kể cả bằng `service_role`**"* — và còn nhắc
--    tới một **trigger ⛔ CHƯA TỪNG TỒN TẠI**.
--
-- 🔑 Hai văn bản của cùng một kho nói hai điều khác nhau về cùng một bảng, từ
--    04/08/2026. Board 08/08/2026 chọn phía `K-1`. Migration này **ghi lại
--    việc đảo**, ⛔ không sửa `041` một cách im lặng.
--
-- 💸 CÁI GIÁ: ba đường phục hồi của `041` **ĐÓNG LẠI**. Muốn sửa sổ kiểm toán
--    từ nay phải `DISABLE TRIGGER` — lệnh chỉ **chủ sở hữu bảng** chạy được,
--    tức phải qua SQL Editor, tức **để lại vết**. Đó chính là mục đích: đổi
--    *"sửa được lặng lẽ bằng một khoá API"* lấy *"sửa được nhưng phải mở khoá
--    công khai"*.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ② VÌ SAO **⛔ KHÔNG** DÙNG RLS — và đây là điểm kỹ thuật cốt lõi
-- ════════════════════════════════════════════════════════════════════════════
--   RLS      → 🔴 ⛔ KHÔNG chặn được. `service_role` mang **`BYPASSRLS`**; mọi
--              policy viết ra đều bị nó đi vòng. Dùng RLS ở đây là **giải pháp
--              giả** — đúng thứ Board §3 cấm.
--   REVOKE   → ✅ CHẶN ĐƯỢC. `BYPASSRLS` chỉ bỏ qua **policy**, ⛔ không bỏ qua
--              **`GRANT`**. `service_role` ⛔ không phải superuser và ⛔ không
--              sở hữu bảng ⇒ quyền bảng áp lên nó.
--   TRIGGER  → ✅ CHẶN ĐƯỢC, và nổ với **mọi vai**, kể cả chủ sở hữu.
--
-- ⇒ Dùng **CẢ HAI**, và đó ⛔ không phải thừa:
--   · `REVOKE` là hàng rào chính — rẻ, rõ, đọc được bằng `information_schema`.
--   · `TRIGGER` là **lưới cuối**, bắt đúng ca `041` đã cảnh báo: *"`GRANT` là
--     phép CỘNG, ⛔ không bao giờ thu hẹp"*. Kho này **đã một lần** mất quyền
--     kiểm soát vì `ALTER DEFAULT PRIVILEGES` của Supabase cấp lại `GRANT ALL`.
--
-- 🔑 Một hàng rào **có thể bị vô hiệu bởi một dòng `GRANT`** ⛔ không phải hàng
--    rào cho một sổ kiểm toán.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ③ ⚠️ GIỚI HẠN — NÓI THẲNG, ⛔ KHÔNG GIẢ VỜ PASS (Board §5)
-- ════════════════════════════════════════════════════════════════════════════
--   anon · authenticated · service_role ....... ✅ CHẶN
--   chủ sở hữu bảng (postgres/SQL Editor) ..... ⚠️ chặn bởi trigger, GỠ ĐƯỢC
--                                                bằng `DISABLE TRIGGER`
--   superuser ................................. 🔴 ⛔ KHÔNG CHẶN ĐƯỢC
--                                                `SET session_replication_role
--                                                = 'replica'` tắt mọi trigger
--
-- 🔑 **⛔ Không cơ chế nào TRONG PostgreSQL chặn được superuser.** Đó là giới
--    hạn của hệ quản trị, ⛔ không phải của thiết kế này. Phòng thủ ở tầng đó
--    là **quản lý khoá**, ⛔ không phải SQL.
--
-- ⇒ Phát biểu trung thực: **bất biến với mọi đường ứng dụng đi qua, gồm cả
--   `service_role`; ⛔ KHÔNG bất biến trước người cầm khoá superuser.**
--
-- ════════════════════════════════════════════════════════════════════════════
-- ④ IMPACT · TÍNH ĐẢO NGƯỢC
-- ════════════════════════════════════════════════════════════════════════════
-- BẢNG CHẠM     activity_log — 2 trigger + thu hồi quyền. ⛔ Không đụng cột,
--               ⛔ không đụng một dòng dữ liệu nào.
-- MẤT QUYỀN     service_role mất UPDATE · DELETE · TRUNCATE.
--               INSERT · SELECT **GIỮ NGUYÊN** — sổ ngừng ghi được là hỏng
--               nặng hơn lỗ hổng đang vá.
-- RLS           ⛔ KHÔNG chạm policy nào — xem §②.
-- ĐẢO NGƯỢC     ĐẢO ĐƯỢC:
--                 DROP TRIGGER mos_activity_log_immutable   ON activity_log;
--                 DROP TRIGGER mos_activity_log_no_truncate ON activity_log;
--                 GRANT UPDATE, DELETE, TRUNCATE ON activity_log TO service_role;
--               ⚠️ Đảo là quay lại đúng trạng thái Board vừa yêu cầu đóng.
-- ============================================================================

BEGIN;

-- ─── 1. HÀNG RÀO CHÍNH: THU HỒI QUYỀN ───────────────────────────────────────
-- ⚠️ `PUBLIC` đứng ở đây có chủ ý: `GRANT ... TO PUBLIC` cấp cho **mọi vai
--    hiện có và mọi vai sinh ra sau này**. Bỏ sót nó là để lại một cửa mà ⛔
--    không migration nào sau này nhìn thấy.
REVOKE UPDATE, DELETE, TRUNCATE ON public.activity_log FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON public.activity_log FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.activity_log FROM authenticated;
-- 🔴 DÒNG TRUNG TÂM CỦA MIGRATION NÀY — thứ `041` cố ý ⛔ không làm.
REVOKE UPDATE, DELETE, TRUNCATE ON public.activity_log FROM service_role;

-- ⚠️ Chặn luôn đường cấp lại tự động. Supabase đặt sẵn `ALTER DEFAULT
--    PRIVILEGES ... GRANT ALL ON TABLES TO anon, authenticated, service_role`,
--    và đó chính là nguồn gốc lỗ hổng gốc mà `041` mô tả. Dòng dưới ⛔ không
--    gỡ mặc định đó *(ngoài phạm vi)*, nhưng trigger ở §2 khiến việc cấp lại
--    **⛔ không còn tác dụng** trên bảng này.

-- ─── 2. LƯỚI CUỐI: TRIGGER — nổ với MỌI VAI, kể cả chủ sở hữu ───────────────
--
-- ⚠️ Hàm trả `trigger` ⇒ **⛔ không gọi trực tiếp được**, nên ⛔ KHÔNG cần
--    `REVOKE EXECUTE`. Đây đúng là chỗ `049` đã sai và làm đổ `42501` toàn hệ
--    thống: REVOKE trên một hàm mà trigger `SECURITY INVOKER` gọi tới.
-- ⚠️ `SECURITY INVOKER` (mặc định) là ĐÚNG ở đây — hàm ⛔ không cần quyền nào
--    ngoài quyền ném lỗi.
CREATE OR REPLACE FUNCTION public.mos_activity_log_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION
    'Sổ kiểm toán CHỈ GHI THÊM: ⛔ không % được dòng nào của activity_log. '
    'Đây là hàng rào của K-1 · BDR-14 · Hiến pháp Điều 8, áp dụng cho MỌI vai '
    'kể cả service_role. Cần sửa thật thì phải DISABLE TRIGGER bằng chủ sở hữu '
    'bảng — và việc đó cố ý để lại vết. Xem ADR-030.',
    lower(TG_OP)
    -- ⚠️ **Mã tự đặt `P0403`, ⛔ KHÔNG dùng mã chuẩn.** Bản trước chọn một mã
    -- vốn ĐÃ CÓ nghĩa trong PL/pgSQL *(`no_data_found`)* — chiếm nó là làm
    -- một mã có sẵn nghĩa khác đi, và người bắt lỗi về sau sẽ đọc nhầm.
    -- `P0403` theo đúng tiền lệ `P0409` *(xung đột ghi đè)* của CLAUDE.md §2.5.
    USING ERRCODE = 'P0403';
  RETURN NULL;  -- ⛔ không bao giờ tới đây
END;
$$;

COMMENT ON FUNCTION public.mos_activity_log_immutable() IS
  '056 · ADR-030. Chặn UPDATE/DELETE trên activity_log với MỌI vai. Hàm trả '
  '`trigger` nên ⛔ không gọi trực tiếp được ⇒ ⛔ KHÔNG REVOKE EXECUTE (bài học '
  '049: REVOKE trên hàm mà trigger SECURITY INVOKER gọi ⇒ 42501 toàn hệ thống).';

DROP TRIGGER IF EXISTS mos_activity_log_immutable ON public.activity_log;
CREATE TRIGGER mos_activity_log_immutable
  BEFORE UPDATE OR DELETE ON public.activity_log
  FOR EACH ROW EXECUTE FUNCTION public.mos_activity_log_immutable();

-- 🔴 `TRUNCATE` CẦN TRIGGER RIÊNG — trigger cấp DÒNG ⛔ KHÔNG bắt được nó.
-- `041` đã chỉ ra: *"TRUNCATE bỏ qua trigger, bỏ qua RLS, và ⛔ không sinh dòng
-- audit nào — một lệnh, sạch cả bảng, ⛔ không một dấu vết."* Thiếu trigger này
-- là để nguyên đúng lối đó.
DROP TRIGGER IF EXISTS mos_activity_log_no_truncate ON public.activity_log;
CREATE TRIGGER mos_activity_log_no_truncate
  BEFORE TRUNCATE ON public.activity_log
  FOR EACH STATEMENT EXECUTE FUNCTION public.mos_activity_log_immutable();

COMMENT ON TABLE public.activity_log IS
  'Sổ kiểm toán dùng chung — CHỈ GHI THÊM, BẤT BIẾN TUYỆT ĐỐI. '
  '056 (ADR-030) thu hồi UPDATE/DELETE/TRUNCATE của MỌI vai kể cả service_role, '
  'và gắn 2 trigger nổ với mọi vai. ⚠️ ĐẢO quyết định của 041 (vốn CỐ Ý chừa '
  'service_role) theo Board Directive 08/08/2026. Muốn sửa: DISABLE TRIGGER '
  'bằng chủ sở hữu bảng — cố ý để lại vết. ⛔ KHÔNG chặn được superuser.';

-- ════════════════════════════════════════════════════════════════════════════
-- ⑤ TỰ KIỂM — ĐO HÀNH VI, ⛔ KHÔNG ĐỌC LƯỢC ĐỒ
-- ════════════════════════════════════════════════════════════════════════════
-- 🔑 Đọc `information_schema` chỉ chứng minh **khai báo**. Chỉ có thử ghi thật
--    mới chứng minh **hành vi** — và đây đúng là bài học `ADR-027 §0`: khối tự
--    kiểm bắt được lỗi *tên policy* nhưng ⛔ không bắt được lỗi *phân quyền*.
DO $$
-- 🔴 **`activity_log.id` LÀ SỐ NGUYÊN, ⛔ KHÔNG PHẢI UUID.**
-- Bản trước khai `v_id UUID` và lệnh đổ ngay ở dòng đầu khối:
--     22P02: invalid input syntax for type uuid: "450"
-- ⚠️ Tôi **đoán** kiểu thay vì **đo** — đúng thứ CLAUDE.md §3 cấm: *"Luôn đối
--    chiếu với CSDL đang chạy, ⛔ không tin nội dung file migration hay trí
--    nhớ."* Đã đo lại: `id` = 4, 5, 6 … (số nguyên tự tăng); `entity_id` mới
--    là `UUID`.
DECLARE v_id BIGINT; v_loi TEXT; v_dem INT;
BEGIN
  -- 5.1 ⭐ INSERT PHẢI CÒN CHẠY. Sổ ngừng ghi được là hỏng nặng hơn lỗ hổng
  --     đang vá — hệ thống sẽ **im lặng mất khả năng ghi nhận**.
  INSERT INTO public.activity_log (entity_type, entity_id, action, changes)
  VALUES ('ORDER', '00000000-0000-0000-0000-000000000000', 'CREATE',
          '{"__tu_kiem_056": true}'::jsonb)
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RAISE EXCEPTION '⛔ TỰ KIỂM 5.1: ⛔ không ghi thêm được — sổ đã CHẾT.'; END IF;

  -- 5.2 🔴 UPDATE PHẢI BỊ CHẶN
  v_loi := NULL;
  BEGIN UPDATE public.activity_log SET action = 'UPDATE' WHERE id = v_id;
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE; END;
  IF v_loi IS DISTINCT FROM 'P0403' THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.2: UPDATE ⛔ không bị chặn đúng cách (SQLSTATE=%).', COALESCE(v_loi, 'KHÔNG LỖI');
  END IF;

  -- 5.3 🔴 DELETE PHẢI BỊ CHẶN
  v_loi := NULL;
  BEGIN DELETE FROM public.activity_log WHERE id = v_id;
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE; END;
  IF v_loi IS DISTINCT FROM 'P0403' THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.3: DELETE ⛔ không bị chặn đúng cách (SQLSTATE=%).', COALESCE(v_loi, 'KHÔNG LỖI');
  END IF;

  -- 5.4 Dòng vừa ghi PHẢI CÒN NGUYÊN — chứng minh hai phép trên thật sự ⛔
  --     không đụng được vào dữ liệu, ⛔ không chỉ ném lỗi rồi vẫn ghi.
  SELECT count(*) INTO v_dem FROM public.activity_log
   WHERE id = v_id AND action = 'CREATE';
  IF v_dem <> 1 THEN RAISE EXCEPTION '⛔ TỰ KIỂM 5.4: dòng thử ⛔ không còn nguyên vẹn.'; END IF;

  -- 5.5 service_role PHẢI ⛔ KHÔNG còn quyền huỷ hoại
  SELECT count(*) INTO v_dem FROM information_schema.role_table_grants
   WHERE grantee = 'service_role' AND table_schema = 'public'
     AND table_name = 'activity_log'
     AND privilege_type IN ('UPDATE', 'DELETE', 'TRUNCATE');
  IF v_dem <> 0 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.5: service_role CÒN % quyền huỷ hoại trên sổ kiểm toán.', v_dem;
  END IF;

  -- ⭐ 5.6 CẶP `K-3`: service_role PHẢI CÒN INSERT và SELECT.
  SELECT count(*) INTO v_dem FROM information_schema.role_table_grants
   WHERE grantee = 'service_role' AND table_schema = 'public'
     AND table_name = 'activity_log' AND privilege_type IN ('INSERT', 'SELECT');
  IF v_dem < 2 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 5.6: service_role MẤT quyền ghi/đọc sổ — chặn phẳng, ⛔ không phải khoanh đúng.';
  END IF;

  -- ⚠️ Dòng thử **Ở LẠI VĨNH VIỄN**. Đó chính là `K-1`: *"Bài kiểm thất bại
  --    CHÍNH VÌ thứ nó kiểm đang chạy đúng."* Dọn nó cần `M003`.
  RAISE NOTICE '✅ TỰ KIỂM 056: 6/6 ĐẠT. ⚠️ Dòng thử id=% Ở LẠI — xem maintenance/M004.', v_id;
END $$;

COMMIT;

-- ── BÁO CÁO KỲ VỌNG ⟷ THỰC TẾ ──────────────────────────────────────────────
SELECT 'service_role CÒN quyền huỷ hoại sổ kiểm toán' AS muc,
       (SELECT count(*)::text FROM information_schema.role_table_grants
         WHERE grantee='service_role' AND table_schema='public' AND table_name='activity_log'
           AND privilege_type IN ('UPDATE','DELETE','TRUNCATE')) AS thuc_te,
       '0' AS ky_vong
UNION ALL
SELECT 'authenticated CÒN quyền huỷ hoại',
       (SELECT count(*)::text FROM information_schema.role_table_grants
         WHERE grantee='authenticated' AND table_schema='public' AND table_name='activity_log'
           AND privilege_type IN ('UPDATE','DELETE','TRUNCATE')), '0'
UNION ALL
SELECT 'số trigger canh bất biến',
       (SELECT count(*)::text FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
         WHERE c.relname='activity_log' AND NOT t.tgisinternal
           AND t.tgname LIKE 'mos_activity_log%'), '2'
UNION ALL
SELECT '⭐ service_role VẪN ghi thêm được (INSERT)',
       (SELECT count(*)::text FROM information_schema.role_table_grants
         WHERE grantee='service_role' AND table_schema='public' AND table_name='activity_log'
           AND privilege_type='INSERT'), '1'
UNION ALL
SELECT '⭐ authenticated VẪN ghi thêm được (INSERT)',
       (SELECT count(*)::text FROM information_schema.role_table_grants
         WHERE grantee='authenticated' AND table_schema='public' AND table_name='activity_log'
           AND privilege_type='INSERT'), '1';

-- ⚠️ SAU KHI CHẠY:  node scripts/kiem-so-kiem-toan.mjs
-- ============================================================================
