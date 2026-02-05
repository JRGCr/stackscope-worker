import { WorkerContainer, WorkerEnv } from './container/WorkerContainer';
import { Router } from './infrastructure/routing/Router';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    // Initialize dependency injection container with environment bindings
    const container = new WorkerContainer(env);
    container.registerWorkerHandlers();

    // Initialize router
    const router = new Router();

    // Register all handlers
    const handlers = container.getRequestHandlers();
    handlers.forEach(handler => router.addHandler(handler));

    // Route the request
    return router.route(request);
  }
};