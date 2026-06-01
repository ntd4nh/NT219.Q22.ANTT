# NOT ACTIVE — OPA runtime đã được gỡ khỏi deployment.
# AuthZ thực tế nằm trong services/shared/authz.js (in-process).
# File này giữ lại làm tài liệu policy intent cho đồ án NT219.
package shopflow.billing

default allow = false

# S2S — read billing status
allow if {
  input.action == "read"
  input.resource.type == "billing_status"
  input.subject.client_id != ""
}

# Vault Transit demo endpoints are unauthenticated by design (D5)
allow if {
  input.action == "vault_transit"
  input.resource.type == "transit_key"
}

# --- Deny reasons ---

default deny_reason := "POLICY_DENY"

deny_reason := "MISSING_CLIENT_ID" if {
  not allow
  input.subject.client_id == ""
}
