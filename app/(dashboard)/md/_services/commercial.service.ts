import 'server-only';

import { guard, safeQuery, one } from './guard';
import {
  summarizeCosting, calcMargin,
  type CustomerRow, type InquiryRow, type CostingRow, type CostingItemRow,
} from '@/schemas/md';

// ============================================================================
// BA CHẶNG ĐẦU CỦA VÒNG ĐỜI: KHÁCH HÀNG -> YÊU CẦU BÁO GIÁ -> CHIẾT TÍNH GIÁ
//
// Đây là phần "trước khi có đơn". Nếu ba chặng này rời rạc thì tới lúc ký hợp
// đồng không ai truy được vì sao lại chốt mức giá đó — mà đúng con số ấy mới
// quyết định đơn hàng lãi hay lỗ.
// ============================================================================

// ─── 1. KHÁCH HÀNG ──────────────────────────────────────────────────────────

interface RawCustomer {
  id: string;
  customer_code: string;
  name: string;
  brand: string | null;
  country: string | null;
  currency: string | null;
  incoterm: string | null;
  is_active: boolean;
  kpi_on_time_rate: number | null;
  kpi_quality_rate: number | null;
  kpi_lifetime_value: number | null;
  orders: Array<{ count: number }> | null;
}

export async function listCustomers(): Promise<{ rows: CustomerRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const res = await safeQuery<RawCustomer>('danh sách khách hàng', () =>
    g.supabase
      .from('customers')
      .select(
        'id, customer_code, name, brand, country, currency, incoterm, is_active,' +
          ' kpi_on_time_rate, kpi_quality_rate, kpi_lifetime_value, orders ( count )',
      )
      .order('name', { ascending: true })
      .limit(500),
  );
  if (res.error) return { rows: [], error: res.error };

  return {
    rows: res.rows.map((c) => ({
      id: c.id,
      customer_code: c.customer_code,
      name: c.name,
      brand: c.brand,
      country: c.country,
      currency: c.currency,
      incoterm: c.incoterm,
      is_active: c.is_active,
      kpi_on_time_rate: c.kpi_on_time_rate === null ? null : Number(c.kpi_on_time_rate),
      kpi_quality_rate: c.kpi_quality_rate === null ? null : Number(c.kpi_quality_rate),
      kpi_lifetime_value: c.kpi_lifetime_value === null ? null : Number(c.kpi_lifetime_value),
      order_count: c.orders?.[0]?.count ?? 0,
    })),
    error: null,
  };
}

export interface ContactRow {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
}

export interface CustomerOrderRow {
  id: string;
  po_number: string;
  total_quantity: number;
  delivery_date: string;
  status: string;
  unit_price: number | null;
  currency: string | null;
}

export interface Customer360Data {
  contacts: ContactRow[];
  orders: CustomerOrderRow[];
  inquiries: InquiryRow[];
  costings: CostingRow[];
  errors: Record<string, string | null>;
}

const EMPTY_360: Customer360Data = {
  contacts: [], orders: [], inquiries: [], costings: [], errors: {},
};

/** Hồ sơ 360° của khách: người liên hệ, lịch sử đơn, yêu cầu báo giá, chiết tính.
 *  Bốn truy vấn chạy song song — chạy nối tiếp thì mở một khách hàng phải chờ
 *  bốn lượt khứ hồi mạng liên tiếp. */
export async function getCustomer360(customerId: string): Promise<Customer360Data> {
  const g = await guard();
  if (!g.supabase) return { ...EMPTY_360, errors: { all: g.error } };
  const sb = g.supabase;

  const [ctRes, odRes, iqRes, csRes] = await Promise.all([
    safeQuery<ContactRow>('người liên hệ', () =>
      sb
        .from('customer_contacts')
        .select('id, full_name, job_title, department, email, phone, is_primary')
        .eq('customer_id', customerId)
        .order('is_primary', { ascending: false }),
    ),
    safeQuery<CustomerOrderRow>('lịch sử đơn hàng', () =>
      sb
        .from('orders')
        .select('id, po_number, total_quantity, delivery_date, status, unit_price, currency')
        .eq('customer_id', customerId)
        .order('delivery_date', { ascending: false })
        .limit(200),
    ),
    safeQuery<RawInquiry>('yêu cầu báo giá', () =>
      sb
        .from('inquiries')
        .select(
          'id, inquiry_no, product_name, expected_qty, target_price, currency,' +
            ' order_type, received_date, due_date, status, customers ( name )',
        )
        .eq('customer_id', customerId)
        .order('received_date', { ascending: false })
        .limit(200),
    ),
    safeQuery<RawCosting>('bản chiết tính', () =>
      sb
        .from('costings')
        .select(
          'id, costing_no, version, order_type, currency, quantity, target_price,' +
            ' quoted_price, margin_percent, status, reject_reason, created_at,' +
            ' customers ( name ), styles ( style_no )',
        )
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(200),
    ),
  ]);

  return {
    contacts: ctRes.rows,
    orders: odRes.rows.map((o) => ({ ...o, unit_price: o.unit_price === null ? null : Number(o.unit_price) })),
    inquiries: iqRes.rows.map(toInquiryRow),
    costings: csRes.rows.map(toCostingRow),
    errors: {
      contacts: ctRes.error,
      orders: odRes.error,
      inquiries: iqRes.error,
      costings: csRes.error,
    },
  };
}

// ─── 2. YÊU CẦU BÁO GIÁ ─────────────────────────────────────────────────────

interface RawInquiry {
  id: string;
  inquiry_no: string;
  product_name: string;
  expected_qty: number | null;
  target_price: number | null;
  currency: string | null;
  order_type: string | null;
  received_date: string | null;
  due_date: string | null;
  status: string;
  customers: { name: string } | { name: string }[] | null;
}

function toInquiryRow(r: RawInquiry): InquiryRow {
  return {
    id: r.id,
    inquiry_no: r.inquiry_no,
    customer_name: one(r.customers)?.name ?? '—',
    product_name: r.product_name,
    expected_qty: r.expected_qty === null ? null : Number(r.expected_qty),
    target_price: r.target_price === null ? null : Number(r.target_price),
    currency: r.currency,
    order_type: r.order_type,
    received_date: r.received_date,
    due_date: r.due_date,
    status: r.status,
  };
}

export async function listInquiries(): Promise<{ rows: InquiryRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const res = await safeQuery<RawInquiry>('yêu cầu báo giá', () =>
    g.supabase
      .from('inquiries')
      .select(
        'id, inquiry_no, product_name, expected_qty, target_price, currency,' +
          ' order_type, received_date, due_date, status, customers ( name )',
      )
      .order('received_date', { ascending: false })
      .limit(500),
  );
  if (res.error) return { rows: [], error: res.error };
  return { rows: res.rows.map(toInquiryRow), error: null };
}

// ─── 3. CHIẾT TÍNH GIÁ ──────────────────────────────────────────────────────

interface RawCosting {
  id: string;
  costing_no: string;
  version: number;
  order_type: string | null;
  currency: string | null;
  quantity: number | null;
  target_price: number | null;
  quoted_price: number | null;
  margin_percent: number | null;
  status: string;
  reject_reason: string | null;
  created_at: string;
  customers: { name: string } | { name: string }[] | null;
  styles: { style_no: string } | { style_no: string }[] | null;
}

function toCostingRow(r: RawCosting): CostingRow {
  return {
    id: r.id,
    costing_no: r.costing_no,
    version: r.version,
    customer_name: one(r.customers)?.name ?? null,
    style_no: one(r.styles)?.style_no ?? null,
    reject_reason: r.reject_reason ?? null,
    order_type: r.order_type,
    currency: r.currency,
    quantity: r.quantity === null ? null : Number(r.quantity),
    target_price: r.target_price === null ? null : Number(r.target_price),
    quoted_price: r.quoted_price === null ? null : Number(r.quoted_price),
    margin_percent: r.margin_percent === null ? null : Number(r.margin_percent),
    status: r.status,
    created_at: r.created_at,
  };
}

export async function listCostings(): Promise<{ rows: CostingRow[]; error: string | null }> {
  const g = await guard();
  if (!g.supabase) return { rows: [], error: g.error };

  const res = await safeQuery<RawCosting>('bản chiết tính', () =>
    g.supabase
      .from('costings')
      .select(
        'id, costing_no, version, order_type, currency, quantity, target_price,' +
          ' quoted_price, margin_percent, status, reject_reason, created_at,' +
          ' customers ( name ), styles ( style_no )',
      )
      .order('created_at', { ascending: false })
      .limit(500),
  );
  if (res.error) return { rows: [], error: res.error };
  return { rows: res.rows.map(toCostingRow), error: null };
}

export interface CostingDetail {
  items: CostingItemRow[];
  byCategory: Array<{ category: string; amount: number }>;
  /** Giá thành một sản phẩm, cộng từ các khoản mục */
  totalCost: number;
  /** Biên lợi nhuận % so với giá báo. null = chưa nhập giá báo. */
  margin: number | null;
  /** Các phiên bản khác cùng số chiết tính — để đối chiếu bản cũ với bản mới */
  versions: Array<{ id: string; version: number; status: string; quoted_price: number | null; created_at: string }>;
  error: string | null;
}

/**
 * Chi tiết một bản chiết tính + toàn bộ các phiên bản cùng số.
 *
 * Biên lợi nhuận TÍNH LẠI tại đây từ các khoản mục thay vì đọc cột
 * margin_percent lưu sẵn: cột lưu sẵn chỉ đúng tại thời điểm bấm lưu, còn
 * người dùng có thể thêm khoản mục sau đó. Hai con số lệch nhau trên cùng màn
 * hình là thứ làm mất niềm tin vào cả hệ thống.
 */
export async function getCostingDetail(
  costingId: string,
  costingNo: string,
  quotedPrice: number | null,
): Promise<CostingDetail> {
  const g = await guard();
  if (!g.supabase) {
    return { items: [], byCategory: [], totalCost: 0, margin: null, versions: [], error: g.error };
  }
  const sb = g.supabase;

  const [itRes, vRes] = await Promise.all([
    safeQuery<CostingItemRow>('khoản mục chiết tính', () =>
      sb
        .from('costing_items')
        .select('id, category, item_name, unit, consumption, unit_price, amount')
        .eq('costing_id', costingId)
        .order('category'),
    ),
    safeQuery<{ id: string; version: number; status: string; quoted_price: number | null; created_at: string }>(
      'các phiên bản',
      () =>
        sb
          .from('costings')
          .select('id, version, status, quoted_price, created_at')
          .eq('costing_no', costingNo)
          .order('version', { ascending: false }),
    ),
  ]);

  const items = itRes.rows.map((it) => ({
    ...it,
    consumption: it.consumption === null ? null : Number(it.consumption),
    unit_price: it.unit_price === null ? null : Number(it.unit_price),
    amount: Number(it.amount ?? 0),
  }));
  const { byCategory, total } = summarizeCosting(items);

  return {
    items,
    byCategory,
    totalCost: total,
    margin: calcMargin(quotedPrice, total),
    versions: vRes.rows.map((v) => ({ ...v, quoted_price: v.quoted_price === null ? null : Number(v.quoted_price) })),
    error: itRes.error ?? vRes.error,
  };
}

/** Ô chọn khách hàng dùng chung cho các form RFQ / chiết tính / mã hàng */
export async function listCustomerOptions(): Promise<
  Array<{ id: string; customer_code: string; name: string }>
> {
  const g = await guard();
  if (!g.supabase) return [];
  const res = await safeQuery<{ id: string; customer_code: string; name: string }>(
    'ô chọn khách hàng',
    () => g.supabase.from('customers').select('id, customer_code, name').order('name').limit(500),
  );
  return res.rows;
}
