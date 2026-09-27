# astro-content

Generate content entries (posts, docs, changelog, data records) with skeleton
data for existing Astro projects.

## Prerequisites

- Node.js >= 20
- npm (ships with Node.js)

```sh
node --version
npm --version
```

## Installation

```sh
npm install
npm run build
npm install astro-content
```

Run the CLI from source after building:

```sh
npm run build
node ./dist/cli/index.js --help
./bin/astro-content.js --help
```

## CLI

Global flags (work on every command): `--root <dir>`, `--config <path>`,
`--verbose`.

```sh
# Scaffold a collection in the current project
astro-content init blog --root ~/sites/my-blog

# Generate a post (positional args or flags)
astro-content generate blog "Hello World" --author Ada --tags astro,howto
astro-content g blog --title "Hello World" --draft
astro-content new blog "Second Post" --type mdx --template blog-rich --force

# Preview without writing
astro-content generate blog "Draft Idea" --dry-run

# Data records pick the data template for json/yaml output
astro-content generate products "Gadget" --type yaml --template data-product

# Inspect the project
astro-content list
astro-content ls collections --json
astro-content list templates --root ~/sites/my-blog

# Copy a built-in template into .astro-content/templates and edit it
astro-content add-template blog-rich
```

Missing `collection`/`title` values are prompted interactively when the
terminal is a TTY; in scripts pass every flag (non-TTY runs fail fast instead
of hanging on a prompt).

### `generate` flags

| Flag | Description |
| --- | --- |
| `[collection]` / `--collection` | Target collection (required) |
| `[title]` / `--title` | Entry title (defaults to `Untitled`) |
| `--slug` | URL slug (defaults to slugified title) |
| `--description` | Entry description (defaults to a lorem-ipsum excerpt) |
| `--date` | Entry date `YYYY-MM-DD` (defaults to today) |
| `--author` | Author name (defaults to `Anonymous`) |
| `--tags` | Comma-separated tags (defaults to none) |
| `--draft` / `--no-draft` | Draft flag (defaults to published) |
| `--type` | `md`, `mdx`, `json`, `yaml`, `yml` (defaults to the template format) |
| `--template` | Template name or path to a `.hbs` file |
| `--content` | Body content (defaults to a lorem-ipsum skeleton) |
| `--outDir` | Output dir (defaults to `<root>/src/content/<collection>`) |
| `--force` | Overwrite an existing file |
| `--dry-run` | Print the target path without writing |

Without `--force`, generating over an existing file fails instead of
overwriting it. `--type json|yaml|yml` uses the data pipeline
(`generateData`); other types use `generatePost`.

## Templates

Built-in templates: `blog-minimal` (md), `blog-rich` (mdx), `docs` (md),
`changelog` (md), `data-product` (json).

Template resolution order:

1. Explicit path to a `.hbs` file (`--template ./my-post.md.hbs`).
2. Custom project templates in `<root>/.astro-content/templates/<name>.*.hbs`.
3. Built-in `src/templates/`.

## Programmatic API

```ts
import { generatePost, generateData, listCollections, listTemplates } from 'astro-content';

const file = await generatePost({
  collection: 'blog',
  title: 'Hello World',
  tags: 'astro,howto',
  draft: true,
  root: process.cwd(),
});

const dataFile = await generateData({
  collection: 'products',
  title: 'Gadget',
  type: 'yaml',
});

console.log(await listCollections(process.cwd()));
console.log(await listTemplates(process.cwd()));
```

## Astro integration

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { astroContent } from 'astro-content';

export default defineConfig({
  integrations: [astroContent()],
});
```

The integration logs the detected content collections during
`astro:config:setup` (warns when none are found).

## Custom templates

```sh
astro-content add-template docs --root ~/sites/my-blog
```

This copies the built-in `docs` template to
`<root>/.astro-content/templates/docs.md.hbs`. Edit the Handlebars source —
available fields are `title`, `description`, `date`, `slug`, `author`, `tags`,
`tagsInline`, `draft`, `draftYaml`, `body`, `year`, plus the `json` and `yq`
helpers — then generate with `--template docs`.

## Shell completions

Fish completions ship with the package in `completions/astro-content.fish`.

## Development

```sh
npm install
npm run build
npm run test:e2e
```

`npm run test:e2e` runs the reusable vitest suite (`tests/e2e.test.ts` plus
`tests/e2e/`). The suite generates entries into temp dirs, drives the
programmatic API, and runs `astro sync` + `astro build` inside `test-app/`
(a minimal Astro app with `blog` + `docs` collections, linked to the local
library via the npm workspace). To run the Astro checks by hand:

```sh
npm --prefix test-app exec -- astro sync
npm --prefix test-app exec -- astro build
```
