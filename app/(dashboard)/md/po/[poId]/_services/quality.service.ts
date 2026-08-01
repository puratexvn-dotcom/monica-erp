import 'server-only';

import { guard, safeQuery } from '../../../_services/guard';
import { canViewCapa, canViewQaDetail } from './po-rbac';
import {
  buildHeatMap, type HeatMap,
} from '@/lib/mos/defect-position';
import {
  capaAgeingOf, dhuOf, judgeAql, paretoOf, readAqlStatus, summariseCapa,
  type AqlResult, type CapaAgeing, type CapaStatus, type CapaSummary, type ParetoResult,
} from '@/lib/mos/quality';
import type { SummaryLine } from './executive.service';

// ============================================================================
// LÁT CẮT 4 — TRUNG TÂM CHẤT LƯỢNG · TẦNG NGHIỆP VỤ
//
// ─── HAI TRUY VẤN, MỘT LƯỢT CHỜ ──────────────────────────────────────────
// Phiếu kiểm và phiếu khắc phục là hai bảng không liên quan nhau về khoá, nên
// không nối được thành một truy vấn mà không nhân đôi số dòng. Chạy SONG SONG
// bằng Promise.all: thời gian chờ là lượt CHẬM HƠN, không phải tổng hai lượt.
// Số đo Phase 4: một lượt đi-về ~200ms; hai lượt nối tiếp ~400ms; hai lượt song
// song vẫn ~200ms.
//
// Tên loại lỗi lấy kèm bằng phép nhúng khoá ngoại `defect_catalog(...)` — không
// tốn thêm lượt đi-về nào, vì PostgREST nối ngay trong Postgres.
//
// ─── ĐIỀU VII ────────────────────────────────────────────────────────────
// Mọi phép tính — Pareto, DHU, kết luận AQL, mức khẩn CAPA — nằm ở
// lib/mos/quality.ts và lib/mos/defect-position.ts. Ở đây chỉ đọc và ghép.
//
// ─── VÌ SAO PHẢI PHÂN BIỆT "KHÔNG CÓ" VỚI "KHÔNG ĐƯỢC XEM" ──────────────
// ĐÃ ĐO bằng phiên đăng nhập buyer thật trên CSDL đang chạy: buyer đọc cả
// `capa_logs` (policy `capa_internal_only`, migration 023) lẫn `qa_logs`
// (`buyer_denied`, migration 018) đều ra ĐÚNG KHÔNG DÒNG NÀO — không lỗi, không
// cảnh báo, không triệu chứng.
//
// Nếu cứ thế vẽ, khách hàng sẽ đọc thành "đơn này chưa kiểm lần nào" và "nhà
// máy không có gì phải khắc phục", trong khi sự thật có thể là bốn lô đã kiểm,
// hai lô trượt và ba phiếu khắc phục đang quá hạn. Đó là loại sai lệch tệ nhất:
// im lặng, hợp lý, và có lợi cho bên vẽ ra nó.
//
// Vì vậy service trả về HAI CỜ để giao diện nói thẳng là mục nào không hiển thị
// cho vai trò của họ, thay vì vẽ một khung rỗng nói dối.
// ============================================================================

export interface QaLotRow {
  id: string;
  inspectionType: string | null;
  lotSize: number | null;
  sampleSize: number | null;
  checkedQty: number | null;
  qtyDefect: number | null;
  acNumber: number | null;
  reNumber: number | null;
  defectCode: string | null;
  /** Tên trong danh mục; rơi về chữ tự do cũ khi dòng chưa gán mã */
  defectLabel: string;
  defectClass: string | null;
  defectLocation: string | null;
  /** Kết luận QC đã ghi. Không bị ghi đè bởi phép tính lại. */
  aql: AqlResult;
  /** Kết luận máy tính ra từ ac/re. Chỉ để đối chiếu. */
  aqlComputed: AqlResult;
  createdAt: string | null;
  legacyCapaNote: string | null;
}

export interface CapaRow {
  id: string;
  capaNo: string;
  defectLabel: string | null;
  defectLocation: string | null;
  severity: string;
  rootCause: string;
  action: string;
  preventiveAction: string | null;
  picName: string | null;
  dueDate: string | null;
  status: CapaStatus;
  ageing: CapaAgeing;
  closedAt: string | null;
  createdAt: string | null;
}

export interface QualityKpi {
  /** Số sản phẩm đã kiểm. 0 khi chưa kiểm — và 0 nghĩa là 0. */
  checked: number;
  defects: number;
  /** Lỗi trên trăm sản phẩm. null khi chưa kiểm cái nào. */
  dhu: number | null;
  /** Tỉ lệ lô đạt AQL, phần trăm. null khi chưa lô nào có kết luận. */
  passRate: number | null;
  lots: number;
  lotsPassed: number;
  lotsFailed: number;
  lotsPending: number;
  /** Số lô mà kết luận đã ghi KHÁC với kết luận tính từ ac/re */
  disputed: number;
}

export interface QualityCenter {
  kpi: QualityKpi;
  lots: QaLotRow[];
  pareto: ParetoResult;
  heat: HeatMap;
  capa: CapaRow[];
  capaSummary: CapaSummary;
  /** false = vai trò này không được xem CAPA. Khác hẳn "chưa có CAPA nào". */
  capaVisible: boolean;
  /** false = vai trò này không được xem phiếu kiểm nội bộ. Khác hẳn "chưa kiểm". */
  qaVisible: boolean;
  insights: SummaryLine[];
  partial: string[];
}

export type QualityResult =
  | { ok: true; data: QualityCenter }
  | { ok: false; message: string };

interface RawQa {
  id: string;
  inspection_type: string | null;
  lot_size: number | null;
  sample_size: number | null;
  checked_qty: number | null;
  qty_defect: number | null;
  ac_number: number | null;
  re_number: number | null;
  defect_type: string | null;
  defect_class: string | null;
  defect_code: string | null;
  defect_location: string | null;
  aql_status: string | null;
  capa_note: string | null;
  created_at: string | null;
  defect_catalog: { name_vi: string } | { name_vi: string }[] | null;
}

interface RawCapa {
  id: string;
  capa_no: string;
  defect_label: string | null;
  defect_location: string | null;
  severity: string;
  root_cause: string;
  action: string;
  preventive_action: string | null;
  due_date: string | null;
  status: string;
  closed_at: string | null;
  created_at: string | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

/** Trên ngần này lỗi/100 sản phẩm thì coi là phải can thiệp chuyền */
const DHU_ALERT = 3;

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const nOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};

/** Quan hệ nhúng của PostgREST khi thì object khi thì mảng — chuẩn hoá một chỗ */
function embedded<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v.length > 0 ? v[0] : null;
  return v ?? null;
}

const QA_COLS =
  'id, inspection_type, lot_size, sample_size, checked_qty, qty_defect,' +
  'ac_number, re_number, defect_type, defect_class, defect_code, defect_location,' +
  'aql_status, capa_note, created_at, defect_catalog(name_vi)';

const CAPA_COLS =
  'id, capa_no, defect_label, defect_location, severity, root_cause, action,' +
  'preventive_action, due_date, status, closed_at, created_at, profiles:pic_id(full_name)';

function isCapaStatus(v: string): v is CapaStatus {
  return v === 'OPEN' || v === 'IN_PROGRESS' || v === 'VERIFYING' || v === 'CLOSED' || v === 'CANCELLED';
}

export async function getQualityCenter(poId: string): Promise<QualityResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };
  const sb = g.supabase;

  const capaVisible = canViewCapa(g.role);
  const qaVisible = canViewQaDetail(g.role);

  const [qaRes, capaRes] = await Promise.all([
    qaVisible
      ? safeQuery<RawQa>('phiếu kiểm chất lượng', () =>
          sb.from('qa_logs').select(QA_COLS).eq('order_id', poId)
            .order('created_at', { ascending: false }).limit(1000))
      // Không được xem thì KHÔNG gọi. `buyer_denied` của migration 018 sẽ trả về
      // danh sách rỗng KHÔNG KÈM LỖI — nhìn y hệt "đơn này chưa kiểm lần nào".
      : Promise.resolve({ rows: [] as RawQa[], error: null }),
    capaVisible
      ? safeQuery<RawCapa>('phiếu khắc phục', () =>
          sb.from('capa_logs').select(CAPA_COLS).eq('order_id', poId)
            .order('due_date', { ascending: true }).limit(500))
      // Không được xem thì KHÔNG gọi. Gọi rồi bị RLS trả rỗng cũng ra cùng kết
      // quả, nhưng tốn một lượt đi-về để nhận về sự thật đã biết trước.
      : Promise.resolve({ rows: [] as RawCapa[], error: null }),
  ]);

  if (qaRes.error) {
    const missing = /does not exist|schema cache/i.test(qaRes.error);
    return {
      ok: false,
      message: missing
        ? 'Chưa có cột dữ liệu cho chức năng này. Hãy chạy migration 023_quality_center.sql rồi thử lại.'
        : qaRes.error,
    };
  }

  const partial: string[] = [];
  // Lỗi ở CAPA KHÔNG được kéo sập cả tab: kết quả kiểm hàng vẫn đọc được và vẫn
  // có ích. Nhưng phải nói ra là mục nào đang thiếu.
  if (capaRes.error) partial.push('capa');

  // ── Phiếu kiểm ────────────────────────────────────────────────────────────
  const lots: QaLotRow[] = qaRes.rows.map((r) => {
    const cat = embedded(r.defect_catalog);
    const qty = nOrNull(r.qty_defect);
    const ac = nOrNull(r.ac_number);
    const re = nOrNull(r.re_number);
    return {
      id: r.id,
      inspectionType: r.inspection_type,
      lotSize: nOrNull(r.lot_size),
      sampleSize: nOrNull(r.sample_size),
      checkedQty: nOrNull(r.checked_qty),
      qtyDefect: qty,
      acNumber: ac,
      reNumber: re,
      defectCode: r.defect_code,
      // Ưu tiên tên danh mục; chữ tự do cũ chỉ là dự phòng cho dòng chưa gán mã.
      defectLabel: cat?.name_vi ?? r.defect_type ?? '—',
      defectClass: r.defect_class,
      defectLocation: r.defect_location,
      aql: readAqlStatus(r.aql_status),
      aqlComputed: judgeAql(qty, ac, re),
      createdAt: r.created_at,
      legacyCapaNote: r.capa_note,
    };
  });

  const checked = lots.reduce((s, l) => s + n(l.checkedQty), 0);
  const defects = lots.reduce((s, l) => s + n(l.qtyDefect), 0);
  const lotsPassed = lots.filter((l) => l.aql === 'PASS').length;
  const lotsFailed = lots.filter((l) => l.aql === 'FAIL').length;
  const lotsPending = lots.filter((l) => l.aql === 'PENDING').length;
  const concluded = lotsPassed + lotsFailed;

  const kpi: QualityKpi = {
    checked,
    defects,
    dhu: dhuOf(lots.length > 0 ? defects : null, checked > 0 ? checked : null),
    // Mẫu số là số lô ĐÃ KẾT LUẬN, không phải tổng số lô. Lô đang chờ kết luận
    // chưa đạt cũng chưa trượt; đếm nó vào mẫu số sẽ kéo tỉ lệ đạt xuống bằng
    // một sự kiện chưa xảy ra.
    passRate: concluded > 0 ? Math.round((lotsPassed / concluded) * 1000) / 10 : null,
    lots: lots.length,
    lotsPassed,
    lotsFailed,
    lotsPending,
    // Chỉ đối chiếu khi máy tính RA được kết luận: máy trả PENDING vì thiếu
    // ngưỡng ac thì đó là thiếu dữ liệu, không phải QC ghi sai.
    disputed: lots.filter((l) => l.aqlComputed !== 'PENDING' && l.aqlComputed !== l.aql).length,
  };

  // ── Pareto và bản đồ nhiệt ────────────────────────────────────────────────
  const pareto = paretoOf(
    lots.map((l) => ({ code: l.defectCode, label: l.defectLabel, qty: n(l.qtyDefect) })),
  );
  const heat = buildHeatMap(
    lots.map((l) => ({ position: l.defectLocation, qty: n(l.qtyDefect) })),
  );

  // ── CAPA ──────────────────────────────────────────────────────────────────
  const capa: CapaRow[] = capaRes.rows.map((r) => {
    const status: CapaStatus = isCapaStatus(r.status) ? r.status : 'OPEN';
    return {
      id: r.id,
      capaNo: r.capa_no,
      defectLabel: r.defect_label,
      defectLocation: r.defect_location,
      severity: r.severity,
      rootCause: r.root_cause,
      action: r.action,
      preventiveAction: r.preventive_action,
      picName: embedded(r.profiles)?.full_name ?? null,
      dueDate: r.due_date,
      status,
      ageing: capaAgeingOf(r.due_date, status),
      closedAt: r.closed_at,
      createdAt: r.created_at,
    };
  })
    // Quá hạn lên đầu, rồi sắp tới hạn. Người mở tab này đang tìm việc phải làm
    // hôm nay, không phải để đọc lại phiếu đã đóng tháng trước.
    .sort((a, b) => {
      const rank: Record<CapaAgeing, number> = { OVERDUE: 0, DUE_SOON: 1, ON_TRACK: 2, DONE: 3 };
      const d = rank[a.ageing] - rank[b.ageing];
      if (d !== 0) return d;
      return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
    });

  const capaSummary = summariseCapa(capa.map((c) => ({ status: c.status, ageing: c.ageing })));

  return {
    ok: true,
    data: {
      kpi, lots, pareto, heat, capa, capaSummary, capaVisible, qaVisible,
      insights: qaVisible
        ? buildInsights(kpi, pareto, heat, capaSummary, capaVisible)
        // Không đọc được phiếu kiểm thì mọi câu nhận xét rút ra từ đó đều là
        // kết luận trên tập rỗng. Im lặng đúng hơn là nói "mọi thứ đều ổn".
        : [],
      partial,
    },
  };
}

/**
 * Câu nhận xét cho người điều hành.
 *
 * ─── VÌ SAO Ở SERVICE CHỨ KHÔNG Ở COMPONENT ──────────────────────────────
 * Playbook Điều VII và bài học Phase 2: hai phép tính từng lọt vào component và phải gỡ
 * ra. Câu chữ hiển thị là việc của giao diện, nhưng QUYẾT ĐỊNH "có đáng cảnh
 * báo không" là nghiệp vụ. Ở đây trả về khoá i18n kèm số, giao diện chỉ ghép.
 */
function buildInsights(
  kpi: QualityKpi,
  pareto: ParetoResult,
  heat: HeatMap,
  capa: CapaSummary,
  capaVisible: boolean,
): SummaryLine[] {
  const out: SummaryLine[] = [];
  const s = (v: number): string => String(v);

  if (kpi.lots === 0) {
    out.push({ tone: 'INFO', key: 'po_qc_no_inspection', values: [] });
    return out;
  }

  if (kpi.lotsFailed > 0) {
    out.push({ tone: 'DANGER', key: 'po_qc_lots_failed', values: [s(kpi.lotsFailed), s(kpi.lots)] });
  }

  // Ngưỡng 3 lỗi trên trăm sản phẩm là mức thường dùng để coi là phải can thiệp
  // chuyền chứ không chỉ sửa hàng.
  if (kpi.dhu !== null) {
    out.push(
      kpi.dhu > DHU_ALERT
        ? { tone: 'DANGER', key: 'po_qc_dhu_high', values: [s(kpi.dhu)] }
        : { tone: 'GOOD', key: 'po_qc_dhu_ok', values: [s(kpi.dhu)] },
    );
  }

  if (pareto.total > 0 && pareto.vitalFew > 0) {
    out.push({ tone: 'INFO', key: 'po_qc_vital_few', values: [s(pareto.vitalFew)] });
  }

  if (heat.unlocated > 0) {
    out.push({ tone: 'WARN', key: 'po_qc_unlocated', values: [s(heat.unlocated)] });
  }

  if (kpi.disputed > 0) {
    out.push({ tone: 'WARN', key: 'po_qc_disputed', values: [s(kpi.disputed)] });
  }

  if (capaVisible) {
    if (capa.overdue > 0) {
      out.push({ tone: 'DANGER', key: 'po_qc_capa_overdue', values: [s(capa.overdue)] });
    } else if (capa.open > 0) {
      out.push({ tone: 'WARN', key: 'po_qc_capa_open', values: [s(capa.open)] });
    }
    // Có lô trượt mà không ai mở phiếu khắc phục là lỗ hổng quy trình, không
    // phải tin tốt. Nói thẳng ra.
    if (kpi.lotsFailed > 0 && capa.total === 0) {
      out.push({ tone: 'DANGER', key: 'po_qc_capa_missing', values: [] });
    }
  }

  return out;
}
