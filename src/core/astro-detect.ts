import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import type { AstroProjectInfo } from '../types/index.js';

const CONFIG_NAMES = [
  'astro.config.mjs',
  'astro.config.ts',
  'astro.config.js',
  'astro.config.cjs',
  'astro.config.mts',
  'astro.config.cts',
] as const;

/** Walk up from `start` looking for an astro.config.* file. Returns null when none. */
export function findAstroConfigUp(start: string): string | null {
  let dir = resolve(start);
  for (;;) {
    for (const name of CONFIG_NAMES) {
      const candidate = join(dir, name);
      if (existsSync(candidate)) return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Detect the Astro project for a working directory.
 *
 * @param startDir  directory to start from (defaults to process.cwd()).
 *   When no config is found walking up, this directory becomes `root`.
 * @param explicitConfig  explicit `--config` path; resolved against startDir/cwd.
 */
export async function detectAstroProject(
  startDir?: string,
  explicitConfig?: string,
): Promise<AstroProjectInfo> {
  const start = resolve(startDir ?? process.cwd());

  if (explicitConfig) {
    const configPath = resolve(start, explicitConfig);
    const isAstro =
      existsSync(configPath) && basename(configPath).startsWith('astro.config.');
    return { root: start, configPath: existsSync(configPath) ? configPath : null, isAstro };
  }

  const configPath = findAstroConfigUp(start);
  if (!configPath) return { root: start, configPath: null, isAstro: false };
  return { root: dirname(configPath), configPath, isAstro: true };
}

/** Candidate content-config paths for a project root (new + legacy locations). */
export function getContentConfigPath(root: string): string | null {
  const candidates = [join(root, 'src', 'content.config.ts'), join(root, 'src', 'content', 'config.ts')];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Extract collection names from `src/content.config.ts` source text.
 * Handles `name: defineCollection({...})` entries and `collections = { a, b }` maps.
 */
export function parseCollectionNames(source: string): string[] {
  const names = new Set<string>();
  const defineRe = /([A-Za-z_][\w$]*)\s*:\s*defineCollection\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = defineRe.exec(source)) !== null) names.add(match[1]);

  const mapRe = /(?:export\s+)?(?:const|let|var)\s+collections\s*=\s*\{([^}]*)\}/s;
  const mapMatch = mapRe.exec(source);
  if (mapMatch) {
    // Split on commas so a trailing entry like `{ blog, docs }` (identifier
    // followed by whitespace + `}`, not `,`/`:`) is still recognized, and
    // spread entries (`...x`) are skipped instead of misread.
    for (const part of mapMatch[1].split(',')) {
      const key = /^\s*([A-Za-z_][\w$]*)/.exec(part);
      if (key) names.add(key[1]);
    }
  }
  return [...names];
}
