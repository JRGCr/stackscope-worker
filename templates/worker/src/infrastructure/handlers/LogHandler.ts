import { ILogProcessor } from '../../domain/interfaces/ILogProcessor';
import { IRequestHandler } from '../../domain/interfaces/IRequestHandler';
import { LogEntry } from '../../domain/types';

export class LogHandler implements IRequestHandler, ILogProcessor {
  canHandle(request: Request): boolean {
    const url = new URL(request.url);
    return request.method === 'POST' && url.pathname === '/logs';
  }

  async handle(request: Request): Promise<Response> {
    // DEPRECATION WARNING
    console.warn('[DEPRECATED] /logs endpoint is deprecated. Use /webhook/browser instead.');
    
    try {
      const validationResult = await this.validateRequest(request);
      if (!validationResult.isValid) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed', 
          details: validationResult.errors 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const logs = Array.isArray(body) ? body : [body];
      
      for (const log of logs) {
        const enrichedLog = this.enrichMetadata(log, request);
        await this.processLog(enrichedLog);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        processed: logs.length,
        warning: 'DEPRECATED: This endpoint (/logs) is deprecated. Please use /webhook/browser instead.'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
          'X-Deprecation-Warning': '/logs endpoint deprecated, use /webhook/browser'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Processing failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async processLog(logEntry: LogEntry): Promise<void> {
    console.log(JSON.stringify(logEntry));
  }

  async validateRequest(request: Request): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (request.headers.get('Content-Type') !== 'application/json') {
      errors.push('Content-Type must be application/json');
    }

    try {
      await request.clone().json();
    } catch {
      errors.push('Invalid JSON in request body');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  enrichMetadata(logEntry: LogEntry, request: Request): LogEntry {
    const cf = (request as any).cf || {};
    const rayId = request.headers.get('CF-Ray');
    
    return {
      ...logEntry,
      ts: logEntry.ts || new Date().toISOString(),
      meta: {
        ...logEntry.meta,
        rayId: rayId || undefined,
        userAgent: request.headers.get('User-Agent') || undefined,
        country: cf.country || undefined,
        city: cf.city || undefined,
        ip: request.headers.get('CF-Connecting-IP') || undefined
      }
    };
  }
}