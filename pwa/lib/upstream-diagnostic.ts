// TEMP DIAGNOSTIC: remove after the Render 429 investigation.
//
// Once removed, the call sites go back to `readJson(upstream)` from lib/proxy.

/** Response headers worth seeing on an upstream error that did not come from Express. */
const DIAGNOSTIC_HEADERS = ['server', 'cf-ray', 'cf-mitigated', 'content-type', 'retry-after'] as const;

const BODY_PREVIEW_CHARS = 300;

/**
 * Same contract as readJson in lib/proxy — the parsed JSON body, or null — but
 * when the backend answered >= 400 with a body that is not JSON, it logs one
 * line describing that response first.
 *
 * Only the RESPONSE is logged: its status, the headers listed above and the
 * first 300 characters of its body. Never the request — no request body, no
 * password, no cookies, no Authorization, no proxy secret. Express's own errors
 * are JSON, so a non-JSON error body means something in front of the backend
 * (Render's edge, Cloudflare) answered, which is what the investigation needs
 * to identify.
 */
export async function readJsonWithDiagnostic(
  upstream: Response,
  route: 'login' | 'backend'
): Promise<unknown> {
  const text = await upstream.text().catch(() => '');

  try {
    return JSON.parse(text) as unknown;
  } catch {
    if (upstream.status >= 400) {
      const headers = Object.fromEntries(
        DIAGNOSTIC_HEADERS.map((name) => [name, upstream.headers.get(name)])
      );
      console.warn(
        `[upstream-diagnostic] ${route} status=${upstream.status} headers=${JSON.stringify(
          headers
        )} body=${JSON.stringify(text.slice(0, BODY_PREVIEW_CHARS))}`
      );
    }
    return null;
  }
}
