"""
Order Service – FastAPI Application
Handles order CRUD with ownership-based access control (BOLA protection).
"""

from fastapi import FastAPI
from app.api import router

app = FastAPI(
    title="Order Service",
    description="Order management with ownership verification",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(router, prefix="/api/v1/orders", tags=["orders"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "order-service"}
