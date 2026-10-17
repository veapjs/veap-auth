import { app } from "@veap/kernel";
import { authContext, isAuthContextBound } from "../common/context.js";
import { RbacService } from "./rbac.service.js";

async function resolveRbacService(): Promise<RbacService> {
  if (isAuthContextBound()) {
    return authContext().rbac;
  }
  const g = globalThis as any;
  if (g.__VEAP_BOOTSTRAPPING_PROMISE__) {
    try {
      await g.__VEAP_BOOTSTRAPPING_PROMISE__;
    } catch {}
    if (isAuthContextBound()) {
      return authContext().rbac;
    }
  }
  return await app(RbacService);
}

// --- Roles ---

export async function getRoles() {
  const service = await resolveRbacService();
  return service.getRoles();
}

export async function getRoleById(roleId: string) {
  const service = await resolveRbacService();
  return service.getRoleById(roleId);
}

export async function createRole(name: string, description?: string) {
  const service = await resolveRbacService();
  return service.createRole(name, description);
}

export async function deleteRole(roleId: string): Promise<void> {
  const service = await resolveRbacService();
  return service.deleteRole(roleId);
}

// --- Permissions ---

export async function getPermissions() {
  const service = await resolveRbacService();
  return service.getPermissions();
}

export async function getPermissionById(permissionId: string) {
  const service = await resolveRbacService();
  return service.getPermissionById(permissionId);
}

export async function createPermission(name: string, description?: string) {
  const service = await resolveRbacService();
  return service.createPermission(name, description);
}

export async function deletePermission(permissionId: string): Promise<void> {
  const service = await resolveRbacService();
  return service.deletePermission(permissionId);
}

// --- Mappings ---

export async function getRolePermissions(roleId: string) {
  const service = await resolveRbacService();
  return service.getRolePermissions(roleId);
}

export async function assignPermissionToRole(
  roleId: string,
  permissionId: string,
): Promise<void> {
  const service = await resolveRbacService();
  return service.assignPermissionToRole(roleId, permissionId);
}

export async function revokePermissionFromRole(
  roleId: string,
  permissionId: string,
): Promise<void> {
  const service = await resolveRbacService();
  return service.revokePermissionFromRole(roleId, permissionId);
}

// --- User Assignment ---

export async function assignRoleToUser(
  userId: string,
  roleId: string,
): Promise<void> {
  const service = await resolveRbacService();
  return service.assignRoleToUser(userId, roleId);
}

export async function revokeRoleFromUser(
  userId: string,
  roleId: string,
): Promise<void> {
  const service = await resolveRbacService();
  return service.revokeRoleFromUser(userId, roleId);
}

export async function assignPermissionToUser(
  userId: string,
  permissionId: string,
): Promise<void> {
  const service = await resolveRbacService();
  return service.assignPermissionToUser(userId, permissionId);
}

export async function revokePermissionFromUser(
  userId: string,
  permissionId: string,
): Promise<void> {
  const service = await resolveRbacService();
  return service.revokePermissionFromUser(userId, permissionId);
}

export async function getUserRbacData(userId: string) {
  const service = await resolveRbacService();
  return service.getUserRbacData(userId);
}
