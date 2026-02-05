import { IHealthChecker, HealthStatus, HealthCheck } from '../../domain/interfaces/IHealthChecker';
import { IRequestHandler } from '../../domain/interfaces/IRequestHandler';

export class HealthHandler implements IRequestHandler, IHealthChecker {
  private readonly version = '1.0.0';
  private readonly startTime = Date.now();

  canHandle(request: Request): boolean {
    const url = new URL(request.url);
    return request.method === 'GET' && url.pathname === '/health';
  }

  async handle(request: Request): Promise<Response> {
    const health = await this.checkHealth();
    return new Response(JSON.stringify(health), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    });
  }

  async checkHealth(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [
      {
        name: 'worker',
        status: 'pass',
        message: 'Worker is running'
      }
    ];

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: Date.now() - this.startTime,
      checks
    };
  }

  getVersion(): string {
    return this.version;
  }
}