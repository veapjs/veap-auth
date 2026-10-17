import { app } from "@veap/kernel";
import { cache } from "react";
import { authContext, isAuthContextBound } from "../common/context.js";
import type {
  AuthSession,
  SessionFlags,
  Session as SessionType,
  UserSession,
} from "../common/index.js";
import { SessionService } from "./session.service.js";

async function resolveSessionService(): Promise<SessionService> {
  if (isAuthContextBound()) {
    return authContext().session;
  }
  const g = globalThis as any;
  if (g.__VEAP_BOOTSTRAPPING_PROMISE__) {
    try {
      await g.__VEAP_BOOTSTRAPPING_PROMISE__;
    } catch {}
    if (isAuthContextBound()) {
      return authContext().session;
    }
  }
  return await app(SessionService);
}

export async function getIPAddress(): Promise<string | null> {
  const service = await resolveSessionService();
  return service.getIPAddress();
}

export async function validateSessionToken(
  token: string,
): Promise<AuthSession> {
  const service = await resolveSessionService();
  return service.validateSessionToken(token);
}

export const getCurrentSession = cache(async (): Promise<AuthSession> => {
  try {
    const service = await resolveSessionService();
    return await service.getCurrentSession();
  } catch {
    return { session: null, user: null };
  }
});

export async function invalidateSession(sessionId: string): Promise<void> {
  const service = await resolveSessionService();
  return service.invalidateSession(sessionId);
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  const service = await resolveSessionService();
  return service.invalidateUserSessions(userId);
}

export async function setSessionTokenCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const service = await resolveSessionService();
  return service.setSessionTokenCookie(token, expiresAt);
}

export async function deleteSessionTokenCookie(): Promise<void> {
  const service = await resolveSessionService();
  return service.deleteSessionTokenCookie();
}

export async function generateSessionToken(): Promise<string> {
  const service = await resolveSessionService();
  return service.generateSessionToken();
}

export async function createSession(
  token: string,
  userId: string,
  flags: SessionFlags,
): Promise<SessionType> {
  const service = await resolveSessionService();
  return service.createSession(token, userId, flags);
}

export async function updateSessionMetadata(
  flags: SessionFlags,
): Promise<void> {
  const service = await resolveSessionService();
  return service.updateSessionMetadata(flags);
}

export async function sessionSignOut(): Promise<void> {
  const service = await resolveSessionService();
  return service.sessionSignOut();
}

export async function getUserSessions(
  userId: string,
  currentSessionId: string,
): Promise<UserSession[]> {
  const service = await resolveSessionService();
  return service.getUserSessions(userId, currentSessionId);
}

export async function invalidateOtherSessions(
  userId: string,
  currentSessionId: string,
): Promise<void> {
  const service = await resolveSessionService();
  return service.invalidateOtherSessions(userId, currentSessionId);
}
