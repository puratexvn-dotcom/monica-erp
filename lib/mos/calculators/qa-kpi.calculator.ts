import { defectRatePercent, dhu, rftPercent } from '@/lib/garment-math';
import { laHomNayVN } from '@/lib/time';
import type { DuLieuQA } from '@/lib/mos/workspace/qa-work-items';

// ============================================================================
// KPI CỦA QA — PHÉP TÍNH DẪN XUẤT, ⛔ KHÔNG LƯU VÀO CSDL
//
// ═══ VÌ SAO TỆP NÀY TỒN TẠI ════════════════════════════════════════════
// Trước bản này, `app/(dashboard)/qa/page.tsx` tự cộng bằng bốn lệnh `.reduce`
// **ngay trong thân màn hình**. Ba hệ quả, và cả ba đều đã thành luật:
//
//   ① Màn hình ⛔ kiểm được — muốn kiểm phép tính phải dựng cả React.
//   ② Màn hình thứ hai cần cùng con số sẽ **chép lại** phép tính, và hai bản
//      chép sẽ trôi khỏi nhau. *(Đúng cách `F-2` ra đời.)*
//   ③ Phép kiểm `⑭` cấm màn hình tự tính số nghiệp vụ.
//
// ⚠️ Và một điều nữa: `defectRatePercent`, `dhu`, `rftPercent` **đã có sẵn**
// ở `lib/garment-math.ts` từ lâu. Màn hình cũ tự viết `(loi/kiem)*100` thay vì
// gọi chúng — tức công thức ngành may có **hai bản** trong cùng một kho.
//
// 🔑 Tệp này ⛔ **không phát minh phép tính nào**. Nó chỉ **gom** và **gọi
//    đúng** thứ đã có.
//
// ⚠️ ⛔ KHÔNG lưu kết quả xuống CSDL. Tỷ lệ lỗi là **hệ quả** của phiếu kiểm;
// lưu nó xuống là tạo một sự thật thứ hai có thể lệch khỏi sự thật gốc.
// ============================================================================

/** Hình dạng **hẹp nhất** đủ để tính. Cố ý ⛔ không nhận `QAReport` của tầng
 *  app: nhận hẹp thì hàm này kiểm được ⛔ không cần CSDL, và dùng lại được cho
 *  Workspace khác về sau. */
export interface PhieuKiem {
  line_name: string;
  inspected_qty: number;
  passed_qty: number;
  defect_qty: number;
  created_at?: string | null;
  qa_defects?: ReadonlyArray<{ defect_type: string; quantity: number }> | null;
}

export interface KpiQA {
  tongKiem: number;
  tongDat: number;
  tongLoi: number;
  /** Phần trăm, một chữ số thập phân. */
  tyLeLoi: number;
  /** Lỗi trên trăm sản phẩm — chỉ số chuẩn ngành. */
  dhu: number;
  /** Đạt ngay lần đầu, phần trăm. */
  rft: number;
}

/**
 * Cộng KPI trên một tập phiếu kiểm.
 *
 * ⚠️ Tập **rỗng** trả về toàn số 0 — ⛔ **không** trả `null`, và cũng ⛔ không
 * trả `NaN`. `defectRatePercent` đã chặn chia cho 0; điều còn lại là ⛔ không
 * để `undefined` lọt ra HTML *(nghi thức nghiệm thu §5 mục 3)*.
 *
 * 🔑 *"⛔ Chưa đo được"* và *"đo được, bằng 0"* là **hai câu khác nhau** —
 * phân biệt chúng là việc của màn hình *(số phiếu = 0 ⇒ hiện trạng thái rỗng)*,
 * ⛔ không phải việc của hàm này.
 */
export function kpiQA(phieu: readonly PhieuKiem[]): KpiQA {
  let tongKiem = 0;
  let tongDat = 0;
  let tongLoi = 0;

  for (const p of phieu) {
    tongKiem += p.inspected_qty;
    tongDat += p.passed_qty;
    tongLoi += p.defect_qty;
  }

  return {
    tongKiem,
    tongDat,
    tongLoi,
    tyLeLoi: defectRatePercent(tongLoi, tongKiem),
    dhu: dhu(tongLoi, tongKiem),
    rft: rftPercent(tongDat, tongKiem),
  };
}

/**
 * Gom dữ liệu **trong ngày** cho bộ luật sinh việc.
 *
 * ⚠️ *"Hôm nay"* tính theo **giờ Việt Nam**, qua `laHomNayVN` — ⛔ **không**
 * bằng `new Date().toDateString()`. Máy chủ chạy UTC: từ 00:00 tới 07:00 giờ
 * VN, phép so theo UTC sẽ coi ca đêm là *"hôm qua"*, và hộp thư việc của QA ca
 * đêm sẽ **trống trơn** đúng lúc họ cần nó nhất.
 *
 * 🔑 `lib/time.ts` là **nguồn sự thật duy nhất** cho giờ VN; phép kiểm kiến
 *    trúc cấm viết `7 * 3600 * 1000` ở bất cứ đâu.
 */
export function duLieuQAHomNay(phieu: readonly PhieuKiem[]): DuLieuQA {
  const homNay = phieu.filter((p) => laHomNayVN(p.created_at ?? null));
  const k = kpiQA(homNay);

  const theoChuyen = new Map<string, number>();
  const theoLoai = new Map<string, number>();

  for (const p of homNay) {
    if (p.defect_qty > 0) {
      theoChuyen.set(p.line_name, (theoChuyen.get(p.line_name) ?? 0) + p.defect_qty);
    }
    for (const d of p.qa_defects ?? []) {
      // Đếm **SỐ LẦN XUẤT HIỆN** của loại lỗi, ⛔ không cộng số lượng.
      // *"Lỗi bỏ mũi xuất hiện ở ba phiếu khác nhau"* là tín hiệu xu hướng;
      // *"một phiếu ghi 30 cái bỏ mũi"* là một sự cố đơn lẻ. Luật `qa.loi-lap-lai`
      // đi tìm **xu hướng**, nên nó phải đếm theo phiếu.
      theoLoai.set(d.defect_type, (theoLoai.get(d.defect_type) ?? 0) + 1);
    }
  }

  return {
    soPhieuHomNay: homNay.length,
    tongKiem: k.tongKiem,
    tongLoi: k.tongLoi,
    loiTheoChuyen: [...theoChuyen].map(([chuyen, soLoi]) => ({ chuyen, soLoi })),
    loiTheoLoai: [...theoLoai].map(([loai, soLan]) => ({ loai, soLan })),
  };
}
