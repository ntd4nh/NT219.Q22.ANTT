package shopflow.auth

default allow = false

allow {
  input.action == "read"
  input.resource.type == "auth_status"
  input.subject.client_id != ""
}

default deny_reason := "POLICY_DENY"
