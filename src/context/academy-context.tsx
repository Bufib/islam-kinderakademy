import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types/academy';

type AcademyContextValue = {
  activeRole: UserRole;
  selectedChildId: number | null;
  canSwitchAccountArea: boolean;
  enterChildArea: (childId: number) => void;
  exitChildArea: () => void;
  enterParentArea: () => void;
  enterTeamArea: () => void;
};

const AcademyContext = createContext<AcademyContextValue | null>(null);

export function AcademyProvider({ children }: PropsWithChildren) {
  const { profile, user } = useAuth();
  const [childSelection, setChildSelection] = useState<{
    userId: string;
    childId: number;
  } | null>(null);
  const [accountAreaSelection, setAccountAreaSelection] = useState<{
    userId: string;
    area: 'parent' | 'team';
  } | null>(null);
  const selectedChildId =
    childSelection && childSelection.userId === user?.id ? childSelection.childId : null;
  const canSwitchAccountArea = profile?.role === 'admin';
  const selectedAccountArea =
    accountAreaSelection && accountAreaSelection.userId === user?.id
      ? accountAreaSelection.area
      : null;
  const activeRole: UserRole = selectedChildId
    ? 'child'
    : canSwitchAccountArea && selectedAccountArea === 'parent'
      ? 'parent'
      : profile?.role === 'teacher' || profile?.role === 'admin'
      ? 'team'
      : 'parent';
  const value = useMemo(
    () => ({
      activeRole,
      selectedChildId,
      canSwitchAccountArea,
      enterChildArea: (childId: number) => {
        if (user) setChildSelection({ userId: user.id, childId });
      },
      exitChildArea: () => setChildSelection(null),
      enterParentArea: () => {
        if (user && canSwitchAccountArea) {
          setChildSelection(null);
          setAccountAreaSelection({ userId: user.id, area: 'parent' });
        }
      },
      enterTeamArea: () => {
        if (user && canSwitchAccountArea) {
          setChildSelection(null);
          setAccountAreaSelection({ userId: user.id, area: 'team' });
        }
      },
    }),
    [activeRole, canSwitchAccountArea, selectedChildId, user]
  );

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademy() {
  const context = useContext(AcademyContext);

  if (!context) {
    throw new Error('useAcademy must be used inside AcademyProvider');
  }

  return context;
}
