import 'server-only';

import { guard, safeQuery, friendlyDbError, one } from './guard';
import { toMeters } from '@/lib/mos/four-point';
import type {
  CustomerLimit, InspectionFormValues, InspectionRow, RollForInspection, ShadeVariation,
} from '@/schemas/warehouse/inspection.schema';

// ============================================================================
// CHẤM ĐIỂM 4-POINT — TẦNG NGHIỆP VỤ
//
// ─── ĐIỀU VII: KHÔNG CÓ NGHIỆP VỤ NÀO NẰM Ở GIAO DIỆN ────────────────────
// Quy đổi đơn vị, sinh số phiếu, chọn ngưỡng — tất cả nằm ở đây. Component chỉ
// nhận dữ liệu đã sẵn sàng và vẽ ra.
//
// ─── KẾT LUẬN ĐẠT/TRƯỢT KHÔNG NẰM Ở ĐÂY ──────────────────────────────────
// Trigger `wh_inspection_prepare` ở migration 020 mới là nơi quyết định. Service
// này CỐ Ý không gửi `result` lên: gửi lên cũng bị ghi đè, mà có gửi thì lại
// thành hai nơi cùng quyết định một việc. Sau khi ghi, đọc lại dòng vừa tạo để
// biết máy chủ đã kết luận gì.
// ============================================================================

// ⚠️ TEN COT THAT, DA DO TREN CO SO DU LIEU DANG CHAY:
//   materials -> material_code, name   (KHONG co material_name)
//   customers -> customer_code, name   (KHONG co customer_name)
// Ban dau toi doan theo mau `<bang>_name` va migration 020 bi chan ngay o
// buoc tao view. Postgres goi y sua thanh `material_code` — nghe theo thi cau
// truy van chay duoc nhung MAT HAN ten vat tu, tuc doi mot loi lo ra thanh mot
// loi im lang. Ten cot phai do, khong duoc doan.
interface RawRoll {
  id: string;
  roll_code: string;
  material_id: string | null;
  current_length_m: number | null;
  width_m: number | null;
  qa_status: string;
  shade_lot: string | null;
  materials: { material_code: string; name: string } | { material_code: string; name: string }[] | null;
  material_lots: { lot_no: string; shade_code: string | null } | { lot_no: string; shade_code: string | null }[] | null;
  v_bin_path: { full_path: string } | { full_path: string }[] | null;
}

interface RawInspection {
  id: string;
  inspection_no: string;
  roll_id: string | null;
  total_points: number;
  inspected_area_sqyd: number | null;
  points_per_100sqyd: number | null;
  acceptance_limit: number;
  result: string;
  shade_variation: string | null;
  inspected_at: string | null;
  fabric_rolls: { roll_code: string } | { roll_code: string }[] | null;
  materials: { name: string } | { name: string }[] | null;
}

interface RawCustomer {
  id: string;
  name: string | null;
  customer_code: string | null;
  four_point_limit: number | null;
}

/** Số dương hoặc null. KHÔNG bao giờ trả 0 thay cho "không đọc được" — quy ước
 *  của dự án: 0 là 0, không đọc được là "—". */
function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Cuộn đang chờ kiểm. Lấy cả CONDITIONAL để kiểm lại được cuộn đã gỡ khoá. */
export async function listRollsForInspection(): Promise<{ rows: RollForInspection[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const sb = g.supabase;

  const res = await safeQuery<RawRoll>('danh sách cuộn chờ kiểm', () =>
    sb
      .from('fabric_rolls')
      .select(
        'id, roll_code, material_id, current_length_m, width_m, qa_status, shade_lot,' +
          'materials(material_code, name),' +
          'material_lots(lot_no, shade_code),' +
          'v_bin_path(full_path)',
      )
      .in('qa_status', ['PENDING', 'CONDITIONAL'])
      .order('roll_code')
      .limit(500),
  );
  if (res.error) return { rows: [], error: res.error };

  return {
    rows: res.rows.map((r) => {
      const mat = one(r.materials);
      const lot = one(r.material_lots);
      const bin = one(r.v_bin_path);
      return {
        id: r.id,
        rollCode: r.roll_code,
        materialId: r.material_id,
        materialCode: mat?.material_code ?? null,
        materialName: mat?.name ?? null,
        lotNo: lot?.lot_no ?? null,
        // Tông màu ở hai chỗ: bảng lô (mới) ưu tiên, thiếu thì lùi về cột cũ
        // trên chính cuộn. Không có cả hai thì để null để giao diện hiện rõ
        // "chưa gán tông" thay vì dồn vào một nhóm chung và giấu mất rủi ro.
        shadeCode: lot?.shade_code ?? r.shade_lot ?? null,
        binPath: bin?.full_path ?? null,
        currentLengthM: num(r.current_length_m),
        widthM: num(r.width_m),
        qaStatus: r.qa_status,
      };
    }),
    error: null,
  };
}

/** Các phiếu đã kiểm, mới nhất trước. Đọc VIEW để lấy sẵn điểm/100 yd². */
export async function listInspections(): Promise<{ rows: InspectionRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const sb = g.supabase;

  const res = await safeQuery<RawInspection>('danh sách phiếu kiểm', () =>
    sb
      .from('v_inspection_score')
      .select(
        'id, inspection_no, roll_id, total_points, inspected_area_sqyd, points_per_100sqyd,' +
          'acceptance_limit, result, shade_variation, inspected_at,' +
          'fabric_rolls(roll_code), materials(name)',
      )
      .order('inspected_at', { ascending: false })
      .limit(200),
  );
  if (res.error) return { rows: [], error: res.error };

  return {
    rows: res.rows.map((r) => ({
      id: r.id,
      inspectionNo: r.inspection_no,
      rollId: r.roll_id,
      rollCode: one(r.fabric_rolls)?.roll_code ?? null,
      materialName: one(r.materials)?.name ?? null,
      totalPoints: Number(r.total_points) || 0,
      areaSqYd: num(r.inspected_area_sqyd),
      pointsPer100SqYd: num(r.points_per_100sqyd),
      acceptanceLimit: Number(r.acceptance_limit) || 0,
      result: (['PENDING', 'PASSED', 'FAILED', 'CONDITIONAL'] as const).includes(
        r.result as 'PENDING',
      )
        ? (r.result as InspectionRow['result'])
        : 'PENDING',
      shadeVariation: (r.shade_variation as ShadeVariation | null) ?? null,
      inspectedAt: r.inspected_at,
    })),
    error: null,
  };
}

/** Khách hàng kèm ngưỡng riêng — để màn hình nói rõ ngưỡng đang từ đâu ra. */
export async function listCustomerLimits(): Promise<{ rows: CustomerLimit[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const sb = g.supabase;

  const res = await safeQuery<RawCustomer>('danh sách khách hàng', () =>
    sb
      .from('customers')
      .select('id, name, customer_code, four_point_limit')
      .order('name')
      .limit(500),
  );
  if (res.error) return { rows: [], error: res.error };

  return {
    rows: res.rows.map((c) => ({
      id: c.id,
      name: c.name ?? c.customer_code ?? '—',
      fourPointLimit: num(c.four_point_limit),
    })),
    error: null,
  };
}

export interface SaveResult {
  ok: boolean;
  /** Kết luận do MÁY CHỦ trả về sau khi ghi, không phải do trình duyệt đoán */
  result?: InspectionRow['result'];
  inspectionNo?: string;
  message?: string;
}

/**
 * Ghi một phiếu kiểm.
 *
 * Quy đổi về mét ngay tại đây (Điều VII: nghiệp vụ không nằm ở giao diện), rồi
 * để trigger tính diện tích, chọn ngưỡng theo khách và kết luận đạt/trượt.
 */
export async function createInspection(v: InspectionFormValues): Promise<SaveResult> {
  const g = await guard();
  if (!g.supabase) return { ok: false, message: g.error };
  const sb = g.supabase;

  const lengthM = toMeters(v.length, v.entryUom);
  const widthM = toMeters(v.width, v.entryUom);

  // Đọc cuộn để lấy vật tư và lô — phiếu kiểm phải tự đứng vững khi tra lại,
  // không phụ thuộc việc cuộn sau này có bị đổi lô hay không.
  const rollRes = await safeQuery<{ material_id: string | null; lot_id: string | null; uom: string | null }>(
    'thông tin cuộn vải',
    () => sb.from('fabric_rolls').select('material_id, lot_id').eq('id', v.rollId).limit(1),
  );
  if (rollRes.error) return { ok: false, message: rollRes.error };
  const roll = rollRes.rows[0];
  if (!roll?.material_id) {
    return { ok: false, message: 'Cuộn vải này chưa gắn với vật tư nào nên chưa lập phiếu kiểm được.' };
  }

  // Số phiếu sinh ở máy chủ: để trình duyệt sinh thì hai người kiểm cùng lúc
  // sẽ tạo trùng số, và ràng buộc UNIQUE sẽ đánh trượt người bấm sau.
  const stamp = new Date();
  const inspectionNo =
    `4P-${stamp.getUTCFullYear()}${String(stamp.getUTCMonth() + 1).padStart(2, '0')}` +
    `${String(stamp.getUTCDate()).padStart(2, '0')}-${stamp.getTime().toString(36).toUpperCase().slice(-6)}`;

  const { data, error } = await sb
    .from('material_inspections')
    .insert({
      inspection_no: inspectionNo,
      material_id: roll.material_id,
      lot_id: roll.lot_id,
      roll_id: v.rollId,
      customer_id: v.customerId,
      inspected_qty: lengthM,
      uom: 'METERS',
      inspected_length_m: lengthM,
      inspected_width_m: widthM,
      entry_uom: v.entryUom,
      points_1: v.p1,
      points_2: v.p2,
      points_3: v.p3,
      points_4: v.p4,
      shade_variation: v.shadeVariation,
      shrinkage_pct: v.shrinkagePct,
      color_fastness: v.colorFastness,
      yarn_defect_note: v.yarnDefectNote,
      inspected_by: g.userId,
      // CỐ Ý không gửi result và acceptance_limit — trigger quyết định.
    })
    .select('inspection_no, result')
    .single();

  if (error) {
    const missing = error.code === 'PGRST204' || error.code === '42703';
    return {
      ok: false,
      message: missing
        ? 'Chưa có cột dữ liệu cho chức năng này. Hãy chạy migration 020_warehouse_allocation.sql rồi thử lại.'
        : friendlyDbError('lưu phiếu kiểm', error),
    };
  }

  return {
    ok: true,
    inspectionNo: data.inspection_no as string,
    result: data.result as InspectionRow['result'],
  };
}
