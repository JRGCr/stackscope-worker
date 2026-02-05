const fs = require('fs-extra');
const path = require('path');
const { Logger } = require('./logger');

class TemplateManager {
  static getTemplatePath() {
    return path.join(__dirname, '../../templates/worker');
  }

  static async copyTemplate(targetDir, config) {
    const templatePath = this.getTemplatePath();
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    // Create target directory
    await fs.ensureDir(targetDir);

    // Copy template files
    await fs.copy(templatePath, targetDir, {
      filter: (src) => {
        // Skip node_modules and build artifacts
        return !src.includes('node_modules') && 
               !src.includes('.wrangler') &&
               !src.includes('dist');
      }
    });

    // Update wrangler.toml with user's config
    await this.updateWranglerConfig(targetDir, config);

    Logger.success(`Worker template copied to ${targetDir}`);
  }

  static async updateWranglerConfig(targetDir, config) {
    const wranglerPath = path.join(targetDir, 'wrangler.toml');
    
    if (!fs.existsSync(wranglerPath)) {
      throw new Error(`wrangler.toml not found at: ${wranglerPath}`);
    }

    let content = await fs.readFile(wranglerPath, 'utf-8');
    
    // Update worker name
    content = content.replace(
      /name\s*=\s*"[^"]*"/,
      `name = "${config.workerName}"`
    );

    // Update account ID if provided
    if (config.accountId) {
      if (content.includes('account_id')) {
        content = content.replace(
          /account_id\s*=\s*"[^"]*"/,
          `account_id = "${config.accountId}"`
        );
      } else {
        // Add account_id after name
        content = content.replace(
          /(name\s*=\s*"[^"]*"\n)/,
          `$1account_id = "${config.accountId}"\n`
        );
      }
    }

    await fs.writeFile(wranglerPath, content);
    Logger.success('Updated wrangler.toml configuration');
  }

  static async updatePackageJson(targetDir, config) {
    const packagePath = path.join(targetDir, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      return; // Skip if no package.json
    }

    const packageJson = await fs.readJson(packagePath);
    packageJson.name = `${config.workerName}-worker`;
    
    await fs.writeJson(packagePath, packageJson, { spaces: 2 });
    Logger.success('Updated package.json');
  }
}

module.exports = { TemplateManager };