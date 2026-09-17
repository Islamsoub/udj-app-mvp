import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unipocket PWA',
  description: 'Unipocket — Université de Djibouti.',
};

/**
 * Applies the stored language to <html> before first paint.
 *
 * localStorage cannot be read while rendering on the server, so without this the
 * first paint is always French and LTR and the client corrects it a frame later.
 * In the native app that exact gap left the layout stuck in the wrong direction,
 * because a mirrored tree that flips after mount does not always re-measure.
 * Running synchronously in <head> means the browser never lays out the wrong way
 * round in the first place.
 *
 * Kept deliberately tiny — it blocks parsing — and wrapped in try/catch because
 * storage throws outright in some privacy modes.
 */
const LANG_BOOTSTRAP = `try{var l=localStorage.getItem('unipocket_lang');if(l==='ar'||l==='fr'){var e=document.documentElement;e.lang=l;e.dir=l==='ar'?'rtl':'ltr';}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the script above rewrites lang/dir before React
    // hydrates, so the attributes legitimately differ from the server markup.
    <html lang="fr" dir="ltr" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOTSTRAP }} />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
