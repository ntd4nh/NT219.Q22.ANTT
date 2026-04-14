"""
User Service – API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated

router = APIRouter()


@router.get("/me")
async def get_current_user():
    """Get current authenticated user's profile."""
    # TODO: Implement with Keycloak token validation
    return {"message": "Get current user – not yet implemented"}


@router.get("/{user_id}")
async def get_user(user_id: str):
    """
    Get a user by ID.
    BOLA protection: must verify that the requester owns this resource
    or has admin privileges.
    """
    # TODO: Implement ownership check to prevent BOLA
    return {"message": f"Get user {user_id} – not yet implemented"}
