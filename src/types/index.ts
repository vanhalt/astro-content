export interface GenerateOptions {
  /** Target collection directory under src/content (required). */
  collection: string;
  title?: string;
  description?: string;
  /** ISO date (yyyy-MM-dd). Defaults to today. */
  date?: string;
  /** URL slug. Defaults to slugified title. */
  slug?: string;
  author?: string;
  /** Comma-separated string or array. Defaults to []. */
  tags?: string | string[];
  /** Defaults to false. */
  draft?: boolean;
  /** Output extension. Defaults to the template's own extension. */
  type?: 'md' | 'mdx' | 'json' | 'yaml' | 'yml';
  /** Template name (built-in or custom) or path to a .hbs file. */
  template?: string;
  /** Body content. Defaults to generated lorem-ipsum skeleton. */
  content?: string;
  /** Output directory. Defaults to <root>/src/content/<collection>. */
  outDir?: string;
  /** Overwrite an existing file. Defaults to false. */
  force?: boolean;
  /** Resolve the path without writing. Defaults to false. */
  dryRun?: boolean;
  /** Project root. Defaults to process.cwd() (or detected Astro root). */
  root?: string;
  /** Explicit path to astro.config.*. Overrides upward search. */
  config?: string;
  verbose?: boolean;
}

export interface CollectionInfo {
  name: string;
  source: 'content.config.ts' | 'content-dir' | 'fallback';
}

export interface AstroProjectInfo {
  root: string;
  configPath: string | null;
  isAstro: boolean;
}

export interface GenerateResult {
  filePath: string;
  slug: string;
  collection: string;
  template: string;
  dryRun: boolean;
}
