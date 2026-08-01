import 'server-only';

import { guard, safeQuery } from '../../_services/guard';
import type {
  ContractTypeDTO,
  ListResult,
  PartnerOptionDTO,
} from '@/lib/mos/contracts/assignment.contract';
import type { TranslatedText } from '@/lib/mos/value-objects/translated-text';

// ============================================================================
// ĐỐI TÁC KHẢ DỤNG ĐỂ GIAO VIỆC
//
// Tách khỏi `assignment.service.ts` vì nó phục vụ một câu hỏi khác: *"giao cho
// ai được"*. Ô chọn đối tác nạp một lần khi mở biểu mẫu, còn danh sách phần
// việc nạp lại mỗi lần đổi bộ lọc — gộp vào một service sẽ kéo cả bảng đối tác
// theo mỗi lần lọc.
// ============================================================================

/**
 * ⚠️ Loại `BUYER` bị loại ở đây, và bị chặn LẦN NỮA bởi trigger
 * `assignments_partner_type_trg` (029 Mục 7b).
 *
 * Hai lớp không thừa: lớp này để danh sách chọn **không hiện** thứ không chọn
 * được; lớp trigger để một lời gọi PostgREST thẳng cũng không lách được. Khách
 * hàng là chủ đơn hàng, không phải đối tác thực thi — cho họ một Assignment là
 * cấp cho họ quyền GHI sản lượng, thứ Điều XXX cấm tuyệt đối.
 */
export const EXECUTION_PARTNER_TYPES = ['SUBCON', 'SERVICE', 'SUPPLIER', 'FORWARDER'] as const;

interface RawPartner {
  id: string;
  partner_code: string | null;
  name: string | null;
  partner_type: string | null;
  country: string | null;
}

/**
 * Đối tác đang hoạt động, chưa xoá mềm, và không phải khách hàng.
 *
 * ⚠️ Lọc `is_active` **và** `deleted_at` — hai thứ khác nhau. `is_active=false`
 * là "tạm ngừng hợp tác, hồ sơ vẫn còn"; `deleted_at` là "đã gỡ khỏi hệ thống".
 * Bỏ sót một trong hai thì một đối tác đã ngừng hợp tác vẫn nhận được việc mới.
 */
export async function listExecutionPartners(): Promise<ListResult<PartnerOptionDTO>> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const sb = g.supabase;

  const { rows, error } = await safeQuery<RawPartner>('danh sách đối tác', () =>
    sb
      .from('partners')
      .select('id, partner_code, name, partner_type, country')
      .is('deleted_at', null)
      .eq('is_active', true)
      .in('partner_type', [...EXECUTION_PARTNER_TYPES])
      .order('partner_code', { ascending: true }),
  );

  if (error) return { rows: [], error };

  return {
    rows: rows.map((r) => ({
      id: r.id,
      partnerCode: r.partner_code,
      name: r.name,
      partnerType: r.partner_type,
      country: r.country,
    })),
    error: null,
  };
}

// ── LOẠI HỢP ĐỒNG ───────────────────────────────────────────────────────────

/**
 * Danh mục loại hợp đồng — MASTER DATA, không phải enum.
 *
 * ⚠️ Bảng này **khởi tạo 0 dòng** và đó là thiết kế, không phải lỗi (ADR-002).
 * Đo được lúc thiết kế: `subcon_orders` 0 dòng, `subcons` không có cột loại hợp
 * đồng, `subcontractors.service_type` chỉ có GIAT/IN_THEU — đó là loại DỊCH VỤ
 * chứ không phải loại HỢP ĐỒNG. Không có bằng chứng nào, nên hệ thống không
 * bịa ra CMT/CM/FOB.
 *
 * Giao diện phải xử lý danh sách rỗng một cách tử tế: mời người dùng khai danh
 * mục, chứ **không** hiện một ô chọn trống không giải thích gì.
 */
export async function listContractTypes(): Promise<ListResult<ContractTypeDTO>> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const sb = g.supabase;

  // ⚠️ 035b: đọc `name_translations` (JSONB). Cột `name_vi`/`name_en` vẫn còn
  // trong CSDL cho tới 035c — bước này hoàn tác được mà không đụng migration.
  const { rows, error } = await safeQuery<{
    code: string;
    name_translations: TranslatedText | null;
  }>('danh mục loại hợp đồng', () =>
    sb
      .from('contract_types')
      .select('code, name_translations')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  );

  if (error) return { rows: [], error };

  return {
    // ⚠️ KHÔNG chọn ngôn ngữ ở đây. Trả cả bản đồ để tầng vẽ tự chọn theo phiên
    // — Hiến pháp Điều IX. `?? {}` phòng dòng cũ chưa backfill; ràng buộc của
    // 035a đã chặn ca đó, nhưng đọc phòng thủ không tốn gì.
    rows: rows.map((r) => ({ code: r.code, name: r.name_translations ?? {} })),
    error: null,
  };
}
