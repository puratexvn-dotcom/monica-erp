import type { ElementType } from 'react';

import type { BizDomain } from '@/components/md/semantic-tone';

// ============================================================================
// HỢP ĐỒNG CHUNG CHO COMMAND CENTER CỦA MỌI PHÂN HỆ
//
// ─── VÌ SAO CẦN HỢP ĐỒNG ───────────────────────────────────────────────────
// Merchandiser và Kho đang có HAI BẢN SAO gần giống nhau của cùng một bố cục
// ba cột. Làm thêm mười phân hệ nữa theo cách đó là mười bản sao — sửa một lỗi
// hiển thị phải sửa mười chỗ, và chắc chắn sẽ sót.
//
// Khung dùng chung nhận đúng ba mảng dưới đây. Mỗi phân hệ chỉ viết một hàm
// chuyển đổi từ dữ liệu nghiệp vụ của mình sang ba mảng này.
//
// ─── VÌ SAO ICON VÀ HÀM XỬ LÝ NẰM TRONG DỮ LIỆU ───────────────────────────
// Tham chiếu component và hàm KHÔNG serialize được qua ranh giới server/client.
// Vì vậy service ở máy chủ chỉ trả về dữ liệu thuần; việc gắn icon, màu và hành
// động là do hàm chuyển đổi CHẠY Ở CLIENT làm. Nhờ vậy khung không cần biết gì
// về nghiệp vụ cụ thể — nó không có bảng tra "loại việc nào thì icon nào".
//
// ─── VÌ SAO KHÔNG DÙNG LẠI KIỂU CỦA MD HAY KHO ────────────────────────────
// MD đo mức khẩn bằng `overdueDays` (trễ so với hạn), Kho đo bằng `ageDays`
// (tồn bao lâu ở khâu này). Hai khái niệm khác nhau nhưng cùng một ý: càng lớn
// càng gấp. Gộp thành `urgencyDays` để khung chỉ cần hiểu một khái niệm, còn
// cách diễn đạt thành lời thì mỗi phân hệ tự truyền vào.
// ============================================================================

export interface MosTask {
  id: string;
  /** Câu mệnh lệnh: đọc là biết phải LÀM GÌ, không phải suy ra */
  title: string;
  subtitle: string;
  /** Mã tham chiếu hiện dạng chữ đơn cách, vd "PO-2602" hay "PN-0031" */
  ref?: string | null;
  /**
   * Mức khẩn quy về NGÀY. Dương = đã quá hạn hoặc đã tồn bấy nhiêu ngày,
   * 0 = đến hạn hôm nay, âm = còn hạn.
   * Khung sắp giảm dần theo con số này; phân hệ không phải tự sắp.
   */
  urgencyDays: number;
  /** Nhóm nghiệp vụ — quyết định màu huy hiệu, lấy từ BIZ_TONE */
  domain: BizDomain;
  icon: ElementType;
  /** Tên loại việc, hiện ở tooltip của huy hiệu */
  kindLabel: string;
  /** Bỏ trống = dòng chỉ để đọc, khung sẽ KHÔNG hiện con trỏ bàn tay */
  onOpen?: () => void;
}

export interface MosKpi {
  id: string;
  label: string;
  /** Đã định dạng sẵn thành chuỗi. "—" khi không đọc được — KHÔNG phải "0". */
  value: string;
  sub: string;
  tone: MosTone;
  icon: ElementType;
  /** Nhãn cho trình đọc màn hình, vd "Mở tab Đơn hàng" */
  goLabel: string;
  onGo?: () => void;
}

export interface MosAlert {
  id: string;
  title: string;
  detail: string;
  /** Con số làm bằng chứng: "trễ 4 ngày", "5,2% lỗi", "78 điểm" */
  metric: string;
  domain: BizDomain;
  icon: ElementType;
  kindLabel: string;
  onOpen?: () => void;
}

/** Bảng màu của ô chỉ số. Tách khỏi BizDomain vì ô chỉ số nói về TRẠNG THÁI
 *  (đang chạy, đang chờ, nguy hiểm) chứ không nói về nhóm nghiệp vụ. */
export type MosTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'red' | 'purple' | 'slate';

export interface MosFeed {
  tasks: MosTask[];
  kpis: MosKpi[];
  alerts: MosAlert[];
}

/** Cách diễn đạt mức khẩn thành lời. Mỗi phân hệ nói một kiểu:
 *  Merchandiser nói "Trễ 4 ngày", Kho nói "Tồn 4 ngày". */
export interface UrgencyWording {
  /** Dùng khi urgencyDays > 0 */
  overdue: (days: number) => string;
  /** Dùng khi urgencyDays === 0 */
  today: string;
  /** Dùng khi urgencyDays < 0 */
  upcoming?: (days: number) => string;
}

export const DEFAULT_URGENCY: UrgencyWording = {
  overdue: (d) => `Trễ ${d} ngày`,
  today: 'Tới hạn hôm nay',
  upcoming: (d) => `Còn ${Math.abs(d)} ngày`,
};

/** Sắc thái của phù hiệu mức khẩn. Ngưỡng 3 ngày là chung cho cả hệ thống:
 *  dưới 3 ngày còn xoay được, từ 3 ngày trở lên là đã ảnh hưởng dây chuyền. */
export function urgencyTone(days: number): string {
  if (days >= 3) return 'bg-red-100 text-red-800';
  if (days > 0) return 'bg-amber-100 text-amber-800';
  if (days === 0) return 'bg-blue-100 text-blue-800';
  return 'bg-slate-100 text-slate-600';
}

export function urgencyText(days: number, w: UrgencyWording = DEFAULT_URGENCY): string {
  if (days > 0) return w.overdue(days);
  if (days === 0) return w.today;
  return w.upcoming ? w.upcoming(days) : '';
}
