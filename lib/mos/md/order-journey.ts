// ============================================================================
// ĐƠN HÀNG ĐANG Ở ĐÂU? — LOGIC THUẦN
//
// Board Directive 06/08/2026: *"The MD Workspace must answer: **Where is my
// order now?**"* — theo dòng chảy nghiệp vụ, ⛔ không theo tab:
//
//     PO → Vật tư → Sản xuất → Kiểm hàng → Giao hàng → Hoàn tất
//
// ⛔ Không phụ thuộc React, ⛔ không đọc CSDL. Đặt ở `lib/mos` vì Cổng khách
// hàng và Bảng tổng của giám đốc rồi cũng phải hiện ĐÚNG những chặng này — hai
// nơi tự tính là hai nơi sẽ lệch.
//
// ─── 🔑 CHẶNG SUY RA TỪ CHỨNG TỪ CON, ⛔ KHÔNG TỪ MỘT CỘT `status` ────────
// Quy tắc dự án cấm **lưu dữ liệu tính được**. *"Đơn đang ở đâu"* là **dữ liệu
// dẫn xuất**: nó là hệ quả của việc đã có phiếu NPL chưa, lệnh sản xuất chạy
// chưa, lô hàng rời cảng chưa. Thêm một cột `current_stage` vào bảng `orders`
// sẽ lệch ngay lần đầu ai đó sửa chứng từ con mà quên chạy lại phép tính.
//
// ⇒ Tệp này ĐỌC chứng từ con và TÍNH ra chặng. ⛔ Không có gì để lưu.
//
// ─── ⚪ VÌ SAO CHẶNG "KIỂM HÀNG" LUÔN TRẢ `KHONG_DO_DUOC` ────────────────
// 🔴 Ảnh chụp dữ liệu của MD **⛔ KHÔNG chứa dữ liệu kiểm hàng** — nó chỉ nạp
// `materialRequests` · `productionOrders` · `shipments`. Kiểm hàng thuộc
// Workspace QA và ⛔ chưa có đường dữ liệu nào sang MD.
//
// Quy tắc `V.1` của dự án: **⛔ không kết luận trên bảng RỖNG** — ghi
// *"⚪ chưa đo được"*, ⛔ không ghi *"✅ đạt"*. Vì vậy chặng này khai thẳng là
// **⛔ chưa đo được** thay vì lặng lẽ hiện *"chưa tới"* — hai điều đó khác
// nhau, và gộp chúng lại là để giao diện nói dối.
// ============================================================================

/** Sáu chặng, đúng thứ tự Board chỉ định. Thứ tự mảng LÀ thứ tự trên màn hình. */
export const CHANG = ['PO', 'VAT_TU', 'SAN_XUAT', 'KIEM_HANG', 'GIAO_HANG', 'HOAN_TAT'] as const;
export type Chang = (typeof CHANG)[number];

export const CHANG_LABEL: Record<Chang, string> = {
  PO: 'Đơn hàng',
  VAT_TU: 'Vật tư',
  SAN_XUAT: 'Sản xuất',
  KIEM_HANG: 'Kiểm hàng',
  GIAO_HANG: 'Giao hàng',
  HOAN_TAT: 'Hoàn tất',
};

/**
 * Trạng thái một chặng.
 *   `XONG`          — đã đi qua, có chứng từ chứng minh
 *   `DANG_LAM`      — đang ở đây
 *   `CHUA_TOI`      — chưa tới lượt
 *   `KHONG_DO_DUOC` — ⚪ **⛔ không có dữ liệu để kết luận** (`V.1`)
 */
export const TRANG_THAI_CHANG = ['XONG', 'DANG_LAM', 'CHUA_TOI', 'KHONG_DO_DUOC'] as const;
export type TrangThaiChang = (typeof TRANG_THAI_CHANG)[number];

/** Chỉ những trường THẬT SỰ cần — nhận đúng chừng này thì hàm dùng lại được ở
 *  Cổng khách hàng mà ⛔ không phải kéo theo cả `PoRow`. */
export interface ChungTuCon {
  /** `po_number` của chứng từ. `null` ⇒ ⛔ không gắn được vào đơn nào. */
  po_number: string | null;
  status: string;
}

export interface DauVaoHanhTrinh {
  poNumber: string;
  /** `orders.status` — chỉ dùng cho chặng `PO` và `HOAN_TAT`. */
  poStatus: string;
  materials: ChungTuCon[];
  productions: ChungTuCon[];
  shipments: ChungTuCon[];
}

export interface ChangResult {
  chang: Chang;
  trangThai: TrangThaiChang;
  /** Câu giải thích NGẮN cho người dùng — vì sao chặng này ở trạng thái đó. */
  vi: string;
}

export interface HanhTrinh {
  poNumber: string;
  chang: ChangResult[];
  /** Chặng đang đứng. `null` khi đơn đã hoàn tất hoặc ⛔ chưa bắt đầu. */
  dangO: Chang | null;
}

const HUY = new Set(['CANCELLED', 'REJECTED']);
/** Chứng từ đã huỷ/bị từ chối **⛔ không chứng minh được gì** — bỏ ra trước khi đếm. */
const conSong = (rows: ChungTuCon[], po: string) =>
  rows.filter((r) => r.po_number === po && !HUY.has(r.status));

/** Mã kết thúc của từng loại chứng từ con. */
const XONG_VAT_TU = new Set(['RECEIVED']);
const XONG_SAN_XUAT = new Set(['COMPLETED']);
const XONG_GIAO_HANG = new Set(['DELIVERED']);
const PO_HOAN_TAT = new Set(['COMPLETED', 'CLOSED', 'SHIPPED']);

/**
 * Tính hành trình của MỘT đơn hàng.
 *
 * ⚠️ Hàm này **⛔ không đoán**. Chặng nào ⛔ không có chứng từ để dựa vào thì
 * trả `CHUA_TOI`; chặng ⛔ không có NGUỒN DỮ LIỆU thì trả `KHONG_DO_DUOC`.
 */
export function tinhHanhTrinh(d: DauVaoHanhTrinh): HanhTrinh {
  const vt = conSong(d.materials, d.poNumber);
  const sx = conSong(d.productions, d.poNumber);
  const gh = conSong(d.shipments, d.poNumber);

  const vtXong = vt.length > 0 && vt.every((r) => XONG_VAT_TU.has(r.status));
  const sxXong = sx.length > 0 && sx.every((r) => XONG_SAN_XUAT.has(r.status));
  const ghXong = gh.length > 0 && gh.every((r) => XONG_GIAO_HANG.has(r.status));
  const poXong = PO_HOAN_TAT.has(d.poStatus);

  const chang: ChangResult[] = [
    {
      chang: 'PO',
      trangThai: 'XONG',
      vi: `Đơn ${d.poNumber} đã được lập`,
    },
    {
      chang: 'VAT_TU',
      trangThai: vtXong ? 'XONG' : vt.length > 0 ? 'DANG_LAM' : 'CHUA_TOI',
      vi: vt.length === 0
        ? 'Chưa có đề nghị mua NPL nào'
        : vtXong
          ? `${vt.length} phiếu NPL đã nhận đủ`
          : `${vt.filter((r) => XONG_VAT_TU.has(r.status)).length}/${vt.length} phiếu NPL đã nhận`,
    },
    {
      chang: 'SAN_XUAT',
      trangThai: sxXong ? 'XONG' : sx.length > 0 ? 'DANG_LAM' : 'CHUA_TOI',
      vi: sx.length === 0
        ? 'Chưa có lệnh sản xuất nào'
        : sxXong
          ? `${sx.length} lệnh sản xuất đã xong`
          : `${sx.filter((r) => XONG_SAN_XUAT.has(r.status)).length}/${sx.length} lệnh sản xuất đã xong`,
    },
    {
      // 🔴 Xem khối chú thích đầu tệp. ⛔ KHÔNG đổi thành `CHUA_TOI`.
      chang: 'KIEM_HANG',
      trangThai: 'KHONG_DO_DUOC',
      vi: '⚪ Chưa đo được — MD chưa có đường dữ liệu sang Workspace QA',
    },
    {
      chang: 'GIAO_HANG',
      trangThai: ghXong ? 'XONG' : gh.length > 0 ? 'DANG_LAM' : 'CHUA_TOI',
      vi: gh.length === 0
        ? 'Chưa có lệnh giao hàng nào'
        : ghXong
          ? `${gh.length} lô đã giao tới nơi`
          : `${gh.filter((r) => XONG_GIAO_HANG.has(r.status)).length}/${gh.length} lô đã giao`,
    },
    {
      chang: 'HOAN_TAT',
      trangThai: poXong ? 'XONG' : 'CHUA_TOI',
      vi: poXong ? 'Đơn đã đóng' : 'Đơn còn đang chạy',
    },
  ];

  // Chặng đang đứng = chặng ĐẦU TIÊN chưa xong, bỏ qua chặng ⛔ không đo được.
  // ⚠️ Bỏ qua `KHONG_DO_DUOC` là CÓ CHỦ Ý: một chặng ⛔ không có dữ liệu ⛔
  // không được phép khoá vị trí của cả đơn hàng lại.
  const dangO = chang.find(
    (c) => c.trangThai === 'DANG_LAM' || c.trangThai === 'CHUA_TOI',
  )?.chang ?? null;

  return { poNumber: d.poNumber, chang, dangO: poXong ? null : dangO };
}

/** Đếm số đơn đang đứng ở mỗi chặng — dùng cho dải tổng quan đầu tab PO. */
export function demTheoChang(ds: HanhTrinh[]): Record<Chang, number> {
  const dem = Object.fromEntries(CHANG.map((c) => [c, 0])) as Record<Chang, number>;
  for (const h of ds) if (h.dangO) dem[h.dangO] += 1;
  return dem;
}
