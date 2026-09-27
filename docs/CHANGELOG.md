# Changelog

All notable changes to `astro-content` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Standard npm toolchain: removed `mise.toml`, `pnpm-workspace.yaml`, and
  `pnpm-lock.yaml` in favor of plain npm (`npm install` / `npm run build` /
  `npm run test:e2e`, `package-lock.json`, npm `workspaces` for `test-app`).
- CI (`.github/workflows/build.yml`) now uses `actions/setup-node` with the
  npm cache and `npm ci` instead of mise + pnpm. This also fixes the build
  failure caused by passing `mise_toml: mise.toml` to `jdx/mise-action`,
  which overwrote `mise.toml` with that literal string.
- Release scripts use npm (`prepublishOnly`, `release`, `release:dry` via
  `npm pack --dry-run`); README and `docs/examples` show standard `sh` +
  npm/npx commands.

## [0.0.1] — Initial release

First public release: a CLI plus programmatic API that generates
content/posts/data with skeleton data inside existing Astro projects.
Fish + pnpm + mise friendly, TypeScript ESM throughout.

### CLI (`astro-content` binary)

- `generate [collection] [title]` (aliases `g`, `new`): render a content entry
  from a template into `src/content/<collection>/<slug>.<ext>`, creating
  directories as needed. Full flag set: `--title`, `--collection`, `--slug`
  (defaults to slugified title), `--description` (defaults to a lorem-ipsum
  excerpt), `--date` (defaults to today), `--author`, `--tags`
  (comma-separated), `--draft` / `--no-draft`, `--type`
  (`md | mdx | json | yaml | yml`, defaults to the template format),
  `--template` (built-in name, custom name, or explicit `.hbs` path),
  `--content` (defaults to a lorem-ipsum skeleton), `--outDir`, `--force`,
  `--dry-run`. Positional `collection`/`title` fall back to interactive
  prompts on a TTY and fail fast in scripts.
- `init [collection]`: detect the Astro project (`astro.config.*`) and
  scaffold a missing `src/content.config.ts` with `blog` + `docs` collections;
  creates `.astro-content/templates/` for custom templates with a confirmation
  prompt.
- `list [target]` (alias `ls`): list detected collections (parsed from
  `src/content.config.ts`, falling back to `src/content/*`) and available
  templates, with `--json` output.
- `add-template [name]`: copy a built-in template into
  `.astro-content/templates/` for customization (`--force` to overwrite).
- Global flags on every command: `--root <dir>`, `--config <path>`,
  `--verbose`, mirroring Astro CLI conventions.

### Templates

- Five built-ins in `src/templates/`: `blog-minimal` (md), `blog-rich` (mdx,
  with component imports and image placeholder), `docs` (md), `changelog`
  (md), `data-product` (json). Handlebars engine with `json` and `yq`
  helpers, gray-matter-validated frontmatter.
- Custom-template resolution order: explicit `.hbs` path >
  `<root>/.astro-content/templates/<name>` > built-ins.
- `docs/examples/` ships three sample custom templates with a usage guide:
  `recipe.md.hbs`, `tutorial.mdx.hbs`, `product.json.hbs`.

### Astro integration

- `astroContent()` integration exported from the package root; hooks
  `astro:config:setup` and logs the detected collections.
- After generation, auto-runs `pnpm exec astro sync` when Astro is detected
  (warns on failure, never fails generation).
- Non-Astro projects are handled gracefully: warn but allow `--outDir`.

### Programmatic API

- Typed exports from `src/index.ts`: `generatePost`, `generateData`,
  `listCollections`, `listTemplates`, `detectAstroProject`, plus the
  `GenerateOptions` type.
- `import { generatePost } from 'astro-content'` works against the built
  `dist/index.js` ESM bundle with type declarations.

### Tooling and packaging

- Toolchain: `mise.toml` pins Node LTS + pnpm latest; pnpm-only
  (`pnpm-lock.yaml`, `packageManager: pnpm@12.5.1`, `engines: node >= 20`);
  fish shell assumed everywhere (fish completions in
  `completions/astro-content.fish`, fish-compatible docs and examples).
- Build via tsup to `dist/` (`dist/index.js`, `dist/cli/index.js` + `.d.ts`);
  templates copied to `dist/templates`. Published files: `bin`, `dist`,
  `completions`.
- All dependencies pinned to exact versions in `package.json`.
- Release scripts: `prepublishOnly` (`pnpm build && pnpm test:e2e` gate),
  `release` (`pnpm publish --access public`), `release:dry`
  (`pnpm publish --dry-run`).
- CI: `.github/workflows/build.yml` runs install (frozen lockfile), build,
  and e2e on push to `main`, PRs, and manual dispatch, and uploads
  `dist` + `bin` + `completions` as the `astro-content-dist` artifact.

### Testing

- `pnpm test:e2e` (vitest, 18 tests): MD generation with flags, MDX output,
  `--date now` ISO handling, auto-slug from title, `--dry-run` writes
  nothing, `init` scaffolding, `list` output, programmatic API, and
  `astro sync` / `astro build` passing in `test-app/` (minimal Astro 5 app
  wired via workspace link).
