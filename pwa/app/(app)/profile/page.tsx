import { Profile } from '@/components/profile/Profile';

/**
 * Profile. A server component wrapping one client island — the shell around it
 * already resolved the language, the theme and the session, so this route adds
 * nothing but the content.
 */
export default function ProfilePage() {
  return <Profile />;
}
