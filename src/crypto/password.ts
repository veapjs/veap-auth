import { app } from "@veap/kernel";
import { authContext, isAuthContextBound } from "../common/context.js";
import { BcryptPasswordHasher } from "./bcrypt-hasher.js";
import { type IPasswordHasher, PASSWORD_HASHER } from "./contracts.js";

async function resolvePasswordHasher(): Promise<IPasswordHasher> {
  if (isAuthContextBound()) {
    const ctx = authContext();
    if (ctx.passwordHasher) {
      return ctx.passwordHasher;
    }
  }

  const g = globalThis as any;
  if (g.__VEAP_BOOTSTRAPPING_PROMISE__) {
    try {
      await g.__VEAP_BOOTSTRAPPING_PROMISE__;
    } catch {}

    if (isAuthContextBound()) {
      const ctx = authContext();
      if (ctx.passwordHasher) {
        return ctx.passwordHasher;
      }
    }
  }

  try {
    return await app(PASSWORD_HASHER);
  } catch {
    return new BcryptPasswordHasher();
  }
}

/**
 * Hashes the password using the configured password hasher.
 * @param password Password to be hashed.
 * @returns Returns the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  const hasher = await resolvePasswordHasher();
  return await hasher.hash(password);
}

/**
 * Verifies the password hash using the configured password hasher.
 * @param hash Stored password hash.
 * @param password Password for comparison.
 * @returns Returns true if the password is correct, false otherwise.
 */
export async function verifyPasswordHash(
  hash: string,
  password: string,
): Promise<boolean> {
  const hasher = await resolvePasswordHasher();
  return await hasher.verify(hash, password);
}

/**
 * Validates password strength using the configured password hasher.
 * @param password Password to validate.
 * @returns Returns true if the password meets complexity requirements.
 */
export async function verifyPasswordStrength(
  password: string,
): Promise<boolean> {
  const hasher = await resolvePasswordHasher();
  return await hasher.validateStrength(password);
}
