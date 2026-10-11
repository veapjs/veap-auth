/**
 * Password hashing port.
 */
export interface IPasswordHasher {
  /** Creates a secure hash of a plaintext password. */
  hash(password: string): Promise<string>;

  /** Verifies a plaintext password against a stored hash. */
  verify(hash: string, password: string): Promise<boolean>;

  /** Validates password complexity/length requirements. */
  validateStrength(password: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol.for("veap:auth:password-hasher");

/**
 * Secret-at-rest encryption port.
 */
export interface ISecretCipher {
  /** Encrypts a secret string into storable bytes. */
  encrypt(secret: string): Uint8Array;

  /** Decrypts stored bytes back into the secret string. */
  decryptToString(data: Uint8Array): string;
}

export const SECRET_CIPHER = Symbol.for("veap:auth:secret-cipher");

/**
 * Secret-token generation port.
 */
export interface ITokenGenerator {
  /** Generates a random one-time code (default 6 characters, uppercase base32). */
  generateOtp(length?: number): string;

  /** Generates a random recovery code (uppercase base32). */
  generateRecoveryCode(): string;

  /** Generates a random session token (lowercase base32). */
  generateSessionToken(): string;

  /** Hashes a token for storage/lookup (deterministic, keyed by content). */
  hashToken(token: string): string;
}

export const TOKEN_GENERATOR = Symbol.for("veap:auth:token-generator");
