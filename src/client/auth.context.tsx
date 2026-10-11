"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type AuthRoutesConfig,
  DEFAULT_AUTH_ROUTES,
} from "../common/routes.js";
import type { AuthSession } from "../common/types.js";

export interface AuthContextValue {
  user: AuthSession["user"] | null | undefined;
  session: AuthSession["session"] | null | undefined;
  prefix: string;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
  routes: AuthRoutesConfig;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export const PathPrefixContext = createContext<string>("/app");

export interface AuthProviderProps {
  children: ReactNode;
  initialSession?: AuthSession | null;
  prefix?: string;
  routes?: AuthRoutesConfig;
}

export function AuthProvider({
  children,
  initialSession,
  prefix = "/app",
  routes = DEFAULT_AUTH_ROUTES,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthSession["user"] | null | undefined>(
    initialSession?.user ?? null,
  );
  const [session, setSession] = useState<
    AuthSession["session"] | null | undefined
  >(initialSession?.session ?? null);
  const [isLoading, setIsLoading] = useState(!initialSession);

  const refetchUser = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSession(data.session);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSession) {
      refetchUser();
    }
  }, [initialSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        prefix,
        isLoading,
        refetchUser,
        routes,
      }}
    >
      <PathPrefixContext.Provider value={prefix}>
        {children}
      </PathPrefixContext.Provider>
    </AuthContext.Provider>
  );
}

/**
 * Hook to access configured authentication route URLs on the client.
 */
export function useAuthRoutes(): AuthRoutesConfig {
  const context = useContext(AuthContext);
  return context?.routes ?? DEFAULT_AUTH_ROUTES;
}

/**
 * Hook for user management on the client.
 * @returns Returns an object with user data and functions for managing it.
 */
export function useUser(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useUser must be used within AuthProvider");
  }
  return { ...context };
}
