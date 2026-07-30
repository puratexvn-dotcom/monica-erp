-- ============================================================================
-- 016 — ĐỒNG BỘ DANH SÁCH THỰC THỂ CHO TÀI LIỆU VÀ THẢO LUẬN
--
-- ─── VẤN ĐỀ PHÁT HIỆN KHI KIỂM THỬ BƯỚC 4 ──────────────────────────────────
-- Hai bảng md_documents và md_comments cùng dùng chung khái niệm "gắn vào một
-- thực thể nào đó", nhưng migration 015 lại khai hai danh sách LỆCH NHAU:
--
--   md_documents : STYLE, ORDER, COSTING, INQUIRY, CUSTOMER, SAMPLE
--   md_comments  : STYLE, ORDER, COSTING, INQUIRY, SAMPLE, MILESTONE
--
-- Hệ quả thật, đã đo được: đính kèm được hợp đồng vào một KHÁCH HÀNG nhưng
-- không thảo luận được về chính khách hàng đó; ngược lại bình luận được vào
-- một MỐC TIẾN ĐỘ nhưng không đính kèm được ảnh chứng từ cho mốc ấy. Lược đồ
-- Zod dùng chung một danh sách bảy giá trị nên giao diện vẫn cho chọn, rồi
-- người dùng nhận về một lỗi ràng buộc khó hiểu ngay lúc bấm Lưu.
--
-- Migration này gộp cả hai về ĐÚNG MỘT danh sách bảy giá trị, khớp với hằng
-- ENTITY_TYPES trong schemas/md/collaboration.schema.ts.
--
-- ─── VÌ SAO CHỈ NỚI RỘNG, KHÔNG THU HẸP ────────────────────────────────────
-- Nới rộng thì mọi dòng đang có đều còn hợp lệ, chạy được trên cơ sở dữ liệu
-- đang có dữ liệu thật mà không phải dọn gì trước.
--
-- CHẠY: dán toàn bộ vào Supabase Dashboard > SQL Editor > Run.
-- Idempotent, KHÔNG xoá dữ liệu.
-- ============================================================================

-- ─── 1. TÀI LIỆU: bổ sung MILESTONE ─────────────────────────────────────────
ALTER TABLE public.md_documents
  DROP CONSTRAINT IF EXISTS md_documents_entity_type_check;

ALTER TABLE public.md_documents
  ADD CONSTRAINT md_documents_entity_type_check
  CHECK (entity_type IN ('STYLE','ORDER','COSTING','INQUIRY','CUSTOMER','SAMPLE','MILESTONE'));

-- ─── 2. THẢO LUẬN: bổ sung CUSTOMER ─────────────────────────────────────────
ALTER TABLE public.md_comments
  DROP CONSTRAINT IF EXISTS md_comments_entity_type_check;

ALTER TABLE public.md_comments
  ADD CONSTRAINT md_comments_entity_type_check
  CHECK (entity_type IN ('STYLE','ORDER','COSTING','INQUIRY','CUSTOMER','SAMPLE','MILESTONE'));

-- ─── 3. KIỂM CHỨNG ──────────────────────────────────────────────────────────
-- Chạy xong nên thấy hai dòng, mỗi dòng liệt kê đủ bảy giá trị giống hệt nhau.
SELECT rel.relname AS bang, con.conname AS rang_buoc,
       pg_get_constraintdef(con.oid) AS dinh_nghia
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE con.conname IN ('md_documents_entity_type_check', 'md_comments_entity_type_check')
ORDER BY rel.relname;
