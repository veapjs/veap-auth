import { Model } from "@veap/database";
import { Permission } from "./Permission.js";
import { User } from "./User.js";

export interface RoleAttributes {
  id: string;
  name: string;
  description?: string | null;
}

export class Role extends Model<RoleAttributes> {
  static override table = "roles";
  static override timestamps = false;

  /**
   * Users assigned to this role.
   */
  users() {
    return this.belongsToMany(
      User,
      "users_to_roles",
      "role_id",
      "user_id",
      "id",
      "id",
    );
  }

  /**
   * Permissions granted to this role.
   */
  permissions() {
    return this.belongsToMany(
      Permission,
      "roles_to_permissions",
      "role_id",
      "permission_id",
      "id",
      "id",
    );
  }
}
