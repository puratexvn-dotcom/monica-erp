// ============================================================================
// KHOÁ CHỨNG TỪ THEO **WORKFLOW**, ⛔ KHÔNG THEO **TRẠNG THÁI ĐƠN THUẦN**
//
// 📐 **BOARD DECISION 07/08/2026** — `BUG-4` + mục *"Khóa theo Workflow"*:
//
//   > *"⛔ Không khóa theo Status đơn thuần. Ví dụ: **PO đã sinh Production
//   > Order thì phải khóa.** ⛔ Không dựa duy nhất vào trạng thái `APPROVED`."*
//
// 🔑 **ĐÂY LÀ TOÀN BỘ NỘI DUNG CỦA CHỈ THỊ.** Một `switch (status)` có đủ sáu
// nhánh vẫn là **⛔ không thi hành** — vì nó ⛔ không hỏi được câu *"chứng từ
// này đã đẻ ra thứ gì ở hạ nguồn chưa?"*, mà đó mới là câu quyết định.
//
// 🔴 Một PO còn `DRAFT` nhưng **đã sinh lệnh sản xuất** thì xưởng đã cắt vải
// theo nó. Sửa số lượng lúc đó là làm sai lệnh đang chạy trên chuyền — và
// `status` ⛔ **không hề biết** điều đó.
//
// ─── ⛔ KHÔNG React · ⛔ KHÔNG Supabase · ⛔ KHÔNG tên bảng ────────────────
// Cổng khách hàng, bảng tổng Giám đốc, và bất kỳ Server Action nào rồi cũng
// phải áp **đúng** bộ luật này. Nhận **DỮ LIỆU**, trả **PHÁN QUYẾT** — đúng
// khuôn `lib/mos/permission/` (CLAUDE.md §2.2).
//
// ⚠️ **TẦNG NÀY ⛔ KHÔNG PHẢI HÀNG RÀO THẬT.** Hàng rào thật nằm ở CSDL
// *(CLAUDE.md §2.1)*. `orders` **⛔ CHƯA** được ghi vào
// `mos_aggregate_immutability` — việc đó cần migration, mà `SECURITY FREEZE`
// đang chặn. Bản nháp + ADR đề xuất: xem `docs/adr/ADR-027-*` và
// `supabase/drafts/`. Cho tới khi Board chạy nó, luật này chỉ chặn được đường
// đi qua Server Action — đã ghi thẳng vào báo cáo, ⛔ không báo là "đã khoá".
// ============================================================================
import type { Role } from '@/lib/rbac';

// ─── 1. PHÁN QUYẾT ─────────────────────────────────────────────────────────

/**
 * Bốn mức, xếp từ mở tới đóng. Tách `YEU_CAU_THAY_DOI` khỏi `KHOA` là **có chủ
 * ý**: hai mức ấy đều "⛔ không sửa trực tiếp" nhưng **lối ra khác nhau** —
 * một bên còn đường đi *(lập Yêu cầu thay đổi)*, một bên thì hết.
 *
 * 🔑 Báo *"⛔ không sửa được"* mà ⛔ không nói **làm gì tiếp** là đẩy người dùng
 * vào ngõ cụt — đúng lỗi `friendlyDbError` đã sửa cho mã `P0409`.
 */
export type MucKhoa = 'SUA' | 'YEU_CAU_THAY_DOI' | 'KHOA' | 'KHOA_TUYET_DOI';

export interface PhanQuyet {
  muc: MucKhoa;
  /** Câu giải thích cho người vận hành. Rỗng khi `muc === 'SUA'`. */
  vi: string;
  /** Lối ra gợi ý — `null` khi ⛔ không còn lối nào ngoài Re-open. */
  loiRa: string | null;
}

const CHO_SUA: PhanQuyet = { muc: 'SUA', vi: '', loiRa: null };

export function duocSua(pq: PhanQuyet): boolean {
  return pq.muc === 'SUA';
}

// ─── 2. LUẬT CỦA **PO** — Board khai từng dòng ─────────────────────────────

/**
 * Bối cảnh workflow của một PO.
 *
 * ⚠️ `daSinhLenhSanXuat` phải **ĐO từ bảng `production_orders`**, ⛔ không suy
 * từ `status`. Suy từ `status` là quay lại đúng thứ Board vừa bác.
 */
export interface BoiCanhPo {
  status: string;
  /** Đã có ít nhất một lệnh sản xuất CHƯA huỷ trỏ vào PO này. */
  daSinhLenhSanXuat: boolean;
}

/** Trạng thái **đóng tuyệt đối** — ⛔ không Update, ⛔ không Delete, chỉ Re-open. */
export const PO_KHOA_TUYET_DOI: readonly string[] = ['COMPLETED'];

/**
 * Trạng thái **đóng** — ⛔ không sửa, nhưng ⛔ không cần Re-open cấp giám đốc để
 * gỡ: `SHIPPED` còn lùi được bằng chứng từ điều chỉnh xuất hàng, `CANCELLED`
 * thì bản thân nó đã là *"đơn ⛔ không còn hiệu lực"*.
 */
export const PO_KHOA: readonly string[] = ['SHIPPED', 'CANCELLED'];

/**
 * Phán quyết cho **một lượt sửa PO**.
 *
 * ─── 🔑 THỨ TỰ BỐN PHÉP THỬ **LÀ** BỘ LUẬT ────────────────────────────────
 * ```
 *   ① COMPLETED            → KHOÁ TUYỆT ĐỐI      (Board: "Khóa tuyệt đối")
 *   ② SHIPPED · CANCELLED  → KHOÁ                (Board: "SHIPPED: Khóa")
 *   ③ đã sinh Production Order → CHỈ YÊU CẦU THAY ĐỔI
 *   ④ còn lại (DRAFT · APPROVED) → SỬA           (kèm Audit Log — mục 4)
 * ```
 *
 * ⚠️ **③ đứng SAU ① ②, và đứng TRƯỚC ④.** Đảo ③ lên đầu thì một PO
 * `COMPLETED` mà ⛔ chưa kịp sinh lệnh sản xuất sẽ rơi vào nhánh *"sửa được"*.
 * Đảo ③ xuống cuối thì một PO `DRAFT` **đã có lệnh đang chạy trên chuyền** lại
 * sửa được — đúng lỗ hổng Board chỉ ra.
 *
 * ⚠️ `IN_PRODUCTION` **cố ý ⛔ không có nhánh riêng.** Nó rơi vào ③ **nhờ dữ
 * liệu**, ⛔ không nhờ tên trạng thái. PO `IN_PRODUCTION` mà ⛔ không có lệnh
 * sản xuất nào là **dữ liệu ⛔ không nhất quán** — và lúc đó sửa được PO là
 * đúng, vì ⛔ chẳng có gì ở hạ nguồn để làm sai.
 */
export function phanQuyetSuaPo(bc: BoiCanhPo): PhanQuyet {
  const tt = String(bc.status ?? '').toUpperCase();

  if (PO_KHOA_TUYET_DOI.includes(tt)) {
    return {
      muc: 'KHOA_TUYET_DOI',
      vi: 'Đơn hàng đã HOÀN THÀNH — khoá tuyệt đối. ⛔ Không sửa, ⛔ không xoá.',
      loiRa: 'Chỉ Giám đốc hoặc Super Admin mới mở lại được đơn đã hoàn thành.',
    };
  }

  if (PO_KHOA.includes(tt)) {
    return {
      muc: 'KHOA',
      vi: tt === 'SHIPPED'
        ? 'Đơn hàng ĐÃ XUẤT HÀNG — chứng từ đã khoá.'
        : 'Đơn hàng ĐÃ HUỶ — chứng từ đã khoá.',
      loiRa: 'Cần thay đổi thì lập chứng từ điều chỉnh, ⛔ không sửa đè lên đơn gốc.',
    };
  }

  if (bc.daSinhLenhSanXuat) {
    return {
      muc: 'YEU_CAU_THAY_DOI',
      vi: 'Đơn hàng ĐÃ SINH LỆNH SẢN XUẤT — xưởng đang chạy theo số liệu này nên '
        + '⛔ không sửa trực tiếp được.',
      loiRa: 'Lập YÊU CẦU THAY ĐỔI để chuyền và kế hoạch cùng thấy, rồi mới áp dụng.',
    };
  }

  return CHO_SUA;
}

// ─── 3. RE-OPEN — ai được mở lại chứng từ đã đóng ──────────────────────────

/**
 * 🔴 **Board: *"Chỉ CEO hoặc Director mới được Re-open."***
 *
 * ⚠️ **Monica ⛔ KHÔNG có vai `ceo` và ⛔ KHÔNG có vai `director`.**
 * `ALL_ROLES` *(`lib/rbac.ts`)* có 14 vai và ⛔ không vai nào tên vậy. Board đã
 * xác nhận 06/08/2026: **Production Director = giám đốc = vai `giamdoc`** —
 * và chỉ thị hôm ấy nói rõ **⛔ KHÔNG tạo vai mới**.
 *
 * ⇒ *"CEO hoặc Director"* phân giải thành **`giamdoc` + `superadmin`**.
 * `superadmin` vào được vì nó là vai quản trị hệ thống *(`MODULE_ACCESS` cho
 * nó `'*'`)*, ⛔ không phải vì nó là một chức danh nghiệp vụ.
 *
 * 🔴 **`md` ⛔ KHÔNG nằm trong danh sách này** — và đó là **toàn bộ ý nghĩa**
 * của điều khoản. MD tự mở lại được đơn mình vừa đóng thì *"khoá tuyệt đối"*
 * chỉ là một hộp thoại xác nhận.
 */
export const VAI_MO_LAI: readonly Role[] = ['giamdoc', 'superadmin'];

export function duocMoLai(role: Role | null): boolean {
  return role !== null && VAI_MO_LAI.includes(role);
}

/**
 * Phán quyết cho **một lượt Re-open**.
 *
 * ⚠️ Trả về `KHOA` *(⛔ không phải `SUA`)* khi chứng từ **⛔ chưa đóng**: mở lại
 * một đơn đang chạy là thao tác **vô nghĩa**, và cho phép nó sẽ sinh ra một
 * dòng Audit Log *"đã mở lại"* trên đơn chưa từng đóng — nhiễu sổ kiểm toán.
 */
export function phanQuyetMoLaiPo(status: string, role: Role | null): PhanQuyet {
  const tt = String(status ?? '').toUpperCase();

  if (!PO_KHOA_TUYET_DOI.includes(tt) && !PO_KHOA.includes(tt)) {
    return {
      muc: 'KHOA',
      vi: `Đơn hàng đang ở trạng thái "${tt || '⚪ chưa rõ'}" — ⛔ chưa đóng nên ⛔ không có gì để mở lại.`,
      loiRa: null,
    };
  }

  if (!duocMoLai(role)) {
    return {
      muc: 'KHOA_TUYET_DOI',
      vi: 'Chỉ **Giám đốc** hoặc **Super Admin** mới được mở lại chứng từ đã đóng.',
      loiRa: 'Trình Giám đốc mở lại, hoặc lập chứng từ điều chỉnh.',
    };
  }

  return CHO_SUA;
}

/** Trạng thái một PO quay về **sau khi** được mở lại.
 *
 *  🔑 Về `APPROVED`, ⛔ **không** về `DRAFT`. Đơn đã từng hoàn thành là đơn đã
 *  qua phê duyệt — hạ nó xuống `DRAFT` là **xoá bằng chứng phê duyệt**
 *  *(Hiến pháp Điều 8 · Evidence First)*. `APPROVED` là trạng thái mở gần nhất
 *  mà ⛔ không nói dối về lịch sử. */
export const PO_SAU_KHI_MO_LAI = 'APPROVED';

// ─── 4. LUẬT CHUNG CHO BẢY CHỨNG TỪ CÒN LẠI ────────────────────────────────

/**
 * Bảy loại chứng từ `BUG-5` liệt kê, cộng `ORDER` để một bảng nói hết.
 *
 * ⚠️ `ORDER` có mặt trong bảng **chỉ để tra nhãn**. Phán quyết của nó đi qua
 * `phanQuyetSuaPo()` — bảng này ⛔ không diễn tả được phép thử *"đã sinh lệnh
 * sản xuất chưa"*.
 */
export type LoaiChungTu =
  | 'CUSTOMER' | 'INQUIRY' | 'COSTING' | 'STYLE'
  | 'TECH_PACK' | 'BOM' | 'MATERIAL_REQUEST' | 'ORDER';

export interface LuatChungTu {
  nhan: string;
  /** Cột mang vòng đời. `null` ⇒ chứng từ ⛔ không có trạng thái ⇒ luôn sửa được. */
  cotTrangThai: string | null;
  khoaTuyetDoi: readonly string[];
  khoa: readonly string[];
  /** Trạng thái dùng làm **LƯU TRỮ** — `null` ⇒ ⛔ chưa có chỗ lưu trữ trung thực. */
  trangThaiLuuTru: string | null;
  /** Vì sao chọn đúng trạng thái ấy làm lưu trữ. Hiện thẳng trong hộp thoại. */
  ghiChuLuuTru: string;
}

/**
 * 🔴 **⛔ KHÔNG BỊA TRẠNG THÁI LƯU TRỮ.** Mỗi giá trị ở `trangThaiLuuTru` là
 * một giá trị **ĐÃ CÓ** trong ràng buộc `CHECK` của migration `014`/`015`, tra
 * được bằng một câu `SELECT`. Ghi `'ARCHIVED'` vào cột có `CHECK` ⛔ không chứa
 * nó sẽ đổ lỗi `23514` ngay tại chỗ người dùng bấm.
 *
 * ⚠️ **Ba chứng từ có `trangThaiLuuTru = null` — và đó là sự thật, ⛔ không
 * phải thiếu sót của bản vá này.** `md_documents` · `style_bom` ⛔ không có cột
 * trạng thái nào; `material_requests` có `REJECTED` nhưng *"bị từ chối"* ⛔
 * **không** đồng nghĩa *"đã lưu trữ"* — mượn nó là **ghi sai sự thật nghiệp vụ
 * vào CSDL**. Lưu trữ thật cho ba bảng ấy cần cột `deleted_at`, tức **đổi lược
 * đồ**, tức **migration** — đang bị `SECURITY FREEZE` chặn. Xem `ADR-027`.
 */
export const LUAT: Record<LoaiChungTu, LuatChungTu> = {
  CUSTOMER: {
    nhan: 'Khách hàng',
    // `customers` ⛔ không có cột `status`; vòng đời của nó là cờ `is_active`.
    cotTrangThai: null,
    khoaTuyetDoi: [],
    khoa: [],
    trangThaiLuuTru: 'is_active=false',
    ghiChuLuuTru: 'Ngưng giao dịch — hồ sơ và toàn bộ đơn cũ GIỮ NGUYÊN, chỉ thôi hiện ở ô chọn.',
  },
  INQUIRY: {
    nhan: 'Yêu cầu báo giá',
    cotTrangThai: 'status',
    khoaTuyetDoi: [],
    // `WON` ⇒ đã thành đơn hàng. Sửa yêu cầu gốc lúc đó là sửa **bằng chứng
    // của một thương vụ đã chốt** — khoá, ⛔ không khoá tuyệt đối vì nó ⛔
    // không phải chứng từ tài chính.
    khoa: ['WON', 'LOST', 'CANCELLED'],
    trangThaiLuuTru: 'CANCELLED',
    ghiChuLuuTru: 'Huỷ yêu cầu — có sẵn trong ràng buộc CHECK của migration 015.',
  },
  COSTING: {
    nhan: 'Chiết tính giá',
    cotTrangThai: 'status',
    khoaTuyetDoi: [],
    // 🔴 Ba tầng ĐANG CHẶN thật ở CSDL, ⛔ không phải suy đoán:
    //   · RLS `costings_no_edit_after_approve` *(migration `042` Mục 3)*
    //   · trigger `mos_guard_aggregate_immutability` *(`045` · `045b`)*
    //   · `046` khoá luôn `costing_items` của bản đã duyệt
    // Tầng này khai **đúng** như CSDL để người dùng nhận câu tiếng Việt thay vì
    // lỗi `23514` — ⛔ không phải để thay thế ba tầng kia.
    khoa: ['APPROVED', 'SUPERSEDED'],
    trangThaiLuuTru: 'SUPERSEDED',
    ghiChuLuuTru: 'Đã có bản mới thay thế — đúng đường "Làm bản mới" (reviseCosting) đang dùng.',
  },
  STYLE: {
    nhan: 'Mã hàng',
    cotTrangThai: 'status',
    khoaTuyetDoi: [],
    khoa: ['DISCONTINUED'],
    trangThaiLuuTru: 'DISCONTINUED',
    ghiChuLuuTru: 'Ngừng sản xuất — có sẵn trong ràng buộc CHECK của migration 015.',
  },
  TECH_PACK: {
    nhan: 'Tech Pack / tài liệu',
    cotTrangThai: null,
    khoaTuyetDoi: [],
    khoa: [],
    // ⛔ CHƯA CÓ. `md_documents` ⛔ không có cột trạng thái lẫn `deleted_at`.
    trangThaiLuuTru: null,
    ghiChuLuuTru: '⛔ CHƯA lưu trữ được: bảng md_documents ⛔ không có cột trạng thái '
      + 'hay deleted_at. Cần migration — ADR-027, đang bị SECURITY FREEZE chặn.',
  },
  BOM: {
    nhan: 'Định mức NPL (BOM)',
    cotTrangThai: null,
    khoaTuyetDoi: [],
    khoa: [],
    trangThaiLuuTru: null,
    ghiChuLuuTru: '⛔ CHƯA lưu trữ được: bảng style_bom ⛔ không có cột trạng thái '
      + 'hay deleted_at. Cần migration — ADR-027, đang bị SECURITY FREEZE chặn.',
  },
  MATERIAL_REQUEST: {
    nhan: 'Yêu cầu NPL',
    cotTrangThai: 'status',
    // `RECEIVED` ⇒ vật tư đã nhập kho, đã có phiếu nhập đối ứng. Sửa số lượng
    // lúc đó làm lệch tồn kho — đúng loại sai ⛔ không lỗi nào nổ ra.
    khoaTuyetDoi: ['RECEIVED'],
    // `ORDERED` ⇒ đã đặt nhà cung cấp. Còn gỡ được, nhưng phải qua Yêu cầu
    // thay đổi để mua hàng cùng thấy.
    khoa: ['ORDERED'],
    trangThaiLuuTru: null,
    ghiChuLuuTru: '⛔ CHƯA lưu trữ được: `REJECTED` nghĩa là "BỊ TỪ CHỐI", ⛔ KHÔNG '
      + 'phải "đã lưu trữ". Mượn nó là ghi sai sự thật nghiệp vụ. Cần cột '
      + 'deleted_at — ADR-027.',
  },
  ORDER: {
    nhan: 'Đơn hàng (PO)',
    cotTrangThai: 'status',
    khoaTuyetDoi: PO_KHOA_TUYET_DOI,
    khoa: PO_KHOA,
    trangThaiLuuTru: 'CANCELLED',
    ghiChuLuuTru: 'Huỷ đơn — ⛔ KHÔNG xoá. `orders` ⛔ không có cột deleted_at.',
  },
};

/**
 * Phán quyết chung theo bảng `LUAT`.
 *
 * ⚠️ Gọi hàm này cho `ORDER` là **SAI** — nó ⛔ không nhìn thấy lệnh sản xuất.
 * Hàm tự chặn thay vì trả một phán quyết dễ dãi trong im lặng.
 */
export function phanQuyetSua(loai: LoaiChungTu, status: string | null): PhanQuyet {
  if (loai === 'ORDER') {
    throw new Error(
      'phanQuyetSua("ORDER") ⛔ không hợp lệ — PO phải đi qua phanQuyetSuaPo() '
      + 'để phép thử "đã sinh lệnh sản xuất chưa" được chạy.',
    );
  }

  const luat = LUAT[loai];
  if (luat.cotTrangThai === null) return CHO_SUA;

  const tt = String(status ?? '').toUpperCase();

  if (luat.khoaTuyetDoi.includes(tt)) {
    return {
      muc: 'KHOA_TUYET_DOI',
      vi: `${luat.nhan} ở trạng thái "${tt}" — khoá tuyệt đối, ⛔ không sửa, ⛔ không xoá.`,
      loiRa: 'Chỉ Giám đốc hoặc Super Admin mở lại được.',
    };
  }

  if (luat.khoa.includes(tt)) {
    return {
      muc: 'KHOA',
      vi: `${luat.nhan} ở trạng thái "${tt}" — chứng từ đã đóng, ⛔ không sửa đè được.`,
      loiRa: loai === 'COSTING'
        ? 'Dùng "Làm bản mới" để tạo phiên bản kế tiếp — bản cũ giữ nguyên làm bằng chứng.'
        : 'Lập chứng từ điều chỉnh, hoặc Yêu cầu thay đổi.',
    };
  }

  return CHO_SUA;
}

/** Chứng từ này có chỗ lưu trữ trung thực chưa? */
export function luuTruDuoc(loai: LoaiChungTu): boolean {
  return LUAT[loai].trangThaiLuuTru !== null;
}
