import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { authApi, setUnauthorizedHandler, type CompanyRole, type User } from '@/services/api';
import { clearToken, readToken, writeToken } from '@/services/storage';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const clearSession = useCallback(async () => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    await clearToken();
  }, []);

  useEffect(() => {
    let active = true;

    readToken()
      .then(async (storedToken) => {
        if (!storedToken) return;
        try {
          const storedUser = await authApi.getUser(storedToken);
          if (!active) return;
          tokenRef.current = storedToken;
          setToken(storedToken);
          setUser(storedUser);
        } catch {
          // An expired token or unreachable server: start from the login screen.
          if (active) await clearToken();
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const signIn = useCallback(async (newToken: string, newUser: User) => {
    await writeToken(newToken);
    tokenRef.current = newToken;
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    const currentToken = tokenRef.current;
    await clearSession();
    if (currentToken) await authApi.logout(currentToken).catch(() => undefined);
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return null;
    const freshUser = await authApi.getUser(currentToken);
    setUser(freshUser);
    return freshUser;
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, signIn, signOut, refreshUser, setUser }),
    [user, token, loading, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export const roleLabels: Record<CompanyRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  dispatcher: 'Dispatcher',
  viewer: 'Viewer',
};

/**
 * The company the signed-in user works in, and what their role lets them do.
 * The API enforces roles; these flags only hide actions the user cannot perform.
 */
export function useCompany() {
  const { user, token } = useAuth();
  const company = user?.companies?.[0];
  const companyId = company?.company_uid ?? user?.memberships?.[0]?.company_uid ?? null;
  const role = user?.role ?? null;

  return {
    token,
    user,
    companyId,
    companyName: company?.name?.trim() || user?.memberships?.[0]?.name?.trim() || '',
    role,
    canManage: role === 'owner' || role === 'admin' || role === 'dispatcher',
    canConfigure: role === 'owner' || role === 'admin',
    isOwner: role === 'owner',
    ownedCompanyId:
      role === 'owner'
        ? user?.memberships?.find((membership) => membership.role === 'owner')?.company_uid ??
          company?.company_uid ??
          null
        : null,
  };
}

/** Users who registered but have not added a company yet must complete their profile first. */
export function needsCompanyProfile(user: User | null) {
  return Boolean(user && (user.companies?.length ?? 0) === 0 && (user.memberships?.length ?? 0) === 0);
}
