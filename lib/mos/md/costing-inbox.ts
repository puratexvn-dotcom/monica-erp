// ============================================================================
// HỘP THƯ DUYỆT GIÁ — LOGIC THUẦN
//
// Board 06/08/2026: *"Bấm sẽ ra báo cáo tự gửi đến Production Director để xem
// và duyệt hoặc từ chối, hoặc yêu cầu báo lại kèm lý do; sau đó nó sẽ **thông
// báo kết quả ngược lại cho MD**."*
//
// ─── 🔴 KHÔNG CÓ BẢNG `notifications`, VÀ ĐÂY LÀ CÁCH ĐI VÒNG ────────────
// Lược đồ ⛔ **chưa có** bảng thông báo; thêm bảng là chạm **Database Schema**
// — thẩm quyền của Board. Nhưng *"thông báo"* thật ra chỉ là câu hỏi:
//
//   **"Có bản chiết tính nào đang chờ TÔI làm gì ⛔ không?"**
//
// Câu đó trả lời được **ngay từ `costings.status`** — dữ liệu đã có sẵn. Vì vậy
// hộp thư này ⛔ không cần bảng mới, ⛔ không cần cron, ⛔ không cần hàng đợi.
//
// ⚠️ Đánh đổi phải nói ra: đây là **hộp thư kéo** *(mở màn hình mới thấy)*,
// ⛔ không phải **thông báo đẩy** *(chuông kêu khi có việc)*. Muốn đẩy thật thì
// cần bảng `notifications` + ADR — ghi ở phần đề xuất, ⛔ không lặng lẽ bỏ qua.
// ============================================================================
import type { Role } from '@/lib/rbac';
import { duocDuyet } from './costing-approval';

/** Chỉ những trường THẬT SỰ cần — dùng lại được ở Cổng khách hàng. */
export interface BanChietTinh {
  id: string;
  costing_no: string;
  customer_name: string | null;
  status: string;
  reject_reason: string | null;
  quoted_price: number | null;
  currency: string | null;
}

export interface MucHopThu {
  ban: BanChietTinh;
  /** Việc người đang xem cần làm với bản này. */
  viec: string;
  /** Lý do bị trả lại — chỉ có ở nhóm `BI_TRA_LAI`. */
  lyDo: string | null;
}

export interface HopThu {
  /** 🔴 Cần NGƯỜI ĐANG XEM ra tay ngay. */
  canXuLy: MucHopThu[];
  /** Đã trình, đang chờ người khác — chỉ để theo dõi. */
  dangCho: MucHopThu[];
  /** Câu mô tả ngắn cho dải thông báo. `null` ⇒ ⛔ không hiện gì cả. */
  tomTat: string | null;
}

const CHO_DUYET = 'SUBMITTED';
const BI_TRA_LAI = new Set(['REJECTED', 'REVISE']);

/**
 * Xếp danh sách chiết tính thành hộp thư **theo vai người đang xem**.
 *
 * 🔑 Cùng một bản `SUBMITTED` mang ý nghĩa **ngược nhau** với hai vai:
 *   · với **giám đốc sản xuất** — *"đang chờ TÔI duyệt"* ⇒ việc cần làm
 *   · với **MD** — *"đã trình, đang chờ sếp"* ⇒ chỉ theo dõi
 * Gộp chung một danh sách là bắt mỗi người tự lọc bằng mắt.
 */
export function xepHopThu(ds: readonly BanChietTinh[], role: Role | null): HopThu {
  const canXuLy: MucHopThu[] = [];
  const dangCho: MucHopThu[] = [];
  const laNguoiDuyet = duocDuyet(role);

  for (const b of ds) {
    if (b.status === CHO_DUYET) {
      const m: MucHopThu = {
        ban: b,
        viec: laNguoiDuyet ? 'Chờ bạn duyệt' : 'Đã trình — đang chờ Giám đốc sản xuất',
        lyDo: null,
      };
      (laNguoiDuyet ? canXuLy : dangCho).push(m);
      continue;
    }
    if (BI_TRA_LAI.has(b.status)) {
      // ⚠️ Bị trả lại là việc của NGƯỜI LẬP, ⛔ không phải người duyệt.
      const m: MucHopThu = {
        ban: b,
        viec: b.status === 'REJECTED' ? 'Bị từ chối — cần làm lại' : 'Được yêu cầu báo lại',
        // ⛔ Không có lý do thì nói thẳng là ⛔ không có, ⛔ không để trống cho
        // người dùng tự đoán.
        lyDo: b.reject_reason?.trim() || '⚠️ ⛔ Không ghi lý do — hỏi lại người duyệt',
      };
      (laNguoiDuyet ? dangCho : canXuLy).push(m);
    }
  }

  return { canXuLy, dangCho, tomTat: tomTat(canXuLy.length, dangCho.length, laNguoiDuyet) };
}

function tomTat(can: number, cho: number, laNguoiDuyet: boolean): string | null {
  if (can === 0 && cho === 0) return null;
  if (can === 0) return `${cho} bản chiết tính đang chờ xử lý ở phía bên kia.`;
  return laNguoiDuyet
    ? `${can} bản chiết tính đang chờ bạn duyệt.`
    : `${can} bản chiết tính bị trả lại, cần bạn làm lại.`;
}
