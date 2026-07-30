import 'server-only';

import { guard, safeQuery, one } from './guard';
import type {
  DocumentRow, CommentRow, ChangeRequestRow, ActivityRow,
} from '@/schemas/md';

// ============================================================================
// TÀI LIỆU · THẢO LUẬN · YÊU CẦU THAY ĐỔI · NHẬT KÝ · RỦI RO
//
// Năm màn hình này đều là góc nhìn TOÀN PHÂN HỆ, khác với các tab bên trong
// PO 360° chỉ nhìn một đơn. Merchandiser cần cả hai: nhìn sâu một đơn khi đang
// xử lý đơn đó, và nhìn ngang toàn bộ khi bắt đầu ngày làm việc.
// ============================================================================

type NameRel = { full_name: string } | { full_name: string }[] | null;

// ─── 1. TRUNG TÂM TÀI LIỆU ──────────────────────────────────────────────────

interface RawDoc {
  id: string;
  entity_type: string;
  entity_id: string;
  doc_type: string;
  title: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  version: number;
  created_at: string;
  profiles: NameRel;
}

export interface DocumentCenterRow extends DocumentRow {
  entity_type: string;
  entity_id: string;
}

export async function listDocuments(): Promise<{ rows: DocumentCenterRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const res = await safeQuery<RawDoc>('tài liệu', () =>
    g.supabase
      .from('md_documents')
      .select(
        'id, entity_type, entity_id, doc_type, title, storage_path, file_size,' +
          ' mime_type, version, created_at, profiles:uploaded_by ( full_name )',
      )
      .order('created_at', { ascending: false })
      .limit(500),
  );
  if (res.error) return { rows: [], error: res.error };

  return {
    rows: res.rows.map((d) => ({
      id: d.id,
      entity_type: d.entity_type,
      entity_id: d.entity_id,
      doc_type: d.doc_type,
      title: d.title,
      storage_path: d.storage_path,
      file_size: d.file_size === null ? null : Number(d.file_size),
      mime_type: d.mime_type,
      version: d.version,
      uploaded_by_name: one(d.profiles)?.full_name ?? null,
      created_at: d.created_at,
    })),
    error: null,
  };
}

// ─── 2. TRUNG TÂM THẢO LUẬN ─────────────────────────────────────────────────

interface RawComment {
  id: string;
  entity_type: string;
  entity_id: string;
  parent_id: string | null;
  body: string;
  mentions: string[] | null;
  is_task: boolean;
  task_status: string | null;
  assigned_role: string | null;
  due_date: string | null;
  created_at: string;
  profiles: NameRel;
}

export interface CommentCenterRow extends CommentRow {
  entity_type: string;
  entity_id: string;
}

export async function listComments(): Promise<{ rows: CommentCenterRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const res = await safeQuery<RawComment>('thảo luận', () =>
    g.supabase
      .from('md_comments')
      .select(
        'id, entity_type, entity_id, parent_id, body, mentions, is_task, task_status,' +
          ' assigned_role, due_date, created_at, profiles:author_id ( full_name )',
      )
      .order('created_at', { ascending: false })
      .limit(300),
  );
  if (res.error) return { rows: [], error: res.error };

  return {
    rows: res.rows.map((c) => ({
      id: c.id,
      entity_type: c.entity_type,
      entity_id: c.entity_id,
      parent_id: c.parent_id,
      body: c.body,
      mentions: c.mentions ?? [],
      is_task: c.is_task,
      task_status: c.task_status,
      assigned_role: c.assigned_role,
      due_date: c.due_date,
      author_name: one(c.profiles)?.full_name ?? null,
      author_role: null, // profiles không giữ vai trò; vai trò nằm ở user_roles
      created_at: c.created_at,
    })),
    error: null,
  };
}

// ─── 3. YÊU CẦU THAY ĐỔI ────────────────────────────────────────────────────

interface RawChange {
  id: string;
  request_no: string;
  order_id: string;
  change_type: string;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  impact_note: string | null;
  status: string;
  created_at: string;
  orders: { po_number: string } | { po_number: string }[] | null;
  requester: NameRel;
  approver: NameRel;
}

export interface ChangeCenterRow extends ChangeRequestRow {
  order_id: string;
}

export async function listChangeRequests(): Promise<{ rows: ChangeCenterRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const res = await safeQuery<RawChange>('yêu cầu thay đổi', () =>
    g.supabase
      .from('change_requests')
      .select(
        'id, request_no, order_id, change_type, old_value, new_value, reason,' +
          ' impact_note, status, created_at, orders ( po_number ),' +
          ' requester:requested_by ( full_name ), approver:approved_by ( full_name )',
      )
      .order('created_at', { ascending: false })
      .limit(300),
  );
  if (res.error) return { rows: [], error: res.error };

  return {
    rows: res.rows.map((c) => ({
      id: c.id,
      request_no: c.request_no,
      order_id: c.order_id,
      po_number: one(c.orders)?.po_number ?? null,
      change_type: c.change_type,
      old_value: c.old_value,
      new_value: c.new_value,
      reason: c.reason,
      impact_note: c.impact_note,
      status: c.status,
      requested_by_name: one(c.requester)?.full_name ?? null,
      approved_by_name: one(c.approver)?.full_name ?? null,
      created_at: c.created_at,
    })),
    error: null,
  };
}

// ─── 4. NHẬT KÝ THAO TÁC ────────────────────────────────────────────────────

interface RawActivity {
  id: number;
  entity_type: string;
  entity_id: string | null;
  action: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  actor_role: string | null;
  created_at: string;
  profiles: NameRel;
}

export async function listActivity(): Promise<{ rows: ActivityRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const res = await safeQuery<RawActivity>('nhật ký thao tác', () =>
    g.supabase
      .from('activity_log')
      .select(
        'id, entity_type, entity_id, action, changes, actor_role, created_at,' +
          ' profiles:actor_id ( full_name )',
      )
      .order('id', { ascending: false })
      .limit(300),
  );
  if (res.error) return { rows: [], error: res.error };

  return {
    rows: res.rows.map((a) => ({
      id: a.id,
      entity_type: a.entity_type,
      entity_id: a.entity_id,
      action: a.action,
      changes: a.changes ?? {},
      actor_name: one(a.profiles)?.full_name ?? null,
      actor_role: a.actor_role,
      created_at: a.created_at,
    })),
    error: null,
  };
}

// ─── 5. TRUNG TÂM RỦI RO ────────────────────────────────────────────────────

export interface RiskCenterRow {
  order_id: string;
  po_number: string;
  customer_name: string;
  delivery_date: string;
  status: string;
  material_score: number;
  schedule_score: number;
  quality_score: number;
  capacity_score: number;
  total_score: number;
  risk_level: string;
  computed_at: string | null;
}

interface RawRisk {
  order_id: string;
  material_score: number;
  schedule_score: number;
  quality_score: number;
  capacity_score: number;
  total_score: number;
  risk_level: string;
  computed_at: string | null;
  orders: { po_number: string; customer_name: string; delivery_date: string; status: string }
    | { po_number: string; customer_name: string; delivery_date: string; status: string }[]
    | null;
}

/** Bảng rủi ro toàn phân hệ, sắp theo điểm giảm dần: đơn nguy hiểm nhất nằm
 *  trên cùng, không phải cuộn đi tìm. */
export async function listRisks(): Promise<{ rows: RiskCenterRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const res = await safeQuery<RawRisk>('điểm rủi ro', () =>
    g.supabase
      .from('v_order_risk')
      .select(
        'order_id, material_score, schedule_score, quality_score, capacity_score,' +
          ' total_score, risk_level, computed_at,' +
          ' orders ( po_number, customer_name, delivery_date, status )',
      )
      .order('total_score', { ascending: false })
      .limit(300),
  );
  if (res.error) return { rows: [], error: res.error };

  return {
    rows: res.rows.map((r) => {
      const o = one(r.orders);
      return {
        order_id: r.order_id,
        po_number: o?.po_number ?? '—',
        customer_name: o?.customer_name ?? '—',
        delivery_date: o?.delivery_date ?? '',
        status: o?.status ?? '',
        material_score: Number(r.material_score),
        schedule_score: Number(r.schedule_score),
        quality_score: Number(r.quality_score),
        capacity_score: Number(r.capacity_score),
        total_score: Number(r.total_score),
        risk_level: r.risk_level,
        computed_at: r.computed_at,
      };
    }),
    error: null,
  };
}
