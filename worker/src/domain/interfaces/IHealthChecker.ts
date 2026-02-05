export interface IHealthChecker {
  checkHealth(): Promise<HealthStatus>;
  getVersion(): string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime?: number;
  checks?: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
}