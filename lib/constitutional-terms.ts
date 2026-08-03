// ============================================================================
// TỪ VỰNG HIẾN ĐỊNH — TUYỆT ĐỐI KHÔNG DỊCH
//
// Thi hành **Hiến pháp Điều 45.3 · Constitutional Terms**.
//
// ═══ VÌ SAO CÓ TỆP NÀY ══════════════════════════════════════════════════
// Những tên dưới đây là **BẢN SẮC SẢN PHẨM**, không phải nhãn giao diện. Chúng
// giữ nguyên chữ trong cả ba ngôn ngữ.
//
// Dịch "Merchandising" thành "Quản lý đơn hàng" ở bản tiếng Việt và
// "跟单" ở bản tiếng Trung sẽ tạo ra BA sản phẩm khác nhau trong đầu người
// dùng — và ba bộ từ vựng khác nhau giữa các chi nhánh của cùng một công ty.
// Khi người Việt gọi điện cho đồng nghiệp Trung Quốc, cả hai phải đang nói về
// cùng một thứ.
//
// ⚠️ Danh sách này là DỮ LIỆU CƯỠNG CHẾ, không phải tài liệu tham khảo. Bài
// kiểm kiến trúc mục ⑪ đối chiếu ba tệp `messages/*.json` với danh sách này:
// một từ hiến định bị dịch khác đi ở bất kỳ ngôn ngữ nào ⇒ HỎNG.
// ============================================================================

/**
 * Tên phải giữ nguyên chữ trong mọi ngôn ngữ.
 *
 * Nguồn: Chỉ thị Architecture Board 03/08/2026 · Hiến pháp §45.3.
 */
export const CONSTITUTIONAL_TERMS: readonly string[] = [
  // ─── Bản sắc nền tảng ─────────────────────────────────────────────────
  'MONICA ONE',
  'Business Operating System',
  'Business Apps',
  'Business Workspace',
  'Global Services',
  'Platform Services',

  // ─── Mười một Business Workspace · §16.2 ──────────────────────────────
  'Executive Center',
  'Commercial',
  'Merchandising',
  'Planning',
  'Production',
  'Quality',
  'Warehouse',
  'Shipment',
  'Subcontract',
  'Finance',
  'Human Resources',

  // ─── Global Service · §29 · §30 · §31 · §33 ───────────────────────────
  'Business Reporting',
  'Business Communication',
  'AI Assistant',
  'Documents',
  'User Guidance',

  // ─── Từ vựng kiến trúc ────────────────────────────────────────────────
  'Enterprise Architecture',
  'Architecture Decision Record (ADR)',
  'Evidence',
  'Single Source of Truth',
  'Assignment',
  'Authorization',
  'Resource Scope',
] as const;

/** `true` nếu chuỗi là một từ hiến định — so khớp CHÍNH XÁC, phân biệt hoa thường. */
export function isConstitutionalTerm(value: string): boolean {
  return CONSTITUTIONAL_TERMS.includes(value.trim());
}
