import { getKnex } from "@veap/database";
import { Permission } from "../models/Permission.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import type {
  AccessGrant,
  CreatePermissionRecord,
  CreateRoleRecord,
  IPermissionRepository,
  IRoleRepository,
  PermissionRecord,
  RoleRecord,
  UserAccess,
} from "./contracts.js";

/**
 * `IRoleRepository` adapter backed by the `Role` ActiveRecord model and the
 * `users_to_roles` pivot table.
 */
export class ActiveRecordRoleRepository implements IRoleRepository {
  async findAll(): Promise<RoleRecord[]> {
    const roles = await Role.query().orderBy("name", "asc").get();
    return roles.map((role) => role.toJSON() as RoleRecord);
  }

  async findById(id: string): Promise<RoleRecord | undefined> {
    const role = await Role.find(id);
    return role ? (role.toJSON() as RoleRecord) : undefined;
  }

  async findByName(name: string): Promise<RoleRecord | null> {
    const role = await Role.where("name", name).first();
    return role ? (role.toJSON() as RoleRecord) : null;
  }

  async create(record: CreateRoleRecord): Promise<RoleRecord> {
    const role = await Role.create({
      name: record.name,
      description: record.description,
    });

    return role.toJSON() as RoleRecord;
  }

  async remove(id: string): Promise<void> {
    await Role.destroy(id);
  }

  async getPermissions(roleId: string): Promise<AccessGrant[]> {
    const role = await Role.find(roleId);
    if (!role) return [];

    const permissions = await role.permissions().get();
    return permissions.map((permission) => ({
      id: permission.id as string,
      name: permission.name as string,
    }));
  }

  async loadUserAccess(userId: string): Promise<UserAccess | null> {
    const user = await User.query()
      .with("roles.permissions", "permissions")
      .find(userId);

    if (!user) return null;

    const roles = (user.getRelation("roles") as Role[]) || [];
    const direct = (user.getRelation("permissions") as Permission[]) || [];

    return {
      roles: roles.map((role) => ({
        id: role.id as string,
        name: role.name as string,
        permissions: (
          (role.getRelation("permissions") as Permission[]) || []
        ).map((permission) => ({
          id: permission.id as string,
          name: permission.name as string,
        })),
      })),
      directPermissions: direct.map((permission) => ({
        id: permission.id as string,
        name: permission.name as string,
      })),
    };
  }

  async assignToUser(userId: string, roleId: string): Promise<void> {
    const knex = getKnex();
    await knex("users_to_roles")
      .insert({ user_id: userId, role_id: roleId })
      .onConflict(["user_id", "role_id"])
      .ignore();
  }

  async revokeFromUser(userId: string, roleId: string): Promise<void> {
    const knex = getKnex();
    await knex("users_to_roles")
      .where({
        user_id: userId,
        role_id: roleId,
      })
      .delete();
  }
}

/**
 * `IPermissionRepository` adapter backed by the `Permission` ActiveRecord model
 * and the `roles_to_permissions` / `users_to_permissions` pivot tables.
 */
export class ActiveRecordPermissionRepository implements IPermissionRepository {
  async findAll(): Promise<PermissionRecord[]> {
    const permissions = await Permission.query().orderBy("name", "asc").get();
    return permissions.map(
      (permission) => permission.toJSON() as PermissionRecord,
    );
  }

  async findById(id: string): Promise<PermissionRecord | undefined> {
    const permission = await Permission.find(id);
    return permission ? (permission.toJSON() as PermissionRecord) : undefined;
  }

  async create(record: CreatePermissionRecord): Promise<PermissionRecord> {
    const permission = await Permission.create({
      name: record.name,
      description: record.description,
    });

    return permission.toJSON() as PermissionRecord;
  }

  async remove(id: string): Promise<void> {
    await Permission.destroy(id);
  }

  async assignToRole(roleId: string, permissionId: string): Promise<void> {
    const knex = getKnex();
    await knex("roles_to_permissions")
      .insert({ role_id: roleId, permission_id: permissionId })
      .onConflict(["role_id", "permission_id"])
      .ignore();
  }

  async revokeFromRole(roleId: string, permissionId: string): Promise<void> {
    const knex = getKnex();
    await knex("roles_to_permissions")
      .where({
        role_id: roleId,
        permission_id: permissionId,
      })
      .delete();
  }

  async assignToUser(userId: string, permissionId: string): Promise<void> {
    const knex = getKnex();
    await knex("users_to_permissions")
      .insert({ user_id: userId, permission_id: permissionId })
      .onConflict(["user_id", "permission_id"])
      .ignore();
  }

  async revokeFromUser(userId: string, permissionId: string): Promise<void> {
    const knex = getKnex();
    await knex("users_to_permissions")
      .where({
        user_id: userId,
        permission_id: permissionId,
      })
      .delete();
  }
}
