import type { UserPermission, UserRole } from "../common/index.js";

export type { UserPermission, UserRole };

/** A role as persisted (already mapped to a plain object). */
export interface RoleRecord {
  id: string;
  name: string;
  description?: string | null;
  [key: string]: any;
}

/** Minimal `{ id, name }` reference used by RBAC read models. */
export interface AccessGrant {
  id: string;
  name: string;
}

/**
 * The roles and permissions graph of a single user, as loaded from the
 * persistence layer.
 */
export interface UserAccess {
  roles: Array<AccessGrant & { permissions: AccessGrant[] }>;
  directPermissions: AccessGrant[];
}

export interface CreateRoleRecord {
  name: string;
  description?: string;
}

/**
 * Role persistence port.
 */
export interface IRoleRepository {
  findAll(): Promise<RoleRecord[]>;

  findById(id: string): Promise<RoleRecord | undefined>;

  findByName(name: string): Promise<RoleRecord | null>;

  create(record: CreateRoleRecord): Promise<RoleRecord>;

  remove(id: string): Promise<void>;

  /** Permissions granted to a role. */
  getPermissions(roleId: string): Promise<AccessGrant[]>;

  /**
   * Loads the full role/permission graph for a user.
   * Returns `null` when the user does not exist.
   */
  loadUserAccess(userId: string): Promise<UserAccess | null>;

  assignToUser(userId: string, roleId: string): Promise<void>;

  revokeFromUser(userId: string, roleId: string): Promise<void>;
}

/** Injection token for the role repository port. */
export const ROLE_REPOSITORY = Symbol.for("veap:auth:role-repository");

/** A permission as persisted (already mapped to a plain object). */
export interface PermissionRecord {
  id: string;
  name: string;
  description?: string | null;
  [key: string]: any;
}

export interface CreatePermissionRecord {
  name: string;
  description?: string;
}

/**
 * Permission persistence port.
 */
export interface IPermissionRepository {
  findAll(): Promise<PermissionRecord[]>;

  findById(id: string): Promise<PermissionRecord | undefined>;

  create(record: CreatePermissionRecord): Promise<PermissionRecord>;

  remove(id: string): Promise<void>;

  assignToRole(roleId: string, permissionId: string): Promise<void>;

  revokeFromRole(roleId: string, permissionId: string): Promise<void>;

  assignToUser(userId: string, permissionId: string): Promise<void>;

  revokeFromUser(userId: string, permissionId: string): Promise<void>;
}

/** Injection token for the permission repository port. */
export const PERMISSION_REPOSITORY = Symbol.for(
  "veap:auth:permission-repository",
);
