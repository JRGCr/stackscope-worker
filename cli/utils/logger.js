const chalk = require('chalk');

class Logger {
  static info(message) {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message) {
    console.log(chalk.green('✓'), message);
  }

  static warn(message) {
    console.log(chalk.yellow('⚠'), message);
  }

  static error(message) {
    console.log(chalk.red('✗'), message);
  }

  static debug(message) {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🔍'), message);
    }
  }

  static header(title) {
    console.log();
    console.log(chalk.blue.bold('═'.repeat(60)));
    console.log(chalk.blue.bold(`  ${title}`));
    console.log(chalk.blue.bold('═'.repeat(60)));
    console.log();
  }
}

module.exports = { Logger };