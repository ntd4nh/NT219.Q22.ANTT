# NOT ACTIVE — OPA runtime đã được gỡ khỏi deployment.
# AuthZ thực tế nằm trong services/shared/authz.js (in-process).
# File này giữ lại làm tài liệu policy intent cho đồ án NT219.
package shopflow.users

default allow = false

# S2S — read user profile of any tenant
allow if {
  input.action == "read"
  input.resource.type == "user_profile"
  input.resource.tenant_id != ""
  input.subject.client_id != ""
}

# User reads own profile (tenant-scoped)
allow if {
  input.action == "read"
  input.resource.type == "user_profile"
  input.subject.tenant_id == input.resource.tenant_id
}

# URL fetch allowed only if already passed allowlist + DNS validation
allow if {
  input.action == "fetch_url"
  input.resource.allowlisted == true
}

# --- Deny reasons ---

default deny_reason := "POLICY_DENY"

deny_reason := "INVALID_TENANT" if {
  not allow
  input.resource.tenant_id == ""
}

deny_reason := "CROSS_TENANT" if {
  not allow
  input.action == "read"
  input.resource.type == "user_profile"
  input.subject.tenant_id != input.resource.tenant_id
  input.subject.tenant_id != ""
}
