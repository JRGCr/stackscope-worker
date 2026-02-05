const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const { Logger } = require('../utils/logger');
const { Validator } = require('../utils/validation');
const { TemplateManager } = require('../utils/template');

async function initCommand(workerName, options) {
  try {
    Logger.header('StackScope Worker Initialization');

    // Validate worker name
    if (!Validator.isValidWorkerName(workerName)) {
      Logger.error(`Invalid worker name: ${workerName}`);
      Logger.info('Worker names must be lowercase alphanumeric with hyphens, 1-63 characters');
      process.exit(1);
    }

    // Check if directory already exists
    const targetDir = path.resolve(workerName);
    if (fs.existsSync(targetDir)) {
      Logger.warn(`Directory ${workerName} already exists`);
      
      if (!options.yes) {
        const { overwrite } = await inquirer.prompt([{
          type: 'confirm',
          name: 'overwrite',
          message: 'Do you want to overwrite it?',
          default: false
        }]);
        
        if (!overwrite) {
          Logger.info('Initialization cancelled');
          process.exit(0);
        }
      }
      
      await fs.remove(targetDir);
    }

    // Gather configuration
    const config = { workerName };

    // Check if we have command line options for non-interactive mode
    if (options.accountId && options.githubRepo) {
      // Non-interactive mode with provided options
      config.accountId = options.accountId;
      config.githubRepo = options.githubRepo;
      config.installDependencies = !options.noInstall;
      Logger.info('Using provided configuration options');
    } else if (options.yes) {
      // Non-interactive mode with placeholder defaults
      config.accountId = 'your-cloudflare-account-id';
      config.githubRepo = 'your-github/repository';
      config.installDependencies = !options.noInstall;
      Logger.warn('Using placeholder configuration - update wrangler.toml after init');
      Logger.info('Set your Cloudflare Account ID in wrangler.toml');
      Logger.info('Configure your GitHub repository in worker configuration');
    } else {
      // Interactive mode
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'accountId',
          message: 'Cloudflare Account ID (find at dash.cloudflare.com):',
          validate: (input) => {
            if (!input.trim()) return 'Account ID is required';
            if (!Validator.isValidCloudflareAccountId(input.trim())) {
              return 'Invalid Account ID format (must be 32 hex characters)';
            }
            return true;
          },
          filter: (input) => input.trim()
        },
        {
          type: 'input',
          name: 'githubRepo',
          message: 'GitHub repository (owner/repo):',
          validate: (input) => {
            if (!input.trim()) return 'GitHub repository is required';
            if (!Validator.isValidGitHubRepo(input.trim())) {
              return 'Invalid repository format (must be owner/repo)';
            }
            return true;
          },
          filter: (input) => input.trim()
        },
        {
          type: 'confirm',
          name: 'installDependencies',
          message: 'Install dependencies automatically?',
          default: true
        }
      ]);

      Object.assign(config, answers);
    }

    // Check prerequisites
    Logger.info('Checking prerequisites...');
    
    if (!Validator.isWranglerInstalled()) {
      Logger.error('Wrangler CLI not found');
      Logger.info('Install with: npm install -g wrangler');
      process.exit(1);
    }
    Logger.success('Wrangler CLI found');

    if (!await Validator.isWranglerAuthenticated()) {
      Logger.warn('Not logged in to Cloudflare');
      Logger.info('Run: wrangler login');
      
      if (!options.yes) {
        const { login } = await inquirer.prompt([{
          type: 'confirm',
          name: 'login',
          message: 'Do you want to login now?',
          default: true
        }]);
        
        if (login) {
          const { spawn } = require('child_process');
          const loginProcess = spawn('wrangler', ['login'], { stdio: 'inherit' });
          await new Promise((resolve) => loginProcess.on('close', resolve));
        }
      }
    } else {
      Logger.success('Already logged in to Cloudflare');
    }

    // Copy template
    Logger.info('Creating worker from template...');
    await TemplateManager.copyTemplate(targetDir, config);
    await TemplateManager.updatePackageJson(targetDir, config);

    // Install dependencies
    if (config.installDependencies !== false) {
      Logger.info('Installing dependencies...');
      const { spawn } = require('child_process');
      const npmProcess = spawn('npm', ['install'], { 
        cwd: targetDir,
        stdio: 'inherit'
      });
      await new Promise((resolve) => npmProcess.on('close', resolve));
    }

    // Success summary
    Logger.header('Setup Complete!');
    
    Logger.info('Next steps:');
    console.log();
    console.log(`  1. Set GitHub webhook secret:`);
    console.log(`     cd ${workerName}`);
    console.log(`     wrangler secret put GITHUB_WEBHOOK_SECRET`);
    console.log();
    console.log(`  2. Deploy the worker:`);
    console.log(`     stackscope deploy`);
    console.log(`     (This will show you the real worker URL)`);
    console.log();
    console.log(`  3. Configure GitHub webhook:`);
    if (config.githubRepo) {
      console.log(`     Go to: https://github.com/${config.githubRepo}/settings/hooks`);
    } else {
      console.log(`     Go to your GitHub repo settings -> Webhooks`);
    }
    console.log(`     Use the URLs shown after deployment`);
    console.log(`     Content type: application/json`);
    console.log(`     Secret: (same as GITHUB_WEBHOOK_SECRET)`);
    console.log();
    console.log(`  4. Use in your frontend:`);
    console.log(`     npm install stackscope`);
    console.log(`     import { init } from 'stackscope';`);
    console.log(`     init({ workerUrl: 'https://your-deployed-worker.workers.dev' });`);
    console.log(`     (Use the actual URL from step 2)`);
    console.log();

  } catch (error) {
    Logger.error(`Initialization failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { initCommand };