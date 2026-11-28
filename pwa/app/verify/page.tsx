import type { Metadata } from 'next';
import { VerifyCard } from '@/components/verify/VerifyCard';

/**
 * /verify — the public student-card check. The QR code on a student's card is
 * a link to this page with the card token after "#t=", so any phone camera
 * lands here. No sign-in, no app shell.
 */
export const metadata: Metadata = {
  title: 'Vérification de carte — Unipocket',
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return <VerifyCard />;
}
