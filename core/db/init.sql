CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);

CREATE TABLE IF NOT EXISTS vendor_profiles (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id),
  company_name TEXT NOT NULL,
  province TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_lots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  quality_grade TEXT NOT NULL,
  available_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_price_vnd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  lot_id TEXT NOT NULL REFERENCES catalog_lots(id),
  shipment_status TEXT NOT NULL,
  eta_date DATE NOT NULL,
  route_summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  lot_id TEXT NOT NULL REFERENCES catalog_lots(id),
  quantity_kg NUMERIC(12, 2) NOT NULL,
  total_vnd NUMERIC(12, 2) NOT NULL,
  quote_status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tenants (id, name) VALUES
  ('tenant-a', 'Shop Tenant A'),
  ('tenant-b', 'Shop Tenant B')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, tenant_id, amount, status) VALUES
  ('order-a-001', 'tenant-a', 99.00, 'paid'),
  ('order-a-002', 'tenant-a', 150.50, 'pending'),
  ('order-tenant-b', 'tenant-b', 200.00, 'paid'),
  ('order-tenant-b-001', 'tenant-b', 45.00, 'shipped')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendor_profiles (tenant_id, company_name, province, contact_name, role) VALUES
  ('tenant-a', 'AquaTrade Buyer Cooperative', 'Dong Thap', 'Tran Minh A', 'buyer'),
  ('tenant-b', 'AquaTrade Seller Plant', 'Ca Mau', 'Nguyen Thi B', 'seller')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO catalog_lots (id, tenant_id, sku, name, species, quality_grade, available_kg, unit_price_vnd) VALUES
  ('lot-a-001', 'tenant-a', 'AQ-BCT-60', 'Bot ca tra 60% dam', 'Pangasius', 'A', 25000, 8500),
  ('lot-a-002', 'tenant-a', 'AQ-DTS-45', 'Dau tom say', 'Penaeus monodon', 'B', 12000, 6200),
  ('lot-b-001', 'tenant-b', 'AQ-VTS-70', 'Vo tom say premium', 'Penaeus vannamei', 'A', 18000, 10500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO shipments (id, tenant_id, lot_id, shipment_status, eta_date, route_summary) VALUES
  ('shp-a-001', 'tenant-a', 'lot-a-001', 'in_transit', CURRENT_DATE + INTERVAL '2 day', 'Dong Thap -> Ho Chi Minh'),
  ('shp-b-001', 'tenant-b', 'lot-b-001', 'ready_pickup', CURRENT_DATE + INTERVAL '1 day', 'Ca Mau -> Binh Duong')
ON CONFLICT (id) DO NOTHING;
