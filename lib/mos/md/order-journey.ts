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
  /** Số hiệu chứng từ — **đây chính là BẰNG CHỨNG** người dùng đối chiếu. */
  so?: string;
  /** Mốc ngày của chứng từ (`needed_date` · `due_date` · `etd_date`). */
  moc?: string | null;
  /** Có tệp đính kèm ⛔ không. `null`/rỗng ⇒ chứng từ ⛔ chưa có tệp. */
  evidence_path?: string | null;
}

export interface DauVaoHanhTrinh {
  poNumber: string;
  /** `orders.status` — chỉ dùng cho chặng `PO` và `HOAN_TAT`. */
  poStatus: string;
  materials: ChungTuCon[];
  productions: ChungTuCon[];
  shipments: ChungTuCon[];
  /** Ngày giao hẹn khách — gốc của mọi phép tính sức khoẻ. */
  deliveryDate?: string | null;
  /** Hôm nay theo giờ VN (`YYYY-MM-DD`). Truyền vào để hàm THUẦN và kiểm được. */
  today?: string;
}

/** Một mẩu bằng chứng: số chứng từ + đã đính kèm tệp chưa. */
export interface BangChung {
  so: string;
  coTep: boolean;
}

export interface ChangResult {
  chang: Chang;
  trangThai: TrangThaiChang;
  /** Câu giải thích NGẮN cho người dùng — vì sao chặng này ở trạng thái đó. */
  vi: string;
  /** **Vai** chịu trách nhiệm chặng này — ⛔ KHÔNG phải tên người.
   *  🔴 CSDL ⛔ chưa có cột người phụ trách trên ba bảng chứng từ con, nên gán
   *  tên một người cụ thể ở đây là **bịa**. Vai thì suy được từ nghiệp vụ. */
  chuTrach: string;
  /** Mốc ngày sớm nhất còn hiệu lực của chặng. `null` ⇒ ⛔ chưa có mốc. */
  moc: string | null;
  bangChung: BangChung[];
}

/** Sức khoẻ đơn hàng — ba mức Board chỉ định. */
export const SUC_KHOE = ['ON_TRACK', 'AT_RISK', 'DELAYED'] as const;
export type SucKhoe = (typeof SUC_KHOE)[number];

export const SUC_KHOE_LABEL: Record<SucKhoe, string> = {
  ON_TRACK: 'Đúng tiến độ',
  AT_RISK: 'Có rủi ro',
  DELAYED: 'Đã trễ',
};

/** Việc kế tiếp — ⛔ không có thì `null`, và giao diện ⛔ không được bịa ra một
 *  nút bấm ⛔ không dẫn tới đâu. */
export interface ViecKeTiep {
  /** Làm gì */
  viec: string;
  /** Ai làm — **vai**, ⛔ không phải tên người */
  ai: string;
  /** Hạn. `null` ⇒ ⛔ chưa có mốc để đặt hạn. */
  hanChot: string | null;
  /** Tab cần mở. Chuỗi thuần để `lib/` ⛔ không phải biết kiểu của `app/`. */
  moTab: 'po' | 'materials' | 'production' | 'shipments';
}

export interface HanhTrinh {
  poNumber: string;
  chang: ChangResult[];
  /** Chặng đang đứng. `null` khi đơn đã hoàn tất hoặc ⛔ chưa bắt đầu. */
  dangO: Chang | null;
  sucKhoe: SucKhoe;
  /** Vì sao ra mức sức khoẻ đó — hiện trong tooltip, ⛔ không để người dùng đoán. */
  viSucKhoe: string;
  /** Số ngày còn lại tới ngày giao. Âm = quá hạn. `null` ⇒ ⛔ không có ngày giao. */
  conLai: number | null;
  /** % hoàn thành — xem `tinhPhanTram` để biết mẫu số là gì. */
  phanTram: number;
  viecKeTiep: ViecKeTiep | null;
}

/** Vai chịu trách nhiệm từng chặng. **Quy ước nghiệp vụ**, ⛔ không phải dữ
 *  liệu — ba bảng chứng từ con ⛔ chưa có cột người phụ trách. Ghi ra thành
 *  bảng để khi CSDL có cột đó thì thay ở ĐÚNG MỘT chỗ. */
export const CHU_TRACH: Record<Chang, string> = {
  PO: 'Merchandiser',
  VAT_TU: 'Merchandiser · Kho NPL',
  SAN_XUAT: 'Quản đốc sản xuất',
  KIEM_HANG: 'QA',
  GIAO_HANG: 'Bộ phận xuất hàng',
  HOAN_TAT: 'Merchandiser',
};

/** Ngưỡng ngày — GIỮ NGUYÊN con số của `lib/mos/po-flow.ts` để hai màn hình
 *  ⛔ không nói hai mức khẩn khác nhau cho cùng một đơn. */
const CRITICAL_DAYS = 7;
const WARNING_DAYS = 21;

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

  const bc = (rows: ChungTuCon[]): BangChung[] =>
    rows.filter((r) => r.so).map((r) => ({ so: r.so as string, coTep: Boolean(r.evidence_path) }));
  /** Mốc SỚM NHẤT của nhóm — mốc sớm nhất là mốc sắp tới hạn trước. */
  const mocSom = (rows: ChungTuCon[]): string | null => {
    const ds = rows.map((r) => r.moc).filter((v): v is string => Boolean(v)).sort();
    return ds[0] ?? null;
  };

  const vtXong = vt.length > 0 && vt.every((r) => XONG_VAT_TU.has(r.status));
  const sxXong = sx.length > 0 && sx.every((r) => XONG_SAN_XUAT.has(r.status));
  const ghXong = gh.length > 0 && gh.every((r) => XONG_GIAO_HANG.has(r.status));
  const poXong = PO_HOAN_TAT.has(d.poStatus);

  const chang: ChangResult[] = [
    {
      chang: 'PO',
      trangThai: 'XONG',
      vi: `Đơn ${d.poNumber} đã được lập`,
      chuTrach: CHU_TRACH.PO,
      moc: d.deliveryDate ?? null,
      bangChung: [{ so: d.poNumber, coTep: false }],
    },
    {
      chang: 'VAT_TU',
      trangThai: vtXong ? 'XONG' : vt.length > 0 ? 'DANG_LAM' : 'CHUA_TOI',
      vi: vt.length === 0
        ? 'Chưa có đề nghị mua NPL nào'
        : vtXong
          ? `${vt.length} phiếu NPL đã nhận đủ`
          : `${vt.filter((r) => XONG_VAT_TU.has(r.status)).length}/${vt.length} phiếu NPL đã nhận`,
      chuTrach: CHU_TRACH.VAT_TU,
      moc: mocSom(vt),
      bangChung: bc(vt),
    },
    {
      chang: 'SAN_XUAT',
      trangThai: sxXong ? 'XONG' : sx.length > 0 ? 'DANG_LAM' : 'CHUA_TOI',
      vi: sx.length === 0
        ? 'Chưa có lệnh sản xuất nào'
        : sxXong
          ? `${sx.length} lệnh sản xuất đã xong`
          : `${sx.filter((r) => XONG_SAN_XUAT.has(r.status)).length}/${sx.length} lệnh sản xuất đã xong`,
      chuTrach: CHU_TRACH.SAN_XUAT,
      moc: mocSom(sx),
      bangChung: bc(sx),
    },
    {
      // 🔴 Xem khối chú thích đầu tệp. ⛔ KHÔNG đổi thành `CHUA_TOI`.
      chang: 'KIEM_HANG',
      trangThai: 'KHONG_DO_DUOC',
      vi: '⚪ Chưa đo được — MD chưa có đường dữ liệu sang Workspace QA',
      chuTrach: CHU_TRACH.KIEM_HANG,
      moc: null,
      bangChung: [],
    },
    {
      chang: 'GIAO_HANG',
      trangThai: ghXong ? 'XONG' : gh.length > 0 ? 'DANG_LAM' : 'CHUA_TOI',
      vi: gh.length === 0
        ? 'Chưa có lệnh giao hàng nào'
        : ghXong
          ? `${gh.length} lô đã giao tới nơi`
          : `${gh.filter((r) => XONG_GIAO_HANG.has(r.status)).length}/${gh.length} lô đã giao`,
      chuTrach: CHU_TRACH.GIAO_HANG,
      moc: mocSom(gh),
      bangChung: bc(gh),
    },
    {
      chang: 'HOAN_TAT',
      trangThai: poXong ? 'XONG' : 'CHUA_TOI',
      vi: poXong ? 'Đơn đã đóng' : 'Đơn còn đang chạy',
      chuTrach: CHU_TRACH.HOAN_TAT,
      moc: d.deliveryDate ?? null,
      bangChung: [],
    },
  ];

  // Chặng đang đứng = chặng ĐẦU TIÊN chưa xong, bỏ qua chặng ⛔ không đo được.
  // ⚠️ Bỏ qua `KHONG_DO_DUOC` là CÓ CHỦ Ý: một chặng ⛔ không có dữ liệu ⛔
  // không được phép khoá vị trí của cả đơn hàng lại.
  const dangO = chang.find(
    (c) => c.trangThai === 'DANG_LAM' || c.trangThai === 'CHUA_TOI',
  )?.chang ?? null;
  const dungO = poXong ? null : dangO;

  const conLai = soNgayConLai(d.deliveryDate ?? null, d.today ?? null);
  const treMoc = chang.some(
    (c) => c.trangThai !== 'XONG' && c.trangThai !== 'KHONG_DO_DUOC'
      && c.moc !== null && d.today !== undefined && c.moc < d.today,
  );
  const { sucKhoe, viSucKhoe } = tinhSucKhoe({ poXong, conLai, treMoc });

  return {
    poNumber: d.poNumber,
    chang,
    dangO: dungO,
    sucKhoe,
    viSucKhoe,
    conLai,
    phanTram: tinhPhanTram(chang),
    viecKeTiep: tinhViecKeTiep(dungO, chang),
  };
}

/** Số ngày từ `today` tới `hen`. Âm = đã quá hạn. `null` khi thiếu dữ liệu. */
export function soNgayConLai(hen: string | null, today: string | null): number | null {
  if (!hen || !today) return null;
  const a = Date.parse(`${hen}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / 86_400_000);
}

/**
 * 🟢 Đúng tiến độ · 🟡 Có rủi ro · 🔴 Đã trễ.
 *
 * ⚠️ Ngưỡng lấy NGUYÊN của `po-flow.ts` *(7 / 21 ngày)* — hai màn hình nói hai
 * mức khẩn cho cùng một đơn là chuyện ⛔ không được xảy ra.
 *
 * 🔑 **Một mốc con quá hạn cũng đủ để đơn thành 🔴**, dù ngày giao còn xa: phiếu
 * NPL trễ hôm nay là chuyền đói hàng ba tuần nữa. Đó là cả điểm của việc theo
 * dòng chảy thay vì chỉ nhìn ngày giao cuối.
 */
export function tinhSucKhoe(
  { poXong, conLai, treMoc }: { poXong: boolean; conLai: number | null; treMoc: boolean },
): { sucKhoe: SucKhoe; viSucKhoe: string } {
  if (poXong) return { sucKhoe: 'ON_TRACK', viSucKhoe: 'Đơn đã đóng' };
  if (conLai !== null && conLai < 0) {
    return { sucKhoe: 'DELAYED', viSucKhoe: `Quá ngày giao ${Math.abs(conLai)} ngày` };
  }
  if (treMoc) {
    return { sucKhoe: 'DELAYED', viSucKhoe: 'Có mốc chứng từ đã quá hạn mà chặng chưa xong' };
  }
  if (conLai === null) {
    // ⚠️ ⛔ Không có ngày giao thì ⛔ KHÔNG kết luận "đúng tiến độ" — nói thẳng
    // là chưa đo được, rồi xếp vào mức giữa (`V.1`).
    return { sucKhoe: 'AT_RISK', viSucKhoe: '⚪ Chưa có ngày giao — chưa đo được tiến độ' };
  }
  if (conLai <= CRITICAL_DAYS) {
    return { sucKhoe: 'DELAYED', viSucKhoe: `Chỉ còn ${conLai} ngày tới hạn giao` };
  }
  if (conLai <= WARNING_DAYS) {
    return { sucKhoe: 'AT_RISK', viSucKhoe: `Còn ${conLai} ngày tới hạn giao` };
  }
  return { sucKhoe: 'ON_TRACK', viSucKhoe: `Còn ${conLai} ngày tới hạn giao` };
}

/**
 * % hoàn thành.
 *
 * 🔴 **Mẫu số BỎ chặng ⛔ không đo được.** Kiểm hàng ⛔ chưa có nguồn dữ liệu;
 * tính nó vào mẫu số sẽ khiến **mọi đơn hàng vĩnh viễn ⛔ không bao giờ đạt
 * 100%** — một con số sai mà trông rất thật. Vì vậy mẫu số là **5 chặng đo
 * được**, và giao diện nói rõ điều đó.
 */
export function tinhPhanTram(chang: ChangResult[]): number {
  const doDuoc = chang.filter((c) => c.trangThai !== 'KHONG_DO_DUOC');
  if (doDuoc.length === 0) return 0;
  const xong = doDuoc.filter((c) => c.trangThai === 'XONG').length;
  return Math.round((xong / doDuoc.length) * 100);
}

/** Việc kế tiếp — suy từ chặng đang đứng. ⛔ Không có chặng ⇒ `null`, và giao
 *  diện ⛔ không được dựng một nút bấm ⛔ không dẫn tới đâu. */
export function tinhViecKeTiep(dangO: Chang | null, chang: ChangResult[]): ViecKeTiep | null {
  if (!dangO) return null;
  const cua = (c: Chang) => chang.find((x) => x.chang === c) ?? null;
  switch (dangO) {
    case 'VAT_TU':
      return { viec: 'Lập và duyệt đề nghị mua NPL', ai: CHU_TRACH.VAT_TU, hanChot: cua('VAT_TU')?.moc ?? null, moTab: 'materials' };
    case 'SAN_XUAT':
      return { viec: 'Phát hành lệnh sản xuất', ai: CHU_TRACH.SAN_XUAT, hanChot: cua('SAN_XUAT')?.moc ?? null, moTab: 'production' };
    case 'GIAO_HANG':
      return { viec: 'Lập lệnh giao hàng và chốt ETD', ai: CHU_TRACH.GIAO_HANG, hanChot: cua('GIAO_HANG')?.moc ?? null, moTab: 'shipments' };
    case 'HOAN_TAT':
      return { viec: 'Đối chiếu và đóng đơn', ai: CHU_TRACH.HOAN_TAT, hanChot: cua('HOAN_TAT')?.moc ?? null, moTab: 'po' };
    // ⚠️ `KIEM_HANG` ⛔ không bao giờ là chặng đang đứng — nó bị bỏ qua ở trên.
    default:
      return null;
  }
}

/** Đếm số đơn đang đứng ở mỗi chặng — dùng cho dải tổng quan đầu tab PO. */
export function demTheoChang(ds: HanhTrinh[]): Record<Chang, number> {
  const dem = Object.fromEntries(CHANG.map((c) => [c, 0])) as Record<Chang, number>;
  for (const h of ds) if (h.dangO) dem[h.dangO] += 1;
  return dem;
}
