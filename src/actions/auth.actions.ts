"use server";

import { app, handleActionError, ok, type Result } from "@veap/kernel";
import type { AuthResponse, SessionFlags } from "../common/index.js";
import { AuthService } from "../session/auth.service.js";
import type { LoginInput, RegisterInput } from "../validation/index.js";

export async function signIn(data: LoginInput): Promise<Result<AuthResponse>> {
  try {
    const authService = await app(AuthService);
    return ok(await authService.signIn(data));
  } catch (e) {
    return handleActionError(e, "Auth:SignIn");
  }
}

export async function signUp(data: RegisterInput) {
  try {
    const authService = await app(AuthService);
    return ok(await authService.signUp(data));
  } catch (e) {
    return handleActionError(e, "Auth:SignUp");
  }
}

export async function finalizeLogin(userId: string, flags: SessionFlags) {
  try {
    const authService = await app(AuthService);
    return ok(await authService.finalizeLogin(userId, flags));
  } catch (e) {
    return handleActionError(e, "Auth:FinalizeLogin");
  }
}

export async function signOut(): Promise<Result<void>> {
  try {
    const authService = await app(AuthService);
    await authService.signOut();
    return ok(undefined);
  } catch (e) {
    return handleActionError(e, "Auth:SignOut");
  }
}
