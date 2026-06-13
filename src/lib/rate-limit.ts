import { NextResponse } from "next/server";

// Lightweight in-memory fixed-window rate limiter for sensitive API routes.
// Single-instance only — swap for Redis/Upstash in a horizontally-scaled deploy.

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, reset: now + windowMs };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, reset: bucket.reset };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, reset: bucket.reset };
}

export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

/**
 * Guard a route handler. Returns a 429 Response if over the limit, else null.
 *   const limited = enforceRateLimit(request, "checkout", 20, 60_000);
 *   if (limited) return limited;
 */
export function enforceRateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const { ok, reset } = rateLimit(`${scope}:${clientIp(request)}`, limit, windowMs);
  if (ok) return null;
  const retryAfter = Math.ceil((reset - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
