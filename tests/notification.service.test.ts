import type { IEventBus } from "@veap/kernel";
import { describe, expect, it, vi } from "vitest";
import {
  DefaultAuthNotificationService,
  type IMailerLike,
} from "../src/notifications/index.js";

describe("DefaultAuthNotificationService", () => {
  it("delivers verification email through mailer and emits event bus signal", async () => {
    const mockMailer: IMailerLike = {
      sendMail: vi.fn().mockResolvedValue(undefined),
    };
    const mockEventBus: IEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      clearAll: vi.fn(),
      publishStrict: vi.fn(),
      once: vi.fn(),
    };

    const notifier = new DefaultAuthNotificationService(
      () => mockMailer,
      () => mockEventBus,
    );

    await notifier.sendVerificationEmail("user@example.com", "123456");

    expect(mockMailer.sendMail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Verify Email",
      text: "Verify your email address with your code: 123456",
    });

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      "system:auth:verification-requested",
      {
        email: "user@example.com",
        code: "123456",
      },
    );
  });

  it("delivers password reset through mailer and emits event bus signal", async () => {
    const mockMailer: IMailerLike = {
      sendMail: vi.fn().mockResolvedValue(undefined),
    };
    const mockEventBus: IEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      clearAll: vi.fn(),
      publishStrict: vi.fn(),
      once: vi.fn(),
    };

    const notifier = new DefaultAuthNotificationService(
      () => mockMailer,
      () => mockEventBus,
    );

    await notifier.sendPasswordReset("user@example.com", "RESET123");

    expect(mockMailer.sendMail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Password Reset",
      text: "Verify password reset with code: RESET123",
    });

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      "system:auth:password-reset:requested",
      {
        email: "user@example.com",
        code: "RESET123",
      },
    );
  });

  it("safely falls back when no mailer or event bus is bound", async () => {
    const notifier = new DefaultAuthNotificationService();

    // Should not throw
    await expect(
      notifier.sendVerificationEmail("u@example.com", "999888"),
    ).resolves.toBeUndefined();

    await expect(
      notifier.sendRecoveryCode("u@example.com", "RECOV-1"),
    ).resolves.toBeUndefined();
  });

  describe("Standalone notification helpers", () => {
    it("delegates to bound AUTH_NOTIFICATION_SERVICE in container", async () => {
      const { container } = await import("@veap/kernel");
      const {
        AUTH_NOTIFICATION_SERVICE,
        sendVerifyEmail,
        sendResetPassword,
        sendRecoveryCode,
        send2FACode,
      } = await import("../src/notifications/index.js");

      const mockService = {
        sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
        sendPasswordReset: vi.fn().mockResolvedValue(undefined),
        sendRecoveryCode: vi.fn().mockResolvedValue(undefined),
        send2FACode: vi.fn().mockResolvedValue(undefined),
      };

      container.register({
        token: AUTH_NOTIFICATION_SERVICE,
        useValue: mockService,
      });

      try {
        await sendVerifyEmail("user@example.com", "123");
        expect(mockService.sendVerificationEmail).toHaveBeenCalledWith(
          "user@example.com",
          "123",
        );

        await sendResetPassword("user@example.com", "reset");
        expect(mockService.sendPasswordReset).toHaveBeenCalledWith(
          "user@example.com",
          "reset",
        );

        await sendRecoveryCode("user@example.com", "rec");
        expect(mockService.sendRecoveryCode).toHaveBeenCalledWith(
          "user@example.com",
          "rec",
        );

        await send2FACode("user@example.com", "2fa");
        expect(mockService.send2FACode).toHaveBeenCalledWith(
          "user@example.com",
          "2fa",
        );
      } finally {
        container.reset();
      }
    });
  });
});
