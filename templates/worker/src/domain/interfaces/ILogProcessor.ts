import { LogEntry } from '../types';

export interface ILogProcessor {
  processLog(logEntry: LogEntry): Promise<void>;
  validateRequest(request: Request): Promise<ValidationResult>;
  enrichMetadata(logEntry: LogEntry, request: Request): LogEntry;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}