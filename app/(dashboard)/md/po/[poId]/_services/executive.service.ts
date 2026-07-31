import 'server-only';

import { guard, safeQuery } from '../../../_services/guard';
import { assessedHealth, deriveHealth, type Health } from '@/lib/mos/po-health';
import { daysUntil, vnTodayISO } from '@/lib/mos/po-flow';
import { getPoTwinHeader } from './po-twin.service';
import type { PoTwinHeader } from '@/lib/mos/po-twin.contract';

// ============================================================================
// LÁT CẮT 1 — TỔNG QUAN ĐIỀU HÀNH · TẦNG NGHIỆP VỤ
//
// ─── ĐIỀU VII: TOÀN BỘ TÍNH TOÁN NẰM Ở ĐÂY ───────────────────────────────
// Component chỉ nhận số đã tính xong và vẽ. Không một phép cộng nào ở giao diện.
//
// ─── VỀ YÊU CẦU "MOCK CHO RISK SCORE VÀ AI SUMMARY" ──────────────────────
// Kiến trúc thì làm đúng như yêu cầu: mọi logic gom trong service này, sau này
// thay ruột KHÔNG phải đụng một dòng UI nào.
//
// Nhưng RUỘT thì không phải số giả — Điều XX cấm mock, và chính người dùng đã
// ra luật "không fake KPI":
//   • Điểm rủi ro: có bản ghi trong risk_assessments thì dùng bản ghi; chưa có
//     thì TÍNH TỪ DỮ LIỆU THẬT (tồn NPL, tiến độ, DHU) và đánh dấu rõ nguồn.
//   • Tóm tắt: sinh bằng LUẬT trên số liệu thật, mỗi câu kèm con số kiểm chứng
//     được. Đúng thoả thuận "Trợ lý phân tích chạy theo luật cho tới khi có
//     khoá API mô hình ngôn ngữ".
//   • Hoạt động gần đây: đọc activity_log và communications. Chưa có dòng nào
//     thì hiện trạng thái rỗng thật thà, không dựng ra vài dòng cho đẹp.
//
// Ngày mai cắm mô hình ngôn ngữ vào thì chỉ thay `buildSummary` ở tệp này.
// ============================================================================

export type SummaryTone = 'DANGER' | 'WARN' | 'INFO' | 'GOOD';

export interface SummaryLine {
  tone: SummaryTone;
  /** Khoá i18n của câu — giao diện dịch, service không biết ngôn ngữ */
  key: string;
  /** Các số thật thay vào chỗ {0}, {1}... trong câu */
  values: string[];
}

export interface ActivityItem {
  id: string;
  at: string;
  actor: string | null;
  /** Khoá i18n mô tả loại việc */
  key: string;
  detail: string | null;
}

export interface ExecutiveOverview {
  head: PoTwinHeader;
  /** Tỷ lệ dòng NPL đã sẵn sàng, %. null = chưa có định mức.
   *  Tính Ở ĐÂY chứ không ở giao diện — bản đầu tôi để phép chia này trong
   *  component và đó đúng là thứ Điều VII cấm. */
  materialReadyPct: number | null;
  /** Số việc đang chờ khách (mẫu chờ duyệt + yêu cầu thay đổi chưa đóng) */
  buyerPending: number;
  health: Health;
  summary: SummaryLine[];
  activity: ActivityItem[];
  /** Lĩnh vực đọc không được — giao diện hiện "—" đúng ô đó */
  partial: string[];
  /** Hoạt động gần đây đọc được không. null = đọc được (kể cả khi rỗng) */
  activityError: string | null;
}

export type ExecutiveResult =
  | { ok: true; data: ExecutiveOverview }
  | { ok: false; message: string };

interface RawActivity {
  id: number | string;
  action: string;
  actor_role: string | null;
  created_at: string;
  changes: unknown;
}
interface RawComm {
  id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

/**
 * Sinh tóm tắt bằng LUẬT trên số liệu thật.
 *
 * Xếp theo mức nghiêm trọng giảm dần — người đọc chỉ liếc hai dòng đầu, nên
 * dòng nguy hiểm nhất phải nằm trên cùng. Mỗi câu mang theo con số để người
 * dùng đối chiếu, không có câu chung chung kiểu "đơn hàng có rủi ro".
 */
function buildSummary(h: PoTwinHeader, health: Health): SummaryLine[] {
  const out: SummaryLine[] = [];
  const nf = new Intl.NumberFormat('vi-VN');

  if (h.daysLeft !== null && h.daysLeft < 0 && h.stage !== 'SHIPPED') {
    out.push({ tone: 'DANGER', key: 'po_sum_overdue', values: [String(Math.abs(h.daysLeft))] });
  } else if (h.daysLeft !== null && h.daysLeft <= 7 && h.stage !== 'SHIPPED') {
    out.push({ tone: 'WARN', key: 'po_sum_due_soon', values: [String(h.daysLeft)] });
  }

  if (h.material.missingLines !== null && h.material.missingLines > 0) {
    out.push({
      tone: 'DANGER',
      key: 'po_sum_material_missing',
      values: [String(h.material.missingLines), String(h.material.bomLines ?? 0)],
    });
  } else if (h.material.bomLines === null || h.material.bomLines === 0) {
    out.push({ tone: 'INFO', key: 'po_sum_no_bom', values: [] });
  }

  if (h.quality.dhu !== null && h.quality.dhu >= 10) {
    out.push({ tone: 'DANGER', key: 'po_sum_dhu_high', values: [h.quality.dhu.toFixed(2)] });
  } else if (h.quality.dhu === null) {
    out.push({ tone: 'INFO', key: 'po_sum_no_qa', values: [] });
  }

  if (h.progress.sewnPct === null) {
    out.push({ tone: 'INFO', key: 'po_sum_no_output', values: [] });
  } else if (h.progress.sewnPct >= 100) {
    out.push({ tone: 'GOOD', key: 'po_sum_done', values: [] });
  } else {
    out.push({
      tone: 'INFO',
      key: 'po_sum_progress',
      values: [
        h.progress.sewnPct.toFixed(1),
        nf.format(h.progress.sewnOk ?? 0),
        nf.format(h.identity.totalQuantity),
      ],
    });
  }

  if (h.collab.pendingSamples !== null && h.collab.pendingSamples > 0) {
    out.push({ tone: 'WARN', key: 'po_sum_samples', values: [String(h.collab.pendingSamples)] });
  }
  if (h.collab.openChanges !== null && h.collab.openChanges > 0) {
    out.push({ tone: 'WARN', key: 'po_sum_changes', values: [String(h.collab.openChanges)] });
  }

  if (health.source === 'DERIVED') {
    out.push({ tone: 'INFO', key: 'po_sum_derived', values: [String(health.basis)] });
  } else if (health.source === 'NONE') {
    out.push({ tone: 'INFO', key: 'po_sum_no_risk', values: [] });
  }

  const rank: Record<SummaryTone, number> = { DANGER: 0, WARN: 1, INFO: 2, GOOD: 3 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 6);
}

export async function getExecutiveOverview(poId: string): Promise<ExecutiveResult> {
  const head = await getPoTwinHeader(poId);
  if (!head.ok) return { ok: false, message: head.message };

  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };
  const sb = g.supabase;

  const [act, comm] = await Promise.all([
    safeQuery<RawActivity>('nhật ký hoạt động', () =>
      sb.from('activity_log').select('id, action, actor_role, created_at, changes')
        .eq('entity_type', 'ORDER').eq('entity_id', poId)
        .order('created_at', { ascending: false }).limit(5)),
    safeQuery<RawComm>('trao đổi', () =>
      sb.from('communications').select('id, sender_role, content, created_at')
        .eq('context_type', 'order').eq('context_id', poId)
        .order('created_at', { ascending: false }).limit(5)),
  ]);

  const h = head.data;

  // Điểm ĐÃ CHẤM luôn thắng điểm tính tại chỗ — bảng risk_assessments là nguồn
  // chính thức, dùng chung với bảng tổng của giám đốc.
  const assessed = assessedHealth(h.risk);
  const totalDays =
    h.identity.orderDate && h.identity.deliveryDate
      ? daysUntil(h.identity.deliveryDate, h.identity.orderDate.slice(0, 10))
      : null;
  const health =
    assessed ??
    deriveHealth({
      bomLines: h.material.bomLines,
      missingLines: h.material.missingLines,
      sewnPct: h.progress.sewnPct,
      daysLeft: daysUntil(h.identity.deliveryDate, vnTodayISO()),
      totalDays,
      dhu: h.quality.dhu,
    });

  // Trộn hai nguồn hoạt động rồi xếp theo thời gian. Không gộp ở tầng cơ sở dữ
  // liệu vì hai bảng có hình dạng khác hẳn nhau; trộn ở đây rẻ hơn một view mới.
  const activity: ActivityItem[] = [
    ...(act.error ? [] : act.rows).map((r) => ({
      id: `a${r.id}`,
      at: r.created_at,
      actor: r.actor_role,
      key: `po_act_${r.action.toLowerCase()}`,
      detail: null,
    })),
    ...(comm.error ? [] : comm.rows).map((r) => ({
      id: `c${r.id}`,
      at: r.created_at,
      actor: r.sender_role,
      key: 'po_act_comment',
      // Cắt ở tầng service chứ không ở giao diện: giao diện cắt thì vẫn phải
      // tải cả đoạn văn dài qua mạng rồi mới bỏ đi.
      detail: r.content.length > 90 ? `${r.content.slice(0, 90)}…` : r.content,
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 5);

  const matReady =
    h.material.bomLines === null || h.material.bomLines === 0
      ? null
      : ((h.material.readyLines ?? 0) / h.material.bomLines) * 100;

  return {
    ok: true,
    data: {
      head: h,
      materialReadyPct: matReady,
      buyerPending: (h.collab.pendingSamples ?? 0) + (h.collab.openChanges ?? 0),
      health,
      summary: buildSummary(h, health),
      activity,
      partial: head.partial,
      activityError: [act.error, comm.error].filter(Boolean).join(' · ') || null,
    },
  };
}
