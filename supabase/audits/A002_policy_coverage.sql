-- ============================================================================
-- A002 · KIỂM ĐỘ PHỦ CỦA POLICY — chu trình 031a → Regression → **A002** → 031b
--
-- A001 hỏi: "view và hàm có vượt mặt RLS không?"
-- A002 hỏi câu ĐỨNG TRƯỚC NÓ: "bảng có hàng rào nào không, và hàng rào ấy có
--                              biết tới người dùng bên ngoài không?"
--
-- ⚠️ ĐÂY LÀ TỆP CHỈ-ĐỌC.
--
-- ─── BẢN 2 — GỘP THÀNH MỘT TẬP KẾT QUẢ ────────────────────────────────────
-- Bản 1 chia làm bốn câu SELECT. SQL Editor của Supabase chỉ hiện kết quả câu
-- CUỐI, nên ba lần chạy liền người đọc chỉ thấy Mục 4. Mục 1 (bảng chưa bật
-- RLS) — thứ quan trọng nhất — chưa bao giờ đến được mắt ai.
--
-- Một bài kiểm mà kết quả không đến được mắt người đọc thì bằng không.
--
-- ─── VÌ SAO CẦN ───────────────────────────────────────────────────────────
-- Hai lỗ hổng lớn nhất tìm được đều KHÔNG phải "policy viết sai". Chúng là
-- "KHÔNG CÓ POLICY NÀO CẢ":
--   ① 025 cố ý bỏ qua orders/cut_tickets/cut_bundles (danh sách `allowed`)
--   ② bản nháp 031 GỠ `subcon_denied` khỏi qa_audit_reports rồi chỉ thay
--      SELECT + INSERT, quên hẳn UPDATE
-- Cả hai vô hình với bài kiểm hành vi nếu không ai nghĩ ra đúng phép thử.
-- A002 làm ngược lại: đọc `pg_policies` và chỉ ra CHỖ TRỐNG.
--
-- ─── CÁCH ĐỌC ─────────────────────────────────────────────────────────────
--   Đọc `muc = '0 · KẾT LUẬN'` trước.
--   `⛔` = phải xử lý · `⚠️` = cần để mắt · `ℹ️` = số liệu
-- ============================================================================

WITH
canh_gac AS (
  SELECT p.tablename, p.cmd, p.permissive, p.policyname,
         (COALESCE(p.qual, '') || ' ' || COALESCE(p.with_check, '')) AS bieu_thuc
    FROM pg_policies p
   WHERE p.schemaname = 'public'
),
bang AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity,
         has_table_privilege('authenticated', c.oid, 'INSERT') AS co_ins,
         has_table_privilege('authenticated', c.oid, 'UPDATE') AS co_upd,
         has_table_privilege('authenticated', c.oid, 'DELETE') AS co_del
    FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
),
-- Một lệnh coi là CÓ CANH GÁC khi tồn tại policy phủ lệnh đó và biểu thức có
-- nhắc tới người ngoài. `FOR ALL` (cmd='ALL') phủ cả ba lệnh.
phu AS (
  SELECT b.relname, l.lenh,
         EXISTS (SELECT 1 FROM canh_gac g
                  WHERE g.tablename = b.relname
                    AND g.cmd IN (l.lenh, 'ALL')
                    AND g.bieu_thuc ~ 'mos_is_(external|subcon|buyer)|mos_partner|mos_can_') AS co_gac,
         CASE l.lenh WHEN 'INSERT' THEN b.co_ins
                     WHEN 'UPDATE' THEN b.co_upd
                     ELSE b.co_del END AS duoc_cap
    FROM bang b
   CROSS JOIN (VALUES ('INSERT'), ('UPDATE'), ('DELETE')) AS l(lenh)
   WHERE b.relrowsecurity
),
-- Trigger BEFORE UPDATE/DELETE mà thân hàm có `RAISE EXCEPTION` — tức là một
-- hàng rào thật, chỉ nằm ở tầng khác `pg_policies`.
tg AS (
  SELECT c.relname AS tbl, t.tgname AS tg_name, p.proname AS fn,
         CASE WHEN (t.tgtype & 16) > 0 AND (t.tgtype & 8) > 0 THEN 'UPDATE+DELETE'
              WHEN (t.tgtype & 16) > 0 THEN 'UPDATE'
              WHEN (t.tgtype &  8) > 0 THEN 'DELETE'
              ELSE 'khác' END AS lenh
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_proc  p ON p.oid = t.tgfoid
   WHERE NOT t.tgisinternal
     AND c.relnamespace = 'public'::regnamespace
     AND ((t.tgtype & 16) > 0 OR (t.tgtype & 8) > 0)   -- UPDATE hoặc DELETE
     AND p.prosrc ILIKE '%RAISE EXCEPTION%'
),
-- ── 1. ⛔ BẢNG CHƯA BẬT RLS — policy viết kiểu gì cũng không chạy ──────────
m1 AS (
  SELECT '1 · CHƯA BẬT RLS' AS muc, b.relname AS doi_tuong,
         'cấp quyền: '
         || CASE WHEN b.co_ins THEN 'I' ELSE '·' END
         || CASE WHEN b.co_upd THEN 'U' ELSE '·' END
         || CASE WHEN b.co_del THEN 'D' ELSE '·' END
         || ' · ' || (SELECT COUNT(*) FROM canh_gac g WHERE g.tablename = b.relname)::TEXT
         || ' policy (KHÔNG CHẠY)'                          AS chi_tiet,
         CASE WHEN b.co_ins OR b.co_upd OR b.co_del
              THEN '⛔ CHO GHI mà không có RLS' ELSE '⚠️ chưa bật RLS' END AS danh_gia
    FROM bang b
   WHERE NOT b.relrowsecurity
),
-- ── 2. LỆNH GHI KHÔNG CÓ CANH GÁC Ở TẦNG POLICY ───────────────────────────
--
-- ⚠️ MỤC NÀY CHỈ NHÌN THẤY TẦNG POLICY. Nó KHÔNG nhìn thấy trigger.
--
-- Bản trước gắn ⛔ cho `assignment_daily_reports · UPDATE`. Đo lại bằng phiên
-- thật: **cả nhà thầu lẫn Monica đều KHÔNG sửa được** — sổ cái chỉ-ghi-thêm
-- được canh bằng TRIGGER, thứ nằm ngoài tầm nhìn của `pg_policies`.
--
-- Nên ở đây hạ xuống ⚠️ và nói rõ phải đối chiếu Mục 5. Gắn ⛔ cho một chỗ
-- thực tế đang kín là **báo động giả** — và báo động giả lặp lại thì người ta
-- bắt đầu bỏ qua cả báo động thật.
m2 AS (
  SELECT '2 · GHI KHÔNG CANH GÁC' AS muc,
         p.relname || ' · ' || p.lenh AS doi_tuong,
         'không policy nào nhắc tới người ngoài — ĐỐI CHIẾU Mục 5 (trigger)' AS chi_tiet,
         CASE WHEN EXISTS (SELECT 1 FROM tg WHERE tg.tbl = p.relname)
              THEN '⚠️ policy trống, nhưng CÓ trigger canh'
              ELSE '⛔ TRỐNG cả policy lẫn trigger' END AS danh_gia
    FROM phu p
   WHERE p.duoc_cap AND NOT p.co_gac
),
-- ── 5. CANH GÁC Ở TẦNG TRIGGER ────────────────────────────────────────────
-- Bổ sung sau khi phát hiện Mục 2 báo động giả: có bảng được bảo vệ bằng
-- trigger chứ không bằng policy. Bỏ qua tầng này thì bức tranh khuyết một nửa.
m5 AS (
  SELECT '5 · TRIGGER CANH' AS muc,
         tg.tbl || ' · ' || tg.tg_name AS doi_tuong,
         tg.lenh || ' · hàm ' || tg.fn AS chi_tiet,
         '✅ có chặn ở tầng trigger' AS danh_gia
    FROM tg
),
-- ── 3. BẢNG KHÔNG CÓ `subcon_denied` — CÓ CANH GÁC KHÁC KHÔNG? ────────────
--
-- ⚠️ BẢN 2 CỦA MỤC NÀY ĐÃ SỬA HAI KẾT LUẬN SAI CỦA BẢN TRƯỚC.
--
-- Bản trước gắn cờ ⛔ cho 9 bảng với lý do "đã bị GỠ bởi migration sau,
-- KHÔNG THAY GÌ". Đo lại bằng phiên nhà thầu thật: **cả 9 đều kín**.
-- Hai chỗ sai:
--
--   ① "đã bị GỠ" — SAI. Cả 9 bảng (`assignments`, `partners`,
--      `production_sites`, `contract_types`…) sinh ra ở migration 027–030,
--      tức SAU khi 025 chạy. Chưa từng có thì không thể gọi là bị gỡ.
--      Vắng mặt vì SINH SAU khác hẳn vắng mặt vì BỊ GỠ.
--
--   ② "KHÔNG THAY GÌ" — SAI. Phép kiểm chỉ đếm policy RESTRICTIVE, trong khi
--      027–030 canh bằng policy PERMISSIVE có sẵn vế `mos_is_external()`.
--      Thiếu RESTRICTIVE **không** đồng nghĩa với không có hàng rào.
--
-- Câu hỏi đúng không phải "có `subcon_denied` không" mà là **"có hàng rào nào
-- biết tới người ngoài không"** — bất kể loại policy. Bản này hỏi đúng câu đó.
m3 AS (
  SELECT '3 · KHÔNG subcon_denied' AS muc, b.relname AS doi_tuong,
         CASE WHEN b.relname = ANY (ARRAY['subcontractors','subcon_orders',
                'subcon_issue_logs','subcon_receipt_logs','cut_bundles',
                'cut_tickets','orders'])
              THEN '025 CỐ Ý cho phép'
              ELSE 'không có subcon_denied (sinh sau 025, hoặc đã bị gỡ)' END
         || ' · canh gác hiện có: '
         || COALESCE((SELECT string_agg(DISTINCT g.policyname || '(' || g.permissive || ')', ', ')
                        FROM canh_gac g
                       WHERE g.tablename = b.relname
                         AND (g.permissive = 'RESTRICTIVE'
                           OR g.bieu_thuc ~ 'mos_is_(external|subcon|buyer)|mos_partner|mos_can_')),
                     '(KHÔNG CÓ)')                          AS chi_tiet,
         CASE WHEN NOT EXISTS (SELECT 1 FROM canh_gac g
                                WHERE g.tablename = b.relname
                                  AND (g.permissive = 'RESTRICTIVE'
                                    OR g.bieu_thuc ~ 'mos_is_(external|subcon|buyer)|mos_partner|mos_can_'))
                   THEN '⛔ KHÔNG CÓ HÀNG RÀO NÀO'
              WHEN b.relname = ANY (ARRAY['subcontractors','subcon_orders',
                'subcon_issue_logs','subcon_receipt_logs','cut_bundles',
                'cut_tickets','orders']) THEN '⚠️ theo thiết kế 025'
              ELSE '✅ có canh gác khác' END                 AS danh_gia
    FROM bang b
   WHERE b.relrowsecurity
     AND NOT EXISTS (SELECT 1 FROM canh_gac g
                      WHERE g.tablename = b.relname AND g.policyname = 'subcon_denied')
),
-- ── 4. BỐN BẢNG CỦA 031a ──────────────────────────────────────────────────
m4 AS (
  SELECT '4 · 031a' AS muc,
         g.tablename || ' · ' || g.policyname AS doi_tuong,
         g.cmd || ' · ' || g.permissive AS chi_tiet,
         CASE WHEN g.policyname LIKE 'p031a_%' THEN '✅' ELSE 'ℹ️' END AS danh_gia
    FROM canh_gac g
   WHERE g.tablename IN ('orders','cut_tickets','cut_bundles','qa_audit_reports')
),
-- ── 0. KẾT LUẬN ───────────────────────────────────────────────────────────
m0 AS (
  SELECT '0 · KẾT LUẬN' AS muc, k.doi_tuong, k.chi_tiet, k.danh_gia
    FROM (VALUES
      ('⭐ Bảng CHO GHI mà chưa bật RLS',
       (SELECT COUNT(*)::TEXT FROM bang WHERE NOT relrowsecurity
          AND (co_ins OR co_upd OR co_del)),
       CASE WHEN (SELECT COUNT(*) FROM bang WHERE NOT relrowsecurity
                    AND (co_ins OR co_upd OR co_del)) = 0 THEN '✅' ELSE '⛔' END),
      ('⭐ Lệnh GHI trống CẢ policy LẪN trigger',
       (SELECT COUNT(*)::TEXT FROM phu p
         WHERE p.duoc_cap AND NOT p.co_gac
           AND NOT EXISTS (SELECT 1 FROM tg WHERE tg.tbl = p.relname)),
       CASE WHEN (SELECT COUNT(*) FROM phu p
                   WHERE p.duoc_cap AND NOT p.co_gac
                     AND NOT EXISTS (SELECT 1 FROM tg WHERE tg.tbl = p.relname)) = 0
            THEN '✅' ELSE '⛔ xem Mục 2' END),
      ('Lệnh GHI trống policy nhưng CÓ trigger canh',
       (SELECT COUNT(*)::TEXT FROM phu p
         WHERE p.duoc_cap AND NOT p.co_gac
           AND EXISTS (SELECT 1 FROM tg WHERE tg.tbl = p.relname)), 'ℹ️'),
      ('Trigger chặn UPDATE/DELETE đang có',
       (SELECT COUNT(*)::TEXT FROM tg), 'ℹ️'),
      ('⭐ 12 policy của 031a còn nguyên',
       (SELECT COUNT(*)::TEXT FROM canh_gac
         WHERE policyname LIKE 'p031a_ext_no_%' AND permissive = 'RESTRICTIVE'),
       CASE WHEN (SELECT COUNT(*) FROM canh_gac
                   WHERE policyname LIKE 'p031a_ext_no_%'
                     AND permissive = 'RESTRICTIVE') = 12 THEN '✅' ELSE '⛔' END),
      ('⭐ 031a KHÔNG chạm SELECT',
       (SELECT COUNT(*)::TEXT FROM canh_gac
         WHERE policyname LIKE 'p031a_ext_no_%' AND cmd IN ('SELECT','ALL')),
       CASE WHEN (SELECT COUNT(*) FROM canh_gac
                   WHERE policyname LIKE 'p031a_ext_no_%'
                     AND cmd IN ('SELECT','ALL')) = 0 THEN '✅' ELSE '⛔' END),
      ('⭐ Bảng KHÔNG có hàng rào nào biết tới người ngoài',
       (SELECT COUNT(*)::TEXT FROM m3 WHERE danh_gia LIKE '⛔%'),
       CASE WHEN (SELECT COUNT(*) FROM m3 WHERE danh_gia LIKE '⛔%') = 0
            THEN '✅' ELSE '⛔' END),
      ('Bảng đã bật RLS', (SELECT COUNT(*)::TEXT FROM bang WHERE relrowsecurity), 'ℹ️'),
      ('Tổng số bảng',    (SELECT COUNT(*)::TEXT FROM bang), 'ℹ️')
    ) AS k(doi_tuong, chi_tiet, danh_gia)
)
SELECT muc, doi_tuong, chi_tiet, danh_gia
FROM (SELECT * FROM m0 UNION ALL SELECT * FROM m1 UNION ALL SELECT * FROM m2
      UNION ALL SELECT * FROM m3 UNION ALL SELECT * FROM m4
      UNION ALL SELECT * FROM m5) z
ORDER BY muc,
         CASE WHEN danh_gia LIKE '⛔%' THEN 0 WHEN danh_gia LIKE '⚠️%' THEN 1 ELSE 2 END,
         doi_tuong;

-- ────────────────────────────────────────────────────────────────────────────
-- ⛔ CỔNG PASS/FAIL
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE v_no_rls TEXT[]; v_31a INT; v_sel INT;
BEGIN
  SELECT array_agg(c.relname ORDER BY c.relname) INTO v_no_rls
    FROM pg_class c
   WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
     AND NOT c.relrowsecurity
     AND (has_table_privilege('authenticated', c.oid, 'INSERT')
       OR has_table_privilege('authenticated', c.oid, 'UPDATE')
       OR has_table_privilege('authenticated', c.oid, 'DELETE'));

  SELECT COUNT(*) INTO v_31a FROM pg_policies
   WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
     AND permissive = 'RESTRICTIVE';

  SELECT COUNT(*) INTO v_sel FROM pg_policies
   WHERE schemaname = 'public' AND policyname LIKE 'p031a_ext_no_%'
     AND cmd IN ('SELECT', 'ALL');

  IF v_no_rls IS NOT NULL THEN
    RAISE WARNING '⚠️ % bảng CHO GHI nhưng CHƯA BẬT RLS: %',
      array_length(v_no_rls, 1), array_to_string(v_no_rls, ', ');
  END IF;
  IF v_31a <> 12 THEN
    RAISE EXCEPTION 'A002 HỎNG — 031a phải có đúng 12 policy RESTRICTIVE, đang có %.', v_31a;
  END IF;
  IF v_sel > 0 THEN
    RAISE EXCEPTION 'A002 HỎNG — % policy của 031a đang chạm SELECT.', v_sel;
  END IF;

  RAISE NOTICE '✅ A002 ĐẠT — 031a nguyên vẹn (12 RESTRICTIVE, 0 chạm SELECT).';
END $$;
