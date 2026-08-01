-- ============================================================================
-- ẢNH CHỤP TRƯỚC KHI CHẠY 035c — BẮT BUỘC theo chỉ thị Kiến trúc sư
--
-- Sinh tự động từ CSDL đang chạy lúc 2026-08-01T13:37:07.094Z
-- Mục đích DUY NHẤT: khôi phục name_vi/name_en nếu 035c phải quay lui.
--
-- ⚠️ 035c là bước DUY NHẤT của chuỗi 035 không hoàn tác được bằng một lệnh.
-- Sau khi DROP, hai cột biến mất; dựng lại phải chạy tệp này.
--
-- ⚠️ Về lý thuyết name_translations đã giữ đủ dữ liệu nên tệp này là THỪA.
-- Giữ nó vì "về lý thuyết" không phải một chiến lược hoàn tác — nếu backfill
-- có một lỗi chưa ai phát hiện thì đây là bản duy nhất còn chữ gốc.
-- ============================================================================

-- ─── defect_catalog : 20 dòng ───
-- Khôi phục:  UPDATE public.defect_catalog SET name_vi=..., name_en=... WHERE code=...;
UPDATE public.defect_catalog SET name_vi='Đứt chỉ', name_en='Broken thread' WHERE code='BROKEN_THREAD';
UPDATE public.defect_catalog SET name_vi='Nút lỗi / lệch', name_en='Button defect' WHERE code='BUTTON_DEFECT';
UPDATE public.defect_catalog SET name_vi='Thủng vải', name_en='Fabric hole' WHERE code='FABRIC_HOLE';
UPDATE public.defect_catalog SET name_vi='Vết bẩn trên vải', name_en='Fabric stain' WHERE code='FABRIC_STAIN';
UPDATE public.defect_catalog SET name_vi='Sai nhãn mác', name_en='Wrong label' WHERE code='LABEL_WRONG';
UPDATE public.defect_catalog SET name_vi='Chỉ thừa', name_en='Loose thread' WHERE code='LOOSE_THREAD';
UPDATE public.defect_catalog SET name_vi='Dơ dầu máy', name_en='Oil stain' WHERE code='OIL_STAIN';
UPDATE public.defect_catalog SET name_vi='Sổ đường may', name_en='Open seam' WHERE code='OPEN_SEAM';
UPDATE public.defect_catalog SET name_vi='Lỗi khác', name_en='Other' WHERE code='OTHER';
UPDATE public.defect_catalog SET name_vi='Ủi không phẳng', name_en='Poor ironing' WHERE code='POOR_IRONING';
UPDATE public.defect_catalog SET name_vi='Nhăn mũi may', name_en='Puckering' WHERE code='PUCKERING';
UPDATE public.defect_catalog SET name_vi='Loang màu / khác tông', name_en='Shade variation' WHERE code='SHADE_VAR';
UPDATE public.defect_catalog SET name_vi='Lệch đường may', name_en='Skewed seam' WHERE code='SKEWED_SEAM';
UPDATE public.defect_catalog SET name_vi='Bỏ mũi', name_en='Skipped stitch' WHERE code='SKIP_STITCH';
UPDATE public.defect_catalog SET name_vi='Gút sợi', name_en='Slub' WHERE code='SLUB';
UPDATE public.defect_catalog SET name_vi='Lệch sọc / lệch caro', name_en='Stripe mismatch' WHERE code='STRIPE_MISMATCH';
UPDATE public.defect_catalog SET name_vi='Mũi may không đều', name_en='Uneven stitching' WHERE code='UNEVEN_STITCH';
UPDATE public.defect_catalog SET name_vi='Gấp sai quy cách', name_en='Wrong folding' WHERE code='WRONG_FOLD';
UPDATE public.defect_catalog SET name_vi='Sai số lượng đóng gói', name_en='Wrong packing qty' WHERE code='WRONG_QTY';
UPDATE public.defect_catalog SET name_vi='Khoá kéo hỏng', name_en='Zipper defect' WHERE code='ZIPPER_DEFECT';
-- JSONB tại thời điểm chụp (đối chiếu):
--   BROKEN_THREAD     {"en":"Broken thread","vi":"Đứt chỉ"}
--   BUTTON_DEFECT     {"en":"Button defect","vi":"Nút lỗi / lệch"}
--   FABRIC_HOLE       {"en":"Fabric hole","vi":"Thủng vải"}
--   FABRIC_STAIN      {"en":"Fabric stain","vi":"Vết bẩn trên vải"}
--   LABEL_WRONG       {"en":"Wrong label","vi":"Sai nhãn mác"}
--   LOOSE_THREAD      {"en":"Loose thread","vi":"Chỉ thừa"}
--   OIL_STAIN         {"en":"Oil stain","vi":"Dơ dầu máy"}
--   OPEN_SEAM         {"en":"Open seam","vi":"Sổ đường may"}
--   OTHER             {"en":"Other","vi":"Lỗi khác"}
--   POOR_IRONING      {"en":"Poor ironing","vi":"Ủi không phẳng"}
--   PUCKERING         {"en":"Puckering","vi":"Nhăn mũi may"}
--   SHADE_VAR         {"en":"Shade variation","vi":"Loang màu / khác tông"}
--   SKEWED_SEAM       {"en":"Skewed seam","vi":"Lệch đường may"}
--   SKIP_STITCH       {"en":"Skipped stitch","vi":"Bỏ mũi"}
--   SLUB              {"en":"Slub","vi":"Gút sợi"}
--   STRIPE_MISMATCH   {"en":"Stripe mismatch","vi":"Lệch sọc / lệch caro"}
--   UNEVEN_STITCH     {"en":"Uneven stitching","vi":"Mũi may không đều"}
--   WRONG_FOLD        {"en":"Wrong folding","vi":"Gấp sai quy cách"}
--   WRONG_QTY         {"en":"Wrong packing qty","vi":"Sai số lượng đóng gói"}
--   ZIPPER_DEFECT     {"en":"Zipper defect","vi":"Khoá kéo hỏng"}

-- ─── contract_types : 0 dòng ───
-- (bảng rỗng — không có gì để khôi phục)
