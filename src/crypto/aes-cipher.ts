import type { ISecretCipher } from "./contracts";
import { decryptToString, encryptString } from "./encryption";

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
