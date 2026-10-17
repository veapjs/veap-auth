import type { Token } from "@veap/kernel";

/**
 * Port contract for authentication notifications (emails, SMS, security alerts).
 *
 * Decouples authentication use cases (password reset, email verification,
 * recovery codes) from specific transport providers (SMTP, SendGrid, SES, etc.).
 */
export interface IAuthNotificationService {
  /**
   * Sends an email verification request containing an OTP code.
   */
  sendVerificationEmail(email: string, code: string): Promise<void>;

  /**
   * Sends a password reset request containing an OTP code.
   */
  sendPasswordReset(email: string, code: string): Promise<void>;

  /**
   * Sends an initial or updated recovery code to the user.
   */
  sendRecoveryCode(email: string, code: string): Promise<void>;

  /**
   * Optional two-factor authentication challenge delivery.
   */
  send2FACode?(email: string, code: string): Promise<void>;
}

/**
 * IoC Token for the authentication notification port.
 */
export const AUTH_NOTIFICATION_SERVICE: Token<IAuthNotificationService> =
  Symbol.for("veap:auth:notification-service");
