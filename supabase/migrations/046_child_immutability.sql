-- ============================================================================
-- MONICA ONE — 046 · AGGREGATE CHILD IMMUTABILITY
--
-- 📐 ADR-020 · Board Decision 05/08/2026
-- 🔑 Vá `B-3`: khoản mục của chứng từ ĐÃ DUYỆT vẫn sửa/thêm/xoá được
--
-- ⛔ CHƯA CHẠY. Chờ Board phê duyệt ADR-020 + phản biện độc lập.
--
-- ─── LỖ HỔNG, ĐO ĐƯỢC ────────────────────────────────────────────────────
--   costings đã APPROVED  → sửa quoted_price → BỊ CHẶN (23514)   ✅
--   costing_items của nó  → sửa unit_price   → SỬA ĐƯỢC, thành 88 ⛔
-- Khoản mục đổi ⇒ tổng tiền chứng từ đã duyệt đổi theo. Bằng chứng phê duyệt
-- (Điều 8) mất giá trị bằng một đường vòng.
--
-- ─── MỞ RỘNG METADATA, ⛔ KHÔNG VIẾT ENGINE THỨ HAI ──────────────────────
--   parent_table  bảng cha; NULL ⇒ ROOT (hành vi 045, không đổi)
--   parent_fk     cột khoá ngoại trỏ vào cha
-- Thêm một bảng con = **một INSERT**. ⛔ Không sửa hàm, ⛔ không thêm trigger
-- riêng cho từng bảng.
--
-- ─── TỆP NÀY TỰ ĐO MÌNH TRƯỚC KHI COMMIT ────────────────────────────────
-- ADR-020 §6.2 ghi `[NO EVIDENCE]`: tôi **giả định** trigger `BEFORE DELETE`
-- trên con nhìn thấy dòng cha đã biến mất trong lúc `ON DELETE CASCADE`. Nếu
-- Postgres xoá con TRƯỚC cha thì phép phân biệt sai hoàn toàn, và mọi lệnh xoá
-- cha sẽ bị chặn.
--
-- Không đo được điều đó trước khi trigger tồn tại. ⇒ Mục 5 **dựng dữ liệu thật,
-- chạy thử cascade, rồi dọn** — tất cả trong CÙNG giao dịch. Giả định sai thì
-- migration `RAISE` và toàn bộ quay lui. **Không có khả năng nó lên production
-- kèm một giả định chưa kiểm.**
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. METADATA — hai cột mới
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.mos_aggregate_immutability
  ADD COLUMN IF NOT EXISTS parent_table TEXT,
  ADD COLUMN IF NOT EXISTS parent_fk    TEXT;

-- Khai báo con phải đủ CẢ HAI cột, hoặc không cột nào (⇒ là root).
ALTER TABLE public.mos_aggregate_immutability
  DROP CONSTRAINT IF EXISTS mos_agg_immut_parent_pair;
ALTER TABLE public.mos_aggregate_immutability
  ADD  CONSTRAINT mos_agg_immut_parent_pair
  CHECK ((parent_table IS NULL) = (parent_fk IS NULL));

COMMENT ON COLUMN public.mos_aggregate_immutability.parent_table IS
  'ADR-020. NULL ⇒ dòng này là aggregate ROOT. Khác NULL ⇒ bảng con, và trạng '
  'thái Final đọc từ dòng CHA qua parent_fk.';


-- ════════════════════════════════════════════════════════════════════════════
-- 2. ENGINE — mở rộng ĐÚNG MỘT hàm
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Vẫn CỐ Ý không `SECURITY DEFINER`. ADR-020 §3.1: fail-closed thay vì mở
-- rộng bề mặt định danh. Không đọc được dòng cha ⇒ CHẶN, không phải cho qua.
CREATE OR REPLACE FUNCTION public.mos_guard_aggregate_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  cfg      public.mos_aggregate_immutability%ROWTYPE;
  cha      public.mos_aggregate_immutability%ROWTYPE;
  dong     RECORD;
  cu       JSONB;
  moi      JSONB;
  tt       TEXT;
  khoa     TEXT;
  cha_id   UUID;
  co_cha   BOOLEAN;
  vi_pham  TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SELECT * INTO cfg FROM public.mos_aggregate_immutability
   WHERE table_name = TG_TABLE_NAME;
  IF NOT FOUND THEN RETURN COALESCE(NEW, OLD); END IF;

  -- Dòng để đối chiếu: `DELETE` không có NEW, `INSERT` không có OLD.
  dong := COALESCE(NEW, OLD);

  -- ══ NHÁNH ROOT — hành vi `045`, giữ nguyên từng chữ ═════════════════════
  IF cfg.parent_table IS NULL THEN
    IF TG_OP <> 'UPDATE' THEN RETURN NEW; END IF;
    cu := to_jsonb(OLD); moi := to_jsonb(NEW);
    tt := cu ->> cfg.status_column;
    IF tt IS NULL OR NOT (tt = ANY (cfg.final_states)) THEN RETURN NEW; END IF;

    FOR khoa IN SELECT jsonb_object_keys(cu) LOOP
      CONTINUE WHEN khoa = ANY (cfg.mutable_after_final);
      IF (cu -> khoa) IS DISTINCT FROM (moi -> khoa) THEN
        vi_pham := vi_pham || khoa;
      END IF;
    END LOOP;

    IF cardinality(vi_pham) > 0 THEN
      RAISE EXCEPTION 'Chứng từ % đã ở trạng thái %, không sửa được nội dung. '
        'Cột bị đổi: %', TG_TABLE_NAME, tt, array_to_string(vi_pham, ', ')
        USING ERRCODE = '23514',
              HINT = 'Lập chứng từ điều chỉnh thay vì sửa bản đã chốt.';
    END IF;
    RETURN NEW;
  END IF;

  -- ══ NHÁNH CON ═══════════════════════════════════════════════════════════
  SELECT * INTO cha FROM public.mos_aggregate_immutability
   WHERE table_name = cfg.parent_table;
  IF NOT FOUND THEN
    RAISE EXCEPTION '% khai cha là % nhưng % chưa có khai báo bất biến.',
      TG_TABLE_NAME, cfg.parent_table, cfg.parent_table USING ERRCODE = '23514';
  END IF;

  EXECUTE format('SELECT ($1 ->> %L)::uuid', cfg.parent_fk) INTO cha_id USING to_jsonb(dong);
  IF cha_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  -- Đọc trạng thái dòng cha. `SECURITY INVOKER` ⇒ câu này chịu RLS của người gọi.
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE id = $1), '
                 '(SELECT %I::text FROM public.%I WHERE id = $1)',
                 cfg.parent_table, cha.status_column, cfg.parent_table)
    INTO co_cha, tt USING cha_id;

  -- ── ADR-020 §3.2 · ngoại lệ CASCADE ────────────────────────────────────
  -- Cha đã biến mất + đang DELETE ⇒ đây là `ON DELETE CASCADE`, không phải
  -- người dùng xoá con. Cho qua. Mục 5 ĐO rằng nhánh này thật sự chạy.
  IF NOT co_cha THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    -- ── §3.1 · FAIL-CLOSED ────────────────────────────────────────────────
    -- Không thấy cha mà đang GHI ⇒ chặn. Fail-open ở đây biến RLS thành đường
    -- vòng: ai không đọc được cha sẽ sửa được con.
    RAISE EXCEPTION 'Không đọc được chứng từ cha của % — không đủ tư cách ghi.',
      TG_TABLE_NAME USING ERRCODE = '23514';
  END IF;

  IF tt IS NULL OR NOT (tt = ANY (cha.final_states)) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Cha đã Final. `INSERT` và `DELETE` chặn thẳng — thêm hay bớt khoản mục đều
  -- đổi tổng tiền chứng từ đã chốt (ADR-020 §2.3).
  IF TG_OP IN ('INSERT', 'DELETE') THEN
    RAISE EXCEPTION 'Chứng từ cha % đã ở trạng thái % — không % dòng chi tiết.',
      cfg.parent_table, tt, CASE TG_OP WHEN 'INSERT' THEN 'thêm' ELSE 'xoá' END
      USING ERRCODE = '23514',
            HINT = 'Lập chứng từ điều chỉnh thay vì sửa bản đã chốt.';
  END IF;

  cu := to_jsonb(OLD); moi := to_jsonb(NEW);
  FOR khoa IN SELECT jsonb_object_keys(cu) LOOP
    CONTINUE WHEN khoa = ANY (cfg.mutable_after_final);
    IF (cu -> khoa) IS DISTINCT FROM (moi -> khoa) THEN
      vi_pham := vi_pham || khoa;
    END IF;
  END LOOP;

  IF cardinality(vi_pham) > 0 THEN
    RAISE EXCEPTION 'Chứng từ cha % đã ở trạng thái %, không sửa được dòng chi '
      'tiết. Cột bị đổi: %', cfg.parent_table, tt, array_to_string(vi_pham, ', ')
      USING ERRCODE = '23514',
            HINT = 'Lập chứng từ điều chỉnh thay vì sửa bản đã chốt.';
  END IF;

  RETURN NEW;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 3. GẮN TRIGGER — con cần CẢ BA hành động
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.mos_attach_immutability_guard(p_bang TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE la_con BOOLEAN;
BEGIN
  SELECT parent_table IS NOT NULL INTO la_con
    FROM public.mos_aggregate_immutability WHERE table_name = p_bang;
  IF la_con IS NULL THEN
    RAISE EXCEPTION 'Chưa khai báo bất biến cho %.', p_bang USING ERRCODE = '23514';
  END IF;

  EXECUTE format('DROP TRIGGER IF EXISTS mos_immutability_trg ON public.%I', p_bang);
  -- Root chỉ cần UPDATE. Con cần cả ba: chặn UPDATE mà quên INSERT/DELETE là
  -- khoá cửa sổ và mở cửa chính — đúng lỗi TRUNCATE ở `041`.
  EXECUTE format(
    'CREATE TRIGGER mos_immutability_trg BEFORE %s ON public.%I '
    'FOR EACH ROW EXECUTE FUNCTION public.mos_guard_aggregate_immutability()',
    CASE WHEN la_con THEN 'INSERT OR UPDATE OR DELETE' ELSE 'UPDATE' END, p_bang);
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 4. KHAI BÁO `costing_items` — MỘT DÒNG DỮ LIỆU
-- ════════════════════════════════════════════════════════════════════════════
-- `final_states` không dùng cho dòng con (trạng thái đọc từ cha) nhưng cột
-- `NOT NULL CHECK (cardinality > 0)` ⇒ đặt một giá trị canh gác không bao giờ
-- khớp trạng thái thật.
INSERT INTO public.mos_aggregate_immutability
  (table_name, status_column, final_states, mutable_after_final,
   parent_table, parent_fk, adr, note)
VALUES
  ('costing_items', 'status', ARRAY['-'], ARRAY[]::TEXT[],
   'costings', 'costing_id', 'ADR-020',
   'Bảng con của costings. Trạng thái Final đọc từ dòng cha. mutable_after_final '
   'RỖNG = bất động hoàn toàn khi cha đã duyệt — ADR-020 §6.3 ghi đây là giả '
   'định cần Board xác nhận.')
ON CONFLICT (table_name) DO UPDATE
  SET parent_table = EXCLUDED.parent_table, parent_fk = EXCLUDED.parent_fk,
      mutable_after_final = EXCLUDED.mutable_after_final,
      final_states = EXCLUDED.final_states, adr = EXCLUDED.adr,
      note = EXCLUDED.note, updated_at = NOW();

SELECT public.mos_attach_immutability_guard('costings');       -- gắn lại: UPDATE
SELECT public.mos_attach_immutability_guard('costing_items');  -- gắn mới: cả ba


-- ════════════════════════════════════════════════════════════════════════════
-- 5. 🔴 TỰ ĐO — đóng `[NO EVIDENCE]` của ADR-020 §6.2 NGAY TRONG GIAO DỊCH
-- ════════════════════════════════════════════════════════════════════════════
-- Giả định phải kiểm: trigger `BEFORE DELETE` trên con nhìn thấy dòng cha đã
-- biến mất trong lúc `ON DELETE CASCADE`. Sai ⇒ mọi lệnh xoá cha bị chặn.
-- Dựng dữ liệu thật, chạy thử, dọn — hỏng thì `RAISE` và cả tệp quay lui.
DO $$
DECLARE
  v_kh UUID; v_c UUID; v_ok BOOLEAN;
BEGIN
  SELECT id INTO v_kh FROM public.customers WHERE is_active LIMIT 1;
  IF v_kh IS NULL THEN
    RAISE EXCEPTION '046 DỪNG: chưa có khách hàng nền để tự đo. Chạy S001 trước.';
  END IF;

  -- ── ① CASCADE phải chạy được ──────────────────────────────────────────
  INSERT INTO public.costings (costing_no, customer_id, order_type, quoted_price, status)
  VALUES ('ZZ046-CASCADE-' || substr(md5(random()::text), 1, 8), v_kh, 'FOB', 10, 'APPROVED')
  RETURNING id INTO v_c;
  -- Cha đang APPROVED ⇒ nhánh con sẽ chặn INSERT. Hạ về DRAFT để gieo con.
  UPDATE public.costings SET status = 'DRAFT' WHERE id = v_c;
  INSERT INTO public.costing_items (costing_id, category, item_name, unit, consumption, unit_price)
  VALUES (v_c, 'FABRIC', 'ZZ046', 'M', 1, 2);
  UPDATE public.costings SET status = 'APPROVED' WHERE id = v_c;

  BEGIN
    DELETE FROM public.costings WHERE id = v_c;   -- kéo theo cascade lên con
    v_ok := TRUE;
  EXCEPTION WHEN OTHERS THEN
    v_ok := FALSE;
  END;

  IF NOT v_ok THEN
    RAISE EXCEPTION '046 DỪNG: giả định ADR-020 §3.2 SAI — trigger BEFORE DELETE '
      'trên bảng con KHÔNG thấy dòng cha đã biến mất, nên ON DELETE CASCADE bị '
      'chặn. Toàn bộ migration quay lui. Phải thiết kế lại phép phân biệt cascade.';
  END IF;

  -- ── ② Chặn thật sự phải hoạt động ─────────────────────────────────────
  INSERT INTO public.costings (costing_no, customer_id, order_type, quoted_price, status)
  VALUES ('ZZ046-BLOCK-' || substr(md5(random()::text), 1, 8), v_kh, 'FOB', 10, 'DRAFT')
  RETURNING id INTO v_c;
  INSERT INTO public.costing_items (costing_id, category, item_name, unit, consumption, unit_price)
  VALUES (v_c, 'FABRIC', 'ZZ046', 'M', 1, 2);
  UPDATE public.costings SET status = 'APPROVED' WHERE id = v_c;

  BEGIN
    UPDATE public.costing_items SET unit_price = 99 WHERE costing_id = v_c;
    v_ok := FALSE;                       -- lọt ⇒ engine không chặn
  EXCEPTION WHEN OTHERS THEN
    v_ok := TRUE;                        -- bị chặn ⇒ đúng
  END;

  UPDATE public.costings SET status = 'DRAFT' WHERE id = v_c;
  DELETE FROM public.costings WHERE id = v_c;

  IF NOT v_ok THEN
    RAISE EXCEPTION '046 DỪNG: engine KHÔNG chặn sửa khoản mục của chứng từ đã '
      'duyệt — B-3 chưa được vá. Quay lui.';
  END IF;

  RAISE NOTICE '046 tự đo: cascade CHẠY ĐƯỢC · sửa khoản mục BỊ CHẶN. Đạt.';
END $$;

COMMIT;

-- ─── HOÀN TÁC ───────────────────────────────────────────────────────────────
--   DROP TRIGGER IF EXISTS mos_immutability_trg ON public.costing_items;
--   DELETE FROM public.mos_aggregate_immutability WHERE table_name='costing_items';
--   ALTER TABLE public.mos_aggregate_immutability
--     DROP COLUMN IF EXISTS parent_table, DROP COLUMN IF EXISTS parent_fk;
--   -- rồi chạy lại Mục 2 của `045` để khôi phục hàm bản root-only.

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY
-- ============================================================================
SELECT 'Hai cột metadata mới' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema='public' AND table_name='mos_aggregate_immutability'
           AND column_name IN ('parent_table','parent_fk')) AS ket_qua,
       '2' AS ky_vong
UNION ALL
SELECT 'Khai báo costing_items trỏ đúng cha',
       (SELECT parent_table || '.' || parent_fk FROM public.mos_aggregate_immutability
         WHERE table_name='costing_items'), 'costings.costing_id'
UNION ALL
SELECT '⭐ Trigger trên costing_items phủ CẢ BA hành động',
       (SELECT (tgtype & 4 > 0)::int + (tgtype & 8 > 0)::int + (tgtype & 16 > 0)::int
          FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
         WHERE t.tgname='mos_immutability_trg' AND c.relname='costing_items')::TEXT, '3'
UNION ALL
SELECT 'costings VẪN chỉ phủ UPDATE',
       (SELECT (tgtype & 16 > 0)::TEXT
          FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
         WHERE t.tgname='mos_immutability_trg' AND c.relname='costings'), 'true'
UNION ALL
SELECT '⭐ Engine VẪN KHÔNG phải SECURITY DEFINER',
       (SELECT (NOT prosecdef)::TEXT FROM pg_proc
         WHERE proname='mos_guard_aggregate_immutability'), 'true'
UNION ALL
SELECT 'costings final_states GIỮ NGUYÊN theo A1',
       (SELECT array_to_string(final_states,',') FROM public.mos_aggregate_immutability
         WHERE table_name='costings'), 'APPROVED'
UNION ALL
SELECT 'KHÔNG còn dòng rác ZZ046',
       (SELECT COUNT(*)::TEXT FROM public.costings WHERE costing_no LIKE 'ZZ046-%'), '0';
