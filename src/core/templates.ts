import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { globby } from 'globby';
import { readTextFile } from '../utils/fs.js';
import { customTemplatesDir } from './collections.js';

export interface ResolvedTemplate {
  /** Name used for reporting (e.g. `blog-minimal`, `my-post`). */
  name: string;
  /** Raw handlebars source. */
  source: string;
  /** File the source was loaded from (built-in, custom, or explicit path). */
  origin: string;
  /** Format extension hint from the file name (md, mdx, json, yaml...). */
  formatExt: string | null;
}

const BUILTIN_FILES: Record<string, string> = {
  'blog-minimal': 'blog-minimal.md.hbs',
  'blog-rich': 'blog-rich.mdx.hbs',
  docs: 'docs.md.hbs',
  changelog: 'changelog.md.hbs',
  'data-product': 'data-product.json.hbs',
};

function formatExtOf(fileName: string): string | null {
  const m = /\.([^.]+)\.hbs$/.exec(fileName);
  return m ? m[1] : null;
}

function builtinCandidates(fileName: string): string[] {
  const here = dirname(fileURLToPath(import.meta.url));
  return [
    // Built CLI: templates are copied to dist/templates (bundle lives in dist/).
    join(here, 'templates', fileName),
    // Source runs (vitest, tsx): src/core/../templates.
    join(here, '..', 'templates', fileName),
    join(here, '..', '..', 'src', 'templates', fileName),
    join(process.cwd(), 'src', 'templates', fileName),
  ];
}

async function loadBuiltin(name: string): Promise<ResolvedTemplate> {
  const fileName = BUILTIN_FILES[name];
  if (!fileName) throw new Error(`Unknown built-in template: ${name}`);
  for (const candidate of builtinCandidates(fileName)) {
    if (existsSync(candidate)) {
      return { name, source: await readTextFile(candidate), origin: candidate, formatExt: formatExtOf(fileName) };
    }
  }
  throw new Error(
    `Built-in template "${name}" not found (looked in ${builtinCandidates(fileName).join(', ')})`,
  );
}

/**
 * Resolve a template by name or file path.
 *
 * Precedence: explicit file path > `<root>/.astro-content/templates/<name>.*`
 * > built-in `src/templates/`.
 */
export async function resolveTemplate(
  template: string | undefined,
  fallbackName: string,
  root: string,
): Promise<ResolvedTemplate> {
  const name = template ?? fallbackName;

  // Explicit path to a .hbs file.
  const asPath = resolve(root, name);
  if (name.endsWith('.hbs') && existsSync(asPath)) {
    return {
      name: basenameNoExt(asPath),
      source: await readTextFile(asPath),
      origin: asPath,
      formatExt: formatExtOf(asPath),
    };
  }

  // Custom project templates: <name>.* (md/mdx/json/yaml + hbs).
  const dir = customTemplatesDir(root);
  if (existsSync(dir)) {
    const matches = await globby([`${name}.*.hbs`, `${name}.hbs`], { cwd: dir });
    if (matches.length > 0) {
      const origin = join(dir, matches.sort()[0]);
      return {
        name,
        source: await readTextFile(origin),
        origin,
        formatExt: formatExtOf(matches.sort()[0]),
      };
    }
  }

  return loadBuiltin(name);
}

function basenameNoExt(p: string): string {
  const base = p.split('/').pop() ?? p;
  return base.replace(/\.hbs$/, '');
}
