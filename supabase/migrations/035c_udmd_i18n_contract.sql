-- ============================================================================
-- MONICA MOS — 035c · UDMD ĐA NGÔN NGỮ · BƯỚC CONTRACT
--
-- Thiết kế: docs/adr/ADR-005-udmd-i18n-and-soft-delete.md (ĐÃ PHÊ DUYỆT)
-- Ảnh chụp bắt buộc: supabase/snapshots/035c_pre_drop_defect_catalog.sql
--
-- ⚠️ ĐÂY LÀ BƯỚC DUY NHẤT CỦA CHUỖI 035 KHÔNG HOÀN TÁC ĐƯỢC BẰNG MỘT LỆNH.
-- Sau khi chạy, `name_vi` và `name_en` biến mất khỏi lược đồ.
--
-- ─── ĐIỀU KIỆN TIÊN QUYẾT ĐÃ KIỂM ────────────────────────────────────────
--   ✅ 035a chạy xong: 20/20 mã lỗi backfill, 0 dòng lệch
--   ✅ 035b chạy xong: quality.service · partner.service · DTO đọc JSONB
--   ✅ live-023 toàn đạt sau 035b
--   ✅ Rà mã nguồn: KHÔNG tệp nào còn đọc name_vi/name_en (chỉ còn chú thích)
--   ✅ Ảnh chụp 20 dòng khôi phục đã sinh và commit
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. THAY TRIGGER ĐỒNG BỘ BẰNG TRIGGER CHUẨN HOÁ
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ CHỖ NÀY SUÝT LÀ MỘT LỖ HỔNG ÂM THẦM.
--
-- Trigger đồng bộ của 035a làm HAI việc: đồng bộ hai chiều, VÀ gỡ khoá rỗng.
-- Gỡ nó đi mà không thay thế thì việc thứ hai biến mất — và `{"vi":"   "}` sẽ
-- đi lọt, vì `CHECK` đơn giản chỉ chặn `{}` chứ không nhìn vào giá trị.
--
-- Hậu quả: danh mục có khoá nhưng không có chữ ⇒ chuỗi dự phòng dừng lại ở đó
-- ⇒ màn hình hiện Ô TRỐNG. Đúng thứ cả thiết kế này sinh ra để tránh, quay lại
-- qua cửa sau.
--
-- Nên đồng bộ thì gỡ, còn CHUẨN HOÁ thì Ở LẠI VĨNH VIỄN.
CREATE OR REPLACE FUNCTION public.mos_normalize_translations()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.name_translations := public.mos_strip_blank_translations(NEW.name_translations);
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.mos_normalize_translations() IS
  'Gỡ khoá rỗng trước khi ghi. Thay phần việc mà CHECK không làm được — '
  'PostgreSQL cấm subquery trong CHECK. Ở LẠI VĨNH VIỄN, khác trigger đồng bộ '
  'hai chiều của 035a vốn chỉ sống trong cửa sổ chuyển tiếp.';

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['defect_catalog', 'contract_types'] LOOP
    -- Trigger chuẩn hoá MỚI, gắn trước khi gỡ trigger cũ: không có khoảnh khắc
    -- nào bảng không được bảo vệ.
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_normalize_i18n_trg', t);
    EXECUTE format($f$
      CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.mos_normalize_translations()
    $f$, t || '_normalize_i18n_trg', t);

    -- Giờ mới gỡ trigger đồng bộ hai chiều — nó đã hết việc.
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_sync_i18n_trg', t);
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. GỠ HAI CỘT CŨ — ĐIỂM KHÔNG QUAY LẠI
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Chốt an toàn cuối cùng: TỪ CHỐI CHẠY nếu backfill có bất kỳ dòng nào lệch.
-- Không có chốt này thì một lỗi backfill chưa ai phát hiện sẽ được `DROP COLUMN`
-- biến thành mất dữ liệu vĩnh viễn — và lúc đó không còn gì để so sánh nữa.
DO $$
DECLARE v_bad INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bad FROM public.defect_catalog
   WHERE name_vi IS DISTINCT FROM name_translations->>'vi'
      OR COALESCE(name_en, '') IS DISTINCT FROM COALESCE(name_translations->>'en', '');
  IF v_bad > 0 THEN
    RAISE EXCEPTION
      'DỪNG LẠI: % dòng defect_catalog có name_vi/name_en KHÔNG khớp name_translations. '
      'Backfill của 035a chưa toàn vẹn — không được DROP cột.', v_bad
      USING ERRCODE = 'data_exception';
  END IF;

  SELECT COUNT(*) INTO v_bad FROM public.contract_types
   WHERE name_vi IS DISTINCT FROM name_translations->>'vi';
  IF v_bad > 0 THEN
    RAISE EXCEPTION
      'DỪNG LẠI: % dòng contract_types lệch giữa cột cũ và JSONB.', v_bad
      USING ERRCODE = 'data_exception';
  END IF;
END $$;

ALTER TABLE public.defect_catalog DROP COLUMN IF EXISTS name_vi;
ALTER TABLE public.defect_catalog DROP COLUMN IF EXISTS name_en;
ALTER TABLE public.contract_types DROP COLUMN IF EXISTS name_vi;
ALTER TABLE public.contract_types DROP COLUMN IF EXISTS name_en;

-- ⚠️ `mos_sync_udmd_translations()` giờ không còn trigger nào gọi. GIỮ LẠI hàm
-- một thời gian: gỡ nó là xoá luôn đường quay lui nhanh nếu phải dựng lại cột.
-- Dọn ở 037 sau khi 035c đã sống yên vài tuần.

-- ════════════════════════════════════════════════════════════════════════════
-- 3. HOÀN TÁC — KHÔNG PHẢI MỘT LỆNH
-- ════════════════════════════════════════════════════════════════════════════
--   ① ALTER TABLE defect_catalog ADD COLUMN name_vi TEXT, ADD COLUMN name_en TEXT;
--      ALTER TABLE contract_types ADD COLUMN name_vi TEXT, ADD COLUMN name_en TEXT;
--   ② Chạy: supabase/snapshots/035c_pre_drop_defect_catalog.sql
--      (hoặc backfill ngược từ name_translations — dữ liệu vẫn còn đủ)
--   ③ ALTER TABLE defect_catalog ALTER COLUMN name_vi SET NOT NULL;   -- và contract_types
--   ④ Dựng lại trigger đồng bộ (hàm mos_sync_udmd_translations vẫn còn)
--   ⑤ Trả quality.service.ts · partner.service.ts · ContractTypeDTO về bản 035a
--
-- ⚠️ Năm bước, không phải một dòng `ALTER`. Đó là cái giá của bước CONTRACT, và
-- nó được trả có ý thức chứ không phải phát hiện lúc cần quay lui.

-- ════════════════════════════════════════════════════════════════════════════
-- 4. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Hai cột cũ ĐÃ BIẾN MẤT' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema='public' AND column_name IN ('name_vi','name_en')
           AND table_name IN ('defect_catalog','contract_types')) AS ket_qua,
       '0' AS ky_vong
UNION ALL
SELECT '⭐ 20 mã lỗi CÒN NGUYÊN',
       (SELECT COUNT(*)::TEXT FROM public.defect_catalog), '20'
UNION ALL
SELECT '⭐ Không dòng nào mất bản dịch tiếng Việt',
       (SELECT COUNT(*)::TEXT FROM public.defect_catalog
         WHERE COALESCE(TRIM(name_translations->>'vi'), '') = ''), '0'
UNION ALL
SELECT '⭐ Không dòng nào mất bản dịch tiếng Anh',
       (SELECT COUNT(*)::TEXT FROM public.defect_catalog
         WHERE COALESCE(TRIM(name_translations->>'en'), '') = ''), '0'
UNION ALL
SELECT 'Trigger đồng bộ hai chiều ĐÃ GỠ',
       (SELECT COUNT(*)::TEXT FROM pg_trigger
         WHERE tgname IN ('defect_catalog_sync_i18n_trg','contract_types_sync_i18n_trg')), '0'
UNION ALL
SELECT '⭐ Trigger CHUẨN HOÁ Ở LẠI (không để lọt khoá rỗng)',
       (SELECT COUNT(*)::TEXT FROM pg_trigger
         WHERE tgname IN ('defect_catalog_normalize_i18n_trg','contract_types_normalize_i18n_trg')), '2'
UNION ALL
SELECT 'Ràng buộc chặn {} vẫn còn',
       (SELECT COUNT(*)::TEXT FROM pg_constraint
         WHERE conname IN ('defect_catalog_translations_shape','contract_types_translations_shape')), '2'
UNION ALL
SELECT 'Hàm hoàn tác vẫn giữ (đường quay lui nhanh)',
       (SELECT COUNT(*)::TEXT FROM pg_proc WHERE proname = 'mos_sync_udmd_translations'), '1'
UNION ALL
SELECT 'Ví dụ dòng đầu — đọc được cả hai tiếng',
       (SELECT name_translations->>'vi' || ' / ' || COALESCE(name_translations->>'en','—')
          FROM public.defect_catalog ORDER BY code LIMIT 1),
       'Đứt chỉ / Broken thread';
