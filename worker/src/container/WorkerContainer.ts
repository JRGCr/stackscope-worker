import { IDependencyContainer, ServiceToken, ServiceFactory, ServiceDescriptor, ServiceLifetime } from './IDependencyContainer';
import { IRequestHandler } from '../domain/interfaces/IRequestHandler';
import { IHandlerFactory } from '../domain/interfaces/IServiceFactory';
import { HandlerFactory, HandlerFactoryConfig } from '../infrastructure/factories/HandlerFactory';

export interface WorkerEnv {
  GITHUB_WEBHOOK_SECRET?: string;
}

export class WorkerContainer implements IDependencyContainer {
  private services = new Map<string, ServiceDescriptor>();
  private instances = new Map<string, any>();
  private env: WorkerEnv;

  constructor(env: WorkerEnv = {}) {
    this.env = env;
  }

  register<T>(token: ServiceToken<T>, factory: ServiceFactory<T>): void {
    this.services.set(token.name, {
      token,
      factory,
      lifetime: ServiceLifetime.TRANSIENT
    });
  }

  registerSingleton<T>(token: ServiceToken<T>, factory: ServiceFactory<T>): void {
    this.services.set(token.name, {
      token,
      factory,
      lifetime: ServiceLifetime.SINGLETON
    });
  }

  registerInstance<T>(token: ServiceToken<T>, instance: T): void {
    this.instances.set(token.name, instance);
    this.services.set(token.name, {
      token,
      factory: () => instance,
      lifetime: ServiceLifetime.SINGLETON,
      instance
    });
  }

  resolve<T>(token: ServiceToken<T>): T {
    const descriptor = this.services.get(token.name);
    if (!descriptor) {
      throw new Error(`Service not registered: ${token.name}`);
    }

    if (descriptor.lifetime === ServiceLifetime.SINGLETON) {
      if (!descriptor.instance) {
        descriptor.instance = descriptor.factory(this);
      }
      return descriptor.instance;
    }

    return descriptor.factory(this);
  }

  isRegistered<T>(token: ServiceToken<T>): boolean {
    return this.services.has(token.name);
  }

  createScope(): IDependencyContainer {
    const scopedContainer = new WorkerContainer(this.env);

    for (const [key, descriptor] of this.services) {
      if (descriptor.lifetime === ServiceLifetime.SINGLETON) {
        scopedContainer.services.set(key, descriptor);
      } else {
        scopedContainer.services.set(key, {
          ...descriptor,
          lifetime: ServiceLifetime.SCOPED
        });
      }
    }
    
    return scopedContainer;
  }

  registerWorkerHandlers(): void {
    // Register factory with environment configuration
    const factoryConfig: HandlerFactoryConfig = {
      githubWebhookSecret: this.env.GITHUB_WEBHOOK_SECRET
    };

    this.registerSingleton(
      { name: 'HandlerFactory', type: 'HandlerFactory' } as ServiceToken<IHandlerFactory>,
      () => new HandlerFactory(factoryConfig)
    );

    // Register handlers using factory
    const factory = this.resolve({ name: 'HandlerFactory', type: 'HandlerFactory' } as ServiceToken<IHandlerFactory>);
    
    // Note: Handlers implement both their domain interfaces and IRequestHandler
    // The factory returns the domain interface type, but implementations are also IRequestHandler
    this.registerSingleton(
      { name: 'HealthHandler', type: 'IRequestHandler' } as ServiceToken<IRequestHandler>,
      () => factory.createHealthHandler() as unknown as IRequestHandler
    );

    this.registerSingleton(
      { name: 'LogHandler', type: 'IRequestHandler' } as ServiceToken<IRequestHandler>,
      () => factory.createLogHandler() as unknown as IRequestHandler
    );

    this.registerSingleton(
      { name: 'SdkHandler', type: 'IRequestHandler' } as ServiceToken<IRequestHandler>,
      () => factory.createSdkHandler() as unknown as IRequestHandler
    );

    this.registerSingleton(
      { name: 'GitHubWebhookHandler', type: 'IRequestHandler' } as ServiceToken<IRequestHandler>,
      () => factory.createGitHubWebhookHandler() as unknown as IRequestHandler
    );

    this.registerSingleton(
      { name: 'BrowserWebhookHandler', type: 'IRequestHandler' } as ServiceToken<IRequestHandler>,
      () => factory.createBrowserWebhookHandler() as unknown as IRequestHandler
    );
  }

  getRequestHandlers(): IRequestHandler[] {
    return [
      this.resolve({ name: 'HealthHandler', type: 'IHealthChecker' } as ServiceToken<IRequestHandler>),
      this.resolve({ name: 'LogHandler', type: 'ILogProcessor' } as ServiceToken<IRequestHandler>),
      this.resolve({ name: 'SdkHandler', type: 'ISdkProvider' } as ServiceToken<IRequestHandler>),
      this.resolve({ name: 'GitHubWebhookHandler', type: 'IGitHubWebhookProcessor' } as ServiceToken<IRequestHandler>),
      this.resolve({ name: 'BrowserWebhookHandler', type: 'ILogProcessor' } as ServiceToken<IRequestHandler>)
    ];
  }
}