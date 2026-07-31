-- ============================================================================
-- MONICA MOS — 019 · LƯU TRỮ HỘI THOẠI (communications)
--
-- MỤC TIÊU
--   1. Tin nhắn KHÔNG mất khi tải lại trang (trước đây chỉ nằm trong useState).
--   2. RLS thật: quyền đọc do máy chủ quyết định, không phải do lọc ở trình duyệt.
--   3. Realtime: tin nhắn nảy sang máy người khác mà không cần F5.
--   4. Đường dẫn tệp đính kèm ghi thẳng vào bản ghi, không thất lạc.
--
-- ─── AN TOÀN KHI CHẠY ─────────────────────────────────────────────────────
-- Migration này CHỈ THÊM MỚI: một bảng chưa từng tồn tại, hai hàm mới, các
-- policy chỉ gắn lên bảng mới đó. KHÔNG sửa, không xoá bất kỳ policy nào của
-- 11 vai trò nội bộ đang chạy. Chạy lại nhiều lần vẫn an toàn (idempotent).
--
-- ─── ⚠️ MỘT LỖ HỔNG THẬT CỦA MIGRATION 018 CẦN GHI NHỚ ────────────────────
-- 018 đi một vòng lặp gắn policy `buyer_denied` lên MỌI bảng đang có, tạo ra
-- thế "mặc định cấm" cho buyer. Nhưng đó là một lần chạy trên danh sách bảng
-- TẠI THỜI ĐIỂM ĐÓ. Bảng `communications` sinh sau nên KHÔNG được vòng lặp ấy
-- che. Nếu ở đây quên viết policy cho buyer thì buyer đọc được toàn bộ chat nội
-- bộ — mặc định của bảng mới là "có policy nào cho phép thì lọt".
-- Bên dưới xử lý dứt điểm bằng policy riêng. Nhưng đây là bài học chung:
-- MỖI BẢNG MỚI TỪ NAY PHẢI TỰ KHAI QUYỀN CHO BUYER, không có lưới an toàn.
-- ============================================================================

-- ============================================================================
-- 1. HÀM TRỢ GIÚP
-- ============================================================================

-- 1a. Vai trò của người đang gọi, đọc từ app_metadata trong JWT.
-- app_metadata chỉ sửa được bằng service_role key phía máy chủ, nên người dùng
-- KHÔNG tự nâng vai trò của mình được (xem lib/rbac.ts).
-- NULLIF chống lỗi ép kiểu: ở một số ngữ cảnh current_setting trả CHUỖI RỖNG,
-- mà ''::jsonb là lỗi cú pháp làm hỏng cả truy vấn thay vì trả NULL.
CREATE OR REPLACE FUNCTION public.mos_current_role()
RETURNS TEXT
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb
           -> 'app_metadata' ->> 'role';
$$;

-- 1b. Người đang gọi có quyền nhìn thấy NGỮ CẢNH của cuộc hội thoại không?
--
-- ⚠️ CỐ Ý dùng SECURITY INVOKER, KHÔNG dùng SECURITY DEFINER.
-- DEFINER sẽ chạy dưới quyền chủ hàm và BỎ QUA RLS của bảng orders — lúc đó
-- hàm luôn trả TRUE và câu "chỉ ai xem được ngữ cảnh mới đọc được chat" thành
-- lời nói suông. INVOKER giữ nguyên quyền người gọi, nên EXISTS bên dưới đi
-- qua đúng policy buyer_scope_orders của migration 018: buyer hỏi về PO của
-- khách khác thì EXISTS không thấy dòng nào → FALSE → không đọc được chat.
-- Đây chính là chỗ biến yêu cầu bảo mật thành cơ chế có thật.
CREATE OR REPLACE FUNCTION public.mos_can_see_context(p_type TEXT, p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Kênh chung của phân hệ: không gắn với hồ sơ nào nên không có gì để kiểm
  IF p_type = 'module' THEN RETURN TRUE; END IF;
  IF p_id IS NULL THEN RETURN FALSE; END IF;

  CASE p_type
    WHEN 'order'    THEN RETURN EXISTS (SELECT 1 FROM public.orders    t WHERE t.id = p_id);
    WHEN 'customer' THEN RETURN EXISTS (SELECT 1 FROM public.customers t WHERE t.id = p_id);
    WHEN 'style'    THEN RETURN EXISTS (SELECT 1 FROM public.styles    t WHERE t.id = p_id);
    WHEN 'material' THEN RETURN EXISTS (SELECT 1 FROM public.materials t WHERE t.id = p_id);
    -- Loại ngữ cảnh lạ → CẤM, không phải cho qua. Sai sót phải nghiêng về phía
    -- khoá lại, vì hội thoại có thể chứa giá vốn và điều khoản với khách.
    ELSE RETURN FALSE;
  END CASE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mos_current_role()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.mos_can_see_context(TEXT, UUID)    TO authenticated;

-- ============================================================================
-- 2. BẢNG communications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.communications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Kênh = (module, context_type, context_id)
  module        TEXT NOT NULL,                       -- 'md' | 'kho' | 'qa' | ...
  context_type  TEXT NOT NULL DEFAULT 'module',      -- 'module'|'order'|'customer'|'style'|'material'
  context_id    UUID,                                -- NULL khi context_type='module'

  sender_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role   TEXT NOT NULL,

  content       TEXT NOT NULL DEFAULT '',
  -- Mảng đường dẫn công khai trong bucket `evidences`. Ghi thẳng vào bản ghi
  -- để tệp không bao giờ lạc khỏi tin nhắn chứa nó.
  attachment_urls  TEXT[] NOT NULL DEFAULT '{}',
  attachment_names TEXT[] NOT NULL DEFAULT '{}',

  mentions      TEXT[] NOT NULL DEFAULT '{}',        -- các vai trò được gọi bằng @
  red_flag      BOOLEAN NOT NULL DEFAULT FALSE,      -- việc cần xử lý ngay

  -- TRUE = hội thoại nội bộ, buyer KHÔNG bao giờ đọc được.
  -- FALSE = kênh đã mở cho khách hàng (dùng cho Buyer Portal ở việc #5).
  is_internal   BOOLEAN NOT NULL DEFAULT TRUE,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Tin rỗng hoàn toàn là rác: phải có chữ HOẶC có tệp
  CONSTRAINT communications_has_body CHECK (
    LENGTH(content) > 0 OR COALESCE(ARRAY_LENGTH(attachment_urls, 1), 0) > 0
  ),
  -- context_id và context_type phải đi đôi, không được lệch nhau
  CONSTRAINT communications_context_pairs CHECK (
    (context_type = 'module') = (context_id IS NULL)
  ),
  -- Hai mảng tệp phải cùng độ dài, nếu không tên tệp sẽ gán nhầm cho ảnh khác
  CONSTRAINT communications_attachments_aligned CHECK (
    COALESCE(ARRAY_LENGTH(attachment_urls, 1), 0)
      = COALESCE(ARRAY_LENGTH(attachment_names, 1), 0)
  )
);

-- Chỉ mục theo đúng thứ tự truy vấn của giao diện: mở kênh nào -> lấy theo
-- thời gian. Không có chỉ mục này thì mỗi lần mở chat là một lần quét cả bảng.
CREATE INDEX IF NOT EXISTS communications_channel_idx
  ON public.communications (module, context_type, context_id, created_at DESC);

CREATE INDEX IF NOT EXISTS communications_sender_idx
  ON public.communications (sender_id);

-- GIN cho phép '{kho}' <@ mentions chạy bằng chỉ mục thay vì quét bảng —
-- policy đọc dùng phép này ở MỌI dòng nên nó là đường nóng.
CREATE INDEX IF NOT EXISTS communications_mentions_idx
  ON public.communications USING GIN (mentions);

CREATE INDEX IF NOT EXISTS communications_red_flag_idx
  ON public.communications (created_at DESC) WHERE red_flag;

-- ============================================================================
-- 3. TRIGGER — DANH TÍNH NGƯỜI GỬI DO MÁY CHỦ QUYẾT ĐỊNH
--
-- Không tin sender_id/sender_role do trình duyệt gửi lên. Kiểm bằng policy
-- WITH CHECK cũng được, nhưng ghi đè bằng trigger thì chắc hơn: không có
-- đường nào để một tài khoản mạo danh vai trò khác, kể cả khi ai đó gọi thẳng
-- PostgREST bằng curl.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.communications_stamp_sender()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.sender_id   := auth.uid();
  NEW.sender_role := COALESCE(public.mos_current_role(), 'unknown');
  -- Buyer không được tự gắn cờ "nội bộ": tin của khách luôn là kênh mở
  IF public.mos_is_buyer() THEN
    NEW.is_internal := FALSE;
  END IF;
  NEW.created_at  := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS communications_stamp_sender_trg ON public.communications;
CREATE TRIGGER communications_stamp_sender_trg
  BEFORE INSERT ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.communications_stamp_sender();

-- ============================================================================
-- 4. RLS
--
-- ─── LUẬT ĐỌC ─────────────────────────────────────────────────────────────
-- Điều kiện CẦN cho mọi người: phải xem được ngữ cảnh (mos_can_see_context).
-- Sau đó tách hai nhánh:
--
--   • BUYER      : chỉ đọc kênh is_internal = FALSE. Chat nội bộ đóng tuyệt đối.
--   • NỘI BỘ     : kênh gắn hồ sơ (PO, khách, mã hàng, NPL) — ai xem được hồ sơ
--                  thì đọc được cả hội thoại về hồ sơ đó, vì họ đang cùng làm
--                  một việc.
--                  Kênh chung của phân hệ ('module') giữ NGUYÊN luật nghiệp vụ
--                  đang chạy ở giao diện: giám đốc / MD / superadmin đọc tất;
--                  bộ phận khác chỉ thấy tin mình gửi và tin có @ gọi mình.
--
-- Khác biệt so với trước: luật này TRƯỚC ĐÂY chạy bằng .filter() trong trình
-- duyệt — mở DevTools là đọc được hết. Nay nó nằm trong Postgres.
-- ============================================================================

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
-- Chủ bảng vẫn bị RLS ràng buộc — chặn đường vòng qua vai trò chủ sở hữu
ALTER TABLE public.communications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "communications_read"   ON public.communications;
DROP POLICY IF EXISTS "communications_write"  ON public.communications;
DROP POLICY IF EXISTS "communications_purge"  ON public.communications;

CREATE POLICY "communications_read" ON public.communications
  FOR SELECT TO authenticated
  USING (
    public.mos_can_see_context(context_type, context_id)
    AND CASE
      WHEN public.mos_is_buyer() THEN is_internal = FALSE
      WHEN context_type <> 'module' THEN TRUE
      ELSE
        sender_id = auth.uid()
        OR public.mos_current_role() IN ('giamdoc', 'md', 'superadmin')
        OR public.mos_current_role() = ANY (mentions)
    END
  );

CREATE POLICY "communications_write" ON public.communications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.mos_can_see_context(context_type, context_id)
    -- Buyer chỉ được nói trong hồ sơ đơn hàng của chính khách mình, không được
    -- mở thoại ở kênh chung của phân hệ nội bộ
    AND (NOT public.mos_is_buyer() OR context_type = 'order')
  );

-- KHÔNG có policy UPDATE: hội thoại là bằng chứng vận hành, sửa lại lời đã nói
-- sẽ phá giá trị đối chiếu khi có tranh chấp với khách. Không policy = cấm.
-- DELETE chỉ dành cho superadmin, để còn đường gỡ nội dung lạm dụng.
CREATE POLICY "communications_purge" ON public.communications
  FOR DELETE TO authenticated
  USING (public.mos_current_role() = 'superadmin');

GRANT SELECT, INSERT, DELETE ON public.communications TO authenticated;

-- ============================================================================
-- 5. REALTIME
--
-- REPLICA IDENTITY FULL: không có nó thì sự kiện DELETE chỉ mang theo khoá
-- chính, còn UPDATE không mang giá trị cũ — client không đủ dữ liệu để lọc
-- theo kênh và sẽ phải tải lại cả danh sách.
-- ============================================================================

ALTER TABLE public.communications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'communications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.communications;
  END IF;
END $$;

-- ============================================================================
-- 6. KIỂM TRA SAU KHI CHẠY
-- ============================================================================

SELECT 'Bảng communications' AS muc,
       (SELECT COUNT(*)::TEXT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'communications') AS ket_qua,
       '1' AS ky_vong
UNION ALL
SELECT 'Số policy trên bảng',
       (SELECT COUNT(*)::TEXT FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'communications'), '3'
UNION ALL
SELECT 'RLS đã bật (bật + cưỡng chế)',
       (SELECT (relrowsecurity AND relforcerowsecurity)::TEXT FROM pg_class
        WHERE oid = 'public.communications'::regclass), 'true'
UNION ALL
SELECT 'Có trong publication realtime',
       (SELECT COUNT(*)::TEXT FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'communications'), '1'
UNION ALL
SELECT 'mos_can_see_context là INVOKER (KHÔNG phải DEFINER)',
       (SELECT (NOT prosecdef)::TEXT FROM pg_proc
        WHERE proname = 'mos_can_see_context'), 'true'
UNION ALL
SELECT 'Số chỉ mục',
       (SELECT COUNT(*)::TEXT FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'communications'), '5';
