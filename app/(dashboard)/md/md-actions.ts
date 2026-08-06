'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/utils/supabase/server';
import { canAccess, isRole } from '@/lib/rbac';
import {
  customerFormSchema,
  materialRequestSchema,
  productionOrderSchema,
  shipmentFormSchema,
  type CustomerRow,
  type MaterialRequestRow,
  type ProductionOrderRow,
  type ShipmentRow,
  type QaReportRow,
} from './md-schema';

// ============================================================================
// SERVER ACTIONS — PHÂN HỆ MERCHANDISER
//
// Mọi hàm đều tự kiểm tra quyền: Server Action là endpoint HTTP có thể bị gọi
// trực tiếp, không nhất thiết đi qua đường điều hướng trang nên không thể dựa
// vào middleware.
// ============================================================================

export interface ActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

const MODULE_PATH = '/md';

async function guard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase: null, userId: null, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' } as const;
  }

  const role = user.app_metadata?.role;
  if (!isRole(role) || !canAccess(role, MODULE_PATH)) {
    return { supabase: null, userId: null, error: 'Bạn không có quyền thao tác trên phân hệ Merchandiser.' } as const;
  }

  return { supabase, userId: user.id, error: null } as const;
}

/** In đủ code/details/hint: PostgREST đặt nguyên nhân thật ở details và hint,
 *  message thường chỉ là một câu chung chung. */
function logDbError(where: string, e: unknown): void {
  const err = e as { message?: string; code?: string; details?: string; hint?: string } | null;
  console.error(`[md:${where}]`, {
    code: err?.code,
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
  });
}

/** Chuyển lỗi DB thành câu người dùng đọc hiểu */
function friendly(where: string, e: { message: string; code?: string }): string {
  logDbError(where, e);
  const m = e.message.toLowerCase();

  if (e.code === '23505' || m.includes('duplicate key') || m.includes('already exists')) {
    return 'Mã/số phiếu này đã tồn tại. Vui lòng dùng số khác.';
  }
  if (e.code === '42P01' || m.includes('does not exist') || m.includes('schema cache')) {
    return 'Chưa có bảng dữ liệu cho chức năng này. Hãy chạy migration 014_md_tables.sql rồi thử lại.';
  }
  if (m.includes('row-level security')) {
    return 'Bị chặn bởi RLS. Kiểm tra policy trong migration 014 đã tạo chưa.';
  }
  if (m.includes('production_orders_date_order')) {
    return 'Ngày tới hạn không được trước ngày bắt đầu.';
  }
  return e.message;
}

/** Gom lỗi Zod theo tên trường để form tô đỏ đúng ô */
function zodFieldErrors(issues: Array<{ path: PropertyKey[]; message: string }>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path[0];
    if (typeof k === 'string' && !out[k]) out[k] = i.message;
  }
  return out;
}

/** Supabase trả quan hệ lồng khi thì object khi thì mảng, tuỳ cách suy luận
 *  khoá ngoại — chuẩn hoá về một dạng thay vì phân nhánh ở tầng giao diện. */
function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v.length > 0 ? v[0] : null;
  return v ?? null;
}

// ════════ ĐỌC DỮ LIỆU ════════════════════════════════════════════════════════

export interface MdSnapshot {
  customers: CustomerRow[];
  materialRequests: MaterialRequestRow[];
  productionOrders: ProductionOrderRow[];
  shipments: ShipmentRow[];
  qaReports: QaReportRow[];
  /** Lỗi theo từng nhóm — KHÔNG gộp một biến, vì gộp thì bảng nào hỏng cũng
   *  hiện "chưa có dữ liệu", người dùng tưởng trống trong khi là lỗi kết nối. */
  errors: {
    customers: string | null;
    materialRequests: string | null;
    productionOrders: string | null;
    shipments: string | null;
    qaReports: string | null;
  };
}

export async function loadMdSnapshot(): Promise<MdSnapshot> {
  const empty: MdSnapshot = {
    customers: [],
    materialRequests: [],
    productionOrders: [],
    shipments: [],
    qaReports: [],
    errors: {
      customers: null, materialRequests: null, productionOrders: null,
      shipments: null, qaReports: null,
    },
  };

  const { supabase, error } = await guard();
  if (!supabase) {
    return {
      ...empty,
      errors: {
        customers: error,
        materialRequests: error,
        productionOrders: error,
        shipments: error,
        qaReports: error,
      },
    };
  }

  // allSettled: một bảng lỗi không được kéo cả trang xuống
  const [cRes, mRes, pRes, sRes, qRes] = await Promise.allSettled([
    supabase
      .from('customers')
      .select('id, customer_code, name, contact_person, phone, country, is_active')
      .order('customer_code', { ascending: true }),
    supabase
      .from('material_requests')
      .select(
        'id, request_no, material_name, category, quantity, unit, needed_date, status, evidence_path, orders ( po_number )',
      )
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('production_orders')
      .select('id, order_no, planned_qty, start_date, due_date, status, evidence_path, orders ( po_number )')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('shipments')
      .select('id, shipment_no, container_no, destination_port, etd_date, status, evidence_path, orders ( po_number )')
      .order('created_at', { ascending: false })
      .limit(500),
    // Biên bản kiểm hàng — MD chỉ ĐỌC. Nối chặng Kiểm hàng của dòng chảy, vốn
    // trước đây phải khai ⚪ "chưa đo được" vì ⛔ không có đường dữ liệu nào.
    supabase
      .from('qa_audit_reports')
      .select('id, inspected_qty, passed_qty, defect_qty, orders ( po_number )')
      .order('created_at', { ascending: false })
      .limit(1000),
  ]);

  const take = <TRaw, TOut>(
    r: PromiseSettledResult<{ data: TRaw[] | null; error: { message: string; code?: string } | null }>,
    label: string,
    map: (rows: TRaw[]) => TOut[],
  ): { rows: TOut[]; error: string | null } => {
    if (r.status === 'rejected') {
      logDbError(label, r.reason);
      const detail = r.reason instanceof Error ? r.reason.message : String(r.reason);
      return { rows: [], error: `Không đọc được ${label}: ${detail}` };
    }
    if (r.value.error) {
      return { rows: [], error: `Không đọc được ${label}: ${friendly(label, r.value.error)}` };
    }
    try {
      return { rows: map(r.value.data ?? []), error: null };
    } catch (e) {
      logDbError(`${label}:transform`, e);
      return { rows: [], error: `Dữ liệu ${label} trả về không đúng định dạng.` };
    }
  };

  interface WithPo {
    orders?: { po_number: string } | { po_number: string }[] | null;
  }
  const poOf = (r: WithPo) => one(r.orders)?.po_number ?? null;

  // Kiểu THÔ không có po_number: cột đó không nằm trong câu select, nó được
  // suy ra từ quan hệ lồng `orders ( po_number )` rồi mới gắn vào ở bước map.
  type RawMr = Omit<MaterialRequestRow, 'po_number'> & WithPo;
  type RawPo = Omit<ProductionOrderRow, 'po_number'> & WithPo;
  type RawSh = Omit<ShipmentRow, 'po_number'> & WithPo;
  type RawQa = Omit<QaReportRow, 'po_number'> & WithPo;

  const c = take<CustomerRow, CustomerRow>(cRes, 'danh sách khách hàng', (rows) => rows);
  const m = take<RawMr, MaterialRequestRow>(mRes, 'đề nghị mua NPL', (rows) =>
    rows.map((r) => ({ ...r, quantity: Number(r.quantity), po_number: poOf(r) })),
  );
  const p = take<RawPo, ProductionOrderRow>(pRes, 'lệnh sản xuất', (rows) =>
    rows.map((r) => ({ ...r, po_number: poOf(r) })),
  );
  const s = take<RawSh, ShipmentRow>(sRes, 'lệnh giao hàng', (rows) =>
    rows.map((r) => ({ ...r, po_number: poOf(r) })),
  );

  const q = take<RawQa, QaReportRow>(qRes, 'biên bản kiểm hàng', (rows) =>
    rows.map((r) => ({
      ...r,
      inspected_qty: Number(r.inspected_qty),
      passed_qty: Number(r.passed_qty),
      defect_qty: Number(r.defect_qty),
      po_number: poOf(r),
    })),
  );

  return {
    customers: c.rows,
    materialRequests: m.rows,
    productionOrders: p.rows,
    shipments: s.rows,
    qaReports: q.rows,
    errors: {
      customers: c.error,
      materialRequests: m.error,
      productionOrders: p.error,
      shipments: s.error,
      qaReports: q.error,
    },
  };
}

// ════════ GHI DỮ LIỆU ════════════════════════════════════════════════════════

export async function createCustomer(input: unknown): Promise<ActionResult> {
  const { supabase, userId, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  const parsed = customerFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { error: dbError } = await supabase.from('customers').insert({
    customer_code: v.customer_code,
    name: v.name,
    contact_person: v.contact_person || null,
    phone: v.phone || null,
    email: v.email || null,
    country: v.country || null,
    address: v.address || null,
    notes: v.notes || null,
    created_by: userId,
  });

  if (dbError) {
    const msg = friendly('createCustomer', dbError);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { customer_code: 'Mã này đã dùng' } : undefined,
    };
  }

  revalidatePath(MODULE_PATH);
  return { ok: true, message: `Đã tạo khách hàng ${v.customer_code} — ${v.name}.` };
}

export async function createMaterialRequest(input: unknown): Promise<ActionResult> {
  const { supabase, userId, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  const parsed = materialRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { error: dbError } = await supabase.from('material_requests').insert({
    request_no: v.request_no,
    order_id: v.order_id || null,
    material_name: v.material_name,
    category: v.category,
    quantity: v.quantity,
    unit: v.unit,
    needed_date: v.needed_date,
    notes: v.notes || null,
    evidence_path: v.evidence_path || null,
    status: 'SUBMITTED',
    created_by: userId,
  });

  if (dbError) {
    const msg = friendly('createMaterialRequest', dbError);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { request_no: 'Số phiếu này đã dùng' } : undefined,
    };
  }

  revalidatePath(MODULE_PATH);
  return { ok: true, message: `Đã tạo đề nghị mua ${v.request_no} (${v.quantity} ${v.unit}).` };
}

export async function createProductionOrder(input: unknown): Promise<ActionResult> {
  const { supabase, userId, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  const parsed = productionOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { error: dbError } = await supabase.from('production_orders').insert({
    order_no: v.order_no,
    order_id: v.order_id,
    planned_qty: v.planned_qty,
    start_date: v.start_date,
    due_date: v.due_date,
    notes: v.notes || null,
    evidence_path: v.evidence_path || null,
    status: 'PENDING',
    created_by: userId,
  });

  if (dbError) {
    const msg = friendly('createProductionOrder', dbError);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { order_no: 'Số lệnh này đã dùng' } : undefined,
    };
  }

  revalidatePath(MODULE_PATH);
  return { ok: true, message: `Đã tạo lệnh sản xuất ${v.order_no} (${v.planned_qty} pcs).` };
}

export async function createShipmentOrder(input: unknown): Promise<ActionResult> {
  const { supabase, error } = await guard();
  if (!supabase) return { ok: false, message: error ?? 'Không có quyền' };

  const parsed = shipmentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Dữ liệu chưa hợp lệ.', fieldErrors: zodFieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;

  const { error: dbError } = await supabase.from('shipments').insert({
    shipment_no: v.shipment_no,
    order_id: v.order_id,
    container_no: v.container_no || null,
    seal_no: v.seal_no || null,
    vessel_name: v.vessel_name || null,
    destination_port: v.destination_port || null,
    etd_date: v.etd_date,
    notes: v.notes || null,
    evidence_path: v.evidence_path || null,
    status: 'DRAFT',
  });

  if (dbError) {
    const msg = friendly('createShipmentOrder', dbError);
    return {
      ok: false,
      message: msg,
      fieldErrors: msg.includes('đã tồn tại') ? { shipment_no: 'Số lệnh này đã dùng' } : undefined,
    };
  }

  revalidatePath(MODULE_PATH);
  return { ok: true, message: `Đã tạo lệnh giao hàng ${v.shipment_no}.` };
}
