export interface IServiceFactory<T> {
  create(): T;
}

export interface IHandlerFactory {
  createHealthHandler(): import('./IHealthChecker').IHealthChecker;
  createLogHandler(): import('./ILogProcessor').ILogProcessor;
  createSdkHandler(): import('./ISdkProvider').ISdkProvider;
  createGitHubWebhookHandler(): import('./IGitHubWebhookProcessor').IGitHubWebhookProcessor;
  createBrowserWebhookHandler(): import('./ILogProcessor').ILogProcessor;
}