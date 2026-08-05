import { chieuViec, type WorkItem, type WorkItemRule } from './work-item';
import { progressPercent, defectRatePercent } from '@/lib/garment-math';

// ============================================================================
// LUẬT SINH VIỆC CỦA CHUYỀN MAY — "hôm nay tổ trưởng may cần làm gì?"
//
// ⚠️ Mọi luật chiếu từ `hourly_production_logs` và `needle_break_logs` — hai
// bảng **đang chạy**. ⛔ KHÔNG luật nào cần bảng mới.
//
// ═══ 🔴 MỘT LUẬT Ở ĐÂY ⛔ KHÔNG PHẢI VỀ NĂNG SUẤT — NÓ VỀ AN TOÀN ═══════
// `needle_break_logs.fragments_found` là trường **quan trọng nhất** của cả
// phân hệ này, và nó ⛔ **không** liên quan gì tới sản lượng.
//
// Kim gãy mà **⛔ không tìm thấy đủ mảnh** nghĩa là **một mảnh kim loại có thể
// đang nằm trong lô hàng**. Mọi khách hàng lớn đều kiểm điều này, và hệ quả
// ⛔ không phải *"trừ điểm"* — nó là **giữ hàng, thu hồi, hoặc cắt đơn**.
//
// 🔑 ⛔ Không bảng số liệu nào tự nói ra chuyện đó: sản lượng vẫn đẹp, hiệu suất
//    vẫn cao, và mảnh kim vẫn ở trong thùng hàng.
// ============================================================================

/** Hiệu suất chuyền dưới mức này là việc **khẩn**.
 *
 *  ⚠️ 85% là mức vận hành thường dùng cho chuyền đã ổn định. Chuyền **mới lên
 *  mã** luôn thấp hơn trong vài ngày đầu — đó là **bình thường**, ⛔ không phải
 *  sự cố. Business Owner của Sản xuất quyết con số này *(BA-1 §24)*. */
export const NGUONG_HIEU_SUAT = 85;

/** Tỷ lệ hàng phải sửa lại vượt mức này là **đáng để mắt**. */
export const NGUONG_SUA_LAI = 5;

export interface DuLieuMay {
  soPhieuHomNay: number;
  tongDat: number;
  tongMucTieu: number;
  tongSuaLai: number;
  /** Hiệu suất theo chuyền — chỉ chuyền **có mục tiêu** *(⛔ chia cho 0)*. */
  hieuSuatTheoChuyen: ReadonlyArray<{ chuyen: string; hieuSuat: number }>;
  /** Vụ kim gãy **⛔ chưa tìm đủ mảnh**. Đây là dữ liệu **an toàn sản phẩm**. */
  kimGayChuaTimThay: ReadonlyArray<{ chuyen: string; may: string }>;
}

export const MAY_NEO = {
  /** Bảng sản lượng theo giờ — nơi **nhìn thấy bằng chứng**. */
  nhatKy: '#nhat-ky-may',
  /** Nhật ký kim gãy — nơi **xử lý sự cố an toàn**. */
  kimGay: '#kim-gay',
  /** Biểu mẫu ghi sản lượng — nơi **làm cho việc biến mất**. */
  ghiSanLuong: '#ghi-san-luong',
} as const;

const LUAT: WorkItemRule<DuLieuMay>[] = [
  {
    // 🔴 ĐẶT ĐẦU TIÊN, TRÊN CẢ "⛔ CHƯA GHI SẢN LƯỢNG".
    //
    // Mọi luật khác nói về **tiền**; luật này nói về **hàng có thể phải thu
    // hồi**. Một ngày mất sản lượng còn bù được; một mảnh kim đi theo container
    // thì ⛔ không.
    id: 'may.kim-gay-chua-tim-thay',
    severity: 'CRITICAL',
    labelKey: 'work.may.kimGayChuaTimThay',
    danhGia: (d) => {
      if (d.kimGayChuaTimThay.length === 0) return { nổ: false };
      const v = d.kimGayChuaTimThay[0];
      return {
        nổ: true,
        vars: { soVu: d.kimGayChuaTimThay.length, chuyen: v.chuyen, may: v.may },
        href: MAY_NEO.kimGay,
      };
    },
  },
  {
    id: 'may.chua-ghi-san-luong',
    severity: 'CRITICAL',
    labelKey: 'work.may.chuaGhiSanLuong',
    danhGia: (d) =>
      d.soPhieuHomNay === 0 ? { nổ: true, href: MAY_NEO.ghiSanLuong } : { nổ: false },
  },
  {
    id: 'may.hieu-suat-thap',
    severity: 'CRITICAL',
    labelKey: 'work.may.hieuSuatThap',
    danhGia: (d) => {
      if (d.soPhieuHomNay === 0 || d.tongMucTieu === 0) return { nổ: false };
      // ⚠️ Gọi lại `progressPercent`, ⛔ KHÔNG tự viết `(đạt/mục tiêu)*100`.
      const hs = progressPercent(d.tongDat, d.tongMucTieu);
      return hs < NGUONG_HIEU_SUAT
        ? { nổ: true, vars: { hieuSuat: hs.toFixed(1), nguong: NGUONG_HIEU_SUAT }, href: MAY_NEO.nhatKy }
        : { nổ: false };
    },
  },
  {
    id: 'may.chuyen-tut-lai',
    severity: 'WARNING',
    labelKey: 'work.may.chuyenTutLai',
    danhGia: (d) => {
      // Chuyền **thấp nhất**, và chỉ khi nó thật sự dưới ngưỡng — ⛔ không nhắc
      // chuyền thấp nhất khi **cả nhà máy đang chạy tốt**.
      const thap = [...d.hieuSuatTheoChuyen].sort((a, b) => a.hieuSuat - b.hieuSuat)[0];
      return thap && thap.hieuSuat < NGUONG_HIEU_SUAT
        ? { nổ: true, vars: { chuyen: thap.chuyen, hieuSuat: thap.hieuSuat.toFixed(0) }, href: MAY_NEO.nhatKy }
        : { nổ: false };
    },
  },
  {
    id: 'may.sua-lai-nhieu',
    severity: 'WARNING',
    labelKey: 'work.may.suaLaiNhieu',
    danhGia: (d) => {
      if (d.tongDat === 0) return { nổ: false };
      const tyLe = defectRatePercent(d.tongSuaLai, d.tongDat);
      return tyLe > NGUONG_SUA_LAI
        ? { nổ: true, vars: { tyLe: tyLe.toFixed(1), nguong: NGUONG_SUA_LAI }, href: MAY_NEO.nhatKy }
        : { nổ: false };
    },
  },
  {
    // ⚠️ ⛔ KHÔNG có `href` — lời trấn an, ⛔ không phải việc phải làm.
    id: 'may.on-dinh',
    severity: 'INFO',
    labelKey: 'work.may.onDinh',
    danhGia: (d) =>
      d.soPhieuHomNay > 0 ? { nổ: true, vars: { soPhieu: d.soPhieuHomNay } } : { nổ: false },
  },
];

export function viecCuaMay(d: DuLieuMay): WorkItem[] {
  const tatCa = chieuViec(LUAT, d);
  const viecThat = tatCa.filter((v) => v.severity !== 'INFO');
  return viecThat.length > 0 ? viecThat : tatCa;
}
