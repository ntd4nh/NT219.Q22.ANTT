export function toAquaProfile(payload) {
  return {
    userId: payload?.sub || 'unknown',
    tenantId: payload?.tenant_id || 'unknown',
  }
}
