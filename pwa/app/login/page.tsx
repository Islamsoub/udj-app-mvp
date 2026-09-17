import type { Metadata } from 'next';
import { LoginCard } from '@/components/login/LoginCard';

/**
 * /login
 *
 * A server component that renders one client island. Keeping the route itself
 * on the server means the language the root layout resolved from the cookie is
 * already applied to the HTML that carries this screen — the first paint is in
 * the right language and direction, with no swap after mount.
 *
 * No route guard here: sending an already-authenticated student away is routing
 * work, and routing comes later.
 */
export const metadata: Metadata = {
  title: 'Connexion — Unipocket',
};

export default function LoginPage() {
  return <LoginCard />;
}
