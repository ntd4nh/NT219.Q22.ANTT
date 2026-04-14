"""
Test – Webhook Security
Verify HMAC signature validation and replay protection.
"""

# TODO: Implement test cases
# Scenarios:
#   1. Valid HMAC + valid timestamp → 200 OK
#   2. Invalid HMAC signature → 403 Forbidden
#   3. Expired timestamp (replay) → 403 Forbidden
#   4. Duplicate event ID (replay) → 409 Conflict or 200 (idempotent)
#   5. Missing signature header → 400 Bad Request
