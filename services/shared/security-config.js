const LAB_DEFAULT_HMAC = 'lab-hmac-secret-change-me'

export function isProductionEnv() {
  const env = (process.env.SHOPFLOW_ENV || 'lab').toLowerCase()
  return env === 'production' || env === 'prod'
}

export function validateSecurityConfig(serviceName) {
  const errors = []

  if (isProductionEnv()) {
    if (process.env.HMAC_DISABLED === 'true') {
      errors.push('HMAC_DISABLED=true is not allowed in production')
    }
    if (process.env.SSRF_DISABLED === 'true') {
      errors.push('SSRF_DISABLED=true is not allowed in production')
    }
    if (process.env.VAULT_REQUIRED !== 'true') {
      errors.push('VAULT_REQUIRED must be true in production')
    }
    if (!process.env.REDIS_URL) {
      errors.push('REDIS_URL is required in production')
    }
    if (!process.env.VAULT_TOKEN && !process.env.VAULT_APP_TOKEN) {
      errors.push('VAULT_APP_TOKEN is required in production')
    }
    if (process.env.HMAC_SECRET === LAB_DEFAULT_HMAC || !process.env.HMAC_SECRET) {
      errors.push('HMAC_SECRET must be set to a non-default value in production')
    }
  }

  if (errors.length) {
    throw new Error(`[${serviceName}] security config invalid: ${errors.join('; ')}`)
  }
}

export function assertNoBypassFlags(serviceName) {
  validateSecurityConfig(serviceName)
}
