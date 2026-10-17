import { app } from "@veap/kernel";
import { authContext, isAuthContextBound } from "../common/context.js";
import {
  type EmailVerificationRequestType,
  EmailVerificationService,
} from "./verification.service.js";

export type { EmailVerificationRequestType };

async function resolveVerificationService(): Promise<EmailVerificationService> {
  if (isAuthContextBound()) {
    return authContext().emailVerification;
  }
  const g = globalThis as any;
  if (g.__VEAP_BOOTSTRAPPING_PROMISE__) {
    try {
      await g.__VEAP_BOOTSTRAPPING_PROMISE__;
    } catch {}
    if (isAuthContextBound()) {
      return authContext().emailVerification;
    }
  }
  return await app(EmailVerificationService);
}

export async function initEmailVerification() {
  const service = await resolveVerificationService();
  return service.initEmailVerification();
}

export async function getUserEmailVerificationRequest(
  userId: string,
  id: string,
) {
  const service = await resolveVerificationService();
  return service.getUserEmailVerificationRequest(userId, id);
}

export async function createEmailVerificationRequest(
  userId: string,
  email: string,
) {
  const service = await resolveVerificationService();
  return service.createEmailVerificationRequest(userId, email);
}

export async function deleteUserEmailVerificationRequest(userId: string) {
  const service = await resolveVerificationService();
  return service.deleteUserEmailVerificationRequest(userId);
}

export async function sendVerificationEmail(email: string, code: string) {
  const service = await resolveVerificationService();
  return service.sendVerificationEmail(email, code);
}

export async function setEmailVerificationRequestCookie(
  request: EmailVerificationRequestType,
) {
  const service = await resolveVerificationService();
  return service.setEmailVerificationRequestCookie(request);
}

export async function deleteEmailVerificationRequestCookie() {
  const service = await resolveVerificationService();
  return service.deleteEmailVerificationRequestCookie();
}

export async function getUserEmailVerificationRequestFromRequest() {
  const service = await resolveVerificationService();
  return service.getUserEmailVerificationRequestFromRequest();
}
