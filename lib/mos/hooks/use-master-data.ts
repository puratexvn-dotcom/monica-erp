'use client';

import { useQuery } from '@tanstack/react-query';

import {
  listExecutionPartnersClient,
  listContractTypesClient,
  getScopeOptionsClient,
} from '@/app/(dashboard)/md/assignments/_actions/assignment.client';
import { masterDataKeys, partnerKeys, STALE_TIME } from '@/lib/mos/contracts/query-keys';
import type {
  ContractTypeDTO,
  PartnerOptionDTO,
  ScopeOptionsDTO,
} from '@/lib/mos/contracts/assignment.contract';
import {
  scopeAvailability,
  type ScopeAvailability,
} from '@/lib/mos/policies/scope-availability.policy';

import { unwrapItem, unwrapList } from './unwrap';

// ============================================================================
// HOOK — DANH MỤC DÙNG CHUNG
//
// ─── VÌ SAO BẬC `MASTER_DYNAMIC` CHỨ KHÔNG PHẢI `MASTER_STATIC` ──────────
// Cả hai danh mục ở đây đều do NGƯỜI VẬN HÀNH khai qua giao diện, nên chúng có
// thể vừa đổi ngay lúc này. `MASTER_STATIC` (60 phút) dành cho danh mục chỉ đổi
// khi chạy migration — `defect_catalog` chẳng hạn.
//
// Thao tác ghi CÓ làm mới bộ nhớ đệm, nhưng chỉ trong tab đã thực hiện. Người
// ngồi máy khác phải chờ hết hạn mới thấy — nên bậc này không được quá dài, nếu
// không họ sẽ khai lại và tạo bản trùng.
//
// ⚠️ Và chúng nằm dưới GỐC KHOÁ RIÊNG (`partner` · `master-data`), không phải
// dưới `assignment`. Gộp chung gốc thì mỗi lần một phần việc đổi trạng thái sẽ
// kéo lại cả bảng đối tác — một vòng mạng thừa cho dữ liệu gần như không đổi.
//
// ⚠️ Con số 30 phút KHÔNG nằm trong tệp này. Nó ở `query-keys/cache-policy.ts`,
// cùng ba bậc còn lại — Luật Kiến trúc sư: hook CHỌN bậc, hook không ĐẶT số.
// ============================================================================

export interface PartnerOptionsQuery {
  rows: PartnerOptionDTO[];
  isLoading: boolean;
  error: string | null;
}

export function useExecutionPartners(): PartnerOptionsQuery {
  const q = useQuery({
    queryKey: partnerKeys.executionPartners(),
    queryFn: async () => unwrapList(await listExecutionPartnersClient()),
    staleTime: STALE_TIME.MASTER_DYNAMIC,
  });

  return {
    rows: q.data?.rows ?? [],
    isLoading: q.isPending,
    error: q.error ? q.error.message : null,
  };
}

export interface ContractTypesQuery {
  rows: ContractTypeDTO[];
  isLoading: boolean;
  error: string | null;
  /**
   * Danh mục CHƯA được khai — khác hẳn "đang tải" và khác hẳn "lỗi".
   *
   * ⚠️ `contract_types` khởi tạo 0 dòng theo đúng thiết kế (ADR-002): không có
   * bằng chứng nào về loại hợp đồng đang dùng nên hệ thống không bịa ra
   * CMT/CM/FOB. Màn hình phải MỜI người dùng khai danh mục, chứ không hiện một
   * ô chọn trống rồi để họ tưởng hệ thống hỏng.
   */
  isEmpty: boolean;
}

export function useContractTypes(): ContractTypesQuery {
  const q = useQuery({
    queryKey: masterDataKeys.contractTypes(),
    queryFn: async () => unwrapList(await listContractTypesClient()),
    staleTime: STALE_TIME.MASTER_DYNAMIC,
  });

  const rows = q.data?.rows ?? [];

  return {
    rows,
    isLoading: q.isPending,
    error: q.error ? q.error.message : null,
    // Rỗng CHỈ khi đã tải xong và không có lỗi. Thiếu hai điều kiện đó thì lúc
    // đang tải màn hình sẽ chớp qua câu "chưa khai danh mục" — một câu sai.
    isEmpty: !q.isPending && !q.error && rows.length === 0,
  };
}

// ── DỮ LIỆU NỀN CHO Ô CHỌN PHẠM VI ──────────────────────────────────────────

export interface ScopeOptionsQuery {
  data: ScopeOptionsDTO | null;
  /** Bốn cấp phạm vi kèm lý do nếu chưa dùng được. Do `policies/` phán quyết. */
  levels: ScopeAvailability[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Đơn hàng · địa điểm · chuyền cho biểu mẫu lập phần việc.
 *
 * ⚠️ `levels` KHÔNG được tính ở đây. Hook chỉ **gọi** `scopeAvailability()` của
 * `policies/` — Yêu cầu 7 của Kiến trúc sư: hook chỉ Fetch · Cache · Invalidate
 * · Mutation. Viết `if (siteCount === 0)` trong hook là đặt luật nghiệp vụ ở
 * tầng không kiểm thử được bằng Node.
 */
export function useScopeOptions(): ScopeOptionsQuery {
  const q = useQuery({
    queryKey: masterDataKeys.scopeOptions(),
    queryFn: async () => unwrapItem(await getScopeOptionsClient()),
    staleTime: STALE_TIME.MASTER_DYNAMIC,
  });

  const data = q.data?.data ?? null;

  return {
    data,
    // Chưa có dữ liệu thì trả mảng rỗng — KHÔNG đoán bừa là "mọi cấp đều dùng
    // được", vì biểu mẫu sẽ mở khoá những cấp mà cơ sở dữ liệu sẽ từ chối.
    levels: data ? scopeAvailability(data.inventory) : [],
    isLoading: q.isPending,
    error: q.error ? q.error.message : null,
  };
}
