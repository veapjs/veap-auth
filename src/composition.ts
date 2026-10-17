import { ApplicationBuilder, type Container } from "@veap/kernel";
import type { AuthConfig } from "./common/types.js";
import { AuthServiceProvider } from "./providers/auth.provider.js";

declare module "@veap/kernel" {
  interface ApplicationBuilder {
    /**
     * Registers the {@link AuthServiceProvider} with the application.
     */
    withAuth(config?: AuthConfig): this;
  }
}

ApplicationBuilder.prototype.withAuth = function (
  this: ApplicationBuilder,
  config?: AuthConfig,
): ApplicationBuilder {
  return this.use((c: Container) => new AuthServiceProvider(c, config));
};
