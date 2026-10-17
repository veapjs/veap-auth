import { z } from "zod";

/**
 * Validates the email format and length.
 */
export function verifyEmailInput(email: string): boolean {
  return /^.+@.+\..+$/.test(email) && email.length < 256 && email.length > 0;
}

// Auth validation schemas - CLEAN (No DB dependencies for client-side)
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8),
  remember: z.boolean().optional(),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  terms: z
    .boolean()
    .refine((val: boolean) => val === true, "You must accept the terms"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((data: any) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export const verifyEmailSchema = z.object({
  code: z.string().min(6).max(6),
});

// mfa validation schemas
export const totpSetupSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export const totpVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export const backupCodeSchema = z.object({
  code: z.string().min(8).max(12),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
