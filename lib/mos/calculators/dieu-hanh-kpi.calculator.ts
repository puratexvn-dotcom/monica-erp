// ============================================================================
// KPI ĐIỀU HÀNH — DỮ LIỆU VẼ CHO BÀN CỦA PRODUCTION DIRECTOR
//
// Board 06/08/2026: *"luôn luôn phải là **ưu tiên trực quan, biểu đồ**"* và
// *"tự tổng hợp thành một báo cáo trực quan **gửi cho CEO và Production
// Director**"*.
//
// 🔑 `/giam-doc` đang có **dữ liệu tốt mà bày toàn bằng bảng**: nút thắt WIP
// theo PO, tỷ lệ lỗi theo chuyền. Bảng bắt giám đốc **đọc từng dòng rồi tự so**
// — đúng việc mà một cái liếc lẽ ra làm xong.
//
// ⚠️ Phép tính nằm ở đây, ⛔ KHÔNG ở component. Bánh cóc *"màn hình MỚI ⛔
// không tự tính"* chặn đúng chỗ này, và nó chặn có lý: cùng những con số này
// còn xuất hiện ở báo cáo ngày và ở bảng của MD.
// ============================================================================

/** Một PO đang nghẽn, đúng hình dạng `getExecutiveDashboardData()` trả về. */
export interface DongNutThat {
  po_number: string;
  cut: number;
  sewn: number;
  wip: number;
}

/** Một chuyền may kèm số kiểm/lỗi. `rate` là chuỗi vì tầng trên đã `toFixed`. */
export interface DongLoiChuyen {
  line_name: string;
  inspected: number;
  defects: number;
  rate: string;
}

export interface CotNutThat {
  po: string;
  'Đã cắt': number;
  'Đã may': number;
  /** Chênh lệch cắt ⟷ may = hàng đang nằm giữa hai khâu. */
  'Đang kẹt': number;
}

export interface CotLoiChuyen {
  chuyen: string;
  ti: number;
  kiem: number;
  loi: number;
  /** Vượt ngưỡng ⇒ tô màu nguy cấp. */
  vuot: boolean;
}

const so = (v: number | null | undefined): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Dữ liệu vẽ cho biểu đồ **nút thắt WIP theo PO**.
 *
 *  🔑 Vẽ **cả ba cột** *(cắt · may · kẹt)* chứ ⛔ không chỉ cột "kẹt": một PO
 *  kẹt 500 sp trên nền 10.000 đã cắt là chuyện khác hẳn PO kẹt 500 trên nền
 *  600. Bỏ mẫu số đi là biến biểu đồ thành lời buộc tội thiếu căn cứ. */
export function cotNutThat(rows: readonly DongNutThat[]): CotNutThat[] {
  return rows.map((r) => ({
    po: r.po_number,
    'Đã cắt': so(r.cut),
    'Đã may': so(r.sewn),
    'Đang kẹt': so(r.wip),
  }));
}

/** Dữ liệu vẽ cho biểu đồ **tỷ lệ lỗi theo chuyền**, kèm phán quyết ngưỡng.
 *
 *  ⚠️ `nguong` mặc định `3` **⛔ không phải AQL**. AQL 2.5 là phép lấy mẫu theo
 *  bảng ISO 2859-1, ⛔ không phải một ngưỡng phần trăm — trộn hai thứ đó là sai
 *  nghiệp vụ. Đây chỉ là **ngưỡng cảnh báo vận hành** mà màn hình `/giam-doc`
 *  đã dùng sẵn cho ô "Tỷ Lệ Lỗi Hệ Thống". */
export function cotLoiChuyen(rows: readonly DongLoiChuyen[], nguong = 3): CotLoiChuyen[] {
  return rows.map((r) => {
    const ti = so(Number.parseFloat(r.rate));
    return {
      chuyen: r.line_name,
      ti,
      kiem: so(r.inspected),
      loi: so(r.defects),
      vuot: ti > nguong,
    };
  });
}
