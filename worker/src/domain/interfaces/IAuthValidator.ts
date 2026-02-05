export interface IAuthValidator {
  validateRequest(request: Request): Promise<boolean>;
  extractApiKey(request: Request): string | null;
  isAuthEnabled(): boolean;
}