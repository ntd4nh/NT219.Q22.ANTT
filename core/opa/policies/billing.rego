package shopflow.billing

default allow = false

allow {
  input.action == "read"
  input.resource.type == "billing_status"
  input.subject.client_id != ""
}

allow {
  input.action == "webhook_ingest"
  input.subject.client_id != ""
}

default deny_reason := "POLICY_DENY"
