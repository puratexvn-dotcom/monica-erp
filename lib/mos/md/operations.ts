// ============================================================================
// CHIẾT TÍNH THEO CÔNG ĐOẠN — DANH MỤC + PHÉP TÍNH THUẦN
//
// Board 06/08/2026: *"Cầm sản phẩm mẫu, tích vào bảng những công đoạn đó — tuỳ
// từng mẫu mà có công đoạn tương ứng. Chỉ cần nhập và xác nhận là ra costing
// chính xác."*
//
// ⛔ Không React, ⛔ không CSDL. Cổng khách hàng và bảng tổng của Giám đốc rồi
// cũng phải ra **đúng con số này** — hai nơi tự tính là hai nơi sẽ lệch.
//
// ─── 🔑 VÌ SAO TÍNH THEO CÔNG ĐOẠN, ⛔ KHÔNG GÕ THẲNG GIÁ CM ────────────────
// Gõ thẳng "CM = 2,15 USD" là một con số **⛔ không ai kiểm lại được**. Khi
// khách ép giá, merchandiser ⛔ không chỉ ra được chỗ nào cắt được. Tích công
// đoạn thì mỗi hào trong giá đều truy về **một công đoạn có tên và có SAM** —
// đó là khác biệt giữa *báo giá* và *chiết tính*.
//
// ─── ⚠️ SAM Ở ĐÂY LÀ SỐ THAM CHIẾU NGÀNH, ⛔ KHÔNG PHẢI SỐ CỦA XƯỞNG BẠN ───
// 🔴 Mỗi xưởng có tay nghề, máy móc và bố trí chuyền khác nhau. Bảng dưới đây
// là **điểm khởi đầu**, và mọi dòng đều **sửa được tại chỗ** trước khi chốt.
// Khi xưởng đã có số đo thật *(bấm giờ công đoạn)*, con số đó thắng bảng này.
//
// ⚠️ ⛔ KHÔNG lưu bảng này xuống CSDL ở bản này: thêm bảng master mới là chạm
// **Database Schema** — thẩm quyền của Board. Ở đây nó là **dữ liệu tham chiếu
// trong mã**, và chiết tính đã chốt thì lưu **từng dòng công đoạn** vào
// `costing_items` *(category `CM`)*, nên số liệu lịch sử ⛔ không phụ thuộc
// bảng này về sau.
// ============================================================================

/** Nhóm sản phẩm — quyết định bộ công đoạn nào hiện ra trước. */
export const NHOM_SAN_PHAM = ['TSHIRT', 'POLO', 'SHIRT', 'JACKET', 'TROUSER', 'DRESS'] as const;
export type NhomSanPham = (typeof NHOM_SAN_PHAM)[number];

export const NHOM_SAN_PHAM_LABEL: Record<NhomSanPham, string> = {
  TSHIRT: 'Áo thun',
  POLO: 'Áo polo',
  SHIRT: 'Sơ mi',
  JACKET: 'Áo khoác',
  TROUSER: 'Quần',
  DRESS: 'Đầm / váy',
};

/** Khâu sản xuất — chỉ để gom nhóm trên màn hình cho dễ quét. */
export const KHAU = ['CAT', 'MAY', 'HOAN_THANH', 'PHU_TRO'] as const;
export type Khau = (typeof KHAU)[number];

export const KHAU_LABEL: Record<Khau, string> = {
  CAT: 'Cắt',
  MAY: 'May',
  HOAN_THANH: 'Hoàn thành',
  PHU_TRO: 'Phụ trợ',
};

export interface CongDoan {
  ma: string;
  ten: string;
  khau: Khau;
  /** SAM tham chiếu — **phút chuẩn cho một sản phẩm**. */
  sam: number;
  /** Nhóm sản phẩm thường có công đoạn này. Rỗng = dùng chung mọi nhóm. */
  ápDung: readonly NhomSanPham[];
  /** Tích sẵn khi chọn nhóm sản phẩm — công đoạn hầu như mẫu nào cũng có. */
  macDinh?: boolean;
}

/**
 * Danh mục công đoạn tham chiếu.
 *
 * ⚠️ SAM lấy theo khoảng thông dụng của ngành may gia công. **Sửa được tại
 * chỗ** trên màn hình trước khi chốt — xem khối chú thích đầu tệp.
 */
export const CONG_DOAN: readonly CongDoan[] = [
  // ─── CẮT ───────────────────────────────────────────────────────────────
  { ma: 'CUT-SPREAD', ten: 'Trải vải', khau: 'CAT', sam: 0.8, ápDung: [], macDinh: true },
  { ma: 'CUT-CUT', ten: 'Cắt chi tiết', khau: 'CAT', sam: 1.2, ápDung: [], macDinh: true },
  { ma: 'CUT-NUMBER', ten: 'Đánh số · phối kiện', khau: 'CAT', sam: 0.9, ápDung: [], macDinh: true },
  { ma: 'CUT-FUSE', ten: 'Ép mex', khau: 'CAT', sam: 0.7, ápDung: ['SHIRT', 'JACKET', 'TROUSER'] },

  // ─── MAY ───────────────────────────────────────────────────────────────
  { ma: 'SEW-SHOULDER', ten: 'Ráp vai', khau: 'MAY', sam: 1.1, ápDung: ['TSHIRT', 'POLO', 'SHIRT', 'DRESS'], macDinh: true },
  { ma: 'SEW-NECK-RIB', ten: 'Tra cổ bo (bo dệt)', khau: 'MAY', sam: 1.6, ápDung: ['TSHIRT'], macDinh: true },
  { ma: 'SEW-COLLAR', ten: 'Tra cổ bẻ', khau: 'MAY', sam: 3.4, ápDung: ['POLO', 'SHIRT'], macDinh: true },
  { ma: 'SEW-PLACKET', ten: 'Tra nẹp áo', khau: 'MAY', sam: 2.8, ápDung: ['POLO', 'SHIRT'], macDinh: true },
  { ma: 'SEW-SLEEVE', ten: 'Tra tay', khau: 'MAY', sam: 2.2, ápDung: [], macDinh: true },
  { ma: 'SEW-SIDE', ten: 'May sườn · bụng tay', khau: 'MAY', sam: 2.0, ápDung: [], macDinh: true },
  { ma: 'SEW-CUFF', ten: 'Tra măng sét', khau: 'MAY', sam: 2.6, ápDung: ['SHIRT', 'JACKET'] },
  { ma: 'SEW-HEM', ten: 'Lai gấu', khau: 'MAY', sam: 1.4, ápDung: [], macDinh: true },
  { ma: 'SEW-POCKET', ten: 'May túi', khau: 'MAY', sam: 2.4, ápDung: ['SHIRT', 'JACKET', 'TROUSER'] },
  { ma: 'SEW-ZIPPER', ten: 'Tra khoá kéo', khau: 'MAY', sam: 3.2, ápDung: ['JACKET', 'TROUSER'] },
  { ma: 'SEW-WAIST', ten: 'Tra lưng quần', khau: 'MAY', sam: 3.0, ápDung: ['TROUSER'] },
  { ma: 'SEW-LINING', ten: 'Ráp lót', khau: 'MAY', sam: 4.5, ápDung: ['JACKET'] },
  { ma: 'SEW-BUTTONHOLE', ten: 'Thùa khuy · đính cúc', khau: 'MAY', sam: 1.8, ápDung: ['POLO', 'SHIRT', 'JACKET', 'TROUSER'] },
  { ma: 'SEW-LABEL', ten: 'Tra nhãn chính · nhãn sườn', khau: 'MAY', sam: 0.8, ápDung: [], macDinh: true },

  // ─── HOÀN THÀNH ────────────────────────────────────────────────────────
  { ma: 'FIN-TRIM', ten: 'Cắt chỉ · vệ sinh', khau: 'HOAN_THANH', sam: 1.5, ápDung: [], macDinh: true },
  { ma: 'FIN-IRON', ten: 'Ủi hoàn thiện', khau: 'HOAN_THANH', sam: 1.8, ápDung: [], macDinh: true },
  { ma: 'FIN-QC', ten: 'Kiểm cuối chuyền', khau: 'HOAN_THANH', sam: 1.0, ápDung: [], macDinh: true },
  { ma: 'FIN-FOLD', ten: 'Gấp · vào túi PE', khau: 'HOAN_THANH', sam: 1.2, ápDung: [], macDinh: true },
  { ma: 'FIN-METAL', ten: 'Dò kim loại', khau: 'HOAN_THANH', sam: 0.4, ápDung: [] },
  { ma: 'FIN-CARTON', ten: 'Đóng thùng', khau: 'HOAN_THANH', sam: 0.6, ápDung: [], macDinh: true },

  // ─── PHỤ TRỢ ───────────────────────────────────────────────────────────
  { ma: 'AUX-PRINT', ten: 'In (chuyển sang nhà in)', khau: 'PHU_TRO', sam: 1.0, ápDung: [] },
  { ma: 'AUX-EMB', ten: 'Thêu', khau: 'PHU_TRO', sam: 1.5, ápDung: [] },
  { ma: 'AUX-WASH', ten: 'Giặt', khau: 'PHU_TRO', sam: 2.0, ápDung: ['TROUSER', 'JACKET'] },
];

/** Công đoạn gợi ý cho một nhóm sản phẩm — `ápDung` rỗng nghĩa là dùng chung. */
export function congDoanTheoNhom(nhom: NhomSanPham): CongDoan[] {
  return CONG_DOAN.filter((c) => c.ápDung.length === 0 || c.ápDung.includes(nhom));
}

/** Mã công đoạn tích sẵn khi vừa chọn nhóm sản phẩm. */
export function macDinhTheoNhom(nhom: NhomSanPham): string[] {
  return congDoanTheoNhom(nhom).filter((c) => c.macDinh).map((c) => c.ma);
}

/** Một dòng công đoạn đã chọn — `sam` tách khỏi danh mục vì người dùng **sửa
 *  được tại chỗ**, và số đã sửa mới là số đi vào chiết tính. */
export interface DongChon {
  ma: string;
  ten: string;
  khau: Khau;
  sam: number;
}

export interface ThamSoCM {
  /** Chi phí một phút chuyền, đơn vị tiền của bản chiết tính. */
  giaPhut: number;
  /** Hiệu suất chuyền %, 1–100. SAM chuẩn ⛔ không bao giờ đạt 100% ngoài đời. */
  hieuSuat: number;
  /** % phụ phí quản lý xưởng cộng trên nhân công. */
  overhead: number;
}

export interface KetQuaCM {
  tongSam: number;
  /** SAM sau khi chia hiệu suất — **đây mới là phút thật phải trả tiền**. */
  samThucTe: number;
  nhanCong: number;
  overhead: number;
  /** Tổng chi phí gia công cho MỘT sản phẩm. */
  cmMotSanPham: number;
  theoKhau: Record<Khau, number>;
}

/**
 * Chiết tính chi phí gia công (CM) từ danh sách công đoạn đã chọn.
 *
 * 🔑 **Hiệu suất chuyền là chỗ mọi bản chiết tính nghiệp dư sai.** Tổng SAM là
 * phút *chuẩn*; chuyền chạy 100% hiệu suất là điều ⛔ không tồn tại. Bỏ qua hệ
 * số này là **báo giá thấp hơn giá thành thật**, và cái sai đó chỉ lộ ra sau
 * khi đã ký hợp đồng.
 *
 * ⚠️ Trả về `0` an toàn thay vì `NaN`/`Infinity` khi tham số vô nghĩa —
 * `NaN` lọt ra màn hình báo giá là thứ đắt hơn nhiều một câu `if`.
 */
export function tinhCM(dong: readonly DongChon[], ts: ThamSoCM): KetQuaCM {
  const theoKhau = Object.fromEntries(KHAU.map((k) => [k, 0])) as Record<Khau, number>;
  let tongSam = 0;
  for (const d of dong) {
    const sam = Number.isFinite(d.sam) && d.sam > 0 ? d.sam : 0;
    tongSam += sam;
    theoKhau[d.khau] += sam;
  }
  const hs = Number.isFinite(ts.hieuSuat) && ts.hieuSuat > 0 ? Math.min(ts.hieuSuat, 100) : 0;
  const samThucTe = hs > 0 ? tongSam / (hs / 100) : 0;
  const gia = Number.isFinite(ts.giaPhut) && ts.giaPhut > 0 ? ts.giaPhut : 0;
  const nhanCong = samThucTe * gia;
  const oh = Number.isFinite(ts.overhead) && ts.overhead > 0 ? ts.overhead : 0;
  const overhead = nhanCong * (oh / 100);
  return {
    tongSam: lam(tongSam, 3),
    samThucTe: lam(samThucTe, 3),
    nhanCong: lam(nhanCong, 4),
    overhead: lam(overhead, 4),
    cmMotSanPham: lam(nhanCong + overhead, 4),
    theoKhau: Object.fromEntries(
      Object.entries(theoKhau).map(([k, v]) => [k, lam(v, 3)]),
    ) as Record<Khau, number>,
  };
}

/**
 * Giá chào bán một sản phẩm = (CM + NPL + phụ phí) ÷ (1 − biên lợi nhuận).
 *
 * 🔴 **CHIA cho (1 − biên), ⛔ KHÔNG NHÂN với (1 + biên).** Đây là lỗi kinh
 * điển của bảng tính Excel tự làm: nhân 1,15 cho ra biên **13%**, ⛔ không phải
 * 15% — vì biên tính trên **giá bán**, ⛔ không phải trên giá vốn. Chênh lệch
 * đó ăn thẳng vào lãi của cả đơn hàng.
 *
 * ⚠️ Biên ≥ 100% là vô nghĩa *(chia cho 0 hoặc số âm)* ⇒ trả `0` kèm cờ, để
 * màn hình nói *"biên không hợp lệ"* thay vì hiện `Infinity`.
 */
export function giaChaoBan(giaVon: number, bienPhanTram: number): { gia: number; hopLe: boolean } {
  const v = Number.isFinite(giaVon) && giaVon > 0 ? giaVon : 0;
  const b = Number.isFinite(bienPhanTram) ? bienPhanTram : 0;
  if (b < 0 || b >= 100) return { gia: 0, hopLe: false };
  return { gia: lam(v / (1 - b / 100), 4), hopLe: true };
}

/** Biên lợi nhuận thực tế khi đã biết giá bán và giá vốn. */
export function bienThucTe(giaBan: number, giaVon: number): number {
  if (!Number.isFinite(giaBan) || giaBan <= 0) return 0;
  return lam(((giaBan - giaVon) / giaBan) * 100, 2);
}

function lam(n: number, so: number): number {
  const h = 10 ** so;
  return Math.round(n * h) / h;
}
