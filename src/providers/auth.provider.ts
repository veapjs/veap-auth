import { isDatabaseInitialized } from "@veap/database";
import {
  AUTH_ROUTES,
  ConfigService,
  Container,
  container as defaultContainer,
  logger,
  ROUTER_SERVICE,
  ServiceProvider,
} from "@veap/kernel";
import { bindAuthContext } from "../common/context";
import {
  type AuthConfig,
  type AuthRoutesConfig,
  DEFAULT_AUTH_ROUTES,
} from "../common/routes";
import { AesSecretCipher } from "../crypto/aes-cipher";
import { BcryptPasswordHasher } from "../crypto/bcrypt-hasher";
import {
  PASSWORD_HASHER,
  SECRET_CIPHER,
  TOKEN_GENERATOR,
} from "../crypto/contracts";
import { OsloTokenGenerator } from "../crypto/token-generator";
import { runAuthMigrations } from "../migrations";
import { PASSWORD_RESET_REPOSITORY } from "../passwords/contracts";
import { ActiveRecordPasswordResetRepository } from "../passwords/password-reset.repository";
import { PasswordResetService } from "../passwords/password-reset.service";
import { PERMISSION_REPOSITORY, ROLE_REPOSITORY } from "../rbac/contracts";
import {
  ActiveRecordPermissionRepository,
  ActiveRecordRoleRepository,
} from "../rbac/rbac.repository";
import { RbacService } from "../rbac/rbac.service";
import { AuthService } from "../session/auth.service";
import { SESSION_REPOSITORY } from "../session/contracts";
import { ActiveRecordSessionRepository } from "../session/session.repository";
import { SessionService } from "../session/session.service";
import { USER_REPOSITORY } from "../users/contracts";
import { ActiveRecordUserRepository } from "../users/user.repository";
import { UserService } from "../users/user.service";
import { EMAIL_VERIFICATION_REPOSITORY } from "../verification/contracts";
import { ActiveRecordEmailVerificationRepository } from "../verification/verification.repository";
import { EmailVerificationService } from "../verification/verification.service";
import { isSystemInstalled } from "./setup";

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

    // Application services
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
    // 1. Resolve and bind global auth context
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

    bindAuthContext({
      user,
      session,
      rbac,
      passwordReset,
      emailVerification,
      auth,
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

    // 4. Publish system:not-installed if no users exist
    await isSystemInstalled();
  }
}
