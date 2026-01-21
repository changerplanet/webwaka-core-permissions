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
export declare class InMemoryRoleStorage implements RoleStorage {
    private roles;
    private getKey;
    createRole(role: Role): Promise<Role>;
    getRole(tenantId: TenantId, roleId: RoleId): Promise<Role | null>;
    updateRole(tenantId: TenantId, roleId: RoleId, updates: Partial<Role>): Promise<Role>;
    deleteRole(tenantId: TenantId, roleId: RoleId): Promise<void>;
    listRoles(tenantId: TenantId): Promise<Role[]>;
}
/**
 * In-memory implementation for user-role assignments
 */
export declare class InMemoryUserRoleStorage implements UserRoleStorage {
    private assignments;
    private getKey;
    private getUserKey;
    private getRoleKey;
    assignRole(assignment: UserRoleAssignment): Promise<UserRoleAssignment>;
    removeRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void>;
    getUserRoles(tenantId: TenantId, userId: UserId): Promise<RoleId[]>;
    getRoleUsers(tenantId: TenantId, roleId: RoleId): Promise<UserId[]>;
}
//# sourceMappingURL=storage.d.ts.map