import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.ENCRYPTION_KEY = "MDEyMzQ1Njc4OWFiY2RlZg==";
});

import { container } from "@veap/kernel";
import { KernelServiceProvider } from "@veap/kernel/server";
import {
  DEFAULT_AUTH_ROUTES,
  getAuthRoutes,
  ROUTER_SERVICE,
} from "../src/common/index.js";
import { AuthServiceProvider } from "../src/providers/index.js";

describe("Auth Routes Configuration and Rewrites", () => {
  beforeEach(() => {
    const g = globalThis as any;
    delete g.__VEAP_BOOTSTRAPPED__;
    delete g.__VEAP_BOOTSTRAPPING_PROMISE__;
    delete g.__VEAP_AUTH_CONTEXT__;
    container.clear();
    new KernelServiceProvider(container).register();
  });

  afterEach(() => {
    const g = globalThis as any;
    delete g.__VEAP_BOOTSTRAPPED__;
    delete g.__VEAP_BOOTSTRAPPING_PROMISE__;
    delete g.__VEAP_AUTH_CONTEXT__;
    container.clear();
  });

  it("provides default auth routes when AuthServiceProvider is registered and booted without options", async () => {
    const provider = new AuthServiceProvider(container);
    provider.register();
    await provider.boot();

    const routes = getAuthRoutes();
    expect(routes).toEqual(DEFAULT_AUTH_ROUTES);
  });

  it("configures custom auth routes and registers rewrites in router service", async () => {
    const rewrites = new Map<string, string>();
    const mockRouter = {
      addRewrite(from: string, to: string) {
        rewrites.set(from, to);
      },
      getRewrites() {
        return rewrites;
      },
    };

    container.register({
      token: ROUTER_SERVICE,
      useValue: mockRouter,
    });

    const provider = new AuthServiceProvider(container, {
      routes: {
        signIn: "/logowanie",
        signUp: "/rejestracja",
        forgotPassword: "/odzyskaj-haslo",
        afterLogin: "/dashboard",
        afterLogout: "/logowanie",
      },
    });

    provider.register();
    await provider.boot();

    const routes = getAuthRoutes();
    expect(routes.signIn).toBe("/logowanie");
    expect(routes.signUp).toBe("/rejestracja");
    expect(routes.forgotPassword).toBe("/odzyskaj-haslo");
    expect(routes.resetPassword).toBe("/reset-password"); // Default preserved
    expect(routes.afterLogin).toBe("/dashboard");
    expect(routes.afterLogout).toBe("/logowanie");

    expect(rewrites.get("/logowanie")).toBe("/signin");
    expect(rewrites.get("/rejestracja")).toBe("/signup");
    expect(rewrites.get("/odzyskaj-haslo")).toBe("/forgot-password");
    expect(rewrites.has("/reset-password")).toBe(false); // Unmodified route not rewritten
  });
});
