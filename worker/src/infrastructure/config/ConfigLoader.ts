import { IConfig } from '../../domain/interfaces/IConfig';

export class ConfigLoader {
  static load(env: any): IConfig {
    const environment = (env.ENVIRONMENT || 'development') as IConfig['environment'];
    
    // Default configurations per environment
    const defaults: Record<IConfig['environment'], Partial<IConfig>> = {
      development: {
        corsOrigins: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:8080',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:8080'
        ],
        enableCorsWildcard: false,
        rateLimitMaxRequests: 1000,
        rateLimitWindowMs: 60000
      },
      staging: {
        corsOrigins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : [],
        enableCorsWildcard: false,
        rateLimitMaxRequests: 500,
        rateLimitWindowMs: 60000
      },
      production: {
        corsOrigins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : [],
        enableCorsWildcard: false,
        rateLimitMaxRequests: 100,
        rateLimitWindowMs: 60000
      }
    };

    const defaultConfig = defaults[environment];
    
    return {
      environment,
      corsOrigins: env.CORS_ORIGINS ? 
        env.CORS_ORIGINS.split(',').map((o: string) => o.trim()) : 
        defaultConfig.corsOrigins || [],
      enableCorsWildcard: env.CORS_WILDCARD === 'true' || 
        defaultConfig.enableCorsWildcard || false,
      apiKey: env.API_KEY,
      rateLimitMaxRequests: env.RATE_LIMIT_MAX ? 
        parseInt(env.RATE_LIMIT_MAX) : 
        defaultConfig.rateLimitMaxRequests || 100,
      rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS ? 
        parseInt(env.RATE_LIMIT_WINDOW_MS) : 
        defaultConfig.rateLimitWindowMs || 60000
    };
  }
}