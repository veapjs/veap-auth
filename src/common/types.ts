export type UserRole = "user" | "admin" | string;
export type UserPermission = string;

export interface User {
  id: string;
  email: string;
  name: string;
  password: string | null;
  image: string | null;
  recovery_code: any;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  [key: string]: any;
}

export interface Session {
  id: string;
  userId?: string;
  user_id?: string;
  metadata?: Record<string, any> | null;
  expiresAt: Date;
  expires_at?: Date;
  createdAt?: Date;
  created_at?: Date;
  updatedAt?: Date | null;
  updated_at?: Date | null;
  [key: string]: any;
}

export interface PasswordResetSession {
  id: string;
  email: string;
  code: string;
  emailVerified?: boolean | null;
  email_verified?: boolean | null;
  userId: string;
  user_id?: string;
  expiresAt: Date;
  expires_at?: Date;
  createdAt?: Date;
  created_at?: Date;
  updatedAt?: Date | null;
  updated_at?: Date | null;
  [key: string]: any;
}

/**
 * Represents a user with all potential extensions.
 * Use this type in UI components that require data added by modules.
 */
export type FullUser = User &
  Record<string, any> & {
    roles: UserRole[];
    permissions: UserPermission[];
  };

/**
 * Basic session context.
 */
export interface AuthSession {
  session: Session | null;
  user: FullUser | null;
}

export interface SessionFlags {
  [key: string]: any;
}

export type UserSession = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
  [key: string]: any;
};

export type AuthResponse =
  | {
      status: "SUCCESS";
      session: Session;
      user: FullUser;
      token?: string;
      redirect?: string;
    }
  | {
      status: "CHALLENGE_REQUIRED";
      type: string;
      userId: string;
      tempToken?: string;
      redirect?: string;
    }
  | { status: "ERROR"; message: string; redirect?: string };

export interface PasswordResetAuthSession {
  session: PasswordResetSession | null;
  user: FullUser | null;
}

/**
 * Configuration of public and private authentication route URLs.
 */
export interface AuthRoutesConfig {
  /** Sign in / login page URL. Default: "/signin" */
  signIn: string;
  /** Sign up / registration page URL. Default: "/signup" */
  signUp: string;
  /** Forgot password page URL. Default: "/forgot-password" */
  forgotPassword: string;
  /** Reset password page URL. Default: "/reset-password" */
  resetPassword: string;
  /** Email verification page URL. Default: "/verify-email" */
  verifyEmail: string;
  /** Redirect target after successful login. Default: "/" */
  afterLogin: string;
  /** Redirect target after logout. Default: "/signin" */
  afterLogout: string;
}

export const DEFAULT_AUTH_ROUTES: AuthRoutesConfig = {
  signIn: "/signin",
  signUp: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  afterLogin: "/",
  afterLogout: "/signin",
};

export interface AuthConfig {
  routes?: Partial<AuthRoutesConfig>;
  /**
   * Whether to automatically run auth database migrations during AuthServiceProvider.boot().
   * Defaults to `true` when database connection is initialized.
   */
  autoMigrate?: boolean;
}

export type AuthEventPayloads = {
  /**
   * Emitted after password/base credentials are verified,
   * but BEFORE the final session is created.
   * Listeners can return a "veto" to require additional factors.
   */
  "system:auth:validate-factors": {
    userId: string;
    email: string;
  };

  /**
   * Emitted after a full session is successfully created.
   */
  "system:auth:session-created": {
    session: Session;
    user: User;
  };

  "system:auth:login": {
    session: Session;
    user: User;
  };

  /**
   * Emitted after a new user successfully signs up.
   */
  "system:auth:signup": {
    session: Session;
    user: User;
  };

  /**
   * Emitted after a user signs out.
   */
  "system:auth:signed-out": {
    user: User;
  };

  /**
   * Emitted when a password reset is requested.
   */
  "system:auth:password-reset:requested": {
    userId: string;
    email: string;
  };

  /**
   * Emitted when a password has been successfully reset.
   */
  "system:auth:password-reset:completed": {
    userId: string;
  };

  /**
   * Emitted when a verification email is sent.
   */
  "system:auth:verification-requested": {
    userId: string;
    email: string;
  };

  /**
   * Emitted when a user successfully verifies their email.
   */
  "system:auth:email-verified": {
    userId: string;
    email: string;
  };
};
