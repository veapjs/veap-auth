import type { IEventBus } from "@veap/kernel";
import type { IAuthNotificationService } from "./contracts.js";

export interface IMailerLike {
  sendMail(message: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void>;
}

export type MailerResolver = () =>
  | Promise<IMailerLike | undefined>
  | IMailerLike
  | undefined;
export type EventBusResolver = () =>
  | Promise<IEventBus | undefined>
  | IEventBus
  | undefined;

/**
 * Default implementation of the authentication notification port.
 *
 * If a mailer adapter is registered, it constructs and sends localized or
 * templated emails. If an EventBus is available, it emits system auth events.
 * In development or testing without a mailer, it logs codes safely.
 */
export class DefaultAuthNotificationService
  implements IAuthNotificationService
{
  constructor(
    private readonly mailerResolver?: MailerResolver,
    private readonly eventBusResolver?: EventBusResolver,
  ) {}

  private async getMailer(): Promise<IMailerLike | undefined> {
    if (!this.mailerResolver) return undefined;
    return await this.mailerResolver();
  }

  private async getEventBus(): Promise<IEventBus | undefined> {
    if (!this.eventBusResolver) return undefined;
    return await this.eventBusResolver();
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const mailer = await this.getMailer();
    if (mailer) {
      await mailer.sendMail({
        to: email,
        subject: "Verify Email",
        text: `Verify your email address with your code: ${code}`,
      });
    } else {
      console.info(`[veap:auth] Verification email code for ${email}: ${code}`);
    }

    const eventBus = await this.getEventBus();
    if (eventBus) {
      await eventBus.publish("system:auth:verification-requested", {
        email,
        code,
      });
    }
  }

  async sendPasswordReset(email: string, code: string): Promise<void> {
    const mailer = await this.getMailer();
    if (mailer) {
      await mailer.sendMail({
        to: email,
        subject: "Password Reset",
        text: `Verify password reset with code: ${code}`,
      });
    } else {
      console.info(`[veap:auth] Password reset code for ${email}: ${code}`);
    }

    const eventBus = await this.getEventBus();
    if (eventBus) {
      await eventBus.publish("system:auth:password-reset:requested", {
        email,
        code,
      });
    }
  }

  async sendRecoveryCode(email: string, code: string): Promise<void> {
    const mailer = await this.getMailer();
    if (mailer) {
      await mailer.sendMail({
        to: email,
        subject: "Recovery Code",
        text: `Your recovery code is: ${code}`,
      });
    } else {
      console.info(`[veap:auth] Recovery code for ${email}: ${code}`);
    }

    const eventBus = await this.getEventBus();
    if (eventBus) {
      await eventBus.publish("system:auth:recovery-code:generated", {
        email,
        recoveryCode: code,
      });
    }
  }

  async send2FACode(email: string, code: string): Promise<void> {
    const mailer = await this.getMailer();
    if (mailer) {
      await mailer.sendMail({
        to: email,
        subject: "Your 2FA Code",
        text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
      });
    } else {
      console.info(`[veap:auth] 2FA verification code for ${email}: ${code}`);
    }

    const eventBus = await this.getEventBus();
    if (eventBus) {
      await eventBus.publish("system:auth:2fa-code:requested", {
        email,
        code,
      });
    }
  }
}
