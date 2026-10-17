import type { IPasswordHasher } from "../crypto/contracts.js";
import { type AuthRoutesConfig, DEFAULT_AUTH_ROUTES } from "./routes.js";

export interface AuthContext {
  user: any;
  session: any;
  rbac: any;
  passwordReset: any;
  emailVerification: any;
  auth: any;
  passwordHasher?: IPasswordHasher;
  routes?: AuthRoutesConfig;
}

const globalForAuthContext = globalThis as unknown as {
  __VEAP_AUTH_CONTEXT__?: AuthContext & { routes: AuthRoutesConfig };
};

/**
 * Binds the resolved auth services. Called once by the composition root.
 */
export function bindAuthContext(context: AuthContext): void {
  globalForAuthContext.__VEAP_AUTH_CONTEXT__ = {
    ...context,
    routes: context.routes || DEFAULT_AUTH_ROUTES,
  };
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
export function authContext(): AuthContext & { routes: AuthRoutesConfig } {
  const context = globalForAuthContext.__VEAP_AUTH_CONTEXT__;
  if (!context) {
    throw new Error(
      "[Auth] Context is not bound. AuthServiceProvider must boot before the auth facades are used.",
    );
  }
  return context;
}

/**
 * Resolves currently configured auth routes, falling back to defaults.
 */
export function getAuthRoutes(): AuthRoutesConfig {
  const context = globalForAuthContext.__VEAP_AUTH_CONTEXT__;
  return context?.routes || DEFAULT_AUTH_ROUTES;
}
