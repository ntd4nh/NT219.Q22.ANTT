// NOT ACTIVE — OPA runtime removed from deployment. AuthZ handled in-process via services/shared/authz.js.
// This file is retained for reference only; no service imports it.
const OPA_URL = process.env.OPA_URL || 'http://opa:8181'
const OPA_ENABLED = process.env.OPA_ENABLED !== 'false'

export function isOpaEnabled() {
  return OPA_ENABLED
}

export async function opaAllow(packagePath, input) {
  if (!OPA_ENABLED) return { allow: true, reason: null }
  const url = `${OPA_URL}/v1/data/${packagePath.replace(/\./g, '/')}/allow`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  })
  if (!res.ok) {
    throw new Error(`OPA query failed: HTTP ${res.status}`)
  }
  const json = await res.json()
  return { allow: json.result === true, raw: json }
}

export async function opaDenyReason(packagePath, input) {
  const url = `${OPA_URL}/v1/data/${packagePath.replace(/\./g, '/')}/deny_reason`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  })
  if (!res.ok) return 'OPA_ERROR'
  const json = await res.json()
  return json.result || 'POLICY_DENY'
}

export function opaAuthorize(packagePath, buildInput) {
  return async (req, res, next) => {
    if (!OPA_ENABLED) return next()
    try {
      const input = await buildInput(req)
      const { allow } = await opaAllow(packagePath, input)
      if (allow) return next()
      const reason = await opaDenyReason(packagePath, input)
      req.opaDenyReason = reason
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'OPA policy denied',
        reason_code: reason,
      })
    } catch (e) {
      return res.status(503).json({ error: 'SERVICE_UNAVAILABLE', message: e.message })
    }
  }
}
