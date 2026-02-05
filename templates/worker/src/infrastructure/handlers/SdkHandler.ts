import { ISdkProvider, SdkConfig } from '../../domain/interfaces/ISdkProvider';
import { IRequestHandler } from '../../domain/interfaces/IRequestHandler';

export class SdkHandler implements IRequestHandler, ISdkProvider {
  private readonly sdkContent = `
// StackScope Browser SDK
(function() {
  'use strict';
  
  // SDK Configuration
  const config = {
    endpoint: 'https://your-worker.workers.dev/webhook/browser',
    batchSize: 10,
    batchInterval: 2000,
    maxRetries: 3,
    retryDelay: 1000
  };
  
  // Session Management
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  let logQueue = [];
  let retryQueue = [];
  
  // Core logging function
  function log(level, message, metadata = {}) {
    const entry = {
      ts: new Date().toISOString(),
      source: 'browser',
      level: level,
      msg: message,
      meta: {
        sessionId: sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...metadata
      }
    };
    
    logQueue.push(entry);
    
    if (logQueue.length >= config.batchSize) {
      sendLogs();
    }
  }
  
  // Send logs to worker
  async function sendLogs() {
    if (logQueue.length === 0) return;
    
    const batch = logQueue.splice(0, config.batchSize);
    
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batch)
      });
      
      if (!response.ok) {
        retryQueue.push(...batch);
      }
    } catch (error) {
      retryQueue.push(...batch);
    }
  }
  
  // Batch sending interval
  setInterval(sendLogs, config.batchInterval);
  
  // Retry mechanism
  setInterval(() => {
    if (retryQueue.length > 0) {
      logQueue.unshift(...retryQueue.splice(0, config.batchSize));
    }
  }, config.retryDelay);
  
  // Public API
  window.stackscope = {
    log: (message, metadata) => log('info', message, metadata),
    debug: (message, metadata) => log('debug', message, metadata),
    warn: (message, metadata) => log('warn', message, metadata),
    error: (message, metadata) => log('error', message, metadata),
    setEndpoint: (endpoint) => { config.endpoint = endpoint; }
  };
  
  // Auto-capture console errors and warnings only
  const originalConsole = {
    warn: console.warn,
    error: console.error
  };
  
  console.warn = (...args) => {
    originalConsole.warn.apply(console, args);
    log('warn', args.join(' '), { type: 'console' });
  };
  
  console.error = (...args) => {
    originalConsole.error.apply(console, args);
    log('error', args.join(' '), { type: 'console' });
  };
  
  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    log('error', event.message, {
      type: 'error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    log('error', 'Unhandled promise rejection: ' + event.reason, {
      type: 'promise-rejection',
      stack: event.reason?.stack
    });
  });
  
})();
`;

  canHandle(request: Request): boolean {
    const url = new URL(request.url);
    return request.method === 'GET' && url.pathname === '/sdk';
  }

  async handle(request: Request): Promise<Response> {
    return this.serveSdk(request);
  }

  async serveSdk(request: Request): Promise<Response> {
    const content = await this.getSdkContent();
    return new Response(content, {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  async getSdkContent(): Promise<string> {
    return this.sdkContent;
  }
}