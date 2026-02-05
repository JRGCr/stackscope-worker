import { ILogProcessor } from '../../domain/interfaces/ILogProcessor';
import { IRequestHandler } from '../../domain/interfaces/IRequestHandler';
import { LogEntry } from '../../domain/types';

export class BrowserWebhookHandler implements IRequestHandler, ILogProcessor {
  canHandle(request: Request): boolean {
    const url = new URL(request.url);
    return request.method === 'POST' && url.pathname === '/webhook/browser';
  }

  async handle(request: Request): Promise<Response> {
    try {
      const validationResult = await this.validateRequest(request);
      if (!validationResult.isValid) {
        return this.createErrorResponse(400, 'Validation failed', validationResult.errors);
      }

      const body = await request.json();
      const logs = Array.isArray(body) ? body : [body];
      
      for (const log of logs) {
        const enrichedLog = this.enrichMetadata(log, request);
        await this.processLog(enrichedLog);
      }

      return this.createSuccessResponse({
        success: true,
        processed: logs.length,
        source: 'browser'
      });

    } catch (error) {
      console.error('Browser webhook processing error:', error);
      return this.createErrorResponse(500, 'Processing failed', [
        error instanceof Error ? error.message : 'Unknown error'
      ]);
    }
  }

  async processLog(logEntry: LogEntry): Promise<void> {
    // Ensure browser logs have the correct source
    const browserLog = {
      ...logEntry,
      source: 'browser'
    };
    console.log(JSON.stringify(browserLog));
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
      source: 'browser',
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

  private createSuccessResponse(data: any): Response {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
      }
    });
  }

  private createErrorResponse(status: number, message: string, details?: string[]): Response {
    return new Response(JSON.stringify({
      error: true,
      message,
      details,
      status
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}