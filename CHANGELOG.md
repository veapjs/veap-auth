# @veap/auth

## 0.1.7

### Patch Changes

- Updated dependencies []:
  - @veap/kernel@0.2.0
  - @veap/database@0.1.7
  - @veap/mail@0.1.7

## 0.1.6

### Patch Changes

- Updated dependencies []:
  - @veap/kernel@0.1.6
  - @veap/database@0.1.6
  - @veap/mail@0.1.6

## 0.1.5

### Patch Changes

- fix: update versions and dependencies
- Updated dependencies []:
  - @veap/database@0.1.5
  - @veap/kernel@0.1.5
  - @veap/mail@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @veap/database@0.1.4
  - @veap/kernel@0.1.4
  - @veap/mail@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies []:
  - @veap/database@0.1.3
  - @veap/kernel@0.1.3
  - @veap/mail@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies []:
  - @veap/database@0.1.2
  - @veap/kernel@0.1.2
  - @veap/mail@0.1.2

## 0.1.1

### Patch Changes

- Fix double-hashing bug in AuthService.signUp, clean up client validation bundle leaks, define AUTH_ROUTES token, dynamic auth route redirects, native Node.js ESM module resolution, and cold-start race protection:

  - Define and export `AUTH_ROUTES` IoC token (`Token<AuthRoutesConfig>`) within `@veap/auth` (`src/common/tokens.ts`, `src/common/routes.ts`, `src/common/index.ts`, `src/index.ts`), decoupling it from `@veap/kernel`.
  - Fix missing `.js` extensions across all relative module imports/exports in `src/` ensuring full compliance with native Node.js ESM loaders (`ERR_MODULE_NOT_FOUND` resolution).
  - Fix double hashing of user passwords during `AuthService.signUp` (preventing login failure for new accounts).
  - Remove ActiveRecord `User` database dependency from `src/validation/index.ts` to prevent backend leaks into client bundles; provide `isEmailAvailable` via `UserService` and `user.facade.ts`.
  - Guard `isSystemInstalled` in `AuthServiceProvider.boot()` with `isDatabaseInitialized()`.
  - Use dynamic configured routes from `getAuthRoutes()` for `sessionSignOut` and `EmailVerificationService` redirects.
  - Add cold-start bootstrapping promise wait in server facades (`user`, `rbac`, `password-reset`, `verification`).
  - Remove dead `swr` peerDependency from `package.json`.
  - Add `updateUserAvatar` and `getUserRecoveryCode` with backwards-compatible `@deprecated` aliases.
  - Add comprehensive `auth.service.test.ts` verifying full signup, email availability, and login flows.
- Updated dependencies []:
  - @veap/database@0.1.1
  - @veap/kernel@0.1.1
  - @veap/mail@0.1.1

## 0.1.0

### Minor Changes

- Initial public scaffold of the Veap auth.
