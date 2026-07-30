import { z } from 'zod';

import {
  businessCode,
  requiredText,
  optionalText,
  optionalUuid,
  uuidField,
  optionalDate,
  positiveInt,
} from './common';
import { ALL_ROLES } from '@/lib/rbac';

// ============================================================================
// TÀI LIỆU · THẢO LUẬN · YÊU CẦU THAY ĐỔI · NHẬT KÝ
// Bốn thứ gắn được vào bất kỳ thực thể nào trong phân hệ.
// ============================================================================

/** Các thực thể có thể đính kèm tài liệu / bình luận */
export const ENTITY_TYPES = [
  'STYLE', 'ORDER', 'COSTING', 'INQUIRY', 'CUSTOMER', 'SAMPLE', 'MILESTONE',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];
export const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  STYLE: 'Mã hàng',
  ORDER: 'Đơn hàng',
  COSTING: 'Bản chiết tính',
  INQUIRY: 'Yêu cầu báo giá',
  CUSTOMER: 'Khách hàng',
  SAMPLE: 'Mẫu duyệt',
  MILESTONE: 'Mốc tiến độ',
};

// ─── 1. TRUNG TÂM TÀI LIỆU ──────────────────────────────────────────────────
export const DOC_TYPES = [
  'TECH_PACK', 'MARKER', 'PATTERN', 'PACKING_LIST',
  'ARTWORK', 'CONTRACT', 'INVOICE', 'OTHER',
] as const;
export type DocType = (typeof DOC_TYPES)[number];
export const DOC_TYPE_LABEL: Record<DocType, string> = {
  TECH_PACK: 'Tài liệu kỹ thuật (Tech Pack)',
  MARKER: 'Sơ đồ cắt (Marker)',
  PATTERN: 'Rập (Pattern)',
  PACKING_LIST: 'Bảng đóng gói',
  ARTWORK: 'File in / thêu',
  CONTRACT: 'Hợp đồng',
  INVOICE: 'Hoá đơn',
  OTHER: 'Tài liệu khác',
};

export const documentFormSchema = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: uuidField('đối tượng đính kèm'),
  doc_type: z.enum(DOC_TYPES).default('OTHER'),
  title: requiredText('Tên tài liệu'),
  // Bắt buộc ở đây (khác storagePath tuỳ chọn của các form khác): một bản ghi
  // tài liệu mà không có tệp thì hoàn toàn vô nghĩa.
  storage_path: z.string().trim().min(1, 'Chưa tải tệp lên').max(500, 'Đường dẫn quá dài'),
  file_size: positiveInt('Kích thước tệp', 104_857_600).optional(),
  mime_type: optionalText('Định dạng tệp', 100),
  version: positiveInt('Phiên bản', 999).default(1),
});
export type DocumentFormValues = z.infer<typeof documentFormSchema>;

export interface DocumentRow {
  id: string;
  doc_type: string;
  title: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  version: number;
  uploaded_by_name: string | null;
  created_at: string;
}

// ─── 2. THẢO LUẬN (@mention kiểu Jira) ─────────────────────────────────────
export const TASK_STATUSES = ['OPEN', 'DOING', 'DONE', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  OPEN: 'Chưa xử lý',
  DOING: 'Đang xử lý',
  DONE: 'Đã xong',
  CANCELLED: 'Đã huỷ',
};

export const commentFormSchema = z
  .object({
    entity_type: z.enum(ENTITY_TYPES),
    entity_id: uuidField('đối tượng'),
    parent_id: optionalUuid('Bình luận cha'),
    body: requiredText('Nội dung', 1, 5000),
    // Tag theo VAI TRÒ chứ không theo từng người: nhân sự xưởng thay đổi liên
    // tục, còn vai trò thì ổn định. "@kho" luôn tới đúng người đang trực kho.
    mentions: z.array(z.enum(ALL_ROLES as unknown as [string, ...string[]])).default([]),
    is_task: z.boolean().default(false),
    task_status: z.enum(TASK_STATUSES).optional(),
    assigned_role: optionalText('Bộ phận được giao', 50),
    due_date: optionalDate('Hạn xử lý'),
  })
  // Đã đánh dấu là việc thì phải giao cho ai đó, nếu không sẽ trôi vào hư vô
  .refine((v) => !v.is_task || Boolean(v.assigned_role), {
    message: 'Đã đánh dấu là việc cần làm thì phải chọn bộ phận phụ trách',
    path: ['assigned_role'],
  });
export type CommentFormValues = z.infer<typeof commentFormSchema>;

export interface CommentRow {
  id: string;
  parent_id: string | null;
  body: string;
  mentions: string[];
  is_task: boolean;
  task_status: string | null;
  assigned_role: string | null;
  due_date: string | null;
  author_name: string | null;
  author_role: string | null;
  created_at: string;
}

/** Rút danh sách vai trò được tag từ nội dung "@kho cần cấp vải gấp".
 *  Chỉ nhận vai trò CÓ THẬT — gõ "@abc" không tạo ra tag rác. */
export function extractMentions(body: string): string[] {
  const found = new Set<string>();
  for (const role of ALL_ROLES) {
    if (new RegExp(`@${role}\\b`, 'i').test(body)) found.add(role);
  }
  return [...found];
}

// ─── 3. YÊU CẦU THAY ĐỔI ────────────────────────────────────────────────────
export const CHANGE_TYPES = [
  'QUANTITY', 'COLOR', 'SIZE', 'DELIVERY_DATE',
  'MATERIAL', 'PRICE', 'PACKING', 'OTHER',
] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];
export const CHANGE_TYPE_LABEL: Record<ChangeType, string> = {
  QUANTITY: 'Thay đổi số lượng',
  COLOR: 'Thay đổi màu',
  SIZE: 'Thay đổi size',
  DELIVERY_DATE: 'Dời ngày giao hàng',
  MATERIAL: 'Thay đổi nguyên phụ liệu',
  PRICE: 'Điều chỉnh giá',
  PACKING: 'Thay đổi quy cách đóng gói',
  OTHER: 'Thay đổi khác',
};

export const CHANGE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'APPLIED'] as const;
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];
export const CHANGE_STATUS_LABEL: Record<ChangeStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  APPLIED: 'Đã áp dụng',
};

export const changeRequestSchema = z.object({
  request_no: businessCode('Số yêu cầu thay đổi'),
  order_id: uuidField('đơn hàng'),
  style_id: optionalUuid('Mã hàng'),
  change_type: z.enum(CHANGE_TYPES),
  // Giá trị CŨ bắt buộc: khi khách đổi phút chót rồi tranh chấp, đây là bằng
  // chứng duy nhất cho biết ban đầu đã chốt cái gì. Bỏ trống là mất căn cứ.
  old_value: requiredText('Giá trị cũ', 1, 2000),
  new_value: requiredText('Giá trị mới', 1, 2000),
  reason: optionalText('Lý do thay đổi', 2000),
  impact_note: optionalText('Ảnh hưởng tới sản xuất', 2000),
});
export type ChangeRequestValues = z.infer<typeof changeRequestSchema>;

export interface ChangeRequestRow {
  id: string;
  request_no: string;
  po_number: string | null;
  change_type: string;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  impact_note: string | null;
  status: string;
  requested_by_name: string | null;
  approved_by_name: string | null;
  created_at: string;
}

// ─── 4. NHẬT KÝ THAO TÁC ────────────────────────────────────────────────────
export const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xoá',
  APPROVE: 'Duyệt',
  REJECT: 'Từ chối',
  EXPORT: 'Xuất dữ liệu',
};

export interface ActivityRow {
  id: number;
  entity_type: string;
  entity_id: string | null;
  action: string;
  /** Chỉ chứa phần THAY ĐỔI, không chép nguyên bản ghi */
  changes: Record<string, { from: unknown; to: unknown }>;
  actor_name: string | null;
  actor_role: string | null;
  created_at: string;
}

/** So hai bản ghi, chỉ giữ ô THỰC SỰ đổi. Ghi nguyên dòng mỗi lần sửa một ô
 *  sẽ khiến nhật ký của 500 chuyền phình rất nhanh. */
export function diffRecords(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  ignore: ReadonlyArray<string> = ['updated_at', 'created_at'],
): Record<string, { from: unknown; to: unknown }> {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (ignore.includes(key)) continue;
    const a = before[key] ?? null;
    const b = after[key] ?? null;
    if (JSON.stringify(a) !== JSON.stringify(b)) out[key] = { from: a, to: b };
  }
  return out;
}
