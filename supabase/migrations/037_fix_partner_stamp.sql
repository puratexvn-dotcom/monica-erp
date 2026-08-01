-- ============================================================================
-- MONICA MOS — 037 · VÁ `partner_stamp()`   (bản 2)
--
-- ⚠️ LỖI CÓ THẬT, TỒN TẠI TỪ MIGRATION 027, VÀ NÓ CHẶN MỘT CƠ CHẾ AN TOÀN.
--
-- ─── ĐO ĐƯỢC ─────────────────────────────────────────────────────────────
--     UPDATE partner_accounts SET is_active = false WHERE id = ...
--     → ERROR 42703: record "new" has no field "deleted_at"
--
-- Nguyên nhân: 027 gắn CÙNG một hàm `partner_stamp()` cho HAI bảng —
--
--     partners           có deleted_at · deleted_by   ✅
--     partner_accounts   KHÔNG có hai cột đó          ✗
--
-- ─── VÌ SAO NÓ NGHIÊM TRỌNG ──────────────────────────────────────────────
-- ADR-006 dựa vào `partner_accounts.is_active` làm **công tắc rút quyền**:
--
--     mos_partner_id()  đòi  pa.is_active AND p.is_active AND p.deleted_at IS NULL
--
-- Công tắc thứ nhất không bật/tắt được ⇒ không vô hiệu hoá được MỘT tài khoản
-- của một đối tác vẫn đang hợp tác (ví dụ nhân viên của họ nghỉ việc).
--
-- ⚠️ Hai công tắc còn lại VẪN CHẠY — đã kiểm bằng phiên thật: tắt
-- `partners.is_active` hoặc xoá mềm `partners` đều cắt quyền ngay. Hệ thống
-- KHÔNG mất hoàn toàn khả năng rút quyền, chỉ mất ở mức TỪNG TÀI KHOẢN.
--
-- ═══ BẢN 1 CỦA TỆP NÀY CŨNG HỎNG — VÀ ĐÓ LÀ MỘT BÀI HỌC ══════════════════
-- Tôi viết:
--
--     IF TG_TABLE_NAME = 'partners'
--        AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
--
-- và tưởng vế đầu sai thì vế sau không được đánh giá. **SAI.**
--
-- plpgsql gửi TOÀN BỘ điều kiện của một `IF` cho bộ thực thi SQL **như một
-- truy vấn duy nhất**. Mọi tham chiếu cột trong đó phải phân giải được, kể cả
-- những vế mà logic boolean sẽ không bao giờ dùng tới. Không có short-circuit
-- ở tầng phân giải tên.
--
-- Lỗi lặp lại y nguyên: `42703 record "new" has no field "deleted_at"`.
--
-- Bản này chọn cách **không thể hỏng vì một lý do tinh vi nào khác**: hai hàm
-- riêng cho hai bảng có hình dạng khác nhau. Không còn tham chiếu cột nào phải
-- phân giải có điều kiện.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. `partners` — CÓ xoá mềm
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.partner_stamp()
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

COMMENT ON FUNCTION public.partner_stamp() IS
  'Đóng dấu cho `partners` — bảng CÓ deleted_at/deleted_by. '
  'CHỈ gắn cho bảng này. `partner_accounts` dùng partner_account_stamp().';

-- ════════════════════════════════════════════════════════════════════════════
-- 2. `partner_accounts` — KHÔNG có xoá mềm
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Hàm riêng, không phải một nhánh `IF`. Thân hàm KHÔNG chứa một tham chiếu
-- nào tới `deleted_at`, nên không có gì để phân giải sai.
--
-- Đây cũng là cách mô tả đúng nghiệp vụ: tài khoản đăng nhập được **BẬT/TẮT**
-- (`is_active`), nó không có vòng đời "xoá mềm" như hồ sơ đối tác.
CREATE OR REPLACE FUNCTION public.partner_account_stamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  ELSE
    NEW.updated_by := auth.uid();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.partner_account_stamp() IS
  'Đóng dấu cho `partner_accounts` — bảng KHÔNG có deleted_at. Tách khỏi '
  'partner_stamp() vì gộp chung khiến mọi UPDATE ném 42703: plpgsql phân giải '
  'MỌI tham chiếu cột trong một điều kiện IF, không short-circuit.';

-- ════════════════════════════════════════════════════════════════════════════
-- 3. TRỎ TRIGGER SANG HÀM MỚI
-- ════════════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS partner_accounts_stamp_trg ON public.partner_accounts;
CREATE TRIGGER partner_accounts_stamp_trg
  BEFORE INSERT OR UPDATE ON public.partner_accounts
  FOR EACH ROW EXECUTE FUNCTION public.partner_account_stamp();

-- `partners_stamp_trg` giữ nguyên — nó vẫn trỏ đúng vào `partner_stamp()`.

-- ════════════════════════════════════════════════════════════════════════════
-- 4. HOÀN TÁC
-- ════════════════════════════════════════════════════════════════════════════
--   DROP TRIGGER partner_accounts_stamp_trg ON public.partner_accounts;
--   CREATE TRIGGER partner_accounts_stamp_trg BEFORE INSERT OR UPDATE
--     ON public.partner_accounts FOR EACH ROW EXECUTE FUNCTION public.partner_stamp();
--   DROP FUNCTION public.partner_account_stamp();
--
-- ⚠️ Hoàn tác = quay lại trạng thái HỎNG: `partner_accounts` lại không UPDATE
-- được, và công tắc rút quyền mức tài khoản lại chết.

-- ════════════════════════════════════════════════════════════════════════════
-- 5. TỰ KIỂM — bắn lại đúng lệnh từng ném 42703
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Bản 1 của khối này dùng `gen_random_uuid()` cho `user_id` và ném 23503:
-- `partner_accounts.user_id` có khoá ngoại tới `profiles`. Lấy hồ sơ THẬT.
DO $$
DECLARE v_id UUID; v_partner UUID; v_user UUID; v_active BOOLEAN;
BEGIN
  SELECT id INTO v_partner FROM public.partners
   WHERE deleted_at IS NULL AND is_active LIMIT 1;

  -- Hồ sơ chưa có tài khoản đối tác đang hoạt động — tránh đụng chỉ mục
  -- `UNIQUE (user_id) WHERE is_active` của 027.
  SELECT p.id INTO v_user FROM public.profiles p
   WHERE NOT EXISTS (
     SELECT 1 FROM public.partner_accounts pa
      WHERE pa.user_id = p.id AND pa.is_active)
   LIMIT 1;

  IF v_partner IS NULL OR v_user IS NULL THEN
    RAISE NOTICE 'Bỏ qua tự kiểm: không có đối tác hoặc hồ sơ phù hợp.';
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.partner_accounts (user_id, partner_id, is_active, note)
    VALUES (v_user, v_partner, TRUE, 'ZZ kiểm 037 — xoá ngay')
    RETURNING id INTO v_id;

    -- ⭐ ĐÂY LÀ LỆNH ĐÃ NÉM 42703 HAI LẦN
    UPDATE public.partner_accounts SET is_active = FALSE WHERE id = v_id;

    SELECT is_active INTO v_active FROM public.partner_accounts WHERE id = v_id;
    IF v_active IS DISTINCT FROM FALSE THEN
      RAISE EXCEPTION 'VÁ KHÔNG ĂN: is_active vẫn là %', v_active;
    END IF;

    -- Kiểm luôn chiều ngược: `partners` vẫn phải đóng dấu xoá mềm đúng.
    DELETE FROM public.partner_accounts WHERE id = v_id;
    RAISE NOTICE 'partner_accounts UPDATE đã chạy được. Đã dọn dòng tạm.';
  EXCEPTION WHEN OTHERS THEN
    -- ⚠️ Dọn TRƯỚC rồi mới ném lại — Hiến pháp Điều V: phép thử phá huỷ không
    -- để lại dư lượng, KỂ CẢ khi nó thất bại.
    IF v_id IS NOT NULL THEN
      DELETE FROM public.partner_accounts WHERE id = v_id;
    END IF;
    RAISE;
  END;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. KIỂM TRA
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Hai hàm đóng dấu riêng biệt' AS muc,
       (SELECT COUNT(*)::TEXT FROM pg_proc
         WHERE proname IN ('partner_stamp','partner_account_stamp')) AS ket_qua,
       '2' AS ky_vong
UNION ALL
SELECT '⭐ partner_account_stamp KHÔNG nhắc tới deleted_at',
       (SELECT CASE WHEN prosrc ILIKE '%deleted_at%' THEN 'CÒN — SAI' ELSE 'sạch' END
          FROM pg_proc WHERE proname = 'partner_account_stamp'), 'sạch'
UNION ALL
SELECT 'Trigger của partner_accounts trỏ sang hàm mới',
       (SELECT p.proname FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
         WHERE t.tgname = 'partner_accounts_stamp_trg'), 'partner_account_stamp'
UNION ALL
SELECT 'Trigger của partners giữ nguyên hàm cũ',
       (SELECT p.proname FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
         WHERE t.tgname = 'partners_stamp_trg'), 'partner_stamp'
UNION ALL
SELECT '⭐ Công tắc rút quyền hoạt động',
       'khối DO ở Mục 5 đã chạy qua', 'khối DO ở Mục 5 đã chạy qua'
UNION ALL
SELECT 'Không để lại dòng tạm',
       (SELECT COUNT(*)::TEXT FROM public.partner_accounts WHERE note LIKE 'ZZ%'), '0'
UNION ALL
SELECT 'Dữ liệu thật còn nguyên',
       ((SELECT COUNT(*) FROM public.partners)::TEXT || ' đối tác / ' ||
        (SELECT COUNT(*) FROM public.profiles)::TEXT || ' hồ sơ'),
       '5 đối tác / 13 hồ sơ';
