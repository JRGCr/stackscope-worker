const https = require('https');
const http = require('http');
const { Logger } = require('../utils/logger');
const { Validator } = require('../utils/validation');
const { ConfigManager } = require('../utils/config');

async function statusCommand(options) {
  try {
    Logger.header('StackScope Worker Status');

    let workerUrl = options.workerUrl;

    // If no URL provided, try to detect from saved config
    if (!workerUrl) {
      const config = await ConfigManager.loadConfig();
      
      if (config.workerUrl) {
        workerUrl = config.workerUrl;
        Logger.info(`Using saved worker URL: ${workerUrl}`);
      } else {
        // Fallback: try to detect from current directory
        const fs = require('fs');
        const path = require('path');
        const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
        
        if (fs.existsSync(wranglerPath)) {
          const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
          const nameMatch = wranglerContent.match(/name\s*=\s*"([^"]+)"/);
          
          if (nameMatch) {
            const workerName = nameMatch[1];
            Logger.warn(`Worker URL not found in config for: ${workerName}`);
            Logger.info('Deploy the worker first with: stackscope deploy');
          }
        }
      }
    }

    if (!workerUrl) {
      Logger.error('Worker URL not provided and could not auto-detect');
      Logger.info('Usage: stackscope status -w <your-worker-url>');
      Logger.info('Or run from a deployed worker directory');
      Logger.info('Deploy first with: stackscope deploy');
      process.exit(1);
    }

    // Validate URL
    if (!Validator.isValidUrl(workerUrl)) {
      Logger.error(`Invalid worker URL: ${workerUrl}`);
      process.exit(1);
    }

    // Remove trailing slash
    workerUrl = workerUrl.replace(/\/$/, '');

    Logger.info(`Checking worker status: ${workerUrl}`);

    // Check health endpoint
    const healthUrl = `${workerUrl}/health`;
    
    try {
      const healthResponse = await makeRequest(healthUrl);
      
      if (healthResponse.status === 200) {
        Logger.success('Worker is healthy');
        
        try {
          const healthData = JSON.parse(healthResponse.body);
          console.log();
          console.log('Health Details:');
          console.log(`  Status: ${healthData.status || 'ok'}`);
          console.log(`  Timestamp: ${healthData.timestamp || 'N/A'}`);
          console.log(`  Environment: ${healthData.environment || 'N/A'}`);
        } catch {
          // Health endpoint doesn't return JSON, just 200 OK
          console.log('  Basic health check passed');
        }
      } else {
        Logger.error(`Health check failed: ${healthResponse.status}`);
      }
    } catch (error) {
      Logger.error(`Failed to connect to worker: ${error.message}`);
    }

    // Check endpoints
    console.log();
    Logger.info('Available endpoints:');
    console.log(`  • Health: ${workerUrl}/health`);
    console.log(`  • Browser logs: ${workerUrl}/webhook/browser`);
    console.log(`  • GitHub webhook: ${workerUrl}/webhook/github`);
    console.log(`  • SDK provider: ${workerUrl}/sdk`);

    // Test a browser log endpoint (should reject without proper payload)
    console.log();
    Logger.info('Testing browser log endpoint...');
    
    try {
      const browserResponse = await makeRequest(`${workerUrl}/webhook/browser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'connectivity' })
      });

      if (browserResponse.status === 400 || browserResponse.status === 422) {
        Logger.success('Browser log endpoint is responding (rejected test payload as expected)');
      } else {
        Logger.warn(`Browser log endpoint returned unexpected status: ${browserResponse.status}`);
      }
    } catch (error) {
      Logger.error(`Browser log endpoint test failed: ${error.message}`);
    }

  } catch (error) {
    Logger.error(`Status check failed: ${error.message}`);
    process.exit(1);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

module.exports = { statusCommand };