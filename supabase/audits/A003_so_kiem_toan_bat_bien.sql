-- ============================================================================
-- A003 · KIỂM SỔ KIỂM TOÁN BẤT BIẾN — **TẦNG TRIGGER** VÀ **TRUNCATE**
--
-- 📐 Board Directive *FAST SECURITY FIX* §3–§4 · ADR-030 · migration `056`
--
-- ⚠️ **⛔ KHÔNG phải migration.** Chỉ ĐỌC và THỬ; ⛔ không đổi lược đồ, ⛔ không
--    để lại thay đổi nào ngoài vài dòng ghi thêm vào sổ *(⛔ không xoá được —
--    đó chính là điều nó chứng minh)*.
--
-- ════════════════════════════════════════════════════════════════════════════
-- VÌ SAO PHẢI CÓ TỆP NÀY — bài kiểm Node **⛔ KHÔNG** đủ
-- ════════════════════════════════════════════════════════════════════════════
-- `scripts/kiem-so-kiem-toan.mjs` chạy bằng `service_role` và cho **9/9 ĐẠT**.
-- Nhưng mã lỗi nó nhận là:
--
--     42501: permission denied for table activity_log
--
-- 🔑 Đó là **tầng `REVOKE`** chặn, ⛔ **KHÔNG PHẢI trigger**. PostgreSQL kiểm
--    quyền **TRƯỚC**, nên trigger ⛔ không bao giờ có cơ hội nổ với một vai đã
--    bị thu hồi quyền.
--
-- ⇒ Hai thứ **⛔ CHƯA được chứng minh bằng hành vi**:
--   ① **Trigger có thật sự chặn ⛔ không**, khi vai gọi **CÓ** quyền
--      *(chủ sở hữu bảng — và đây đúng là ca trigger sinh ra để lo: một
--      migration tương lai lỡ `GRANT ALL` trở lại)*.
--   ② **`TRUNCATE` có bị chặn ⛔ không** — PostgREST **⛔ không có động từ
--      TRUNCATE**, nên ⛔ không bài kiểm Node nào phát nổi lệnh đó.
--
-- ⚠️ Cả hai chỉ đo được **từ SQL Editor, bằng chủ sở hữu bảng**. Đó là lý do
--    tệp này tồn tại thay vì thêm vài dòng vào script Node.
--
-- ─── CHẠY ────────────────────────────────────────────────────────────────
--   Dán toàn bộ vào Supabase SQL Editor. Đọc bảng kết quả cuối.
--   Mọi dòng phải là `ĐẠT`.
-- ============================================================================

DO $$
DECLARE
  v_id      BIGINT;
  v_loi     TEXT;
  v_kq      TEXT := '';
  v_hong    INT  := 0;
BEGIN
  -- ── 1. INSERT PHẢI CÒN CHẠY ──────────────────────────────────────────────
  -- ⭐ Cặp `K-3`: có phép CẤM thì phải có phép CHO. Một sổ chặn hết mọi thứ
  --    ⛔ không phải sổ bất biến — nó là sổ CHẾT.
  BEGIN
    INSERT INTO public.activity_log (entity_type, entity_id, action, changes)
    VALUES ('ORDER', '00000000-0000-0000-0000-000000000000', 'CREATE',
            '{"__a003_ghi_them": true}'::jsonb)
    RETURNING id INTO v_id;
    v_kq := v_kq || format('ĐẠT   ⭐ 1. INSERT vẫn chạy (id=%s)%s', v_id, chr(10));
  EXCEPTION WHEN OTHERS THEN
    v_hong := v_hong + 1;
    v_kq := v_kq || format('HỎNG  ⭐ 1. INSERT bị chặn (%s) — SỔ ĐÃ CHẾT%s', SQLSTATE, chr(10));
    RETURN;
  END;

  -- ── 2. UPDATE PHẢI BỊ TRIGGER CHẶN ───────────────────────────────────────
  -- 🔑 Chạy dưới **chủ sở hữu**, tức vai **CÓ** quyền UPDATE. Nếu vẫn bị chặn
  --    thì chặn đó **chỉ có thể** đến từ trigger — đây là phép thử duy nhất
  --    phân biệt được tầng `REVOKE` với tầng `TRIGGER`.
  v_loi := NULL;
  BEGIN UPDATE public.activity_log SET action = 'DELETE' WHERE id = v_id;
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE; END;
  IF v_loi = 'P0403' THEN
    v_kq := v_kq || format('ĐẠT   🔴 2. UPDATE bị TRIGGER chặn (P0403)%s', chr(10));
  ELSE
    v_hong := v_hong + 1;
    v_kq := v_kq || format('HỎNG  🔴 2. UPDATE ⛔ KHÔNG bị trigger chặn (SQLSTATE=%s)%s',
                           COALESCE(v_loi, 'KHÔNG LỖI'), chr(10));
  END IF;

  -- ── 3. DELETE PHẢI BỊ TRIGGER CHẶN ───────────────────────────────────────
  v_loi := NULL;
  BEGIN DELETE FROM public.activity_log WHERE id = v_id;
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE; END;
  IF v_loi = 'P0403' THEN
    v_kq := v_kq || format('ĐẠT   🔴 3. DELETE bị TRIGGER chặn (P0403)%s', chr(10));
  ELSE
    v_hong := v_hong + 1;
    v_kq := v_kq || format('HỎNG  🔴 3. DELETE ⛔ KHÔNG bị trigger chặn (SQLSTATE=%s)%s',
                           COALESCE(v_loi, 'KHÔNG LỖI'), chr(10));
  END IF;

  -- ── 4. 🔴 TRUNCATE PHẢI BỊ CHẶN — PHÉP THỬ QUAN TRỌNG NHẤT ───────────────
  -- `041` đã cảnh báo đúng: *"TRUNCATE bỏ qua trigger [cấp dòng], bỏ qua RLS,
  -- và ⛔ không sinh dòng audit nào — một lệnh, sạch cả bảng, ⛔ không một dấu
  -- vết."* Nếu dòng dưới ⛔ KHÔNG nổ, cả migration `056` là vô nghĩa: kẻ tấn
  -- công ⛔ không cần sửa từng dòng, họ xoá cả sổ bằng một lệnh.
  --
  -- ⚠️ An toàn: `TRUNCATE` nằm trong khối `EXCEPTION`; nếu nó CHẠY thì giao
  --    dịch bị `RAISE` ở cuối kéo quay lui — dữ liệu ⛔ không mất.
  v_loi := NULL;
  BEGIN TRUNCATE public.activity_log;
  EXCEPTION WHEN OTHERS THEN v_loi := SQLSTATE; END;
  IF v_loi = 'P0403' THEN
    v_kq := v_kq || format('ĐẠT   🔴 4. TRUNCATE bị TRIGGER chặn (P0403)%s', chr(10));
  ELSE
    v_hong := v_hong + 1;
    v_kq := v_kq || format('HỎNG  🔴 4. TRUNCATE ⛔ KHÔNG bị chặn (SQLSTATE=%s) — SỔ CÓ THỂ BỊ XOÁ SẠCH%s',
                           COALESCE(v_loi, 'KHÔNG LỖI'), chr(10));
  END IF;

  -- ── 5. DỮ LIỆU PHẢI CÒN NGUYÊN ───────────────────────────────────────────
  -- 🔑 Ném lỗi là **⛔ chưa đủ**. Một hàng rào ném lỗi rồi vẫn ghi là hàng rào
  --    **tệ hơn ⛔ không có**, vì nó tạo cảm giác an toàn sai.
  IF (SELECT count(*) FROM public.activity_log WHERE id = v_id AND action = 'CREATE') = 1 THEN
    v_kq := v_kq || format('ĐẠT   🔴 5. Dòng thử CÒN NGUYÊN sau cả ba phép%s', chr(10));
  ELSE
    v_hong := v_hong + 1;
    v_kq := v_kq || format('HỎNG  🔴 5. Dòng thử ⛔ KHÔNG còn nguyên vẹn%s', chr(10));
  END IF;

  RAISE NOTICE '%', chr(10) || v_kq
    || format('════════ A003: %s hỏng ════════', v_hong);

  IF v_hong > 0 THEN
    RAISE EXCEPTION 'A003: % phép thử HỎNG — sổ kiểm toán ⛔ CHƯA bất biến.', v_hong;
  END IF;
END $$;

-- ── TRẠNG THÁI LƯỢC ĐỒ — bổ sung cho phép đo hành vi ở trên ─────────────────
SELECT 'trigger canh bất biến' AS muc,
       (SELECT count(*)::text FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
         WHERE c.relname = 'activity_log' AND NOT t.tgisinternal
           AND t.tgname LIKE 'mos_activity_log%') AS thuc_te,
       '2' AS ky_vong
UNION ALL
SELECT 'trigger đang BẬT (⛔ không bị DISABLE)',
       (SELECT count(*)::text FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
         WHERE c.relname = 'activity_log' AND NOT t.tgisinternal
           AND t.tgname LIKE 'mos_activity_log%' AND t.tgenabled = 'O'), '2'
UNION ALL
SELECT 'vai CÒN quyền huỷ hoại (mọi vai)',
       (SELECT count(*)::text FROM information_schema.role_table_grants
         WHERE table_schema = 'public' AND table_name = 'activity_log'
           AND privilege_type IN ('UPDATE', 'DELETE', 'TRUNCATE')), '0';

-- ⚠️ Dòng `__a003_ghi_them` **Ở LẠI** trong sổ. Đó ⛔ không phải rác quên dọn —
--    nó là **bằng chứng** rằng phép thử đã chạy và sổ ⛔ không xoá được.
--    Dọn khi cần: `supabase/maintenance/M004_don_dong_kiem_toan_thu.sql`.
-- ============================================================================
