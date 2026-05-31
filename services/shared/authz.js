export function isAdmin(roles = []) {
  return Array.isArray(roles) && roles.includes('admin')
}

export function checkTenantAccess(userTenant, resourceTenant, roles = []) {
  if (isAdmin(roles)) return { allow: true }
  if (!userTenant) return { allow: false, reason: 'MISSING_TENANT_CLAIM' }
  if (userTenant !== resourceTenant) return { allow: false, reason: 'CROSS_TENANT' }
  return { allow: true }
}

export function denyAuthz(res, log, req, reason, event = 'AUTHZ_DENIED', status = 403, body = {}) {
  return res.status(status).json({
    error: body.error || 'FORBIDDEN',
    message: body.message || 'Access denied',
    reason_code: reason,
    ...body,
  })
}
