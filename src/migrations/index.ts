import { runMigrations } from "@veap/database";
import * as m0001 from "./0001_create_auth_tables.js";

export const authMigrations = [m0001];

export async function runAuthMigrations(): Promise<void> {
  await runMigrations("auth", authMigrations);
}

export default authMigrations;
