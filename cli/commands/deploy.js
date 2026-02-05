const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { Logger } = require('../utils/logger');
const { Validator } = require('../utils/validation');
const { ConfigManager } = require('../utils/config');

async function deployCommand(options) {
  try {
    Logger.header('StackScope Worker Deployment');

    const workingDir = path.resolve(options.directory);

    // Validate directory
    if (!Validator.directoryExists(workingDir)) {
      Logger.error(`Directory not found: ${workingDir}`);
      process.exit(1);
    }

    const wranglerPath = path.join(workingDir, 'wrangler.toml');
    if (!Validator.fileExists(wranglerPath)) {
      Logger.error('wrangler.toml not found');
      Logger.info('Make sure you are in a StackScope worker directory');
      Logger.info('Run: stackscope init <worker-name> to create a new worker');
      process.exit(1);
    }

    // Parse wrangler.toml to get worker name
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
    const nameMatch = wranglerContent.match(/name\s*=\s*"([^"]+)"/);
    const workerName = nameMatch ? nameMatch[1] : 'unknown';

    // Check prerequisites
    Logger.info('Running pre-deployment checks...');

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

    Logger.success('Prerequisites check passed');

    // Deploy with output capture
    Logger.info(`Deploying worker: ${workerName}`);

    let deployOutput = '';
    const deployProcess = spawn('wrangler', ['deploy'], {
      cwd: workingDir,
      stdio: ['inherit', 'pipe', 'pipe']
    });

    // Capture output while still showing it to user
    deployProcess.stdout.on('data', (data) => {
      const text = data.toString();
      deployOutput += text;
      process.stdout.write(text);
    });

    deployProcess.stderr.on('data', (data) => {
      const text = data.toString();
      deployOutput += text;
      process.stderr.write(text);
    });

    const exitCode = await new Promise((resolve) => {
      deployProcess.on('close', resolve);
    });

    if (exitCode !== 0) {
      Logger.error('Deployment failed');
      process.exit(1);
    }

    // Extract real worker URL from output
    const realWorkerUrl = ConfigManager.extractWorkerUrlFromWranglerOutput(deployOutput);
    
    if (realWorkerUrl) {
      // Save URL to config
      const workerInfo = ConfigManager.parseWorkerInfo(realWorkerUrl);
      if (workerInfo) {
        await ConfigManager.updateConfig({
          workerUrl: realWorkerUrl,
          workerName: workerInfo.workerName,
          subdomain: workerInfo.subdomain,
          endpoints: {
            browser: workerInfo.browserEndpoint,
            github: workerInfo.githubEndpoint,
            health: workerInfo.healthEndpoint,
            sdk: workerInfo.sdkEndpoint
          }
        }, workingDir);
        
        Logger.success('Deployment completed!');
        
        Logger.header('Deployment Summary');
        console.log(`Worker Name: ${workerInfo.workerName}`);
        console.log(`Worker URL: ${realWorkerUrl}`);
        console.log();
        console.log('Available endpoints:');
        console.log(`  • Browser logs: ${workerInfo.browserEndpoint}`);
        console.log(`  • GitHub webhook: ${workerInfo.githubEndpoint}`);
        console.log(`  • Health check: ${workerInfo.healthEndpoint}`);
        console.log(`  • SDK provider: ${workerInfo.sdkEndpoint}`);
        console.log();
        console.log('Next steps:');
        console.log('  1. Test the deployment: stackscope status');
        console.log('  2. Configure GitHub webhook with the URL above');
        console.log('  3. Use in your frontend with:');
        console.log(`     init({ workerUrl: '${realWorkerUrl}' })`);
        console.log();
      }
    } else {
      // Fallback if URL extraction failed
      Logger.success('Deployment completed!');
      Logger.warn('Could not automatically detect worker URL from deployment output');
      Logger.info('You can find your worker URL in the Cloudflare dashboard');
      Logger.info('Or run: stackscope status -w <your-worker-url>');
    }

  } catch (error) {
    Logger.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { deployCommand };