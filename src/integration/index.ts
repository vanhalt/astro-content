import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { listCollections } from '../core/collections.js';

/**
 * Astro integration: logs the detected content collections once
 * the Astro config is set up.
 */
export function astroContent(): AstroIntegration {
  return {
    name: 'astro-content',
    hooks: {
      'astro:config:setup': async ({ logger, config }) => {
        const root = typeof config.root === 'string' ? config.root : fileURLToPath(config.root);
        const collections = await listCollections(resolve(root));
        if (collections.length === 0) {
          logger.warn('astro-content: no content collections detected');
        } else {
          logger.info(
            `astro-content: ${collections.length} collection(s): ${collections.map((c) => c.name).join(', ')}`,
          );
        }
      },
    },
  };
}
