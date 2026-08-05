import { chieuViec, type WorkItem, type WorkItemRule } from './work-item';
import { cuttingWastePercent } from '@/lib/garment-math';

// ============================================================================
// LUẬT SINH VIỆC CỦA TỔ CẮT — "hôm nay tổ cắt cần làm gì?"
//
// ⚠️ Mọi luật chiếu từ `cut_tickets` — bảng **đang chạy, đang có dữ liệu**.
// ⛔ KHÔNG luật nào cần một bảng mới.
//
// ═══ VÌ SAO CẮT LÀ KHÂU ĐÁNG CANH NHẤT ═════════════════════════════════
// Vải chiếm phần lớn giá thành một mã hàng, và **cắt là khâu DUY NHẤT tiêu vải
// ⛔ không hoàn lại được**. Một sơ đồ tồi làm hao thêm vài phần trăm — con số
// nghe nhỏ, nhưng nó nhân với **toàn bộ đơn hàng** và **⛔ không có cách nào
// lấy lại**.
//
// 🔑 Sau khi trải và cắt, mọi mét vải hỏng là **mất vĩnh viễn**. Đó là lý do
//    luật ở đây canh **hao hụt** chặt hơn hẳn các khâu sau.
// ============================================================================

/** Ngưỡng hao hụt cắt — vượt là việc **khẩn**.
 *
 *  ⚠️ 3% là mức thường dùng cho hàng dệt thoi cơ bản. Đây là **ngưỡng vận
 *  hành**, ⛔ không phải hằng số ngành: hàng kẻ sọc, hàng cần canh hoa văn có
 *  mức cao hơn hẳn. Business Owner của Sản xuất quyết *(BA-1 §24)*, ⛔ không
 *  phải người dựng màn hình.
 *
 *  ⚠️ Và nó **cố ý bằng** ngưỡng lỗi của QA — hai con số **⛔ không liên quan
 *  gì tới nhau**, chỉ tình cờ trùng. Đổi cái này ⛔ **không** được đổi cái kia. */
export const NGUONG_HAO_HUT = 3;

/** Chênh lệch sản lượng so với kế hoạch — quá mức này là **đáng hỏi**.
 *
 *  Cắt thiếu ⇒ chuyền may **⛔ không đủ bán thành phẩm** và sẽ đứng; cắt thừa
 *  ⇒ tốn vải mà ⛔ không ai trả tiền. Cả hai chiều đều là việc. */
export const NGUONG_LECH_PCS = 0;

/** Hình dạng **hẹp nhất** đủ cho các luật. Kiểm được ⛔ không cần CSDL. */
export interface DuLieuCat {
  soPhieuHomNay: number;
  tongVaiDaTrai: number;
  tongDauTam: number;
  tongVaiLoi: number;
  /** Phiếu cắt **thiếu** so với kế hoạch — chỉ những phiếu thật sự thiếu. */
  phieuThieu: ReadonlyArray<{ maPhieu: string; thieu: number }>;
  /** Phiếu dùng vải **vượt định mức BOM**. */
  phieuVuotDinhMuc: ReadonlyArray<{ maPhieu: string; vuot: number }>;
}

/** Nơi xử lý của từng việc — khai ở **lõi thuần** vì neo là **một phần của
 *  luật** *(việc này xử lý ở đâu)*, ⛔ không phải chi tiết trình bày. */
export const CAT_NEO = {
  /** Bảng phiếu cắt — nơi **nhìn thấy bằng chứng**. */
  nhatKy: '#nhat-ky-cat',
  /** Biểu mẫu lập phiếu — nơi **làm cho việc biến mất**. */
  lapPhieu: '#lap-phieu-cat',
} as const;

const LUAT: WorkItemRule<DuLieuCat>[] = [
  {
    // Cùng loại với `qa.chua-kiem`: việc quan trọng nhất là việc **⛔ chưa xảy
    // ra**. Tổ cắt ⛔ không lập phiếu thì chuyền may **sắp đứng**, và bảng số
    // liệu hôm nay trông **sạch bong** vì ⛔ không có hao hụt nào được ghi.
    id: 'cat.chua-lap-phieu',
    severity: 'CRITICAL',
    labelKey: 'work.cat.chuaLapPhieu',
    danhGia: (d) =>
      d.soPhieuHomNay === 0 ? { nổ: true, href: CAT_NEO.lapPhieu } : { nổ: false },
  },
  {
    id: 'cat.vuot-hao-hut',
    severity: 'CRITICAL',
    labelKey: 'work.cat.vuotHaoHut',
    danhGia: (d) => {
      if (d.soPhieuHomNay === 0 || d.tongVaiDaTrai === 0) return { nổ: false };
      // ⚠️ Gọi lại `cuttingWastePercent` của `garment-math`, ⛔ KHÔNG tự viết
      // `(hao/trai)*100`. Công thức ngành may chỉ được có **MỘT** bản trong kho.
      const haoHut = cuttingWastePercent(d.tongVaiDaTrai, d.tongVaiDaTrai - d.tongDauTam - d.tongVaiLoi);
      return haoHut > NGUONG_HAO_HUT
        ? { nổ: true, vars: { tyLe: haoHut.toFixed(1), nguong: NGUONG_HAO_HUT }, href: CAT_NEO.nhatKy }
        : { nổ: false };
    },
  },
  {
    // 🔑 Cắt THIẾU là việc **chặn khâu sau**, ⛔ không phải việc của riêng tổ
    //    cắt. Chuyền may ⛔ không đủ bán thành phẩm thì đứng — và lúc đó
    //    ⛔ không ai truy được nguyên nhân nằm ở phiếu cắt nào.
    id: 'cat.cat-thieu',
    severity: 'WARNING',
    labelKey: 'work.cat.catThieu',
    danhGia: (d) => {
      if (d.phieuThieu.length === 0) return { nổ: false };
      const nang = [...d.phieuThieu].sort((a, b) => b.thieu - a.thieu)[0];
      return { nổ: true, vars: { maPhieu: nang.maPhieu, thieu: nang.thieu }, href: CAT_NEO.nhatKy };
    },
  },
  {
    id: 'cat.vuot-dinh-muc',
    severity: 'WARNING',
    labelKey: 'work.cat.vuotDinhMuc',
    danhGia: (d) => {
      if (d.phieuVuotDinhMuc.length === 0) return { nổ: false };
      const nang = [...d.phieuVuotDinhMuc].sort((a, b) => b.vuot - a.vuot)[0];
      return { nổ: true, vars: { maPhieu: nang.maPhieu, vuot: nang.vuot.toFixed(1) }, href: CAT_NEO.nhatKy };
    },
  },
  {
    // ⚠️ ⛔ KHÔNG có `href`: đây là lời trấn an, ⛔ không phải việc phải làm.
    id: 'cat.on-dinh',
    severity: 'INFO',
    labelKey: 'work.cat.onDinh',
    danhGia: (d) =>
      d.soPhieuHomNay > 0 ? { nổ: true, vars: { soPhieu: d.soPhieuHomNay } } : { nổ: false },
  },
];

/**
 * Việc của tổ cắt trong ngày.
 *
 * 🔑 Có việc thật ⇒ dòng *"ổn định"* **biến mất**. Hộp thư việc nói **một** câu
 * chuyện, ⛔ không nói hai câu ngược nhau rồi để người dùng chọn tin cái nào.
 */
export function viecCuaCat(d: DuLieuCat): WorkItem[] {
  const tatCa = chieuViec(LUAT, d);
  const viecThat = tatCa.filter((v) => v.severity !== 'INFO');
  return viecThat.length > 0 ? viecThat : tatCa;
}
