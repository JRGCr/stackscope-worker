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

// .wrangler/tmp/bundle-CNYvNk/checked-fetch.js
var require_checked_fetch = __commonJS({
  ".wrangler/tmp/bundle-CNYvNk/checked-fetch.js"() {
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

// .wrangler/tmp/bundle-CNYvNk/strip-cf-connecting-ip-header.js
var require_strip_cf_connecting_ip_header = __commonJS({
  ".wrangler/tmp/bundle-CNYvNk/strip-cf-connecting-ip-header.js"() {
    "use strict";
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
  }
});

// .wrangler/tmp/bundle-CNYvNk/middleware-loader.entry.ts
var import_checked_fetch18 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header18 = __toESM(require_strip_cf_connecting_ip_header());

// wrangler-modules-watch:wrangler:modules-watch
var import_checked_fetch = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header = __toESM(require_strip_cf_connecting_ip_header());

// .wrangler/tmp/bundle-CNYvNk/middleware-insertion-facade.js
var import_checked_fetch16 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header16 = __toESM(require_strip_cf_connecting_ip_header());

// src/index.ts
var import_checked_fetch13 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header13 = __toESM(require_strip_cf_connecting_ip_header());

// src/container/WorkerContainer.ts
var import_checked_fetch11 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header11 = __toESM(require_strip_cf_connecting_ip_header());

// ../src/container/IDependencyContainer.ts
var import_checked_fetch2 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header2 = __toESM(require_strip_cf_connecting_ip_header());

// src/infrastructure/factories/HandlerFactory.ts
var import_checked_fetch10 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header10 = __toESM(require_strip_cf_connecting_ip_header());

// src/infrastructure/handlers/HealthHandler.ts
var import_checked_fetch3 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header3 = __toESM(require_strip_cf_connecting_ip_header());
var HealthHandler = class {
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
__name(HealthHandler, "HealthHandler");

// src/infrastructure/handlers/LogHandler.ts
var import_checked_fetch4 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header4 = __toESM(require_strip_cf_connecting_ip_header());
var LogHandler = class {
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
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
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
__name(LogHandler, "LogHandler");

// src/infrastructure/handlers/SdkHandler.ts
var import_checked_fetch5 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header5 = __toESM(require_strip_cf_connecting_ip_header());
var SdkHandler = class {
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
__name(SdkHandler, "SdkHandler");

// src/infrastructure/handlers/DashboardHandler.ts
var import_checked_fetch6 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header6 = __toESM(require_strip_cf_connecting_ip_header());
var DashboardHandler = class {
  canHandle(request) {
    const url = new URL(request.url);
    return request.method === "GET" && url.pathname.startsWith("/api/");
  }
  async handle(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      let result;
      switch (path) {
        case "/api/stats":
          result = await this.getStats();
          break;
        case "/api/sessions":
          result = await this.getSessions();
          break;
        case "/api/logs":
          const limit = parseInt(url.searchParams.get("limit") || "50");
          const level = url.searchParams.get("level") || void 0;
          const source = url.searchParams.get("source") || void 0;
          result = await this.getLogs({ limit, level, source });
          break;
        case "/api/metrics":
          const timeRange = url.searchParams.get("timeRange") || "24h";
          result = await this.getMetrics(timeRange);
          break;
        default:
          if (path.startsWith("/api/sessions/")) {
            const sessionId = path.replace("/api/sessions/", "");
            result = await this.getSessionDetails(sessionId);
          } else {
            return this.createNotFoundResponse();
          }
      }
      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }
  async getStats() {
    return {
      logCount: Math.floor(Math.random() * 1e4) + 5e3,
      sessionCount: Math.floor(Math.random() * 100) + 50,
      errorRate: Math.random() * 0.1,
      sources: {
        browser: Math.floor(Math.random() * 1e3) + 500,
        worker: Math.floor(Math.random() * 500) + 200,
        github: Math.floor(Math.random() * 200) + 50,
        collector: Math.floor(Math.random() * 100) + 25
      },
      recentActivity: Math.floor(Math.random() * 50) + 10
    };
  }
  async getSessions() {
    const sessions = [];
    const sessionCount = Math.floor(Math.random() * 20) + 5;
    for (let i = 0; i < sessionCount; i++) {
      const startTime = new Date(Date.now() - Math.random() * 864e5);
      const duration = Math.random() * 36e5;
      const lastActivity = new Date(startTime.getTime() + duration);
      sessions.push({
        sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
        startTime: startTime.toISOString(),
        lastActivity: lastActivity.toISOString(),
        duration: Math.floor(duration),
        pageViews: Math.floor(Math.random() * 10) + 1,
        interactions: Math.floor(Math.random() * 50) + 5,
        errors: Math.floor(Math.random() * 3),
        country: ["US", "GB", "CA", "DE", "FR"][Math.floor(Math.random() * 5)],
        eventCount: Math.floor(Math.random() * 100) + 20,
        errorCount: Math.floor(Math.random() * 3)
      });
    }
    return { sessions };
  }
  async getSessionDetails(sessionId) {
    const session = (await this.getSessions()).sessions[0];
    if (!session) {
      throw new Error("Session not found");
    }
    const events = [];
    const eventCount = Math.floor(Math.random() * 20) + 5;
    for (let i = 0; i < eventCount; i++) {
      const eventTime = new Date(Date.now() - Math.random() * 36e5);
      const eventTypes = ["navigation", "interaction", "performance", "network", "error", "console"];
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      events.push({
        ts: eventTime.toISOString(),
        type,
        level: type === "error" ? "error" : type === "console" ? "info" : void 0,
        message: this.generateEventMessage(type)
      });
    }
    events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    return {
      ...session,
      sessionId,
      events,
      summary: {
        duration: session.duration,
        pageViews: session.pageViews,
        interactions: session.interactions,
        errors: session.errors
      }
    };
  }
  async getLogs(options = {}) {
    const { limit = 50 } = options;
    const logs = [];
    for (let i = 0; i < limit; i++) {
      const levels = ["info", "warn", "error", "debug"];
      const sources = ["browser", "worker", "github", "collector"];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      if (options.level && level !== options.level)
        continue;
      if (options.source && source !== options.source)
        continue;
      logs.push({
        ts: new Date(Date.now() - Math.random() * 864e5).toISOString(),
        level,
        source,
        msg: this.generateLogMessage(level, source),
        meta: {
          sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
          duration: Math.floor(Math.random() * 1e3),
          status: level === "error" ? 500 : 200
        }
      });
    }
    logs.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    return { logs };
  }
  async getMetrics(timeRange = "24h") {
    const metrics = [];
    const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 24;
    for (let i = hours - 1; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 60 * 60 * 1e3).toISOString();
      metrics.push({
        timestamp,
        responseTime: Math.floor(Math.random() * 500) + 100,
        errorCount: Math.floor(Math.random() * 10),
        sessionCount: Math.floor(Math.random() * 20) + 5,
        eventCount: Math.floor(Math.random() * 1e3) + 100
      });
    }
    return { metrics };
  }
  startLogStream(callback, options = {}) {
    console.log("Log stream started with options:", options);
  }
  stopLogStream() {
    console.log("Log stream stopped");
  }
  generateEventMessage(type) {
    const messages = {
      navigation: ["Page loaded: /dashboard", "User navigated to /profile", "Route changed to /settings"],
      interaction: ["Button clicked: Save", "Form submitted", "Modal opened", "Menu expanded"],
      performance: ["Core Web Vitals measured", "Page load completed in 1.2s", "Resource loaded"],
      network: ["API request to /api/user", "XHR completed", "Fetch request started"],
      error: ["TypeError: Cannot read property", "Network request failed", "Validation error"],
      console: ["User action logged", "Debug info captured", "State updated"]
    };
    const typeMessages = messages[type] || ["Generic event occurred"];
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  }
  generateLogMessage(level, source) {
    const templates = {
      info: {
        browser: ["Page view recorded", "User interaction captured", "Session started"],
        worker: ["Request processed successfully", "Log entry created", "Health check passed"],
        github: ["Workflow completed", "Action triggered", "Repository updated"],
        collector: ["Data aggregated", "Metrics calculated", "Report generated"]
      },
      warn: {
        browser: ["Slow network detected", "Performance threshold exceeded", "Deprecated API used"],
        worker: ["Rate limit approaching", "Memory usage high", "Response time elevated"],
        github: ["Workflow taking longer than expected", "API rate limit warning"],
        collector: ["Data quality issue detected", "Missing metadata", "Partial aggregation"]
      },
      error: {
        browser: ["JavaScript error occurred", "Network request failed", "Validation failed"],
        worker: ["Request processing failed", "Database connection lost", "Validation error"],
        github: ["Workflow failed", "API request rejected", "Authentication failed"],
        collector: ["Data processing failed", "Aggregation error", "Storage unavailable"]
      },
      debug: {
        browser: ["Debug info captured", "State transition logged", "Event handler executed"],
        worker: ["Request details logged", "Processing step completed", "Cache operation"],
        github: ["API call details", "Webhook received", "Event processing"],
        collector: ["Processing pipeline step", "Data transformation", "Metric calculation"]
      }
    };
    const sourceMessages = templates[level]?.[source] || ["Generic log message"];
    return sourceMessages[Math.floor(Math.random() * sourceMessages.length)];
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
      message: "API endpoint not found"
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
};
__name(DashboardHandler, "DashboardHandler");

// src/infrastructure/handlers/GitHubWebhookHandler.ts
var import_checked_fetch9 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header9 = __toESM(require_strip_cf_connecting_ip_header());

// src/infrastructure/validators/GitHubSignatureValidator.ts
var import_checked_fetch7 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header7 = __toESM(require_strip_cf_connecting_ip_header());
var GitHubSignatureValidator = class {
  async validateSignature(payload, signature, secret) {
    if (!signature || !secret) {
      return false;
    }
    try {
      const expectedSignature = await this.generateSignature(payload, secret);
      return this.secureCompare(signature, expectedSignature);
    } catch (error) {
      console.error("Signature validation error:", error);
      return false;
    }
  }
  extractSignature(signatureHeader) {
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
      return "";
    }
    return signatureHeader.substring(7);
  }
  async generateSignature(payload, secret) {
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const payloadData = encoder.encode(payload);
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, payloadData);
    return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  secureCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
};
__name(GitHubSignatureValidator, "GitHubSignatureValidator");

// src/infrastructure/mappers/GitHubEventMapper.ts
var import_checked_fetch8 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header8 = __toESM(require_strip_cf_connecting_ip_header());
var GitHubEventMapper = class {
  mapToLogEntries(payload, eventType) {
    const baseLog = {
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      source: "github",
      meta: this.extractMetadata(payload)
    };
    switch (eventType) {
      case "push":
        return this.mapPushEvent(payload, baseLog);
      case "pull_request":
        return this.mapPullRequestEvent(payload, baseLog);
      case "issues":
        return this.mapIssuesEvent(payload, baseLog);
      case "workflow_run":
        return this.mapWorkflowRunEvent(payload, baseLog);
      case "release":
        return this.mapReleaseEvent(payload, baseLog);
      default:
        return this.mapGenericEvent(payload, eventType, baseLog);
    }
  }
  extractMetadata(payload) {
    return {
      type: "github_event",
      repo: payload.repository.name,
      repoId: payload.repository.id,
      repoFullName: payload.repository.full_name,
      owner: payload.repository.owner.login,
      actor: payload.sender.login,
      actorId: payload.sender.id,
      private: payload.repository.private,
      action: payload.action,
      organization: payload.organization?.login,
      url: payload.repository.html_url
    };
  }
  mapPushEvent(payload, baseLog) {
    const logs = [];
    const branch = payload.ref.replace("refs/heads/", "");
    const commitCount = payload.commits.length;
    logs.push({
      ...baseLog,
      level: "info",
      msg: `Push to ${branch}: ${commitCount} commit${commitCount !== 1 ? "s" : ""}`,
      meta: {
        ...baseLog.meta,
        branch,
        beforeSha: payload.before,
        afterSha: payload.after,
        commitCount,
        forced: payload.forced,
        created: payload.created,
        deleted: payload.deleted,
        pusher: payload.pusher.name
      }
    });
    payload.commits.forEach((commit) => {
      logs.push({
        ...baseLog,
        level: "debug",
        msg: `Commit: ${commit.message.split("\n")[0]}`,
        meta: {
          ...baseLog.meta,
          type: "commit",
          sha: commit.id,
          branch,
          author: commit.author.name,
          committer: commit.committer.name,
          filesChanged: commit.added.length + commit.modified.length + commit.removed.length,
          additions: commit.added.length,
          deletions: commit.removed.length
        }
      });
    });
    return logs;
  }
  mapPullRequestEvent(payload, baseLog) {
    const pr = payload.pull_request;
    const level = this.getPullRequestLogLevel(payload.action);
    return [{
      ...baseLog,
      level,
      msg: `Pull request ${payload.action}: #${pr.number} ${pr.title}`,
      meta: {
        ...baseLog.meta,
        pullRequestNumber: pr.number,
        baseBranch: pr.base.ref,
        headBranch: pr.head.ref,
        sha: pr.head.sha,
        state: pr.state,
        merged: pr.merged,
        url: pr.html_url
      }
    }];
  }
  mapIssuesEvent(payload, baseLog) {
    const issue = payload.issue;
    const level = this.getIssuesLogLevel(payload.action);
    return [{
      ...baseLog,
      level,
      msg: `Issue ${payload.action}: #${issue.number} ${issue.title}`,
      meta: {
        ...baseLog.meta,
        issueNumber: issue.number,
        state: issue.state,
        labels: issue.labels.map((label) => label.name),
        url: issue.html_url
      }
    }];
  }
  mapWorkflowRunEvent(payload, baseLog) {
    const run = payload.workflow_run;
    const workflow = payload.workflow;
    const level = this.getWorkflowLogLevel(run.status, run.conclusion);
    return [{
      ...baseLog,
      level,
      msg: `Workflow ${run.status}: ${workflow.name} #${run.run_number}`,
      meta: {
        ...baseLog.meta,
        workflow: workflow.name,
        workflowId: workflow.id,
        runId: run.id,
        runNumber: run.run_number,
        branch: run.head_branch,
        sha: run.head_sha,
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url
      }
    }];
  }
  mapReleaseEvent(payload, baseLog) {
    const release = payload.release;
    const level = this.getReleaseLogLevel(payload.action);
    return [{
      ...baseLog,
      level,
      msg: `Release ${payload.action}: ${release.tag_name} ${release.name || ""}`,
      meta: {
        ...baseLog.meta,
        releaseTag: release.tag_name,
        branch: release.target_commitish,
        draft: release.draft,
        prerelease: release.prerelease,
        url: release.html_url
      }
    }];
  }
  mapGenericEvent(payload, eventType, baseLog) {
    return [{
      ...baseLog,
      level: "info",
      msg: `GitHub ${eventType}${payload.action ? ` ${payload.action}` : ""} event`,
      meta: {
        ...baseLog.meta,
        eventType
      }
    }];
  }
  getPullRequestLogLevel(action) {
    switch (action) {
      case "opened":
      case "reopened":
        return "info";
      case "closed":
        return "info";
      case "synchronize":
        return "debug";
      default:
        return "debug";
    }
  }
  getIssuesLogLevel(action) {
    switch (action) {
      case "opened":
        return "info";
      case "closed":
        return "info";
      default:
        return "debug";
    }
  }
  getWorkflowLogLevel(status, conclusion) {
    if (status === "completed") {
      switch (conclusion) {
        case "success":
          return "info";
        case "failure":
        case "timed_out":
          return "error";
        case "cancelled":
        case "skipped":
          return "warn";
        default:
          return "info";
      }
    }
    return "debug";
  }
  getReleaseLogLevel(action) {
    switch (action) {
      case "published":
      case "released":
        return "info";
      case "deleted":
        return "warn";
      default:
        return "debug";
    }
  }
};
__name(GitHubEventMapper, "GitHubEventMapper");

// src/infrastructure/handlers/GitHubWebhookHandler.ts
var GitHubWebhookHandler = class {
  signatureValidator;
  eventMapper;
  constructor() {
    this.signatureValidator = new GitHubSignatureValidator();
    this.eventMapper = new GitHubEventMapper();
  }
  canHandle(request) {
    const url = new URL(request.url);
    return request.method === "POST" && url.pathname === "/webhook/github";
  }
  async handle(request) {
    try {
      const eventType = request.headers.get("X-GitHub-Event");
      const signature = request.headers.get("X-Hub-Signature-256");
      const delivery = request.headers.get("X-GitHub-Delivery");
      if (!eventType) {
        return this.createErrorResponse(400, "Missing X-GitHub-Event header");
      }
      if (!delivery) {
        return this.createErrorResponse(400, "Missing X-GitHub-Delivery header");
      }
      const payloadText = await request.text();
      if (!payloadText) {
        return this.createErrorResponse(400, "Empty payload");
      }
      const webhookSecret = this.getWebhookSecret();
      if (webhookSecret) {
        if (!signature) {
          return this.createErrorResponse(401, "Missing signature");
        }
        const extractedSignature = this.signatureValidator.extractSignature(signature);
        const isValidSignature = await this.signatureValidator.validateSignature(
          payloadText,
          extractedSignature,
          webhookSecret
        );
        if (!isValidSignature) {
          return this.createErrorResponse(401, "Invalid signature");
        }
      }
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (error) {
        return this.createErrorResponse(400, "Invalid JSON payload");
      }
      const logs = await this.processWebhook(payload, eventType);
      for (const log of logs) {
        console.log(JSON.stringify(log));
      }
      return this.createSuccessResponse({
        success: true,
        event: eventType,
        delivery,
        processed: logs.length,
        repository: payload.repository.full_name
      });
    } catch (error) {
      console.error("GitHub webhook processing error:", error);
      return this.createErrorResponse(500, "Internal server error");
    }
  }
  async processWebhook(payload, eventType) {
    return this.mapEventToLogs(payload, eventType);
  }
  async validateSignature(payload, signature, secret) {
    return this.signatureValidator.validateSignature(payload, signature, secret);
  }
  mapEventToLogs(payload, eventType) {
    return this.eventMapper.mapToLogEntries(payload, eventType);
  }
  getWebhookSecret() {
    return globalThis.GITHUB_WEBHOOK_SECRET || typeof process !== "undefined" && process.env?.GITHUB_WEBHOOK_SECRET || void 0;
  }
  createSuccessResponse(data) {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-GitHub-Event, X-Hub-Signature-256, X-GitHub-Delivery"
      }
    });
  }
  createErrorResponse(status, message) {
    return new Response(JSON.stringify({
      error: true,
      message,
      status
    }), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
__name(GitHubWebhookHandler, "GitHubWebhookHandler");

// src/infrastructure/factories/HandlerFactory.ts
var HandlerFactory = class {
  createHealthHandler() {
    return new HealthHandler();
  }
  createLogHandler() {
    return new LogHandler();
  }
  createSdkHandler() {
    return new SdkHandler();
  }
  createDashboardHandler() {
    return new DashboardHandler();
  }
  createGitHubWebhookHandler() {
    return new GitHubWebhookHandler();
  }
};
__name(HandlerFactory, "HandlerFactory");

// src/container/WorkerContainer.ts
var WorkerContainer = class {
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
      factory: () => instance,
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
    const scopedContainer = new WorkerContainer();
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
      { name: "HandlerFactory", type: "HandlerFactory" },
      () => new HandlerFactory()
    );
    const factory = this.resolve({ name: "HandlerFactory", type: "HandlerFactory" });
    this.registerSingleton(
      { name: "HealthHandler", type: "IHealthChecker" },
      () => factory.createHealthHandler()
    );
    this.registerSingleton(
      { name: "LogHandler", type: "ILogProcessor" },
      () => factory.createLogHandler()
    );
    this.registerSingleton(
      { name: "SdkHandler", type: "ISdkProvider" },
      () => factory.createSdkHandler()
    );
    this.registerSingleton(
      { name: "DashboardHandler", type: "IDashboardService" },
      () => factory.createDashboardHandler()
    );
    this.registerSingleton(
      { name: "GitHubWebhookHandler", type: "IGitHubWebhookProcessor" },
      () => factory.createGitHubWebhookHandler()
    );
  }
  getRequestHandlers() {
    return [
      this.resolve({ name: "HealthHandler", type: "IHealthChecker" }),
      this.resolve({ name: "LogHandler", type: "ILogProcessor" }),
      this.resolve({ name: "SdkHandler", type: "ISdkProvider" }),
      this.resolve({ name: "DashboardHandler", type: "IDashboardService" }),
      this.resolve({ name: "GitHubWebhookHandler", type: "IGitHubWebhookProcessor" })
    ];
  }
};
__name(WorkerContainer, "WorkerContainer");

// src/infrastructure/routing/Router.ts
var import_checked_fetch12 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header12 = __toESM(require_strip_cf_connecting_ip_header());
var Router = class {
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
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
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
__name(Router, "Router");

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

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var import_checked_fetch14 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header14 = __toESM(require_strip_cf_connecting_ip_header());
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
var import_checked_fetch15 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header15 = __toESM(require_strip_cf_connecting_ip_header());
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

// .wrangler/tmp/bundle-CNYvNk/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var import_checked_fetch17 = __toESM(require_checked_fetch());
var import_strip_cf_connecting_ip_header17 = __toESM(require_strip_cf_connecting_ip_header());
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

// .wrangler/tmp/bundle-CNYvNk/middleware-loader.entry.ts
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
