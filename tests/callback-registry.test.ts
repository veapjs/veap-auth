import { beforeEach, describe, expect, it } from "vitest";
import type { FullUser, Session } from "../src/common/index.js";
import {
  AuthCallbackRegistry,
  augmentSession,
  checkSecurity,
  registerAuthValidator,
  registerSecurityRequirement,
  registerSessionAugmenter,
  unregisterAuthValidator,
  unregisterSecurityRequirement,
  unregisterSessionAugmenter,
} from "../src/common/index.js";

describe("AuthCallbackRegistry", () => {
  let registry: AuthCallbackRegistry<() => string>;

  beforeEach(() => {
    registry = new AuthCallbackRegistry();
  });

  it("registers and unregisters handlers by string ID", () => {
    const fn1 = () => "one";
    const fn2 = () => "two";

    registry.register("plugin-a", fn1);
    registry.register("plugin-b", fn2);

    expect(Array.from(registry)).toEqual([fn1, fn2]);

    expect(registry.unregister("plugin-a")).toBe(true);
    expect(Array.from(registry)).toEqual([fn2]);

    expect(registry.unregister("non-existent")).toBe(false);
  });

  it("registers anonymous handlers using self-reference", () => {
    const fn1 = () => "one";
    const fn2 = () => "two";

    registry.register(fn1);
    registry.register(fn2);

    expect(Array.from(registry)).toEqual([fn1, fn2]);

    expect(registry.unregister(fn1)).toBe(true);
    expect(Array.from(registry)).toEqual([fn2]);
  });
});

describe("Modular Extension Pipelines", () => {
  it("sessionAugmenters modify session metadata sequentially", async () => {
    registerSessionAugmenter("test:augmenter-1", async (session) => ({
      flags: { ...(session as any).flags, augmented1: true },
    }));

    registerSessionAugmenter("test:augmenter-2", async (session) => ({
      flags: { ...(session as any).flags, augmented2: true },
    }));

    const session: Session = {
      id: "sess_1",
      userId: "usr_1",
      expiresAt: new Date(),
    };

    const augmented = await augmentSession(session);

    expect((augmented as any).flags).toEqual({
      augmented1: true,
      augmented2: true,
    });

    unregisterSessionAugmenter("test:augmenter-1");
    unregisterSessionAugmenter("test:augmenter-2");
  });

  it("securityRequirements run conditionally and enforce gate access", async () => {
    registerSecurityRequirement("test:req-pass", async () => ({
      satisfied: true,
    }));

    const dummyUser: FullUser = {
      id: "usr_1",
      email: "test@example.com",
      name: "Test",
      password: null,
      image: null,
      recovery_code: null,
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: null,
      roles: ["user"],
      permissions: [],
    };

    const dummySession: Session = {
      id: "sess_1",
      userId: "usr_1",
      expiresAt: new Date(),
    };

    const check1 = await checkSecurity(dummySession, dummyUser);
    expect(check1.satisfied).toBe(true);

    registerSecurityRequirement("test:req-fail", async () => ({
      satisfied: false,
      redirect: "/custom-gate",
    }));

    const check2 = await checkSecurity(dummySession, dummyUser);
    expect(check2.satisfied).toBe(false);
    expect(check2.redirect).toBe("/custom-gate");

    unregisterSecurityRequirement("test:req-pass");
    unregisterSecurityRequirement("test:req-fail");
  });
});
