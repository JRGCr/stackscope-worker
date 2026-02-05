import { describe, it, expect, beforeEach } from 'vitest';
import { WorkerContainer, WorkerEnv } from '../src/container/WorkerContainer';
import { ServiceToken, ServiceLifetime } from '../src/container/IDependencyContainer';

describe('WorkerContainer', () => {
  let container: WorkerContainer;

  beforeEach(() => {
    container = new WorkerContainer();
  });

  describe('register and resolve', () => {
    it('should register and resolve transient services', () => {
      let callCount = 0;
      const token: ServiceToken<number> = { name: 'Counter' };

      container.register(token, () => ++callCount);

      expect(container.resolve(token)).toBe(1);
      expect(container.resolve(token)).toBe(2);
      expect(container.resolve(token)).toBe(3);
    });

    it('should throw when resolving unregistered service', () => {
      const token: ServiceToken<string> = { name: 'Unknown' };

      expect(() => container.resolve(token)).toThrow('Service not registered: Unknown');
    });
  });

  describe('registerSingleton', () => {
    it('should return same instance for singleton services', () => {
      let callCount = 0;
      const token: ServiceToken<{ id: number }> = { name: 'Singleton' };

      container.registerSingleton(token, () => ({ id: ++callCount }));

      const first = container.resolve(token);
      const second = container.resolve(token);
      const third = container.resolve(token);

      expect(first).toBe(second);
      expect(second).toBe(third);
      expect(first.id).toBe(1);
    });
  });

  describe('registerInstance', () => {
    it('should return the exact instance provided', () => {
      const instance = { value: 'test' };
      const token: ServiceToken<typeof instance> = { name: 'Instance' };

      container.registerInstance(token, instance);

      expect(container.resolve(token)).toBe(instance);
    });
  });

  describe('isRegistered', () => {
    it('should return true for registered services', () => {
      const token: ServiceToken<string> = { name: 'Test' };
      container.register(token, () => 'value');

      expect(container.isRegistered(token)).toBe(true);
    });

    it('should return false for unregistered services', () => {
      const token: ServiceToken<string> = { name: 'Unknown' };

      expect(container.isRegistered(token)).toBe(false);
    });
  });

  describe('createScope', () => {
    it('should share singletons with parent container', () => {
      const token: ServiceToken<{ id: number }> = { name: 'Singleton' };
      let callCount = 0;

      container.registerSingleton(token, () => ({ id: ++callCount }));
      const parentInstance = container.resolve(token);

      const scopedContainer = container.createScope();
      const scopedInstance = scopedContainer.resolve(token);

      expect(scopedInstance).toBe(parentInstance);
    });

    it('should isolate transient instances in scoped container', () => {
      const token: ServiceToken<{ id: number }> = { name: 'Transient' };
      let callCount = 0;

      container.register(token, () => ({ id: ++callCount }));

      // Get instance from parent
      const parentInstance = container.resolve(token);
      expect(parentInstance.id).toBe(1);

      // Create scoped container and get instance
      const scopedContainer = container.createScope();
      const scopedInstance = scopedContainer.resolve(token);

      // Scoped instance is separate from parent
      expect(scopedInstance.id).toBe(2);
      expect(scopedInstance).not.toBe(parentInstance);
    });
  });

  describe('constructor with env', () => {
    it('should accept environment bindings', () => {
      const env: WorkerEnv = { GITHUB_WEBHOOK_SECRET: 'test-secret' };
      const containerWithEnv = new WorkerContainer(env);

      // Container should be created without errors
      expect(containerWithEnv).toBeInstanceOf(WorkerContainer);
    });
  });

  describe('registerWorkerHandlers', () => {
    it('should register all handler types', () => {
      container.registerWorkerHandlers();

      expect(container.isRegistered({ name: 'HandlerFactory' })).toBe(true);
      expect(container.isRegistered({ name: 'HealthHandler' })).toBe(true);
      expect(container.isRegistered({ name: 'LogHandler' })).toBe(true);
      expect(container.isRegistered({ name: 'SdkHandler' })).toBe(true);
      expect(container.isRegistered({ name: 'GitHubWebhookHandler' })).toBe(true);
      expect(container.isRegistered({ name: 'BrowserWebhookHandler' })).toBe(true);
    });

    it('should return all handlers via getRequestHandlers', () => {
      container.registerWorkerHandlers();
      const handlers = container.getRequestHandlers();

      expect(handlers.length).toBe(5);
      handlers.forEach(handler => {
        expect(handler).toHaveProperty('canHandle');
        expect(handler).toHaveProperty('handle');
      });
    });
  });
});
