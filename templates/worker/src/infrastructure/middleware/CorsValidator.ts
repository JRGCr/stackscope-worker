import { ICorsValidator } from '../../domain/interfaces/ICorsValidator';

export class CorsValidator implements ICorsValidator {
  private allowedOrigins: Set<string>;
  private enableWildcard: boolean;

  constructor(origins: string[], enableWildcard = false) {
    this.allowedOrigins = new Set(origins);
    this.enableWildcard = enableWildcard;
  }

  validateOrigin(origin: string | null): boolean {
    if (!origin) return false;
    if (this.enableWildcard) return true;
    
    // Check exact match
    if (this.allowedOrigins.has(origin)) return true;
    
    // Check localhost variants (development)
    if (this.isLocalhostOrigin(origin)) {
      return Array.from(this.allowedOrigins).some(allowed => 
        this.isLocalhostOrigin(allowed)
      );
    }
    
    return false;
  }

  getCorsHeaders(origin: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      'Access-Control-Max-Age': '86400',
    };

    if (origin && this.validateOrigin(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
  }

  getAllowedOrigins(): string[] {
    return Array.from(this.allowedOrigins);
  }

  isWildcardEnabled(): boolean {
    return this.enableWildcard;
  }

  private isLocalhostOrigin(origin: string): boolean {
    try {
      const url = new URL(origin);
      return url.hostname === 'localhost' || 
             url.hostname === '127.0.0.1' || 
             url.hostname === '[::1]';
    } catch {
      return false;
    }
  }
}