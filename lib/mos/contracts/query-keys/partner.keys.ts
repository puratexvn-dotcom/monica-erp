import { normalizeFilter } from './normalize';

// ============================================================================
// QUERY KEY FACTORY — PARTNER & DANH MỤC NỀN
//
// ─── VÌ SAO TÁCH GỐC KHỎI `assignment` ───────────────────────────────────
// Danh sách đối tác và loại hợp đồng **không đổi** khi một phần việc đổi trạng
// thái. Nếu chúng nằm dưới gốc `assignment` thì mỗi lần giao việc,
// `invalidate(assignmentKeys.all)` sẽ kéo lại cả bảng đối tác — một vòng mạng
// thừa cho dữ liệu đổi vài lần một năm.
//
// Gốc riêng cũng là điều kiện để dùng bậc `MASTER_DYNAMIC` (5 phút) mà không sợ
// bị một thao tác ghi ở nơi khác quét sạch.
//
// ⚠️ Factory này dùng chung cho MỌI phân hệ cần danh mục đối tác — Assignment
// hôm nay, và Buyer Portal · Subcon Portal · Sales · CRM sau này. Đó là lý do
// nó KHÔNG nằm trong `assignment.keys.ts`.
//
// ⚠️ Danh mục nền (loại hợp đồng, địa điểm, công đoạn) ĐÃ CHUYỂN sang
// `master-data.keys.ts`. Luật Kiến trúc sư: mỗi miền đúng một factory, không
// hai factory chung không gian tên — tệp này từng giữ cả hai gốc, và đó là
// vi phạm.
// ============================================================================

const ROOT = 'partner' as const;

export interface PartnerListFilter {
  partnerType?: string;
  isActive?: boolean;
  search?: string;
}

export const partnerKeys = {
  all: [ROOT] as const,

  lists: () => [ROOT, 'list'] as const,
  list: (filter?: PartnerListFilter) => [ROOT, 'list', normalizeFilter(filter)] as const,

  /** Đối tác đủ điều kiện nhận việc — đã loại `BUYER` (bất biến I-8). */
  executionPartners: () => [ROOT, 'execution'] as const,

  details: () => [ROOT, 'detail'] as const,
  detail: (partnerId: string) => [ROOT, 'detail', partnerId] as const,

  /** Tài khoản đăng nhập thuộc một đối tác. Cần cho Portal sau 031. */
  accounts: (partnerId: string) => [ROOT, 'accounts', partnerId] as const,
} as const;

/**
 * Làm mới sau khi sửa hồ sơ đối tác.
 *
 * ⚠️ Bậc `MASTER_DYNAMIC` giữ dữ liệu 5 phút. Không invalidate thì người vừa
 * thêm một nhà thầu sẽ không thấy nó trong ô chọn, và sẽ thêm lại lần nữa.
 */
export function partnerInvalidationKeys(partnerId?: string): readonly unknown[][] {
  const keys: unknown[][] = [
    [...partnerKeys.lists()],
    [...partnerKeys.executionPartners()],
  ];
  if (partnerId) keys.push([...partnerKeys.detail(partnerId)]);
  return keys;
}
