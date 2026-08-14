import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { loadAcademyData } from '@/lib/academy-api';
import { AcademyData, emptyDatabaseData } from '@/types/database';
import { useAuth } from '@/context/auth-context';

type AcademyDataContextValue = {
  data: AcademyData;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  execute: <T>(action: () => Promise<T>) => Promise<T>;
};

const AcademyDataContext = createContext<AcademyDataContextValue | null>(null);

export function AcademyDataProvider({ children }: PropsWithChildren) {
  const { user, profile, isAuthenticated } = useAuth();
  const [data, setData] = useState<AcademyData>(emptyDatabaseData);
  const [isLoading, setIsLoading] = useState(isAuthenticated);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    loadAcademyData()
      .then((nextData) => {
        if (!active) return;
        setData(nextData);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Die Akademiedaten konnten nicht geladen werden.');
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, profile?.role, user?.id]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    try {
      const nextData = await loadAcademyData();
      setData(nextData);
      setError(null);
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : 'Die Akademiedaten konnten nicht geladen werden.';
      setError(message);
      throw reason;
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  const execute = useCallback(
    async <T,>(action: () => Promise<T>) => {
      const result = await action();
      await refresh();
      return result;
    },
    [refresh]
  );

  const value = useMemo<AcademyDataContextValue>(
    () => ({ data, isLoading, isRefreshing, error, refresh, execute }),
    [data, error, execute, isLoading, isRefreshing, refresh]
  );

  return <AcademyDataContext.Provider value={value}>{children}</AcademyDataContext.Provider>;
}

export function useAcademyData() {
  const context = useContext(AcademyDataContext);
  if (!context) throw new Error('useAcademyData must be used inside AcademyDataProvider');
  return context;
}
