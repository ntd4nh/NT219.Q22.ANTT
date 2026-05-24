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
