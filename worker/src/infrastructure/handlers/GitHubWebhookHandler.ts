import { IRequestHandler } from '../../domain/interfaces/IRequestHandler';
import { IGitHubWebhookProcessor, IGitHubSignatureValidator, IGitHubEventMapper } from '../../domain/interfaces/IGitHubWebhookProcessor';
import { LogEntry } from '../../domain/types';
import { GitHubWebhookPayload, GitHubEventType } from '../../domain/types/GitHubTypes';

export interface GitHubWebhookHandlerConfig {
  webhookSecret?: string;
}

export class GitHubWebhookHandler implements IRequestHandler, IGitHubWebhookProcessor {
  private signatureValidator: IGitHubSignatureValidator;
  private eventMapper: IGitHubEventMapper;
  private config: GitHubWebhookHandlerConfig;

  constructor(
    signatureValidator: IGitHubSignatureValidator,
    eventMapper: IGitHubEventMapper,
    config: GitHubWebhookHandlerConfig = {}
  ) {
    this.signatureValidator = signatureValidator;
    this.eventMapper = eventMapper;
    this.config = config;
  }

  canHandle(request: Request): boolean {
    const url = new URL(request.url);
    return request.method === 'POST' && url.pathname === '/webhook/github';
  }

  async handle(request: Request): Promise<Response> {
    try {
      // Extract headers
      const eventType = request.headers.get('X-GitHub-Event') as GitHubEventType;
      const signature = request.headers.get('X-Hub-Signature-256');
      const delivery = request.headers.get('X-GitHub-Delivery');

      if (!eventType) {
        return this.createErrorResponse(400, 'Missing X-GitHub-Event header');
      }

      if (!delivery) {
        return this.createErrorResponse(400, 'Missing X-GitHub-Delivery header');
      }

      // Get form data (GitHub sends webhooks as form-encoded with JSON in 'payload' field)
      const formData = await request.formData();
      const payloadText = formData.get('payload') as string;
      
      if (!payloadText) {
        return this.createErrorResponse(400, 'Missing payload field in form data');
      }

      // Validate signature if secret is configured
      const webhookSecret = this.getWebhookSecret();
      if (webhookSecret) {
        if (!signature) {
          return this.createErrorResponse(401, 'Missing signature');
        }

        const extractedSignature = this.signatureValidator.extractSignature(signature);
        const isValidSignature = await this.signatureValidator.validateSignature(
          payloadText, 
          extractedSignature, 
          webhookSecret
        );

        if (!isValidSignature) {
          return this.createErrorResponse(401, 'Invalid signature');
        }
      }

      // Parse JSON payload from form field
      let payload: GitHubWebhookPayload;
      try {
        payload = JSON.parse(payloadText);
      } catch (error) {
        return this.createErrorResponse(400, 'Invalid JSON in payload field');
      }

      // Process webhook
      const logs = await this.processWebhook(payload, eventType);
      
      // Log each entry (this will be captured by wrangler tail)
      for (const log of logs) {
        console.log(JSON.stringify(log));
      }

      return this.createSuccessResponse({
        success: true,
        event: eventType,
        delivery: delivery,
        processed: logs.length,
        repository: payload.repository.full_name
      });

    } catch (error) {
      console.error('GitHub webhook processing error:', error);
      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  async processWebhook(payload: GitHubWebhookPayload, eventType: GitHubEventType): Promise<LogEntry[]> {
    return this.mapEventToLogs(payload, eventType);
  }

  async validateSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    return this.signatureValidator.validateSignature(payload, signature, secret);
  }

  mapEventToLogs(payload: GitHubWebhookPayload, eventType: GitHubEventType): LogEntry[] {
    return this.eventMapper.mapToLogEntries(payload, eventType);
  }

  private getWebhookSecret(): string | undefined {
    return this.config.webhookSecret;
  }

  private createSuccessResponse(data: any): Response {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-GitHub-Event, X-Hub-Signature-256, X-GitHub-Delivery'
      }
    });
  }

  private createErrorResponse(status: number, message: string): Response {
    return new Response(JSON.stringify({
      error: true,
      message,
      status
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}