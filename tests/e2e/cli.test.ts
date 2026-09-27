import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, beforeAll } from 'vitest';

const CLI = new URL('../../dist/cli/index.js', import.meta.url).pathname;

function run(args: string[], cwd: string): { stdout: string; status: number } {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { stdout, status: 0 };
  } catch (err) {
    const e = err as { stdout?: string; status?: number };
    return { stdout: String(e.stdout ?? ''), status: e.status ?? 1 };
  }
}

function makeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'astro-content-e2e-'));
  writeFileSync(join(dir, 'astro.config.mjs'), 'export default {};\n');
  return dir;
}

describe('astro-content CLI (built dist)', () => {
  let project: string;

  beforeAll(() => {
    expect(existsSync(CLI), `built CLI missing at ${CLI} — run pnpm build first`).toBe(true);
    project = makeProject();
  });

  it('--help lists all commands', () => {
    const { stdout, status } = run(['--help'], project);
    expect(status).toBe(0);
    for (const name of ['generate', 'init', 'list', 'add-template']) {
      expect(stdout).toContain(name);
    }
  });

  it('init scaffolds content dir, templates dir, and starter config', () => {
    const { status } = run(['init', 'blog', '--root', project], project);
    expect(status).toBe(0);
    expect(existsSync(join(project, 'src', 'content', 'blog'))).toBe(true);
    expect(existsSync(join(project, 'src', 'content.config.ts'))).toBe(true);
    expect(existsSync(join(project, '.astro-content', 'templates'))).toBe(true);
  });

  it('generate --dry-run prints the target path without writing', () => {
    const { stdout, status } = run(
      ['generate', 'blog', 'Dry Run Post', '--root', project, '--dry-run'],
      project,
    );
    expect(status).toBe(0);
    expect(stdout).toContain(join('src', 'content', 'blog', 'dry-run-post.md'));
    expect(existsSync(join(project, 'src', 'content', 'blog', 'dry-run-post.md'))).toBe(false);
  });

  it('generate writes a markdown file with frontmatter', () => {
    const { status } = run(
      ['g', 'blog', 'Hello World', '--root', project, '--author', 'Ada', '--tags', 'astro,howto'],
      project,
    );
    expect(status).toBe(0);
    const file = join(project, 'src', 'content', 'blog', 'hello-world.md');
    expect(existsSync(file)).toBe(true);
    const body = readFileSync(file, 'utf8');
    expect(body).toContain('Hello World');
    expect(body).toContain('Ada');
  });

  it('generate refuses to overwrite without --force', () => {
    const args = ['generate', 'blog', 'Hello World', '--root', project];
    expect(run(args, project).status).toBe(1);
    expect(run([...args, '--force'], project).status).toBe(0);
  });

  it('generate --type yaml uses the data pipeline', () => {
    const { status } = run(
      ['generate', 'products', 'Gadget', '--root', project, '--type', 'yaml'],
      project,
    );
    expect(status).toBe(0);
    const file = join(project, 'src', 'content', 'products', 'gadget.yaml');
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toContain('title: "Gadget"');
  });

  it('list shows collections and templates; --json parses', () => {
    const { stdout, status } = run(['list', '--root', project, '--json'], project);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout) as { collections: { name: string }[]; templates: string[] };
    expect(parsed.collections.map((c) => c.name)).toContain('blog');
    expect(parsed.templates).toContain('blog-minimal');
  });

  it('add-template copies a built-in template for customization', () => {
    const { status } = run(['add-template', 'docs', '--root', project], project);
    expect(status).toBe(0);
    expect(existsSync(join(project, '.astro-content', 'templates', 'docs.md.hbs'))).toBe(true);
  });

  it('generate rejects an invalid --type', () => {
    const { status } = run(
      ['generate', 'blog', 'Bad Type', '--root', project, '--type', 'pdf'],
      project,
    );
    expect(status).toBe(1);
  });
});
