import type { ICookieStore } from "@veap/kernel";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ITokenGenerator } from "../src/crypto/index.js";
import {
  type IPasswordResetRepository,
  PasswordResetService,
} from "../src/passwords/index.js";

describe("PasswordResetService Security", () => {
  let service: PasswordResetService;
  let mockRepo: IPasswordResetRepository;
  let mockTokens: ITokenGenerator;
  let mockCookieStore: ICookieStore;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(async (record) => ({ ...record, emailVerified: false })),
      findWithUser: vi.fn(),
      setEmailVerified: vi.fn(),
      remove: vi.fn(),
      removeByUserId: vi.fn(),
    };

    mockTokens = {
      hashToken: vi.fn((t) => `hashed_${t}`),
      generateOtp: vi.fn(() => "ABCDEF"),
      generateSessionToken: vi.fn(() => "test-token"),
      generateRecoveryCode: vi.fn(() => "test-recovery"),
    };

    mockCookieStore = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    service = new PasswordResetService(mockRepo, mockTokens, mockCookieStore);
  });

  it("throws generic error when token session is expired without leaking verification state", async () => {
    mockRepo.findWithUser = vi.fn(async () => ({
      session: {
        id: "hashed_expired-token",
        email: "test@example.com",
        code: "HASHED_CODE",
        emailVerified: true,
        userId: "user-1",
        expiresAt: new Date(Date.now() - 1000), // Expired!
        createdAt: new Date(),
        updatedAt: null,
      },
      user: { id: "user-1" },
    }));

    await expect(
      service.validatePasswordResetSession("expired-token"),
    ).rejects.toThrow("Invalid or expired password reset session");

    expect(mockRepo.remove).toHaveBeenCalledWith("hashed_expired-token");
  });

  it("throws generic error when code is not verified without confirming code exists", async () => {
    mockRepo.findWithUser = vi.fn(async () => ({
      session: {
        id: "hashed_valid-token",
        email: "test@example.com",
        code: "HASHED_CODE",
        emailVerified: false, // NOT verified
        userId: "user-1",
        expiresAt: new Date(Date.now() + 10000),
        createdAt: new Date(),
        updatedAt: null,
      },
      user: { id: "user-1" },
    }));

    await expect(
      service.validatePasswordResetSession("valid-token"),
    ).rejects.toThrow("Invalid or expired password reset session");

    expect(mockRepo.remove).not.toHaveBeenCalled();
  });

  it("successfully returns session and user if verified and not expired", async () => {
    const validSession = {
      id: "hashed_valid-token",
      email: "test@example.com",
      code: "HASHED_CODE",
      emailVerified: true,
      userId: "user-1",
      expiresAt: new Date(Date.now() + 10000),
      createdAt: new Date(),
      updatedAt: null,
    };
    const validUser = { id: "user-1", email: "test@example.com" };

    mockRepo.findWithUser = vi.fn(async () => ({
      session: validSession,
      user: validUser,
    }));

    const result = await service.validatePasswordResetSession("valid-token");
    expect(result.session).toEqual(validSession);
    expect(result.user).toEqual(validUser);
  });

  it("fails constant time verification on mismatched code without exposing details", async () => {
    mockRepo.findWithUser = vi.fn(async () => ({
      session: {
        id: "hashed_valid-token",
        email: "test@example.com",
        code: "ACTUAL_CODE",
        emailVerified: false,
        userId: "user-1",
        expiresAt: new Date(Date.now() + 10000),
        createdAt: new Date(),
        updatedAt: null,
      },
      user: { id: "user-1" },
    }));

    const isValid = await service.verifyPasswordResetSessionCode(
      "valid-token",
      "WRONG_CODE",
    );
    expect(isValid).toBe(false);
    expect(mockRepo.setEmailVerified).not.toHaveBeenCalled();
  });
});
