const fs = require('fs-extra');
const path = require('path');
const { Logger } = require('./logger');

class ConfigManager {
  static getConfigPath(workingDir = process.cwd()) {
    const stackscopeDir = path.join(workingDir, '.stackscope');
    return path.join(stackscopeDir, 'config.json');
  }

  static async ensureConfigDir(workingDir = process.cwd()) {
    const stackscopeDir = path.join(workingDir, '.stackscope');
    await fs.ensureDir(stackscopeDir);
    return stackscopeDir;
  }

  static async loadConfig(workingDir = process.cwd()) {
    const configPath = this.getConfigPath(workingDir);
    
    if (!fs.existsSync(configPath)) {
      return {};
    }

    try {
      return await fs.readJson(configPath);
    } catch (error) {
      Logger.warn(`Failed to load config: ${error.message}`);
      return {};
    }
  }

  static async saveConfig(config, workingDir = process.cwd()) {
    await this.ensureConfigDir(workingDir);
    const configPath = this.getConfigPath(workingDir);
    
    try {
      await fs.writeJson(configPath, config, { spaces: 2 });
    } catch (error) {
      Logger.error(`Failed to save config: ${error.message}`);
      throw error;
    }
  }

  static async updateConfig(updates, workingDir = process.cwd()) {
    const currentConfig = await this.loadConfig(workingDir);
    const newConfig = { ...currentConfig, ...updates };
    await this.saveConfig(newConfig, workingDir);
    return newConfig;
  }

  static extractWorkerUrlFromWranglerOutput(output) {
    // Pattern to match Cloudflare Worker URLs from wrangler deploy output
    const patterns = [
      // Current wrangler output format
      /Published\s+[\w-]+\s+\([\d.]+s\)\s+(https:\/\/[\w-]+\.[\w-]+\.workers\.dev)/i,
      // Alternative formats
      /https:\/\/[\w-]+\.[\w-]+\.workers\.dev/g,
      // Deployment URL format
      /Deployment\s+URL:\s+(https:\/\/[\w-]+\.[\w-]+\.workers\.dev)/i,
      // Preview URL format  
      /Preview\s+URL:\s+(https:\/\/[\w-]+\.[\w-]+\.workers\.dev)/i
    ];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        // Extract the URL from the match
        const url = match[1] || match[0];
        if (url && url.includes('workers.dev')) {
          return url.trim();
        }
      }
    }

    return null;
  }

  static parseWorkerInfo(workerUrl) {
    if (!workerUrl || !workerUrl.includes('workers.dev')) {
      return null;
    }

    try {
      const url = new URL(workerUrl);
      const hostParts = url.hostname.split('.');
      
      if (hostParts.length >= 3 && hostParts[hostParts.length - 2] === 'workers') {
        const workerName = hostParts[0];
        const subdomain = hostParts.slice(1, -2).join('.');
        
        return {
          workerName,
          subdomain,
          fullUrl: workerUrl,
          browserEndpoint: `${workerUrl}/webhook/browser`,
          githubEndpoint: `${workerUrl}/webhook/github`,
          healthEndpoint: `${workerUrl}/health`,
          sdkEndpoint: `${workerUrl}/sdk`
        };
      }
    } catch (error) {
      Logger.debug(`Failed to parse worker URL: ${error.message}`);
    }

    return null;
  }
}

module.exports = { ConfigManager };