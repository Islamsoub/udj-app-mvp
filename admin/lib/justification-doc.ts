/**
 * What kind of file a justification document is, read from its address.
 *
 * The server sends a signed storage link such as
 *   https://<project>.supabase.co/storage/v1/object/sign/justifications/<id>.pdf?token=…
 * so the extension sits at the end of the path, not at the end of the string:
 * testing the raw string with endsWith('.pdf') never matched, and every
 * document fell through to the "unknown" placeholder. Parse the URL and look
 * at its pathname only.
 */
export type JustificationDocKind = 'pdf' | 'image' | 'unknown';

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const PDF_EXT = /\.pdf$/i;

export function justificationDocKind(url: string | null | undefined): JustificationDocKind {
  if (!url) return 'unknown';
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    // Not an absolute URL (a bare storage path): drop any query by hand.
    path = url.split(/[?#]/, 1)[0];
  }
  if (PDF_EXT.test(path)) return 'pdf';
  if (IMAGE_EXT.test(path)) return 'image';
  return 'unknown';
}
