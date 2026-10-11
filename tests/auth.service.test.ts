import { initDatabase } from "@veap/database";
import { Container } from "@veap/kernel";
import { KernelServiceProvider } from "@veap/kernel/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AuthServiceProvider } from "../src/providers/auth.provider.js";
import { AuthService } from "../src/session/auth.service.js";
import { UserService } from "../src/users/user.service.js";

describe("AuthService (Registration and Login Flow)", () => {
  let db: any;
  let container: Container;
  let authService: AuthService;
  let userService: UserService;

  beforeAll(async () => {
    db = initDatabase({
      client: "better-sqlite3",
      connection: { filename: ":memory:" },
      useNullAsDefault: true,
    });

    container = new Container();
    new KernelServiceProvider(container).register();

    const provider = new AuthServiceProvider(container);
    provider.register();
    await provider.boot();

    authService = await container.resolve(AuthService);
    userService = await container.resolve(UserService);
  });

  afterAll(async () => {
    if (db) {
      await db.destroy();
    }
  });

  it("registers a new user and allows immediate sign in with the same password (no double hashing)", async () => {
    // 1. Sign Up
    const signUpResult = await authService.signUp({
      email: "test@veap.dev",
      username: "testuser",
      password: "secretpassword123",
      terms: true,
    });

    expect(signUpResult.status).toBe("SUCCESS");
    if (signUpResult.status !== "SUCCESS") {
      throw new Error("Expected signUpResult.status to be SUCCESS");
    }

    expect(signUpResult.user).toBeDefined();
    expect(signUpResult.user.email).toBe("test@veap.dev");
    expect(signUpResult.session).toBeDefined();

    // 2. Email availability should now be false
    const isAvailable = await userService.isEmailAvailable("test@veap.dev");
    expect(isAvailable).toBe(false);

    // 3. Sign In with the exact same password
    const signInResult = await authService.signIn({
      email: "test@veap.dev",
      password: "secretpassword123",
    });

    expect(signInResult.status).toBe("SUCCESS");
    if (signInResult.status !== "SUCCESS") {
      throw new Error("Expected signInResult.status to be SUCCESS");
    }

    expect(signInResult.user.id).toBe(signUpResult.user.id);
    expect(signInResult.session).toBeDefined();
  });

  it("rejects sign in with an invalid password", async () => {
    await authService.signUp({
      email: "jane@veap.dev",
      username: "janedoe",
      password: "validPassword123",
      terms: true,
    });

    const wrongLogin = await authService.signIn({
      email: "jane@veap.dev",
      password: "wrongPassword456",
    });

    expect(wrongLogin.status).toBe("ERROR");
    if (wrongLogin.status !== "ERROR") {
      throw new Error("Expected wrongLogin.status to be ERROR");
    }
    expect(wrongLogin.message).toBe("Invalid email or password");
  });

  it("rejects sign up with duplicate email", async () => {
    await authService.signUp({
      email: "dup@veap.dev",
      username: "user1",
      password: "password123",
      terms: true,
    });

    const dupResult = await authService.signUp({
      email: "dup@veap.dev",
      username: "user2",
      password: "password456",
      terms: true,
    });

    expect(dupResult.status).toBe("ERROR");
    if (dupResult.status !== "ERROR") {
      throw new Error("Expected dupResult.status to be ERROR");
    }
    expect(dupResult.message).toBe("Email address is already registered");
  });
});
