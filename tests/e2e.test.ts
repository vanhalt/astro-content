import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, beforeAll } from 'vitest';

const ROOT = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const CLI = join(ROOT, 'dist', 'cli', 'index.js');
const TEST_APP = join(ROOT, 'test-app');

function runCli(args: string[], cwd: string): { out: string; status: number } {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { out: stdout, status: 0 };
  } catch (err) {
    const e = err as { stdout?: unknown; stderr?: unknown; status?: number };
    return { out: `${e.stdout ?? ''}${e.stderr ?? ''}`, status: e.status ?? 1 };
  }
}

/** Local YYYY-MM-DD (independent of the date-fns formatting in src). */
function todayLocal(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function makeAstroProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'astro-content-stage4-'));
  writeFileSync(join(dir, 'astro.config.mjs'), 'export default {};\n');
  return dir;
}

function writeContentConfig(dir: string): void {
  const config = `import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
});

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
});

export const collections = { blog, docs };
`;
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, 'src', 'content.config.ts'), config);
}

describe('stage 4 e2e (built dist)', () => {
  beforeAll(() => {
    expect(existsSync(CLI), `built CLI missing at ${CLI} — run npm run build first`).toBe(true);
  });

  it('MD generate honors flags (title/author/tags/description/draft/slug)', () => {
    const project = makeAstroProject();
    const { status } = runCli(
      [
        'generate', 'blog', '--title', 'Flag Post', '--slug', 'flag-post',
        '--description', 'Custom desc', '--author', 'Ada',
        '--tags', 'astro,howto', '--draft', '--root', project,
      ],
      project,
    );
    expect(status).toBe(0);
    const file = join(project, 'src', 'content', 'blog', 'flag-post.md');
    expect(existsSync(file)).toBe(true);
    const body = readFileSync(file, 'utf8');
    expect(body).toContain('Flag Post');
    expect(body).toContain('Custom desc');
    expect(body).toContain('Ada');
    expect(body).toContain('astro');
    expect(body).toContain('draft: true');
  });

  it('MDX type writes a .mdx file', () => {
    const project = makeAstroProject();
    const { status } = runCli(
      ['generate', 'blog', 'MDX Post', '--root', project, '--type', 'mdx', '--template', 'blog-rich'],
      project,
    );
    expect(status).toBe(0);
    const file = join(project, 'src', 'content', 'blog', 'mdx-post.mdx');
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toContain('MDX Post');
  });

  it('default date is today (ISO) and --date passes through', () => {
    const project = makeAstroProject();
    expect(runCli(['generate', 'blog', 'Dated Post', '--root', project], project).status).toBe(0);
    const auto = readFileSync(join(project, 'src', 'content', 'blog', 'dated-post.md'), 'utf8');
    expect(auto).toContain(todayLocal());

    expect(
      runCli(['generate', 'blog', 'Old Post', '--root', project, '--date', '2020-05-04'], project)
        .status,
    ).toBe(0);
    const explicit = readFileSync(join(project, 'src', 'content', 'blog', 'old-post.md'), 'utf8');
    expect(explicit).toContain('2020-05-04');
  });

  it('slug is derived from the title when --slug is omitted', () => {
    const project = makeAstroProject();
    const { status } = runCli(['generate', 'blog', 'Hello, Big World!', '--root', project], project);
    expect(status).toBe(0);
    expect(existsSync(join(project, 'src', 'content', 'blog', 'hello-big-world.md'))).toBe(true);
  });

  it('--dry-run prints the path and writes nothing', () => {
    const project = makeAstroProject();
    const { out, status } = runCli(
      ['generate', 'blog', 'Ghost Post', '--root', project, '--dry-run'],
      project,
    );
    expect(status).toBe(0);
    expect(out).toContain(join('src', 'content', 'blog', 'ghost-post.md'));
    expect(existsSync(join(project, 'src', 'content', 'blog', 'ghost-post.md'))).toBe(false);
  });

  it('init creates a content config plus content dirs', () => {
    const project = makeAstroProject();
    const { status } = runCli(['init', 'docs', '--root', project], project);
    expect(status).toBe(0);
    const config = join(project, 'src', 'content.config.ts');
    expect(existsSync(config)).toBe(true);
    expect(readFileSync(config, 'utf8')).toContain('docs');
    expect(existsSync(join(project, 'src', 'content', 'docs'))).toBe(true);
  });

  it('list shows collections from the content config', () => {
    const project = makeAstroProject();
    writeContentConfig(project);
    const { out, status } = runCli(['list', 'collections', '--root', project], project);
    expect(status).toBe(0);
    expect(out).toContain('blog');
    expect(out).toContain('docs');
  });

  it('programmatic API generates entries and lists collections', async () => {
    const { generatePost, generateData, listCollections } = await import('../dist/index.js') as {
      generatePost: (o: Record<string, unknown>) => Promise<string>;
      generateData: (o: Record<string, unknown>) => Promise<string>;
      listCollections: (root?: string) => Promise<{ name: string }[]>;
    };
    const project = makeAstroProject();
    writeContentConfig(project);

    const md = await generatePost({ collection: 'blog', title: 'API Post', root: project });
    expect(md).toBe(join(project, 'src', 'content', 'blog', 'api-post.md'));
    expect(readFileSync(md, 'utf8')).toContain('API Post');

    const dry = await generatePost({
      collection: 'blog', title: 'Never Written', root: project, dryRun: true,
    });
    expect(existsSync(dry)).toBe(false);

    const yaml = await generateData({
      collection: 'products', title: 'Widget', root: project, type: 'yaml',
    });
    expect(existsSync(yaml)).toBe(true);

    const names = (await listCollections(project)).map((c) => c.name);
    expect(names).toContain('blog');
    expect(names).toContain('docs');
  });

  it('astro sync + build pass in test-app (incl. a CLI-generated entry)', { timeout: 300_000 }, () => {
    const slug = 'e2e-generated-post';
    const generated = join(TEST_APP, 'src', 'content', 'blog', `${slug}.md`);
    const gen = runCli(
      ['generate', 'blog', 'E2E Generated Post', '--root', TEST_APP, '--slug', slug, '--force'],
      ROOT,
    );
    expect(gen.status).toBe(0);
    try {
      execFileSync('npm', ['--prefix', TEST_APP, 'exec', '--', 'astro', 'sync'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 180_000,
      });
      execFileSync('npm', ['--prefix', TEST_APP, 'exec', '--', 'astro', 'build'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 240_000,
      });
      expect(existsSync(join(TEST_APP, 'dist', 'index.html'))).toBe(true);
      const html = readFileSync(join(TEST_APP, 'dist', 'index.html'), 'utf8');
      expect(html).toContain('E2E Generated Post');
      expect(html).toContain('Seed Post');
    } finally {
      rmSync(generated, { force: true });
    }
  });
});
