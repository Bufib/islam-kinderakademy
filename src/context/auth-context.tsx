import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type AccountRole = 'parent' | 'teacher' | 'admin';

export type AccountProfile = {
  id: number | null;
  displayName: string;
  avatarUrl: string | null;
  role: AccountRole;
};

type AuthActionResult = {
  error: string | null;
};

type SignUpResult = AuthActionResult & {
  needsEmailConfirmation: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AccountProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isProfileLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (displayName: string, email: string, password: string) => Promise<SignUpResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function fallbackProfile(user: User): AccountProfile {
  const metadataName = user.user_metadata?.display_name;

  return {
    id: null,
    displayName:
      typeof metadataName === 'string' && metadataName.trim()
        ? metadataName.trim()
        : user.email?.split('@')[0] || 'Mein Konto',
    avatarUrl: null,
    role: 'parent',
  };
}

function resolveRole(roles: unknown[]): AccountRole {
  const values = roles
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object' && 'role' in entry) return entry.role;
      return null;
    })
    .filter((entry): entry is string => typeof entry === 'string');

  if (values.includes('admin')) return 'admin';
  if (values.includes('teacher')) return 'teacher';
  return 'parent';
}

function authRedirectUrl(path = '/login') {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const productionBaseUrl =
      process.env.NODE_ENV === 'production' ? process.env.EXPO_BASE_URL?.replace(/\/$/, '') ?? '' : '';
    return `${window.location.origin}${productionBaseUrl}${path}`;
  }

  return Linking.createURL(path);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(Boolean(supabase));
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const loadProfile = useCallback(async (user: User | null) => {
    if (!supabase || !user) {
      setProfile(null);
      return;
    }

    setIsProfileLoading(true);
    const fallback = fallbackProfile(user);

    try {
      // Repariert auch ältere Auth-Konten, die vor dem Profil-Trigger angelegt wurden.
      // Die Funktion verwendet ausschließlich auth.uid() und kann kein fremdes Profil erzeugen.
      await supabase.rpc('ensure_current_profile');

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError || !profileRow) {
        setProfile(fallback);
        return;
      }

      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('role')
        .eq('profile_id', profileRow.id);

      setProfile({
        id: profileRow.id,
        displayName: profileRow.display_name?.trim() || fallback.displayName,
        avatarUrl: profileRow.avatar_url ?? null,
        role: resolveRole(roleRows ?? []),
      });
    } catch {
      setProfile(fallback);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsInitializing(false);
      void loadProfile(data.session?.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setIsInitializing(false);
      void loadProfile(nextSession?.user ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [loadProfile]);

  useEffect(() => {
    const client = supabase;
    if (!client || Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        client.auth.startAutoRefresh();
      } else {
        client.auth.stopAutoRefresh();
      }
    });

    return () => subscription.remove();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    if (!supabase) return { error: 'Supabase ist noch nicht konfiguriert.' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(
    async (displayName: string, email: string, password: string): Promise<SignUpResult> => {
      if (!supabase) {
        return {
          error: 'Supabase ist noch nicht konfiguriert.',
          needsEmailConfirmation: false,
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl(),
          data: { display_name: displayName.trim() },
        },
      });

      return {
        error: error?.message ?? null,
        needsEmailConfirmation: !error && !data.session,
      };
    },
    []
  );

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    if (!supabase) return { error: 'Supabase ist noch nicht konfiguriert.' };

    const { error } = await supabase.auth.signOut();
    return { error: error?.message ?? null };
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthActionResult> => {
    if (!supabase) return { error: 'Supabase ist noch nicht konfiguriert.' };

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl('/account'),
    });
    return { error: error?.message ?? null };
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user ?? null);
  }, [loadProfile, session?.user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAuthenticated: Boolean(session),
      isInitializing,
      isProfileLoading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      requestPasswordReset,
      signOut,
      refreshProfile,
    }),
    [
      isInitializing,
      isProfileLoading,
      profile,
      refreshProfile,
      requestPasswordReset,
      session,
      signIn,
      signOut,
      signUp,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
