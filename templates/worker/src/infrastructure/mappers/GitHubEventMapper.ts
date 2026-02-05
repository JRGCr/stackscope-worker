import { IGitHubEventMapper } from '../../domain/interfaces/IGitHubWebhookProcessor';
import { LogEntry, LogLevel } from '../../domain/types';
import { 
  GitHubWebhookPayload, 
  GitHubEventType, 
  GitHubPushPayload, 
  GitHubPullRequestPayload,
  GitHubIssuesPayload,
  GitHubWorkflowRunPayload,
  GitHubReleasePayload 
} from '../../domain/types/GitHubTypes';

export class GitHubEventMapper implements IGitHubEventMapper {

  mapToLogEntries(payload: GitHubWebhookPayload, eventType: GitHubEventType): LogEntry[] {
    const baseLog: Partial<LogEntry> = {
      ts: new Date().toISOString(),
      source: 'github',
      meta: this.extractMetadata(payload)
    };

    switch (eventType) {
      case 'push':
        return this.mapPushEvent(payload as GitHubPushPayload, baseLog);
      
      case 'pull_request':
        return this.mapPullRequestEvent(payload as GitHubPullRequestPayload, baseLog);
      
      case 'issues':
        return this.mapIssuesEvent(payload as GitHubIssuesPayload, baseLog);
      
      case 'workflow_run':
        return this.mapWorkflowRunEvent(payload as GitHubWorkflowRunPayload, baseLog);
      
      case 'release':
        return this.mapReleaseEvent(payload as GitHubReleasePayload, baseLog);
      
      default:
        return this.mapGenericEvent(payload, eventType, baseLog);
    }
  }

  extractMetadata(payload: GitHubWebhookPayload): Record<string, unknown> {
    return {
      type: 'github_event',
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

  private mapPushEvent(payload: GitHubPushPayload, baseLog: Partial<LogEntry>): LogEntry[] {
    const logs: LogEntry[] = [];
    const branch = payload.ref.replace('refs/heads/', '');
    const commitCount = payload.commits.length;

    // Main push event
    logs.push({
      ...baseLog,
      level: 'info' as LogLevel,
      msg: `Push to ${branch}: ${commitCount} commit${commitCount !== 1 ? 's' : ''}`,
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
    } as LogEntry);

    // Individual commit logs
    payload.commits.forEach(commit => {
      logs.push({
        ...baseLog,
        level: 'debug' as LogLevel,
        msg: `Commit: ${commit.message.split('\n')[0]}`,
        meta: {
          ...baseLog.meta,
          type: 'commit',
          sha: commit.id,
          branch,
          author: commit.author.name,
          committer: commit.committer.name,
          filesChanged: commit.added.length + commit.modified.length + commit.removed.length,
          additions: commit.added.length,
          deletions: commit.removed.length
        }
      } as LogEntry);
    });

    return logs;
  }

  private mapPullRequestEvent(payload: GitHubPullRequestPayload, baseLog: Partial<LogEntry>): LogEntry[] {
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
    } as LogEntry];
  }

  private mapIssuesEvent(payload: GitHubIssuesPayload, baseLog: Partial<LogEntry>): LogEntry[] {
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
        labels: issue.labels.map(label => label.name),
        url: issue.html_url
      }
    } as LogEntry];
  }

  private mapWorkflowRunEvent(payload: GitHubWorkflowRunPayload, baseLog: Partial<LogEntry>): LogEntry[] {
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
        workflowStatus: run.status,
        conclusion: run.conclusion,
        url: run.html_url
      }
    } as LogEntry];
  }

  private mapReleaseEvent(payload: GitHubReleasePayload, baseLog: Partial<LogEntry>): LogEntry[] {
    const release = payload.release;
    const level = this.getReleaseLogLevel(payload.action);

    return [{
      ...baseLog,
      level,
      msg: `Release ${payload.action}: ${release.tag_name} ${release.name || ''}`,
      meta: {
        ...baseLog.meta,
        releaseTag: release.tag_name,
        branch: release.target_commitish,
        draft: release.draft,
        prerelease: release.prerelease,
        url: release.html_url
      }
    } as LogEntry];
  }

  private mapGenericEvent(payload: GitHubWebhookPayload, eventType: GitHubEventType, baseLog: Partial<LogEntry>): LogEntry[] {
    return [{
      ...baseLog,
      level: 'info' as LogLevel,
      msg: `GitHub ${eventType}${payload.action ? ` ${payload.action}` : ''} event`,
      meta: {
        ...baseLog.meta,
        eventType
      }
    } as LogEntry];
  }

  private getPullRequestLogLevel(action: string): LogLevel {
    switch (action) {
      case 'opened':
      case 'reopened':
        return 'info';
      case 'closed':
        return 'info';
      case 'synchronize':
        return 'debug';
      default:
        return 'debug';
    }
  }

  private getIssuesLogLevel(action: string): LogLevel {
    switch (action) {
      case 'opened':
        return 'info';
      case 'closed':
        return 'info';
      default:
        return 'debug';
    }
  }

  private getWorkflowLogLevel(status: string, conclusion: string | null): LogLevel {
    if (status === 'completed') {
      switch (conclusion) {
        case 'success':
          return 'info';
        case 'failure':
        case 'timed_out':
          return 'error';
        case 'cancelled':
        case 'skipped':
          return 'warn';
        default:
          return 'info';
      }
    }
    return 'debug';
  }

  private getReleaseLogLevel(action: string): LogLevel {
    switch (action) {
      case 'published':
      case 'released':
        return 'info';
      case 'deleted':
        return 'warn';
      default:
        return 'debug';
    }
  }
}