import { PackageCheck, AlertTriangle, CircleAlert, CheckCircle2, ShieldAlert, Boxes } from 'lucide-react';

import type { MosFeed, MosTask, MosKpi, MosTone } from '@/lib/mos/command-center.contract';
import type { WorkItem, WorkItemSeverity } from '@/lib/mos/workspace/work-item';
import type { KpiItem } from '@/components/workspace/blocks';
import type { DictionaryKey } from '@/lib/i18n';

// ============================================================================
// FEED ADAPTER — TỔ HOÀN THÀNH · Blueprint hợp nhất
//
//   Command Center *(server)*  →  Feed Adapter *(client)*  →  khối MOS dùng chung
//        dữ liệu THUẦN + KHOÁ        gắn icon · màu · hành động · DỊCH
//
// `icon` là **component React** và `onGo` là **hàm** — cả hai ⛔ **không tuần
// tự hoá được** qua ranh giới Server → Client. Vì vậy máy chủ chỉ trả **dữ liệu
// thuần mang KHOÁ i18n**; việc gắn icon, tông màu, hành động và **dịch câu chữ**
// là việc của tệp này.
// ============================================================================

const TONE_THEO_TRANG_THAI: Record<'healthy' | 'warning' | 'critical', MosTone> = {
  healthy: 'emerald',
  warning: 'amber',
  critical: 'red',
};

const ICON_THEO_MUC: Record<WorkItemSeverity, typeof CircleAlert> = {
  CRITICAL: CircleAlert,
  WARNING: AlertTriangle,
  INFO: CheckCircle2,
};

/** ⚠️ ⛔ Không đặt `0` cho `INFO`: khung diễn đạt `0` thành *"đến hạn hôm nay"*,
 *  mà một dòng trấn an thì ⛔ không đến hạn gì cả. */
const KHAN_THEO_MUC: Record<WorkItemSeverity, number> = {
  CRITICAL: 2,
  WARNING: 1,
  INFO: -1,
};

/**
 * Điều hướng.
 *
 * ⚠️ Khác `may-feed.ts` một chỗ **có lý do**: neo của tổ hoàn thành mang **cả
 * `?tab=`** *(xem `HOAN_THANH_NEO`)*, tức đây là **điều hướng thật**, ⛔ không
 * phải nhảy trong trang. Dùng `assign`, ⛔ không `replace`: đổi tab **là** một
 * bước đi, và người dùng phải **quay lại được** bằng nút Back.
 */
function di(dich: string): () => void {
  return () => {
    if (typeof window !== 'undefined') window.location.assign(dich);
  };
}

export interface HoanThanhFeedVao {
  viec: readonly WorkItem[];
  kpi: readonly KpiItem[];
}

/** `t` truyền vào thay vì gọi `useLanguage()` ở đây — nhờ vậy hàm này là **hàm
 *  thuần** và kiểm được ⛔ không cần dựng React. */
export function hoanThanhFeed(
  vao: HoanThanhFeedVao,
  t: (k: DictionaryKey, vars?: Record<string, string | number>) => string,
): MosFeed {
  const tasks: MosTask[] = vao.viec.map((v) => ({
    id: v.id,
    title: t(v.labelKey as DictionaryKey, v.vars),
    // ⚠️ Để **chuỗi rỗng**, ⛔ KHÔNG lặp lại `title` — lặp lại làm dòng việc dày
    // gấp đôi mà ⛔ không thêm chữ nào có nghĩa.
    subtitle: '',
    urgencyDays: KHAN_THEO_MUC[v.severity],
    domain: 'PLANNING',
    // Việc *"đóng vượt đơn"* nhận icon RIÊNG: nó ⛔ không cùng loại với các việc
    // nhịp sản xuất khác — nó nói về hàng đã rời nhà máy.
    icon: v.id === 'hoanThanh.dong-vuot-po' ? ShieldAlert : ICON_THEO_MUC[v.severity],
    kindLabel: t(`workspace.severity.${v.severity}` as DictionaryKey),
    // `P33` — việc CÓ nơi xử lý mới bấm được. Việc `INFO` ⛔ không có `href`.
    ...(v.href ? { onOpen: di(v.href) } : {}),
  }));

  const kpis: MosKpi[] = vao.kpi.map((k) => ({
    id: k.id,
    label: t(k.labelKey),
    value: k.donVi ? `${k.giaTri} ${k.donVi}` : k.giaTri,
    // ① BẰNG CHỨNG — `P36`. Rỗng thì để rỗng, ⛔ không bịa một câu cho đầy ô.
    sub: k.nguonKey ? t(k.nguonKey, k.nguonVars) : '',
    // ③ KHUYẾN NGHỊ — `P38`. Chỉ có khi Command Center tìm được **nguyên nhân
    // có tên**; ⛔ không có thì trường này vắng mặt hẳn.
    ...(k.khuyenNghiKey ? { recommendation: t(k.khuyenNghiKey, k.khuyenNghiVars) } : {}),
    tone: k.trangThai ? TONE_THEO_TRANG_THAI[k.trangThai] : 'slate',
    icon: k.id === 'thung-tai-xuong' ? Boxes : PackageCheck,
    // ④ HÀNH ĐỘNG — `P39` `P40`. Nhãn nói **đi đâu**, ⛔ không nói *"xem thêm"*.
    goLabel: t(k.hanhDongKey ?? 'workspace.drillDown'),
    ...(k.href ? { onGo: di(k.href) } : {}),
  }));

  // ⚠️ Tổ hoàn thành ⛔ **chưa có** nguồn cảnh báo riêng — mọi phán đoán đang
  // nằm ở hộp thư việc. Trả **mảng rỗng**, ⛔ KHÔNG nhân bản việc sang thành
  // cảnh báo cho ô đỡ trống: một cảnh báo trùng một việc là **hai lần nhắc cùng
  // một chuyện**, và người dùng sẽ học cách bỏ qua cả hai.
  return { tasks, kpis, alerts: [] };
}
