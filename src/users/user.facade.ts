import { app } from "@veap/kernel";
import { authContext, isAuthContextBound } from "../common/context.js";
import type { User } from "../common/index.js";
import { UserService } from "./user.service.js";

async function resolveUserService(): Promise<UserService> {
  if (isAuthContextBound()) {
    return authContext().user;
  }
  const g = globalThis as any;
  if (g.__VEAP_BOOTSTRAPPING_PROMISE__) {
    try {
      await g.__VEAP_BOOTSTRAPPING_PROMISE__;
    } catch {}
    if (isAuthContextBound()) {
      return authContext().user;
    }
  }
  return await app(UserService);
}

export async function verifyUsernameInput(username: string): Promise<boolean> {
  const service = await resolveUserService();
  return service.verifyUsernameInput(username);
}

export async function isEmailAvailable(email: string): Promise<boolean> {
  const service = await resolveUserService();
  return service.isEmailAvailable(email);
}

/**
 * Checks if an email address is available for registration.
 * Compatible with legacy imports.
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
  return isEmailAvailable(email);
}

export async function createUser(
  email: string,
  username: string,
  password: string,
): Promise<User> {
  const service = await resolveUserService();
  return service.createUser(email, username, password);
}

export async function createOAuthUser(
  email: string,
  name: string,
  image?: string,
): Promise<User> {
  const service = await resolveUserService();
  return service.createOAuthUser(email, name, image);
}

export async function getUserById(userId: string): Promise<User | null> {
  const service = await resolveUserService();
  return service.getUserById(userId);
}

export async function getUserRecoveryCode(userId: string): Promise<string> {
  const service = await resolveUserService();
  return service.getUserRecoveryCode(userId);
}

/**
 * @deprecated Use `getUserRecoveryCode` instead.
 */
export async function getUserRecoverCode(userId: string): Promise<string> {
  return getUserRecoveryCode(userId);
}

export async function resetUserRecoveryCode(userId: string): Promise<string> {
  const service = await resolveUserService();
  return service.resetUserRecoveryCode(userId);
}

export async function updateUserPassword(
  userId: string,
  password: string,
): Promise<void> {
  const service = await resolveUserService();
  return service.updateUserPassword(userId, password);
}

export async function updateUserName(
  userId: string,
  name: string,
): Promise<void> {
  const service = await resolveUserService();
  return service.updateUserName(userId, name);
}

export async function updateUserAvatar(
  userId: string,
  image: string,
): Promise<void> {
  const service = await resolveUserService();
  return service.updateUserAvatar(userId, image);
}

/**
 * @deprecated Use `updateUserAvatar` instead.
 */
export async function updateUserAwatar(
  userId: string,
  image: string,
): Promise<void> {
  return updateUserAvatar(userId, image);
}

export async function updateUserEmailAndSetEmailAsVerified(
  userId: string,
  email: string,
): Promise<void> {
  const service = await resolveUserService();
  return service.updateUserEmailAndSetEmailAsVerified(userId, email);
}

export async function setUserAsEmailVerifiedIfEmailMatches(
  userId: string,
  email: string,
): Promise<boolean> {
  const service = await resolveUserService();
  return service.setUserAsEmailVerifiedIfEmailMatches(userId, email);
}

export async function getUserPasswordHash(
  userId: string,
): Promise<string | null> {
  const service = await resolveUserService();
  return service.getUserPasswordHash(userId);
}

export async function getUserFromEmail(email: string): Promise<User | null> {
  const service = await resolveUserService();
  return service.getUserFromEmail(email);
}
