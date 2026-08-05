import { ClipboardCheck, AlertTriangle, CircleAlert, CheckCircle2, Gauge } from 'lucide-react';

import type { MosFeed, MosTask, MosKpi, MosTone } from '@/lib/mos/command-center.contract';
import type { WorkItem, WorkItemSeverity } from '@/lib/mos/workspace/work-item';
import type { KpiItem } from '@/components/workspace/blocks';
import type { DictionaryKey } from '@/lib/i18n';

// ============================================================================
// FEED ADAPTER — QA · Blueprint hợp nhất *(Board Directive 05/08/2026)*
//
// ═══ TẦNG NÀY LÀM GÌ, VÀ VÌ SAO NÓ PHẢI CHẠY Ở CLIENT ══════════════════
// Blueprint chính thức:
//
//   Command Center *(server)*  →  Feed Adapter *(client)*  →  khối MOS dùng chung
//        dữ liệu THUẦN + KHOÁ        gắn icon · màu · hành động · DỊCH
//
// `icon` là **component React** và `onGo` là **hàm** — cả hai ⛔ **không tuần
// tự hoá được** qua ranh giới Server → Client. Vì vậy máy chủ chỉ trả **dữ
// liệu thuần mang KHOÁ i18n**; việc gắn icon, tông màu, hành động và **dịch
// câu chữ** là việc của tệp này.
//
// 🔑 Nhờ vậy khối MOS **⛔ không biết gì về QA** — nó ⛔ không có bảng tra
//    *"loại việc nào thì icon nào"*. Thêm phân hệ thứ mười ⛔ không phải sửa
//    một dòng nào của khung.
//
// ⚠️ Đây **⛔ không** phải ánh xạ hai lần. `WorkItem`/`KpiItem` là hình dạng
// **thuần, mang khoá** ở phía máy chủ; `MosTask`/`MosKpi` là hình dạng **trình
// bày** ở phía client. Hai tầng, hai nhiệm vụ — đúng khuôn Blueprint.
// ============================================================================

/** Mức khẩn → tông màu ô chỉ số. ⚠️ `MosTone` nói về **TRẠNG THÁI**, ⛔ không
 *  nói về nhóm nghiệp vụ — nên nó ánh xạ từ `severity`, ⛔ không từ Domain. */
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

/**
 * `urgencyDays` của khung là **một khái niệm duy nhất**: càng lớn càng gấp.
 *
 * QA ⛔ **không** đo mức khẩn bằng ngày — nó đo bằng **mức nghiêm trọng**. Quy
 * đổi thẳng thành thang số để khung sắp xếp được, và **thứ tự phải khớp** với
 * thứ tự mà `chieuViec()` đã xếp *(`WI-1`)*.
 *
 * ⚠️ ⛔ Không đặt `0` cho `INFO`: khung diễn đạt `0` thành *"đến hạn hôm nay"*,
 * mà một dòng trấn an thì ⛔ không đến hạn gì cả. Số **âm** đọc ra là *"còn
 * hạn"* — đúng nghĩa hơn.
 */
const KHAN_THEO_MUC: Record<WorkItemSeverity, number> = {
  CRITICAL: 2,
  WARNING: 1,
  INFO: -1,
};

/** Đưa người dùng tới neo trong trang. ⚠️ Dùng `replace`, ⛔ không `push`: neo
 *  trong cùng trang ⛔ không đáng chiếm một mục trong lịch sử trình duyệt —
 *  bấm *"quay lại"* sau đó phải về **trang trước**, ⛔ không phải về **đầu
 *  trang này**. */
function nhay(neo: string): () => void {
  return () => {
    if (typeof window !== 'undefined') window.location.replace(neo);
  };
}

export interface QaFeedVao {
  viec: readonly WorkItem[];
  kpi: readonly KpiItem[];
}

/** `t` truyền vào thay vì gọi `useLanguage()` ở đây — nhờ vậy hàm này là **hàm
 *  thuần** và kiểm được ⛔ không cần dựng React. */
export function qaFeed(
  vao: QaFeedVao,
  t: (k: DictionaryKey, vars?: Record<string, string | number>) => string,
): MosFeed {
  const tasks: MosTask[] = vao.viec.map((v) => ({
    id: v.id,
    title: t(v.labelKey as DictionaryKey, v.vars),
    // ⚠️ QA ⛔ chưa có câu phụ riêng cho từng việc. Để **chuỗi rỗng**, ⛔ KHÔNG
    // lặp lại `title` — lặp lại làm dòng việc dày gấp đôi mà ⛔ không thêm chữ
    // nào có nghĩa.
    subtitle: '',
    urgencyDays: KHAN_THEO_MUC[v.severity],
    domain: 'QUALITY',
    icon: ICON_THEO_MUC[v.severity],
    kindLabel: t(`workspace.severity.${v.severity}` as DictionaryKey),
    // `P33` — việc CÓ nơi xử lý mới bấm được. Việc `INFO` ⛔ không có `href`
    // nên nó ⛔ không nhận `onOpen`, và khung sẽ ⛔ không hiện con trỏ bàn tay.
    ...(v.href ? { onOpen: nhay(v.href) } : {}),
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
    icon: k.id === 'ty-le' ? Gauge : ClipboardCheck,
    // ④ HÀNH ĐỘNG — `P39` `P40`. Nhãn nói **đi đâu**, ⛔ không nói *"xem thêm"*.
    goLabel: t(k.hanhDongKey ?? 'workspace.drillDown'),
    ...(k.href ? { onGo: nhay(k.href) } : {}),
  }));

  // ⚠️ QA ⛔ **chưa có** nguồn cảnh báo riêng — mọi phán đoán hiện nằm ở hộp
  // thư việc. Trả **mảng rỗng** và để khung hiện trạng thái rỗng thật, ⛔ KHÔNG
  // nhân bản việc sang thành cảnh báo cho ô đỡ trống. Một cảnh báo trùng với
  // một việc là **hai lần nhắc cùng một chuyện** — và người dùng sẽ học cách
  // bỏ qua cả hai.
  return { tasks, kpis, alerts: [] };
}
