import { apiRequest } from './httpClient'
import { toAquaOrderList } from '../adapters/orderAdapter'
import { toAquaProfile } from '../adapters/profileAdapter'

export async function fetchMyOrders() {
  const payload = await apiRequest('/orders', { method: 'GET' })
  return toAquaOrderList(payload)
}

export async function fetchMyProfile() {
  const payload = await apiRequest('/users', { method: 'GET' })
  return toAquaProfile(payload)
}
