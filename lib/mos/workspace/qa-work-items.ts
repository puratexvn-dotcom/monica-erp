import { chieuViec, type WorkItem, type WorkItemRule } from './work-item';
import { defectRatePercent } from '@/lib/garment-math';

// ============================================================================
// LUẬT SINH VIỆC CỦA QA — "hôm nay QA cần làm gì?"
//
// ═══ ⚠️ MỌI LUẬT Ở ĐÂY ĐỀU CHIẾU TỪ DỮ LIỆU CÓ THẬT ════════════════════
// ⛔ KHÔNG luật nào cần một bảng mới. Tất cả đọc từ `qa_audit_reports` +
// `qa_defects` — hai bảng đang chạy, đang có dữ liệu.
//
// 🔑 Đây là bằng chứng cho `WZ-1`: Work Inbox **⛔ không cần migration**. Điều
//    tôi từng ghi ở `BA-1 §13.1` *("Work Inbox — ⛔ không bảng nào ⇒ cần
//    migration")* **đúng về dữ kiện nhưng sai về kết luận**: nó ⛔ không cần
//    bảng RIÊNG, vì nó ⛔ không sở hữu dữ liệu. Nó **chiếu**.
//
// ═══ VÌ SAO NGƯỠNG NẰM Ở ĐÂY, ⛔ KHÔNG NẰM TRONG CÂU LỆNH SQL ══════════
// Ngưỡng là **luật nghiệp vụ** — Business Owner của QA quyết *(BA-1 §24)*.
// Chôn nó vào một câu `WHERE` thì đổi ngưỡng phải sửa truy vấn, và ⛔ không ai
// đọc được luật hiện hành mà ⛔ không đọc SQL.
// ============================================================================

/** Ngưỡng tỷ lệ lỗi — vượt là việc **khẩn**.
 *
 *  ⚠️ 3% là ngưỡng vận hành đang dùng ở màn QA cũ *(`page.tsx` tô đỏ khi
 *  `> 3`)*. Tôi **giữ nguyên con số đó**, ⛔ không tự đặt lại: đổi ngưỡng chất
 *  lượng là **quyết định nghiệp vụ**, ⛔ không phải quyết định của người dựng
 *  màn hình. */
export const NGUONG_TY_LE_LOI = 3;

/** Một loại lỗi lặp lại từng này lần trong ngày ⇒ đáng cân nhắc mở CAPA.
 *
 *  ⚠️ Ba lần ⛔ không phải con số thần thánh — nó là **ngưỡng chú ý**, và luật
 *  này chỉ sinh việc mức `WARNING`. Nó nói *"nhìn lại đi"*, ⛔ không nói
 *  *"phải mở CAPA"*. Quyết định mở CAPA vẫn là của người. */
export const NGUONG_LOI_LAP = 3;

/**
 * 🔴 `G-19` — NƠI XỬ LÝ CỦA TỪNG VIỆC.
 *
 * `P33`: mọi việc và mọi KPI phải **dẫn tới một hành động**. Một dòng việc
 * ⛔ không lối đi tiếp khiến người đọc **biết có vấn đề** mà **⛔ không biết
 * làm gì** ⇒ họ **đi hỏi người khác** — đúng thứ `§13` muốn xoá.
 *
 * ⚠️ Khai ở **lõi thuần** chứ ⛔ không ở màn hình: neo là **một phần của luật**
 * *(việc này xử lý Ở ĐÂU)*, ⛔ không phải chi tiết trình bày. Đổi bố cục màn
 * hình ⛔ không được làm mất lối đi của một việc.
 */
export const QA_NEO = {
  /** Bảng nhật ký kiểm hàng — nơi **nhìn thấy bằng chứng**. */
  nhatKy: '#nhat-ky',
  /** Biểu mẫu ghi phiếu — nơi **làm cho việc biến mất**. */
  ghiPhieu: '#ghi-phieu',
} as const;

/** Dữ liệu QA mà các luật cần. Cố ý **hẹp**: chỉ chừng này thì hàm kiểm được
 *  ⛔ không cần CSDL, và ⛔ không kéo theo cả kiểu `QAReport` của tầng app. */
export interface DuLieuQA {
  /** Số phiếu kiểm **trong ngày đang xét**. */
  soPhieuHomNay: number;
  tongKiem: number;
  tongLoi: number;
  /** Số lỗi theo chuyền — chỉ những chuyền **có lỗi**. */
  loiTheoChuyen: ReadonlyArray<{ chuyen: string; soLoi: number }>;
  /** Số lần xuất hiện theo loại lỗi, trong ngày. */
  loiTheoLoai: ReadonlyArray<{ loai: string; soLan: number }>;
}

/**
 * ⚠️ Thứ tự khai báo **là** thứ tự hiển thị trong cùng một mức khẩn *(`WI-1`)*.
 * Xếp từ *"việc chặn cả ngày"* xuống *"việc nên để mắt"*.
 */
const LUAT: WorkItemRule<DuLieuQA>[] = [
  // ─── CRITICAL ─────────────────────────────────────────────────────────
  {
    // 🔑 Việc QUAN TRỌNG NHẤT là việc **⛔ chưa xảy ra**.
    //
    // Mọi luật khác nhìn vào lỗi đã ghi nhận. Luật này nhìn vào **sự vắng
    // mặt** — và đó đúng là thứ ⛔ không màn hình nào tự nói ra: một chuyền
    // chạy cả buổi mà ⛔ không ai rút kiểm thì bảng số liệu trông **sạch bong**,
    // vì ⛔ không có lỗi nào được ghi. Bảng càng đẹp thì rủi ro càng lớn.
    id: 'qa.chua-kiem',
    severity: 'CRITICAL',
    labelKey: 'work.qa.chuaKiem',
    danhGia: (d) =>
      // Việc này biến mất khi có phiếu ⇒ đưa thẳng tới NƠI GHI PHIẾU,
      // ⛔ không đưa tới bảng nhật ký đang rỗng.
      d.soPhieuHomNay === 0 ? { nổ: true, href: QA_NEO.ghiPhieu } : { nổ: false },
  },
  {
    id: 'qa.vuot-nguong-loi',
    severity: 'CRITICAL',
    labelKey: 'work.qa.vuotNguong',
    danhGia: (d) => {
      if (d.soPhieuHomNay === 0 || d.tongKiem === 0) return { nổ: false };
      const tyLe = defectRatePercent(d.tongLoi, d.tongKiem);
      return tyLe > NGUONG_TY_LE_LOI
        ? { nổ: true, vars: { tyLe: tyLe.toFixed(1), nguong: NGUONG_TY_LE_LOI }, href: QA_NEO.nhatKy }
        : { nổ: false };
    },
  },

  // ─── WARNING ──────────────────────────────────────────────────────────
  {
    id: 'qa.chuyen-nhieu-loi',
    severity: 'WARNING',
    labelKey: 'work.qa.chuyenNhieuLoi',
    danhGia: (d) => {
      if (d.loiTheoChuyen.length === 0) return { nổ: false };
      // Chuyền lỗi nhiều nhất. ⛔ Không sinh mỗi chuyền một việc (`WI-2`) —
      // và cũng ⛔ không nên: mười chuyền cùng có lỗi thì mười dòng việc làm
      // hộp thư thành một bảng thống kê thứ hai.
      const nang = [...d.loiTheoChuyen].sort((a, b) => b.soLoi - a.soLoi)[0];
      return { nổ: true, vars: { chuyen: nang.chuyen, soLoi: nang.soLoi }, href: QA_NEO.nhatKy };
    },
  },
  {
    id: 'qa.loi-lap-lai',
    severity: 'WARNING',
    labelKey: 'work.qa.loiLapLai',
    danhGia: (d) => {
      const lap = [...d.loiTheoLoai]
        .filter((x) => x.soLan >= NGUONG_LOI_LAP)
        .sort((a, b) => b.soLan - a.soLan)[0];
      return lap ? { nổ: true, vars: { loai: lap.loai, soLan: lap.soLan }, href: QA_NEO.nhatKy } : { nổ: false };
    },
  },

  // ─── INFO ─────────────────────────────────────────────────────────────
  {
    // ⚠️ Việc mức `INFO` chỉ nổ khi **⛔ KHÔNG có việc nào khác** — xem
    // `viecCuaQA` bên dưới. Một dòng *"hôm nay ổn"* nằm cạnh một dòng
    // *"vượt ngưỡng lỗi"* là mâu thuẫn, và người đọc sẽ tin dòng dễ chịu hơn.
    id: 'qa.on-dinh',
    severity: 'INFO',
    labelKey: 'work.qa.onDinh',
    danhGia: (d) =>
      // ⚠️ Việc mức `INFO` CỐ Ý ⛔ không có `href`: nó ⛔ không phải một việc
      // phải làm, nên nó ⛔ không được giả vờ bấm được. `P33` đòi lối đi cho
      // việc CẦN XỬ LÝ, ⛔ không đòi cho một lời trấn an.
      d.soPhieuHomNay > 0 ? { nổ: true, vars: { soPhieu: d.soPhieuHomNay } } : { nổ: false },
  },
];

/**
 * Danh sách việc của QA trong ngày.
 *
 * 🔑 **Vế cuối là phần dễ làm sai nhất:** nếu có bất kỳ việc thật nào, dòng
 * *"hôm nay ổn định"* phải **biến mất**. Hộp thư việc nói **một** câu chuyện,
 * ⛔ không nói hai câu chuyện ngược nhau rồi để người dùng tự chọn tin cái nào.
 */
export function viecCuaQA(d: DuLieuQA): WorkItem[] {
  const tatCa = chieuViec(LUAT, d);
  const viecThat = tatCa.filter((v) => v.severity !== 'INFO');
  return viecThat.length > 0 ? viecThat : tatCa;
}
