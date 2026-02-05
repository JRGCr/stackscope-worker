import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '../src/infrastructure/routing/Router';
import { IRequestHandler } from '../src/domain/interfaces/IRequestHandler';

describe('Router', () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  const createMockHandler = (canHandle: boolean, response?: Response): IRequestHandler => ({
    canHandle: vi.fn().mockReturnValue(canHandle),
    handle: vi.fn().mockResolvedValue(response || new Response('OK'))
  });

  describe('route', () => {
    it('should handle CORS preflight requests', async () => {
      const request = new Request('https://example.com', { method: 'OPTIONS' });
      const response = await router.route(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should route to matching handler', async () => {
      const mockHandler = createMockHandler(true, new Response('Handler Response'));
      router.addHandler(mockHandler);

      const request = new Request('https://example.com/test');
      const response = await router.route(request);

      expect(mockHandler.canHandle).toHaveBeenCalledWith(request);
      expect(mockHandler.handle).toHaveBeenCalledWith(request);
      expect(await response.text()).toBe('Handler Response');
    });

    it('should return 404 when no handler matches', async () => {
      const mockHandler = createMockHandler(false);
      router.addHandler(mockHandler);

      const request = new Request('https://example.com/unknown');
      const response = await router.route(request);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Not Found');
    });

    it('should try handlers in order until one matches', async () => {
      const handler1 = createMockHandler(false);
      const handler2 = createMockHandler(true, new Response('Handler 2'));
      const handler3 = createMockHandler(true, new Response('Handler 3'));

      router.addHandler(handler1);
      router.addHandler(handler2);
      router.addHandler(handler3);

      const request = new Request('https://example.com/test');
      const response = await router.route(request);

      expect(handler1.canHandle).toHaveBeenCalled();
      expect(handler2.canHandle).toHaveBeenCalled();
      expect(handler3.canHandle).not.toHaveBeenCalled();
      expect(await response.text()).toBe('Handler 2');
    });

    it('should return 500 when handler throws', async () => {
      const mockHandler: IRequestHandler = {
        canHandle: vi.fn().mockReturnValue(true),
        handle: vi.fn().mockRejectedValue(new Error('Handler error'))
      };
      router.addHandler(mockHandler);

      const request = new Request('https://example.com/test');
      const response = await router.route(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Handler error');
    });
  });

  describe('addHandler', () => {
    it('should add handlers to the router', () => {
      const handler1 = createMockHandler(false);
      const handler2 = createMockHandler(false);

      router.addHandler(handler1);
      router.addHandler(handler2);

      // Verify both handlers are checked
      const request = new Request('https://example.com/test');
      router.route(request);

      expect(handler1.canHandle).toHaveBeenCalled();
      expect(handler2.canHandle).toHaveBeenCalled();
    });
  });
});
