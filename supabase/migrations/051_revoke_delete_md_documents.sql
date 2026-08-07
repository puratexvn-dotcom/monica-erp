-- ============================================================================
-- MONICA ONE — 051 · THU HỒI `DELETE` TRÊN `md_documents` — TD-25 6 ⇒ 5
--
-- 📐 Board Decision 07/08/2026 `BUG-5`: *"⛔ Không Delete vật lý. Chỉ Archive."*
-- 📐 Đóng một phần nợ `TD-25` (ADR-018 §9.3)
--
-- ⚠️ Chạy SAU `050`. Idempotent. ⛔ Không xoá dữ liệu. ⛔ Không đụng lược đồ.
--
-- ─── VÌ SAO GIỜ MỚI THU HỒI ĐƯỢC ────────────────────────────────────────
-- `042` Mục 1c cố ý GIỮ `DELETE` cho **sáu** bảng, và nêu đúng lý do:
--
--   > *"Thu hồi ngay sẽ làm BỐN CHỨC NĂNG ĐANG DÙNG gãy tại chỗ với lỗi
--   > `42501` mà người dùng ⛔ không hiểu. Phải chuyển bốn lời gọi đó sang xoá
--   > mềm hoặc RPC TRƯỚC, rồi mới thu hồi."*
--
-- 🔑 Với `md_documents`, **điều kiện đó nay ĐÃ THOẢ**: Board cấm xoá vật lý
--    chứng từ, và `deleteDocument()` *(collaboration.actions.ts)* đã được sửa
--    07/08/2026 — nó **TỪ CHỐI ngay** và ⛔ **không còn gọi `.delete()`**.
--    Quyền `DELETE` ở CSDL vì thế trở thành **quyền thừa**: ⛔ không mã nào
--    dùng, mà vẫn mở cho ai gọi thẳng PostgREST.
--
-- ⚠️ NĂM BẢNG CÒN LẠI **VẪN GIỮ** `DELETE`, và đó là CÓ CHỦ Ý — mã ứng dụng
--    vẫn đang dùng thật:
--      costing_items         commercial.actions.ts  (deleteCostingItem)
--      order_size_breakdown  po.actions.ts          (xoá-rồi-chèn-lại)
--      style_colorways
--      style_sizes           style.actions.ts       (deleteStyleChild)
--      style_operations
--    Thu hồi chúng bây giờ là làm gãy bốn chức năng đang chạy. Chúng cần
--    `deleted_at` + RPC trước — tức đổi lược đồ, tức một gói riêng.
--    ⇒ `TD-25` giảm **6 ⇒ 5**, ⛔ KHÔNG đóng hẳn. Nói thật con số.
--
-- ─── TÍNH ĐẢO NGƯỢC ─────────────────────────────────────────────────────
--   ĐẢO ĐƯỢC:  GRANT DELETE ON public.md_documents TO authenticated;
--   ⚠️ Nhưng đảo lại là **mở lại một quyền Board đã cấm** — cần lý do nghiệp
--      vụ, ⛔ không phải một lệnh tiện tay.
-- ============================================================================

BEGIN;

REVOKE DELETE ON public.md_documents FROM authenticated;
-- `anon` lẽ ra đã bị `042` gỡ sạch; làm lại cho chắc — REVOKE là idempotent.
REVOKE ALL    ON public.md_documents FROM anon;

COMMENT ON TABLE public.md_documents IS
  'Tài liệu của phân hệ MD. 051: ĐÃ THU HỒI DELETE của authenticated — '
  'Board 07/08/2026 cấm xoá vật lý chứng từ, và deleteDocument() nay TỪ CHỐI '
  'thay vì gọi .delete(). ⚠️ Bảng này vẫn CHƯA có deleted_at, nên chức năng '
  'LƯU TRỮ ⛔ chưa dùng được — xem ADR-027 §③.';

-- ── TỰ KIỂM ───────────────────────────────────────────────────────────────
DO $$
DECLARE v_con INT;
BEGIN
  SELECT count(*) INTO v_con
    FROM information_schema.role_table_grants
   WHERE table_schema = 'public' AND table_name = 'md_documents'
     AND grantee = 'authenticated' AND privilege_type = 'DELETE';
  IF v_con <> 0 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 051: `authenticated` VẪN còn quyền DELETE trên md_documents.';
  END IF;

  -- ⚠️ Vế ĐỐI CHỨNG (`K-3`): thu hồi DELETE mà làm mất luôn SELECT/UPDATE thì
  -- Trung tâm tài liệu chết. Chỉ đo vế cấm là ⛔ không đủ.
  SELECT count(*) INTO v_con
    FROM information_schema.role_table_grants
   WHERE table_schema = 'public' AND table_name = 'md_documents'
     AND grantee = 'authenticated' AND privilege_type IN ('SELECT','INSERT','UPDATE');
  IF v_con < 3 THEN
    RAISE EXCEPTION '⛔ TỰ KIỂM 051: mất quyền ĐỌC/GHI trên md_documents (thấy %/3) — '
      'Trung tâm tài liệu sẽ chết.', v_con;
  END IF;

  RAISE NOTICE '✅ TỰ KIỂM 051: DELETE đã thu hồi, SELECT/INSERT/UPDATE còn nguyên.';
END $$;

COMMIT;

SELECT 'authenticated CÒN quyền DELETE trên md_documents' AS muc,
       (SELECT count(*)::text FROM information_schema.role_table_grants
         WHERE table_schema='public' AND table_name='md_documents'
           AND grantee='authenticated' AND privilege_type='DELETE') AS thuc_te,
       '0' AS ky_vong
UNION ALL
SELECT 'số bảng MD còn giữ DELETE (nợ TD-25)',
       (SELECT count(DISTINCT table_name)::text FROM information_schema.role_table_grants
         WHERE table_schema='public' AND grantee='authenticated'
           AND privilege_type='DELETE'
           AND table_name IN ('costing_items','order_size_breakdown','md_documents',
                              'style_colorways','style_sizes','style_operations')),
       '5';
