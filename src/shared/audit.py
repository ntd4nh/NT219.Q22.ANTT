# ──────────────────────────────────────────────
# Shared utility – Audit Logger
# ──────────────────────────────────────────────
"""
Structured audit logging for API security events.
Logs: request_id, timestamp, subject, action, resource, IP, status, details.
"""

import json
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger("audit")
logger.setLevel(logging.INFO)

# Console handler with JSON format
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
logger.addHandler(handler)


def log_event(
    subject: str,
    action: str,
    resource: str = "",
    ip_address: str = "",
    status: str = "allowed",
    details: dict | None = None,
):
    """Log a structured audit event."""
    event = {
        "request_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "subject": subject,
        "action": action,
        "resource": resource,
        "ip_address": ip_address,
        "status": status,
        "details": details or {},
    }
    logger.info(json.dumps(event))
    return event
