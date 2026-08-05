'use client';

import { useMemo } from 'react';
import { Factory, PackageSearch } from 'lucide-react';

import WorkspaceShell from '@/components/workspace/workspace-shell';
import type { KpiItem, QuickAction } from '@/components/workspace/blocks';
import type { WorkItem } from '@/lib/mos/workspace/work-item';
import { mayFeed } from '@/components/sewing/command-center/may-feed';
import { MAY_NEO } from '@/lib/mos/workspace/may-work-items';
import { useLanguage } from '@/lib/i18n';

// ============================================================================
// LỚP NỐI MỎNG — Sewing Workspace *(Blueprint tầng ④ ⊕ ⑤)*
//
// Cùng khuôn `qa-shell.tsx`: máy chủ trả **dữ liệu thuần mang khoá**, ở đây
// khoá thành **câu chữ** và gắn icon · tông màu · hành động — ba thứ ⛔ **không
// tuần tự hoá được** qua ranh giới Server → Client.
//
// ⚠️ `children` vẫn do **Server Component dựng** rồi truyền vào, nên
// `createHourlyProductionLog` giữ nguyên là Server Action gắn thẳng vào `<form action>`.
// Đổi bố cục mà ⛔ **không đụng một dòng nào** của phần ghi dữ liệu.
// ============================================================================

/** ⚠️ Cả hai đều trỏ tới nơi **đang tồn tại**: một neo trong trang và một route
 *  đang chạy. ⛔ Không thêm mục nào chỉ để dải trông đầy. */
const VIEC_NHANH_MAY: readonly QuickAction[] = [
    { id: 'may.ghi-san-luong', labelKey: 'may.ghiSanLuong', icon: Factory, href: MAY_NEO.ghiSanLuong },
  { id: 'may.gia-cong', labelKey: 'appShort.subcontract', icon: PackageSearch, href: '/subcon' },
];

export default function MayShell({
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

  // `useMemo` — `mayFeed` sinh **hàm mới** cho mỗi `onGo`/`onOpen`. ⛔ Không ghi
  // nhớ thì mỗi lần vẽ lại, khối MOS coi đó là **prop đã đổi** và vẽ lại toàn
  // bộ danh sách việc.
  const feed = useMemo(() => mayFeed({ viec, kpi }, t), [viec, kpi, t]);

  return (
    <WorkspaceShell
      moduleKey="production"
      // Tên hiến định — ⛔ KHÔNG dịch *(§45.3)*.
      tenModule="Production"
      moTaKey="appDesc.production"
      feed={feed}
      loi={loi}
      hanhDongNhanh={VIEC_NHANH_MAY}
      // Xếp dọc: tổ trưởng may mở màn hình **vài lần mỗi ca**, ⛔ không phải hàng chục
      // lần như thủ kho. Khối thưa đọc dễ hơn ba cột chật.
      bocCuc="doc"
    >
      {children}
    </WorkspaceShell>
  );
}
