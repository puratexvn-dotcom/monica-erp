import { Handshake, Users } from 'lucide-react';

import type { QuickAction } from '@/components/workspace/blocks';

// ============================================================================
// VIỆC LÀM NHANH — Merchandising
//
// ⚠️ Tách khỏi `md-client.tsx` vì **phép kiểm trần 900 dòng bắt được ngay** khi
// tôi thêm khối này vào đó *(903 dòng)*. Sửa bằng **CẤU TRÚC**, ⛔ không bằng
// cách nới trần — trần đó tồn tại để `md-client` ⛔ không phình thêm nữa, và
// `TD-39` *(tách `md-client`)* vẫn đang chờ.
//
// 🔑 Và chỗ này **đúng hơn** chỗ cũ: việc-làm-nhanh là **dữ liệu điều hướng**,
//    cùng họ với `md-feed.ts` — nó thuộc về Command Center, ⛔ không thuộc về
//    thân component.
//
// ⚠️ Cả hai đều trỏ tới route **đang chạy thật**. ⛔ Không thêm mục nào chỉ để
// dải trông đầy: một nút dẫn tới nơi ⛔ không tồn tại là *"lời nói dối của giao
// diện"*.
// ============================================================================

export const VIEC_NHANH_MD: readonly QuickAction[] = [
  { id: 'md.don-hang', labelKey: 'appShort.commercial', icon: Handshake, href: '/orders' },
  { id: 'md.gia-cong', labelKey: 'appShort.subcontract', icon: Users, href: '/subcon' },
];
