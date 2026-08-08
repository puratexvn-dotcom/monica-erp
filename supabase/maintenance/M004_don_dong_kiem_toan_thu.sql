-- ============================================================================
-- M004 · DỌN DÒNG SỔ KIỂM TOÁN DO BÀI KIỂM SINH RA
--
-- ⚠️ **ĐÁNH SỐ LẠI 08/08/2026.** Tệp này ban đầu mang số `M003` — **trùng** với
--    `M003_don_du_lieu_thu_luong_md.sql` đã có từ 07/08/2026. Hai tệp cùng số
--    trong một thư mục là cách chắc chắn để người sau chạy nhầm tệp.
--
-- 📐 `K-1`: *"Ghi một dòng vào sổ cái để kiểm trigger ⇒ ⛔ không xoá ra được…
--    **Phải viết một Maintenance Script để dọn.**"*
-- 📐 ADR-030 §4 · migration `056`
--
-- 🔴 **ĐÂY LÀ MỘT ĐƯỜNG PHÁ HÀNG RÀO CÓ CHỦ Ý.** Đọc hết trước khi chạy.
--
-- ════════════════════════════════════════════════════════════════════════════
-- ĐỌC TRƯỚC KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
-- `056` khoá `activity_log` bất biến với **mọi vai**, kể cả `service_role`.
-- Tệp này **tạm gỡ trigger** để dọn, rồi **gắn lại**. Nghĩa là trong khoảng
-- giữa hai lệnh đó, sổ kiểm toán **⛔ KHÔNG được bảo vệ**.
--
-- ⚠️ CHỈ CHẠY KHI:
--   ① Bạn là **chủ sở hữu bảng** — chạy qua **SQL Editor**, ⛔ không phải qua
--      khoá `service_role` của ứng dụng. `service_role` ⛔ KHÔNG chạy nổi
--      `ALTER TABLE ... DISABLE TRIGGER`, và đó là **chủ ý**.
--   ② Bạn đã đọc và hiểu rằng việc này **để lại vết** — đúng như thiết kế.
--   ③ Bạn dọn **ĐÚNG dòng của bài kiểm**, ⛔ không dọn dữ liệu nghiệp vụ.
--
-- ⛔ **TUYỆT ĐỐI ⛔ KHÔNG** nới điều kiện `WHERE` ở dưới. Mỗi ký tự nới ra là
--    một dòng bằng chứng vận hành biến mất, và ⛔ không có đường lấy lại.
--
-- 🔑 Nếu bạn thấy mình muốn chạy tệp này **thường xuyên**, thì vấn đề ⛔ không
--    nằm ở tệp này — nó nằm ở chỗ **bài kiểm đang ghi vào sổ thật**. Hãy sửa
--    bài kiểm, ⛔ đừng dọn sổ đều đặn.
-- ============================================================================

BEGIN;

-- ─── 1. XEM TRƯỚC — ⛔ ĐỪNG BỎ QUA BƯỚC NÀY ────────────────────────────────
-- Chạy riêng câu này TRƯỚC, đọc kết quả, rồi mới chạy phần dưới.
SELECT id, entity_type, entity_id, action, created_at, changes
  FROM public.activity_log
 WHERE entity_id = '00000000-0000-0000-0000-000000000000'
   AND (changes ? '__tu_kiem_056'
     OR changes ? '__kiem_bat_bien'
     OR changes ? '__kiem_doi_chung'
     OR changes ? '__do_kiem')
 ORDER BY created_at DESC;

-- ─── 2. GỠ HÀNG RÀO — chỉ chủ sở hữu bảng làm được ─────────────────────────
ALTER TABLE public.activity_log DISABLE TRIGGER mos_activity_log_immutable;

-- ─── 3. DỌN — ⚠️ ĐIỀU KIỆN HẸP, ⛔ KHÔNG ĐƯỢC NỚI ──────────────────────────
-- 🔑 Ba lớp lọc cùng lúc, và cả ba đều bắt buộc:
--   · `entity_id` = UUID rỗng  → dữ liệu nghiệp vụ thật ⛔ không bao giờ dùng nó
--   · khoá `__…` trong `changes` → chỉ bài kiểm mới ghi
--   · trong 7 ngày             → ⛔ không đụng bất cứ thứ gì cũ hơn
DELETE FROM public.activity_log
 WHERE entity_id = '00000000-0000-0000-0000-000000000000'
   AND (changes ? '__tu_kiem_056'
     OR changes ? '__kiem_bat_bien'
     OR changes ? '__kiem_doi_chung'
     OR changes ? '__do_kiem')
   AND created_at > now() - interval '7 days';

-- ─── 4. GẮN LẠI HÀNG RÀO — ⛔ KHÔNG ĐƯỢC QUÊN ──────────────────────────────
ALTER TABLE public.activity_log ENABLE TRIGGER mos_activity_log_immutable;

-- ─── 5. TỰ KIỂM — hàng rào PHẢI đứng lại được ──────────────────────────────
DO $$
-- ⚠️ `activity_log.id` là **SỐ NGUYÊN**, ⛔ không phải UUID — đã đo trên CSDL
--    đang chạy. `entity_id` mới là `UUID`.
DECLARE v_id BIGINT; v_loi TEXT;
BEGIN
  INSERT INTO public.activity_log (entity_type, entity_id, action, changes)
  VALUES ('ORDER', '00000000-0000-0000-0000-000000000000', 'CREATE',
          '{"__tu_kiem_m003": true}'::jsonb)
  RETURNING id INTO v_id;

  v_loi := NULL;
  BEGIN DELETE FROM public.activity_log WHERE id = v_id;
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE; END;

  IF v_loi IS NULL THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM M004: hàng rào ⛔ KHÔNG gắn lại được — sổ đang HỞ. '
                    'ĐỪNG rời màn hình cho tới khi ENABLE TRIGGER chạy xong.';
  END IF;
  RAISE NOTICE '✅ M004: đã dọn và hàng rào ĐÃ đứng lại (dòng tự kiểm % ở lại).', v_id;
END $$;

COMMIT;

-- ⚠️ Dòng `__tu_kiem_m003` của bước 5 **Ở LẠI** — chính nó chứng minh hàng rào
--    đã gắn lại. Đó ⛔ không phải rác quên dọn; nó là **bằng chứng**.
-- ============================================================================
