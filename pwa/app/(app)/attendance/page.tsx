import { Attendance } from '@/components/attendance/Attendance';

/**
 * Attendance. A server component wrapping one client island — the shell around
 * it already resolved the language and the session, so this route adds nothing
 * but the content.
 */
export default function AttendancePage() {
  return <Attendance />;
}
