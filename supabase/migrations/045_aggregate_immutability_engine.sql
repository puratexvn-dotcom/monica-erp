-- ============================================================================
-- MONICA ONE — 045 · AGGREGATE IMMUTABILITY ENGINE
--
-- 📐 ADR-019 Revision 2 · Board Decision `W.1` + `A1` — 05/08/2026
-- 🔑 Vá `B-1`: `042` chặn cả `SUBMITTED → APPROVED` lẫn `APPROVED → SUPERSEDED`
--
-- ⛔ CHƯA CHẠY. Chờ Board phê duyệt ADR-019 và phản biện độc lập (ADR-011 §2.2).
--
-- ─── RANH GIỚI `W.1` — BOARD ĐÃ CHỐT ─────────────────────────────────────
--
--     Workflow Engine  →  quyết định PHÉP CHUYỂN trạng thái
--     Engine này       →  chỉ giữ BẤT BIẾN NỘI DUNG sau khi đạt Final
--
-- Tệp này **không liệt kê một phép chuyển nào**. Nó không biết `SUPERSEDED`
-- đến sau `APPROVED`, và không cần biết. Nó chỉ trả lời đúng một câu:
--
--     "Dòng này đã Final chưa? Nếu rồi, cột vừa bị đổi có nằm trong danh sách
--      được phép đổi không?"
--
-- ─── TRIGGER ⛔ KHÔNG BIẾT BUSINESS COLUMN ───────────────────────────────
--
-- ⛔ Không có `IF NEW.approved_by …` ở đâu trong tệp này.
-- ⛔ Không có chuỗi `'quoted_price'`, `'costings'` nào trong thân hàm.
--
-- Hàm so `to_jsonb(OLD)` với `to_jsonb(NEW)` — **so theo KHOÁ**, nên nó không
-- cần biết bảng có bao nhiêu cột hay tên gì. Thêm cột mới vào bảng ⇒ cột đó
-- **tự động được bảo vệ**, không sửa gì cả.
--
-- ─── THÊM AGGREGATE MỚI = THÊM MỘT DÒNG DỮ LIỆU ──────────────────────────
--
--   INSERT INTO public.mos_aggregate_immutability
--     (table_name, status_column, final_states, mutable_after_final)
--   VALUES ('purchase_orders','status',
--           ARRAY['CONFIRMED','RECEIVED','CANCELLED'], ARRAY['status']);
--   -- rồi gắn trigger bằng hàm tiện ích ở Mục 4
--
-- ⛔ Không sửa hàm · ⛔ không sửa migration này · ⛔ không sửa kiến trúc.
--
-- ─── VÌ SAO NÓ SỬA ĐƯỢC `B-1` ────────────────────────────────────────────
--
-- `042` cấm dòng **TRỞ THÀNH** `APPROVED` *(`WITH CHECK` sao chép từ `USING`)*
-- và cấm **ĐỤNG** dòng đã `APPROVED` *(`USING`)*. Cả hai đều là phát biểu về
-- **phép chuyển** — thứ `W.1` vừa giao cho Workflow Engine.
--
-- Engine này **không** cấm `status` đổi: `status` nằm trong
-- `mutable_after_final`. Nên `SUBMITTED → APPROVED` và `APPROVED → SUPERSEDED`
-- đều chạy được, trong khi `quoted_price` của dòng đã duyệt vẫn bất động.
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. BẢNG KHAI BÁO — luật nằm ở DỮ LIỆU, không ở mã (EDD-04 `WF-1`)
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.mos_aggregate_immutability (
  table_name          TEXT PRIMARY KEY,
  -- Cột mang vòng đời KHÁC NHAU giữa các bảng — `status`, `stage`,
  -- `current_stage`. Khai báo ở đây thay vì giả định `status`.
  status_column       TEXT   NOT NULL DEFAULT 'status',
  final_states        TEXT[] NOT NULL CHECK (cardinality(final_states) > 0),
  -- Cột VẪN đổi được sau Final. Immutable Field Set = (mọi cột) − tập này,
  -- suy ra LÚC CHẠY ⇒ cột thêm sau này tự động được bảo vệ.
  mutable_after_final TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  adr                 TEXT,
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.mos_aggregate_immutability IS
  'Metadata của Aggregate Immutability Engine — ADR-019 · Board Decision W.1. '
  'Mỗi dòng khai báo bất biến của MỘT aggregate. Thêm aggregate = thêm một dòng '
  'và gắn trigger; ⛔ KHÔNG sửa hàm. Xem docs/architecture/AGGREGATE_IMMUTABILITY_MATRIX.md';

-- Bảng cấu hình an ninh ⇒ chỉ nội bộ ĐỌC, ⛔ không ai ghi qua PostgREST.
-- Sửa nó là đổi luật bất biến ⇒ phải đi qua migration, để lại dấu vết.
ALTER TABLE public.mos_aggregate_immutability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mos_aggregate_immutability FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agg_immut_read" ON public.mos_aggregate_immutability;
CREATE POLICY "agg_immut_read" ON public.mos_aggregate_immutability
  FOR SELECT TO authenticated USING (NOT public.mos_is_external());
REVOKE ALL           ON public.mos_aggregate_immutability FROM anon, authenticated;
GRANT  SELECT        ON public.mos_aggregate_immutability TO   authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 2. ENGINE — MỘT hàm cho MỌI aggregate
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ CỐ Ý **KHÔNG** `SECURITY DEFINER`. Hàm chạy dưới quyền người gọi; nó chỉ
-- đọc `mos_aggregate_immutability`, bảng mà mọi vai nội bộ đọc được (Mục 1).
-- Không khoét lỗ xuyên RLS ⇒ ⛔ không phải ghi `SECURITY_DEFINER_REGISTRY`.
CREATE OR REPLACE FUNCTION public.mos_guard_aggregate_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  cfg      public.mos_aggregate_immutability%ROWTYPE;
  cu       JSONB;
  moi      JSONB;
  tt_cu    TEXT;
  khoa     TEXT;
  vi_pham  TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SELECT * INTO cfg FROM public.mos_aggregate_immutability
   WHERE table_name = TG_TABLE_NAME;
  -- Bảng chưa khai báo ⇒ engine đứng ngoài. Gắn trigger mà quên khai báo thì
  -- KHÔNG âm thầm chặn hết — nó âm thầm cho qua, và Mục 5 bắt chỗ đó.
  IF NOT FOUND THEN RETURN NEW; END IF;

  cu  := to_jsonb(OLD);
  moi := to_jsonb(NEW);

  -- Trạng thái CŨ quyết định dòng đã Final hay chưa. Dùng dòng cũ, không dùng
  -- dòng mới: một dòng đang `SUBMITTED` được phép TRỞ THÀNH `APPROVED` — đó là
  -- phép chuyển, thuộc Workflow Engine, ⛔ không thuộc engine này.
  tt_cu := cu ->> cfg.status_column;
  IF tt_cu IS NULL OR NOT (tt_cu = ANY (cfg.final_states)) THEN
    RETURN NEW;
  END IF;

  -- Duyệt theo KHOÁ của JSONB ⇒ hàm không cần biết tên cột nào. Cột thêm vào
  -- bảng sau này tự động nằm trong vòng bảo vệ.
  FOR khoa IN SELECT jsonb_object_keys(cu) LOOP
    CONTINUE WHEN khoa = ANY (cfg.mutable_after_final);
    -- `IS DISTINCT FROM` để `NULL` so với `NULL` là BẰNG NHAU. Dùng `<>` thì
    -- mọi cột NULL đều báo vi phạm giả.
    IF (cu -> khoa) IS DISTINCT FROM (moi -> khoa) THEN
      vi_pham := vi_pham || khoa;
    END IF;
  END LOOP;

  IF cardinality(vi_pham) > 0 THEN
    RAISE EXCEPTION
      'Chứng từ % đã ở trạng thái %, không sửa được nội dung. Cột bị đổi: %',
      TG_TABLE_NAME, tt_cu, array_to_string(vi_pham, ', ')
      USING ERRCODE = '23514',
            HINT = 'Lập chứng từ điều chỉnh thay vì sửa bản đã chốt. '
                   'Cột được phép đổi khai báo ở mos_aggregate_immutability.';
  END IF;

  RETURN NEW;
END $$;

COMMENT ON FUNCTION public.mos_guard_aggregate_immutability() IS
  'Aggregate Immutability Engine — ADR-019, Board Decision W.1. GENERIC: ⛔ không '
  'biết tên bảng, ⛔ không biết business column. So to_jsonb(OLD) với to_jsonb(NEW) '
  'theo khoá, đọc luật từ mos_aggregate_immutability. ⛔ KHÔNG quyết định phép '
  'chuyển trạng thái — đó là việc của Workflow Engine.';


-- ════════════════════════════════════════════════════════════════════════════
-- 3. GỠ POLICY GÂY `B-1`
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ `R1` của Risk Matrix: gỡ policy TRƯỚC khi trigger có hiệu lực sẽ mở lại
-- đúng lỗ hổng `043`. Vì vậy cả tệp nằm trong MỘT giao dịch — `BEGIN` ở đầu,
-- `COMMIT` ở cuối. Không có khoảnh khắc nào hệ thống hở.
--
-- Policy này phát biểu về PHÉP CHUYỂN *(không được trở thành / không được đụng
-- dòng đã APPROVED)* ⇒ theo `W.1` nó không thuộc tầng dữ liệu.
DROP POLICY IF EXISTS "costings_no_edit_after_approve" ON public.costings;

-- `costings_read` · `costings_insert` · `costings_update` của `042` GIỮ NGUYÊN —
-- chúng trả lời "AI được đụng bảng", vẫn đúng vai trò theo `W.1`.


-- ════════════════════════════════════════════════════════════════════════════
-- 4. GẮN ENGINE — hàm tiện ích, dùng lại cho mọi aggregate
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.mos_attach_immutability_guard(p_bang TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('DROP TRIGGER IF EXISTS mos_immutability_trg ON public.%I', p_bang);
  EXECUTE format(
    'CREATE TRIGGER mos_immutability_trg BEFORE UPDATE ON public.%I '
    'FOR EACH ROW EXECUTE FUNCTION public.mos_guard_aggregate_immutability()', p_bang);
END $$;

-- ─── Khai báo Costing — Board chốt 05/08/2026 ─────────────────────────────
-- ⚠️ `SUPERSEDED` do CSA đề xuất thêm và đã nêu ở Matrix §0.1: Board chốt Final
-- = `APPROVED`, nhưng một chiết tính `SUPERSEDED` cũng không được sửa nội dung.
-- Nếu Board bác, xoá đúng một chuỗi trong `ARRAY` dưới đây — ⛔ không sửa hàm.
INSERT INTO public.mos_aggregate_immutability
  (table_name, status_column, final_states, mutable_after_final, adr, note)
VALUES
  ('costings', 'status',
   ARRAY['APPROVED','SUPERSEDED'],
   ARRAY['status','approved_by','approved_at'],
   'ADR-019',
   'Board Decision A1 · 05/08/2026. Thêm cột ghi nhận phê duyệt về sau '
   '(approved_device, approved_ip, approved_signature…) ⇒ thêm vào '
   'mutable_after_final, KHÔNG sửa trigger.')
ON CONFLICT (table_name) DO UPDATE
  SET status_column       = EXCLUDED.status_column,
      final_states        = EXCLUDED.final_states,
      mutable_after_final = EXCLUDED.mutable_after_final,
      adr                 = EXCLUDED.adr,
      note                = EXCLUDED.note,
      updated_at          = NOW();

SELECT public.mos_attach_immutability_guard('costings');

-- ⛔ CHƯA gắn `purchase_orders` và `stock_counts`: `A1-PO` và `A1-SC` còn
-- `[INFERRED]`, Board chưa xác nhận `final_states`. Gắn khi có phán quyết —
-- hai dòng `INSERT` + hai lời gọi `mos_attach_immutability_guard`, hết.


-- ════════════════════════════════════════════════════════════════════════════
-- 5. TỰ KIỂM — bảng đã gắn trigger mà CHƯA khai báo metadata
-- ════════════════════════════════════════════════════════════════════════════
-- Mục 2 cố ý CHO QUA khi thiếu khai báo, để một lần gắn nhầm không khoá cả bảng.
-- Cái giá là im lặng ⇒ phải có phép kiểm bù, đúng đây.
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
   WHERE t.tgname = 'mos_immutability_trg'
     AND NOT EXISTS (SELECT 1 FROM public.mos_aggregate_immutability m
                      WHERE m.table_name = c.relname);
  IF n > 0 THEN
    RAISE EXCEPTION '045 DỪNG: % bảng gắn trigger mà chưa khai báo metadata — '
      'trigger sẽ cho qua trong im lặng.', n;
  END IF;
END $$;

COMMIT;

-- ─── HOÀN TÁC ───────────────────────────────────────────────────────────────
--   DROP TRIGGER IF EXISTS mos_immutability_trg ON public.costings;
--   DROP FUNCTION IF EXISTS public.mos_attach_immutability_guard(TEXT);
--   DROP FUNCTION IF EXISTS public.mos_guard_aggregate_immutability();
--   DROP TABLE IF EXISTS public.mos_aggregate_immutability;
--   CREATE POLICY "costings_no_edit_after_approve" ON public.costings
--     AS RESTRICTIVE FOR UPDATE TO authenticated
--     USING (status NOT IN ('APPROVED','SUPERSEDED'));
-- Không dòng dữ liệu nghiệp vụ nào bị đụng ⇒ hoàn tác vô hại.
-- ⚠️ Hoàn tác đưa `B-1` trở lại: không duyệt được chiết tính.

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY — chép TOÀN BỘ về hồ sơ
-- ============================================================================
SELECT 'Bảng metadata đã dựng' AS muc,
       (SELECT COUNT(*)::TEXT FROM pg_tables
         WHERE schemaname='public' AND tablename='mos_aggregate_immutability') AS ket_qua,
       '1' AS ky_vong
UNION ALL
SELECT 'Khai báo cho costings',
       (SELECT COUNT(*)::TEXT FROM public.mos_aggregate_immutability
         WHERE table_name='costings'), '1'
UNION ALL
SELECT '⭐ Trigger đã gắn vào costings',
       (SELECT COUNT(*)::TEXT FROM pg_trigger
         WHERE tgname='mos_immutability_trg'), '1'
UNION ALL
SELECT '⭐ Policy gây B-1 đã gỡ',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND tablename='costings'
           AND policyname='costings_no_edit_after_approve'), '0'
UNION ALL
SELECT 'costings_read/_insert/_update (042) VẪN nguyên vẹn',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND tablename='costings'
           AND policyname IN ('costings_read','costings_insert','costings_update')), '3'
UNION ALL
SELECT 'Engine KHÔNG phải SECURITY DEFINER',
       (SELECT (NOT prosecdef)::TEXT FROM pg_proc
         WHERE proname='mos_guard_aggregate_immutability'), 'true'
UNION ALL
SELECT 'anon KHÔNG đọc được bảng metadata',
       (SELECT COUNT(*)::TEXT FROM information_schema.role_table_grants
         WHERE grantee='anon' AND table_schema='public'
           AND table_name='mos_aggregate_immutability'), '0';
