import { cuttingWastePercent } from '@/lib/garment-math';
import { laHomNayVN, ngayVN, ngayVNCua } from '@/lib/time';
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


// ============================================================================
// DỮ LIỆU VẼ CHO TỔ CẮT — Board 06/08/2026: *"luôn ưu tiên trực quan, biểu đồ"*
//
// 🔑 Tổ trưởng cắt hỏi đúng **hai câu** mỗi ngày:
//   ① *"Bàn nào cắt thiếu so với kế hoạch?"*  — sản lượng
//   ② *"Bàn nào ăn vải vượt định mức?"*       — tiền
//
// Bảng phiếu cắt trả lời được cả hai, nhưng bắt **trừ nhẩm từng dòng**. Hai
// biểu đồ cột trả lời trong một cái liếc — và tổ trưởng đang đứng ở bàn cắt,
// ⛔ không ngồi bàn giấy.
//
// ─── 🔴 VÌ SAO ⛔ KHÔNG KHOÁ CỨNG VÀO "HÔM NAY" ─────────────────────────
// Bản đầu tôi lọc đúng `laHomNayVN`. Mở `/to-truong-cat` bằng phiên `cat001`
// thật: **0 biểu đồ** — vì hôm nay chưa bàn nào cắt. Nhà máy ⛔ không cắt mỗi
// ngày; một hộp trống mỗi sáng thì tổ trưởng thôi nhìn sau đúng ba hôm.
//
// ⇒ Ưu tiên **hôm nay**; hôm nay ⛔ chưa có thì lùi về **ngày cắt gần nhất**
// và **ghi rõ ngày đó ra tiêu đề**. Đây ⛔ **không** phải bịa dữ liệu — nó là
// dữ liệu thật, chỉ khác là màn hình **nói thẳng nó của ngày nào** thay vì để
// người đọc tưởng là hôm nay.
// ============================================================================

/** Ngày nên vẽ: **hôm nay** nếu có phiếu, ⛔ không thì **ngày cắt gần nhất**.
 *  `null` khi ⛔ chưa có phiếu nào. */
export function ngayVeCat(phieu: readonly PhieuCat[]): string | null {
  const ngay = phieu
    .map((p) => ngayVNCua(p.created_at ?? null))
    .filter((d): d is string => Boolean(d));
  if (ngay.length === 0) return null;
  const homNay = ngayVN();
  return ngay.includes(homNay) ? homNay : ngay.sort().at(-1) ?? null;
}

// ============================================================================
// DỮ LIỆU VẼ CHO TỔ CẮT — Board 06/08/2026: *"luôn ưu tiên trực quan, biểu đồ"*
//
// 🔑 Tổ trưởng cắt hỏi đúng **hai câu** mỗi ngày:
//   ① *"Bàn nào cắt thiếu so với kế hoạch?"*  — sản lượng
//   ② *"Bàn nào ăn vải vượt định mức?"*       — tiền
//
// Bảng phiếu cắt trả lời được cả hai, nhưng bắt **trừ nhẩm từng dòng**. Hai
// biểu đồ cột trả lời trong một cái liếc — và tổ trưởng đang đứng ở bàn cắt,
// ⛔ không ngồi bàn giấy.
// ============================================================================

export interface CotPhieuCat {
  phieu: string;
  'Kế hoạch': number;
  'Thực cắt': number;
  /** Thiếu so với kế hoạch. `0` khi đủ hoặc vượt. */
  thieu: number;
}

export interface CotHaoHutCat {
  phieu: string;
  /** Hao hụt vải, phần trăm — con số mang phán quyết của khâu cắt. */
  hao: number;
  daTrai: number;
  dauTam: number;
  vaiLoi: number;
}

/** Kế hoạch ⟷ thực cắt của **các phiếu hôm nay**.
 *
 *  ⚠️ CHỈ lấy phiếu **đã cắt** *(`total_actual_pcs > 0`)*, đúng như
 *  `duLieuCatHomNay` đã làm. Phiếu chưa cắt có thực tế `0` và sẽ vẽ thành một
 *  cột trống cạnh cột kế hoạch cao ngất — trông y hệt *"cắt hụt toàn bộ"*.
 *  Đó là **lời buộc tội sai**, và biểu đồ buộc tội sai thì tổ trưởng thôi nhìn
 *  biểu đồ. */
export function cotPhieuCat(phieu: readonly PhieuCat[], ngay: string | null): CotPhieuCat[] {
  if (!ngay) return [];
  return phieu
    .filter((p) => ngayVNCua(p.created_at ?? null) === ngay && p.total_actual_pcs > 0)
    .map((p) => ({
      phieu: p.ticket_no,
      'Kế hoạch': so(p.total_planned_pcs),
      'Thực cắt': so(p.total_actual_pcs),
      thieu: Math.max(0, so(p.total_planned_pcs) - so(p.total_actual_pcs)),
    }));
}

/** Hao hụt vải theo từng phiếu, cùng ngày với biểu đồ sản lượng.
 *
 * ─── 🔴 VÌ SAO ⛔ KHÔNG VẼ "ĐỊNH MỨC ⟷ ĐÃ DÙNG" ────────────────────────
 * Bản đầu tôi vẽ đúng cặp đó. Đọc số thật trong CSDL thì thấy ⛔ không so được:
 *
 *     SEED-CT-01   bom_allowance_m = 2.5     total_fabric_used_m = 828.4
 *     PK-2026-001  bom_allowance_m = 70      total_fabric_used_m = 85
 *
 * `2.5` cho 1.188 sp rõ ràng là **mét trên MỘT sản phẩm**; `70` cho 50 sp lại
 * giống **tổng mét**. Cùng một cột đang mang **hai đơn vị khác nhau**.
 *
 * ⚠️ Hệ quả có sẵn từ trước, ⛔ không phải do tôi: `duLieuCatHomNay` gắn cờ
 * *"vượt định mức"* khi `total_fabric_used_m > bom_allowance_m` — với đơn vị
 * lệch nhau thì cờ đó **bật cho MỌI phiếu**. Cảnh báo đúng-100%-số-dòng là
 * cảnh báo ⛔ không mang tin gì, và người dùng sẽ thôi đọc nó.
 *
 * 🔑 Ý nghĩa của `bom_allowance_m` là **quyết định nghiệp vụ**, ⛔ không phải
 * chuyện engineering đoán được ⇒ gác lại cho Board *(`G-6`)*.
 *
 * ⇒ Chỗ này vẽ **hao hụt %** thay thế: mọi đại lượng của nó *(đã trải · đầu
 * tấm · vải lỗi)* đều là **mét tổng**, cùng đơn vị, ⛔ không mơ hồ. Nó cũng
 * chính là con số `tyLeHaoHut` mà thẻ KPI phía trên đang hiện — nay tách được
 * ra **từng phiếu** thay vì chỉ một số gộp.
 *
 * ⚠️ ⛔ KHÔNG tô màu theo ngưỡng: **⛔ chưa có ngưỡng hao hụt nào được Board
 * phê duyệt**. Tự đặt một con số rồi tô đỏ là để phần mềm phán quyết thay
 * Board — xem `G-6`.
 */
export function cotHaoHutCat(phieu: readonly PhieuCat[], ngay: string | null): CotHaoHutCat[] {
  if (!ngay) return [];
  return phieu
    .filter((p) => ngayVNCua(p.created_at ?? null) === ngay && so(p.total_fabric_used_m) > 0)
    .map((p) => {
      const daTrai = so(p.total_fabric_used_m);
      const dauTam = so(p.remnant_length_m);
      const vaiLoi = so(p.defect_length_m);
      return {
        phieu: p.ticket_no,
        hao: cuttingWastePercent(daTrai, daTrai - dauTam - vaiLoi),
        daTrai,
        dauTam,
        vaiLoi,
      };
    });
}
