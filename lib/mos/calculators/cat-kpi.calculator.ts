import { cuttingWastePercent } from '@/lib/garment-math';
import { laHomNayVN } from '@/lib/time';
import type { DuLieuCat } from '@/lib/mos/workspace/cat-work-items';

// ============================================================================
// KPI CỦA TỔ CẮT — PHÉP TÍNH DẪN XUẤT, ⛔ KHÔNG LƯU VÀO CSDL
//
// ⚠️ `page.tsx` của `/to-truong-cat` đang cộng bằng **bốn lệnh `.reduce` ngay
// trong thân component**, y hệt `/qa` trước khi sửa. Tệp này gỡ chúng ra.
//
// 🔑 Và nó **⛔ không phát minh phép tính nào**: `cuttingWastePercent` đã có sẵn
//    ở `lib/garment-math.ts`. Công thức ngành may chỉ được có **MỘT** bản.
// ============================================================================

/** Hình dạng hẹp nhất đủ để tính. Cố ý ⛔ không nhận `CutTicket` của tầng app. */
export interface PhieuCat {
  ticket_no: string;
  total_planned_pcs: number;
  total_actual_pcs: number;
  bom_allowance_m: number | string;
  total_fabric_used_m: number | string;
  remnant_length_m: number | string;
  defect_length_m: number | string;
  created_at?: string | null;
}

export interface KpiCat {
  tongBtp: number;
  tongVaiDaTrai: number;
  tongDauTam: number;
  tongVaiLoi: number;
  /** Phần trăm hao hụt — **con số mang phán quyết** của khâu cắt. */
  tyLeHaoHut: number;
}

/** ⚠️ CSDL trả `NUMERIC` thành **chuỗi** qua PostgREST. Cộng thẳng sẽ ra phép
 *  **nối chuỗi** — `"12" + "8" = "128"` — và con số sai đó ⛔ **không** ném lỗi,
 *  nó chỉ lặng lẽ hiện ra màn hình. Ép kiểu ở **một chỗ**, ⛔ không rải rác. */
const so = (v: number | string | null | undefined): number => Number(v ?? 0) || 0;

/** Ngưỡng lệch sản lượng. Khai thành hằng để phép kiểm đọc được **cùng con số**
 *  mà hàm dùng — ⛔ không chép tay số 0 ở hai nơi rồi để chúng trôi khỏi nhau. */
export const NGUONG_LECH = 0;

export function kpiCat(phieu: readonly PhieuCat[]): KpiCat {
  let tongBtp = 0;
  let tongVaiDaTrai = 0;
  let tongDauTam = 0;
  let tongVaiLoi = 0;

  for (const p of phieu) {
    tongBtp += p.total_actual_pcs;
    tongVaiDaTrai += so(p.total_fabric_used_m);
    tongDauTam += so(p.remnant_length_m);
    tongVaiLoi += so(p.defect_length_m);
  }

  // Vải **thật sự nằm trên sơ đồ** = đã trải − đầu tấm − vải lỗi.
  const tren_so_do = tongVaiDaTrai - tongDauTam - tongVaiLoi;

  return {
    tongBtp,
    tongVaiDaTrai,
    tongDauTam,
    tongVaiLoi,
    tyLeHaoHut: cuttingWastePercent(tongVaiDaTrai, tren_so_do),
  };
}

/**
 * Gom dữ liệu **trong ngày** cho bộ luật sinh việc.
 *
 * ⚠️ *"Hôm nay"* theo **giờ Việt Nam** — máy chủ chạy UTC, và tổ cắt có **ca
 * đêm**. So theo UTC thì từ 00:00 tới 07:00 giờ VN mọi phiếu ca đêm bị coi là
 * *"hôm qua"*, và hộp thư việc của họ **trống trơn** đúng lúc cần nhất.
 */
export function duLieuCatHomNay(phieu: readonly PhieuCat[]): DuLieuCat {
  const homNay = phieu.filter((p) => laHomNayVN(p.created_at ?? null));
  const k = kpiCat(homNay);

  return {
    soPhieuHomNay: homNay.length,
    tongVaiDaTrai: k.tongVaiDaTrai,
    tongDauTam: k.tongDauTam,
    tongVaiLoi: k.tongVaiLoi,
    // ⚠️ Chỉ tính phiếu **đã cắt xong** *(có sản lượng thực)*. Phiếu ⛔ chưa cắt
    // có `total_actual_pcs = 0` và sẽ hiện thành *"thiếu toàn bộ"* — một cảnh
    // báo **sai**, và cảnh báo sai làm người ta thôi đọc cảnh báo.
    phieuThieu: homNay
      .filter((p) => p.total_actual_pcs > 0 && p.total_planned_pcs - p.total_actual_pcs > NGUONG_LECH)
      .map((p) => ({ maPhieu: p.ticket_no, thieu: p.total_planned_pcs - p.total_actual_pcs })),
    phieuVuotDinhMuc: homNay
      .filter((p) => so(p.bom_allowance_m) > 0 && so(p.total_fabric_used_m) > so(p.bom_allowance_m))
      .map((p) => ({
        maPhieu: p.ticket_no,
        vuot: so(p.total_fabric_used_m) - so(p.bom_allowance_m),
      })),
  };
}

