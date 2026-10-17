import {
  AppError,
  CACHE_PROVIDER,
  eventBus,
  type ICacheProvider,
  Inject,
  Injectable,
} from "@veap/kernel";
import type { AuthResponse, SessionFlags } from "../common/index.js";
import {
  authValidators,
  performFullUserAugmentation,
} from "../common/logic.js";
import { type IPasswordHasher, PASSWORD_HASHER } from "../crypto/contracts.js";
import { UserService } from "../users/user.service.js";
import type { LoginInput, RegisterInput } from "../validation/index.js";
import { loginSchema, registerSchema } from "../validation/index.js";
import { EmailVerificationService } from "../verification/verification.service.js";
import { SessionService } from "./session.service.js";

@Injectable()
export class AuthService {
  private failedAttempts = new Map<
    string,
    { count: number; expiresAt: number }
  >();

  constructor(
    @Inject(UserService) private userService: UserService,
    @Inject(SessionService) private sessionService: SessionService,
    @Inject(EmailVerificationService)
    private emailVerificationService: EmailVerificationService,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    @Inject(CACHE_PROVIDER) private readonly cache?: ICacheProvider,
  ) {}

  private async isRateLimited(key: string): Promise<boolean> {
    if (this.cache) {
      const attempts = await this.cache.get<number>(`rl:${key}`);
      return (attempts ?? 0) >= 5;
    }
    const record = this.failedAttempts.get(key);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      this.failedAttempts.delete(key);
      return false;
    }
    return record.count >= 5;
  }

  private async recordFailedAttempt(key: string): Promise<void> {
    if (this.cache) {
      const attempts = (await this.cache.get<number>(`rl:${key}`)) ?? 0;
      await this.cache.set(`rl:${key}`, attempts + 1, 15 * 60);
      return;
    }
    const record = this.failedAttempts.get(key);
    if (!record || Date.now() > record.expiresAt) {
      this.failedAttempts.set(key, {
        count: 1,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });
    } else {
      record.count++;
    }
  }

  private async clearFailedAttempts(key: string): Promise<void> {
    if (this.cache) {
      await this.cache.delete(`rl:${key}`);
      return;
    }
    this.failedAttempts.delete(key);
  }

  /**
   * Sign In Logic
   */
  public async signIn(data: LoginInput): Promise<AuthResponse> {
    const { email, password } = await loginSchema.parseAsync(data);
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limits for email and IP
    const ip = await this.sessionService.getIPAddress();
    const isEmailBlocked = await this.isRateLimited(
      `login:email:${normalizedEmail}`,
    );
    const isIpBlocked = ip ? await this.isRateLimited(`login:ip:${ip}`) : false;

    if (isEmailBlocked || isIpBlocked) {
      return {
        status: "ERROR",
        message:
          "Too many failed login attempts. Please try again in 15 minutes.",
      };
    }

    const user = await this.userService.getUserFromEmail(normalizedEmail);
    if (!user) {
      // Prevent timing attacks by running a dummy hash verification
      await this.hasher.verify(
        "$2b$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuuabcdefghijk",
        password,
      );
      await this.recordFailedAttempt(`login:email:${normalizedEmail}`);
      if (ip) await this.recordFailedAttempt(`login:ip:${ip}`);
      return { status: "ERROR", message: "Invalid email or password" };
    }

    const passwordHash = await this.userService.getUserPasswordHash(user.id);
    if (!passwordHash || !(await this.hasher.verify(passwordHash, password))) {
      await this.recordFailedAttempt(`login:email:${normalizedEmail}`);
      if (ip) await this.recordFailedAttempt(`login:ip:${ip}`);
      return { status: "ERROR", message: "Invalid email or password" };
    }

    // Login succeeded - clear failed attempts
    await this.clearFailedAttempts(`login:email:${normalizedEmail}`);
    if (ip) await this.clearFailedAttempts(`login:ip:${ip}`);

    // Interception Layer
    for (const validator of authValidators) {
      const interception = await validator(user.id);
      if (interception) return interception;
    }

    const sessionFlags: SessionFlags = {};
    const sessionToken = await this.sessionService.generateSessionToken();
    const session = await this.sessionService.createSession(
      sessionToken,
      user.id,
      sessionFlags,
    );
    await this.sessionService.setSessionTokenCookie(
      sessionToken,
      session.expiresAt,
    );

    const fullUser = await performFullUserAugmentation(user);

    await eventBus.publish("system:auth:login", {
      session,
      user: fullUser,
    });

    await eventBus.publish("system:auth:session-created", {
      session,
      user: fullUser,
    });

    return {
      status: "SUCCESS",
      session: { ...session },
      user: { ...fullUser },
      token: sessionToken,
    };
  }

  /**
   * Sign Up Logic
   */
  public async signUp(data: RegisterInput): Promise<AuthResponse> {
    const { email, password, username } = await registerSchema.parseAsync(data);
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser =
      await this.userService.getUserFromEmail(normalizedEmail);
    if (existingUser) {
      return {
        status: "ERROR",
        message: "Email address is already registered",
      };
    }

    const user = await this.userService.createUser(
      normalizedEmail,
      username,
      password,
    );

    const sessionFlags: SessionFlags = {};
    const sessionToken = await this.sessionService.generateSessionToken();
    const session = await this.sessionService.createSession(
      sessionToken,
      user.id,
      sessionFlags,
    );
    await this.sessionService.setSessionTokenCookie(
      sessionToken,
      session.expiresAt,
    );

    await this.emailVerificationService.createEmailVerificationRequest(
      user.id,
      user.email,
    );

    const fullUser = await performFullUserAugmentation(user);

    await eventBus.publish("system:auth:register", {
      session,
      user: fullUser,
    });

    await eventBus.publish("system:auth:session-created", {
      session,
      user: fullUser,
    });

    return {
      status: "SUCCESS",
      session: { ...session },
      user: { ...fullUser },
      token: sessionToken,
    };
  }

  /**
   * Finalize Login Logic (used by MFA/Interceptions)
   */
  public async finalizeLogin(
    userId: string,
    flags: SessionFlags = {},
  ): Promise<AuthResponse> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      return { status: "ERROR", message: "User not found" };
    }

    const sessionToken = await this.sessionService.generateSessionToken();
    const session = await this.sessionService.createSession(
      sessionToken,
      user.id,
      flags,
    );
    await this.sessionService.setSessionTokenCookie(
      sessionToken,
      session.expiresAt,
    );

    const fullUser = await performFullUserAugmentation(user);

    await eventBus.publish("system:auth:session-created", {
      session,
      user: fullUser,
    });

    return {
      status: "SUCCESS",
      session: { ...session },
      user: { ...fullUser },
      token: sessionToken,
    };
  }

  /**
   * Sign Out Logic
   */
  public async signOut(): Promise<void> {
    await this.sessionService.sessionSignOut();
  }
}
