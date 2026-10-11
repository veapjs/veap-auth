import type { Token } from "@veap/kernel";
import type { AuthRoutesConfig } from "./types.js";

/**
 * IoC Token for application authentication routes configuration.
 */
export const AUTH_ROUTES: Token<AuthRoutesConfig> =
  Symbol.for("veap:auth:routes");

/**
 * IoC Token for application router service (used for route rewrites).
 */
export const ROUTER_SERVICE: Token<any> = Symbol.for("veap:router:service");
