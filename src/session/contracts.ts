import type {
  AuthSession,
  FullUser,
  Session,
  SessionFlags,
  UserSession,
} from "../common/index.js";

export type { AuthSession, FullUser, Session, SessionFlags, UserSession };

/** A session together with its owner, as loaded by `findWithUser`. */
export interface SessionWithUser {
  session: Session;
  user: Record<string, any>;
}

export interface CreateSessionRecord {
  id: string;
  userId: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Session persistence port.
 */
export interface ISessionRepository {
  create(record: CreateSessionRecord): Promise<Session>;

  /**
   * Returns the session with its owner eager-loaded.
   * Returns `null` when either the session or its owner is missing.
   */
  findWithUser(id: string): Promise<SessionWithUser | null>;

  findById(id: string): Promise<Session | null>;

  findByUserId(userId: string): Promise<Session[]>;

  updateMetadata(id: string, metadata: Record<string, any>): Promise<void>;

  remove(id: string): Promise<void>;

  removeByUserId(userId: string): Promise<void>;

  /** Removes every session of a user except `currentSessionId`. */
  removeOtherUserSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<void>;
}

/** Injection token for the session repository port. */
export const SESSION_REPOSITORY = Symbol.for("veap:auth:session-repository");
