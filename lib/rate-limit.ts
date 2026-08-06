// ponytail: in-memory rate limiter, upgrade to Vercel KV / Upstash if multi-instance
const hits = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of hits) {
    if (now > val.resetAt) hits.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Returns { success: true } if under limit, { success: false, retryAfter } if over.
 * @param key   unique identifier (e.g. IP + endpoint)
 * @param limit max requests in the window
 * @param windowMs window size in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: true } | { success: false; retryAfter: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  entry.count++;
  if (entry.count > limit) {
    return { success: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { success: true };
}

/**
 * Helper: extract client IP from request headers.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Returns a 429 NextResponse if rate limit exceeded, or null if OK.
 */
export function rateLimitResponse(
  req: Request,
  endpoint: string,
  limit: number,
  windowMs: number
) {
  const ip = getClientIp(req);
  const result = rateLimit(`${endpoint}:${ip}`, limit, windowMs);
  if (!result.success) {
    const { NextResponse } = require("next/server");
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfter) },
      }
    );
  }
  return null;
}
