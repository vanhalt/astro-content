# Example custom templates

Sample [Handlebars](https://handlebarsjs.com/) templates you can use with the
`astro-content` CLI. They are plain files — nothing is registered automatically.
Copy one into your Astro project or point `--template` at it directly.

Files:

- `recipe.md.hbs` — markdown post with extra frontmatter fields (`prepTime`,
  `cookTime`, `servings`). Template name after copying: `recipe`.
- `tutorial.mdx.hbs` — MDX tutorial page with component imports. Name: `tutorial`.
- `product.json.hbs` — JSON data record with extra fields (`sku`, `price`,
  `currency`, `inStock`). Name: `product`.

## Option A: use directly by path (no install)

```sh
# Preview without writing
node ./bin/astro-content.js generate recipes "Pancakes" --template docs/examples/recipe.md.hbs --dry-run

# Write the entry (defaults to <root>/src/content/<collection>/)
node ./bin/astro-content.js generate recipes "Pancakes" --template docs/examples/recipe.md.hbs --author Ada --tags breakfast,easy

# From inside your Astro project, with the library installed
npx astro-content generate tutorials "Hello MDX" --template ./docs/examples/tutorial.mdx.hbs --type mdx
npx astro-content generate products "Gadget" --template ./docs/examples/product.json.hbs --type json
```

## Option B: install as a named custom template

Copy the file into `<root>/.astro-content/templates/` (or run
`add-template` for a built-in first, then drop the file next to it).
The template name is the file name without the trailing format + `.hbs`
(`recipe.md.hbs` → `recipe`).

```sh
mkdir -p .astro-content/templates
cp docs/examples/recipe.md.hbs .astro-content/templates/
npx astro-content generate recipes "Pancakes" --template recipe
```

## Template variables and helpers

Every template receives:

| Variable      | Description                                        |
| ------------- | -------------------------------------------------- |
| `collection`  | Target collection name                             |
| `title`       | Entry title                                        |
| `description` | Entry description                                  |
| `date`        | Entry date (`YYYY-MM-DD`, defaults to today)       |
| `slug`        | URL slug (defaults to slugified title)             |
| `author`      | Author name (defaults to `Anonymous`)              |
| `tags`        | Array of tags (loop with `{{#each tags}}`)         |
| `draft`       | Boolean draft flag (use with the `json` helper)    |
| `body`        | Body content (flag `--content` or lorem skeleton)  |
| `draftYaml`   | `true`/`false` literal for YAML frontmatter        |
| `tagsInline`  | Tags as `"a", "b"` for inline YAML lists           |
| `year`        | Year derived from `date`                           |

Helpers: `{{json value}}` (JSON-encode, for `.json` templates),
`{{yq value}}` (YAML-safe double-quoted scalar, for frontmatter).

Notes:

- File naming matters: `<name>.<format>.hbs` (e.g. `recipe.md.hbs`) tells
  the CLI the default `--type` when it is omitted.
- `--type yaml|yml` ignores the template and emits a flat YAML record, so
  these samples cover `md`, `mdx`, and `json`. For YAML data, just run
  `generate <collection> <title> --type yaml` with any template name.
- Filenames follow the same precedence as all templates: explicit `.hbs`
  path > `.astro-content/templates/<name>` > built-ins (see `README.md`).
