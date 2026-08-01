import 'server-only';

import { guard, safeQuery } from '../../_services/guard';
import type {
  ItemResult,
  ScopeOptionsDTO,
} from '@/lib/mos/contracts/assignment.contract';

// ============================================================================
// DỮ LIỆU NỀN CHO Ô CHỌN PHẠM VI
//
// Tách khỏi `assignment.service.ts` vì nó trả lời câu hỏi khác: *"gắn phần việc
// này vào đâu được"*. Biểu mẫu nạp một lần khi mở; danh sách phần việc nạp lại
// mỗi lần đổi bộ lọc.
//
// ⚠️ TẦNG NÀY KHÔNG PHÁN QUYẾT. Nó đếm và trả số thô; câu hỏi *"cấp nào dùng
// được"* thuộc `policies/scope-availability.policy.ts`. Đặt logic đó ở đây thì
// nó không kiểm thử được bằng Node, và sẽ có bản thứ hai ở giao diện.
//
// ─── ĐIỀU XII · RANH GIỚI ────────────────────────────────────────────────
// Chỉ ĐỌC `orders`, `production_sites`, `sewing_lines`. Không ghi vào bảng nào
// của phân hệ khác.
// ============================================================================

interface RawOrder {
  id: string;
  po_number: string | null;
  style_code: string | null;
  customer_name: string | null;
  delivery_date: string | null;
}

/**
 * Đơn hàng có thể giao việc.
 *
 * ⚠️ KHÔNG lọc theo trạng thái đơn. Đo được: 3 đơn thật đang ở `IN_PRODUCTION`
 * và `APPROVED` — nhưng danh sách trạng thái đơn hàng không thuộc miền này, và
 * đoán xem trạng thái nào "được giao việc" là đặt một luật nghiệp vụ chưa ai
 * quyết. Khi nghiệp vụ chốt, luật đó vào `policies/`, không vào đây.
 */
export async function getScopeOptions(): Promise<ItemResult<ScopeOptionsDTO>> {
  const g = await guard();
  if (!g.supabase) return { data: null, error: g.error };
  const sb = g.supabase;

  // Ba truy vấn SONG SONG — thời gian chờ là lượt chậm nhất, không phải tổng ba.
  const [orders, sites, lines] = await Promise.all([
    safeQuery<RawOrder>('danh sách đơn hàng', () =>
      sb
        .from('orders')
        .select('id, po_number, style_code, customer_name, delivery_date')
        .order('delivery_date', { ascending: true, nullsFirst: false }),
    ),
    safeQuery<{ id: string; site_code: string | null; name: string | null }>(
      'danh sách địa điểm sản xuất',
      () =>
        sb
          .from('production_sites')
          .select('id, site_code, name')
          .is('deleted_at', null)
          .eq('is_active', true)
          .order('site_code', { ascending: true }),
    ),
    safeQuery<{ id: string; line_code: string | null; line_name: string | null; site_id: string | null }>(
      'danh sách chuyền',
      () => sb.from('sewing_lines').select('id, line_code, line_name, site_id'),
    ),
  ]);

  const firstError = orders.error ?? sites.error ?? lines.error;
  if (firstError) return { data: null, error: firstError };

  return {
    data: {
      orders: orders.rows.map((o) => ({
        id: o.id,
        poNumber: o.po_number,
        styleCode: o.style_code,
        customerName: o.customer_name,
        deliveryDate: o.delivery_date,
      })),
      sites: sites.rows.map((s) => ({
        id: s.id,
        siteCode: s.site_code,
        name: s.name,
      })),
      lines: lines.rows
        // ⚠️ Chỉ chuyền ĐÃ gắn địa điểm. Chuyền chưa gắn không dùng được cho cấp
        // `LINE` vì `assignments_scope_shape` đòi cả `site_id` — hiện nó ra rồi
        // để người dùng chọn và nhận `23514` là một cái bẫy.
        .filter((l) => l.site_id !== null)
        .map((l) => ({
          id: l.id,
          lineCode: l.line_code,
          lineName: l.line_name,
          siteId: l.site_id as string,
        })),
      // Số thô để `policies/` phán quyết. Đếm TRƯỚC khi lọc ở trên thì sai —
      // `linesWithSite` phải là số chuyền THẬT SỰ dùng được.
      inventory: {
        siteCount: sites.rows.length,
        linesWithSiteCount: lines.rows.filter((l) => l.site_id !== null).length,
      },
    },
    error: null,
  };
}
