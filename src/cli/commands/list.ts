import type { Command } from 'commander';
import { listCollections, listTemplates } from '../../core/collections.js';
import { error as logError } from '../../utils/logger.js';

const TARGETS = ['all', 'collections', 'templates'] as const;

export function registerList(program: Command): void {
  program
    .command('list [target]')
    .aliases(['ls'])
    .description('List collections and templates (target: all, collections, templates)')
    .option('--json', 'Output as JSON')
    .action(async (targetArg: string | undefined, cmdOpts: Record<string, unknown>, cmd: Command): Promise<void> => {
      const globals = cmd.optsWithGlobals<{ root?: string; config?: string; verbose?: boolean }>();
      try {
        const target = targetArg ?? 'all';
        if (!TARGETS.includes(target as (typeof TARGETS)[number])) {
          throw new Error(`Invalid target "${target}" (expected one of: ${TARGETS.join(', ')})`);
        }
        const root = globals.root;
        const showCollections = target === 'all' || target === 'collections';
        const showTemplates = target === 'all' || target === 'templates';

        const collections = showCollections ? await listCollections(root) : [];
        const templates = showTemplates ? await listTemplates(root) : [];

        if (cmdOpts['json']) {
          console.log(JSON.stringify({ collections, templates }, null, 2));
          return;
        }

        if (showCollections) {
          console.log('Collections:');
          if (collections.length === 0) console.log('  (none)');
          for (const c of collections) console.log(`  ${c.name} [${c.source}]`);
        }
        if (showTemplates) {
          console.log('Templates:');
          if (templates.length === 0) console.log('  (none)');
          for (const t of templates) console.log(`  ${t}`);
        }
      } catch (err) {
        logError(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
      }
    });
}
