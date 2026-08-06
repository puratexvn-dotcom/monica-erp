'use server';

// ============================================================================
// DÒNG CHẢY ĐƠN HÀNG — CHUYỂN TRẠNG THÁI
//
// Ba chặng Vật tư · Sản xuất · Giao hàng xưa nay chỉ **XEM ĐƯỢC**: người dùng
// nhìn thấy phiếu ở trạng thái `SUBMITTED` nhưng ⛔ không duyệt được từ MD, phải
// đi vòng sang màn hình khác. Bàn làm việc mà ⛔ không làm việc được thì nó là
// một bản báo cáo.
//
// ⇒ Ba hàm dưới đây biến dòng chảy từ **THEO DÕI** thành **ĐIỀU KHIỂN**.
//
// ─── 🔑 BA ĐIỀU TỆP NÀY CỐ Ý ⛔ KHÔNG LÀM ────────────────────────────────
// ① **⛔ Không đụng lược đồ.** Chỉ `UPDATE` cột `status` sẵn có. ⛔ Không cột
//    mới, ⛔ không bảng mới — SECURITY FREEZE `MOS §XI.1` còn hiệu lực.
// ② **⛔ Không đụng RLS.** Chạy dưới phiên của chính người dùng qua `guard()`.
//    CSDL từ chối ⇒ trả câu lỗi tử tế, ⛔ **KHÔNG** lách bằng `service_role`.
// ③ **⛔ Không tự nghĩ ra mã trạng thái.** Mọi mã dưới đây chép từ ràng buộc
//    `CHECK` của migration đang chạy (`024` cho `shipments`) và từ bảng nhãn ở
//    `md-schema.ts`. Sai một mã là CSDL chặn lúc chạy, ⛔ không phải lúc dịch.
//
// ⚠️ Chuyển trạng thái là **CAM KẾT**, ⛔ không phải sự kiện *(`P-COMMIT`)* —
// nên mỗi lần đổi đều ghi Audit Log, và giao diện phải hỏi lại trước khi gọi.
// ============================================================================
import { revalidatePath } from 'next/cache';

import { guard, friendlyDbError } from '../_services/guard';
import { writeAudit } from './audit';
import type { ActionResult } from '@/schemas/md';
// Luật chuyển bước nằm ở `lib/` — xem khối chú thích đầu `flow-steps.ts`.
import {
  TRANG_THAI_DONG, buocKeTiepNPL, buocKeTiepSanXuat, buocKeTiepGiaoHang,
} from '@/lib/mos/md/flow-steps';

const PATH = '/md';

/** Mã trạng thái hợp lệ — chép từ `MR_STATUS_LABEL` ở `md-schema.ts`. */
const MR = ['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'REJECTED'] as const;
/** Chép từ `PROD_STATUS_LABEL`. */
const PROD = ['PENDING', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
/** Chép từ ràng buộc `shipments_status_valid` của migration `024`. */
const SHIP = [
  'DRAFT', 'BOOKED', 'LOADING', 'DEPARTED', 'IN_TRANSIT',
  'ARRIVED_PORT', 'CUSTOM_CLEARANCE', 'DELIVERED', 'CANCELLED',
] as const;

type MrStatus = (typeof MR)[number];
type ProdStatus = (typeof PROD)[number];
type ShipStatus = (typeof SHIP)[number];

/** Hành động cần lý do: từ chối / huỷ. ⛔ Không nêu lý do thì người sau ⛔ không
 *  biết vì sao — đúng bài học của `setCostingStatus`. */
const CAN_LY_DO = new Set(['REJECTED', 'CANCELLED']);

/**
 * 🔴 **⛔ KHÔNG TIN TRẠNG THÁI DO CLIENT GỬI.**
 *
 * Hàm này ĐỌC trạng thái hiện tại từ CSDL rồi mới quyết định. Nút trên màn hình
 * chỉ là *gợi ý*; kẻ gọi thẳng Server Action — mà Server Action là **endpoint
 * gọi được** *(CLAUDE.md §2.1)* — có thể gửi bất kỳ mã nào.
 *
 * Ba lớp chặn, theo thứ tự:
 *   ① mã đích phải nằm trong tập hợp lệ của bảng đó
 *   ② chứng từ **đã ĐÓNG** thì ⛔ không đổi được nữa — lập chứng từ điều chỉnh
 *   ③ chỉ cho đi **ĐÚNG MỘT BƯỚC** kế tiếp, hoặc từ chối/huỷ
 *
 * ⚠️ Cả ba lớp này ⛔ **KHÔNG thay thế RLS**. RLS mới là hàng rào thật; ba lớp
 * này chỉ giữ cho vòng đời chứng từ ⛔ không bị nhảy cóc.
 */
async function doiTrangThai(
  bang: 'material_requests' | 'production_orders' | 'shipments',
  doiTuong: 'MATERIAL_REQUEST' | 'PRODUCTION_ORDER' | 'SHIPMENT',
  id: string,
  status: string,
  hopLe: readonly string[],
  buocKeTiep: (hienTai: string) => { status: string; nhan: string } | null,
  lyDo?: string,
): Promise<ActionResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };

  if (!hopLe.includes(status)) {
    return { ok: false, message: `Trạng thái "${status}" không hợp lệ cho chứng từ này.` };
  }
  if (CAN_LY_DO.has(status) && !(lyDo && lyDo.trim())) {
    return { ok: false, message: 'Phải nêu lý do khi từ chối hoặc huỷ.' };
  }

  const { data, error: eDoc } = await g.supabase
    .from(bang).select('status').eq('id', id).maybeSingle();
  if (eDoc) return { ok: false, message: friendlyDbError(`doiTrangThai:doc:${bang}`, eDoc) };
  if (!data) return { ok: false, message: 'Không tìm thấy chứng từ, hoặc bạn không có quyền xem nó.' };

  const hienTai = String((data as { status: string }).status);
  if (TRANG_THAI_DONG.has(hienTai)) {
    return { ok: false, message: 'Chứng từ đã đóng — hãy lập chứng từ điều chỉnh thay vì sửa đè.' };
  }
  if (hienTai === status) return { ok: true, message: 'Trạng thái đã đúng, không có gì để đổi.' };

  const buoc = buocKeTiep(hienTai);
  const duocPhep = CAN_LY_DO.has(status) || buoc?.status === status;
  if (!duocPhep) {
    return {
      ok: false,
      message: `Không thể chuyển thẳng sang trạng thái này.${buoc ? ` Bước kế tiếp hợp lệ là "${buoc.nhan}".` : ''}`,
    };
  }

  const { error } = await g.supabase.from(bang).update({ status }).eq('id', id);
  if (error) return { ok: false, message: friendlyDbError(`doiTrangThai:${bang}`, error) };

  await writeAudit(
    doiTuong, id,
    status === 'REJECTED' || status === 'CANCELLED' ? 'REJECT' : 'UPDATE',
    // `changes` là bản đồ `cột → {from,to}`, nên LÝ DO cũng đi theo khuôn đó —
    // ⛔ không nhét một chuỗi trần vào giữa, sổ kiểm toán sẽ lệch khuôn.
    {
      status: { from: hienTai, to: status },
      ...(lyDo ? { reason: { from: null, to: lyDo.trim() } } : {}),
    },
  );

  revalidatePath(PATH);
  return { ok: true, message: 'Đã cập nhật trạng thái.' };
}

export async function setMaterialRequestStatus(
  id: string, status: MrStatus, lyDo?: string,
): Promise<ActionResult> {
  return doiTrangThai('material_requests', 'MATERIAL_REQUEST', id, status, MR, buocKeTiepNPL, lyDo);
}

export async function setProductionOrderStatus(
  id: string, status: ProdStatus, lyDo?: string,
): Promise<ActionResult> {
  return doiTrangThai('production_orders', 'PRODUCTION_ORDER', id, status, PROD, buocKeTiepSanXuat, lyDo);
}

export async function setShipmentStatus(
  id: string, status: ShipStatus, lyDo?: string,
): Promise<ActionResult> {
  return doiTrangThai('shipments', 'SHIPMENT', id, status, SHIP, buocKeTiepGiaoHang, lyDo);
}
