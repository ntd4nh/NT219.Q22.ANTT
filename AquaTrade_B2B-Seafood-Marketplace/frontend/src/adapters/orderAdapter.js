export function toAquaLot(order) {
  return {
    id: order.id,
    tenantId: order.tenant_id,
    status: order.status || 'pending',
    amount: Number(order.amount || 0),
    displayPrice: `${Number(order.amount || 0).toLocaleString('vi-VN')} đ`,
  }
}

export function toAquaOrderList(payload) {
  const orders = Array.isArray(payload?.orders) ? payload.orders : []
  return orders.map(toAquaLot)
}
