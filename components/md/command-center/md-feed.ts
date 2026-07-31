'use client';

import {
  AlertOctagon, Boxes, CalendarClock, ClipboardList, FileQuestion, ListTodo,
  Package, ShieldAlert, ShoppingCart, Shirt, TriangleAlert,
} from 'lucide-react';
import type { ElementType } from 'react';

import type {
  CommandCenterData, TaskKind, AlertKind,
} from '@/app/(dashboard)/md/_services/command-center.service';
import type { MdDashboardData } from '@/app/(dashboard)/md/_services/dashboard.service';
import type { BizDomain } from '@/components/md/semantic-tone';
import type { MosTask, MosKpi, MosAlert } from '@/lib/mos/command-center.contract';

// ============================================================================
// CHUYỂN DỮ LIỆU MERCHANDISER SANG HỢP ĐỒNG CHUNG
//
// Cùng vai trò với components/warehouse/command-center/wh-feed.ts. Service ở
// máy chủ giữ NGUYÊN, không sửa một dòng — lớp chuyển đổi mỏng ở client gắn
// icon, màu và hành động.
// ============================================================================

const TASK_META: Record<TaskKind, { icon: ElementType; domain: BizDomain; label: string }> = {
  MILESTONE: { icon: CalendarClock, domain: 'PLANNING', label: 'Tiến độ' },
  MATERIAL: { icon: Package, domain: 'MATERIAL', label: 'Nguyên phụ liệu' },
  SAMPLE: { icon: Shirt, domain: 'SAMPLE', label: 'Hàng mẫu' },
  CHANGE: { icon: ClipboardList, domain: 'QUALITY', label: 'Thay đổi' },
  COMMENT: { icon: ListTodo, domain: 'SHIPPING', label: 'Được giao' },
};

const ALERT_META: Record<AlertKind, { icon: ElementType; domain: BizDomain; label: string }> = {
  SCHEDULE: { icon: CalendarClock, domain: 'PLANNING', label: 'Tiến độ' },
  MATERIAL: { icon: Package, domain: 'MATERIAL', label: 'Nguyên phụ liệu' },
  QUALITY: { icon: ShieldAlert, domain: 'QUALITY', label: 'Chất lượng' },
  RISK: { icon: AlertOctagon, domain: 'QUALITY', label: 'Rủi ro' },
};

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const dash = (n: number | null) => (n === null ? '—' : nf.format(n));

export type MdKpiTarget = 'po' | 'materials' | 'risks' | 'rfq' | 'changes';

/** Merchandiser nói "Trễ N ngày" — ở đây mọi việc đều có hạn rõ ràng, khác Kho
 *  nơi một phiếu có thể chỉ đang tồn chứ chưa quá hạn. */
export const MD_URGENCY = {
  overdue: (d: number) => `Trễ ${d} ngày`,
  today: 'Tới hạn hôm nay',
};

export function mdTasks(
  cc: CommandCenterData,
  openPo: (orderId: string, poNumber: string) => void,
): MosTask[] {
  return cc.tasks.map((t) => {
    const m = TASK_META[t.kind];
    const clickable = Boolean(t.orderId && t.poNumber);
    return {
      id: t.id,
      title: t.title,
      // Ngày tới hạn ghép vào phụ đề: hợp đồng chung không có ô riêng cho nó,
      // mà bỏ hẳn thì mất thông tin so với bản cũ.
      subtitle: t.dueDate ? `${t.subtitle} · ${fmtDate(t.dueDate)}` : t.subtitle,
      ref: t.poNumber,
      urgencyDays: t.overdueDays,
      domain: m.domain,
      icon: m.icon,
      kindLabel: m.label,
      onOpen: clickable ? () => openPo(t.orderId as string, t.poNumber as string) : undefined,
    };
  });
}

export function mdKpis(data: MdDashboardData, go: (t: MdKpiTarget) => void): MosKpi[] {
  const k = data.kpi;
  return [
    {
      id: 'running', tone: 'blue', icon: ShoppingCart, label: 'Đơn đang chạy',
      value: dash(k.runningOrders),
      sub: k.runningQuantity === null ? 'chưa đọc được số lượng' : `${nf.format(k.runningQuantity)} sản phẩm`,
      goLabel: 'Mở tab Đơn hàng', onGo: () => go('po'),
    },
    {
      id: 'late', tone: 'rose', icon: CalendarClock, label: 'Mốc T&A trễ',
      value: dash(k.lateMilestones),
      sub: k.ordersWithLate === null ? 'chưa đọc được' : `thuộc ${nf.format(k.ordersWithLate)} đơn hàng`,
      goLabel: 'Mở tab Đơn hàng để xử lý', onGo: () => go('po'),
    },
    {
      id: 'material', tone: 'amber', icon: Boxes, label: 'NPL chưa về kho',
      value: dash(k.pendingMaterials), sub: 'đề nghị mua chưa nhận hàng',
      goLabel: 'Mở tab Vật tư', onGo: () => go('materials'),
    },
    {
      id: 'risk', tone: 'red', icon: TriangleAlert, label: 'Đơn rủi ro cao',
      value: dash(k.criticalRisks), sub: 'mức Cao và Nguy kịch',
      goLabel: 'Mở tab Rủi ro', onGo: () => go('risks'),
    },
    {
      id: 'rfq', tone: 'emerald', icon: FileQuestion, label: 'Yêu cầu báo giá mở',
      value: dash(k.openInquiries), sub: 'chưa chốt thắng hay thua',
      goLabel: 'Mở tab Yêu cầu báo giá', onGo: () => go('rfq'),
    },
    {
      id: 'change', tone: 'slate', icon: ClipboardList, label: 'Thay đổi chờ duyệt',
      value: dash(k.openChangeRequests), sub: 'cần một quyết định',
      goLabel: 'Mở tab Yêu cầu thay đổi', onGo: () => go('changes'),
    },
  ];
}

export function mdAlerts(
  cc: CommandCenterData,
  openPo: (orderId: string, poNumber: string) => void,
): MosAlert[] {
  return cc.alerts.map((a) => {
    const m = ALERT_META[a.kind];
    const clickable = Boolean(a.orderId && a.poNumber);
    return {
      id: a.id,
      title: a.title,
      detail: a.poNumber ? `${a.poNumber} · ${a.detail}` : a.detail,
      metric: a.metric,
      domain: m.domain,
      icon: m.icon,
      kindLabel: m.label,
      onOpen: clickable ? () => openPo(a.orderId as string, a.poNumber as string) : undefined,
    };
  });
}

function fmtDate(v: string): string {
  const [y, m, d] = v.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export const MD_WATCHING_HINT =
  'Hệ thống đang theo dõi: mốc đường găng trễ từ 3 ngày, NPL trễ từ 3 ngày, tỷ lệ lỗi từ 5%, ' +
  'và đơn ở mức Nguy kịch.';

export const MD_TASK_EMPTY_HINT =
  'Việc ở đây gom tự động từ mốc T&A, mẫu chờ phản hồi, NPL quá hạn, thảo luận được giao ' +
  'và yêu cầu thay đổi chờ duyệt.';
