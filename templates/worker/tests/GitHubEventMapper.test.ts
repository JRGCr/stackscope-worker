import { describe, it, expect, beforeEach } from 'vitest';
import { GitHubEventMapper } from '../src/infrastructure/mappers/GitHubEventMapper';
import { GitHubPushPayload, GitHubPullRequestPayload, GitHubWorkflowRunPayload } from '../src/domain/types/GitHubTypes';

describe('GitHubEventMapper', () => {
  let mapper: GitHubEventMapper;

  const basePayload = {
    repository: {
      id: 123,
      name: 'test-repo',
      full_name: 'owner/test-repo',
      owner: { login: 'owner', id: 1 },
      private: false,
      html_url: 'https://github.com/owner/test-repo'
    },
    sender: { login: 'sender', id: 2 },
    organization: { login: 'org' }
  };

  beforeEach(() => {
    mapper = new GitHubEventMapper();
  });

  describe('extractMetadata', () => {
    it('should extract common metadata from payload', () => {
      const metadata = mapper.extractMetadata(basePayload as any);

      expect(metadata.type).toBe('github_event');
      expect(metadata.repo).toBe('test-repo');
      expect(metadata.repoId).toBe(123);
      expect(metadata.repoFullName).toBe('owner/test-repo');
      expect(metadata.owner).toBe('owner');
      expect(metadata.actor).toBe('sender');
      expect(metadata.private).toBe(false);
      expect(metadata.organization).toBe('org');
    });
  });

  describe('mapToLogEntries - push event', () => {
    it('should map push event to log entries', () => {
      const pushPayload: GitHubPushPayload = {
        ...basePayload,
        ref: 'refs/heads/main',
        before: 'abc123',
        after: 'def456',
        created: false,
        deleted: false,
        forced: false,
        pusher: { name: 'pusher' },
        commits: [
          {
            id: 'commit1',
            message: 'First commit\nDetails here',
            author: { name: 'author1' },
            committer: { name: 'committer1' },
            added: ['file1.ts'],
            modified: ['file2.ts'],
            removed: []
          }
        ]
      } as GitHubPushPayload;

      const entries = mapper.mapToLogEntries(pushPayload, 'push');

      expect(entries.length).toBe(2); // Main push + 1 commit
      expect(entries[0].level).toBe('info');
      expect(entries[0].msg).toContain('Push to main');
      expect(entries[0].source).toBe('github');
      expect(entries[0].meta?.branch).toBe('main');
      expect(entries[0].meta?.commitCount).toBe(1);

      expect(entries[1].level).toBe('debug');
      expect(entries[1].msg).toContain('First commit');
      expect(entries[1].meta?.sha).toBe('commit1');
    });

    it('should handle multiple commits', () => {
      const pushPayload: GitHubPushPayload = {
        ...basePayload,
        ref: 'refs/heads/feature',
        before: 'abc',
        after: 'def',
        created: false,
        deleted: false,
        forced: false,
        pusher: { name: 'pusher' },
        commits: [
          { id: 'c1', message: 'Commit 1', author: { name: 'a' }, committer: { name: 'c' }, added: [], modified: [], removed: [] },
          { id: 'c2', message: 'Commit 2', author: { name: 'a' }, committer: { name: 'c' }, added: [], modified: [], removed: [] },
          { id: 'c3', message: 'Commit 3', author: { name: 'a' }, committer: { name: 'c' }, added: [], modified: [], removed: [] }
        ]
      } as GitHubPushPayload;

      const entries = mapper.mapToLogEntries(pushPayload, 'push');

      expect(entries.length).toBe(4); // 1 main + 3 commits
      expect(entries[0].msg).toContain('3 commits');
    });
  });

  describe('mapToLogEntries - pull_request event', () => {
    it('should map pull request opened event', () => {
      const prPayload: GitHubPullRequestPayload = {
        ...basePayload,
        action: 'opened',
        pull_request: {
          number: 42,
          title: 'Add new feature',
          state: 'open',
          merged: false,
          html_url: 'https://github.com/owner/test-repo/pull/42',
          base: { ref: 'main' },
          head: { ref: 'feature-branch', sha: 'sha123' }
        }
      } as GitHubPullRequestPayload;

      const entries = mapper.mapToLogEntries(prPayload, 'pull_request');

      expect(entries.length).toBe(1);
      expect(entries[0].level).toBe('info');
      expect(entries[0].msg).toContain('#42');
      expect(entries[0].msg).toContain('Add new feature');
      expect(entries[0].meta?.pullRequestNumber).toBe(42);
      expect(entries[0].meta?.baseBranch).toBe('main');
      expect(entries[0].meta?.headBranch).toBe('feature-branch');
    });
  });

  describe('mapToLogEntries - workflow_run event', () => {
    it('should map failed workflow to error level', () => {
      const workflowPayload: GitHubWorkflowRunPayload = {
        ...basePayload,
        action: 'completed',
        workflow: { id: 1, name: 'CI' },
        workflow_run: {
          id: 100,
          run_number: 5,
          head_branch: 'main',
          head_sha: 'sha123',
          status: 'completed',
          conclusion: 'failure',
          html_url: 'https://github.com/owner/test-repo/actions/runs/100'
        }
      } as GitHubWorkflowRunPayload;

      const entries = mapper.mapToLogEntries(workflowPayload, 'workflow_run');

      expect(entries.length).toBe(1);
      expect(entries[0].level).toBe('error');
      expect(entries[0].msg).toContain('CI');
      expect(entries[0].meta?.conclusion).toBe('failure');
    });

    it('should map successful workflow to info level', () => {
      const workflowPayload: GitHubWorkflowRunPayload = {
        ...basePayload,
        action: 'completed',
        workflow: { id: 1, name: 'CI' },
        workflow_run: {
          id: 100,
          run_number: 5,
          head_branch: 'main',
          head_sha: 'sha123',
          status: 'completed',
          conclusion: 'success',
          html_url: 'https://github.com/owner/test-repo/actions/runs/100'
        }
      } as GitHubWorkflowRunPayload;

      const entries = mapper.mapToLogEntries(workflowPayload, 'workflow_run');

      expect(entries[0].level).toBe('info');
    });
  });

  describe('mapToLogEntries - generic event', () => {
    it('should handle unknown event types gracefully', () => {
      const entries = mapper.mapToLogEntries(basePayload as any, 'star' as any);

      expect(entries.length).toBe(1);
      expect(entries[0].level).toBe('info');
      expect(entries[0].msg).toContain('GitHub star');
    });
  });
});
