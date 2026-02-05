export type GitHubEventType = 
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'issue_comment'
  | 'pull_request_review'
  | 'pull_request_review_comment'
  | 'workflow_run'
  | 'workflow_dispatch'
  | 'release'
  | 'create'
  | 'delete'
  | 'fork'
  | 'star'
  | 'watch'
  | 'deployment'
  | 'deployment_status';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    type: string;
  };
}

export interface GitHubUser {
  login: string;
  id: number;
  type: string;
  site_admin?: boolean;
}

export interface GitHubCommit {
  id: string;
  message: string;
  author: {
    name: string;
    email: string;
    username?: string;
  };
  committer: {
    name: string;
    email: string;
    username?: string;
  };
  url: string;
  distinct: boolean;
  added: string[];
  modified: string[];
  removed: string[];
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  merge_commit_sha: string | null;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  user: GitHubUser;
  html_url: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: GitHubUser;
  html_url: string;
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  workflow_id: number;
  head_branch: string;
  head_sha: string;
  run_number: number;
  event: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  target_commitish: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  author: GitHubUser;
  html_url: string;
}

// Base webhook payload interface
export interface GitHubWebhookPayload {
  action?: string;
  repository: GitHubRepository;
  sender: GitHubUser;
  organization?: {
    login: string;
    id: number;
  };
  installation?: {
    id: number;
  };
}

// Specific payload types
export interface GitHubPushPayload extends GitHubWebhookPayload {
  ref: string;
  before: string;
  after: string;
  commits: GitHubCommit[];
  head_commit: GitHubCommit | null;
  pusher: {
    name: string;
    email: string;
  };
  forced: boolean;
  created: boolean;
  deleted: boolean;
}

export interface GitHubPullRequestPayload extends GitHubWebhookPayload {
  action: 'opened' | 'closed' | 'synchronize' | 'reopened' | 'edited' | 'assigned' | 'unassigned' | 'review_requested' | 'review_request_removed' | 'labeled' | 'unlabeled' | 'ready_for_review' | 'converted_to_draft';
  number: number;
  pull_request: GitHubPullRequest;
  changes?: Record<string, unknown>;
}

export interface GitHubIssuesPayload extends GitHubWebhookPayload {
  action: 'opened' | 'edited' | 'closed' | 'reopened' | 'assigned' | 'unassigned' | 'labeled' | 'unlabeled' | 'milestoned' | 'demilestoned';
  issue: GitHubIssue;
  changes?: Record<string, unknown>;
}

export interface GitHubWorkflowRunPayload extends GitHubWebhookPayload {
  action: 'requested' | 'in_progress' | 'completed';
  workflow_run: GitHubWorkflowRun;
  workflow: {
    id: number;
    name: string;
    path: string;
  };
}

export interface GitHubReleasePayload extends GitHubWebhookPayload {
  action: 'published' | 'unpublished' | 'created' | 'edited' | 'deleted' | 'prereleased' | 'released';
  release: GitHubRelease;
}

// Union type for all payload types
export type GitHubSpecificPayload = 
  | GitHubPushPayload
  | GitHubPullRequestPayload
  | GitHubIssuesPayload
  | GitHubWorkflowRunPayload
  | GitHubReleasePayload;