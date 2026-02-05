import { IRequestHandler } from '../../domain/interfaces/IRequestHandler';

export interface IRouter {
  route(request: Request): Promise<Response>;
  addHandler(handler: IRequestHandler): void;
}

export class Router implements IRouter {
  private handlers: IRequestHandler[] = [];

  addHandler(handler: IRequestHandler): void {
    this.handlers.push(handler);
  }

  async route(request: Request): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return this.createCorsResponse();
    }

    // Find appropriate handler
    for (const handler of this.handlers) {
      if (handler.canHandle(request)) {
        try {
          return await handler.handle(request);
        } catch (error) {
          return this.createErrorResponse(error);
        }
      }
    }

    // No handler found
    return this.createNotFoundResponse();
  }

  private createCorsResponse(): Response {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  private createErrorResponse(error: unknown): Response {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private createNotFoundResponse(): Response {
    return new Response(JSON.stringify({ 
      error: 'Not Found', 
      message: 'Endpoint not found' 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}