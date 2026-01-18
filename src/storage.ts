/**
 * Storage interface for permissions data
 */

import { TenantId, UserId, RoleId, Role, UserRoleAssignment } from './types';

/**
 * Storage interface for roles
 */
export interface RoleStorage {
  /**
   * Create a new role
   */
  createRole(role: Role): Promise<Role>;

  /**
   * Get a role by ID
   */
  getRole(tenantId: TenantId, roleId: RoleId): Promise<Role | null>;

  /**
   * Update a role
   */
  updateRole(tenantId: TenantId, roleId: RoleId, updates: Partial<Role>): Promise<Role>;

  /**
   * Delete a role
   */
  deleteRole(tenantId: TenantId, roleId: RoleId): Promise<void>;

  /**
   * List roles in a tenant
   */
  listRoles(tenantId: TenantId): Promise<Role[]>;
}

/**
 * Storage interface for user-role assignments
 */
export interface UserRoleStorage {
  /**
   * Assign a role to a user
   */
  assignRole(assignment: UserRoleAssignment): Promise<UserRoleAssignment>;

  /**
   * Remove a role from a user
   */
  removeRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void>;

  /**
   * Get all roles for a user
   */
  getUserRoles(tenantId: TenantId, userId: UserId): Promise<RoleId[]>;

  /**
   * Get all users with a specific role
   */
  getRoleUsers(tenantId: TenantId, roleId: RoleId): Promise<UserId[]>;
}

/**
 * In-memory implementation for testing
 */
export class InMemoryRoleStorage implements RoleStorage {
  private roles: Map<string, Role> = new Map();

  private getKey(tenantId: TenantId, roleId: RoleId): string {
    return `${tenantId}:${roleId}`;
  }

  async createRole(role: Role): Promise<Role> {
    const key = this.getKey(role.tenantId, role.roleId);
    if (this.roles.has(key)) {
      throw new Error(`Role already exists: ${role.roleId}`);
    }
    this.roles.set(key, role);
    return role;
  }

  async getRole(tenantId: TenantId, roleId: RoleId): Promise<Role | null> {
    const key = this.getKey(tenantId, roleId);
    return this.roles.get(key) || null;
  }

  async updateRole(tenantId: TenantId, roleId: RoleId, updates: Partial<Role>): Promise<Role> {
    const key = this.getKey(tenantId, roleId);
    const existing = this.roles.get(key);
    if (!existing) {
      throw new Error(`Role not found: ${roleId}`);
    }

    const updated = {
      ...existing,
      ...updates,
      roleId: existing.roleId, // Immutable
      tenantId: existing.tenantId, // Immutable
      createdAt: existing.createdAt, // Immutable
      updatedAt: new Date(),
    };

    this.roles.set(key, updated);
    return updated;
  }

  async deleteRole(tenantId: TenantId, roleId: RoleId): Promise<void> {
    const key = this.getKey(tenantId, roleId);
    this.roles.delete(key);
  }

  async listRoles(tenantId: TenantId): Promise<Role[]> {
    return Array.from(this.roles.values())
      .filter(role => role.tenantId === tenantId);
  }
}

/**
 * In-memory implementation for user-role assignments
 */
export class InMemoryUserRoleStorage implements UserRoleStorage {
  private assignments: Map<string, UserRoleAssignment> = new Map();

  private getKey(tenantId: TenantId, userId: UserId, roleId: RoleId): string {
    return `${tenantId}:${userId}:${roleId}`;
  }

  private getUserKey(tenantId: TenantId, userId: UserId): string {
    return `${tenantId}:${userId}:`;
  }

  private getRoleKey(tenantId: TenantId, roleId: RoleId): string {
    return `${tenantId}:`;
  }

  async assignRole(assignment: UserRoleAssignment): Promise<UserRoleAssignment> {
    const key = this.getKey(assignment.tenantId, assignment.userId, assignment.roleId);
    this.assignments.set(key, assignment);
    return assignment;
  }

  async removeRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void> {
    const key = this.getKey(tenantId, userId, roleId);
    this.assignments.delete(key);
  }

  async getUserRoles(tenantId: TenantId, userId: UserId): Promise<RoleId[]> {
    const userKey = this.getUserKey(tenantId, userId);
    return Array.from(this.assignments.entries())
      .filter(([key]) => key.startsWith(userKey))
      .map(([, assignment]) => assignment.roleId);
  }

  async getRoleUsers(tenantId: TenantId, roleId: RoleId): Promise<UserId[]> {
    const roleKey = this.getRoleKey(tenantId, roleId);
    return Array.from(this.assignments.entries())
      .filter(([key, assignment]) => key.startsWith(roleKey) && assignment.roleId === roleId)
      .map(([, assignment]) => assignment.userId);
  }
}
