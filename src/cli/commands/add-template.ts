import type { Command } from 'commander';
import { select } from '@inquirer/prompts';
import { basename, join } from 'node:path';
import { detectAstroProject } from '../../core/astro-detect.js';
import { BUILTIN_TEMPLATES, customTemplatesDir } from '../../core/collections.js';
import { resolveTemplate } from '../../core/templates.js';
import { ensureDir, fileExists, writeTextFile } from '../../utils/fs.js';
import { error as logError, success, debug } from '../../utils/logger.js';

function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export function registerAddTemplate(program: Command): void {
  program
    .command('add-template [name]')
    .description('Copy a built-in template into .astro-content/templates for customization')
    .option('--force', 'Overwrite an existing custom template')
    .action(async (nameArg: string | undefined, cmdOpts: Record<string, unknown>, cmd: Command): Promise<void> => {
      const globals = cmd.optsWithGlobals<{ root?: string; config?: string; verbose?: boolean }>();
      const verbose = Boolean(globals.verbose);
      try {
        let name = nameArg?.trim();
        if (!name) {
          if (!isInteractive()) {
            throw new Error(
              `Missing template name (expected one of: ${[...BUILTIN_TEMPLATES].join(', ')})`,
            );
          }
          name = await select({
            message: 'Template to customize:',
            choices: [...BUILTIN_TEMPLATES].map((t) => ({ name: t, value: t })),
          });
        }
        if (!BUILTIN_TEMPLATES.includes(name as (typeof BUILTIN_TEMPLATES)[number])) {
          throw new Error(`Unknown built-in template "${name}" (expected one of: ${[...BUILTIN_TEMPLATES].join(', ')})`);
        }

        const project = await detectAstroProject(globals.root);
        const resolved = await resolveTemplate(name, name, project.root);
        const target = join(customTemplatesDir(project.root), basename(resolved.origin));
        debug(`add-template ${name}: ${resolved.origin} -> ${target}`, verbose);

        if (!cmdOpts['force'] && (await fileExists(target))) {
          throw new Error(`Refusing to overwrite ${target} (pass --force to overwrite)`);
        }
        await ensureDir(customTemplatesDir(project.root));
        await writeTextFile(target, resolved.source);
        success(`Added custom template ${target}`);
      } catch (err) {
        logError(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
      }
    });
}
