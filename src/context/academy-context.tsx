import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { UserRole } from '@/types/academy';

type AcademyContextValue = {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
};

const AcademyContext = createContext<AcademyContextValue | null>(null);

export function AcademyProvider({ children }: PropsWithChildren) {
  const [activeRole, setActiveRole] = useState<UserRole>('child');
  const value = useMemo(() => ({ activeRole, setActiveRole }), [activeRole]);

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademy() {
  const context = useContext(AcademyContext);

  if (!context) {
    throw new Error('useAcademy must be used inside AcademyProvider');
  }

  return context;
}

