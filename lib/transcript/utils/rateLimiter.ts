// Rate Limiter - Simple in-memory rate limiting for API endpoints

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
};

class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  /**
   * Check if request should be allowed
   * Returns { allowed: boolean, remaining: number, resetIn: number }
   */
  check(key: string): {
    allowed: boolean;
    remaining: number;
    resetIn: number;
  } {
    const now = Date.now();
    const entry = this.entries.get(key);

    // No existing entry or expired
    if (!entry || entry.resetAt <= now) {
      this.entries.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetIn: this.config.windowMs,
      };
    }

    // Existing entry - check limit
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.resetAt - now,
      };
    }

    // Increment and allow
    entry.count++;
    this.entries.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetIn: entry.resetAt - now,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (entry.resetAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Get current entry count (for monitoring)
   */
  getEntryCount(): number {
    return this.entries.size;
  }
}

// Singleton instances for different endpoints
const rateLimiters: Map<string, RateLimiter> = new Map();

/**
 * Get or create a rate limiter for an endpoint
 */
export function getRateLimiter(
  endpoint: string,
  config?: Partial<RateLimitConfig>
): RateLimiter {
  if (!rateLimiters.has(endpoint)) {
    rateLimiters.set(endpoint, new RateLimiter(config));
  }
  return rateLimiters.get(endpoint)!;
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(headers: Headers): string {
  // Try common headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Get first IP if there are multiple
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel-specific
  const vercelForwarded = headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) {
    return vercelForwarded.split(',')[0].trim();
  }

  // Fallback
  return 'unknown';
}

/**
 * Rate limit check result with headers
 */
export interface RateLimitResult {
  allowed: boolean;
  headers: Record<string, string>;
}

/**
 * Check rate limit and return result with appropriate headers
 */
export function checkRateLimit(
  endpoint: string,
  clientIp: string,
  config?: Partial<RateLimitConfig>
): RateLimitResult {
  const limiter = getRateLimiter(endpoint, config);
  const result = limiter.check(clientIp);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(config?.maxRequests || DEFAULT_CONFIG.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
  };

  if (!result.allowed) {
    headers['Retry-After'] = String(Math.ceil(result.resetIn / 1000));
  }

  return {
    allowed: result.allowed,
    headers,
  };
}
