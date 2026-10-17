import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.ENCRYPTION_KEY = "MDEyMzQ1Njc4OWFiY2RlZg==";
});

import { initDatabase } from "@veap/database";
import { Application, container } from "@veap/kernel";
import { KernelServiceProvider } from "@veap/kernel/server";
import { signIn, signUp } from "../src/actions/index.js";
import { checkSecurity, getAuthRoutes } from "../src/common/index.js";
import "../src/composition.js";
import { User } from "../src/models/User.js";
import {
  AuthServiceProvider,
  isSystemInstalled,
} from "../src/providers/index.js";
import { RbacService } from "../src/rbac/rbac.service.js";

describe("Audit Fixes Verification", () => {
  let db: any;

  beforeAll(async () => {
    db = initDatabase({
      client: "better-sqlite3",
      connection: { filename: ":memory:" },
      useNullAsDefault: true,
    });

    container.clear();
    new KernelServiceProvider(container).register();

    const provider = new AuthServiceProvider(container);
    provider.register();
    await provider.boot();
  });

  afterAll(async () => {
    if (db) {
      await db.destroy();
    }
  });

  it("supports ApplicationBuilder withAuth() extension", () => {
    const builder = Application.configure().withAuth();
    expect(builder).toBeDefined();
    const app = builder.create();
    expect(app.providers()).toHaveLength(1);
  });

  it("checkSecurity falls back to configured getAuthRoutes().signIn when user is missing", async () => {
    const routes = getAuthRoutes();
    const check = await checkSecurity(null as any, null as any);
    expect(check.satisfied).toBe(false);
    expect(check.redirect).toBe(routes.signIn);
  });

  it("isSystemInstalled parses database count correctly and returns true after user creation", async () => {
    // Before creating user
    const installedBefore = await isSystemInstalled();
    expect(installedBefore).toBe(false);

    // Create a user in database
    await User.create({
      email: "audit-test@veap.dev",
      name: "Audit User",
      recovery_code: Buffer.from("recovery123"),
    });

    const installedAfter = await isSystemInstalled();
    expect(installedAfter).toBe(true);
  });

  it("RbacService.createRole and createPermission return single records, not arrays", async () => {
    const rbacService = await container.resolve(RbacService);

    const role = await rbacService.createRole("editor", "Editor role");
    expect(role).toBeDefined();
    expect(Array.isArray(role)).toBe(false);
    expect(role.name).toBe("editor");

    const perm = await rbacService.createPermission(
      "articles:publish",
      "Publish articles",
    );
    expect(perm).toBeDefined();
    expect(Array.isArray(perm)).toBe(false);
    expect(perm.name).toBe("articles:publish");
  });

  it("signIn action returns success: false with AppError details on invalid credentials", async () => {
    const result = await signIn({
      email: "nonexistent@veap.dev",
      password: "wrongpassword123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe("UNAUTHORIZED");
      expect(result.error.message).toBe("Invalid email or password");
    }
  });
});
