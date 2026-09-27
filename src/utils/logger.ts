import chalk from 'chalk';

export function info(msg: string): void {
  console.log(chalk.blue('info'), msg);
}

export function success(msg: string): void {
  console.log(chalk.green('success'), msg);
}

export function warn(msg: string): void {
  console.warn(chalk.yellow('warn'), msg);
}

export function error(msg: string): void {
  console.error(chalk.red('error'), msg);
}

export function debug(msg: string, verbose?: boolean): void {
  if (verbose) console.log(chalk.gray('debug'), msg);
}
