/**
 * Marks a route handler's response `Cache-Control: private, no-store`.
 *
 * Everything under /api is one student's data or tokens: the sign-in answer
 * carries an access token, /api/backend relays grades, attendance and signed
 * document URLs. The relay builds fresh responses and does not pass the
 * backend's headers through, so the backend's own no-store does not reach the
 * browser — it has to be set here. Without it, the browser's HTTP cache may
 * keep those answers on disk after sign-out, on a shared computer.
 *
 * Wraps the exported handler, so every return path is covered, including the
 * early 401/404/502/504 answers.
 */
export function withNoStore<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    const res = await handler(...args);
    try {
      res.headers.set('Cache-Control', 'private, no-store');
      return res;
    } catch {
      // Immutable headers (a fetch() Response passed straight through): copy.
      const copy = new Response(res.body, res);
      copy.headers.set('Cache-Control', 'private, no-store');
      return copy;
    }
  };
}
