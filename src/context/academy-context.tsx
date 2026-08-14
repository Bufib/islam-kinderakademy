import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types/academy';

type AcademyContextValue = {
  activeRole: UserRole;
  selectedChildId: number | null;
  enterChildArea: (childId: number) => void;
  exitChildArea: () => void;
};

const AcademyContext = createContext<AcademyContextValue | null>(null);

export function AcademyProvider({ children }: PropsWithChildren) {
  const { profile, user } = useAuth();
  const [childSelection, setChildSelection] = useState<{
    userId: string;
    childId: number;
  } | null>(null);
  const selectedChildId =
    childSelection && childSelection.userId === user?.id ? childSelection.childId : null;
  const activeRole: UserRole = selectedChildId
    ? 'child'
    : profile?.role === 'teacher' || profile?.role === 'admin'
      ? 'team'
      : 'parent';
  const value = useMemo(
    () => ({
      activeRole,
      selectedChildId,
      enterChildArea: (childId: number) => {
        if (user) setChildSelection({ userId: user.id, childId });
      },
      exitChildArea: () => setChildSelection(null),
    }),
    [activeRole, selectedChildId, user]
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
