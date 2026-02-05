export interface IDependencyContainer {
  register<T>(token: ServiceToken<T>, factory: ServiceFactory<T>): void;
  registerSingleton<T>(token: ServiceToken<T>, factory: ServiceFactory<T>): void;
  registerInstance<T>(token: ServiceToken<T>, instance: T): void;
  resolve<T>(token: ServiceToken<T>): T;
  isRegistered<T>(token: ServiceToken<T>): boolean;
  createScope(): IDependencyContainer;
}

export interface ServiceToken<T = any> {
  readonly name: string;
  readonly type?: string;
}

export interface ServiceFactory<T = any> {
  (container: IDependencyContainer): T;
}

export interface ServiceDescriptor<T = any> {
  token: ServiceToken<T>;
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
}

export enum ServiceLifetime {
  TRANSIENT = 'transient',
  SINGLETON = 'singleton', 
  SCOPED = 'scoped'
}