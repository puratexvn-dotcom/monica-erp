// ============================================================================
// BÁO CÁO NGÀY CỦA MD — LOGIC THUẦN
//
// Board 06/08/2026: *"Mỗi ngày MD chỉ cần **kiểm tra lại các báo cáo** và cập
// nhật những thông tin liên quan là nó có thể **tự tổng hợp** lại thành một
// báo cáo trực quan gửi cho CEO và Production Director."*
//
// ⛔ Không React, ⛔ không CSDL. Giám đốc mở bảng tổng của mình rồi cũng phải
// thấy **đúng những con số này** — hai nơi tự tính là hai nơi sẽ lệch.
//
// ─── 🔑 BÁO CÁO NÀY TỔNG HỢP, ⛔ KHÔNG PHÁT MINH ──────────────────────────
// Mọi con số dưới đây **đến từ báo cáo của người khác**: tổ trưởng ghi sản
// lượng giờ, QA ghi biên bản kiểm, nhà thầu ghi báo cáo ngày. MD ⛔ không nhập
// lại gì cả — đó chính là câu *"chỉ cần kiểm tra lại"* của Board.
//
// ⚠️ **⛔ KHÔNG kết luận trên dữ liệu RỖNG** *(`V.1`)*. Ngày ⛔ chưa ai báo cáo
// thì digest nói **"⚪ chưa có báo cáo"**, ⛔ KHÔNG nói "0 sản phẩm" — hai câu
// đó khác nhau, và gộp lại là để báo cáo nói dối sếp.
// ============================================================================

/** Sản lượng một tổ/chuyền trong ngày — do tổ trưởng báo. */
export interface DongSanLuong {
  department: string | null;
  target_qty: number;
  actual_qty: number;
  defect_qty: number;
}

/** Báo cáo ngày của nhà thầu ngoài. */
export interface DongSubcon {
  subcon: string | null;
  output_qty: number;
  /** Sự cố nhà thầu tự khai — mỗi phần tử một dòng. */
  issues: number;
}

/** Biên bản kiểm của QA trong ngày. */
export interface DongKiem {
  inspected_qty: number;
  defect_qty: number;
}

/** Đơn hàng cần để tin về tiến độ. */
export interface DongDon {
  po_number: string;
  delivery_date: string | null;
  status: string;
}

export interface NguonDigest {
  ngay: string;
  sanLuong: readonly DongSanLuong[];
  subcon: readonly DongSubcon[];
  kiem: readonly DongKiem[];
  don: readonly DongDon[];
  /** Phiếu NPL chưa nhận đủ, kèm mốc cần hàng. */
  nplTre: readonly { request_no: string; needed_date: string | null }[];
}

export const MUC_DO = ['NGHIEM_TRONG', 'CANH_BAO', 'BINH_THUONG'] as const;
export type MucDo = (typeof MUC_DO)[number];

/** Nơi cảnh báo dẫn tới. Board Directive 07/08/2026 §3:
 *  *"Mỗi cảnh báo phải dẫn tới hành động. ⛔ Không chỉ hiển thị số."*
 *
 *  🔑 Khai **tại nguồn**, ⛔ KHÔNG để màn hình bóc chuỗi `tieuDe` mà đoán ra.
 *  Bóc chuỗi thì đổi một chữ trong câu cảnh báo là gãy phép điều hướng — mà
 *  ⛔ không phép kiểm nào bắt được, vì cả hai vẫn là `string` hợp lệ. */
export type DichCanhBao =
  | 'po'          // danh sách & hành trình đơn hàng
  | 'materials'   // phiếu NPL
  | 'production'  // lệnh sản xuất
  | 'shipments'   // lịch tàu
  | 'subcon';     // nhà thầu ngoài

export interface CanhBao {
  mucDo: MucDo;
  tieuDe: string;
  chiTiet: string;
  /** Khu cần mở để xử lý. */
  dich: DichCanhBao;
  /** Mã PO liên quan, nếu cảnh báo gắn với một đơn cụ thể. */
  poNumber?: string;
}

export interface ChiSo {
  nhan: string;
  /** `null` ⇒ ⚪ **chưa đo được**, ⛔ KHÁC với 0. */
  gia: number | null;
  donVi: string;
  /** Câu nói rõ vì sao ⛔ chưa đo được. Chỉ có khi `gia === null`. */
  vi?: string;
}

export interface BaoCaoNgay {
  ngay: string;
  chiSo: ChiSo[];
  canhBao: CanhBao[];
  nhacViec: string[];
  /** ⛔ Không có báo cáo nào trong ngày ⇒ `true`, và giao diện phải nói ra. */
  rong: boolean;
}

const NGUY_CAP = 3;   // ngày còn lại tới hạn giao ⇒ nghiêm trọng
const CAN_DE_MAT = 7; // ngày còn lại ⇒ cảnh báo

/**
 * Tổng hợp một ngày làm việc thành báo cáo gửi CEO và Giám đốc sản xuất.
 *
 * ⚠️ Chia cho 0 ⇒ trả `null` *(chưa đo được)*, ⛔ **không** trả `0` và ⛔ không
 * trả `NaN`. Một tỉ lệ lỗi hiện `0%` khi ⛔ chưa ai kiểm là câu nói dối tệ hơn
 * một ô trống.
 */
export function tongHopNgay(n: NguonDigest): BaoCaoNgay {
  const keHoach = tong(n.sanLuong, (r) => r.target_qty);
  const thucTe = tong(n.sanLuong, (r) => r.actual_qty);
  const loiChuyen = tong(n.sanLuong, (r) => r.defect_qty);
  const sanLuongSubcon = tong(n.subcon, (r) => r.output_qty);
  const suCoSubcon = tong(n.subcon, (r) => r.issues);
  const daKiem = tong(n.kiem, (r) => r.inspected_qty);
  const loiKiem = tong(n.kiem, (r) => r.defect_qty);

  const coBaoCao = n.sanLuong.length > 0 || n.subcon.length > 0 || n.kiem.length > 0;

  const chiSo: ChiSo[] = [
    { nhan: 'Sản lượng nội bộ', gia: n.sanLuong.length ? thucTe : null, donVi: 'sp', vi: 'Chưa tổ nào báo sản lượng hôm nay' },
    { nhan: 'Đạt kế hoạch', gia: keHoach > 0 ? lam((thucTe / keHoach) * 100) : null, donVi: '%', vi: 'Chưa đặt kế hoạch cho hôm nay' },
    { nhan: 'Sản lượng gia công ngoài', gia: n.subcon.length ? sanLuongSubcon : null, donVi: 'sp', vi: 'Chưa nhà thầu nào báo cáo' },
    { nhan: 'Tỉ lệ lỗi (QA kiểm)', gia: daKiem > 0 ? lam((loiKiem / daKiem) * 100) : null, donVi: '%', vi: 'QA chưa kiểm sản phẩm nào hôm nay' },
  ];

  const canhBao: CanhBao[] = [];

  // ① Chuyền không đạt kế hoạch — sớm hơn một ngày là cứu được một tuần.
  if (keHoach > 0 && thucTe < keHoach * 0.9) {
    canhBao.push({
      mucDo: thucTe < keHoach * 0.7 ? 'NGHIEM_TRONG' : 'CANH_BAO',
      tieuDe: 'Sản lượng dưới kế hoạch',
      chiTiet: `Đạt ${lam((thucTe / keHoach) * 100)}% — thiếu ${keHoach - thucTe} sp so với kế hoạch ngày.`,
      dich: 'production',
    });
  }

  // ② Lỗi vượt ngưỡng.
  if (daKiem > 0 && loiKiem / daKiem > 0.05) {
    canhBao.push({
      mucDo: loiKiem / daKiem > 0.1 ? 'NGHIEM_TRONG' : 'CANH_BAO',
      tieuDe: 'Tỉ lệ lỗi vượt ngưỡng',
      chiTiet: `${loiKiem}/${daKiem} sp lỗi (${lam((loiKiem / daKiem) * 100)}%).`,
      dich: 'production',
    });
  }
  if (loiChuyen > 0 && thucTe > 0 && loiChuyen / thucTe > 0.05) {
    canhBao.push({
      mucDo: 'CANH_BAO',
      tieuDe: 'Lỗi tại chuyền cao',
      chiTiet: `${loiChuyen} sp lỗi trên ${thucTe} sp sản xuất.`,
      dich: 'production',
    });
  }

  // ③ Nhà thầu báo sự cố — họ tự khai, MD phải xử.
  if (suCoSubcon > 0) {
    canhBao.push({
      mucDo: 'CANH_BAO',
      tieuDe: 'Nhà thầu báo sự cố',
      chiTiet: `${suCoSubcon} sự cố từ ${n.subcon.filter((s) => s.issues > 0).length} nhà thầu.`,
      dich: 'subcon',
    });
  }

  // ④ Đơn sắp tới hạn hoặc đã trễ.
  for (const d of n.don) {
    const conLai = soNgay(d.delivery_date, n.ngay);
    if (conLai === null || d.status === 'COMPLETED') continue;
    if (conLai < 0) {
      canhBao.push({ mucDo: 'NGHIEM_TRONG', tieuDe: `Đơn ${d.po_number} đã quá hạn giao`, chiTiet: `Trễ ${-conLai} ngày.`, dich: 'po', poNumber: d.po_number });
    } else if (conLai <= NGUY_CAP) {
      canhBao.push({ mucDo: 'NGHIEM_TRONG', tieuDe: `Đơn ${d.po_number} tới hạn trong ${conLai} ngày`, chiTiet: 'Kiểm tra tiến độ đóng gói và lịch tàu.', dich: 'shipments', poNumber: d.po_number });
    } else if (conLai <= CAN_DE_MAT) {
      canhBao.push({ mucDo: 'CANH_BAO', tieuDe: `Đơn ${d.po_number} còn ${conLai} ngày`, chiTiet: 'Rà lại tiến độ trước khi vào tuần cuối.', dich: 'po', poNumber: d.po_number });
    }
  }

  // ⑤ NPL trễ mốc cần hàng — chuyền đói hàng bắt đầu từ đây.
  for (const m of n.nplTre) {
    const conLai = soNgay(m.needed_date, n.ngay);
    if (conLai !== null && conLai < 0) {
      canhBao.push({
        mucDo: 'NGHIEM_TRONG',
        tieuDe: `Phiếu NPL ${m.request_no} quá mốc cần hàng`,
        chiTiet: `Trễ ${-conLai} ngày và chưa nhận đủ — chuyền sẽ đói hàng.`,
        dich: 'materials',
      });
    }
  }

  canhBao.sort((a, b) => MUC_DO.indexOf(a.mucDo) - MUC_DO.indexOf(b.mucDo));

  return { ngay: n.ngay, chiSo, canhBao, nhacViec: nhacViec(n, coBaoCao), rong: !coBaoCao };
}

/** Việc MD phải làm hôm nay — suy từ chính chỗ dữ liệu còn thiếu. */
function nhacViec(n: NguonDigest, coBaoCao: boolean): string[] {
  const v: string[] = [];
  if (!coBaoCao) v.push('⚪ Chưa nhận được báo cáo nào hôm nay — nhắc tổ trưởng và nhà thầu gửi số.');
  if (n.sanLuong.length === 0) v.push('Nhắc tổ trưởng báo sản lượng theo giờ.');
  if (n.subcon.length === 0) v.push('Nhắc nhà thầu ngoài gửi báo cáo ngày.');
  if (n.kiem.length === 0) v.push('Nhắc QA nhập biên bản kiểm.');
  if (n.nplTre.length > 0) v.push(`Theo dõi ${n.nplTre.length} phiếu NPL chưa nhận đủ.`);
  return v;
}

function tong<T>(ds: readonly T[], f: (r: T) => number): number {
  return ds.reduce((t, r) => t + (Number.isFinite(f(r)) ? f(r) : 0), 0);
}

function soNgay(hen: string | null, today: string): number | null {
  if (!hen) return null;
  const a = Date.parse(`${hen.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / 86_400_000);
}

function lam(n: number): number {
  return Math.round(n * 10) / 10;
}
