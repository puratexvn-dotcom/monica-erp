'use client';

import { useMemo } from 'react';
import { Scissors, PackageSearch } from 'lucide-react';

import WorkspaceShell from '@/components/workspace/workspace-shell';
import type { KpiItem, QuickAction } from '@/components/workspace/blocks';
import type { WorkItem } from '@/lib/mos/workspace/work-item';
import { catFeed } from '@/components/cutting/command-center/cat-feed';
import { CAT_NEO } from '@/lib/mos/workspace/cat-work-items';
import { useLanguage } from '@/lib/i18n';

// ============================================================================
// LỚP NỐI MỎNG — Cutting Workspace *(Blueprint tầng ④ ⊕ ⑤)*
//
// Cùng khuôn `qa-shell.tsx`: máy chủ trả **dữ liệu thuần mang khoá**, ở đây
// khoá thành **câu chữ** và gắn icon · tông màu · hành động — ba thứ ⛔ **không
// tuần tự hoá được** qua ranh giới Server → Client.
//
// ⚠️ `children` vẫn do **Server Component dựng** rồi truyền vào, nên
// `createCutTicket` giữ nguyên là Server Action gắn thẳng vào `<form action>`.
// Đổi bố cục mà ⛔ **không đụng một dòng nào** của phần ghi dữ liệu.
// ============================================================================

/** ⚠️ Cả hai đều trỏ tới nơi **đang tồn tại**: một neo trong trang và một route
 *  đang chạy. ⛔ Không thêm mục nào chỉ để dải trông đầy. */
const VIEC_NHANH_CAT: readonly QuickAction[] = [
  { id: 'cat.lap-phieu', labelKey: 'cat.lapPhieu', icon: Scissors, href: CAT_NEO.lapPhieu },
  { id: 'cat.don-hang', labelKey: 'appShort.commercial', icon: PackageSearch, href: '/orders' },
];

export default function CatShell({
  viec,
  kpi,
  loi,
  children,
}: {
  viec: readonly WorkItem[];
  kpi: readonly KpiItem[];
  loi?: string | null;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();

  // `useMemo` — `catFeed` sinh **hàm mới** cho mỗi `onGo`/`onOpen`. ⛔ Không ghi
  // nhớ thì mỗi lần vẽ lại, khối MOS coi đó là **prop đã đổi** và vẽ lại toàn
  // bộ danh sách việc.
  const feed = useMemo(() => catFeed({ viec, kpi }, t), [viec, kpi, t]);

  return (
    <WorkspaceShell
      moduleKey="production"
      // Tên hiến định — ⛔ KHÔNG dịch *(§45.3)*.
      tenModule="Production"
      moTaKey="appDesc.production"
      feed={feed}
      loi={loi}
      hanhDongNhanh={VIEC_NHANH_CAT}
      // Xếp dọc: tổ cắt mở màn hình **vài lần mỗi ca**, ⛔ không phải hàng chục
      // lần như thủ kho. Khối thưa đọc dễ hơn ba cột chật.
      bocCuc="doc"
    >
      {children}
    </WorkspaceShell>
  );
}
