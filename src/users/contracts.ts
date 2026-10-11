import type { FullUser, User } from "../common/index.js";

export type { FullUser, User };

export interface CreateUserRecord {
  email: string;
  name: string;
  password?: string | null;
  image?: string | null;
  emailVerifiedAt?: Date | null;
  recoveryCode: Uint8Array;
}

export interface UpdateUserRecord {
  name?: string;
  email?: string;
  image?: string | null;
  password?: string;
  emailVerifiedAt?: Date | null;
}

/**
 * User persistence port.
 */
export interface IUserRepository {
  create(record: CreateUserRecord): Promise<User>;

  findById(id: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  findPasswordHash(id: string): Promise<string | null | undefined>;

  findRecoveryCode(id: string): Promise<Uint8Array | null | undefined>;

  update(id: string, changes: UpdateUserRecord): Promise<void>;

  setRecoveryCode(id: string, encrypted: Uint8Array): Promise<void>;

  setEmailVerifiedIfEmailMatches(id: string, email: string): Promise<boolean>;

  isEmailAvailable(email: string): Promise<boolean>;
}

/** Injection token for the user repository port. */
export const USER_REPOSITORY = Symbol.for("veap:auth:user-repository");
