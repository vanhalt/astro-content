import { LoremIpsum } from 'lorem-ipsum';

const lorem = new LoremIpsum({
  sentencesPerParagraph: { max: 6, min: 3 },
  wordsPerSentence: { max: 12, min: 5 },
});

/** One or more lorem-ipsum paragraphs joined by blank lines. */
export function skeletonParagraphs(count = 3): string {
  return lorem.generateParagraphs(count);
}

/** A short lorem-ipsum excerpt (default 2 sentences), useful for descriptions. */
export function skeletonExcerpt(sentences = 2): string {
  return lorem.generateSentences(sentences);
}

/** A markdown skeleton body: `# <title>` followed by lorem-ipsum paragraphs. */
export function skeletonBody(title = 'Hello', paragraphs = 3): string {
  return `# ${title}\n\n${skeletonParagraphs(paragraphs)}\n`;
}
