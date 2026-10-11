import type { ISecretCipher } from "./contracts.js";
import { decryptToString, encryptString } from "./encryption.js";

/**
 * AES-GCM adapter for the ISecretCipher port.
 */
export class AesSecretCipher implements ISecretCipher {
  public encrypt(secret: string): Uint8Array {
    return encryptString(secret);
  }

  public decryptToString(data: Uint8Array): string {
    return decryptToString(data);
  }
}
