import { type AuthRoutesConfig, DEFAULT_AUTH_ROUTES } from "./routes";

export interface AuthContext {
  user: any;
  session: any;
  rbac: any;
  passwordReset: any;
  emailVerification: any;
  auth: any;
  routes: AuthRoutesConfig;
}

const globalForAuthContext = globalThis as unknown as {
  __VEAP_AUTH_CONTEXT__?: AuthContext;
};

/**
 * Binds the resolved auth services. Called once by the composition root.
 */
export function bindAuthContext(context: AuthContext): void {
  globalForAuthContext.__VEAP_AUTH_CONTEXT__ = context;
}

/**
 * Check whether auth context is currently bound.
 */
export function isAuthContextBound(): boolean {
  return globalForAuthContext.__VEAP_AUTH_CONTEXT__ !== undefined;
}

/**
 * Returns the bound auth services.
 *
 * @throws If the auth service provider has not booted yet.
 */
export function authContext(): AuthContext {
  const context = globalForAuthContext.__VEAP_AUTH_CONTEXT__;
  if (!context) {
    throw new Error(
      "[Auth] Context is not bound. AuthServiceProvider must boot before the auth facades are used.",
    );
  }
  return context;
}

/**
 * Returns the currently configured authentication routes.
 * If the Auth context is not bound yet, returns DEFAULT_AUTH_ROUTES.
 */
export function getAuthRoutes(): AuthRoutesConfig {
  const context = globalForAuthContext.__VEAP_AUTH_CONTEXT__;
  return context?.routes ?? DEFAULT_AUTH_ROUTES;
}
