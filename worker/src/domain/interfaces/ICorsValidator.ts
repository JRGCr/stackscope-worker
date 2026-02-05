export interface ICorsValidator {
  validateOrigin(origin: string | null): boolean;
  getCorsHeaders(origin: string | null): Record<string, string>;
  getAllowedOrigins(): string[];
  isWildcardEnabled(): boolean;
}