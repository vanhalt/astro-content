import { defineConfig } from 'astro/config';
import { astroContent } from 'astro-content';

// Minimal Astro app used by the astro-content e2e suite (tests/e2e.test.ts).
export default defineConfig({
  integrations: [astroContent()],
});
