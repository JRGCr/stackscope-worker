import { IHandlerFactory } from '../../domain/interfaces/IServiceFactory';
import { IHealthChecker } from '../../domain/interfaces/IHealthChecker';
import { ILogProcessor } from '../../domain/interfaces/ILogProcessor';
import { ISdkProvider } from '../../domain/interfaces/ISdkProvider';
import { IGitHubWebhookProcessor, IGitHubSignatureValidator, IGitHubEventMapper } from '../../domain/interfaces/IGitHubWebhookProcessor';
import { HealthHandler } from '../handlers/HealthHandler';
import { LogHandler } from '../handlers/LogHandler';
import { SdkHandler } from '../handlers/SdkHandler';
import { GitHubWebhookHandler, GitHubWebhookHandlerConfig } from '../handlers/GitHubWebhookHandler';
import { BrowserWebhookHandler } from '../handlers/BrowserWebhookHandler';
import { GitHubSignatureValidator } from '../validators/GitHubSignatureValidator';
import { GitHubEventMapper } from '../mappers/GitHubEventMapper';

export interface HandlerFactoryConfig {
  githubWebhookSecret?: string;
}

export class HandlerFactory implements IHandlerFactory {
  private config: HandlerFactoryConfig;
  private signatureValidator: IGitHubSignatureValidator;
  private eventMapper: IGitHubEventMapper;

  constructor(config: HandlerFactoryConfig = {}) {
    this.config = config;
    this.signatureValidator = new GitHubSignatureValidator();
    this.eventMapper = new GitHubEventMapper();
  }

  createHealthHandler(): IHealthChecker {
    return new HealthHandler();
  }

  createLogHandler(): ILogProcessor {
    return new LogHandler();
  }

  createSdkHandler(): ISdkProvider {
    return new SdkHandler();
  }

  createGitHubWebhookHandler(): IGitHubWebhookProcessor {
    const handlerConfig: GitHubWebhookHandlerConfig = {
      webhookSecret: this.config.githubWebhookSecret
    };
    return new GitHubWebhookHandler(
      this.signatureValidator,
      this.eventMapper,
      handlerConfig
    );
  }

  createBrowserWebhookHandler(): ILogProcessor {
    return new BrowserWebhookHandler();
  }
}