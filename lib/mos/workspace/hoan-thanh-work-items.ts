import { chieuViec, type WorkItem, type WorkItemRule } from './work-item';
import { defectRatePercent } from '@/lib/garment-math';

// ============================================================================
// LUẬT SINH VIỆC CỦA TỔ HOÀN THÀNH — "hôm nay tổ trưởng hoàn thành cần làm gì?"
//
// ⚠️ Mọi luật chiếu từ `cut_bundles` · `finishing_logs` · `cartons` — ba bảng
// **đang chạy**. ⛔ KHÔNG luật nào cần bảng mới, ⛔ không migration nào.
//
// ═══ 🔴 LUẬT ĐẦU TIÊN ⛔ KHÔNG PHẢI VỀ NĂNG SUẤT — NÓ VỀ TIỀN ĐI RA ═════
// `dongVuotPO` so **số đã đóng thùng** với **số của đơn**. Đóng vượt nghĩa là
// hàng **rời nhà máy nhiều hơn số khách đặt** — và ⛔ không ai đòi lại được sau
// khi container đã niêm phong.
//
// 🔑 Cái bẫy: **mọi chỉ số khác vẫn đẹp**. Final QC đạt cao, ⛔ không lỗi, thùng
// đóng đều tay — bảng số liệu **⛔ không hề nói** rằng PO đã đủ từ ba thùng
// trước. Màn hình cũ có cảnh báo này, nhưng nó nằm **trong một `<option>` của ô
// chọn**, tức người dùng chỉ thấy nó **sau khi đã mở danh sách để đóng tiếp**.
// ⇒ Nay nó là **việc đứng đầu hộp thư**, thấy trước khi kịp bấm.
//
// ═══ ⚠️ ĐIỀU NÀY ⛔ CHƯA ĐO ĐƯỢC — nói rõ thay vì lặng lẽ bỏ ══════════════
// ⛔ **Không luật nào ở đây lọc theo NGÀY.** `getFinishingAndPackingData()` gộp
// `finishing_logs` bằng `reduce` và ⛔ không lấy `created_at` của từng dòng, nên
// *"hôm nay đã ghi nhận ⛔ chưa"* là câu hỏi **⛔ không trả lời được** với dữ
// liệu đang có. Chuyền may làm được vì nó đọc `created_at` của từng phiếu giờ.
//
// ⇒ Thêm luật theo ngày là **đổi câu `select`**, ⛔ không phải đổi tệp này.
// ⛔ **Đừng** bịa một luật *"hôm nay"* đo trên số cộng dồn — nó sẽ **im lặng
// vĩnh viễn** sau ngày đầu tiên, và im lặng thì trông y hệt *"⛔ không có vấn
// đề gì"*.
// ============================================================================

/** Tỷ lệ lỗi Final QC vượt mức này là **đáng để mắt**.
 *
 *  ⚠️ 3% là mức thường dùng cho kiểm cuối chuyền, ⛔ **không** phải AQL — AQL
 *  2.5 là luật **nghiệm thu lô** của QA *(`lib/garment-math.ts`)*, còn con số
 *  này đo **chất lượng đầu ra của tổ hoàn thành**. Hai phép đo khác nhau, ⛔
 *  đừng gộp. Business Owner của Sản xuất quyết con số này *(BA-1 §24)*. */
export const NGUONG_LOI_FINAL_QC = 3;

/** Số thùng đứng tại xưởng vượt mức này thì **dòng chảy đang tắc ở cuối**.
 *
 *  ⚠️ Thùng đã đóng mà ⛔ chưa nhập kho thành phẩm là hàng **⛔ không ai đếm
 *  được**: xưởng coi như đã xong, kho coi như ⛔ chưa có. Đó đúng là khoảng
 *  trống mà hàng biến mất trong đó. */
export const NGUONG_THUNG_CHO_NHAP = 20;

export interface DuLieuHoanThanh {
  /** Tổng số bundle đang theo dõi — dùng để phân biệt *"⛔ chưa có dữ liệu"*
   *  với *"⛔ chưa ai làm gì"*. */
  soBundle: number;
  /** Số sản phẩm đã qua Final QC và **đạt**. */
  tongDat: number;
  /** Số sản phẩm Final QC **lỗi**. */
  tongLoi: number;
  /** Tổng đã kiểm = đạt + lỗi. Mẫu số của tỷ lệ lỗi. */
  tongKiem: number;
  /** Bundle **đã qua Final QC** mà ⛔ chưa đóng thùng — hàng đứng chờ. */
  choDongThung: ReadonlyArray<{ bundle: string; po: string }>;
  /** Bundle **ủi tụt sau cắt chỉ** — nghẽn ở khâu giữa. */
  nghenUi: ReadonlyArray<{ bundle: string; catChi: number; ui: number }>;
  /** 🔴 PO đã đóng thùng **vượt số của đơn**. */
  dongVuotPO: ReadonlyArray<{ po: string; daDong: number; theoDon: number }>;
  /** Số thùng đã đóng còn đứng tại xưởng, ⛔ chưa nhập kho thành phẩm. */
  soThungTaiXuong: number;
}

/**
 * Neo điều hướng của phân hệ.
 *
 * ⚠️ Mang **cả `?tab=`**, ⛔ không chỉ mảnh `#`. Trang này chia hai tab bằng
 * `searchParams`, nên nửa số neo **⛔ không tồn tại trong DOM** khi tab kia
 * đang mở — một `href="#dong-thung"` bấm từ tab *Kiểm soát* sẽ ⛔ không đi đâu
 * cả, và người dùng đọc ra đó là **giao diện hỏng**.
 */
export const HOAN_THANH_NEO = {
  /** Bảng WIP — nơi **nhìn thấy bằng chứng**. */
  wip: '/hoan-thanh?tab=finishing#wip-hoan-thanh',
  /** Biểu mẫu ghi Final QC — nơi **làm cho việc biến mất**. */
  ghiQC: '/hoan-thanh?tab=finishing#ghi-qc',
  /** Biểu mẫu đóng thùng. */
  dongThung: '/hoan-thanh?tab=packing#dong-thung',
  /** Danh sách thùng tại xưởng — nơi **xử lý hàng tồn cuối chuyền**. */
  thungTaiXuong: '/hoan-thanh?tab=packing#thung-tai-xuong',
} as const;

const LUAT: WorkItemRule<DuLieuHoanThanh>[] = [
  {
    // 🔴 ĐẶT ĐẦU TIÊN. Mọi luật khác nói về **nhịp sản xuất**; luật này nói về
    // **hàng đã rời nhà máy nhiều hơn số khách đặt**.
    id: 'hoanThanh.dong-vuot-po',
    severity: 'CRITICAL',
    labelKey: 'work.hoanThanh.dongVuotPO',
    danhGia: (d) => {
      if (d.dongVuotPO.length === 0) return { nổ: false };
      const v = d.dongVuotPO[0];
      return {
        nổ: true,
        vars: { soPO: d.dongVuotPO.length, po: v.po, daDong: v.daDong, theoDon: v.theoDon },
        href: HOAN_THANH_NEO.thungTaiXuong,
      };
    },
  },
  {
    // Có bundle để làm mà **⛔ chưa kiểm một cái nào** — tổ ⛔ chưa vào việc,
    // hoặc ⛔ chưa ai ghi nhận. Hai khả năng đều cần người mở màn hình.
    id: 'hoanThanh.chua-kiem-cai-nao',
    severity: 'CRITICAL',
    labelKey: 'work.hoanThanh.chuaKiemCaiNao',
    danhGia: (d) =>
      d.soBundle > 0 && d.tongKiem === 0
        ? { nổ: true, vars: { soBundle: d.soBundle }, href: HOAN_THANH_NEO.ghiQC }
        : { nổ: false },
  },
  {
    id: 'hoanThanh.cho-dong-thung',
    severity: 'CRITICAL',
    labelKey: 'work.hoanThanh.choDongThung',
    danhGia: (d) =>
      d.choDongThung.length > 0
        ? {
            nổ: true,
            vars: { soBundle: d.choDongThung.length, bundle: d.choDongThung[0].bundle },
            href: HOAN_THANH_NEO.dongThung,
          }
        : { nổ: false },
  },
  {
    id: 'hoanThanh.ty-le-loi-cao',
    severity: 'WARNING',
    labelKey: 'work.hoanThanh.tyLeLoiCao',
    danhGia: (d) => {
      if (d.tongKiem === 0) return { nổ: false };
      // ⚠️ Gọi lại `defectRatePercent`, ⛔ KHÔNG tự viết `(lỗi/kiểm)*100`.
      const tyLe = defectRatePercent(d.tongLoi, d.tongKiem);
      return tyLe > NGUONG_LOI_FINAL_QC
        ? {
            nổ: true,
            vars: { tyLe: tyLe.toFixed(1), nguong: NGUONG_LOI_FINAL_QC, soLoi: d.tongLoi },
            href: HOAN_THANH_NEO.wip,
          }
        : { nổ: false };
    },
  },
  {
    id: 'hoanThanh.nghen-ui',
    severity: 'WARNING',
    labelKey: 'work.hoanThanh.nghenUi',
    danhGia: (d) => {
      if (d.nghenUi.length === 0) return { nổ: false };
      const v = d.nghenUi[0];
      return {
        nổ: true,
        vars: { soBundle: d.nghenUi.length, bundle: v.bundle, catChi: v.catChi, ui: v.ui },
        href: HOAN_THANH_NEO.wip,
      };
    },
  },
  {
    id: 'hoanThanh.thung-un-tai-xuong',
    severity: 'WARNING',
    labelKey: 'work.hoanThanh.thungUnTaiXuong',
    danhGia: (d) =>
      d.soThungTaiXuong > NGUONG_THUNG_CHO_NHAP
        ? {
            nổ: true,
            vars: { soThung: d.soThungTaiXuong, nguong: NGUONG_THUNG_CHO_NHAP },
            href: HOAN_THANH_NEO.thungTaiXuong,
          }
        : { nổ: false },
  },
  {
    // ⚠️ ⛔ KHÔNG có `href` *(`P33`)* — lời trấn an, ⛔ không phải việc phải làm.
    id: 'hoanThanh.on-dinh',
    severity: 'INFO',
    labelKey: 'work.hoanThanh.onDinh',
    danhGia: (d) =>
      d.tongKiem > 0 ? { nổ: true, vars: { tongDat: d.tongDat } } : { nổ: false },
  },
];

/**
 * Việc của tổ hoàn thành.
 *
 * 🔑 Cùng khuôn `viecCuaMay`: có việc thật thì **giấu dòng trấn an**. Một hộp
 * thư vừa báo *"đóng vượt PO"* vừa báo *"mọi thứ ổn định"* là hộp thư **tự mâu
 * thuẫn**, và người dùng sẽ thôi đọc cả hai.
 */
export function viecCuaHoanThanh(d: DuLieuHoanThanh): WorkItem[] {
  const tatCa = chieuViec(LUAT, d);
  const viecThat = tatCa.filter((v) => v.severity !== 'INFO');
  return viecThat.length > 0 ? viecThat : tatCa;
}
