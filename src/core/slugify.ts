import slugify from 'slugify';

/** Slugify free text: lowercase, strict (strips punctuation), hyphen-separated. */
export function toSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true });
}
