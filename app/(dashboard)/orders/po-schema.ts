import { z } from 'zod';
import { ngayVN } from '@/lib/time';
// Dùng lại hằng tiền tệ + hàm dựng số thập phân ĐÃ CÓ, ⛔ không dựng bộ thứ
// hai: hai danh sách tiền tệ là hai cơ hội để chúng lệch nhau.
import { CURRENCIES, CURRENCY_LABEL, positiveDecimal } from '@/schemas/md';

export { CURRENCIES, CURRENCY_LABEL };

// ============================================================================
// LƯỢC ĐỒ ĐƠN HÀNG (PO)
//
// ⚠️ BẢNG THẬT LÀ `orders`, KHÔNG PHẢI `po_master`.
// Đã dò trực tiếp Supabase: po_master trả 404, còn orders có sẵn đúng các cột
// cần dùng (po_number, style_code, customer_name, total_quantity,
// delivery_date, status). Không tạo bảng mới để tránh tách đôi nguồn dữ liệu —
// các phân hệ Cắt/May/QA/Kho đều đang tham chiếu orders.id.
//
// Dùng chung cho React Hook Form (client) và Server Action (server): chỉ chặn
// ở client thì ai gọi thẳng Server Action cũng bỏ qua được toàn bộ ràng buộc.
// ============================================================================

export const PO_STATUSES = [
  'APPROVED',
  'IN_PRODUCTION',
  'COMPLETED',
  'SHIPPED',
  'CANCELLED',
] as const;

export type PoStatus = (typeof PO_STATUSES)[number];

export const PO_STATUS_LABEL: Record<PoStatus, string> = {
  APPROVED: 'Đã duyệt',
  IN_PRODUCTION: 'Đang sản xuất',
  COMPLETED: 'Hoàn thành',
  SHIPPED: 'Đã xuất',
  CANCELLED: 'Đã huỷ',
};

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD.
 *  Máy chủ chạy UTC nên không được dùng giờ máy chủ để chốt "hôm nay". */
export function vnToday(): string {
  return ngayVN();
}

/**
 * Ngày có thật hay không.
 *
 * Không dùng Date.parse: JavaScript tự cuộn ngày tràn, nên '2027-02-31' được
 * hiểu thành 03/03 và lọt qua. Cách chắc chắn là dựng lại chuỗi từ đối tượng
 * Date rồi so ngược — nhưng phải kiểm tra hợp lệ TRƯỚC, vì toISOString() ném
 * RangeError khi gặp Invalid Date.
 */
function isRealDate(v: string): boolean {
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === v;
}

export const poFormSchema = z.object({
  po_number: z
    .string()
    .trim()
    .min(3, 'Mã PO phải có ít nhất 3 ký tự')
    .max(100, 'Mã PO quá dài')
    // Chuẩn hoá về chữ HOA: DB có ràng buộc UNIQUE nhưng phân biệt hoa/thường,
    // để tự do sẽ lọt cả 'po-001' lẫn 'PO-001' như hai đơn khác nhau.
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z0-9][A-Z0-9._/-]*$/.test(v), {
      message: 'Mã PO chỉ gồm chữ, số và các ký tự . _ / -',
    }),

  customer_name: z
    .string()
    .trim()
    .min(2, 'Vui lòng nhập tên khách hàng')
    .max(255, 'Tên khách hàng quá dài'),

  style_code: z
    .string()
    .trim()
    .min(2, 'Vui lòng nhập mã hàng (style)')
    .max(100, 'Mã hàng quá dài'),

  // z.number() chứ không z.coerce.number(): với Zod v4, coerce làm kiểu đầu vào
  // thành unknown và phá kiểu của React Hook Form. Ô nhập dùng
  // register('total_quantity', { valueAsNumber: true }) để RHF ép số giúp.
  total_quantity: z
    .number({ error: 'Số lượng phải là số' })
    .int('Số lượng phải là số nguyên')
    .positive('Số lượng phải lớn hơn 0')
    .max(10_000_000, 'Số lượng vượt ngưỡng cho phép'),

  delivery_date: z
    .string()
    .min(1, 'Vui lòng chọn ngày giao')
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), { message: 'Ngày giao không hợp lệ' })
    .refine(isRealDate, { message: 'Ngày giao không tồn tại' })
    .refine((v) => v >= vnToday(), { message: 'Ngày giao không được ở quá khứ' }),

  // ── GIÁ TRỊ THƯƠNG MẠI CỦA ĐƠN ──────────────────────────────────────────
  // 🔴 THÊM 07/08/2026 sau khi đi hết luồng nghiệp vụ bằng phiên MD thật.
  //
  // Đo được: 14/15 đơn trong CSDL **CÓ** `unit_price`; đơn DUY NHẤT thiếu là
  // đơn vừa tạo **qua chính giao diện này**. Nghĩa là đường tạo PO của sản
  // phẩm là **nguồn duy nhất sinh ra đơn ⛔ không có giá** — cột `unit_price`
  // và `currency` đã tồn tại trong `orders`, lược đồ MD (`order.schema.ts`)
  // đã khai chúng, nhưng biểu mẫu ⛔ **chưa từng có ô để nhập**.
  //
  // Hệ quả: mọi con số doanh thu · giá trị đơn · biên lợi nhuận dẫn xuất từ
  // `orders` đều ⛔ không tính được cho đơn do người dùng tự lập.
  //
  // ⚠️ **`optional`, ⛔ KHÔNG bắt buộc** — đúng như `order.schema.ts:67` đã
  // duyệt. MD thường mở PO trước khi chốt giá; ép nhập là **đổi quy tắc
  // nghiệp vụ**, mà đó ⛔ không phải thẩm quyền của bước sửa lỗi này.
  // ⚠️ ⛔ KHÔNG `.default('USD')`. Hai lý do:
  //   ① `.default()` làm kiểu VÀO khác kiểu RA, mà React Hook Form dùng kiểu
  //      VÀO ⇒ `zodResolver` ⛔ không khớp kiểu.
  //   ② Quan trọng hơn: **tự chọn tiền tệ giúp người dùng là lỗi tiền bạc.**
  //      Người gọi ⛔ không khai tiền tệ thì phải bị **từ chối**, ⛔ không phải
  //      được lặng lẽ gán USD — một đơn VND bị hiểu thành USD sai 25.000 lần.
  //      Ô chọn trên biểu mẫu luôn có sẵn giá trị nên người dùng ⛔ không gặp
  //      lỗi này; nó chỉ chặn người gọi thẳng Server Action.
  currency: z.enum(CURRENCIES),
  // 4 số lẻ — giữ đúng độ chính xác của `order.schema.ts`: đơn giá gia công
  // thường là 2,4750 USD/sp, làm tròn 2 số lệch hàng nghìn đô trên đơn lớn.
  unit_price: positiveDecimal('Đơn giá', 4, 999_999).optional(),

  status: z.enum(PO_STATUSES),
});

export type PoFormValues = z.infer<typeof poFormSchema>;

/** Một dòng đơn hàng đọc từ bảng orders */
export interface PoRow {
  id: string;
  po_number: string;
  customer_name: string;
  style_code: string;
  total_quantity: number;
  delivery_date: string;
  status: string;
  created_at: string | null;
}
