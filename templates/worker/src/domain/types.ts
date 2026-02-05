import { GitHubEventType } from './types/GitHubTypes';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogSource = 'browser' | 'worker' | 'github' | 'collector';
export type BrowserLogType = 'console' | 'network' | 'interaction' | 'navigation' | 'performance' | 'visibility' | 'resource';
export type GitHubLogType = 'github_event' | 'commit';

export interface LogEntry {
  ts: string;
  source: LogSource;
  level: LogLevel;
  msg: string;
  meta?: LogMetadata;
}

export interface LogMetadata {
  type?: BrowserLogType | GitHubEventType | GitHubLogType;
  url?: string;
  sessionId?: string;
  stack?: string;
  method?: string;
  requestUrl?: string;
  status?: number;
  duration?: number;
  size?: number;
  error?: string;
  event?: 'click' | 'submit' | 'input' | 'change';
  target?: string;
  value?: string;
  from?: string;
  to?: string;
  trigger?: 'load' | 'pushState' | 'popstate' | 'replaceState' | 'hashchange';
  metric?: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'longTask';
  rating?: 'good' | 'needs-improvement' | 'poor';
  rayId?: string;
  path?: string;
  statusCode?: number;
  
  // GitHub-specific metadata
  repo?: string;
  repoId?: number;
  repoFullName?: string;
  owner?: string;
  workflow?: string;
  workflowId?: number;
  runId?: number;
  runNumber?: number;
  branch?: string;
  baseBranch?: string;
  headBranch?: string;
  sha?: string;
  beforeSha?: string;
  afterSha?: string;
  conclusion?: string;
  workflowStatus?: 'queued' | 'in_progress' | 'completed';
  state?: string;
  merged?: boolean;
  draft?: boolean;
  prerelease?: boolean;
  labels?: string[];
  author?: string;
  committer?: string;
  pusher?: string;
  created?: boolean;
  deleted?: boolean;
  action?: string;
  organization?: string;
  actor?: string;
  actorId?: number;
  pullRequestNumber?: number;
  issueNumber?: number;
  releaseTag?: string;
  commitCount?: number;
  filesChanged?: number;
  additions?: number;
  deletions?: number;
  forced?: boolean;
  private?: boolean;
  fork?: boolean;

  [key: string]: unknown;
}