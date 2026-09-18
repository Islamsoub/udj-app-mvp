import { Dashboard } from '@/components/dashboard/Dashboard';

/**
 * Dashboard. A server component wrapping one client island — the shell around it
 * already resolved the language and the session, so this route adds nothing but
 * the content.
 */
export default function DashboardPage() {
  return <Dashboard />;
}
