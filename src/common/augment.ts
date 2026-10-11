import { AuthCallbackRegistry } from "./registry.js";
import type { FullUser, PasswordResetSession, Session, User } from "./types.js";

/**
 * REGISTRIES FOR MODULAR EXTENSIONS
 */

export type IdentityAugmenter = (user: User) => Promise<Partial<FullUser>>;
export type SessionAugmenter = (session: Session) => Promise<Partial<Session>>;
export type PasswordResetSessionAugmenter = (
  session: PasswordResetSession,
) => Promise<Partial<PasswordResetSession>>;

const globalForAugment = globalThis as unknown as {
  __VEAP_IDENTITY_AUGMENTERS__:
    | AuthCallbackRegistry<IdentityAugmenter>
    | undefined;
  __VEAP_SESSION_AUGMENTERS__:
    | AuthCallbackRegistry<SessionAugmenter>
    | undefined;
  __VEAP_PASSWORD_RESET_SESSION_AUGMENTERS__:
    | AuthCallbackRegistry<PasswordResetSessionAugmenter>
    | undefined;
};

export const identityAugmenters =
  globalForAugment.__VEAP_IDENTITY_AUGMENTERS__ ??
  new AuthCallbackRegistry<IdentityAugmenter>();
export const sessionAugmenters =
  globalForAugment.__VEAP_SESSION_AUGMENTERS__ ??
  new AuthCallbackRegistry<SessionAugmenter>();
export const passwordResetSessionAugmenters =
  globalForAugment.__VEAP_PASSWORD_RESET_SESSION_AUGMENTERS__ ??
  new AuthCallbackRegistry<PasswordResetSessionAugmenter>();

globalForAugment.__VEAP_IDENTITY_AUGMENTERS__ = identityAugmenters;
globalForAugment.__VEAP_SESSION_AUGMENTERS__ = sessionAugmenters;
globalForAugment.__VEAP_PASSWORD_RESET_SESSION_AUGMENTERS__ =
  passwordResetSessionAugmenters;

export function registerIdentityAugmenter(augmenter: IdentityAugmenter): void;
export function registerIdentityAugmenter(
  id: string,
  augmenter: IdentityAugmenter,
): void;
export function registerIdentityAugmenter(
  idOrAugmenter: string | IdentityAugmenter,
  augmenter?: IdentityAugmenter,
): void {
  identityAugmenters.register(idOrAugmenter, augmenter);
}

export function unregisterIdentityAugmenter(
  idOrAugmenter: string | IdentityAugmenter,
): boolean {
  return identityAugmenters.unregister(idOrAugmenter);
}

export function registerSessionAugmenter(augmenter: SessionAugmenter): void;
export function registerSessionAugmenter(
  id: string,
  augmenter: SessionAugmenter,
): void;
export function registerSessionAugmenter(
  idOrAugmenter: string | SessionAugmenter,
  augmenter?: SessionAugmenter,
): void {
  sessionAugmenters.register(idOrAugmenter, augmenter);
}

export function unregisterSessionAugmenter(
  idOrAugmenter: string | SessionAugmenter,
): boolean {
  return sessionAugmenters.unregister(idOrAugmenter);
}

export function registerPasswordResetSessionAugmenter(
  augmenter: PasswordResetSessionAugmenter,
): void;
export function registerPasswordResetSessionAugmenter(
  id: string,
  augmenter: PasswordResetSessionAugmenter,
): void;
export function registerPasswordResetSessionAugmenter(
  idOrAugmenter: string | PasswordResetSessionAugmenter,
  augmenter?: PasswordResetSessionAugmenter,
): void {
  passwordResetSessionAugmenters.register(idOrAugmenter, augmenter);
}

export function unregisterPasswordResetSessionAugmenter(
  idOrAugmenter: string | PasswordResetSessionAugmenter,
): boolean {
  return passwordResetSessionAugmenters.unregister(idOrAugmenter);
}

/**
 * EXECUTION FUNCTIONS
 */
export async function augmentUser(
  user: User,
  coreRbacData?: Record<string, any>,
): Promise<FullUser> {
  let currentUser = { ...user, ...(coreRbacData || {}) };
  for (const augmenter of identityAugmenters) {
    const data = await augmenter(currentUser as User);
    currentUser = { ...currentUser, ...data };
  }
  return currentUser as FullUser;
}

export async function augmentSession(session: Session): Promise<Session> {
  let currentSession = { ...session };
  for (const augmenter of sessionAugmenters) {
    const data = await augmenter(currentSession);
    const existingFlags = (currentSession as any).flags || {};
    const newFlags = (data as any)?.flags || {};
    currentSession = {
      ...currentSession,
      ...data,
      flags: { ...existingFlags, ...newFlags },
    };
  }
  return currentSession as Session;
}

export async function augmentPasswordResetSession(
  session: PasswordResetSession,
): Promise<PasswordResetSession> {
  let currentSession = { ...session };
  for (const augmenter of passwordResetSessionAugmenters) {
    const data = await augmenter(currentSession);
    currentSession = { ...currentSession, ...data };
  }
  return currentSession as PasswordResetSession;
}
