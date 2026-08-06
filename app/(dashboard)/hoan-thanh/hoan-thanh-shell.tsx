'use client';

import { useMemo } from 'react';
import { ClipboardCheck, PackageCheck, Ship } from 'lucide-react';

import WorkspaceShell from '@/components/workspace/workspace-shell';
import type { KpiItem, QuickAction } from '@/components/workspace/blocks';
import type { WorkItem } from '@/lib/mos/workspace/work-item';
import { hoanThanhFeed } from '@/components/finishing/command-center/hoan-thanh-feed';
import { HOAN_THANH_NEO } from '@/lib/mos/workspace/hoan-thanh-work-items';
import { useLanguage } from '@/lib/i18n';

// ============================================================================
// LỚP NỐI MỎNG — Finishing Workspace *(Blueprint tầng ④ ⊕ ⑤)*
//
// Cùng khuôn `may-shell.tsx`: máy chủ trả **dữ liệu thuần mang khoá**, ở đây
// khoá thành **câu chữ** và gắn icon · tông màu · hành động.
//
// ⚠️ `children` vẫn do **Server Component dựng** rồi truyền vào, nên
// `createFinishingLog` và `createCarton` giữ nguyên là Server Action gắn thẳng
// vào `<form action>`. Đổi bố cục mà ⛔ **không đụng một dòng nào** của phần
// ghi dữ liệu — đó là điều kiện để lượt này ⛔ không chạm Permission Model.
// ============================================================================

/** ⚠️ Cả ba đều trỏ tới nơi **đang tồn tại**: hai neo trong trang và một route
 *  đang chạy. ⛔ Không thêm mục nào chỉ để dải trông đầy. */
const VIEC_NHANH_HOAN_THANH: readonly QuickAction[] = [
  { id: 'hoanThanh.ghi-qc', labelKey: 'hoanThanh.moGhiQc', icon: ClipboardCheck, href: HOAN_THANH_NEO.ghiQC },
  { id: 'hoanThanh.dong-thung', labelKey: 'hoanThanh.moDongThung', icon: PackageCheck, href: HOAN_THANH_NEO.dongThung },
  // Nơi thùng ĐI TIẾP. Tổ hoàn thành là **khâu cuối trong xưởng**, nên lối ra
  // của nó là Shipment — ⛔ không phải một màn hình khác của chính nó.
  { id: 'hoanThanh.xuat-hang', labelKey: 'appShort.shipment', icon: Ship, href: '/xuat-hang' },
];

export default function HoanThanhShell({
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

  // `useMemo` — `hoanThanhFeed` sinh **hàm mới** cho mỗi `onGo`/`onOpen`. ⛔
  // Không ghi nhớ thì mỗi lần vẽ lại, khối MOS coi đó là **prop đã đổi** và vẽ
  // lại toàn bộ danh sách việc.
  const feed = useMemo(() => hoanThanhFeed({ viec, kpi }, t), [viec, kpi, t]);

  return (
    <WorkspaceShell
      moduleKey="production"
      // Tên hiến định — ⛔ KHÔNG dịch *(§45.3)*.
      tenModule="Finishing Leader"
      moTaKey="appDesc.finishingLeader"
      feed={feed}
      loi={loi}
      hanhDongNhanh={VIEC_NHANH_HOAN_THANH}
      // Xếp dọc: tổ trưởng hoàn thành mở màn hình **vài lần mỗi ca**, ⛔ không
      // phải hàng chục lần như thủ kho. Khối thưa đọc dễ hơn ba cột chật.
      bocCuc="doc"
    >
      {children}
    </WorkspaceShell>
  );
}
