'use server';

import { createClient } from '@/utils/supabase/server';

// ============================================================================
// TRUNG TÂM CẢNH BÁO LIÊN BỘ PHẬN — DÙNG CHUNG CHO MỌI PHÂN HỆ
//
// ─── VÌ SAO KHÔNG TÁI DÙNG command-center.service.ts ────────────────────────
// Service kia nằm trong /md và chốt quyền bằng guard() của Merchandiser: gọi
// từ trang Kho hay QA sẽ bị từ chối. Chuông nằm trên thanh đầu trang của CẢ
// mười hai phân hệ nên phải có nguồn riêng, chỉ đòi hỏi "đã đăng nhập" rồi để
// RLS của từng bảng quyết định người này đọc được gì.
//
// ─── VÌ SAO KHÔNG BỊA SỐ ───────────────────────────────────────────────────
// Chuông báo 5 mà bấm vào chẳng có gì, hoặc ngược lại, là cách nhanh nhất
// khiến người dùng bỏ luôn thói quen nhìn chuông. Mọi con số dưới đây đọc
// thẳng từ dữ liệu; đọc không được thì nói là không đọc được.
// ============================================================================

export interface Notification {
  id: string;
  kind: 'SCHEDULE' | 'MATERIAL' | 'CHANGE' | 'RISK';
  title: string;
  detail: string;
  metric: string;
}

export interface NotificationFeed {
  items: Notification[];
  /** Số mục mức đỏ — hiện thành con số trên chuông */
  count: number;
  error: string | null;
}

function vnToday(): string {
  return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
}
const daysPast = (d: string, today: string) => Math.round((Date.parse(today) - Date.parse(d)) / 86_400_000);

const MR_PENDING = new Set(['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED']);

export async function getNotifications(): Promise<NotificationFeed> {
  const today = vnToday();

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return { items: [], count: 0, error: 'Không kết nối được máy chủ dữ liệu.' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], count: 0, error: 'Phiên đăng nhập đã hết hạn.' };

  const [msRes, mrRes, crRes, rkRes, odRes] = await Promise.allSettled([
    supabase
      .from('order_milestones')
      .select('id, order_id, milestone, planned_date, actual_date, status, is_critical')
      .limit(3000),
    supabase
      .from('material_requests')
      .select('id, order_id, request_no, material_name, needed_date, status')
      .limit(2000),
    supabase.from('change_requests').select('id, request_no, order_id, status').eq('status', 'PENDING').limit(300),
    supabase.from('v_order_risk').select('order_id, total_score, risk_level').limit(1000),
    supabase.from('orders').select('id, po_number').limit(2000),
  ]);

  /** Lấy dữ liệu hoặc bỏ qua NHÓM đó — một bảng bị RLS chặn không được làm
   *  câm cả cái chuông. */
  function rows<T>(r: PromiseSettledResult<{ data: unknown; error: unknown }>): T[] {
    if (r.status !== 'fulfilled' || r.value.error) return [];
    return (r.value.data ?? []) as T[];
  }

  const orders = rows<{ id: string; po_number: string }>(odRes);
  const poOf = new Map(orders.map((o) => [o.id, o.po_number]));

  const items: Notification[] = [];

  for (const m of rows<{
    id: string; order_id: string; milestone: string; planned_date: string | null;
    actual_date: string | null; status: string; is_critical: boolean;
  }>(msRes)) {
    if (m.status === 'SKIPPED' || m.actual_date || !m.planned_date) continue;
    const late = daysPast(m.planned_date, today);
    // Cùng ngưỡng với Command Center: đường găng ≥3 ngày, mốc thường ≥7
    if (!(m.is_critical ? late >= 3 : late >= 7)) continue;
    items.push({
      id: `ms-${m.id}`,
      kind: 'SCHEDULE',
      title: `Trễ mốc "${m.milestone}"`,
      detail: poOf.get(m.order_id) ?? 'Không rõ đơn hàng',
      metric: `trễ ${late} ngày`,
    });
  }

  for (const r of rows<{
    id: string; order_id: string; request_no: string; material_name: string;
    needed_date: string | null; status: string;
  }>(mrRes)) {
    if (!MR_PENDING.has(String(r.status).toUpperCase()) || !r.needed_date) continue;
    const late = daysPast(r.needed_date, today);
    if (late < 3) continue;
    items.push({
      id: `mr-${r.id}`,
      kind: 'MATERIAL',
      title: `NPL chưa về: ${r.material_name}`,
      detail: `${poOf.get(r.order_id) ?? '—'} · phiếu ${r.request_no}`,
      metric: `trễ ${late} ngày`,
    });
  }

  for (const c of rows<{ id: string; request_no: string; order_id: string }>(crRes)) {
    items.push({
      id: `cr-${c.id}`,
      kind: 'CHANGE',
      title: `Yêu cầu thay đổi ${c.request_no}`,
      detail: `${poOf.get(c.order_id) ?? '—'} · đang chờ duyệt`,
      metric: 'chờ duyệt',
    });
  }

  for (const r of rows<{ order_id: string; total_score: number; risk_level: string }>(rkRes)) {
    if (r.risk_level !== 'CRITICAL') continue;
    items.push({
      id: `rk-${r.order_id}`,
      kind: 'RISK',
      title: 'Đơn hàng ở mức nguy kịch',
      detail: poOf.get(r.order_id) ?? 'Không rõ đơn hàng',
      metric: `${Number(r.total_score).toFixed(0)} điểm`,
    });
  }

  // Mọi nhóm đều hỏng thì nói thẳng, đừng để chuông im lặng như thể không có
  // vấn đề gì trong khi thật ra là không đọc được gì cả.
  const allFailed = [msRes, mrRes, crRes, rkRes].every(
    (r) => r.status !== 'fulfilled' || Boolean(r.value.error),
  );

  return {
    items: items.slice(0, 50),
    count: items.length,
    error: allFailed ? 'Không đọc được dữ liệu cảnh báo.' : null,
  };
}
