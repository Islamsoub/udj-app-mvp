import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unipocket PWA',
  description: 'Unipocket — Université de Djibouti.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" dir="ltr" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
