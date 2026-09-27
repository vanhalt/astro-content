import { globby } from 'globby';
import { basename, extname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { CollectionInfo } from '../types/index.js';
import {
  detectAstroProject,
  getContentConfigPath,
  parseCollectionNames,
} from './astro-detect.js';

export const BUILTIN_TEMPLATES = [
  'blog-minimal',
  'blog-rich',
  'docs',
  'changelog',
  'data-product',
] as const;

/** Custom per-project template dir: `<root>/.astro-content/templates/`. */
export function customTemplatesDir(root: string): string {
  return join(root, '.astro-content', 'templates');
}

/** Strip template + format extensions: `my-post.md.hbs` -> `my-post`. */
export function templateDisplayName(filePath: string): string {
  let base = basename(filePath);
  if (base.endsWith('.hbs')) base = base.slice(0, -'.hbs'.length);
  const ext = extname(base);
  if (['.md', '.mdx', '.json', '.yaml', '.yml'].includes(ext)) {
    base = base.slice(0, -ext.length);
  }
  return base;
}

/**
 * List collections for a project root:
 * 1. parse `src/content.config.ts` (or legacy `src/content/config.ts`);
 * 2. fall back to `src/content/*` directories (globby);
 * 3. empty array when neither exists.
 */
export async function listCollections(root?: string): Promise<CollectionInfo[]> {
  const project = await detectAstroProject(root);
  const base = project.root;

  const configPath = getContentConfigPath(base);
  if (configPath) {
    const source = await readFile(configPath, 'utf8');
    const names = parseCollectionNames(source);
    if (names.length > 0) {
      return names.map((name) => ({ name, source: 'content.config.ts' as const }));
    }
  }

  const contentDir = join(base, 'src', 'content');
  if (existsSync(contentDir)) {
    const dirs = await globby(['*'], {
      cwd: contentDir,
      onlyDirectories: true,
      expandDirectories: false,
    });
    if (dirs.length > 0) {
      return dirs.map((name) => ({ name, source: 'content-dir' as const }));
    }
  }

  return [];
}

/** Built-in template names plus custom ones from `.astro-content/templates/`. */
export async function listTemplates(root?: string): Promise<string[]> {
  const project = await detectAstroProject(root);
  const names = new Set<string>(BUILTIN_TEMPLATES as readonly string[]);
  const dir = customTemplatesDir(project.root);
  if (existsSync(dir)) {
    const files = await globby(['**/*.hbs'], { cwd: dir });
    for (const file of files) names.add(templateDisplayName(file));
  }
  return [...names].sort();
}
