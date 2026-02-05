#!/usr/bin/env node

const { program } = require('commander');
const { initCommand } = require('../cli/commands/init');
const { deployCommand } = require('../cli/commands/deploy');
const { statusCommand } = require('../cli/commands/status');
const { logsCommand } = require('../cli/commands/logs');

program
  .name('stackscope-worker')
  .description('StackScope Worker CLI - Deploy your own private logging infrastructure with Cloudflare Workers')
  .version('1.1.0');

program
  .command('init')
  .description('Initialize a new StackScope worker from template')
  .argument('<worker-name>', 'Name for your worker directory')
  .option('-y, --yes', 'Skip interactive prompts and use defaults')
  .option('-a, --account-id <id>', 'Cloudflare Account ID')
  .option('-r, --github-repo <repo>', 'GitHub repository (owner/repo format)')
  .option('--no-install', 'Skip dependency installation')
  .action(initCommand);

program
  .command('deploy')
  .description('Deploy your StackScope worker to Cloudflare')
  .option('-d, --directory <dir>', 'Worker directory path', '.')
  .action(deployCommand);

program
  .command('status')
  .description('Check worker health and test endpoints')
  .option('-w, --worker-url <url>', 'Worker URL to check (auto-detected if not provided)')
  .action(statusCommand);

program
  .command('logs')
  .description('Stream real-time logs from your worker')
  .option('-f, --follow', 'Follow log output continuously')
  .option('-n, --lines <number>', 'Number of recent lines to show', '50')
  .action(logsCommand);

program.parse();