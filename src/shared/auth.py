# ──────────────────────────────────────────────
# Shared utility – Keycloak JWT Token Verification
# ──────────────────────────────────────────────
"""
Common authentication dependency for FastAPI services.
Validates JWT tokens issued by Keycloak and extracts claims.
"""

import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# TODO: Implement actual JWT validation using python-jose
# Steps:
#   1. Fetch Keycloak JWKS from well-known endpoint
#   2. Decode and validate the JWT (signature, expiry, audience, issuer)
#   3. Extract sub, roles, scope from claims
#   4. Return a structured user context

security_scheme = HTTPBearer()

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "app-realm")


class TokenClaims:
    """Represents validated token claims."""

    def __init__(self, sub: str, roles: list[str], scope: str):
        self.sub = sub        # user ID
        self.roles = roles    # e.g. ["user", "admin"]
        self.scope = scope    # OAuth2 scope string


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> TokenClaims:
    """
    Dependency that validates the Bearer token and returns claims.
    Raises 401 if token is invalid.
    """
    token = credentials.credentials
    # TODO: validate token with Keycloak JWKS
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token validation not yet implemented",
    )
