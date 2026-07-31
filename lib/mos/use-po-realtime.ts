'use client';

import { useEffect, useRef, useState } from 'react';

import { createClient } from '@/utils/supabase/client';

// ============================================================================
// HOOK REALTIME CHO MỘT ĐƠN HÀNG — Điều XV
//
// ─── VÌ SAO MỘT HOOK CHUNG CHỨ KHÔNG MỖI TAB MỘT KÊNH ────────────────────
// Luật #7: không tab nào tự dựng Realtime riêng. Tám tab mở tám websocket cho
// cùng một PO là tám lần trả phí cho cùng một thông tin, và tám nơi có thể lệch
// nhau về thời điểm. Ở đây MỘT kênh, mọi tab cùng nghe.
//
// ─── VÌ SAO KHÔNG ĐẨY DỮ LIỆU MỚI VÀO THẲNG MÀN HÌNH ─────────────────────
// Sự kiện postgres_changes chỉ mang theo MỘT dòng của MỘT bảng. Thanh đầu trang
// là kết quả cộng từ chín nguồn — vá một dòng vào đó sẽ làm các con số lệch
// nhau ngay lần đầu. Hook này chỉ báo "có thứ gì đó đổi", việc tính lại để cho
// tầng service làm, đúng một nguồn công thức.
//
// ─── GOM NHỊP ────────────────────────────────────────────────────────────
// Một lần nhập sản lượng theo giờ có thể sinh vài chục sự kiện liên tiếp. Tải
// lại ngay mỗi sự kiện là vài chục lượt truy vấn trong hai giây. Gom lại và chỉ
// tải một lần sau khi im lặng 800ms.
// ============================================================================

/** Các bảng mà một PO thực sự phụ thuộc vào. Thêm bảng ở đây là mọi tab cùng
 *  được cập nhật, không phải sửa tám nơi. */
const WATCHED: ReadonlyArray<{ table: string; key: string }> = [
  { table: 'orders', key: 'id' },
  { table: 'prod_logs', key: 'order_id' },
  { table: 'hourly_production_logs', key: 'order_id' },
  { table: 'qa_logs', key: 'order_id' },
  { table: 'bom', key: 'order_id' },
  { table: 'cut_tickets', key: 'order_id' },
  { table: 'shipments', key: 'order_id' },
  { table: 'financial_records', key: 'order_id' },
  { table: 'stock_reservations', key: 'order_id' },
  { table: 'risk_assessments', key: 'order_id' },
  { table: 'change_requests', key: 'order_id' },
  { table: 'sample_submissions', key: 'order_id' },
  // ⚠️ ĐÃ ĐO TRÊN CSDL ĐANG CHẠY: hai bảng này KHÔNG có cột order_id.
  //   communications → context_id (kênh hội thoại, migration 019)
  //   md_documents   → entity_id  (gắn linh hoạt nhiều loại thực thể)
  // Lọc nhầm cột thì bộ lọc phía máy chủ không khớp gì và kênh im lặng hoàn
  // toàn — không lỗi, không sự kiện, nhìn y hệt "chưa ai sửa gì". Đây là loại
  // hỏng tệ nhất vì không có triệu chứng nào để lần ra.
  { table: 'communications', key: 'context_id' },
  { table: 'md_documents', key: 'entity_id' },
];

const QUIET_MS = 800;

export interface PoRealtime {
  /** Tăng mỗi khi có thay đổi liên quan tới PO này — dùng làm dependency để
   *  gọi lại service. */
  revision: number;
  /** Kênh đã nối được chưa. Hiện ra để người dùng biết số liệu có đang sống
   *  hay không, thay vì tưởng realtime chạy trong khi websocket đã rớt. */
  live: boolean;
}

export function usePoRealtime(poId: string | null): PoRealtime {
  const [revision, setRevision] = useState(0);
  const [live, setLive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!poId) return;
    const sb = createClient();
    const ch = sb.channel(`po-twin-${poId}`);

    const bump = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setRevision((r) => r + 1), QUIET_MS);
    };

    // Lọc phía máy chủ theo đúng cột khoá của TỪNG bảng, để không nhận sự kiện
    // của 9.999 PO khác — mạng ở xưởng không gánh nổi lượng đó.
    for (const { table, key } of WATCHED) {
      ch.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `${key}=eq.${poId}` },
        bump,
      );
    }

    ch.subscribe((status) => setLive(status === 'SUBSCRIBED'));

    return () => {
      if (timer.current) clearTimeout(timer.current);
      setLive(false);
      void sb.removeChannel(ch);
    };
  }, [poId]);

  return { revision, live };
}
