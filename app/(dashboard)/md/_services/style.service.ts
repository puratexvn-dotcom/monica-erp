import 'server-only';

import { guard, safeQuery, one } from './guard';
import type {
  StyleRow,
  ColorwayRow,
  SizeRow,
  OperationRow,
  StyleBomRow,
} from '@/schemas/md';

// ============================================================================
// ĐỌC DỮ LIỆU MÃ HÀNG
//
// 'server-only': nếu lỡ import file này vào client component, build sẽ báo lỗi
// ngay thay vì âm thầm gửi khoá và truy vấn xuống trình duyệt.
// ============================================================================

interface RawStyle {
  id: string;
  style_no: string;
  style_name: string;
  product_group: string | null;
  gender: string | null;
  sam_minutes: number | null;
  status: string;
  customers: { name: string } | { name: string }[] | null;
  seasons: { code: string } | { code: string }[] | null;
  style_colorways: { count: number }[] | null;
  style_sizes: { count: number }[] | null;
  style_bom: { count: number }[] | null;
  orders: { count: number }[] | null;
}

/**
 * Danh sách mã hàng kèm số lượng màu / size / dòng BOM / PO.
 *
 * Dùng cú pháp đếm của PostgREST (`style_colorways(count)`) thay vì gọi thêm
 * bốn truy vấn đếm: một mã hàng có thể có 10 màu × 8 size, tải hết về rồi đếm
 * ở tầng ứng dụng là kéo về hàng nghìn dòng chỉ để lấy bốn con số.
 */
export async function listStyles(): Promise<{ rows: StyleRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const res = await safeQuery<RawStyle>('danh sách mã hàng', () =>
    g.supabase
      .from('styles')
      .select(
        'id, style_no, style_name, product_group, gender, sam_minutes, status,' +
          ' customers ( name ), seasons ( code ),' +
          ' style_colorways ( count ), style_sizes ( count ),' +
          ' style_bom ( count ), orders ( count )',
      )
      .order('style_no', { ascending: true })
      .limit(500),
  );

  if (res.error) return { rows: [], error: res.error };

  const rows: StyleRow[] = res.rows.map((r) => ({
    id: r.id,
    style_no: r.style_no,
    style_name: r.style_name,
    product_group: r.product_group,
    gender: r.gender,
    sam_minutes: r.sam_minutes === null ? null : Number(r.sam_minutes),
    status: r.status,
    customer_name: one(r.customers)?.name ?? null,
    season_code: one(r.seasons)?.code ?? null,
    colorway_count: r.style_colorways?.[0]?.count ?? 0,
    size_count: r.style_sizes?.[0]?.count ?? 0,
    bom_count: r.style_bom?.[0]?.count ?? 0,
    order_count: r.orders?.[0]?.count ?? 0,
  }));

  return { rows, error: null };
}

export interface StyleDetail {
  colorways: ColorwayRow[];
  sizes: SizeRow[];
  operations: OperationRow[];
  bom: StyleBomRow[];
  /** Lỗi tách theo từng nhóm — gộp một biến thì nhóm nào hỏng cũng hiện
   *  "chưa có dữ liệu", người dùng tưởng trống trong khi là lỗi kết nối. */
  errors: {
    colorways: string | null;
    sizes: string | null;
    operations: string | null;
    bom: string | null;
  };
}

interface RawBom {
  id: string;
  item_name: string;
  category: string;
  unit: string;
  consumption_per_pcs: number;
  wastage_percent: number;
  net_consumption: number;
  supplier: string | null;
  style_colorways: { color_code: string } | { color_code: string }[] | null;
}

export async function getStyleDetail(styleId: string): Promise<StyleDetail> {
  const empty: StyleDetail = {
    colorways: [],
    sizes: [],
    operations: [],
    bom: [],
    errors: { colorways: null, sizes: null, operations: null, bom: null },
  };

  const g = await guard();
  if (!g.supabase) {
    return { ...empty, errors: { colorways: g.error, sizes: g.error, operations: g.error, bom: g.error } };
  }

  const [c, s, o, b] = await Promise.all([
    safeQuery<ColorwayRow>('bảng màu', () =>
      g.supabase
        .from('style_colorways')
        .select('id, color_code, color_name, pantone, hex_preview, is_active')
        .eq('style_id', styleId)
        .order('color_code'),
    ),
    safeQuery<SizeRow>('bảng size', () =>
      g.supabase
        .from('style_sizes')
        .select('id, size_code, sort_order, size_group')
        .eq('style_id', styleId)
        // Sắp theo sort_order, KHÔNG theo mã size: sắp theo chữ cái sẽ ra
        // L, M, S — sai hoàn toàn so với thứ tự thật S < M < L.
        .order('sort_order', { ascending: true }),
    ),
    safeQuery<OperationRow>('bảng công đoạn', () =>
      g.supabase
        .from('style_operations')
        .select('id, seq_no, operation, machine_type, sam_minutes')
        .eq('style_id', styleId)
        .order('seq_no', { ascending: true }),
    ),
    safeQuery<RawBom>('định mức NPL', () =>
      g.supabase
        .from('style_bom')
        .select(
          'id, item_name, category, unit, consumption_per_pcs, wastage_percent,' +
            ' net_consumption, supplier, style_colorways ( color_code )',
        )
        .eq('style_id', styleId)
        .order('category', { ascending: true }),
    ),
  ]);

  return {
    colorways: c.rows,
    sizes: s.rows,
    operations: o.rows.map((r) => ({ ...r, sam_minutes: Number(r.sam_minutes) })),
    bom: b.rows.map((r) => ({
      id: r.id,
      item_name: r.item_name,
      category: r.category,
      unit: r.unit,
      consumption_per_pcs: Number(r.consumption_per_pcs),
      wastage_percent: Number(r.wastage_percent),
      net_consumption: Number(r.net_consumption),
      supplier: r.supplier,
      // Để trống nghĩa là định mức áp cho MỌI màu
      color_code: one(r.style_colorways)?.color_code ?? null,
    })),
    errors: { colorways: c.error, sizes: s.error, operations: o.error, bom: b.error },
  };
}

/** Danh sách rút gọn để đổ vào ô chọn mã hàng ở form PO */
export async function listStyleOptions(): Promise<
  { rows: Array<{ id: string; style_no: string; style_name: string }>; error: string | null }
> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  return safeQuery<{ id: string; style_no: string; style_name: string }>('danh sách mã hàng', () =>
    g.supabase.from('styles').select('id, style_no, style_name').order('style_no').limit(500),
  );
}
