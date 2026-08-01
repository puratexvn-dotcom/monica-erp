-- ============================================================================
-- MONICA MOS — 035a · UDMD ĐA NGÔN NGỮ · BƯỚC EXPAND  (bản 2)
--
-- Thiết kế: docs/adr/ADR-005-udmd-i18n-and-soft-delete.md
-- Giải: Hiến pháp Mục B.1 (vi phạm Điều IX)
--
-- ─── BƯỚC NÀY KHÔNG PHÁ GÌ CẢ ────────────────────────────────────────────
--   ✅ THÊM  name_translations JSONB
--   ✅ GIỮ   name_vi · name_en nguyên vẹn
--   ✅ ĐỒNG BỘ HAI CHIỀU bằng trigger
--   ✗  KHÔNG xoá cột nào  → đó là việc của 035c
--
-- Sau khi chạy tệp này, **cả mã cũ lẫn mã mới đều chạy đúng**. Đó là toàn bộ
-- mục đích của bước Expand:
--
--     `quality.service.ts` đang nhúng `defect_catalog(name_vi)` trong một select
--     PostgREST, và nó thuộc Trung tâm Chất lượng — phân hệ ĐÃ NGHIỆM THU, đang
--     chạy thật, có `live-023` canh. Đổi cột trong một nhát là làm gãy nó.
--
-- Bài học 029c: cột và mã đọc cột phải đi cùng nhau, từng bước một.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. HÀM DỰ PHÒNG — MỘT NƠI DUY NHẤT
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ "Fallback về en" là CHƯA ĐỦ, và đây là ca hỏng thật: người vận hành khai
-- một loại hợp đồng CHỈ bằng tiếng Việt; phiên EN tra 'en' không thấy → màn hình
-- hiện Ô TRỐNG, và người dùng kết luận danh mục hỏng.
--
-- Playbook Điều XX có luật cho đúng ca này: "tra nhãn không thấy thì HIỆN MÃ
-- GỐC, không để trống — người vận hành còn biết mà báo lại."
--
--     ngôn ngữ phiên → vi → en → khoá đầu tiên có giá trị → chính `code`
--
-- Chuỗi kết thúc ở `code` nên hàm này KHÔNG BAO GIỜ trả chuỗi rỗng.
CREATE OR REPLACE FUNCTION public.mos_pick_translation(
  p_translations JSONB,
  p_lang         TEXT,
  p_fallback     TEXT
) RETURNS TEXT LANGUAGE SQL IMMUTABLE SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF(TRIM(p_translations ->> lower(p_lang)), ''),
    NULLIF(TRIM(p_translations ->> 'vi'), ''),
    NULLIF(TRIM(p_translations ->> 'en'), ''),
    -- Ngôn ngữ nào cũng được, miễn là có chữ. `ORDER BY key` để kết quả TIỀN
    -- ĐỊNH — không có nó thì hai lần gọi có thể trả hai giá trị khác nhau, và
    -- hàm mất tính IMMUTABLE trên thực tế.
    (SELECT NULLIF(TRIM(e.value), '')
       FROM jsonb_each_text(COALESCE(p_translations, '{}'::jsonb)) AS e(key, value)
      WHERE LENGTH(TRIM(e.value)) > 0
      ORDER BY e.key
      LIMIT 1),
    p_fallback
  );
$$;

COMMENT ON FUNCTION public.mos_pick_translation(JSONB, TEXT, TEXT) IS
  'Chọn bản dịch theo chuỗi dự phòng: phiên → vi → en → khoá đầu có chữ → mã gốc. '
  'KHÔNG BAO GIỜ trả chuỗi rỗng — Playbook Điều XX.';

GRANT EXECUTE ON FUNCTION public.mos_pick_translation(JSONB, TEXT, TEXT) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. CHUẨN HOÁ — GỠ KHOÁ RỖNG
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Hàm này gánh phần việc mà `CHECK` KHÔNG LÀM ĐƯỢC.
--
-- Bản đầu của migration này dùng `EXISTS (SELECT ... jsonb_each_text ...)` bên
-- trong `CHECK` và **chạy hỏng**:
--
--     ERROR 0A000: cannot use subquery in check constraint
--
-- PostgreSQL cấm subquery và hàm trả-tập trong `CHECK` — ràng buộc phải đánh giá
-- được trên MỘT dòng, không được nhìn ra ngoài. Đây là giới hạn thật của
-- PostgreSQL, không phải lỗi cú pháp viết lại cho khéo là xong.
--
-- Chỉ thị Kiến trúc sư: giữ `CHECK` ĐƠN GIẢN, để tầng trên lo phần còn lại.
--
-- Lời giải: **trigger chuẩn hoá TRƯỚC, `CHECK` đơn giản chặn SAU.** Ràng buộc
-- được đánh giá sau trigger `BEFORE`, nên:
--
--     ghi {"vi":"   "}  →  trigger gỡ khoá rỗng  →  còn {}  →  CHECK từ chối
--
-- Người dùng vẫn nhận đúng một lỗi 23514 như thiết kế ban đầu định làm, mà
-- không cần một ràng buộc PostgreSQL không cho phép tồn tại.
CREATE OR REPLACE FUNCTION public.mos_strip_blank_translations(p_t JSONB)
RETURNS JSONB LANGUAGE SQL IMMUTABLE SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(jsonb_object_agg(e.key, TRIM(e.value)), '{}'::jsonb)
    FROM jsonb_each_text(COALESCE(p_t, '{}'::jsonb)) AS e(key, value)
   WHERE LENGTH(TRIM(e.value)) > 0;
$$;

COMMENT ON FUNCTION public.mos_strip_blank_translations(JSONB) IS
  'Gỡ mọi khoá có giá trị rỗng/khoảng trắng, cắt khoảng trắng thừa. Chuỗi rỗng '
  'trong JSONB là thứ tệ nhất: nó CÓ khoá nên chuỗi dự phòng dừng lại ở đó và '
  'màn hình hiện ô trống.';

GRANT EXECUTE ON FUNCTION public.mos_strip_blank_translations(JSONB) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. TRIGGER ĐỒNG BỘ HAI CHIỀU
-- ════════════════════════════════════════════════════════════════════════════
-- Đây là mảnh khó nhất của cả migration. Trong suốt cửa sổ chuyển tiếp, HAI
-- nguồn cùng mô tả một sự thật, và chúng phải luôn khớp nhau bất kể ai ghi.
--
-- ─── LUẬT PHÂN XỬ: BÊN NÀO VỪA ĐỔI THÌ BÊN ĐÓ THẮNG ──────────────────────
-- Không có luật này thì một lệnh `UPDATE` chạm cả hai bên sẽ cho kết quả tuỳ
-- vào thứ tự đọc cột — tức là không tiền định.
--
-- ⚠️ Khi gộp từ cột cũ vào JSONB phải dùng `jsonb_set` TỪNG KHOÁ, không ghi đè
-- cả object. Ghi đè là XOÁ MẤT tiếng Trung khi ai đó chỉ sửa tiếng Việt — và
-- không lỗi nào nổ ra.
CREATE OR REPLACE FUNCTION public.mos_sync_udmd_translations()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
DECLARE
  v_json_changed BOOLEAN := FALSE;
  v_cols_changed BOOLEAN := FALSE;
  v_t            JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Mã MỚI ghi JSONB; mã CŨ ghi name_vi. Bên nào có giá trị thì bên đó là nguồn.
    v_json_changed := NEW.name_translations IS NOT NULL
                      AND NEW.name_translations <> '{}'::jsonb;
    v_cols_changed := NOT v_json_changed;
  ELSE
    v_json_changed := NEW.name_translations IS DISTINCT FROM OLD.name_translations;
    v_cols_changed := (NEW.name_vi IS DISTINCT FROM OLD.name_vi)
                   OR (NEW.name_en IS DISTINCT FROM OLD.name_en);
  END IF;

  -- ① JSONB LÀ NGUỒN → suy ngược ra hai cột cũ.
  --    Ưu tiên JSONB khi cả hai cùng đổi: đó là hướng hệ thống ĐANG ĐI TỚI.
  IF v_json_changed THEN
    v_t := COALESCE(NEW.name_translations, '{}'::jsonb);

    -- ⚠️ `name_vi` là NOT NULL. Nếu JSONB không có khoá 'vi' thì gán thẳng
    -- `v_t->>'vi'` sẽ ném 23502. Dùng chuỗi dự phòng — nó luôn trả một chuỗi
    -- có chữ, cùng lắm là chính `code`.
    NEW.name_vi := public.mos_pick_translation(v_t, 'vi', NEW.code);
    NEW.name_en := NULLIF(TRIM(v_t ->> 'en'), '');   -- nullable, để trống được

  -- ② CỘT CŨ LÀ NGUỒN → gộp vào JSONB, GIỮ NGUYÊN các ngôn ngữ khác.
  ELSIF v_cols_changed THEN
    v_t := COALESCE(NEW.name_translations, '{}'::jsonb);

    IF NEW.name_vi IS NOT NULL AND LENGTH(TRIM(NEW.name_vi)) > 0 THEN
      v_t := jsonb_set(v_t, '{vi}', to_jsonb(TRIM(NEW.name_vi)), TRUE);
    END IF;

    IF NEW.name_en IS NOT NULL AND LENGTH(TRIM(NEW.name_en)) > 0 THEN
      v_t := jsonb_set(v_t, '{en}', to_jsonb(TRIM(NEW.name_en)), TRUE);
    ELSE
      -- Xoá `name_en` ở mã cũ ⇒ gỡ luôn khoá 'en'. Giữ lại là để hai bên nói
      -- hai điều khác nhau.
      v_t := v_t - 'en';
    END IF;

    NEW.name_translations := v_t;

  -- ③ KHÔNG BÊN NÀO ĐỔI, nhưng JSONB rỗng (dòng cũ chưa backfill, hoặc UPDATE
  --    chạm cột khác). Dựng JSONB từ cột cũ để ràng buộc ở Mục 4 không chặn.
  ELSIF NEW.name_translations IS NULL OR NEW.name_translations = '{}'::jsonb THEN
    v_t := '{}'::jsonb;
    IF NEW.name_vi IS NOT NULL AND LENGTH(TRIM(NEW.name_vi)) > 0 THEN
      v_t := jsonb_set(v_t, '{vi}', to_jsonb(TRIM(NEW.name_vi)), TRUE);
    END IF;
    IF NEW.name_en IS NOT NULL AND LENGTH(TRIM(NEW.name_en)) > 0 THEN
      v_t := jsonb_set(v_t, '{en}', to_jsonb(TRIM(NEW.name_en)), TRUE);
    END IF;
    NEW.name_translations := v_t;
  END IF;

  -- ⚠️ CHUẨN HOÁ CUỐI CÙNG, áp cho MỌI nhánh ở trên.
  -- Đây là chỗ thay thế phần `CHECK` không viết được: gỡ khoá rỗng, cắt khoảng
  -- trắng thừa. Còn lại `{}` thì ràng buộc ở Mục 4 từ chối — thất bại TO TIẾNG,
  -- đúng như thiết kế ban đầu định làm.
  NEW.name_translations := public.mos_strip_blank_translations(NEW.name_translations);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.mos_sync_udmd_translations() IS
  'Đồng bộ HAI CHIỀU name_vi/name_en ⟷ name_translations trong cửa sổ chuyển '
  'tiếp 035a→035c. Bên nào vừa đổi thì bên đó thắng; JSONB thắng khi cả hai '
  'cùng đổi. GỠ BỎ ở 035c.';

-- ════════════════════════════════════════════════════════════════════════════
-- 4. ÁP DỤNG CHO HAI BẢNG UDMD
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['defect_catalog', 'contract_types'] LOOP

    -- ─── 4.1 Cột mới ───────────────────────────────────────────────────
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS name_translations JSONB', t);

    -- ─── 4.2 Nới kiểu cột cũ ───────────────────────────────────────────
    -- `name_vi VARCHAR(120)`. Mã mới ghi một bản dịch dài hơn 120 ký tự thì
    -- trigger suy ngược sẽ ném 22001 — một lỗi khó hiểu cho người dùng đang
    -- làm việc hoàn toàn hợp lệ.
    --
    -- Nới VARCHAR(120) → TEXT là thay đổi TƯƠNG THÍCH NGƯỢC hoàn toàn: mọi
    -- truy vấn cũ chạy y nguyên, chỉ trần độ dài biến mất. Điều XI.
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN name_vi TYPE TEXT', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN name_en TYPE TEXT', t);

    -- ─── 4.3 Backfill ──────────────────────────────────────────────────
    -- ⚠️ Bỏ khoá khi giá trị rỗng, KHÔNG lưu `{"en": ""}`. Chuỗi rỗng trong
    -- JSONB là thứ tệ nhất: nó "có khoá" nên chuỗi dự phòng dừng lại ở đó, và
    -- màn hình hiện ô trống — đúng thứ chuỗi dự phòng sinh ra để tránh.
    EXECUTE format($f$
      UPDATE public.%I SET name_translations = (
        SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
          FROM (VALUES ('vi', name_vi), ('en', name_en)) AS s(k, v)
         WHERE v IS NOT NULL AND LENGTH(TRIM(v)) > 0
      )
      WHERE name_translations IS NULL OR name_translations = '{}'::jsonb
    $f$, t);

    -- ─── 4.4 Ràng buộc ─────────────────────────────────────────────────
    -- ⚠️ NOT NULL MỘT MÌNH LÀ KHÔNG ĐỦ. `'{}'::jsonb` đi qua được NOT NULL, và
    -- lúc đó chuỗi dự phòng rơi thẳng xuống `code` cho MỌI ngôn ngữ — danh mục
    -- trông như chưa dịch gì cả mà không ràng buộc nào kêu.
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN name_translations SET NOT NULL', t);

    EXECUTE format($f$
      ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I
    $f$, t, t || '_translations_shape');

    -- ⚠️ RÀNG BUỘC ĐƠN GIẢN — đánh giá được trên MỘT dòng, không nhìn ra ngoài.
    --
    -- Bản đầu dùng `EXISTS (SELECT ...)` để đòi "ít nhất một bản dịch không
    -- rỗng", và PostgreSQL từ chối: `0A000 cannot use subquery in check
    -- constraint`. Phần việc đó đã chuyển sang trigger ở Mục 2 — nó gỡ khoá
    -- rỗng TRƯỚC, nên tới lượt `CHECK` thì `{"vi":"   "}` đã thành `{}` và bị
    -- chặn ở đây.
    --
    -- Hai lớp cộng lại cho ĐÚNG hành vi ban đầu, bằng cú pháp hợp lệ.
    EXECUTE format($f$
      ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (
        jsonb_typeof(name_translations) = 'object'
        AND name_translations <> '{}'::jsonb
      )
    $f$, t, t || '_translations_shape');

    -- ⚠️ CỐ Ý KHÔNG ràng buộc danh sách khoá ngôn ngữ. CHECK cứng `IN ('vi','en','cn')`
    -- sẽ chặn việc thêm ngôn ngữ thứ tư — đúng thứ thiết kế JSONB sinh ra để
    -- tránh. Đánh đổi đã ghi ở ADR-005: gõ nhầm 'vn' thì CSDL nhận, và bảo vệ
    -- nằm ở hằng số TypeScript + phép kiểm hợp đồng.

    -- ─── 4.5 Trigger đồng bộ ───────────────────────────────────────────
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_sync_i18n_trg', t);
    EXECUTE format($f$
      CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.mos_sync_udmd_translations()
    $f$, t || '_sync_i18n_trg', t);

    EXECUTE format(
      'COMMENT ON COLUMN public.%I.name_translations IS %L', t,
      'Bản dịch của UDMD. Khoá: vi · en · cn (chữ THƯỜNG, khớp Language của ứng '
      'dụng). Đọc bằng mos_pick_translation() — KHÔNG đọc thẳng ->>''vi'', vì '
      'thiếu khoá sẽ ra NULL và màn hình hiện ô trống. ADR-005.');
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. KHẢ NĂNG HOÀN TÁC — SẠCH TUYỆT ĐỐI
-- ════════════════════════════════════════════════════════════════════════════
--   DROP TRIGGER defect_catalog_sync_i18n_trg ON defect_catalog;
--   DROP TRIGGER contract_types_sync_i18n_trg ON contract_types;
--   ALTER TABLE defect_catalog DROP COLUMN name_translations;
--   ALTER TABLE contract_types DROP COLUMN name_translations;
--   DROP FUNCTION mos_sync_udmd_translations();
--   DROP FUNCTION mos_strip_blank_translations(JSONB);
--   DROP FUNCTION mos_pick_translation(JSONB, TEXT, TEXT);
--
-- KHÔNG mất dữ liệu: `name_vi`/`name_en` còn nguyên và được trigger giữ đồng bộ
-- suốt thời gian qua. Nới VARCHAR(120)→TEXT không cần hoàn tác — nó tương thích
-- ngược, và thu hẹp lại chỉ tạo rủi ro cắt cụt.

-- ════════════════════════════════════════════════════════════════════════════
-- 5. KIỂM TRA SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════════════════
SELECT 'Ba hàm mới' AS muc,
       (SELECT COUNT(*)::TEXT FROM pg_proc
         WHERE proname IN ('mos_pick_translation','mos_strip_blank_translations',
                           'mos_sync_udmd_translations')) AS ket_qua,
       '3' AS ky_vong
UNION ALL
SELECT 'Hai cột name_translations',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema='public' AND column_name='name_translations'
           AND table_name IN ('defect_catalog','contract_types')), '2'
UNION ALL
SELECT 'Cả hai đều NOT NULL',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema='public' AND column_name='name_translations'
           AND is_nullable='NO' AND table_name IN ('defect_catalog','contract_types')), '2'
UNION ALL
SELECT 'Hai ràng buộc chặn {} rỗng',
       (SELECT COUNT(*)::TEXT FROM pg_constraint
         WHERE conname IN ('defect_catalog_translations_shape','contract_types_translations_shape')), '2'
UNION ALL
SELECT 'Hai trigger đồng bộ',
       (SELECT COUNT(*)::TEXT FROM pg_trigger
         WHERE tgname IN ('defect_catalog_sync_i18n_trg','contract_types_sync_i18n_trg')), '2'
UNION ALL
SELECT '⭐ BACKFILL — 20 mã lỗi, KHÔNG dòng nào mất',
       (SELECT COUNT(*)::TEXT FROM public.defect_catalog), '20'
UNION ALL
SELECT '⭐ Mọi name_vi cũ KHỚP name_translations->>''vi''',
       (SELECT COUNT(*)::TEXT FROM public.defect_catalog
         WHERE name_vi IS DISTINCT FROM name_translations->>'vi'), '0'
UNION ALL
SELECT '⭐ Mọi name_en cũ KHỚP name_translations->>''en''',
       (SELECT COUNT(*)::TEXT FROM public.defect_catalog
         WHERE COALESCE(name_en,'') IS DISTINCT FROM COALESCE(name_translations->>'en','')), '0'
UNION ALL
SELECT 'Không dòng nào có JSONB rỗng',
       (SELECT COUNT(*)::TEXT FROM public.defect_catalog
         WHERE name_translations = '{}'::jsonb), '0'
UNION ALL
SELECT 'Cột cũ VẪN CÒN (mã cũ chưa gãy)',
       (SELECT COUNT(*)::TEXT FROM information_schema.columns
         WHERE table_schema='public' AND column_name IN ('name_vi','name_en')
           AND table_name IN ('defect_catalog','contract_types')), '4'
UNION ALL
SELECT 'Hàm dự phòng chạy đúng (thiếu khoá ⇒ trả mã gốc)',
       public.mos_pick_translation('{"vi":"Bỏ mũi"}'::jsonb, 'cn', 'SKIP_STITCH'), 'Bỏ mũi'
UNION ALL
SELECT '...và JSONB rỗng ⇒ trả mã gốc, KHÔNG trả chuỗi rỗng',
       public.mos_pick_translation('{}'::jsonb, 'en', 'SKIP_STITCH'), 'SKIP_STITCH'
UNION ALL
SELECT 'Chuẩn hoá gỡ khoá rỗng (thay phần CHECK không viết được)',
       public.mos_strip_blank_translations('{"vi":"Bỏ mũi","en":"   ","cn":""}'::jsonb)::TEXT,
       '{"vi": "Bỏ mũi"}'
UNION ALL
SELECT '...toàn khoảng trắng ⇒ về {} ⇒ CHECK sẽ chặn',
       public.mos_strip_blank_translations('{"vi":"   "}'::jsonb)::TEXT, '{}';
