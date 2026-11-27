import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext adapter config for Cloudflare Workers.
 *
 * No incremental cache override: every page reads the student's own data
 * through the proxy and nothing uses ISR or `'use cache'`, so an R2 cache would
 * have nothing to hold. Add one here (and its binding in wrangler.jsonc) if a
 * statically revalidated page is ever introduced.
 */
export default defineCloudflareConfig({});
