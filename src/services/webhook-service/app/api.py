"""
Webhook Service – API Routes
Implements HMAC signature verification and replay protection
to defend against Webhook Forgery / Replay attacks.
"""

from fastapi import APIRouter, Request, HTTPException, status

router = APIRouter()


@router.post("/payment")
async def receive_payment_webhook(request: Request):
    """
    Receive payment notifications from external payment gateway.
    Security:
      - Verify HMAC signature
      - Check timestamp to prevent replay
      - Deduplicate by event ID
    """
    # TODO: Implement HMAC verification
    # TODO: Implement timestamp check
    # TODO: Implement idempotency / dedup
    return {"message": "Payment webhook – not yet implemented"}


@router.post("/shipping")
async def receive_shipping_webhook(request: Request):
    """
    Receive shipping status updates from logistics partner.
    Same security measures as payment webhook.
    """
    # TODO: Implement
    return {"message": "Shipping webhook – not yet implemented"}
