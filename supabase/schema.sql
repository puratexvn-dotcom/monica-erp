-- ############################################################################
-- ⛔ TỆP NÀY ĐÃ LỖI THỜI — KHÔNG DÙNG ĐỂ DỰNG LẠI CƠ SỞ DỮ LIỆU
--
-- Sửa lần cuối 27/07/2026. Từ đó tới nay đã có **26 migration** chạy thêm
-- (015 → 040), trong đó có:
--
--   018 · 025 · 030 · 031a/b/c/c2/c3   toàn bộ phân quyền RLS
--   029                                 Assignment Domain + sổ cái chỉ-ghi-thêm
--   034                                 kiểm soát tương tranh (version)
--   036                                 xoá mềm
--   038 · 038b                          khoá hàm SECURITY DEFINER khỏi `anon`
--   040                                 bất biến I-11
--
-- Chạy tệp này sẽ dựng lại một lược đồ **KHÔNG CÒN TỒN TẠI**: không RLS, không
-- bất biến, không sổ cái. Đó là một sự cố bảo mật, không phải một thao tác dựng
-- lại môi trường.
--
-- ✅ NGUỒN SỰ THẬT DUY NHẤT LÀ `supabase/migrations/` — chạy theo thứ tự số.
-- ✅ Dữ liệu nền: `supabase/seeds/S001_business_baseline.sql`.
--
-- Giữ lại tệp này làm tư liệu lịch sử. Đánh dấu bởi Enterprise Architecture
-- Audit 03/08/2026 (P1-5 · Schema Drift).
-- ############################################################################

-- ============================================================================
-- MONICA GARMENT ERP — Supabase Schema (chạy trong SQL Editor)
-- Lưu ý: demo dùng anon key + bảng users thường. Production: Supabase Auth + RLS.
-- ============================================================================

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null, -- ⚠️ DEMO ONLY — production dùng Supabase Auth (bcrypt)
  role text not null check (role in ('superadmin','giamdoc','md','qa','totruongmay','totruongcat','kho','ketoan','subcon','buyer')),
  name text not null,
  avatar text default '',
  subcon_id text,
  buyer_brand text,
  active boolean default true
);

create table if not exists subcons (
  id text primary key,
  name text not null,
  contact text default '',
  phone text default '',
  capacity_per_day numeric default 0
);

create table if not exists sewing_lines (
  id text primary key,
  name text not null,
  worker_count numeric default 0,
  sam_default numeric default 0
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  po_code text not null,
  brand text default '',
  product_name text default '',
  target_qty numeric default 0,
  size_breakdown jsonb default '{}',
  unit_price_cmt numeric default 0,
  unit_price_fob numeric default 0,
  status text default 'Mới',
  etd_date date,
  xfactory_date date,
  subcon_id text references subcons(id),
  line_id text references sewing_lines(id),
  created_at timestamptz default now()
);

create table if not exists bom (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  item_name text not null,
  category text default 'Vải',
  unit text default 'm',
  norm_per_pcs numeric default 0,
  wastage_percent numeric default 0,
  npl_status text default 'Chưa đặt'
);

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  type text default 'NPL' check (type in ('NPL','Thành phẩm')),
  qty_kg numeric default 0,
  qty_m numeric default 0,
  gsm numeric default 0,
  width_m numeric default 0,
  color_code text default '',
  dye_lot text default '',
  shade text default '',
  roll_count numeric default 0,
  safety_stock numeric default 0,
  order_id uuid references orders(id)
);

create table if not exists cutting_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  marker_name text default '',
  table_count numeric default 0,
  ply_count numeric default 0,
  size_ratio jsonb default '{}',
  cut_qty numeric default 0,
  fabric_used_m numeric default 0,
  marker_length_m numeric default 0,
  waste_percent numeric default 0,
  created_at timestamptz default now()
);

create table if not exists bundles (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  cutting_log_id uuid references cutting_logs(id),
  bundle_no text not null,
  size text default '',
  qty numeric default 0,
  status text default 'Đã cắt'
);

create table if not exists prod_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  subcon_id text references subcons(id),
  line_id text references sewing_lines(id),
  stage text default '',
  qty_ok numeric default 0,
  qty_defect numeric default 0,
  hour_slot text default '',
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists qa_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  inspection_type text default 'Inline' check (inspection_type in ('Inline','Endline')),
  lot_size numeric default 0,
  sample_size numeric default 0,
  ac_number numeric default 0,
  re_number numeric default 0,
  defect_type text default '',
  defect_class text default 'Major',
  qty_defect numeric default 0,
  checked_qty numeric default 0,
  aql_status text default 'Pending',
  capa_note text default '',
  created_at timestamptz default now()
);

create table if not exists samples (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  stage text not null check (stage in ('Proto','Fit','SMS','PP','TOP')),
  status text default 'Đang làm',
  buyer_comment text default '',
  sent_date timestamptz
);

create table if not exists financial_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  subcon_id text references subcons(id),
  qa_passed_qty numeric default 0,
  unit_price numeric default 0,
  penalty_amount numeric default 0,
  penalty_note text default '',
  advance_pay numeric default 0,
  total_pay numeric default 0,
  status text default 'Chờ đối soát'
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  requester text default '',
  order_id uuid references orders(id),
  content text default '',
  qty numeric default 0,
  status text default 'Chờ duyệt',
  reason text default '',
  created_at timestamptz default now()
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  carton_count numeric default 0,
  qty numeric default 0,
  gw_kg numeric default 0,
  nw_kg numeric default 0,
  etd date,
  status text default 'Chuẩn bị'
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  severity text default 'info',
  message text not null,
  roles jsonb default '[]',
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  buyer_user text default '',
  rating numeric default 5,
  content text default '',
  created_at timestamptz default now()
);

create table if not exists system_logs (
  id uuid primary key default gen_random_uuid(),
  "user" text default '',
  action text default '',
  detail text default '',
  created_at timestamptz default now()
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text default ''
);

-- Tham số mặc định
insert into settings (key, value) values
  ('gsm_default', '220'),
  ('max_cutting_waste_percent', '3.5'),
  ('defect_warning_percent', '3'),
  ('safety_stock_factor', '1.05'),
  ('four_point_threshold', '40')
on conflict (key) do nothing;

-- Bật Realtime cho các bảng chính:
-- Dashboard → Database → Replication → thêm: prod_logs, qa_logs, orders, approvals, notifications
