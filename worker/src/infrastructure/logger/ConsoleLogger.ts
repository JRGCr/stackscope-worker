import { ILogger } from '../../domain/interfaces/ILogger';

export class ConsoleLogger implements ILogger {
  private environment: string;

  constructor(environment = 'development') {
    this.environment = environment;
  }

  debug(message: string, meta?: any): void {
    if (this.environment === 'development') {
      console.log(this.formatLog('debug', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    console.log(this.formatLog('info', message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatLog('warn', message, meta));
  }

  error(message: string, meta?: any): void {
    console.error(this.formatLog('error', message, meta));
  }

  private formatLog(level: string, message: string, meta?: any): string {
    const log = {
      ts: new Date().toISOString(),
      source: 'worker',
      level,
      msg: message
    };

    if (meta) {
      return JSON.stringify({ ...log, meta });
    }

    return JSON.stringify(log);
  }
}