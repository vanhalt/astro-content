import { Command } from 'commander';
import { registerGenerate } from './commands/generate.js';
import { registerInit } from './commands/init.js';
import { registerList } from './commands/list.js';
import { registerAddTemplate } from './commands/add-template.js';

const program = new Command();

program
  .name('astro-content')
  .description('Generate content/posts/data with skeleton data for Astro projects')
  .version('0.0.1')
  .option('--root <dir>', 'Project root (defaults to the detected Astro root or cwd)')
  .option('--config <path>', 'Explicit path to astro.config.*')
  .option('--verbose', 'Verbose debug logging');

program.showHelpAfterError('(add --help for usage)');

registerGenerate(program);
registerInit(program);
registerList(program);
registerAddTemplate(program);

await program.parseAsync(process.argv);
