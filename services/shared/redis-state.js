import crypto from 'crypto'
import { createClient } from 'redis'

let redisClient = null
let connectPromise = null
let warnedMemoryFallback = false

const memorySets = new Map()
const memoryCounters = new Map()

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function warnMemoryFallback() {
  if (warnedMemoryFallback) return
  warnedMemoryFallback = true
  console.warn(
    JSON.stringify({
      event: 'redis_fallback_memory',
      message: 'REDIS_URL not set; using in-memory state (not safe for multi-instance production)',
    }),
  )
}

export async function getRedisClient() {
  const url = process.env.REDIS_URL
  if (!url) {
    // Trong production: REDIS_URL là bắt buộc — in-memory Map không an toàn cho multi-instance.
    // Replay protection hoàn toàn mất tác dụng nếu nhiều instance chạy song song.
    if (process.env.SHOPFLOW_ENV === 'production') {
      throw new Error('REDIS_URL is required in production — in-memory fallback disabled')
    }
    warnMemoryFallback()
    return null
  }
  if (redisClient?.isOpen) return redisClient
  if (!connectPromise) {
    redisClient = createClient({ url })
    redisClient.on('error', (err) => {
      console.error(JSON.stringify({ event: 'redis_error', message: err.message }))
    })
    connectPromise = redisClient.connect().then(() => redisClient)
  }
  try {
    return await connectPromise
  } catch {
    connectPromise = null  // reset để request tiếp theo có thể retry
    if (process.env.SHOPFLOW_ENV === 'production') {
      throw new Error('Redis connection failed — required in production')
    }
    warnMemoryFallback()
    return null  // fall back to in-memory in non-production
  }
}

export async function redisPing() {
  const client = await getRedisClient()
  if (!client) return { ok: true, mode: 'memory' }
  const pong = await client.ping()
  return { ok: pong === 'PONG', mode: 'redis' }
}

export async function isMarked(key) {
  const client = await getRedisClient()
  if (client) {
    return (await client.exists(key)) === 1
  }
  const entry = memorySets.get(key)
  if (!entry) return false
  return Date.now() - entry.at < (entry.ttl || 300) * 1000
}

/** Returns true if key already existed (replay). */
export async function markOnce(key, ttlSeconds) {
  const client = await getRedisClient()
  if (client) {
    const result = await client.set(key, '1', { NX: true, EX: ttlSeconds })
    return result === null
  }

  const now = Date.now()
  const entry = memorySets.get(key)
  if (entry && now - entry.at < ttlSeconds * 1000) return true
  memorySets.set(key, { at: now, ttl: ttlSeconds })
  return false
}

export async function markUsed(key, ttlSeconds) {
  const client = await getRedisClient()
  if (client) {
    await client.set(key, '1', { EX: ttlSeconds })
    return
  }
  memorySets.set(key, { at: Date.now(), ttl: ttlSeconds })
}

export async function incrementWindow(key, windowSeconds, limit) {
  const client = await getRedisClient()
  if (client) {
    // Pipeline atomic: nếu INCR thành công mà EXPIRE chưa chạy (crash), key sẽ không expire.
    // Multi/exec đảm bảo cả hai lệnh gửi trong một round trip và được thực thi liên tiếp.
    const [count] = await client.multi().incr(key).expire(key, windowSeconds).exec()
    return { count, limited: count > limit }
  }

  const now = Date.now()
  let bucket = memoryCounters.get(key)
  if (!bucket || now - bucket.start >= windowSeconds * 1000) {
    bucket = { start: now, count: 0 }
    memoryCounters.set(key, bucket)
  }
  bucket.count += 1
  return { count: bucket.count, limited: bucket.count > limit }
}

export function refreshTokenKey(token) {
  return `shopflow:refresh:used:${sha256(token)}`
}

export function nonceKey(nonce) {
  return `shopflow:webhook:nonce:${nonce}`
}

export function tenantRateKey(tenantId, windowMinute) {
  return `shopflow:tenant:rpm:${tenantId}:${windowMinute}`
}
