import { LogEntry } from '../types';
import { GitHubWebhookPayload, GitHubEventType } from '../types/GitHubTypes';

export interface IGitHubWebhookProcessor {
  processWebhook(payload: GitHubWebhookPayload, eventType: GitHubEventType): Promise<LogEntry[]>;
  validateSignature(payload: string, signature: string, secret: string): Promise<boolean>;
  mapEventToLogs(payload: GitHubWebhookPayload, eventType: GitHubEventType): LogEntry[];
}

export interface IGitHubSignatureValidator {
  validateSignature(payload: string, signature: string, secret: string): Promise<boolean>;
  extractSignature(signatureHeader: string): string;
}

export interface IGitHubEventMapper {
  mapToLogEntries(payload: GitHubWebhookPayload, eventType: GitHubEventType): LogEntry[];
  extractMetadata(payload: GitHubWebhookPayload): Record<string, unknown>;
}