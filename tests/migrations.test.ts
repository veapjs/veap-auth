import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.ENCRYPTION_KEY = "MDEyMzQ1Njc4OWFiY2RlZg==";
});

import { getKnex, initDatabase } from "@veap/database";
import { Container } from "@veap/kernel";
import { KernelServiceProvider } from "@veap/kernel/server";
import { authMigrations, runAuthMigrations } from "../src/migrations/index.js";
import { AuthServiceProvider } from "../src/providers/index.js";

describe("Auth Migrations", () => {
  let db: any;

  beforeAll(async () => {
    db = initDatabase({
      client: "better-sqlite3",
      connection: { filename: ":memory:" },
      useNullAsDefault: true,
    });
  });

  afterAll(async () => {
    if (db) {
      await db.destroy();
    }
  });

  it("exports valid knex migration functions in definition array", () => {
    expect(authMigrations).toBeDefined();
    expect(Array.isArray(authMigrations)).toBe(true);
    expect(authMigrations.length).toBeGreaterThan(0);

    for (const migration of authMigrations) {
      expect(typeof migration.name).toBe("string");
      expect(typeof migration.up).toBe("function");
      expect(typeof migration.down).toBe("function");
    }
  });

  it("applies migrations successfully through runAuthMigrations", async () => {
    const knex = getKnex();
    await runAuthMigrations();

    const tables = await knex("sqlite_master")
      .select("name")
      .where("type", "table");

    const tableNames = tables.map((t: any) => t.name);

    expect(tableNames).toContain("users");
    expect(tableNames).toContain("sessions");
    expect(tableNames).toContain("roles");
    expect(tableNames).toContain("permissions");
    expect(tableNames).toContain("reset_sessions");
    expect(tableNames).toContain("verification_requests");
  });

  it("automatically creates auth tables during AuthServiceProvider.boot()", async () => {
    const freshDb = initDatabase({
      client: "better-sqlite3",
      connection: { filename: ":memory:" },
      useNullAsDefault: true,
    });

    const container = new Container();
    new KernelServiceProvider(container).register();

    const provider = new AuthServiceProvider(container);
    provider.register();
    await provider.boot();

    const knex = getKnex();
    const hasUsersTable = await knex.schema.hasTable("users");
    expect(hasUsersTable).toBe(true);

    await freshDb.destroy();
  });
});
