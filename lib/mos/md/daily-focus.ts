// ============================================================================
// HÔM NAY CẦN LÀM GÌ — và HÔM NAY ĐÃ XONG BAO NHIÊU
//
// Board Directive 07/08/2026 *(MD v1.0 Final Polish)* §7–§8.
//
// ─── 🔴 MỘT MÂU THUẪN PHẢI GIẢI TRƯỚC KHI VIẾT DÒNG ĐẦU ────────────────
// Board đòi **Daily Focus** *(3–5 việc)* và **Daily Achievement** *("6/9 công
// việc")*, nhưng cùng chỉ thị nói **"⛔ không thêm dữ liệu mới"**.
//
// Mà đo thật thì: **cả năm bảng nuôi hộp thư việc đều RỖNG**
// *(`order_milestones` · `sample_submissions` · `change_requests` ·
// `md_comments` · `v_order_risk`)* — vì `seedMilestones()` chỉ chạy lúc TẠO
// PO, còn 14 đơn đang chạy được tạo **trước** khi có đoạn mã đó.
//
// ⇒ Dựng *"6/9 công việc"* trên nền đó là **bịa một mẫu số**. Và một thanh
// tiến độ bịa còn tệ hơn ⛔ không có thanh nào: nó tạo **cảm giác tiến bộ giả**,
// đúng thứ Board nói tránh *("⛔ không cần gamification")*.
//
// ─── 🔑 CÁCH GIẢI: ĐO MỘT THỨ CÓ THẬT VÀ MD THẬT SỰ ĐUỔI MỖI NGÀY ───────
// Việc hằng ngày của MD ⛔ không phải "tick xong 9 ô". Nó là:
// **gom đủ báo cáo từ bốn nguồn** — chuyền may · tổ hoàn thành · QA · nhà thầu.
// Thiếu một nguồn là hôm đó ⛔ không chốt được số cho giám đốc.
//
// Báo cáo ngày ĐÃ biết nguồn nào ⚪ *(`ChiSo.gia === null`)*. Vậy mẫu số có
// thật, tử số có thật, và nó **đo đúng việc MD đang làm**.
//
// ⚠️ Đây ⛔ **không** phải dữ liệu mới — nó là **cách đọc khác** trên đúng số
// liệu báo cáo ngày đang có.
// ============================================================================
import type { BaoCaoNgay, CanhBao, DichCanhBao } from './daily-digest';

export interface ViecTieuDiem {
  /** Câu mệnh lệnh — đọc là biết làm gì, ⛔ không phải suy ra. */
  viec: string;
  /** Vì sao nó vào tiêu điểm hôm nay. */
  vi: string;
  /** Khu cần mở. `null` ⇒ việc làm ngoài hệ thống *(gọi điện, nhắc người)*. */
  dich: DichCanhBao | null;
  nguyCap: boolean;
}

export interface TienDoNgay {
  /** Số nguồn đã gửi báo cáo hôm nay. */
  daNhan: number;
  /** Tổng số nguồn cần gom. */
  tong: number;
  phanTram: number;
  /** Tên các nguồn còn thiếu — để màn hình nói **ai** chưa gửi. */
  conThieu: string[];
}

/** Tối đa 5 — Board §7: *"Chỉ 3–5 việc. ⛔ Không phải Task List đầy đủ."* */
const TOI_DA = 5;

/** Tối đa **3** dòng lấy từ khu rủi ro.
 *
 *  🔴 Board §3: *"⛔ Không trùng lặp."*
 *  Bản đầu tôi lấy 5 cảnh báo nghiêm trọng đầu tiên — và màn hình hiện **đúng
 *  năm dòng đỏ vừa đọc ở khu ③, cách đó một màn cuộn**. Đó là trùng lặp, ⛔
 *  không phải nhấn mạnh: người đọc mất niềm tin rằng hai khu nói hai chuyện.
 *
 *  ⇒ Tiêu điểm lấy **tối đa 3 vấn đề gấp nhất**, phần còn lại nhường cho
 *  **nhắc việc** — những việc làm NGOÀI hệ thống *(gọi buyer, nhắc tổ trưởng)*
 *  mà khu rủi ro ⛔ không hề có. Nhờ vậy hai khu **bổ nhau**, ⛔ không lặp nhau. */
const TOI_DA_RUI_RO = 3;

/**
 * Ba tới năm việc phải chốt hôm nay.
 *
 * 🔑 Nguồn: **cảnh báo nghiêm trọng** *(đã sắp theo mức độ ở `daily-digest`)*
 * + **nhắc việc** của báo cáo ngày. Cả hai đều là dữ liệu ĐANG CÓ.
 *
 * ⚠️ Cảnh báo đứng TRƯỚC nhắc việc: một đơn đã quá hạn giao quan trọng hơn
 * việc nhắc tổ trưởng gửi số. Xếp ngược lại là để **thủ tục đè lên hậu quả**.
 *
 * ⚠️ ⛔ KHÔNG lặp lại toàn bộ danh sách rủi ro — khu Risk Center ở trên đã bày
 * đủ. Tiêu điểm chỉ lấy **phần đỉnh**, và đó chính là lý do nó tồn tại: bảy
 * dòng đỏ ⛔ không giúp ai chọn việc nào làm trước.
 */
export function tieuDiemHomNay(bc: BaoCaoNgay): ViecTieuDiem[] {
  const ra: ViecTieuDiem[] = [];

  const nguyCap = bc.canhBao.filter((c: CanhBao) => c.mucDo === 'NGHIEM_TRONG');
  for (const c of nguyCap.slice(0, TOI_DA_RUI_RO)) {
    ra.push({ viec: c.tieuDe, vi: c.chiTiet, dich: c.dich, nguyCap: true });
  }

  for (const v of bc.nhacViec) {
    if (ra.length >= TOI_DA) break;
    // ⚠️ Nếu ⛔ không đủ nhắc việc để lấp, LẤY THÊM cảnh báo — thà lặp một dòng
    // còn hơn để tiêu điểm chỉ có 3 mục khi thực tế có 7 vấn đề đang chờ.
    // Nhắc việc là câu đã ở dạng mệnh lệnh sẵn; ⛔ không có đích cụ thể vì phần
    // lớn là **gọi người ngoài hệ thống**.
    ra.push({ viec: v, vi: 'Nhắc việc theo báo cáo ngày', dich: null, nguyCap: false });
  }

  for (const c of nguyCap.slice(TOI_DA_RUI_RO)) {
    if (ra.length >= TOI_DA) break;
    ra.push({ viec: c.tieuDe, vi: c.chiTiet, dich: c.dich, nguyCap: true });
  }

  return ra;
}

/** Nhãn nguồn ⟷ nhãn chỉ số của báo cáo ngày. */
const NGUON: { nhan: string; chiSo: string }[] = [
  { nhan: 'Chuyền may & Hoàn thành', chiSo: 'Sản lượng nội bộ' },
  { nhan: 'Kế hoạch ngày', chiSo: 'Đạt kế hoạch' },
  { nhan: 'Nhà thầu ngoài', chiSo: 'Sản lượng gia công ngoài' },
  { nhan: 'QA kiểm hàng', chiSo: 'Tỉ lệ lỗi (QA kiểm)' },
];

/**
 * Tiến độ gom báo cáo hôm nay — *"đã nhận đủ chưa"*, ⛔ không phải *"đã tick
 * xong bao nhiêu ô"*.
 *
 * ⚠️ Một chỉ số `null` nghĩa là **nguồn đó chưa gửi**, ⛔ không phải *"gửi số
 * 0"* — đúng luật `V.1`, và cũng đúng nghiệp vụ: tổ trưởng ⛔ không bao giờ báo
 * "hôm nay làm 0 sản phẩm", họ chỉ **quên báo**.
 */
export function tienDoNgay(bc: BaoCaoNgay): TienDoNgay {
  const conThieu: string[] = [];
  let daNhan = 0;

  for (const n of NGUON) {
    const c = bc.chiSo.find((x) => x.nhan === n.chiSo);
    if (c && c.gia !== null) daNhan += 1;
    else conThieu.push(n.nhan);
  }

  const tong = NGUON.length;
  return { daNhan, tong, phanTram: Math.round((daNhan / tong) * 100), conThieu };
}
