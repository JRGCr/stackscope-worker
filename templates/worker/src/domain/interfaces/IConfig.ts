export interface IConfig {
  environment: 'development' | 'staging' | 'production';
  corsOrigins: string[];
  enableCorsWildcard: boolean;
  apiKey?: string;
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
}