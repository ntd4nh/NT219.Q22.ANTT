package shopflow.users

default allow = false

allow {
  input.action == "read"
  input.resource.type == "user_profile"
  input.resource.tenant_id != ""
  input.subject.client_id != ""
}

allow {
  input.action == "fetch_url"
  input.resource.allowlisted == true
}

default deny_reason := "POLICY_DENY"

deny_reason := "INVALID_TENANT" if {
  not allow
  input.resource.tenant_id == ""
}
