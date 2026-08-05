import { progressPercent, defectRatePercent } from '@/lib/garment-math';
import { laHomNayVN } from '@/lib/time';
import type { DuLieuMay } from '@/lib/mos/workspace/may-work-items';

// ============================================================================
// KPI CỦA CHUYỀN MAY — PHÉP TÍNH DẪN XUẤT, ⛔ KHÔNG LƯU VÀO CSDL
//
// ⚠️ `page.tsx` của `/to-truong-may` đang cộng bằng **ba lệnh `.reduce`** và tự
// viết `(đạt/mục tiêu)*100` **hai lần** — một lần cho tổng, một lần cho từng
// dòng. `progressPercent` **đã có sẵn** ở `garment-math.ts`.
//
// 🔑 Công thức ngành may chỉ được có **MỘT** bản trong kho.
// ============================================================================

export interface PhieuGio {
  line_name?: string;
  target_qty: number;
  actual_qty: number;
  rework_qty: number;
  created_at?: string | null;
}

/** Vụ kim gãy. ⚠️ `fragments_found` là **an toàn sản phẩm**, ⛔ không phải
 *  thống kê — xem `may-work-items.ts`. */
export interface VuKimGay {
  line_name?: string;
  machine_code: string;
  fragments_found: boolean;
  created_at?: string | null;
}

export interface KpiMay {
  tongDat: number;
  tongMucTieu: number;
  tongSuaLai: number;
  /** Phần trăm — **con số mang phán quyết** của chuyền may. */
  hieuSuat: number;
  tyLeSuaLai: number;
}

export function kpiMay(phieu: readonly PhieuGio[]): KpiMay {
  let tongDat = 0;
  let tongMucTieu = 0;
  let tongSuaLai = 0;

  for (const p of phieu) {
    tongDat += p.actual_qty;
    tongMucTieu += p.target_qty;
    tongSuaLai += p.rework_qty;
  }

  return {
    tongDat,
    tongMucTieu,
    tongSuaLai,
    hieuSuat: progressPercent(tongDat, tongMucTieu),
    tyLeSuaLai: defectRatePercent(tongSuaLai, tongDat),
  };
}

/** Nhãn dùng khi bản ghi ⛔ không khai tên chuyền.
 *
 *  ⚠️ ⛔ **Không** gộp chúng vào một chuyền tên `""` — khi ấy khối *"chuyền tụt
 *  lại"* sẽ chỉ vào **một chuyền ⛔ không tồn tại**, và tổ trưởng đi tìm mãi
 *  ⛔ không ra. Đặt tên rõ ràng thì người đọc biết ngay vấn đề nằm ở **dữ liệu
 *  nhập thiếu**, ⛔ không phải ở chuyền nào cả. */
export const CHUYEN_KHONG_TEN = '(chưa khai chuyền)';

export function duLieuMayHomNay(
  phieu: readonly PhieuGio[],
  kimGay: readonly VuKimGay[] = [],
): DuLieuMay {
  const homNay = phieu.filter((p) => laHomNayVN(p.created_at ?? null));
  const k = kpiMay(homNay);

  // Gom theo chuyền để tìm chuyền tụt lại.
  const theoChuyen = new Map<string, { dat: number; mucTieu: number }>();
  for (const p of homNay) {
    const ten = p.line_name?.trim() || CHUYEN_KHONG_TEN;
    const cu = theoChuyen.get(ten) ?? { dat: 0, mucTieu: 0 };
    theoChuyen.set(ten, { dat: cu.dat + p.actual_qty, mucTieu: cu.mucTieu + p.target_qty });
  }

  return {
    soPhieuHomNay: homNay.length,
    tongDat: k.tongDat,
    tongMucTieu: k.tongMucTieu,
    tongSuaLai: k.tongSuaLai,
    hieuSuatTheoChuyen: [...theoChuyen]
      // ⚠️ Bỏ chuyền **⛔ chưa đặt mục tiêu**: hiệu suất của nó là phép chia
      // cho 0. `progressPercent` trả 0, và một chuyền hiện `0%` chỉ vì **⛔
      // chưa ai khai mục tiêu** sẽ luôn đứng đầu danh sách *"tụt lại"* — che
      // mất chuyền đang thật sự có vấn đề.
      .filter(([, v]) => v.mucTieu > 0)
      .map(([chuyen, v]) => ({ chuyen, hieuSuat: progressPercent(v.dat, v.mucTieu) })),
    // 🔴 Vụ kim gãy **⛔ chưa tìm đủ mảnh**, trong ngày.
    kimGayChuaTimThay: kimGay
      .filter((v) => laHomNayVN(v.created_at ?? null) && !v.fragments_found)
      .map((v) => ({ chuyen: v.line_name?.trim() || CHUYEN_KHONG_TEN, may: v.machine_code })),
  };
}
