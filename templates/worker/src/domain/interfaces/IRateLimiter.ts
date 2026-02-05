export interface IRateLimiter {
  checkLimit(identifier: string): Promise<boolean>;
  getRemainingRequests(identifier: string): Promise<number>;
  getResetTime(identifier: string): Promise<Date>;
}