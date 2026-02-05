const fs = require('fs');
const path = require('path');

class Validator {
  static isValidWorkerName(name) {
    // Cloudflare worker names must be alphanumeric with hyphens
    const pattern = /^[a-z0-9-]+$/;
    return pattern.test(name) && name.length <= 63 && name.length >= 1;
  }

  static isValidCloudflareAccountId(accountId) {
    // Cloudflare account IDs are 32 character hex strings
    const pattern = /^[a-f0-9]{32}$/;
    return pattern.test(accountId);
  }

  static isValidGitHubRepo(repo) {
    // Format: owner/repo
    const pattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
    return pattern.test(repo);
  }

  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static directoryExists(dirPath) {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  }

  static fileExists(filePath) {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  }

  static isWranglerInstalled() {
    try {
      require('child_process').execSync('wrangler --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  static async isWranglerAuthenticated() {
    try {
      require('child_process').execSync('wrangler whoami', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { Validator };