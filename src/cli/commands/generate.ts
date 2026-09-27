import type { Command } from 'commander';
import { input, select } from '@inquirer/prompts';
import { generateData, generatePost } from '../../core/generator.js';
import { listCollections } from '../../core/collections.js';
import { error as logError, success, info, debug } from '../../utils/logger.js';
import type { GenerateOptions } from '../../types/index.js';

const DATA_TYPES = new Set(['json', 'yaml', 'yml']);
const VALID_TYPES = ['md', 'mdx', 'json', 'yaml', 'yml'] as const;

interface GlobalOpts {
  root?: string;
  config?: string;
  verbose?: boolean;
}

function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export function registerGenerate(program: Command): void {
  program
    .command('generate [collection] [title]')
    .aliases(['g', 'new'])
    .description('Generate a content entry from a template')
    .option('--title <title>', 'Entry title (positional [title] also works)')
    .option('--collection <name>', 'Target collection (positional [collection] also works)')
    .option('--slug <slug>', 'URL slug (defaults to slugified title)')
    .option('--description <text>', 'Entry description (defaults to a lorem-ipsum excerpt)')
    .option('--date <date>', 'Entry date YYYY-MM-DD (defaults to today)')
    .option('--author <name>', 'Author name')
    .option('--tags <tags>', 'Comma-separated tags')
    .option('--draft', 'Mark the entry as a draft')
    .option('--no-draft', 'Mark the entry as published')
    .option('--type <ext>', 'Output type: md, mdx, json, yaml, yml (defaults to the template format)')
    .option('--template <name>', 'Template name or path to a .hbs file')
    .option('--content <text>', 'Body content (defaults to a lorem-ipsum skeleton)')
    .option('--outDir <dir>', 'Output directory (defaults to <root>/src/content/<collection>)')
    .option('--force', 'Overwrite an existing file')
    .option('--dry-run', 'Print the target path without writing')
    .action(
      async (
        collectionArg: string | undefined,
        titleArg: string | undefined,
        cmdOpts: Record<string, unknown>,
        cmd: Command,
      ): Promise<void> => {
        const globals = cmd.optsWithGlobals<GlobalOpts>();
        const root = (globals.root as string | undefined) ?? process.cwd();
        const verbose = Boolean(globals.verbose);
        try {
          const type = cmdOpts['type'] as string | undefined;
          if (type && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
            throw new Error(`Invalid --type "${type}" (expected one of: ${VALID_TYPES.join(', ')})`);
          }

          let collection = (cmdOpts['collection'] as string | undefined) ?? collectionArg;
          if (!collection) {
            if (!isInteractive()) throw new Error('Missing collection (pass [collection] or --collection)');
            const known = await listCollections(root);
            collection =
              known.length > 0
                ? await select({
                    message: 'Collection:',
                    choices: known.map((c) => ({ name: c.name, value: c.name })),
                  })
                : await input({ message: 'Collection name:', default: 'blog' });
          }

          let title = (cmdOpts['title'] as string | undefined) ?? titleArg;
          if (!title && isInteractive()) {
            title = await input({ message: 'Title:', default: 'Untitled' });
          }

          const options: GenerateOptions = {
            collection,
            title,
            description: cmdOpts['description'] as string | undefined,
            date: cmdOpts['date'] as string | undefined,
            slug: cmdOpts['slug'] as string | undefined,
            author: cmdOpts['author'] as string | undefined,
            tags: cmdOpts['tags'] as string | undefined,
            draft: cmdOpts['draft'] as boolean | undefined,
            type: type as GenerateOptions['type'],
            template: cmdOpts['template'] as string | undefined,
            content: cmdOpts['content'] as string | undefined,
            outDir: cmdOpts['outDir'] as string | undefined,
            force: cmdOpts['force'] as boolean | undefined,
            dryRun: (cmdOpts['dryRun'] ?? cmdOpts['dry-run']) as boolean | undefined,
            root: globals.root,
            config: globals.config,
            verbose,
          };
          debug(`generate options: ${JSON.stringify({ ...options, content: options.content?.slice(0, 40) })}`, verbose);

          const run = type && DATA_TYPES.has(type) ? generateData : generatePost;
          const filePath = await run(options);
          if (options.dryRun) info(`Would write ${filePath}`);
          else success(`Created ${filePath}`);
        } catch (err) {
          logError(err instanceof Error ? err.message : String(err));
          process.exitCode = 1;
        }
      },
    );
}
