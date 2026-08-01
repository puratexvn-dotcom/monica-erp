import { SCOPE_LEVELS, type ScopeLevel } from '../domain/assignment';

// ============================================================================
// PHẠM VI NÀO DÙNG ĐƯỢC — POLICY
//
// ⚠️ Đây là phán quyết, không phải phép tính, nên nó ở `policies/` chứ không ở
// `calculators/`. Nó trả lời *"được phép chọn cấp này không"* dựa trên dữ liệu
// nền hiện có.
//
// ─── VÌ SAO CẦN NÓ ───────────────────────────────────────────────────────
// Ràng buộc `assignments_scope_shape` (029) đòi cấp `LINE` phải có CẢ `site_id`
// lẫn `line_id`. Đo được hôm nay: **0 địa điểm sản xuất**, và **cả 3 chuyền
// chưa gắn địa điểm** — nợ chuyển tiếp từ migration 028.
//
// Nghĩa là cấp `SITE`, `LINE`, `STYLE_OPERATION` **tạm thời không dùng được**.
// Đây KHÔNG phải lỗi: ràng buộc đang làm đúng việc của nó là từ chối dữ liệu
// thiếu (ADR-002 Mục 4).
//
// Nếu giao diện cứ hiện đủ bốn cấp thì người dùng chọn `LINE`, thấy ô chọn
// chuyền trống rỗng không hiểu vì sao, rồi bấm Lưu và nhận lỗi `23514` khó
// hiểu. Nói trước lý do tử tế hơn nhiều.
// ============================================================================

export interface ScopeInventory {
  siteCount: number;
  /** Chuyền ĐÃ gắn địa điểm — chuyền chưa gắn thì không dùng được cho cấp LINE. */
  linesWithSiteCount: number;
}

export interface ScopeAvailability {
  level: ScopeLevel;
  available: boolean;
  /** Khoá i18n giải thích vì sao chưa dùng được. Rỗng khi dùng được. */
  blockedBy: string;
}

/**
 * Bốn cấp, mỗi cấp kèm lý do nếu chưa dùng được.
 *
 * ⚠️ Trả **đủ bốn** chứ không lọc bớt. Giao diện cần hiện cả cấp chưa dùng được
 * ở trạng thái khoá kèm lời giải thích — ẩn hẳn thì người dùng không biết là hệ
 * thống có hỗ trợ, và sẽ đi hỏi.
 */
export function scopeAvailability(inv: ScopeInventory): ScopeAvailability[] {
  return SCOPE_LEVELS.map((level) => {
    // Cấp ORDER không cần dữ liệu nền nào — luôn dùng được.
    if (level === 'ORDER') return { level, available: true, blockedBy: '' };

    if (inv.siteCount === 0) {
      return { level, available: false, blockedBy: 'asg_scope_need_site' };
    }
    if (level !== 'SITE' && inv.linesWithSiteCount === 0) {
      return { level, available: false, blockedBy: 'asg_scope_need_line_site' };
    }
    return { level, available: true, blockedBy: '' };
  });
}

/** Cấp mặc định an toàn cho biểu mẫu mới: cấp rộng nhất và luôn dùng được. */
export const DEFAULT_SCOPE_LEVEL: ScopeLevel = 'ORDER';
