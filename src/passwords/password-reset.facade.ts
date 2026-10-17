import { app } from "@veap/kernel";
import { authContext, isAuthContextBound } from "../common/context.js";
import type {
  PasswordResetAuthSession,
  PasswordResetSession as PasswordResetSessionType,
} from "../common/index.js";
import { PasswordResetService } from "./password-reset.service.js";

async function resolvePasswordResetService(): Promise<PasswordResetService> {
  if (isAuthContextBound()) {
    return authContext().passwordReset;
  }
  const g = globalThis as any;
  if (g.__VEAP_BOOTSTRAPPING_PROMISE__) {
    try {
      await g.__VEAP_BOOTSTRAPPING_PROMISE__;
    } catch {}
    if (isAuthContextBound()) {
      return authContext().passwordReset;
    }
  }
  return await app(PasswordResetService);
}

export async function createPasswordResetSession(
  token: string,
  userId: string,
  email: string,
): Promise<PasswordResetSessionType> {
  const service = await resolvePasswordResetService();
  return service.createPasswordResetSession(token, userId, email);
}

export async function validatePasswordResetSessionToken(
  token: string,
): Promise<PasswordResetAuthSession> {
  const service = await resolvePasswordResetService();
  return service.validatePasswordResetSessionToken(token);
}

export async function setPasswordResetSessionAsEmailVerified(
  sessionId: string,
): Promise<void> {
  const service = await resolvePasswordResetService();
  return service.setPasswordResetSessionAsEmailVerified(sessionId);
}

export async function invalidateUserPasswordResetSessions(
  userId: string,
): Promise<void> {
  const service = await resolvePasswordResetService();
  return service.invalidateUserPasswordResetSessions(userId);
}

export async function getCurrentPasswordResetSession(): Promise<PasswordResetAuthSession> {
  const service = await resolvePasswordResetService();
  return service.getCurrentPasswordResetSession();
}

export async function setPasswordResetSessionTokenCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const service = await resolvePasswordResetService();
  return service.setPasswordResetSessionTokenCookie(token, expiresAt);
}

export async function deletePasswordResetSessionTokenCookie(): Promise<void> {
  const service = await resolvePasswordResetService();
  return service.deletePasswordResetSessionTokenCookie();
}

export async function sendPasswordResetEmail(
  email: string,
  code: string,
): Promise<void> {
  const service = await resolvePasswordResetService();
  return service.sendPasswordResetEmail(email, code);
}

export async function createDummyPasswordResetSession(
  token: string,
  email: string,
): Promise<PasswordResetSessionType> {
  const service = await resolvePasswordResetService();
  return service.createDummyPasswordResetSession(token, email);
}

export async function verifyResetCode(
  sessionId: string,
  code: string,
): Promise<{ valid: boolean; error?: string }> {
  const service = await resolvePasswordResetService();
  return service.verifyResetCode(sessionId, code);
}
