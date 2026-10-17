import { container } from "@veap/kernel";
import {
  AUTH_NOTIFICATION_SERVICE,
  type IAuthNotificationService,
} from "./contracts.js";
import { DefaultAuthNotificationService } from "./default-notification.service.js";

async function getNotificationService(): Promise<IAuthNotificationService> {
  if (container.has(AUTH_NOTIFICATION_SERVICE)) {
    return await container.resolve<IAuthNotificationService>(
      AUTH_NOTIFICATION_SERVICE,
    );
  }
  return new DefaultAuthNotificationService();
}

/**
 * Sends a verification email code using the registered auth notification service.
 */
export async function sendVerifyEmail(
  email: string,
  code: string,
): Promise<void> {
  const service = await getNotificationService();
  return service.sendVerificationEmail(email, code);
}

/**
 * Sends a password reset code using the registered auth notification service.
 */
export async function sendResetPassword(
  email: string,
  code: string,
): Promise<void> {
  const service = await getNotificationService();
  return service.sendPasswordReset(email, code);
}

/**
 * Sends a recovery code using the registered auth notification service.
 */
export async function sendRecoveryCode(
  email: string,
  code: string,
): Promise<void> {
  const service = await getNotificationService();
  return service.sendRecoveryCode(email, code);
}

/**
 * Sends a 2FA verification code using the registered auth notification service.
 */
export async function send2FACode(email: string, code: string): Promise<void> {
  const service = await getNotificationService();
  if (service.send2FACode) {
    return service.send2FACode(email, code);
  }
}
