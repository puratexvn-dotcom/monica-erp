-- ============================================================================
-- MONICA ONE — 044 · KHÔI PHỤC HÀNG RÀO CHIẾT TÍNH ĐÃ DUYỆT
--
-- 🔴 VÁ LỖ HỔNG ĐANG MỞ TRÊN CSDL THẬT · `[VERIFIED]` 05/08/2026
-- 🔴 NGUYÊN NHÂN: migration `043` — do chính tôi soạn trên một giả thuyết SAI,
--    đã được chạy lên CSDL, rồi tệp bị xoá khỏi kho.
--
-- ⛔ CHƯA CHẠY. Cần Board phê duyệt và chạy trên SQL Editor.
--
-- ─── LỖ HỔNG, ĐO ĐƯỢC ────────────────────────────────────────────────────
--
-- Vai `md`, phiên đăng nhập thật, chiết tính `status = 'APPROVED'`:
--
--     approved_at = NULL      → UPDATE quoted_price  →  42501, giá giữ 10  ✅
--     approved_at ĐÃ ĐẶT      → UPDATE quoted_price  →  KHÔNG LỖI, giá = 777  🔴
--
-- `setCostingStatus` (`commercial.actions.ts:322`) đặt `approved_at` **cùng lúc**
-- với `status = 'APPROVED'`. Nên MỌI chiết tính được duyệt thật đều có
-- `approved_at`, và vì thế **mọi chiết tính đã duyệt đều sửa giá được.**
--
-- Lỗ hổng là TOÀN PHẦN, không phải một phần. Vi phạm Hiến pháp **Điều 8**
-- (Evidence First — bằng chứng phê duyệt phải giữ được).
--
-- ─── VÌ SAO NÓ XẢY RA — GHI ĐỦ ĐỂ KHÔNG LẶP ──────────────────────────────
--
-- ① Tôi đọc biểu thức policy của `042`, SUY RA rằng nó chặn nhầm phép chuyển
--    `APPROVED → SUPERSEDED`, ghi thành lỗi 🔴 `B-1`. **Không chạy phép đo nào.**
-- ② Tôi soạn `043` để vá, với `WITH CHECK (status <> 'APPROVED' OR approved_at
--    IS NOT NULL)`. Vế đó **luôn đúng** với chiết tính đã duyệt.
-- ③ `043` được chạy lên CSDL.
-- ④ Tôi đo lại — trên CSDL **đã có `043`** — thấy `APPROVED → SUPERSEDED` chạy
--    được, và kết luận `B-1` là do tôi bịa ra. **Tôi đo đúng, nhưng đo một hệ
--    thống đã bị chính bản vá của tôi thay đổi, mà không biết.**
-- ⑤ Tôi xoá `043` khỏi kho ⇒ CSDL mang policy KHÔNG có tệp migration nào giải
--    thích. Kho và CSDL lệch nhau.
--
-- 🔑 Bài học vượt ra ngoài lần này: *"Đo trước, kết luận sau"* **chưa đủ**. Phải
--    biết **mình đang đo cái gì** — trạng thái nào, đã có bản vá nào. Một phép
--    đo trên nền đã đổi cho ra kết luận sai y như không đo.
--
-- ─── TỆP NÀY LÀM GÌ ──────────────────────────────────────────────────────
--
-- Khôi phục **đúng** policy mà `042` đã ban hành và Board đã phê duyệt. Không
-- thiết kế lại, không cải tiến — `042` là bản đã qua ADR-018, phản biện và phê
-- duyệt; `043` thì không qua gì cả.
--
-- ⚠️ Điều này CÓ NGHĨA là phép chuyển `APPROVED → SUPERSEDED` sẽ bị chặn trở
-- lại — tức `B-1` có thể là lỗi THẬT, không phải lỗi bịa. Tôi **không kết luận**
-- điều đó ở đây: nó phải được ĐO trên CSDL sau khi `044` chạy, bằng
-- `tests/security/costing-lifecycle.test.mjs`. Nếu bài kiểm báo đỏ đúng chỗ
-- `APPROVED → SUPERSEDED` thì `B-1` được xác lập bằng bằng chứng, và khi đó mới
-- soạn bản vá — **qua ADR, không vá thẳng.**
-- ============================================================================

-- ─── 1. Gỡ policy do `043` để lại ─────────────────────────────────────────
-- Policy này KHÔNG có tệp migration nào trong kho sau khi `043` bị xoá. Đây là
-- chỗ kho và CSDL lệch nhau, và tệp `044` chính là chỗ ghi lại sự lệch đó.
DROP POLICY IF EXISTS "costing_items_locked_after_approve" ON public.costing_items;

-- ⚠️ Gỡ policy trên **mở lại** quyền đọc khoản mục của chiết tính đã duyệt cho
-- các vai T1. Đó là hành vi ĐÚNG theo `042`: `costing_items` không bao giờ được
-- thiết kế để ẩn theo trạng thái cha. Ẩn nó đi là tác dụng phụ của `043` —
-- `FOR ALL` áp lên cả `SELECT`, nên khoản mục của mọi chiết tính đã duyệt biến
-- mất khỏi giao diện, kể cả với `superadmin`. Đo được 05/08: `md` và
-- `superadmin` đều thấy **0** khoản mục khi cha ở `APPROVED` hoặc `SUPERSEDED`.

-- ─── 2. Khôi phục nguyên văn policy của `042` ─────────────────────────────
DROP POLICY IF EXISTS "costings_no_edit_after_approve" ON public.costings;
CREATE POLICY "costings_no_edit_after_approve" ON public.costings
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (status NOT IN ('APPROVED','SUPERSEDED'));

COMMENT ON POLICY "costings_no_edit_after_approve" ON public.costings IS
  'Khôi phục nguyên văn bản của migration 042 (ADR-018 §5, Board phê duyệt '
  '05/08/2026) sau khi migration 043 — soạn trên giả thuyết chưa kiểm chứng và '
  'chưa qua ADR — làm yếu nó thành sửa-được-nếu-có-approved_at. '
  'Xem docs/review/ADR-018-review.md §B-1 và §Phụ lục.';

-- ─── HOÀN TÁC ───────────────────────────────────────────────────────────────
-- Không dòng dữ liệu nào bị đụng. Hoàn tác = quay lại đúng trạng thái đang có
-- lỗ hổng ⇒ chỉ làm khi có quyết định Board bằng văn bản.

-- ============================================================================
-- KIỂM TRA SAU KHI CHẠY — chép TOÀN BỘ về hồ sơ
-- ============================================================================
SELECT 'Policy costing_items do 043 để lại đã gỡ' AS muc,
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND tablename='costing_items'
           AND policyname='costing_items_locked_after_approve') AS ket_qua,
       '0' AS ky_vong
UNION ALL
SELECT '⭐ Policy costings KHÔNG còn WITH CHECK của 043',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND tablename='costings'
           AND policyname='costings_no_edit_after_approve'
           AND COALESCE(with_check,'') NOT LIKE '%approved_at%'), '1'
UNION ALL
SELECT '⭐ Policy costings đã về đúng biểu thức 042',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND tablename='costings'
           AND policyname='costings_no_edit_after_approve'
           AND qual LIKE '%APPROVED%' AND qual LIKE '%SUPERSEDED%'), '1'
UNION ALL
SELECT 'costings_read (042) VẪN nguyên vẹn',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND tablename='costings'
           AND policyname='costings_read'), '1'
UNION ALL
SELECT 'costing_items_read (042) VẪN nguyên vẹn',
       (SELECT COUNT(*)::TEXT FROM pg_policies
         WHERE schemaname='public' AND tablename='costing_items'
           AND policyname='costing_items_read'), '1';
