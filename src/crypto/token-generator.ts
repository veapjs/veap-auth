import { sha256 } from "@oslojs/crypto/sha2";
import {
  encodeBase32LowerCaseNoPadding,
  encodeBase32UpperCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import type { ITokenGenerator } from "./contracts.js";

/**
 * Oslo-based adapter for the ITokenGenerator port.
 */
export class OsloTokenGenerator implements ITokenGenerator {
  public generateOtp(length = 6): string {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    return encodeBase32UpperCaseNoPadding(bytes).substring(0, length);
  }

  public generateRecoveryCode(): string {
    const recoveryCodeBytes = new Uint8Array(10);
    crypto.getRandomValues(recoveryCodeBytes);
    return encodeBase32UpperCaseNoPadding(recoveryCodeBytes);
  }

  public generateSessionToken(): string {
    const tokenBytes = new Uint8Array(20);
    crypto.getRandomValues(tokenBytes);
    return encodeBase32LowerCaseNoPadding(tokenBytes).toLowerCase();
  }

  public hashToken(token: string): string {
    return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  }
}
