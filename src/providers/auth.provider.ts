import { isDatabaseInitialized } from "@veap/database";
import {
  ConfigService,
  Container,
  container as defaultContainer,
  EVENT_BUS,
  logger,
  ServiceProvider,
} from "@veap/kernel";
import { bindAuthContext } from "../common/context.js";
import {
  AUTH_ROUTES,
  type AuthConfig,
  type AuthRoutesConfig,
  DEFAULT_AUTH_ROUTES,
  ROUTER_SERVICE,
} from "../common/routes.js";
import { AesSecretCipher } from "../crypto/aes-cipher.js";
import { BcryptPasswordHasher } from "../crypto/bcrypt-hasher.js";
import {
  type IPasswordHasher,
  PASSWORD_HASHER,
  SECRET_CIPHER,
  TOKEN_GENERATOR,
} from "../crypto/contracts.js";
import { OsloTokenGenerator } from "../crypto/token-generator.js";
import { runAuthMigrations } from "../migrations/index.js";
import {
  AUTH_NOTIFICATION_SERVICE,
  DefaultAuthNotificationService,
  type IMailerLike,
} from "../notifications/index.js";
import { PASSWORD_RESET_REPOSITORY } from "../passwords/contracts.js";
import { ActiveRecordPasswordResetRepository } from "../passwords/password-reset.repository.js";
import { PasswordResetService } from "../passwords/password-reset.service.js";
import { PERMISSION_REPOSITORY, ROLE_REPOSITORY } from "../rbac/contracts.js";
import {
  ActiveRecordPermissionRepository,
  ActiveRecordRoleRepository,
} from "../rbac/rbac.repository.js";
import { RbacService } from "../rbac/rbac.service.js";
import { AuthService } from "../session/auth.service.js";
import { SESSION_REPOSITORY } from "../session/contracts.js";
import { ActiveRecordSessionRepository } from "../session/session.repository.js";
import { SessionService } from "../session/session.service.js";
import { USER_REPOSITORY } from "../users/contracts.js";
import { ActiveRecordUserRepository } from "../users/user.repository.js";
import { UserService } from "../users/user.service.js";
import { EMAIL_VERIFICATION_REPOSITORY } from "../verification/contracts.js";
import { ActiveRecordEmailVerificationRepository } from "../verification/verification.repository.js";
import { EmailVerificationService } from "../verification/verification.service.js";
import { isSystemInstalled } from "./setup.js";

export class AuthServiceProvider extends ServiceProvider {
  private config?: AuthConfig;

  constructor(container?: Container, config?: AuthConfig) {
    super(container ?? defaultContainer);
    this.config = config;
  }

  private resolveRoutes(): AuthRoutesConfig {
    return {
      ...DEFAULT_AUTH_ROUTES,
      ...this.config?.routes,
    };
  }

  register(): void {
    const routes = this.resolveRoutes();
    this.container.register({
      token: AUTH_ROUTES,
      useValue: routes,
    });

    // Cryptographic ports -> concrete adapters
    this.container.register({
      token: PASSWORD_HASHER,
      useFactory: async (c: Container) => {
        let config: ConfigService | undefined;
        try {
          if (c && typeof c.resolve === "function" && c.has(ConfigService)) {
            config = await c.resolve(ConfigService);
          }
        } catch {}
        const roundsRaw = config?.get("AUTH_BCRYPT_ROUNDS");
        const minLengthRaw = config?.get("AUTH_PASSWORD_MIN_LENGTH");
        const rounds = roundsRaw ? parseInt(roundsRaw, 10) : undefined;
        const minLength = minLengthRaw ? parseInt(minLengthRaw, 10) : undefined;
        return new BcryptPasswordHasher(rounds, minLength);
      },
      inject: [Container],
      singleton: true,
    });

    this.container.register({
      token: TOKEN_GENERATOR,
      useClass: OsloTokenGenerator,
      singleton: true,
    });

    this.container.register({
      token: SECRET_CIPHER,
      useClass: AesSecretCipher,
      singleton: true,
    });

    // Repositories
    this.container.register({
      token: USER_REPOSITORY,
      useClass: ActiveRecordUserRepository,
      singleton: true,
    });

    this.container.register({
      token: SESSION_REPOSITORY,
      useClass: ActiveRecordSessionRepository,
      singleton: true,
    });

    this.container.register({
      token: ROLE_REPOSITORY,
      useClass: ActiveRecordRoleRepository,
      singleton: true,
    });

    this.container.register({
      token: PERMISSION_REPOSITORY,
      useClass: ActiveRecordPermissionRepository,
      singleton: true,
    });

    this.container.register({
      token: PASSWORD_RESET_REPOSITORY,
      useClass: ActiveRecordPasswordResetRepository,
      singleton: true,
    });

    this.container.register({
      token: EMAIL_VERIFICATION_REPOSITORY,
      useClass: ActiveRecordEmailVerificationRepository,
      singleton: true,
    });

    if (!this.container.has(AUTH_NOTIFICATION_SERVICE)) {
      this.container.register({
        token: AUTH_NOTIFICATION_SERVICE,
        useFactory: () => {
          const mailerToken = Symbol.for("veap:communication:mailer");
          return new DefaultAuthNotificationService(
            () =>
              this.container.has(mailerToken)
                ? this.container.resolve<IMailerLike>(mailerToken)
                : undefined,
            () =>
              this.container.has(EVENT_BUS)
                ? this.container.resolve(EVENT_BUS)
                : undefined,
          );
        },
        singleton: true,
      });
    }

    // Services
    this.container.register({
      token: UserService,
      useClass: UserService,
      singleton: true,
    });

    this.container.register({
      token: SessionService,
      useClass: SessionService,
      singleton: true,
    });

    this.container.register({
      token: RbacService,
      useClass: RbacService,
      singleton: true,
    });

    this.container.register({
      token: PasswordResetService,
      useClass: PasswordResetService,
      singleton: true,
    });

    this.container.register({
      token: EmailVerificationService,
      useClass: EmailVerificationService,
      singleton: true,
    });

    this.container.register({
      token: AuthService,
      useClass: AuthService,
      singleton: true,
    });
  }

  async boot(): Promise<void> {
    // 0. Auto-bootstrap setup state
    try {
      await isSystemInstalled();
    } catch {}

    // 1. Resolve domain services and bind singleton auth context
    const user = await this.container.resolve<UserService>(UserService);
    const session =
      await this.container.resolve<SessionService>(SessionService);
    const rbac = await this.container.resolve<RbacService>(RbacService);
    const passwordReset =
      await this.container.resolve<PasswordResetService>(PasswordResetService);
    const emailVerification =
      await this.container.resolve<EmailVerificationService>(
        EmailVerificationService,
      );
    const auth = await this.container.resolve<AuthService>(AuthService);
    const passwordHasher =
      await this.container.resolve<IPasswordHasher>(PASSWORD_HASHER);

    bindAuthContext({
      user,
      session,
      rbac,
      passwordReset,
      emailVerification,
      auth,
      passwordHasher,
      routes: this.resolveRoutes(),
    });

    // 2. Register route rewrites if RouterService is available
    if (this.container.has(ROUTER_SERVICE)) {
      const router = await this.container.resolve<any>(ROUTER_SERVICE);
      const routes = this.resolveRoutes();

      const addRewrite = (from: string, to: string) => {
        if (typeof router.addRewrite === "function") {
          router.addRewrite(from, to);
        } else if (typeof router.registerRewrite === "function") {
          router.registerRewrite(from, to);
        }
      };

      if (routes.signIn !== DEFAULT_AUTH_ROUTES.signIn) {
        addRewrite(routes.signIn, DEFAULT_AUTH_ROUTES.signIn);
      }
      if (routes.signUp !== DEFAULT_AUTH_ROUTES.signUp) {
        addRewrite(routes.signUp, DEFAULT_AUTH_ROUTES.signUp);
      }
      if (routes.forgotPassword !== DEFAULT_AUTH_ROUTES.forgotPassword) {
        addRewrite(routes.forgotPassword, DEFAULT_AUTH_ROUTES.forgotPassword);
      }
      if (routes.resetPassword !== DEFAULT_AUTH_ROUTES.resetPassword) {
        addRewrite(routes.resetPassword, DEFAULT_AUTH_ROUTES.resetPassword);
      }
      if (routes.verifyEmail !== DEFAULT_AUTH_ROUTES.verifyEmail) {
        addRewrite(routes.verifyEmail, DEFAULT_AUTH_ROUTES.verifyEmail);
      }
    }

    // 3. Database migrations (when enabled and database is connected)
    const shouldMigrate = this.config?.autoMigrate ?? true;
    if (shouldMigrate && isDatabaseInitialized()) {
      try {
        await runAuthMigrations();
      } catch (error: any) {
        logger.error(
          "veap:auth",
          "Failed to run auth database migrations during boot:",
          error.message,
        );
      }
    }
  }
}
