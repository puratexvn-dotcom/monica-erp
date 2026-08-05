'use client';

import {
  AlertOctagon, ArrowDownToLine, ArrowUpFromLine, Boxes, ClipboardCheck, Clock,
  Layers, Lock, MapPinOff, PackageCheck, PackageX, ScanLine, ShieldX, Snowflake, Truck,
} from 'lucide-react';
import type { ElementType } from 'react';

import type {
  WhCommandCenter, WhTaskKind, WhAlertKind,
} from '@/app/(dashboard)/kho/_services/command-center.service';
import type { BizDomain } from '@/components/md/semantic-tone';
import type { MosTask, MosKpi, MosAlert } from '@/lib/mos/command-center.contract';

// ============================================================================
// CHUYỂN DỮ LIỆU KHO SANG HỢP ĐỒNG CHUNG
//
// ─── VÌ SAO HÀM NÀY CHẠY Ở CLIENT ─────────────────────────────────────────
// Nó gắn icon (tham chiếu component) và hàm xử lý vào từng dòng — hai thứ
// KHÔNG serialize được qua ranh giới server/client. Service ở máy chủ chỉ trả
// dữ liệu thuần; ý nghĩa hiển thị gắn ở đây.
//
// ─── VÌ SAO KHÔNG SỬA SERVICE ─────────────────────────────────────────────
// Service đang chạy đúng và đã được kiểm chứng. Đổi nó nghĩa là phải kiểm lại
// từ đầu. Lớp chuyển đổi mỏng ở đây rẻ hơn nhiều và không chạm vào truy vấn.
// ============================================================================

const TASK_META: Record<WhTaskKind, { icon: ElementType; domain: BizDomain; label: string }> = {
  RECEIVE: { icon: Truck, domain: 'SHIPPING', label: 'Nhận hàng' },
  INSPECT: { icon: ClipboardCheck, domain: 'QUALITY', label: 'Kiểm QA' },
  PICK: { icon: PackageCheck, domain: 'MATERIAL', label: 'Soạn hàng' },
  COUNT: { icon: ScanLine, domain: 'PLANNING', label: 'Kiểm kê' },
};

const ALERT_META: Record<WhAlertKind, { icon: ElementType; domain: BizDomain; label: string }> = {
  SHORTAGE: { icon: PackageX, domain: 'QUALITY', label: 'Thiếu hụt' },
  LATE_ARRIVAL: { icon: Clock, domain: 'PLANNING', label: 'Hàng về trễ' },
  QA_FAIL: { icon: ShieldX, domain: 'QUALITY', label: 'Rớt QA' },
  NO_LOCATION: { icon: MapPinOff, domain: 'SHIPPING', label: 'Sai vị trí' },
  SLOW_MOVING: { icon: Snowflake, domain: 'MATERIAL', label: 'Tồn đọng' },
};

/** Kho nói "Tồn N ngày" chứ không nói "Trễ N ngày": một phiếu nhập nằm ở khâu
 *  kiểm bốn ngày thì chưa hẳn là trễ hạn, nhưng vẫn là bốn ngày chuyền may có
 *  thể đang chờ vải. */
export const WH_URGENCY = {
  overdue: (d: number) => `Tồn ${d} ngày`,
  today: 'Hôm nay',
};

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nf3 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
const dash = (n: number | null) => (n === null ? '—' : nf3.format(n));

export type WhTabTarget =
  | 'stock' | 'inbound' | 'inspect' | 'reserve' | 'outbound' | 'count' | 'risk';

export function whTasks(cc: WhCommandCenter, go: (t: WhTabTarget) => void): MosTask[] {
  const TAB: Record<WhTaskKind, WhTabTarget> = {
    RECEIVE: 'inbound', INSPECT: 'inspect', PICK: 'outbound', COUNT: 'count',
  };
  return cc.tasks.map((t) => {
    const m = TASK_META[t.kind];
    return {
      id: t.id,
      title: t.title,
      subtitle: t.subtitle,
      ref: t.refNo,
      urgencyDays: t.ageDays,
      domain: m.domain,
      icon: m.icon,
      kindLabel: m.label,
      onOpen: () => go(TAB[t.kind]),
    };
  });
}

export function whKpis(cc: WhCommandCenter, go: (t: WhTabTarget) => void): MosKpi[] {
  const k = cc.kpi;
  return [
    {
      id: 'onhand', tone: 'blue', icon: Boxes, label: 'Tổng tồn kho',
      value: dash(k.totalOnHand),
      sub: k.skuCount === null ? 'chưa đọc được' : `${nf.format(k.skuCount)} mã vật tư`,
      goLabel: 'Mở bảng tồn kho', onGo: () => go('stock'),
    },
    {
      id: 'value', tone: 'emerald', icon: ArrowDownToLine, label: `Giá trị kho (${k.currency})`,
      // P38 — KHUYEN NGHI phai chi ra NGUYEN NHAN CO TEN.
      //
      // Gia tri kho chi dung khi MOI ma vat tu deu co don gia. Con ma chua co
      // gia thi con so nay THIEU, va nguoi doc ⛔ khong the biet thieu bao nhieu.
      // Cau nay noi ro CON BAO NHIEU MA chua co gia — do la mot nguyen nhan co
      // ten, du de biet DI DAU.
      //
      // ⚠️ Chi gan khi THAT SU co ma thieu gia. ⛔ Khong bia mot khuyen nghi de
      // lap cho trong: khuyen nghi sai gui nguoi van hanh DI NHAM CHO, va lan
      // sau ho thoi tin khuyen nghi — ke ca nhung lan dung.
      ...(k.unvaluedCount > 0
        ? { recommendation: `${nf.format(k.unvaluedCount)} mã chưa có đơn giá — bổ sung giá để con số này đủ.` }
        : {}),
      value: k.totalValue === null ? '—' : nf.format(k.totalValue),
      sub: k.totalValue === null
        ? `${k.unvaluedCount} dòng đều chưa có đơn giá`
        : k.unvaluedCount > 0
          ? `chưa gồm ${k.unvaluedCount} dòng thiếu đơn giá`
          : `từ toàn bộ ${k.valuedCount} dòng tồn`,
      goLabel: 'Mở bảng tồn kho', onGo: () => go('stock'),
    },
    {
      id: 'available', tone: 'emerald', icon: Layers, label: 'Có sẵn',
      value: dash(k.totalAvailable), sub: 'lấy được ngay, đã trừ giữ chỗ',
      goLabel: 'Mở bảng tồn kho', onGo: () => go('stock'),
    },
    {
      id: 'reserved', tone: 'purple', icon: Lock, label: 'Đã giữ chỗ',
      value: dash(k.totalReserved), sub: 'còn trong kho nhưng đã có chủ',
      goLabel: 'Mở tab Giữ chỗ', onGo: () => go('reserve'),
    },
    {
      id: 'transit', tone: 'amber', icon: Truck, label: 'Đang đi đường',
      value: dash(k.inTransitQty), sub: 'đã đặt mua, chưa nhận đủ',
      goLabel: 'Mở tab Nhập hàng', onGo: () => go('inbound'),
    },
    {
      id: 'today', tone: 'slate', icon: ArrowUpFromLine, label: 'Nhập / xuất hôm nay',
      value: `${dash(k.receivedToday)} / ${dash(k.issuedToday)}`,
      sub: 'nhận vào / cấp ra trong ngày',
      goLabel: 'Mở tab Nhập hàng', onGo: () => go('inbound'),
    },
  ];
}

export function whAlerts(cc: WhCommandCenter, go: (t: WhTabTarget) => void): MosAlert[] {
  const TAB: Record<WhAlertKind, WhTabTarget> = {
    SHORTAGE: 'stock', LATE_ARRIVAL: 'inbound', QA_FAIL: 'inspect',
    NO_LOCATION: 'stock', SLOW_MOVING: 'stock',
  };
  return cc.alerts.map((a) => {
    const m = ALERT_META[a.kind] ?? { icon: AlertOctagon, domain: 'QUALITY' as BizDomain, label: 'Cảnh báo' };
    return {
      id: a.id,
      title: a.title,
      detail: a.detail,
      metric: a.metric,
      domain: m.domain,
      icon: m.icon,
      kindLabel: m.label,
      onOpen: () => go(TAB[a.kind] ?? 'risk'),
    };
  });
}

export const WH_WATCHING_HINT =
  'Đang theo dõi: thiếu hụt dưới mức tối thiểu · hàng về trễ từ 3 ngày · cuộn rớt QA · ' +
  'hàng chưa xếp vị trí · tồn đọng quá 90 ngày.';

export const WH_TASK_EMPTY_HINT =
  'Việc ở đây gom tự động từ phiếu nhập chờ nhận, lô chờ kiểm QA, lệnh xuất chờ soạn hàng ' +
  'và phiếu kiểm kê còn mở.';
