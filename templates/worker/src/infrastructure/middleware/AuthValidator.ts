import { IAuthValidator } from '../../domain/interfaces/IAuthValidator';

export class AuthValidator implements IAuthValidator {
  private apiKey: string | null;
  private authEnabled: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
    this.authEnabled = !!apiKey;
  }

  async validateRequest(request: Request): Promise<boolean> {
    if (!this.authEnabled) return true;
    
    const providedKey = this.extractApiKey(request);
    if (!providedKey || !this.apiKey) return false;
    
    // Constant-time comparison to prevent timing attacks
    return this.secureCompare(providedKey, this.apiKey);
  }

  extractApiKey(request: Request): string | null {
    // Check header first
    const headerKey = request.headers.get('X-API-Key');
    if (headerKey) return headerKey;
    
    // Check query parameter as fallback
    const url = new URL(request.url);
    const queryKey = url.searchParams.get('apiKey');
    return queryKey;
  }

  isAuthEnabled(): boolean {
    return this.authEnabled;
  }

  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}