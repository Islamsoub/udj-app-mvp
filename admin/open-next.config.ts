import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext adapter config for Cloudflare Workers.
 *
 * No incremental cache override: every route is rendered per request (the
 * root layout awaits connection() so proxy.ts's CSP nonce reaches every
 * page), and nothing uses ISR or `'use cache'`, so an R2 cache would have
 * nothing to hold. Same choice as pwa/open-next.config.ts.
 */
export default defineCloudflareConfig({});
