var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-LydMnk/checked-fetch.js
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

// .wrangler/tmp/bundle-LydMnk/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/infrastructure/config/ConfigLoader.ts
var ConfigLoader = class {
  static load(env) {
    const environment = env.ENVIRONMENT || "development";
    const defaults = {
      development: {
        corsOrigins: [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:8080",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
          "http://127.0.0.1:8080"
        ],
        enableCorsWildcard: false,
        rateLimitMaxRequests: 1e3,
        rateLimitWindowMs: 6e4
      },
      staging: {
        corsOrigins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",") : [],
        enableCorsWildcard: false,
        rateLimitMaxRequests: 500,
        rateLimitWindowMs: 6e4
      },
      production: {
        corsOrigins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",") : [],
        enableCorsWildcard: false,
        rateLimitMaxRequests: 100,
        rateLimitWindowMs: 6e4
      }
    };
    const defaultConfig = defaults[environment];
    return {
      environment,
      corsOrigins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",").map((o) => o.trim()) : defaultConfig.corsOrigins || [],
      enableCorsWildcard: env.CORS_WILDCARD === "true" || defaultConfig.enableCorsWildcard || false,
      apiKey: env.API_KEY,
      rateLimitMaxRequests: env.RATE_LIMIT_MAX ? parseInt(env.RATE_LIMIT_MAX) : defaultConfig.rateLimitMaxRequests || 100,
      rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS ? parseInt(env.RATE_LIMIT_WINDOW_MS) : defaultConfig.rateLimitWindowMs || 6e4
    };
  }
};
__name(ConfigLoader, "ConfigLoader");

// src/infrastructure/logger/ConsoleLogger.ts
var ConsoleLogger = class {
  environment;
  constructor(environment = "development") {
    this.environment = environment;
  }
  debug(message, meta) {
    if (this.environment === "development") {
      console.log(this.formatLog("debug", message, meta));
    }
  }
  info(message, meta) {
    console.log(this.formatLog("info", message, meta));
  }
  warn(message, meta) {
    console.warn(this.formatLog("warn", message, meta));
  }
  error(message, meta) {
    console.error(this.formatLog("error", message, meta));
  }
  formatLog(level, message, meta) {
    const log = {
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      source: "worker",
      level,
      msg: message
    };
    if (meta) {
      return JSON.stringify({ ...log, meta });
    }
    return JSON.stringify(log);
  }
};
__name(ConsoleLogger, "ConsoleLogger");

// src/infrastructure/handlers/HealthHandler.ts
var HealthHandler = class {
  config;
  version;
  constructor(config, version = "1.0.0") {
    this.config = config;
    this.version = version;
  }
  async checkHealth() {
    return {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: this.config.environment,
      version: this.version
    };
  }
};
__name(HealthHandler, "HealthHandler");

// src/infrastructure/handlers/LogHandler.ts
var LogHandler = class {
  logger;
  constructor(logger) {
    this.logger = logger;
  }
  async processLogs(logs, request) {
    if (!Array.isArray(logs)) {
      throw new Error("Logs must be an array");
    }
    const processedLogs = [];
    for (const log of logs) {
      if (!this.validateLogEntry(log)) {
        this.logger.warn("Invalid log entry", { log });
        continue;
      }
      const entry = {
        ts: log.ts || (/* @__PURE__ */ new Date()).toISOString(),
        source: "browser",
        level: log.level || "info",
        msg: log.msg || log.message || "",
        meta: log.meta || {}
      };
      const enrichedEntry = this.enrichWithMetadata(entry, request);
      processedLogs.push(enrichedEntry);
      this.logger.info(JSON.stringify(enrichedEntry));
    }
    return processedLogs;
  }
  validateLogEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return false;
    }
    if (!entry.msg && !entry.message) {
      return false;
    }
    if (entry.level) {
      const validLevels = ["debug", "info", "warn", "error"];
      if (!validLevels.includes(entry.level)) {
        return false;
      }
    }
    return true;
  }
  enrichWithMetadata(entry, request) {
    const enrichedMeta = {
      ...entry.meta,
      rayId: request.headers.get("CF-Ray") || void 0,
      origin: request.headers.get("Origin") || void 0,
      userAgent: request.headers.get("User-Agent") || void 0,
      ip: request.headers.get("CF-Connecting-IP") || void 0
    };
    Object.keys(enrichedMeta).forEach((key) => {
      if (enrichedMeta[key] === void 0) {
        delete enrichedMeta[key];
      }
    });
    return {
      ...entry,
      meta: enrichedMeta
    };
  }
};
__name(LogHandler, "LogHandler");

// src/infrastructure/handlers/SdkHandler.ts
var SdkHandler = class {
  sdkContent;
  version;
  constructor() {
    this.version = "1.0.0";
    this.sdkContent = this.getPlaceholderSdk();
  }
  async getSdkContent() {
    return this.sdkContent;
  }
  getSdkVersion() {
    return this.version;
  }
  getContentType() {
    return "application/javascript";
  }
  getPlaceholderSdk() {
    return `// StackScope SDK v${this.version}
// This will be replaced with the actual built SDK
(function() {
  console.log('[StackScope] SDK placeholder loaded. Please build and deploy the actual SDK.');
})();`;
  }
  updateSdkContent(content) {
    this.sdkContent = content;
  }
};
__name(SdkHandler, "SdkHandler");

// src/infrastructure/middleware/CorsValidator.ts
var CorsValidator = class {
  allowedOrigins;
  enableWildcard;
  constructor(origins, enableWildcard = false) {
    this.allowedOrigins = new Set(origins);
    this.enableWildcard = enableWildcard;
  }
  validateOrigin(origin) {
    if (!origin)
      return false;
    if (this.enableWildcard)
      return true;
    if (this.allowedOrigins.has(origin))
      return true;
    if (this.isLocalhostOrigin(origin)) {
      return Array.from(this.allowedOrigins).some(
        (allowed) => this.isLocalhostOrigin(allowed)
      );
    }
    return false;
  }
  getCorsHeaders(origin) {
    const headers = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
      "Access-Control-Max-Age": "86400"
    };
    if (origin && this.validateOrigin(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Credentials"] = "true";
    }
    return headers;
  }
  getAllowedOrigins() {
    return Array.from(this.allowedOrigins);
  }
  isWildcardEnabled() {
    return this.enableWildcard;
  }
  isLocalhostOrigin(origin) {
    try {
      const url = new URL(origin);
      return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    } catch {
      return false;
    }
  }
};
__name(CorsValidator, "CorsValidator");

// src/infrastructure/middleware/AuthValidator.ts
var AuthValidator = class {
  apiKey;
  authEnabled;
  constructor(apiKey) {
    this.apiKey = apiKey || null;
    this.authEnabled = !!apiKey;
  }
  async validateRequest(request) {
    if (!this.authEnabled)
      return true;
    const providedKey = this.extractApiKey(request);
    if (!providedKey || !this.apiKey)
      return false;
    return this.secureCompare(providedKey, this.apiKey);
  }
  extractApiKey(request) {
    const headerKey = request.headers.get("X-API-Key");
    if (headerKey)
      return headerKey;
    const url = new URL(request.url);
    const queryKey = url.searchParams.get("apiKey");
    return queryKey;
  }
  isAuthEnabled() {
    return this.authEnabled;
  }
  secureCompare(a, b) {
    if (a.length !== b.length)
      return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
};
__name(AuthValidator, "AuthValidator");

// src/infrastructure/middleware/RateLimiter.ts
var InMemoryRateLimiter = class {
  limits = /* @__PURE__ */ new Map();
  maxRequests;
  windowMs;
  constructor(maxRequests = 100, windowMs = 6e4) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    setInterval(() => this.cleanup(), this.windowMs);
  }
  async checkLimit(identifier) {
    const now = /* @__PURE__ */ new Date();
    const entry = this.limits.get(identifier);
    if (!entry || entry.resetTime < now) {
      this.limits.set(identifier, {
        count: 1,
        resetTime: new Date(now.getTime() + this.windowMs)
      });
      return true;
    }
    if (entry.count >= this.maxRequests) {
      return false;
    }
    entry.count++;
    return true;
  }
  async getRemainingRequests(identifier) {
    const entry = this.limits.get(identifier);
    if (!entry || entry.resetTime < /* @__PURE__ */ new Date()) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }
  async getResetTime(identifier) {
    const entry = this.limits.get(identifier);
    if (!entry || entry.resetTime < /* @__PURE__ */ new Date()) {
      return new Date(Date.now() + this.windowMs);
    }
    return entry.resetTime;
  }
  cleanup() {
    const now = /* @__PURE__ */ new Date();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetTime < now) {
        this.limits.delete(key);
      }
    }
  }
};
__name(InMemoryRateLimiter, "InMemoryRateLimiter");

// src/container/WorkerContainer.ts
var WorkerContainer = class {
  logger;
  healthChecker;
  logProcessor;
  sdkProvider;
  corsValidator;
  authValidator;
  rateLimiter;
  constructor(config) {
    this.logger = new ConsoleLogger(config.environment);
    this.healthChecker = new HealthHandler(config);
    this.logProcessor = new LogHandler(this.logger);
    this.sdkProvider = new SdkHandler();
    this.corsValidator = new CorsValidator(config.corsOrigins, config.enableCorsWildcard);
    this.authValidator = new AuthValidator(config.apiKey);
    this.rateLimiter = new InMemoryRateLimiter(
      config.rateLimitMaxRequests,
      config.rateLimitWindowMs
    );
  }
  getLogger() {
    return this.logger;
  }
  getHealthChecker() {
    return this.healthChecker;
  }
  getLogProcessor() {
    return this.logProcessor;
  }
  getSdkProvider() {
    return this.sdkProvider;
  }
  getCorsValidator() {
    return this.corsValidator;
  }
  getAuthValidator() {
    return this.authValidator;
  }
  getRateLimiter() {
    return this.rateLimiter;
  }
};
__name(WorkerContainer, "WorkerContainer");

// src/application/Router.ts
var Router = class {
  container;
  constructor(container) {
    this.container = container;
  }
  async handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const logger = this.container.getLogger();
    logger.info(`Incoming request: ${request.method} ${path}`);
    try {
      switch (path) {
        case "/api/health":
          return await this.handleHealth();
        case "/api/log":
          if (request.method !== "POST") {
            return this.methodNotAllowed();
          }
          return await this.handleLog(request);
        case "/sdk.js":
          return await this.handleSdk();
        default:
          return this.notFound();
      }
    } catch (error) {
      logger.error("Request handling error", { error: error.message, path });
      return this.serverError();
    }
  }
  async handleHealth() {
    const healthChecker = this.container.getHealthChecker();
    const health = await healthChecker.checkHealth();
    return new Response(JSON.stringify(health), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  async handleLog(request) {
    const logProcessor = this.container.getLogProcessor();
    try {
      const logs = await request.json();
      await logProcessor.processLogs(logs, request);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "Invalid request body",
        message: error.message
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  }
  async handleSdk() {
    const sdkProvider = this.container.getSdkProvider();
    const content = await sdkProvider.getSdkContent();
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": sdkProvider.getContentType(),
        "Cache-Control": "public, max-age=3600"
      }
    });
  }
  methodNotAllowed() {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  notFound() {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  serverError() {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
__name(Router, "Router");

// src/index.ts
var src_default = {
  async fetch(request, env, ctx) {
    const config = ConfigLoader.load(env);
    const container = new WorkerContainer(config);
    const router = new Router(container);
    const corsValidator = container.getCorsValidator();
    const authValidator = container.getAuthValidator();
    const rateLimiter = container.getRateLimiter();
    const logger = container.getLogger();
    const origin = request.headers.get("Origin");
    const corsHeaders = corsValidator.getCorsHeaders(origin);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    const isAuthorized = await authValidator.validateRequest(request);
    if (!isAuthorized) {
      logger.warn("Unauthorized request", {
        path: new URL(request.url).pathname,
        origin
      });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const clientId = request.headers.get("CF-Connecting-IP") || "unknown";
    const withinLimit = await rateLimiter.checkLimit(clientId);
    if (!withinLimit) {
      const resetTime = await rateLimiter.getResetTime(clientId);
      logger.warn("Rate limit exceeded", { clientId });
      return new Response(JSON.stringify({
        error: "Rate limit exceeded",
        resetTime: resetTime.toISOString()
      }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((resetTime.getTime() - Date.now()) / 1e3).toString(),
          ...corsHeaders
        }
      });
    }
    try {
      const response = await router.handleRequest(request);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    } catch (error) {
      logger.error("Unhandled error", { error: error.message });
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
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

// .wrangler/tmp/bundle-LydMnk/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-LydMnk/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
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
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
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
