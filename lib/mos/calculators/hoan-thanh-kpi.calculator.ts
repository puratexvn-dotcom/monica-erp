import { defectRatePercent, progressPercent } from '@/lib/garment-math';
import type { DuLieuHoanThanh } from '@/lib/mos/workspace/hoan-thanh-work-items';

// ============================================================================
// KPI CỦA TỔ HOÀN THÀNH — PHÉP TÍNH DẪN XUẤT, ⛔ KHÔNG LƯU VÀO CSDL
//
// ⚠️ `page.tsx` của `/hoan-thanh` đang cộng bằng **bốn lệnh `.reduce`** viết
// thẳng trong thân component, và ⛔ **không** tính tỷ lệ lỗi ở đâu cả — tức con
// số quan trọng nhất của tổ hoàn thành **⛔ chưa từng được hiện ra**.
//
// 🔑 Công thức ngành may chỉ được có **MỘT** bản trong kho ⇒ gọi lại
//    `defectRatePercent` và `progressPercent`, ⛔ không viết bản thứ hai.
// ============================================================================

/** Một bundle sau khi `getFinishingAndPackingData()` đã gộp nhật ký.
 *
 *  ⚠️ Hình dạng này khai **đúng những trường lõi thuần cần**, ⛔ không chép cả
 *  bản ghi. Lõi ⛔ không được biết `color_code` hay `size_code` — nó ⛔ không
 *  phán đoán gì trên hai trường đó, và biết thừa thì mỗi lần đổi câu `select`
 *  lại kéo theo một lần sửa lõi. */
export interface BundleHoanThanh {
  bundle_code: string;
  quantity: number;
  current_stage: string;
  po_number: string;
  po_total_qty: number;
  trimming_qty: number;
  ironing_qty: number;
  final_qc_passed_qty: number;
  final_qc_defect_qty: number;
}

/** Một thùng đã đóng, còn đứng tại xưởng. */
export interface ThungCarton {
  quantity_per_carton: number;
  po_number: string;
}

export interface KpiHoanThanh {
  tongCatChi: number;
  tongUi: number;
  tongDat: number;
  tongLoi: number;
  /** Đạt + lỗi — mẫu số của tỷ lệ lỗi. */
  tongKiem: number;
  /** Phần trăm — **con số mang phán quyết** của tổ hoàn thành. */
  tyLeLoi: number;
  /** Đã ủi trên đã cắt chỉ, phần trăm — đo **độ thông của khâu giữa**. */
  tienDoUi: number;
  soChoDongThung: number;
  soThungTaiXuong: number;
}

/**
 * Trạng thái của một bundle **đã sẵn sàng đóng thùng**.
 *
 * ⚠️ Chuỗi này là **Business Code trong CSDL** *(`cut_bundles.current_stage`)*,
 * ⛔ không phải nhãn hiển thị. Khai một chỗ để ⛔ không ai gõ lại `'FINISHING'`
 * rải rác — gõ sai một chữ thì luật **im lặng**, ⛔ không báo lỗi.
 */
export const STAGE_SAN_SANG_DONG_THUNG = 'FINISHING';

export function kpiHoanThanh(
  bundles: readonly BundleHoanThanh[],
  thung: readonly ThungCarton[] = [],
): KpiHoanThanh {
  let tongCatChi = 0;
  let tongUi = 0;
  let tongDat = 0;
  let tongLoi = 0;
  let soChoDongThung = 0;

  for (const b of bundles) {
    tongCatChi += b.trimming_qty;
    tongUi += b.ironing_qty;
    tongDat += b.final_qc_passed_qty;
    tongLoi += b.final_qc_defect_qty;
    if (b.current_stage === STAGE_SAN_SANG_DONG_THUNG) soChoDongThung += 1;
  }

  const tongKiem = tongDat + tongLoi;

  return {
    tongCatChi,
    tongUi,
    tongDat,
    tongLoi,
    tongKiem,
    tyLeLoi: defectRatePercent(tongLoi, tongKiem),
    tienDoUi: progressPercent(tongUi, tongCatChi),
    soChoDongThung,
    soThungTaiXuong: thung.length,
  };
}

/** Nhãn dùng khi bản ghi ⛔ không khai mã đơn.
 *
 *  ⚠️ ⛔ **Không** gộp chúng vào một PO tên `""`: khi ấy phép so *"đóng vượt
 *  đơn"* sẽ cộng hàng của **nhiều đơn khác nhau** vào một rổ rồi báo vượt —
 *  một cảnh báo **sai** ở đúng chỗ người dùng cần tin tuyệt đối. Đặt tên rõ
 *  ràng thì người đọc biết ngay vấn đề nằm ở **dữ liệu thiếu**. */
export const PO_KHONG_TEN = '(chưa khai đơn)';

/**
 * Gom dữ liệu thô thành hình dạng mà luật sinh việc cần.
 *
 * ─── 🔴 PHÉP SO "ĐÓNG VƯỢT ĐƠN" LÀM ĐÚNG MỘT VIỆC KHÓ ─────────────────────
 * Số của đơn *(`po_total_qty`)* nằm trên **bundle**, số đã đóng nằm trên
 * **thùng**. Hai nguồn, hai bảng ⇒ phải bắc cầu qua `po_number`.
 *
 * ⚠️ Lấy **giá trị lớn nhất** của `po_total_qty` trong các bundle cùng đơn, ⛔
 * không lấy cái đầu tiên và ⛔ không cộng dồn. Cộng dồn là sai hiển nhiên *(mỗi
 * bundle mang **tổng của cả đơn**, ⛔ không mang phần của riêng nó)*; lấy cái
 * đầu tiên thì một bản ghi thiếu `0` sẽ **hạ trần xuống 0** và báo vượt cho
 * **mọi đơn**.
 */
export function duLieuHoanThanh(
  bundles: readonly BundleHoanThanh[],
  thung: readonly ThungCarton[] = [],
): DuLieuHoanThanh {
  const k = kpiHoanThanh(bundles, thung);

  const tranTheoPO = new Map<string, number>();
  for (const b of bundles) {
    const po = b.po_number?.trim() || PO_KHONG_TEN;
    tranTheoPO.set(po, Math.max(tranTheoPO.get(po) ?? 0, b.po_total_qty));
  }

  const daDongTheoPO = new Map<string, number>();
  for (const c of thung) {
    const po = c.po_number?.trim() || PO_KHONG_TEN;
    daDongTheoPO.set(po, (daDongTheoPO.get(po) ?? 0) + c.quantity_per_carton);
  }

  const dongVuotPO: Array<{ po: string; daDong: number; theoDon: number }> = [];
  for (const [po, daDong] of daDongTheoPO) {
    const theoDon = tranTheoPO.get(po) ?? 0;
    // ⚠️ `theoDon > 0` là **điều kiện bắt buộc**, ⛔ không phải phòng hờ. Đơn ⛔
    // chưa khai tổng số thì trần là `0`, và **mọi** thùng đã đóng đều "vượt" —
    // biến một cảnh báo về tiền thành tiếng ồn mà ⛔ không ai tắt được.
    if (theoDon > 0 && daDong > theoDon) dongVuotPO.push({ po, daDong, theoDon });
  }

  return {
    soBundle: bundles.length,
    tongDat: k.tongDat,
    tongLoi: k.tongLoi,
    tongKiem: k.tongKiem,
    choDongThung: bundles
      .filter((b) => b.current_stage === STAGE_SAN_SANG_DONG_THUNG)
      .map((b) => ({ bundle: b.bundle_code, po: b.po_number?.trim() || PO_KHONG_TEN })),
    // Nghẽn ủi: đã cắt chỉ mà ⛔ chưa ủi hết. ⚠️ Chỉ tính bundle **đã bắt đầu
    // cắt chỉ** — bundle ⛔ chưa vào tổ có `0/0` và ⛔ không nghẽn gì cả.
    nghenUi: bundles
      .filter((b) => b.trimming_qty > 0 && b.ironing_qty < b.trimming_qty)
      .map((b) => ({ bundle: b.bundle_code, catChi: b.trimming_qty, ui: b.ironing_qty })),
    dongVuotPO,
    soThungTaiXuong: k.soThungTaiXuong,
  };
}
