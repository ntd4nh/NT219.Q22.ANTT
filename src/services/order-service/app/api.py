"""
Order Service – API Routes
"""

from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.get("/")
async def list_orders():
    """
    List orders for the authenticated user.
    Must filter by user_id from token to prevent data leakage.
    """
    # TODO: Implement with ownership filtering
    return {"message": "List orders – not yet implemented"}


@router.get("/{order_id}")
async def get_order(order_id: str):
    """
    Get an order by ID.
    BOLA protection: verify the requesting user owns this order.
    """
    # TODO: Implement ownership verification
    return {"message": f"Get order {order_id} – not yet implemented"}


@router.post("/")
async def create_order():
    """Create a new order for the authenticated user."""
    # TODO: Implement order creation
    return {"message": "Create order – not yet implemented"}


@router.patch("/{order_id}")
async def update_order(order_id: str):
    """
    Update an order.
    Must check ownership + allowed status transitions.
    """
    # TODO: Implement with ownership + status checks
    return {"message": f"Update order {order_id} – not yet implemented"}
