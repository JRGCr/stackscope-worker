const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Logger } = require('../utils/logger');
const { Validator } = require('../utils/validation');

async function logsCommand(options) {
  try {
    Logger.header('StackScope Worker Logs');

    // Determine worker name from current directory
    const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
    let workerName;

    if (Validator.fileExists(wranglerPath)) {
      const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
      const nameMatch = wranglerContent.match(/name\s*=\s*"([^"]+)"/);
      workerName = nameMatch ? nameMatch[1] : null;
    }

    if (!workerName) {
      Logger.error('Could not determine worker name');
      Logger.info('Make sure you are in a StackScope worker directory');
      Logger.info('Or specify the worker name manually: wrangler tail <worker-name>');
      process.exit(1);
    }

    // Check prerequisites
    if (!Validator.isWranglerInstalled()) {
      Logger.error('Wrangler CLI not found');
      Logger.info('Install with: npm install -g wrangler');
      process.exit(1);
    }

    if (!await Validator.isWranglerAuthenticated()) {
      Logger.error('Not logged in to Cloudflare');
      Logger.info('Run: wrangler login');
      process.exit(1);
    }

    Logger.info(`Streaming logs for worker: ${workerName}`);
    Logger.info('Press Ctrl+C to stop');
    console.log();

    // Build wrangler tail command
    const args = ['tail', workerName];
    
    if (options.follow) {
      args.push('--follow');
    }

    args.push('--format', 'pretty');

    // Stream logs
    const tailProcess = spawn('wrangler', args, {
      stdio: 'inherit'
    });

    // Handle process termination
    process.on('SIGINT', () => {
      Logger.info('Stopping log stream...');
      tailProcess.kill('SIGINT');
    });

    const exitCode = await new Promise((resolve) => {
      tailProcess.on('close', resolve);
    });

    if (exitCode !== 0 && exitCode !== null) {
      Logger.error(`Log streaming failed with exit code: ${exitCode}`);
      process.exit(1);
    }

  } catch (error) {
    Logger.error(`Log streaming failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { logsCommand };