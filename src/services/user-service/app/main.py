"""
User Service – FastAPI Application
Handles user profile management with BOLA protection.
"""

from fastapi import FastAPI
from app.api import router

app = FastAPI(
    title="User Service",
    description="User profile management with ownership-based access control",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(router, prefix="/api/v1/users", tags=["users"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user-service"}
