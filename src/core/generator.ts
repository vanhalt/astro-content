import Handlebars from 'handlebars';
import { format } from 'date-fns';
import { join, resolve } from 'node:path';
import type { GenerateOptions } from '../types/index.js';
import { toSlug } from './slugify.js';
import { skeletonBody, skeletonExcerpt } from './skeleton.js';
import { detectAstroProject } from './astro-detect.js';
import { resolveTemplate } from './templates.js';
import { ensureDir, fileExists, writeTextFile } from '../utils/fs.js';

export type OutputType = 'md' | 'mdx' | 'json' | 'yaml' | 'yml';

Handlebars.registerHelper('json', (value: unknown) => JSON.stringify(value ?? null));
/** YAML-safe double-quoted scalar (JSON strings are valid YAML scalars). */
Handlebars.registerHelper('yq', (value: unknown) => JSON.stringify(String(value ?? '')));

function yamlScalar(value: unknown): string {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return JSON.stringify(String(value));
}

/** Minimal YAML dump for the flat data records generateData(type=yaml) emits. */
function dumpSimpleYaml(record: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) lines.push(`  - ${yamlScalar(item)}`);
      }
    } else {
      lines.push(`${key}: ${yamlScalar(value)}`);
    }
  }
  return lines.join('\n') + '\n';
}

/** Normalize `tags` (comma string or array) to a string array. */
export function normalizeTags(tags?: string | string[]): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean);
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export interface NormalizedEntry {
  collection: string;
  title: string;
  description: string;
  date: string;
  slug: string;
  author: string;
  tags: string[];
  draft: boolean;
  body: string;
  ext: OutputType;
  outDir: string;
  filePath: string;
}

const DEFAULT_POST_TEMPLATE = 'blog-minimal';
const DEFAULT_DATA_TEMPLATE = 'data-product';

/** Resolve the effective project root for generation options. */
export async function resolveRoot(rootOpt?: string): Promise<string> {
  if (rootOpt) return resolve(rootOpt);
  return (await detectAstroProject()).root;
}

/** Fill defaults (slug/date/tags/draft/body/paths). Pure — performs no I/O. */
export async function normalizeEntry(
  options: GenerateOptions,
  defaultTemplate: string,
): Promise<NormalizedEntry> {
  if (!options.collection?.trim()) throw new Error('options.collection is required');
  const root = await resolveRoot(options.root);

  const title = options.title?.trim() || 'Untitled';
  const slug = options.slug?.trim() || toSlug(title) || 'untitled';
  const date = options.date?.trim() || format(new Date(), 'yyyy-MM-dd');
  const tags = normalizeTags(options.tags);
  const draft = options.draft ?? false;
  const author = options.author?.trim() || 'Anonymous';
  const body = options.content ?? skeletonBody(title);
  const description = options.description?.trim() || skeletonExcerpt(1);

  const template = await resolveTemplate(options.template, defaultTemplate, root);
  const ext = (options.type ?? template.formatExt ?? 'md') as OutputType;

  const outDir = options.outDir ? resolve(options.outDir) : join(root, 'src', 'content', options.collection);
  const filePath = join(outDir, `${slug}.${ext}`);
  return {
    collection: options.collection,
    title,
    description,
    date,
    slug,
    author,
    tags,
    draft,
    body,
    ext,
    outDir,
    filePath,
  };
}

function renderTemplate(source: string, entry: NormalizedEntry): string {
  const template = Handlebars.compile(source, { strict: false });
  return template({
    ...entry,
    /** `draft` stays boolean (for `json`); `draftYaml` is the frontmatter literal. */
    draftYaml: entry.draft ? 'true' : 'false',
    tagsInline: entry.tags.map((t) => JSON.stringify(t)).join(', '),
    year: entry.date.slice(0, 4),
  });
}

async function generate(
  options: GenerateOptions,
  defaultTemplate: string,
): Promise<string> {
  const entry = await normalizeEntry(options, defaultTemplate);

  let content: string;
  if (entry.ext === 'yaml' || entry.ext === 'yml') {
    content = dumpSimpleYaml({
      title: entry.title,
      description: entry.description,
      date: entry.date,
      author: entry.author,
      tags: entry.tags,
      slug: entry.slug,
      draft: entry.draft,
    });
  } else {
    const root = await resolveRoot(options.root);
    const template = await resolveTemplate(options.template, defaultTemplate, root);
    content = renderTemplate(template.source, entry);
  }

  if (options.dryRun) return entry.filePath;
  if (!options.force && (await fileExists(entry.filePath))) {
    throw new Error(`Refusing to overwrite ${entry.filePath} (pass force: true to overwrite)`);
  }
  await ensureDir(entry.outDir);
  await writeTextFile(entry.filePath, content);
  return entry.filePath;
}

/** Generate a content entry (md/mdx/json/yaml) from a template. Returns the file path. */
export async function generatePost(options: GenerateOptions): Promise<string> {
  return generate(options, DEFAULT_POST_TEMPLATE);
}

/** Generate a data entry (defaults to the data-product template). Returns the file path. */
export async function generateData(options: GenerateOptions): Promise<string> {
  return generate(options, DEFAULT_DATA_TEMPLATE);
}
