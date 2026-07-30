import { z } from 'zod';

import {
  businessCode,
  requiredText,
  optionalText,
  optionalUuid,
  uuidField,
  dateField,
  optionalDate,
  positiveInt,
  nonNegativeInt,
  percentField,
  storagePath,
  addDays,
} from './common';

// ============================================================================
// LỊCH TRÌNH T&A · MẪU DUYỆT · ĐIỂM RỦI RO
// Ba thứ quyết định một PO có giao đúng hạn hay không.
// ============================================================================

// ─── 1. LỊCH TRÌNH T&A (Time & Action) ─────────────────────────────────────
export const MILESTONE_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE', 'LATE', 'SKIPPED'] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];
export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  PENDING: 'Chưa tới hạn',
  IN_PROGRESS: 'Đang làm',
  DONE: 'Đã xong',
  LATE: 'Đã trễ',
  SKIPPED: 'Bỏ qua',
};

export const milestoneFormSchema = z.object({
  order_id: uuidField('đơn hàng'),
  seq_no: nonNegativeInt('Số thứ tự', 999),
  milestone: requiredText('Tên mốc công việc'),
  planned_date: dateField('ngày kế hoạch'),
  actual_date: optionalDate('Ngày thực tế'),
  is_critical: z.boolean().default(false),
  responsible_role: optionalText('Bộ phận phụ trách', 50),
  status: z.enum(MILESTONE_STATUSES).default('PENDING'),
  notes: optionalText('Ghi chú', 1000),
});
export type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

/** Sinh lịch T&A cho một PO từ mẫu.
 *
 * Mốc tính LÙI từ ngày giao hàng, không cộng dồn từ ngày mở đơn: ngày giao là
 * thứ khách chốt cứng, còn ngày mở đơn hay xê dịch. Nếu cộng xuôi thì mỗi lần
 * đơn vào trễ vài ngày là toàn bộ lịch trôi theo và không còn ý nghĩa cảnh báo.
 */
export function generateMilestones(
  deliveryDate: string,
  template: ReadonlyArray<{
    seq_no: number;
    milestone: string;
    offset_days_before_delivery: number;
    is_critical: boolean;
    responsible_role: string | null;
  }>,
): Array<{
  seq_no: number;
  milestone: string;
  planned_date: string;
  is_critical: boolean;
  responsible_role: string | null;
}> {
  return template
    .slice()
    .sort((a, b) => a.seq_no - b.seq_no)
    .map((t) => ({
      seq_no: t.seq_no,
      milestone: t.milestone,
      planned_date: addDays(deliveryDate, -t.offset_days_before_delivery),
      is_critical: t.is_critical,
      responsible_role: t.responsible_role,
    }));
}

export interface MilestoneRow {
  id: string;
  seq_no: number;
  milestone: string;
  planned_date: string | null;
  actual_date: string | null;
  is_critical: boolean;
  responsible_role: string | null;
  status: string;
  /** Cột SINH TỰ ĐỘNG trong SQL: ngày thực tế − ngày kế hoạch. Âm là còn sớm. */
  delay_days: number | null;
}

/**
 * Trạng thái hiển thị của một mốc, tính theo NGÀY HÔM NAY.
 *
 * Không dựa hẳn vào cột status trong DB: một mốc để "PENDING" mà ngày kế hoạch
 * đã qua thì thực chất là ĐÃ TRỄ, dù chưa ai vào bấm cập nhật. Bảng T&A phải
 * báo động ngay, không đợi người dùng sửa tay.
 */
export function resolveMilestoneState(
  m: Pick<MilestoneRow, 'planned_date' | 'actual_date' | 'status'>,
  today: string,
): { state: MilestoneStatus; lateDays: number } {
  if (m.status === 'SKIPPED') return { state: 'SKIPPED', lateDays: 0 };

  if (m.actual_date) {
    const late = m.planned_date
      ? Math.round((Date.parse(m.actual_date) - Date.parse(m.planned_date)) / 86_400_000)
      : 0;
    return { state: 'DONE', lateDays: Math.max(0, late) };
  }

  if (!m.planned_date) return { state: 'PENDING', lateDays: 0 };

  const late = Math.round((Date.parse(today) - Date.parse(m.planned_date)) / 86_400_000);
  if (late > 0) return { state: 'LATE', lateDays: late };
  return { state: m.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING', lateDays: 0 };
}

/** Đường găng: chỉ các mốc đánh dấu quan trọng. Trễ ở đây là trễ cả đơn. */
export function criticalPath(rows: ReadonlyArray<MilestoneRow>): MilestoneRow[] {
  return rows.filter((r) => r.is_critical).sort((a, b) => a.seq_no - b.seq_no);
}

// ─── 2. MẪU DUYỆT ───────────────────────────────────────────────────────────
export const SAMPLE_STAGES = [
  'PROTO', 'FIT', 'SIZE_SET', 'SMS', 'PP', 'TOP', 'SHIPMENT',
] as const;
export type SampleStage = (typeof SAMPLE_STAGES)[number];
export const SAMPLE_STAGE_LABEL: Record<SampleStage, string> = {
  PROTO: 'Mẫu ý tưởng (Proto)',
  FIT: 'Mẫu vừa vặn (Fit)',
  SIZE_SET: 'Mẫu bộ size (Size Set)',
  SMS: 'Mẫu bán hàng (SMS)',
  PP: 'Mẫu đối trước sản xuất (PP)',
  TOP: 'Mẫu đầu chuyền (TOP)',
  SHIPMENT: 'Mẫu lưu xuất hàng',
};

export const SAMPLE_STATUSES = [
  'PENDING', 'SENT', 'APPROVED', 'REJECTED', 'APPROVED_WITH_COMMENT',
] as const;
export type SampleStatus = (typeof SAMPLE_STATUSES)[number];
export const SAMPLE_STATUS_LABEL: Record<SampleStatus, string> = {
  PENDING: 'Chờ gửi',
  SENT: 'Đã gửi, chờ phản hồi',
  APPROVED: 'Khách đã duyệt',
  REJECTED: 'Khách từ chối',
  APPROVED_WITH_COMMENT: 'Duyệt kèm góp ý',
};

export const sampleFormSchema = z
  .object({
    order_id: optionalUuid('Đơn hàng'),
    style_id: optionalUuid('Mã hàng'),
    stage: z.enum(SAMPLE_STAGES),
    round_no: positiveInt('Lần gửi', 99).default(1),
    sent_date: optionalDate('Ngày gửi'),
    reply_date: optionalDate('Ngày khách phản hồi'),
    status: z.enum(SAMPLE_STATUSES).default('PENDING'),
    buyer_comment: optionalText('Nhận xét của khách', 2000),
    attachment_url: storagePath,
  })
  // Mẫu phải gắn vào ít nhất một trong hai: đơn hàng hoặc mã hàng. Mẫu Proto
  // gửi khi chưa có PO, còn mẫu PP luôn thuộc một PO cụ thể.
  .refine((v) => Boolean(v.order_id) || Boolean(v.style_id), {
    message: 'Mẫu phải gắn với đơn hàng hoặc mã hàng',
    path: ['order_id'],
  })
  .refine((v) => !v.reply_date || !v.sent_date || v.reply_date >= v.sent_date, {
    message: 'Ngày phản hồi không được trước ngày gửi',
    path: ['reply_date'],
  });
export type SampleFormValues = z.infer<typeof sampleFormSchema>;

export interface SampleRow {
  id: string;
  stage: string;
  round_no: number;
  sent_date: string | null;
  reply_date: string | null;
  status: string;
  buyer_comment: string | null;
  attachment_url: string | null;
}

/** Tỷ lệ mẫu đạt = số mẫu được duyệt / số mẫu đã có kết luận.
 *  Mẫu còn chờ phản hồi KHÔNG tính vào mẫu số — tính vào sẽ kéo tỷ lệ xuống
 *  một cách giả tạo ngay đầu mùa, khi phần lớn mẫu còn đang chờ. */
export function sampleApprovalRate(rows: ReadonlyArray<SampleRow>): number | null {
  const decided = rows.filter((r) =>
    ['APPROVED', 'REJECTED', 'APPROVED_WITH_COMMENT'].includes(r.status),
  );
  if (decided.length === 0) return null;
  const passed = decided.filter((r) => r.status !== 'REJECTED').length;
  return Number(((passed / decided.length) * 100).toFixed(1));
}

// ─── 3. ĐIỂM RỦI RO (công thức trọng số) ───────────────────────────────────
export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];
export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Khẩn cấp',
};

/** Trọng số PHẢI trùng với công thức trong cột sinh tự động
 *  risk_assessments.total_score ở migration 015. Đổi ở đây mà quên đổi trong
 *  SQL là hai nơi ra hai điểm khác nhau. */
export const RISK_WEIGHTS = {
  material: 0.35,
  schedule: 0.3,
  quality: 0.2,
  capacity: 0.15,
} as const;

export const riskAssessmentSchema = z.object({
  order_id: uuidField('đơn hàng'),
  material_score: percentField('Điểm rủi ro NPL'),
  schedule_score: percentField('Điểm rủi ro tiến độ'),
  quality_score: percentField('Điểm rủi ro chất lượng'),
  capacity_score: percentField('Điểm rủi ro năng lực xưởng'),
});
export type RiskAssessmentValues = z.infer<typeof riskAssessmentSchema>;

export interface RiskRow {
  order_id: string;
  material_score: number;
  schedule_score: number;
  quality_score: number;
  capacity_score: number;
  /** Cột SINH TỰ ĐỘNG trong SQL theo RISK_WEIGHTS. Chỉ đọc. */
  total_score: number;
  risk_level: string;
  computed_at: string | null;
}

/** Bản sao công thức của SQL, dùng để XEM TRƯỚC khi người dùng kéo thanh trượt
 *  mà chưa lưu. Nguồn chân lý vẫn là cột sinh tự động trong DB. */
export function previewRiskScore(v: {
  material_score: number;
  schedule_score: number;
  quality_score: number;
  capacity_score: number;
}): number {
  return Number(
    (
      v.material_score * RISK_WEIGHTS.material +
      v.schedule_score * RISK_WEIGHTS.schedule +
      v.quality_score * RISK_WEIGHTS.quality +
      v.capacity_score * RISK_WEIGHTS.capacity
    ).toFixed(2),
  );
}

/** Ngưỡng phải trùng view v_order_risk trong migration 015 */
export function riskLevelOf(total: number): RiskLevel {
  if (total >= 70) return 'CRITICAL';
  if (total >= 45) return 'HIGH';
  if (total >= 20) return 'MEDIUM';
  return 'LOW';
}

export { businessCode };
