// ============================================================================
// TỔNG QUAN ĐIỀU HÀNH CỦA MD — phép tính thuần cho Command Center
//
// Board Directive 07/08/2026 *(MD Workspace UX Redesign v2)*:
//
//   > *"MD mở MONICA ONE để biết **hôm nay cần làm gì**, **vấn đề nào cần xử
//   > lý**, và **đơn hàng đang ở đâu**. ⛔ Không phải mở để xem dashboard."*
//
// ─── 🔑 VÌ SAO PHÉP TÍNH NẰM Ở ĐÂY, ⛔ KHÔNG Ở MÀN HÌNH ──────────────────
// Cùng những con số này sẽ xuất hiện ở **bảng tổng của giám đốc** và **báo cáo
// ngày**. Mỗi nơi tự đếm là mỗi nơi có cơ hội đếm khác đi — và tới lúc hai màn
// hình lệch nhau thì ⛔ không ai biết bên nào sai.
//
// ⚠️ `V.1` áp ở đây: ⛔ **không có đơn nào** và ⛔ **chưa đọc được đơn nào** là
// hai chuyện khác nhau. Hàm trả `tong = 0` cho cả hai, nên **nơi gọi phải tự
// phân biệt** bằng cờ lỗi của mình — ⛔ đừng để màn hình nói *"0 đơn"* khi sự
// thật là *"⛔ chưa đọc được"*.
// ============================================================================
import type { HanhTrinh, SucKhoe } from './order-journey';
import type { BaoCaoNgay } from './daily-digest';

export interface OMucTieu {
  /** Nhãn ngắn — phải đọc được ở khổ điện thoại. */
  nhan: string;
  /** `null` ⇒ ⚪ **chưa đo được**, ⛔ KHÁC 0. */
  gia: number | null;
  donVi: string;
  /** Câu giải thích khi `gia === null`. */
  vi?: string;
}

export interface TongQuanMd {
  tongPo: number;
  /** Số đơn theo từng mức sức khoẻ. */
  theoSucKhoe: Record<SucKhoe, number>;
  /** Phần trăm đơn **đúng tiến độ** trên tổng — thước đo *"tôi đang kiểm soát"*. */
  phanTramDungTienDo: number | null;
  /** Việc tới hạn **hôm nay hoặc đã quá hạn**. */
  soViecHomNay: number;
  /** Việc **khẩn nhất** — `null` khi hộp thư rỗng. */
  khanNhat: { viec: string; moTa: string } | null;
  /** Thành quả trong ngày — lấy từ báo cáo ngày, ⛔ không tính lại. */
  thanhQua: OMucTieu[];
  /** ⛔ Chưa có báo cáo nào hôm nay. */
  chuaCoBaoCao: boolean;
}

/** Một việc trong hộp thư — chỉ khai **những trường lõi cần**, ⛔ không chép
 *  cả bản ghi.
 *
 *  ⚠️ Hợp đồng `MosTask` ⛔ **không có `dueDate`**; nó quy mọi thứ về
 *  `urgencyDays`: **dương** = đã quá hạn hoặc đã tồn bấy nhiêu ngày, **0** =
 *  đến hạn hôm nay, **âm** = còn hạn. Tôi từng khai nhầm `dueDate` ở bản đầu —
 *  TypeScript bắt được ngay, và đó đúng là việc của nó. */
export interface ViecToiHan {
  title: string;
  urgencyDays: number;
}

const SUC_KHOE_RONG: Record<SucKhoe, number> = { ON_TRACK: 0, AT_RISK: 0, DELAYED: 0 };

export function tongQuanMd(
  hanhTrinh: readonly HanhTrinh[],
  viec: readonly ViecToiHan[],
  baoCao: BaoCaoNgay,
): TongQuanMd {
  const theoSucKhoe = { ...SUC_KHOE_RONG };
  for (const h of hanhTrinh) theoSucKhoe[h.sucKhoe] += 1;

  const tongPo = hanhTrinh.length;

  // ⚠️ ⛔ KHÔNG trả 0% khi ⛔ chưa có đơn nào. `0%` đọc thành *"⛔ không đơn nào
  // đúng tiến độ"* — một phán quyết nặng — trong khi sự thật là *"⛔ chưa có gì
  // để đo"*.
  const phanTramDungTienDo = tongPo === 0
    ? null
    : Math.round((theoSucKhoe.ON_TRACK / tongPo) * 100);

  // Việc *"hôm nay"* = `urgencyDays >= 0`, tức tới hạn hôm nay **hoặc đã quá
  // hạn**. Việc quá hạn ⛔ không được rơi ra khỏi đếm — nó là việc gấp nhất,
  // ⛔ không phải việc đã xong.
  const soViecHomNay = viec.filter((v) => v.urgencyDays >= 0).length;

  const khan = [...viec].sort((a, b) => b.urgencyDays - a.urgencyDays)[0];
  const khanNhat = khan === undefined
    ? null
    : {
      viec: khan.title,
      moTa: khan.urgencyDays > 0
        ? `quá hạn ${khan.urgencyDays} ngày`
        : khan.urgencyDays === 0
          ? 'đến hạn hôm nay'
          : `còn ${-khan.urgencyDays} ngày`,
    };

  // 🔑 Thành quả **lấy nguyên** từ báo cáo ngày, ⛔ không tính lại. Đây là chỗ
  // duy nhất trong màn hình nói *"hôm nay anh đã làm được gì"* — nó phải khớp
  // từng chữ số với báo cáo gửi giám đốc, ⛔ không được là một phép đếm thứ hai.
  const thanhQua: OMucTieu[] = baoCao.chiSo
    .filter((c) => c.nhan !== 'Đạt kế hoạch')
    .map((c) => ({ nhan: c.nhan, gia: c.gia, donVi: c.donVi, vi: c.vi }));

  return {
    tongPo,
    theoSucKhoe,
    phanTramDungTienDo,
    soViecHomNay,
    khanNhat,
    thanhQua,
    chuaCoBaoCao: baoCao.rong,
  };
}
