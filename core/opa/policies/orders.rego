package shopflow.orders

default allow = false

allow {
  input.action == "list"
  input.subject.tenant_id != ""
}

allow {
  input.action == "read"
  input.resource.type == "order"
  input.subject.tenant_id == input.resource.tenant_id
}

allow {
  input.action == "read"
  input.resource.type == "order_summary"
  input.resource.tenant_id != ""
  input.subject.client_id != ""
}

default deny_reason := "POLICY_DENY"

deny_reason := "CROSS_TENANT" if {
  not allow
  input.action == "read"
  input.resource.type == "order"
  input.subject.tenant_id != input.resource.tenant_id
}
