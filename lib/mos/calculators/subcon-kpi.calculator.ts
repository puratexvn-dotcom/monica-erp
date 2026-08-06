// ============================================================================
// KPI GIA CÔNG NGOÀI — DỮ LIỆU VẼ
//
// Board 06/08/2026: *"luôn luôn phải là **ưu tiên trực quan, biểu đồ**"*, và
// *"MD phải quản lý được mọi vấn đề của PO thông qua báo cáo của các tổ trưởng
// và **subcon**"*.
//
// 🔑 Câu quan trọng nhất của gia công ngoài **⛔ không phải** *"đã gửi bao
// nhiêu"* mà là ***"hàng của tôi còn nằm ở xưởng ngoài bao nhiêu"***. Đó là
// hàng đã trả tiền vải, đã trả công cắt, và đang nằm ngoài tầm tay — rủi ro
// vừa về tiến độ vừa về tài sản.
//
// Bảng đơn gia công có đủ ba cột để trả lời, nhưng bắt **trừ nhẩm từng dòng**.
//
// ⚠️ Phép tính ở đây, ⛔ KHÔNG ở component — cùng những con số này còn đi vào
// báo cáo ngày của MD và bảng tổng của giám đốc.
// ============================================================================

/** Một đơn gia công, đúng hình dạng `getSubconDashboardData()` trả về. */
export interface DonGiaCong {
  subcon_order_no: string | null;
  process_type: string | null;
  total_sent_qty: number | null;
  total_received_qty: number | null;
  vendor_name?: string | null;
}

export interface CotGiaCong {
  don: string;
  cong: string;
  'Đã gửi đi': number;
  'Đã nhận về': number;
  /** Chênh lệch = hàng **còn nằm ở xưởng ngoài**. */
  conNgoai: number;
}

const so = (v: number | null | undefined): number => Number(v ?? 0) || 0;

/** Nhãn tiếng Việt của công đoạn gia công.
 *  ⚠️ Tra ⛔ không thấy thì **hiện mã gốc**, ⛔ không để trống — quy tắc nhãn
 *  của dự án. Mã lạ hiện ra là dấu hiệu cần bổ sung nhãn, chỗ trống thì ⛔
 *  không ai biết là thiếu. */
export const CONG_DOAN_LABEL: Record<string, string> = {
  GIAT: 'Giặt',
  IN_THEU: 'In · Thêu',
  WASH: 'Wash',
  EMBROIDERY: 'Thêu',
  PRINT: 'In',
};

export function nhanCongDoan(ma: string | null): string {
  if (!ma) return '⛔ không rõ công đoạn';
  return CONG_DOAN_LABEL[ma] ?? ma;
}

/** Dữ liệu vẽ: gửi ⟷ nhận ⟷ còn ngoài, theo từng đơn gia công.
 *
 *  🔑 Vẽ **cả ba cột** chứ ⛔ không chỉ "còn ngoài": 100 sp còn ngoài trên nền
 *  đã gửi 120 là chuyện khác hẳn 100 trên nền 5.000. Bỏ mẫu số là biến biểu đồ
 *  thành lời báo động thiếu căn cứ.
 *
 *  ⚠️ `conNgoai` kẹp ở `0`: nhận về **nhiều hơn** gửi đi là **dữ liệu sai**
 *  *(hoặc gộp nhầm lô)*, ⛔ không phải "âm hàng tồn". Vẽ một cột âm ở đây chỉ
 *  làm người đọc tưởng phần mềm hỏng thay vì tưởng **số liệu** hỏng.
 */
export function cotGiaCong(don: readonly DonGiaCong[]): CotGiaCong[] {
  return don.map((d) => {
    const gui = so(d.total_sent_qty);
    const nhan = so(d.total_received_qty);
    return {
      don: d.subcon_order_no ?? '⛔ không rõ',
      cong: nhanCongDoan(d.process_type),
      'Đã gửi đi': gui,
      'Đã nhận về': nhan,
      conNgoai: Math.max(0, gui - nhan),
    };
  });
}

/** Tổng hàng còn nằm ngoài — con số MD phải trả lời cho giám đốc. */
export function tongConNgoai(don: readonly DonGiaCong[]): number {
  return cotGiaCong(don).reduce((t, d) => t + d.conNgoai, 0);
}
