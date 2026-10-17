import { createCipheriv, createDecipheriv } from "node:crypto";
import { DynamicBuffer } from "@oslojs/binary";
import { decodeBase64 } from "@oslojs/encoding";

export function getEncryptionKey(): Uint8Array {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Generate one with: openssl rand -base64 16",
    );
  }

  const key = decodeBase64(envKey);
  if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must decode to 16, 24 or 32 bytes (got ${key.length}). ` +
        "Provide a base64-encoded key, e.g. from: openssl rand -base64 16",
    );
  }
  return key;
}

export function getAlgorithm(key: Uint8Array): string {
  return key.length === 16
    ? "aes-128-gcm"
    : key.length === 24
      ? "aes-192-gcm"
      : "aes-256-gcm";
}

/**
 * Encrypts data using AES-GCM.
 */
export function encrypt(data: Uint8Array): Uint8Array {
  const key = getEncryptionKey();
  const iv = new Uint8Array(16);
  crypto.getRandomValues(iv);
  const cipher = createCipheriv(getAlgorithm(key), key, iv) as any;
  const encrypted = new DynamicBuffer(0);
  encrypted.write(iv);
  encrypted.write(cipher.update(data));
  encrypted.write(cipher.final());
  encrypted.write(cipher.getAuthTag());
  return encrypted.bytes();
}

/**
 * Encrypts a string.
 */
export function encryptString(data: string): Uint8Array {
  return encrypt(new TextEncoder().encode(data));
}

/**
 * Decrypts data using AES-GCM.
 */
export function decrypt(encrypted: Uint8Array): Uint8Array {
  if (encrypted.byteLength < 33) {
    throw new Error("Invalid encrypted data length");
  }
  const key = getEncryptionKey();
  const iv = encrypted.slice(0, 16);
  const authTag = encrypted.slice(encrypted.byteLength - 16);
  const content = encrypted.slice(16, encrypted.byteLength - 16);

  const decipher = createDecipheriv(getAlgorithm(key), key, iv) as any;
  decipher.setAuthTag(authTag);

  const decrypted = new DynamicBuffer(0);
  decrypted.write(decipher.update(content));
  decrypted.write(decipher.final());
  return decrypted.bytes();
}

/**
 * Decrypts data to a string.
 */
export function decryptToString(data: Uint8Array): string {
  return new TextDecoder().decode(decrypt(data));
}
