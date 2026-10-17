"use server";

import {
  AppError,
  app,
  handleActionError,
  ok,
  type Result,
} from "@veap/kernel";
import type { AuthResponse, SessionFlags } from "../common/index.js";
import { AuthService } from "../session/auth.service.js";
import type { LoginInput, RegisterInput } from "../validation/index.js";

export async function signIn(data: LoginInput): Promise<Result<AuthResponse>> {
  try {
    const authService = await app(AuthService);
    const response = await authService.signIn(data);
    if (response.status === "ERROR") {
      throw AppError.Unauthorized(response.message || "Invalid credentials");
    }
    return ok(response);
  } catch (e) {
    return handleActionError(e, "Auth:SignIn");
  }
}

export async function signUp(
  data: RegisterInput,
): Promise<Result<AuthResponse>> {
  try {
    const authService = await app(AuthService);
    const response = await authService.signUp(data);
    if (response.status === "ERROR") {
      throw AppError.Conflict(response.message || "Registration failed");
    }
    return ok(response);
  } catch (e) {
    return handleActionError(e, "Auth:SignUp");
  }
}

export async function finalizeLogin(
  userId: string,
  flags: SessionFlags,
): Promise<Result<AuthResponse>> {
  try {
    const authService = await app(AuthService);
    const response = await authService.finalizeLogin(userId, flags);
    if (response.status === "ERROR") {
      throw AppError.BadRequest(response.message || "Failed to finalize login");
    }
    return ok(response);
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
