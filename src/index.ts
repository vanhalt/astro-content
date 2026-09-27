export type {
  GenerateOptions,
  GenerateResult,
  CollectionInfo,
  AstroProjectInfo,
} from './types/index.js';
export { generatePost, generateData } from './core/generator.js';
export { listCollections, listTemplates } from './core/collections.js';
export { detectAstroProject } from './core/astro-detect.js';
export { astroContent } from './integration/index.js';
