import { ChildDashboard } from '@/components/dashboards/child-dashboard';
import { ParentDashboard } from '@/components/dashboards/parent-dashboard';
import { TeamDashboard } from '@/components/dashboards/team-dashboard';
import { useAcademy } from '@/context/academy-context';

export default function HomeScreen() {
  const { activeRole } = useAcademy();

  if (activeRole === 'parent') return <ParentDashboard />;
  if (activeRole === 'team') return <TeamDashboard />;
  return <ChildDashboard />;
}
