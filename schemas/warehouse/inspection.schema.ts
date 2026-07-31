import { z } from 'zod';

import { ENTRY_UOMS } from '@/lib/mos/four-point';
import type { DictionaryKey } from '@/lib/i18n';

// ============================================================================
// PHIẾU KIỂM 4-POINT — LƯỢC ĐỒ DỮ LIỆU
//
// ─── THÔNG BÁO LỖI LÀ KHOÁ i18n, KHÔNG PHẢI CÂU TIẾNG VIỆT ────────────────
// Điều XXI của Hiến pháp: mọi Validation đều phải qua i18n. Lược đồ này là mã
// dùng chung cho cả máy chủ lẫn trình duyệt, mà máy chủ không có ngữ cảnh ngôn
// ngữ của người dùng. Vì vậy lược đồ trả về KHOÁ, tầng giao diện mới dịch bằng
// t(). Kiểu DictionaryKey ép mọi khoá phải có thật — gõ sai là lỗi biên dịch,
// không phải tới lúc người dùng nhập sai mới hiện ra chuỗi trống.
// ============================================================================

/** Ép chuỗi thông báo phải là một khoá từ điển có thật */
const msg = (key: DictionaryKey): string => key;

export const SHADE_VARIATIONS = ['OK', 'SLIGHT', 'SEVERE'] as const;
export type ShadeVariation = (typeof SHADE_VARIATIONS)[number];

/** Đếm lỗi: số nguyên không âm. Bỏ trống coi như 0 — người kiểm chỉ gõ vào ô
 *  có lỗi, bắt điền đủ bốn ô số 0 là bắt làm việc thừa. */
const defectCount = z.coerce
  .number({ error: msg('wh_v_defect_integer') })
  .int({ error: msg('wh_v_defect_integer') })
  .min(0, { error: msg('wh_v_defect_negative') })
  .default(0);

export const inspectionFormSchema = z.object({
  rollId: z.string().min(1, { error: msg('wh_v_roll_required') }),
  customerId: z.string().nullable().default(null),

  entryUom: z.enum(ENTRY_UOMS).default('METERS'),
  /** Theo ĐƠN VỊ NGƯỜI DÙNG CHỌN. Quy về mét ở tầng service, không ở đây. */
  length: z.coerce
    .number({ error: msg('wh_v_length_positive') })
    .positive({ error: msg('wh_v_length_positive') }),
  width: z.coerce
    .number({ error: msg('wh_v_width_positive') })
    .positive({ error: msg('wh_v_width_positive') }),

  p1: defectCount,
  p2: defectCount,
  p3: defectCount,
  p4: defectCount,

  shadeVariation: z.enum(SHADE_VARIATIONS).nullable().default(null),
  shrinkagePct: z.coerce
    .number()
    .min(-50, { error: msg('wh_v_shrinkage_range') })
    .max(50, { error: msg('wh_v_shrinkage_range') })
    .nullable()
    .default(null),
  colorFastness: z.coerce
    .number()
    .int({ error: msg('wh_v_fastness_range') })
    .min(1, { error: msg('wh_v_fastness_range') })
    .max(5, { error: msg('wh_v_fastness_range') })
    .nullable()
    .default(null),
  yarnDefectNote: z.string().max(2000).nullable().default(null),
});

export type InspectionFormInput = z.input<typeof inspectionFormSchema>;
export type InspectionFormValues = z.output<typeof inspectionFormSchema>;

// ─── Kiểu dữ liệu đọc ra màn hình ───────────────────────────────────────────

/** Một cuộn vải đang chờ kiểm, kèm ngữ cảnh đủ để người kiểm nhận ra nó */
export interface RollForInspection {
  id: string;
  rollCode: string;
  materialId: string | null;
  materialName: string | null;
  materialCode: string | null;
  lotNo: string | null;
  shadeCode: string | null;
  binPath: string | null;
  /** Chiều dài còn lại, mét. null = không đọc được (hiện "—", KHÔNG hiện 0) */
  currentLengthM: number | null;
  widthM: number | null;
  qaStatus: string;
}

/** Một phiếu đã kiểm, đọc từ view v_inspection_score */
export interface InspectionRow {
  id: string;
  inspectionNo: string;
  rollId: string | null;
  rollCode: string | null;
  materialName: string | null;
  totalPoints: number;
  areaSqYd: number | null;
  pointsPer100SqYd: number | null;
  acceptanceLimit: number;
  result: 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL';
  shadeVariation: ShadeVariation | null;
  inspectedAt: string | null;
}

/** Khách hàng kèm ngưỡng riêng, để màn hình nói rõ ngưỡng đang từ đâu ra */
export interface CustomerLimit {
  id: string;
  name: string;
  /** null = khách này chưa khai ngưỡng riêng, dùng mức mặc định nhà máy */
  fourPointLimit: number | null;
}
