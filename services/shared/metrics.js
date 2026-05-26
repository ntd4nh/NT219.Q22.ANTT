import client from 'prom-client'

const register = new client.Registry()
client.collectDefaultMetrics({ register, prefix: 'shopflow_' })

const legacyCounters = {
  shopflow_auth_failures_total: new client.Counter({
    name: 'shopflow_auth_failures_total',
    help: 'Authentication failures',
    registers: [register],
  }),
  shopflow_bola_blocked_total: new client.Counter({
    name: 'shopflow_bola_blocked_total',
    help: 'BOLA cross-tenant blocks',
    registers: [register],
  }),
  shopflow_token_replay_total: new client.Counter({
    name: 'shopflow_token_replay_total',
    help: 'Refresh token replay detections',
    registers: [register],
  }),
  shopflow_webhook_rejected_total: new client.Counter({
    name: 'shopflow_webhook_rejected_total',
    help: 'Rejected webhooks',
    registers: [register],
  }),
  shopflow_ssrf_blocked_total: new client.Counter({
    name: 'shopflow_ssrf_blocked_total',
    help: 'SSRF blocks',
    registers: [register],
  }),
  shopflow_rate_limited_total: new client.Counter({
    name: 'shopflow_rate_limited_total',
    help: 'Tenant rate limit hits',
    registers: [register],
  }),
  shopflow_opa_denied_total: new client.Counter({
    name: 'shopflow_opa_denied_total',
    help: 'OPA policy denials',
    labelNames: ['reason_code'],
    registers: [register],
  }),
  shopflow_http_requests_total: new client.Counter({
    name: 'shopflow_http_requests_total',
    help: 'HTTP requests served',
    labelNames: ['service', 'method', 'route', 'status_code'],
    registers: [register],
  }),
}

const dynamicCounters = {}

export const httpRequestDuration = new client.Histogram({
  name: 'shopflow_http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['service', 'method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
})

export function incMetric(name, labels = {}) {
  if (name === 'shopflow_opa_denied_total' && labels.reason_code) {
    legacyCounters.shopflow_opa_denied_total.inc({ reason_code: labels.reason_code })
    return
  }
  if (legacyCounters[name]) {
    legacyCounters[name].inc()
    return
  }
  if (name.startsWith('shopflow_auth_failures_') && name.endsWith('_total')) {
    legacyCounters.shopflow_auth_failures_total.inc()
    if (!dynamicCounters[name]) {
      dynamicCounters[name] = new client.Counter({
        name,
        help: `Auth failure reason ${name}`,
        registers: [register],
      })
    }
    dynamicCounters[name].inc()
    return
  }
  if (!dynamicCounters[name]) {
    dynamicCounters[name] = new client.Counter({
      name,
      help: name,
      registers: [register],
    })
  }
  dynamicCounters[name].inc()
}

export function metricsMiddleware(serviceName) {
  return (req, res, next) => {
    const end = httpRequestDuration.startTimer({
      service: serviceName,
      method: req.method,
      route: req.route?.path || req.path,
    })
    res.on('finish', () => {
      const labels = {
        service: serviceName,
        method: req.method,
        route: req.route?.path || req.path,
        status_code: String(res.statusCode),
      }
      end(labels)
      legacyCounters.shopflow_http_requests_total.inc(labels)
    })
    next()
  }
}

export async function metricsHandler(_req, res) {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
}
