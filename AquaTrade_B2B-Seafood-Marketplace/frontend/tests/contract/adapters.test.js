import test from 'node:test'
import assert from 'node:assert/strict'
import { toAquaOrderList } from '../../src/adapters/orderAdapter.js'
import { toAquaProfile } from '../../src/adapters/profileAdapter.js'

test('order adapter maps core payload to AquaTrade model', () => {
  const result = toAquaOrderList({
    orders: [
      { id: 'order-a-001', tenant_id: 'tenant-a', amount: 8500, status: 'paid' },
    ],
  })
  assert.equal(result.length, 1)
  assert.equal(result[0].tenantId, 'tenant-a')
  assert.equal(result[0].displayPrice, '8.500 đ')
})

test('profile adapter maps tenant claim', () => {
  const profile = toAquaProfile({ sub: 'user-a', tenant_id: 'tenant-a' })
  assert.equal(profile.userId, 'user-a')
  assert.equal(profile.tenantId, 'tenant-a')
})
