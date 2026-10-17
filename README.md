[![CI](https://github.com/veapjs/veap-auth/actions/workflows/CI.yml/badge.svg)](https://github.com/veapjs/veap-auth/actions/workflows/CI.yml)
[![Release](https://github.com/veapjs/veap-auth/actions/workflows/RELEASE.yml/badge.svg)](https://github.com/veapjs/veap-auth/actions/workflows/RELEASE.yml)
[![Version](https://img.shields.io/npm/v/@veap%2Fauth?style=flat-square&color=181717&logo=npm&logoColor=959da5)](https://www.npmjs.com/package/@veap/auth)
[![Discord](https://img.shields.io/badge/Discord-join-5865F2?style=flat-square&logo=discord&logoColor=959da5)](https://discord.gg/qTkrCwpMW)

# @veap/auth

Production-ready authentication, session management, RBAC, and cryptographic
adapters for Veap and Next.js applications.

## Overview

`@veap/auth` provides a modular authentication engine adhering to clean
architecture principles modeled after `@veap/kernel`. It decouples domain entities (users, sessions, roles,
permissions) and ports (hasher, token generator, cipher) into dedicated functional modules. It includes ready-to-use Next.js Server
Actions, automatic database migrations, and Active Record adapters powered by
`@veap/database`.

## Architecture & Structure

Following the same modular, domain-driven structure as `@veap/kernel`:

```text
src/
├── actions/        # Next.js Server Actions (signIn, signUp, signOut, etc.)
├── client/         # React hooks and context (useUser, AuthProvider)
├── common/         # Common context, routes, registry, and augmentation
├── crypto/         # Cryptography ports and adapters (bcrypt, AES, tokens)
├── migrations/     # Database migration definitions
├── models/         # ActiveRecord database models (User, Role, Session, etc.)
├── passwords/      # Password reset repositories, service, and facades
├── providers/      # AuthServiceProvider and bootstrap setup
├── rbac/           # Role-based access control repositories, service, and facades
├── session/        # Session repository, SessionService, and AuthService
├── users/          # User repository, UserService, and facades
├── validation/     # Zod input validation schemas
├── index.ts        # Main barrel entrypoint
├── server.ts       # Server-only utilities entrypoint
├── client.tsx      # React client entrypoint
├── actions.ts      # Server actions entrypoint
└── models.ts       # ActiveRecord models entrypoint
```

## Features

- **Multi-layer authentication**: Secure password hashing with bcrypt, session
  token generation via `@oslojs/crypto`, and AES secret encryption.
- **Session management**: Database-backed session persistence with automatic
  token hashing, TTL expiry, and sliding-window extension.
- **Role-Based Access Control (RBAC)**: Fine-grained roles and permissions
  associated with users through many-to-many database relations.
- **Next.js Server Actions**: First-class `signIn`, `signUp`, `signOut`, and
  `getCurrentSession` actions returning typed `Result` objects.
- **Automated migrations**: Self-bootstrapping migrations for users, sessions,
  roles, permissions, password reset requests, and email verification.
- **Client & React hooks**: Lightweight `useUser()` hook and `AuthProvider`
  for responsive user sessions.

## Installation

```bash
# Using bun
bun add @veap/auth @veap/kernel @veap/database

# Using pnpm
pnpm add @veap/auth @veap/kernel @veap/database

# Using npm
npm install @veap/auth @veap/kernel @veap/database
```

## Usage

### Register in Application Builder

Include `AuthServiceProvider` in your application composition root:

```ts
import { Application } from "@veap/kernel";
import { DatabaseServiceProvider } from "@veap/database";
import { AuthServiceProvider } from "@veap/auth";

export const app = Application.configure()
  .use(DatabaseServiceProvider)
  .use(
    (c) =>
      new AuthServiceProvider(c, {
        autoMigrate: true, // Automatically applies auth tables on boot
      }),
  )
  .create();
```

### Sign In & Sign Out with Server Actions

Authenticate users in server components or server actions:

```ts
"use server";

import { signIn, signOut, getCurrentSession } from "@veap/auth";

export async function handleLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = await signIn({ email, password });

  if (!result.success) {
    return { error: result.error?.message || "Invalid credentials" };
  }

  if (result.data.status === "CHALLENGE_REQUIRED") {
    return { challenge: result.data };
  }

  return { user: result.data.user };
}

export async function handleLogout() {
  await signOut();
}

export async function getActiveUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}
```

### Querying Auth Models Directly

Interact with Active Record models provided by `@veap/auth/models`:

```ts
import { User, Role } from "@veap/auth/models";
import { hashPassword } from "@veap/auth/server";

// Create a new user with hashed credentials
const user = await User.create({
  username: "janedoe",
  email: "jane@example.com",
  password: await hashPassword("securePassword123"),
  recovery_code: Buffer.from("recovery-key-bytes"),
});

// Check roles and permissions
const adminRole = await Role.query().where("name", "admin").first();
if (adminRole) {
  await user.roles().attach(adminRole.id);
}
```

## Subpath Exports

| Export Path             | Content                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `@veap/auth`            | Core actions (`signIn`, `signOut`), provider, context, and schemas    |
| `@veap/auth/client`     | React client components, context, and `useUser` hook                  |
| `@veap/auth/server`     | Server cryptographic utilities (`hashPassword`, `verifyPasswordHash`) |
| `@veap/auth/actions`    | Next.js Server Actions directly exportable for actions boundaries     |
| `@veap/auth/models`     | Active Record models (`User`, `Session`, `Role`, `Permission`)        |
| `@veap/auth/migrations` | Knex migrations for authentication tables                             |
| `@veap/auth/validation` | Zod validation schemas (`loginSchema`, `registerSchema`, and others)  |

## Documentation

For full guides and authentication customization, visit:

- **Official Website**: [https://veap.pl](https://veap.pl)
- **Documentation**: [https://veap.pl/docs](https://veap.pl/docs)
- **GitHub Repository**: [https://github.com/veapjs/veap-auth](https://github.com/veapjs/veap-auth)

## License

MIT
