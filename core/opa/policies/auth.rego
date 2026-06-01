# NOT ACTIVE — OPA runtime đã được gỡ khỏi deployment.
# AuthZ thực tế nằm trong services/shared/authz.js (in-process).
# File này giữ lại làm tài liệu policy intent cho đồ án NT219.
package shopflow.auth

default allow = false

# S2S — read auth service status
allow if {
  input.action == "read"
  input.resource.type == "auth_status"
  input.subject.client_id != ""
}

# Token exchange operations are self-authenticated via Keycloak; OPA gate for audit
allow if {
  input.action == "token_exchange"
  input.resource.type == "access_token"
  input.subject.client_id != ""
}

# --- Deny reasons ---

default deny_reason := "POLICY_DENY"

deny_reason := "MISSING_CLIENT_ID" if {
  not allow
  input.subject.client_id == ""
}
