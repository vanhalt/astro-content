import type { Command } from 'commander';
import { input } from '@inquirer/prompts';
import { join, resolve } from 'node:path';
import { detectAstroProject, getContentConfigPath } from '../../core/astro-detect.js';
import { customTemplatesDir } from '../../core/collections.js';
import { ensureDir, fileExists, writeTextFile } from '../../utils/fs.js';
import { error as logError, success, info, warn, debug } from '../../utils/logger.js';

function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function toIdentifier(name: string): string {
  const id = name
    .trim()
    .replace(/[^\w$]/g, '_')
    .replace(/^\d/, '_$&');
  return id || 'collection';
}

function starterConfig(collection: string): string {
  const id = toIdentifier(collection);
  return `import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const ${id} = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/${collection}' }),
});

export const collections = { ${id} };
`;
}

export function registerInit(program: Command): void {
  program
    .command('init [collection]')
    .description('Scaffold src/content/<collection>, .astro-content/templates, and a starter content config')
    .option('--force', 'Overwrite an existing content config')
    .action(async (collectionArg: string | undefined, cmdOpts: Record<string, unknown>, cmd: Command): Promise<void> => {
      const globals = cmd.optsWithGlobals<{ root?: string; config?: string; verbose?: boolean }>();
      const verbose = Boolean(globals.verbose);
      try {
        let collection = collectionArg;
        if (!collection && isInteractive()) {
          collection = await input({ message: 'Collection name:', default: 'blog' });
        }
        collection = collection?.trim() || 'blog';

        const project = await detectAstroProject(
          globals.root ? resolve(globals.root) : undefined,
          globals.config,
        );
        const root = project.root;
        debug(`init root: ${root} (isAstro: ${project.isAstro})`, verbose);
        if (!project.isAstro) {
          warn(`No astro.config.* found above ${root} — scaffolding anyway`);
        }

        const contentDir = join(root, 'src', 'content', collection);
        await ensureDir(contentDir);
        if (!(await fileExists(join(contentDir, '.gitkeep')))) {
          await writeTextFile(join(contentDir, '.gitkeep'), '');
        }

        const templatesDir = customTemplatesDir(root);
        await ensureDir(templatesDir);
        if (!(await fileExists(join(templatesDir, '.gitkeep')))) {
          await writeTextFile(join(templatesDir, '.gitkeep'), '');
        }

        const existing = getContentConfigPath(root);
        if (existing && !cmdOpts['force']) {
          info(`Keeping existing content config: ${existing}`);
        } else {
          const target = join(root, 'src', 'content.config.ts');
          await ensureDir(join(root, 'src'));
          await writeTextFile(target, starterConfig(collection));
          success(`Wrote ${target}`);
        }

        success(`Initialized collection "${collection}" in ${root}`);
      } catch (err) {
        logError(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
      }
    });
}
