import 'server-only';

import { guard, safeQuery, one } from './guard';
import { stockValue, type StockRow, type RollRow, type MovementRow } from '@/schemas/warehouse';

// ============================================================================
// BẢNG TỒN KHO — NGUỒN SỐ LIỆU CHÍNH CỦA PHÂN HỆ
//
// ─── VÌ SAO ĐỌC stock_levels CHỨ KHÔNG ĐỌC materials.stock_qty ─────────────
// `materials.stock_qty` là MỘT con số cho cả nhà máy: không biết hàng nằm ở ô
// nào, thuộc lô nào, bao nhiêu đã có chủ. Nó vẫn được giữ nguyên cho các màn
// hình cũ, nhưng phân hệ này đọc `stock_levels` — nơi tách được ba trạng thái
// mà một cột không bao giờ tách nổi.
//
// ─── available_qty LÀ CỘT SINH TỰ ĐỘNG ────────────────────────────────────
// Đọc thẳng, KHÔNG tính lại ở đây. Tính lại nghĩa là có hai công thức trong hệ
// thống, và tới một ngày nào đó chúng sẽ lệch nhau.
// ============================================================================

interface RawStock {
  id: string;
  material_id: string;
  uom: string;
  on_hand_qty: number;
  reserved_qty: number;
  in_inspection_qty: number;
  blocked_qty: number;
  available_qty: number;
  last_counted_at: string | null;
  bin_id: string | null;
  materials: RawMaterial | RawMaterial[] | null;
  material_lots: { lot_no: string; suppliers: { name: string } | { name: string }[] | null } | null;
}
interface RawMaterial {
  material_code: string;
  name: string;
  category: string;
  sub_category: string | null;
  color_code: string | null;
  size_code: string | null;
  unit_price: number | null;
  currency: string | null;
  min_stock_qty: number | null;
}

/**
 * Toàn bộ tồn kho, đã ghép tên vật tư, lô, nhà cung cấp và đường dẫn vị trí.
 *
 * Đường dẫn vị trí lấy từ view `v_bin_path` bằng MỘT truy vấn riêng rồi ghép
 * trong bộ nhớ, thay vì nối bốn bảng trong câu select: PostgREST phải đi qua
 * bins → racks → zones → warehouses, mà quan hệ lồng bốn tầng thì cú pháp dài
 * và rất dễ gãy khi đổi tên khoá ngoại.
 */
export async function listStock(): Promise<{ rows: StockRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const sb = g.supabase;

  const [stockRes, pathRes] = await Promise.all([
    safeQuery<RawStock>('bảng tồn kho', () =>
      sb
        .from('stock_levels')
        .select(
          'id, material_id, uom, on_hand_qty, reserved_qty, in_inspection_qty,' +
            ' blocked_qty, available_qty, last_counted_at, bin_id,' +
            ' materials ( material_code, name, category, sub_category, color_code,' +
            ' size_code, unit_price, currency, min_stock_qty ),' +
            ' material_lots ( lot_no, suppliers ( name ) )',
        )
        .limit(2000),
    ),
    safeQuery<{ bin_id: string; full_path: string; zone_type: string }>('vị trí kho', () =>
      sb.from('v_bin_path').select('bin_id, full_path, zone_type').limit(5000),
    ),
  ]);

  if (stockRes.error) return { rows: [], error: stockRes.error };
  const pathBy = new Map(pathRes.rows.map((p) => [p.bin_id, p]));

  const rows: StockRow[] = stockRes.rows.map((s) => {
    const m = one(s.materials);
    const lot = s.material_lots;
    const path = s.bin_id ? pathBy.get(s.bin_id) : undefined;
    const onHand = Number(s.on_hand_qty) || 0;
    const price = m?.unit_price === null || m?.unit_price === undefined ? null : Number(m.unit_price);

    return {
      id: s.id,
      material_id: s.material_id,
      material_code: m?.material_code ?? '—',
      material_name: m?.name ?? '—',
      category: m?.category ?? 'OTHER',
      sub_category: m?.sub_category ?? null,
      color_code: m?.color_code ?? null,
      size_code: m?.size_code ?? null,
      uom: s.uom,
      lot_no: lot?.lot_no ?? null,
      supplier_name: one(lot?.suppliers ?? null)?.name ?? null,
      bin_path: path?.full_path ?? null,
      zone_type: path?.zone_type ?? null,
      on_hand_qty: onHand,
      reserved_qty: Number(s.reserved_qty) || 0,
      in_inspection_qty: Number(s.in_inspection_qty) || 0,
      blocked_qty: Number(s.blocked_qty) || 0,
      available_qty: Number(s.available_qty) || 0,
      unit_price: price,
      currency: m?.currency ?? null,
      stock_value: stockValue(onHand, price),
      // Trạng thái QA nằm ở cấp CUỘN, không ở cấp dòng tồn kho. Để null thay vì
      // đoán bừa "PASSED" — dòng tồn của phụ liệu vốn không đi qua kiểm 4 điểm.
      qa_status: null,
      min_stock_qty: m?.min_stock_qty === null || m?.min_stock_qty === undefined ? null : Number(m.min_stock_qty),
      last_counted_at: s.last_counted_at,
    };
  });

  return { rows, error: null };
}

// ─── Cuộn vải ───────────────────────────────────────────────────────────────

interface RawRoll {
  id: string;
  roll_code: string;
  material_id: string;
  shade_lot: string | null;
  initial_length_m: number;
  current_length_m: number;
  width_m: number | null;
  gsm: number | null;
  weight_kg: number | null;
  four_point_score: number | null;
  qa_status: string;
  relaxation_status: string;
  barcode: string | null;
  status: string;
  bin_id: string | null;
  materials: { material_code: string; name: string } | { material_code: string; name: string }[] | null;
  material_lots: { lot_no: string } | null;
}

export async function listRolls(): Promise<{ rows: RollRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const sb = g.supabase;

  const [rollRes, pathRes] = await Promise.all([
    safeQuery<RawRoll>('danh sách cuộn vải', () =>
      sb
        .from('fabric_rolls')
        .select(
          'id, roll_code, material_id, shade_lot, initial_length_m, current_length_m,' +
            ' width_m, gsm, weight_kg, four_point_score, qa_status, relaxation_status,' +
            ' barcode, status, bin_id, materials ( material_code, name ), material_lots ( lot_no )',
        )
        .order('roll_code')
        .limit(2000),
    ),
    safeQuery<{ bin_id: string; full_path: string }>('vị trí kho', () =>
      sb.from('v_bin_path').select('bin_id, full_path').limit(5000),
    ),
  ]);

  if (rollRes.error) return { rows: [], error: rollRes.error };
  const pathBy = new Map(pathRes.rows.map((p) => [p.bin_id, p.full_path]));

  return {
    rows: rollRes.rows.map((r) => {
      const m = one(r.materials);
      return {
        id: r.id,
        roll_code: r.roll_code,
        material_id: r.material_id,
        material_code: m?.material_code ?? null,
        material_name: m?.name ?? null,
        lot_no: r.material_lots?.lot_no ?? null,
        shade_lot: r.shade_lot,
        initial_length_m: Number(r.initial_length_m) || 0,
        current_length_m: Number(r.current_length_m) || 0,
        width_m: r.width_m === null ? null : Number(r.width_m),
        gsm: r.gsm === null ? null : Number(r.gsm),
        weight_kg: r.weight_kg === null ? null : Number(r.weight_kg),
        four_point_score: r.four_point_score === null ? null : Number(r.four_point_score),
        qa_status: r.qa_status,
        relaxation_status: r.relaxation_status,
        bin_path: r.bin_id ? pathBy.get(r.bin_id) ?? null : null,
        barcode: r.barcode,
        status: r.status,
      };
    }),
    error: null,
  };
}

// ─── Dòng thời gian biến động (§16) ─────────────────────────────────────────

interface RawMovement {
  id: number;
  movement_type: string;
  qty: number;
  uom: string;
  note: string | null;
  actor_role: string | null;
  created_at: string;
  from_bin_id: string | null;
  to_bin_id: string | null;
  materials: { material_code: string; name: string } | { material_code: string; name: string }[] | null;
  material_lots: { lot_no: string } | null;
  fabric_rolls: { roll_code: string } | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

/** Lịch sử biến động. Truyền materialId để xem riêng một vật tư trong panel 360°. */
export async function listMovements(
  materialId?: string,
  limit = 200,
): Promise<{ rows: MovementRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };
  const sb = g.supabase;

  const res = await safeQuery<RawMovement>('lịch sử biến động', () => {
    const q = sb
      .from('stock_movements')
      .select(
        'id, movement_type, qty, uom, note, actor_role, created_at, from_bin_id, to_bin_id,' +
          ' materials ( material_code, name ), material_lots ( lot_no ),' +
          ' fabric_rolls ( roll_code ), profiles:actor_id ( full_name )',
      )
      .order('id', { ascending: false })
      .limit(limit);
    return materialId ? q.eq('material_id', materialId) : q;
  });

  if (res.error) return { rows: [], error: res.error };

  const binIds = [...new Set(res.rows.flatMap((m) => [m.from_bin_id, m.to_bin_id]).filter(Boolean))] as string[];
  const pathBy = new Map<string, string>();
  if (binIds.length > 0) {
    const p = await safeQuery<{ bin_id: string; full_path: string }>('vị trí kho', () =>
      sb.from('v_bin_path').select('bin_id, full_path').in('bin_id', binIds),
    );
    for (const r of p.rows) pathBy.set(r.bin_id, r.full_path);
  }

  return {
    rows: res.rows.map((m) => {
      const mat = one(m.materials);
      return {
        id: m.id,
        movement_type: m.movement_type,
        material_code: mat?.material_code ?? null,
        material_name: mat?.name ?? null,
        lot_no: m.material_lots?.lot_no ?? null,
        roll_code: m.fabric_rolls?.roll_code ?? null,
        from_path: m.from_bin_id ? pathBy.get(m.from_bin_id) ?? null : null,
        to_path: m.to_bin_id ? pathBy.get(m.to_bin_id) ?? null : null,
        qty: Number(m.qty) || 0,
        uom: m.uom,
        note: m.note,
        actor_name: one(m.profiles)?.full_name ?? null,
        actor_role: m.actor_role,
        created_at: m.created_at,
      };
    }),
    error: null,
  };
}

// ─── Ô chọn dùng chung cho các form ─────────────────────────────────────────

export interface WhOptions {
  materials: Array<{ id: string; code: string; name: string; uom: string; category: string }>;
  bins: Array<{ id: string; path: string; zone_type: string }>;
  suppliers: Array<{ id: string; name: string }>;
}

export async function listWhOptions(): Promise<WhOptions> {
  const g = await guard();
  if (!g.supabase) return { materials: [], bins: [], suppliers: [] };
  const sb = g.supabase;

  const [m, b, s] = await Promise.all([
    safeQuery<{ id: string; material_code: string; name: string; unit: string; category: string }>(
      'ô chọn vật tư',
      () => sb.from('materials').select('id, material_code, name, unit, category').order('material_code').limit(1000),
    ),
    safeQuery<{ bin_id: string; full_path: string; zone_type: string }>('ô chọn vị trí', () =>
      sb.from('v_bin_path').select('bin_id, full_path, zone_type').order('full_path').limit(1000),
    ),
    safeQuery<{ id: string; name: string }>('ô chọn nhà cung cấp', () =>
      sb.from('suppliers').select('id, name').eq('is_active', true).order('name').limit(500),
    ),
  ]);

  return {
    materials: m.rows.map((x) => ({
      id: x.id, code: x.material_code, name: x.name, uom: x.unit, category: x.category,
    })),
    bins: b.rows.map((x) => ({ id: x.bin_id, path: x.full_path, zone_type: x.zone_type })),
    suppliers: s.rows,
  };
}
