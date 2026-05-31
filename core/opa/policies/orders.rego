package shopflow.orders

default allow = false

# D1 — List orders: tenant phải có tenant_id hợp lệ
allow if {
  input.action == "list"
  input.subject.tenant_id != ""
}

# D1 — Read order: chỉ đúng tenant mới được đọc (chống BOLA)
allow if {
  input.action == "read"
  input.resource.type == "order"
  input.subject.tenant_id == input.resource.tenant_id
}

# RBAC — Admin có thể đọc bất kỳ order nào (cross-tenant oversight)
allow if {
  input.action == "read"
  input.resource.type == "order"
  input.subject.roles[_] == "admin"
}

# RBAC — Admin có thể list tất cả
allow if {
  input.action == "list"
  input.subject.roles[_] == "admin"
}

# S2S — Read order summary: machine-to-machine, cần client_id
allow if {
  input.action == "read"
  input.resource.type == "order_summary"
  input.resource.tenant_id != ""
  input.subject.client_id != ""
}

# Catalog lots — tenant-scoped list (BOLA: query filter đủ, OPA confirm tenant exists)
allow if {
  input.action == "list"
  input.resource.type == "catalog_lot"
  input.subject.tenant_id != ""
}

# Vendor profile — chỉ đọc profile của chính tenant
allow if {
  input.action == "read"
  input.resource.type == "vendor_profile"
  input.subject.tenant_id == input.resource.tenant_id
}

# Shipments — tenant-scoped list
allow if {
  input.action == "list"
  input.resource.type == "shipment"
  input.subject.tenant_id != ""
}

# Quote — create: chỉ tạo quote cho lot thuộc đúng tenant
allow if {
  input.action == "create"
  input.resource.type == "quote"
  input.subject.tenant_id == input.resource.lot_tenant_id
}

# --- Deny reasons ---

default deny_reason := "POLICY_DENY"

deny_reason := "CROSS_TENANT" if {
  not allow
  input.action == "read"
  input.resource.type == "order"
  input.subject.tenant_id != input.resource.tenant_id
  not input.subject.roles[_] == "admin"
}

deny_reason := "CROSS_TENANT_QUOTE" if {
  not allow
  input.action == "create"
  input.resource.type == "quote"
  input.subject.tenant_id != input.resource.lot_tenant_id
}

deny_reason := "MISSING_TENANT" if {
  not allow
  input.subject.tenant_id == ""
  not input.subject.roles[_] == "admin"
}
