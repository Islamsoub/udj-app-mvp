import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
// Values, not types, so they must come from the non-client module — every export
// of lib/i18n.tsx is a client reference and cannot be called while rendering here.
import { LANG_COOKIE, dirFor, resolveLang } from '@/lib/i18n-shared';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unipocket PWA',
  description: 'Unipocket — Université de Djibouti.',
};

/**
 * Applies the stored language to <html> before first paint, for the one case the
 * server cannot cover.
 *
 * The cookie read below handles everybody who has one, and for them this script
 * does nothing — which is why it checks for the cookie first and bails out. What
 * it still guards is the migration window: a student who chose Arabic before the
 * cookie existed has localStorage and no cookie, so the server has no way to
 * know and renders LTR. The provider adopts their stored choice on mount and
 * writes the cookie, but that is one paint too late for direction — and a
 * mirrored tree that flips after mount does not reliably re-measure, which is
 * exactly the bug this guarded against in the native app.
 *
 * It removes itself from relevance: after any such student's first visit the
 * cookie exists, the server renders correctly, and this branch never runs again.
 * Delete it once no live session predates the cookie.
 */
const LANG_BOOTSTRAP = `try{if(!/(?:^|;\\s*)unipocket_lang=/.test(document.cookie)){var l=localStorage.getItem('unipocket_lang');if(l==='ar'||l==='fr'){var e=document.documentElement;e.lang=l;e.dir=l==='ar'?'rtl':'ltr';}}}catch(e){}`;

/**
 * Server component. `cookies()` is awaited here, which is what lets the first
 * byte of HTML carry the right language — no 'use client' anywhere in this file.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  // resolveLang, not a bare cast: the cookie is user-editable, so `xx` or any
  // other junk resolves to French rather than being indexed into a dictionary.
  const store = await cookies();
  const lang = resolveLang(store.get(LANG_COOKIE)?.value);

  return (
    // suppressHydrationWarning: LANG_BOOTSTRAP may rewrite lang/dir before React
    // hydrates, in the migration case described above.
    <html lang={lang} dir={dirFor(lang)} data-theme="light" suppressHydrationWarning>
      <head>
        {/* Only the faces the first paint actually needs. Preloading all nine
            would put 328 KB of fonts ahead of the CSS and JS in the queue and
            make that paint later, not sooner — the other seven are fetched
            normally, when a rule first uses them.

            The two Latin weights are needed in both languages, not just French:
            Arabic swaps the body face to Naskh, but the `.num` rule in
            globals.css keeps every number, time, GPA and student ID on Plus
            Jakarta Sans, and 700 carries headings and chips either way.

            `crossOrigin` is required even though these are same-origin: fonts
            are fetched in CORS mode, and a preload whose mode does not match is
            simply downloaded twice. */}
        <link rel="preload" href="/fonts/PlusJakartaSans-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PlusJakartaSans-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* The Arabic face is only in the critical path when the server already
            resolved Arabic from the cookie. French sessions never fetch it. */}
        {lang === 'ar' && (
          <link rel="preload" href="/fonts/NotoNaskhArabic-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        )}
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOTSTRAP }} />
      </head>
      <body>
        {/* The Arabic body face comes from the `html[lang="ar"] body` rule in
            globals.css, so the server-rendered lang attribute already selects the
            right stack at first paint — no client pass needed. */}
        <I18nProvider initialLang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
