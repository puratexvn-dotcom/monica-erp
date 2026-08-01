// ============================================================================
// QUERY KEY FACTORY — DANH MỤC NỀN
//
// ⚠️ Luật Kiến trúc sư: **mỗi Business Domain sở hữu ĐÚNG MỘT Query Key
// Factory, và không hai factory nào được chung không gian tên.**
//
// Tệp này tách khỏi `partner.keys.ts` vì đúng luật đó: trước đây một tệp giữ
// hai gốc (`partner` và `master-data`), tức là hai miền trong một tệp. Ai đó
// muốn thêm khoá cho danh mục sẽ mở nhầm tệp Đối tác, và dần dần hai miền dính
// vào nhau.
//
// ─── RANH GIỚI: ĐÂY LÀ DANH MỤC "TRA CỨU", KHÔNG PHẢI THỰC THỂ ───────────
// Đối tác có vòng đời, có hồ sơ, có tài khoản đăng nhập → miền riêng
// (`partner.keys.ts`). Loại hợp đồng, địa điểm, công đoạn là thứ được **chọn
// trong ô select** → thuộc về đây.
//
// Phép thử: *"có màn hình chi tiết cho nó không?"* Có → miền riêng. Không →
// danh mục nền.
// ============================================================================

const ROOT = 'master-data' as const;

export const masterDataKeys = {
  all: [ROOT] as const,

  lists: () => [ROOT, 'list'] as const,
  details: () => [ROOT, 'detail'] as const,

  /**
   * ⚠️ Bảng `contract_types` khởi tạo **0 dòng** theo đúng thiết kế (ADR-002).
   * Danh sách rỗng ở đây là SỰ THẬT chứ không phải lỗi tải — giao diện phải
   * mời người dùng khai danh mục, không hiện một ô chọn trống câm lặng.
   *
   * Bậc `MASTER_DYNAMIC` chứ không phải `MASTER_STATIC`: nghiệp vụ tự khai qua
   * giao diện, nên nó có thể vừa đổi ngay lúc này.
   */
  contractTypes: () => [ROOT, 'list', 'contract-types'] as const,

  productionSites: () => [ROOT, 'list', 'production-sites'] as const,

  /**
   * Đơn hàng · địa điểm · chuyền — gói chung vì biểu mẫu lập phần việc cần cả
   * ba cùng lúc, và ba khoá riêng nghĩa là ba lượt gọi mạng cho một màn hình.
   */
  scopeOptions: () => [ROOT, 'list', 'scope-options'] as const,
  sewingLines: (siteId?: string) => [ROOT, 'list', 'sewing-lines', siteId ?? ''] as const,
  styleOperations: (styleId: string) => [ROOT, 'list', 'style-operations', styleId] as const,

  /**
   * Danh mục mã lỗi (023, 20 mã đã seed).
   *
   * ⚠️ Đây là ứng viên `MASTER_STATIC` đầu tiên: nó chỉ đổi khi chạy migration,
   * người vận hành không sửa được qua giao diện. Chưa có hook nào dùng — Trung
   * tâm Chất lượng vẫn chạy hook tự viết.
   */
  defectCatalog: () => [ROOT, 'list', 'defect-catalog'] as const,
} as const;

/**
 * Làm mới sau khi sửa danh mục nền.
 *
 * ⚠️ Bậc `MASTER_DYNAMIC` giữ dữ liệu 5 phút. Không invalidate thì người vừa
 * khai một loại hợp đồng mới sẽ không thấy nó trong ô chọn, và sẽ khai lại lần
 * nữa — tạo ra đúng bản trùng.
 */
export function masterDataInvalidationKeys(): readonly unknown[][] {
  // Một khoá duy nhất ở mức `lists()` quét sạch mọi danh mục con — đó chính là
  // lý do mọi khoá ở trên đều mọc qua `'list'`.
  return [[...masterDataKeys.lists()]];
}
