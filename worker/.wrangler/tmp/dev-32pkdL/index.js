var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// .wrangler/tmp/bundle-vIyTUK/checked-fetch.js
var require_checked_fetch = __commonJS({
  ".wrangler/tmp/bundle-vIyTUK/checked-fetch.js"() {
    "use strict";
    var urls = /* @__PURE__ */ new Set();
    function checkURL(request, init) {
      const url = request instanceof URL ? request : new URL(
        (typeof request === "string" ? new Request(request, init) : request).url
      );
      if (url.port && url.port !== "443" && url.protocol === "https:") {
        if (!urls.has(url.toString())) {
          urls.add(url.toString());
          console.warn(
            `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
          );
        }
      }
    }
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// .wrangler/tmp/bundle-vIyTUK/middleware-loader.entry.ts
var import_checked_fetch13 = __toESM(require_checked_fetch());

// wrangler-modules-watch:wrangler:modules-watch
var import_checked_fetch = __toESM(require_checked_fetch());

// .wrangler/tmp/bundle-vIyTUK/middleware-insertion-facade.js
var import_checked_fetch11 = __toESM(require_checked_fetch());

// src/index.ts
var import_checked_fetch8 = __toESM(require_checked_fetch());

// src/container/WorkerContainer.ts
var import_checked_fetch6 = __toESM(require_checked_fetch());

// ../src/container/IDependencyContainer.ts
var import_checked_fetch2 = __toESM(require_checked_fetch());

// src/infrastructure/handlers/HealthHandler.ts
var import_checked_fetch3 = __toESM(require_checked_fetch());
var HealthHandler = class {
  static {
    __name(this, "HealthHandler");
  }
  version = "1.0.0";
  startTime = Date.now();
  canHandle(request) {
    const url = new URL(request.url);
    return request.method === "GET" && url.pathname === "/health";
  }
  async handle(request) {
    const health = await this.checkHealth();
    return new Response(JSON.stringify(health), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }
  async checkHealth() {
    const checks = [
      {
        name: "worker",
        status: "pass",
        message: "Worker is running"
      }
    ];
    return {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: this.version,
      uptime: Date.now() - this.startTime,
      checks
    };
  }
  getVersion() {
    return this.version;
  }
};

// src/infrastructure/handlers/LogHandler.ts
var import_checked_fetch4 = __toESM(require_checked_fetch());
var LogHandler = class {
  static {
    __name(this, "LogHandler");
  }
  canHandle(request) {
    const url = new URL(request.url);
    return request.method === "POST" && url.pathname === "/logs";
  }
  async handle(request) {
    try {
      const validationResult = await this.validateRequest(request);
      if (!validationResult.isValid) {
        return new Response(JSON.stringify({
          error: "Validation failed",
          details: validationResult.errors
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      const body = await request.json();
      const logs = Array.isArray(body) ? body : [body];
      for (const log of logs) {
        const enrichedLog = this.enrichMetadata(log, request);
        await this.processLog(enrichedLog);
      }
      return new Response(JSON.stringify({ success: true, processed: logs.length }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "Processing failed",
        message: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  async processLog(logEntry) {
    console.log(JSON.stringify(logEntry));
  }
  async validateRequest(request) {
    const errors = [];
    if (request.headers.get("Content-Type") !== "application/json") {
      errors.push("Content-Type must be application/json");
    }
    try {
      await request.clone().json();
    } catch {
      errors.push("Invalid JSON in request body");
    }
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : void 0
    };
  }
  enrichMetadata(logEntry, request) {
    const cf = request.cf || {};
    const rayId = request.headers.get("CF-Ray");
    return {
      ...logEntry,
      ts: logEntry.ts || (/* @__PURE__ */ new Date()).toISOString(),
      meta: {
        ...logEntry.meta,
        rayId: rayId || void 0,
        userAgent: request.headers.get("User-Agent") || void 0,
        country: cf.country || void 0,
        city: cf.city || void 0,
        ip: request.headers.get("CF-Connecting-IP") || void 0
      }
    };
  }
};

// src/infrastructure/handlers/SdkHandler.ts
var import_checked_fetch5 = __toESM(require_checked_fetch());
var SdkHandler = class {
  static {
    __name(this, "SdkHandler");
  }
  sdkContent = `
// StackScope Browser SDK
(function() {
  'use strict';
  
  // SDK Configuration
  const config = {
    endpoint: 'https://your-worker.workers.dev/logs',
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
  
  // Auto-capture console logs
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };
  
  console.log = (...args) => {
    originalConsole.log.apply(console, args);
    log('info', args.join(' '), { type: 'console' });
  };
  
  console.warn = (...args) => {
    originalConsole.warn.apply(console, args);
    log('warn', args.join(' '), { type: 'console' });
  };
  
  console.error = (...args) => {
    originalConsole.error.apply(console, args);
    log('error', args.join(' '), { type: 'console' });
  };
  
  console.debug = (...args) => {
    originalConsole.debug.apply(console, args);
    log('debug', args.join(' '), { type: 'console' });
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
  canHandle(request) {
    const url = new URL(request.url);
    return request.method === "GET" && url.pathname === "/sdk";
  }
  async handle(request) {
    return this.serveSdk(request);
  }
  async serveSdk(request) {
    const content = await this.getSdkContent();
    return new Response(content, {
      headers: {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "public, max-age=3600"
      }
    });
  }
  async getSdkContent() {
    return this.sdkContent;
  }
};

// src/container/WorkerContainer.ts
var WorkerContainer = class _WorkerContainer {
  static {
    __name(this, "WorkerContainer");
  }
  services = /* @__PURE__ */ new Map();
  instances = /* @__PURE__ */ new Map();
  register(token, factory) {
    this.services.set(token.name, {
      token,
      factory,
      lifetime: "transient" /* TRANSIENT */
    });
  }
  registerSingleton(token, factory) {
    this.services.set(token.name, {
      token,
      factory,
      lifetime: "singleton" /* SINGLETON */
    });
  }
  registerInstance(token, instance) {
    this.instances.set(token.name, instance);
    this.services.set(token.name, {
      token,
      factory: /* @__PURE__ */ __name(() => instance, "factory"),
      lifetime: "singleton" /* SINGLETON */,
      instance
    });
  }
  resolve(token) {
    const descriptor = this.services.get(token.name);
    if (!descriptor) {
      throw new Error(`Service not registered: ${token.name}`);
    }
    if (descriptor.lifetime === "singleton" /* SINGLETON */) {
      if (!descriptor.instance) {
        descriptor.instance = descriptor.factory(this);
      }
      return descriptor.instance;
    }
    return descriptor.factory(this);
  }
  isRegistered(token) {
    return this.services.has(token.name);
  }
  createScope() {
    const scopedContainer = new _WorkerContainer();
    for (const [key, descriptor] of this.services) {
      if (descriptor.lifetime === "singleton" /* SINGLETON */) {
        scopedContainer.services.set(key, descriptor);
      } else {
        scopedContainer.services.set(key, {
          ...descriptor,
          lifetime: "scoped" /* SCOPED */
        });
      }
    }
    return scopedContainer;
  }
  registerWorkerHandlers() {
    this.registerSingleton(
      { name: "HealthHandler", type: "HealthHandler" },
      () => new HealthHandler()
    );
    this.registerSingleton(
      { name: "LogHandler", type: "LogHandler" },
      () => new LogHandler()
    );
    this.registerSingleton(
      { name: "SdkHandler", type: "SdkHandler" },
      () => new SdkHandler()
    );
  }
  getRequestHandlers() {
    return [
      this.resolve({ name: "HealthHandler", type: "HealthHandler" }),
      this.resolve({ name: "LogHandler", type: "LogHandler" }),
      this.resolve({ name: "SdkHandler", type: "SdkHandler" })
    ];
  }
};

// src/application/Router.ts
var import_checked_fetch7 = __toESM(require_checked_fetch());
var Router = class {
  static {
    __name(this, "Router");
  }
  handlers = [];
  addHandler(handler) {
    this.handlers.push(handler);
  }
  async route(request) {
    if (request.method === "OPTIONS") {
      return this.createCorsResponse();
    }
    for (const handler of this.handlers) {
      if (handler.canHandle(request)) {
        try {
          return await handler.handle(request);
        } catch (error) {
          return this.createErrorResponse(error);
        }
      }
    }
    return this.createNotFoundResponse();
  }
  createCorsResponse() {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  createErrorResponse(error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  createNotFoundResponse() {
    return new Response(JSON.stringify({
      error: "Not Found",
      message: "Endpoint not found"
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// src/index.ts
var src_default = {
  async fetch(request) {
    const container = new WorkerContainer();
    container.registerWorkerHandlers();
    const router = new Router();
    const handlers = container.getRequestHandlers();
    handlers.forEach((handler) => router.addHandler(handler));
    return router.route(request);
  }
};

// ../../../.npm-global/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var import_checked_fetch9 = __toESM(require_checked_fetch());
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../.npm-global/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
var import_checked_fetch10 = __toESM(require_checked_fetch());
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-vIyTUK/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../.npm-global/lib/node_modules/wrangler/templates/middleware/common.ts
var import_checked_fetch12 = __toESM(require_checked_fetch());
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-vIyTUK/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
