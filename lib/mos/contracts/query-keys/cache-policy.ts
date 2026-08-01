// ============================================================================
// CHÍNH SÁCH BỘ NHỚ ĐỆM — PHÂN THEO QUẢN TRỊ DỮ LIỆU, KHÔNG THEO TẦN SUẤT
//
// ─── NGUYÊN LÝ DUY NHẤT CỦA BẢNG NÀY ─────────────────────────────────────
//
//   `staleTime` bị chặn trên bởi ĐƯỜNG NGẮN NHẤT mà dữ liệu có thể thay đổi
//   MÀ MÁY KHÁCH NÀY KHÔNG HAY BIẾT.
//
// Đó là lý do phân bậc theo **QUẢN TRỊ** chứ không theo *"nó đổi mấy lần một
// năm"*. Tần suất là quan sát; quản trị là ràng buộc — và chỉ ràng buộc mới suy
// ra được một con số an toàn.
//
// Ví dụ để thấy sự khác nhau: `defect_catalog` và `partners` **cùng** đổi vài
// lần một năm. Nhưng `defect_catalog` chỉ đổi khi CHẠY MIGRATION — không có
// đường ghi nào lúc chạy, nên không máy nào có thể đổi nó sau lưng máy khác;
// lưu 60 phút là AN TOÀN. Còn `partners` có ô "Thêm đối tác" trên giao diện, và
// người ngồi máy bên cạnh bấm nó **ngay bây giờ**; lưu 60 phút là SAI, dù tần
// suất y hệt.
//
// ─── VÌ SAO KHÔNG ĐỂ MỖI HOOK TỰ ĐẶT ─────────────────────────────────────
// MONICA MOS sẽ có Buyer Portal · Subcon Portal · Sales · HR · CRM · AI. Mỗi
// hook tự gõ một con số thì sau sáu phân hệ sẽ có ba mươi con số rải rác, và
// khi cần siết toàn hệ thống phải sửa ba mươi chỗ — chắc chắn sót.
//
// ⚠️ Hook được phép CHỌN một bậc. Hook KHÔNG được phép gõ một con số.
// Có bài kiểm hợp đồng quét đúng điều đó.
// ============================================================================

/**
 * Năm bậc, phân theo **AI QUẢN TRỊ dữ liệu và QUA CON ĐƯỜNG NÀO**.
 *
 * Ba câu hỏi để chọn bậc, theo đúng thứ tự:
 *
 *   ① **Ai được phép đổi?** Lập trình viên (qua migration) hay người vận hành
 *      (qua giao diện)?
 *   ② **Có đường ghi lúc chạy không?** Không có ⇒ không máy nào đổi được sau
 *      lưng máy khác ⇒ lưu lâu bao nhiêu cũng an toàn.
 *   ③ **Nguồn sự thật ở đâu?** git (mã nguồn) hay cơ sở dữ liệu?
 */
export const STALE_TIME = {
  /**
   * **60 phút** · QUẢN TRỊ BỞI KỸ THUẬT.
   *
   * | | |
   * |---|---|
   * | Ai đổi | lập trình viên |
   * | Qua đâu | migration + rà soát mã + triển khai |
   * | Đường ghi lúc chạy | **KHÔNG CÓ** |
   * | Nguồn sự thật | git |
   *
   * Vì **không tồn tại** đường ghi lúc chạy, dữ liệu không thể đổi trong lúc
   * người dùng đang làm việc. Lưu lâu là an toàn tuyệt đối — thứ duy nhất làm
   * nó đổi là một lần triển khai, và triển khai thì tải lại cả ứng dụng.
   *
   * Ví dụ trong hệ thống: `defect_catalog` (20 mã, seed ở 023) · bảng vai trò ·
   * danh mục vị trí lỗi.
   *
   * ⚠️ Hôm nay bậc này **chưa có hook nào dùng**, và đó là sự thật chứ không
   * phải thiếu sót: danh mục thực sự tĩnh (`INCOTERMS`, `SHIPMENT_FLOW`, 21 vị
   * trí lỗi) đang là **hằng số TypeScript**, không đi qua mạng. Bậc này dành
   * cho danh mục nằm trong CSDL — `defect_catalog` là ứng viên đầu tiên.
   */
  MASTER_STATIC: 60 * 60_000,

  /**
   * **5 phút** · QUẢN TRỊ BỞI NGHIỆP VỤ.
   *
   * | | |
   * |---|---|
   * | Ai đổi | người vận hành có quyền (data steward) |
   * | Qua đâu | màn hình quản trị danh mục, có RBAC và audit |
   * | Đường ghi lúc chạy | **CÓ** |
   * | Nguồn sự thật | cơ sở dữ liệu |
   *
   * ⚠️ Chính ô "Đường ghi lúc chạy = CÓ" quyết định con số này, không phải tần
   * suất. Thao tác ghi CÓ làm mới bộ nhớ đệm — **nhưng chỉ trong tab đã thực
   * hiện thao tác đó**. Người ngồi máy khác không nhận được tín hiệu nào, và
   * chỉ hội tụ khi hết `staleTime`.
   *
   * Nên con số này chính là **thời gian tối đa hai máy còn bất đồng**. Một giờ
   * là quá lâu: người thứ hai sẽ kết luận đối tác chưa được khai, và khai lại —
   * tạo ra bản trùng. Năm phút là khoảng chấp nhận được cho cả hai phía.
   *
   * Ví dụ: `partners` · `production_sites` · `sewing_lines` · `contract_types`
   * · khách hàng · nhà cung cấp.
   */
  MASTER_DYNAMIC: 5 * 60_000,

  /**
   * **30 giây** · KHÔNG PHẢI DANH MỤC — LÀ CHỨNG TỪ.
   *
   * | | |
   * |---|---|
   * | Ai đổi | bất kỳ ai trong quy trình, kể cả đối tác bên ngoài |
   * | Qua đâu | máy trạng thái nghiệp vụ (`canTransition`) |
   * | Đường ghi lúc chạy | **CÓ, từ NHIỀU phía** |
   * | Nguồn sự thật | cơ sở dữ liệu |
   *
   * Khác biệt cốt lõi so với hai bậc trên: **nhiều bên cùng ghi**. Sau 031,
   * Monica giao việc còn đối tác nhận việc — cả hai đổi cùng một dòng. Không có
   * ai là "chủ" duy nhất, nên bất đồng phải ngắn.
   *
   * Ví dụ: `assignments` · `orders` · `shipments` · `qa_logs` · quyết toán.
   */
  TRANSACTION: 30_000,

  /**
   * **0** · MÁY SINH, KHÔNG AI QUẢN TRỊ.
   *
   * Sản lượng theo giờ, trạng thái chuyền, hàng chờ quét. Không có người "sở
   * hữu" một dòng — nó là dấu vết của việc đang diễn ra.
   *
   * ⚠️ `0` nghĩa là **luôn coi là cũ**, KHÔNG phải "không lưu đệm". Bộ nhớ đệm
   * vẫn giữ số cũ để màn hình không chớp trắng trong lúc lấy số mới — đó chính
   * là điều tách `isRefreshing` khỏi `isLoading`.
   */
  REALTIME: 0,

  /**
   * **60 giây** · DỮ LIỆU DẪN XUẤT — KHÔNG CÓ NGUỒN SỰ THẬT RIÊNG.
   *
   * Không ai ghi thẳng vào bảng điều khiển; nó **tính ra** từ bốn bậc trên. Vì
   * thế nó không có chế độ quản trị của riêng mình, và độ cũ của nó là độ cũ
   * của thứ chậm nhất nó đọc.
   *
   * 60 giây vì đây là truy vấn đắt nhất, và cũng là nơi chênh một phút KHÔNG
   * đổi quyết định nào: Giám đốc nhìn xu hướng, không nhìn từng cái áo.
   */
  DASHBOARD: 60_000,
} as const;

export type StaleTier = keyof typeof STALE_TIME;

/**
 * Thời gian giữ dữ liệu trong bộ nhớ sau khi không còn component nào dùng.
 *
 * ⚠️ Khác `staleTime`. `staleTime` = *"bao lâu thì coi là CŨ"*; `gcTime` =
 * *"bao lâu thì DỌN khỏi bộ nhớ"*. Đặt `gcTime` ngắn hơn `staleTime` là **tự
 * phá bộ nhớ đệm**: dữ liệu bị dọn trước cả khi kịp cũ, nên bậc dài nhất không
 * bao giờ có tác dụng.
 *
 * ⚠️ TÍNH TỪ BẢNG TRÊN, không gõ tay. Lần đầu tôi viết cứng 5 phút trong khi
 * bậc dài nhất là 30 phút — bài kiểm hợp đồng bắt được. Suy ra từ chính bảng
 * thì thêm một bậc dài hơn sau này cũng không thể lệch lại lần nữa.
 */
export const GC_TIME = Math.max(...Object.values(STALE_TIME)) + 5 * 60_000;
