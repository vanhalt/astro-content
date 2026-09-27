import matter from 'gray-matter';

export interface ParsedFrontmatter<T = Record<string, unknown>> {
  data: T;
  content: string;
}

/** Serialize a data object to a `---`-fenced YAML frontmatter block (no body). */
export function buildFrontmatter(data: Record<string, unknown>): string {
  return matter.stringify('', data);
}

/** Serialize body content with a frontmatter header. */
export function stringifyWithFrontmatter(
  body: string,
  data: Record<string, unknown>,
): string {
  return matter.stringify(body, data);
}

/** Parse `---` frontmatter, returning data + body. Never throws on missing block. */
export function parseFrontmatter<T = Record<string, unknown>>(
  content: string,
): ParsedFrontmatter<T> {
  const parsed = matter(content);
  return { data: (parsed.data ?? {}) as T, content: parsed.content };
}
