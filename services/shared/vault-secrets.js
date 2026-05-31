import crypto from 'crypto'

export async function fetchVaultSecret(path, field, options = {}) {
  const { required = false } = options
  const addr = process.env.VAULT_ADDR
  const token = process.env.VAULT_TOKEN
  if (!addr || !token) {
    if (required) throw new Error('VAULT_ADDR and VAULT_TOKEN are required')
    return null
  }
  try {
    const res = await fetch(`${addr}/v1/${path}`, { headers: { 'X-Vault-Token': token } })
    if (!res.ok) {
      if (required) throw new Error(`Vault read failed for ${path}: HTTP ${res.status}`)
      return null
    }
    const json = await res.json()
    const value = json?.data?.data?.[field] ?? null
    if (required && !value) throw new Error(`Vault field ${field} missing at ${path}`)
    return value
  } catch (e) {
    if (required) throw e
    return null
  }
}

export async function vaultTransitEncrypt(plaintext) {
  const addr = process.env.VAULT_ADDR
  const token = process.env.VAULT_TOKEN
  if (!addr || !token) return null
  const b64 = Buffer.from(String(plaintext)).toString('base64')
  const res = await fetch(`${addr}/v1/transit/encrypt/shopflow-master`, {
    method: 'POST',
    headers: { 'X-Vault-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ plaintext: b64 }),
  })
  if (!res.ok) throw new Error(`Vault Transit encrypt failed: HTTP ${res.status}`)
  const json = await res.json()
  return json.data.ciphertext
}

export async function vaultTransitDecrypt(ciphertext) {
  const addr = process.env.VAULT_ADDR
  const token = process.env.VAULT_TOKEN
  if (!addr || !token) return null
  const res = await fetch(`${addr}/v1/transit/decrypt/shopflow-master`, {
    method: 'POST',
    headers: { 'X-Vault-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ciphertext }),
  })
  if (!res.ok) throw new Error(`Vault Transit decrypt failed: HTTP ${res.status}`)
  const json = await res.json()
  return Buffer.from(json.data.plaintext, 'base64').toString('utf8')
}

export function timingSafeEqualHex(a, b) {
  try {
    const ba = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ba.length !== bb.length) return false
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}
