import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { ModalProvider } from '@/components/providers/modal-provider';
import '@/styles/globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Unipocket Admin — Université de Djibouti',
  description:
    "Portail d'administration Unipocket : étudiants, notes, présence, actualités, emploi du temps.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${dmMono.variable}`}>
      <body>
        <QueryProvider>
          <ToastProvider>
            {children}
            <ModalProvider />
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
