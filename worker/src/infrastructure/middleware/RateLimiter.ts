import { IRateLimiter } from '../../domain/interfaces/IRateLimiter';

interface RateLimitEntry {
  count: number;
  resetTime: Date;
}

export class InMemoryRateLimiter implements IRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Clean up old entries periodically
    setInterval(() => this.cleanup(), this.windowMs);
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = new Date();
    const entry = this.limits.get(identifier);

    if (!entry || entry.resetTime < now) {
      // Create new entry
      this.limits.set(identifier, {
        count: 1,
        resetTime: new Date(now.getTime() + this.windowMs)
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  async getRemainingRequests(identifier: string): Promise<number> {
    const entry = this.limits.get(identifier);
    if (!entry || entry.resetTime < new Date()) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  async getResetTime(identifier: string): Promise<Date> {
    const entry = this.limits.get(identifier);
    if (!entry || entry.resetTime < new Date()) {
      return new Date(Date.now() + this.windowMs);
    }
    return entry.resetTime;
  }

  private cleanup(): void {
    const now = new Date();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetTime < now) {
        this.limits.delete(key);
      }
    }
  }
}