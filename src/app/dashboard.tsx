import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { ChildDashboard } from '@/components/dashboards/child-dashboard';
import { ParentDashboard } from '@/components/dashboards/parent-dashboard';
import { TeamDashboard } from '@/components/dashboards/team-dashboard';
import { useAcademy } from '@/context/academy-context';
import { useAuth } from '@/context/auth-context';

export default function DashboardScreen() {
  const { activeRole } = useAcademy();
  const { profile } = useAuth();

  if (activeRole === 'parent') return <ParentDashboard />;
  if (activeRole === 'team' && profile?.role === 'admin') return <AdminDashboard />;
  if (activeRole === 'team') return <TeamDashboard />;
  return <ChildDashboard />;
}
