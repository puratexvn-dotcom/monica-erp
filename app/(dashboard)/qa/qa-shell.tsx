'use client';

import { ClipboardCheck, PackageSearch } from 'lucide-react';

import WorkspaceShell from '@/components/workspace/workspace-shell';
import type { KpiItem, QuickAction } from '@/components/workspace/blocks';
import type { WorkItem } from '@/lib/mos/workspace/work-item';

// ============================================================================
// LỚP NỐI MỎNG — QA Workspace
//
// ═══ VÌ SAO CẦN TỆP NÀY, THAY VÌ GỌI THẲNG `WorkspaceShell` TỪ `page.tsx` ══
// `QuickAction.icon` là một **component React**. Component ⛔ **không tuần tự
// hoá được** qua ranh giới Server → Client, nên danh sách việc-làm-nhanh phải
// được khai **ở phía client**.
//
// Đây đúng ràng buộc đã gặp ở `app/page.tsx` với `ModuleItem.icon`, và cách
// giải cũng giống: truyền **dữ liệu thuần** *(việc, KPI)* qua ranh giới, giữ
// **component** ở lại phía client.
//
// ⚠️ `children` vẫn được **Server Component dựng** rồi truyền vào — bảng nhật
// ký và biểu mẫu ghi phiếu ⛔ **không** phải chuyển sang client. Nhờ vậy
// `createQAReport` vẫn là Server Action gắn thẳng vào `<form action={…}>`, ⛔
// không phải viết lại thành lời gọi từ trình duyệt.
//
// 🔑 Đổi bố cục mà **⛔ không đụng một dòng nào** của phần ghi dữ liệu — đó là
//    toàn bộ lý do lớp nối này mỏng đến vậy.
// ============================================================================

/** Việc làm nhanh của QA.
 *
 *  ⚠️ Cả hai đều trỏ tới route **đang chạy thật**. ⛔ Không thêm mục nào chỉ
 *  để dải trông đầy — một nút dẫn tới nơi ⛔ không tồn tại là *"lời nói dối
 *  của giao diện"*, đúng thứ `ADR-022` vừa buộc phải nói thật. */
const VIEC_NHANH: readonly QuickAction[] = [
  { id: 'qa.ghi-phieu', labelKey: 'qa.ghiPhieu', icon: ClipboardCheck, href: '#ghi-phieu' },
  { id: 'qa.don-hang', labelKey: 'qa.xemDon', icon: PackageSearch, href: '/orders' },
];

export default function QaShell({
  viec,
  kpi,
  children,
}: {
  viec: readonly WorkItem[];
  kpi: readonly KpiItem[];
  children: React.ReactNode;
}) {
  return (
    <WorkspaceShell
      moduleKey="quality"
      // Tên hiến định — ⛔ KHÔNG dịch (§45.3), khớp đúng `home-modules.ts`.
      tenModule="Quality"
      moTaKey="appDesc.quality"
      viec={viec}
      kpi={kpi}
      hanhDongNhanh={VIEC_NHANH}
    >
      {children}
    </WorkspaceShell>
  );
}
