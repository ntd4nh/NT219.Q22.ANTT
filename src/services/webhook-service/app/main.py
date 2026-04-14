"""
Webhook Service – FastAPI Application
Handles incoming webhooks with HMAC signature verification and replay protection.
"""

from fastapi import FastAPI
from app.api import router

app = FastAPI(
    title="Webhook Service",
    description="Webhook receiver with HMAC verification and anti-replay",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(router, prefix="/api/v1/webhooks", tags=["webhooks"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "webhook-service"}
