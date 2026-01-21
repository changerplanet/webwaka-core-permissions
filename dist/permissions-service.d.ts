/**
 * Core Permissions Service
 *
 * Provides role-based access control (RBAC) and capability-based permission
 * checks with tenant isolation, powered by Casbin.
 */
import { TenantId, UserId, RoleId, CapabilityId, Role, UserRoleAssignment, PermissionCheckInput, PermissionCheckResult, CreateRoleInput, UpdateRoleInput, AssignRoleInput, PolicyContext } from './types';
import { RoleStorage, UserRoleStorage } from './storage';
/**
 * Permissions service configuration
 */
export interface PermissionsServiceConfig {
    roleStorage: RoleStorage;
    userRoleStorage: UserRoleStorage;
}
/**
 * Permissions Service
 *
 * Provides deterministic, auditable permission checks using Casbin.
 */
export declare class PermissionsService {
    private roleStorage;
    private userRoleStorage;
    private enforcer;
    constructor(config: PermissionsServiceConfig);
    /**
     * Create a new role
     */
    createRole(input: CreateRoleInput): Promise<Role>;
    /**
     * Get a role by ID
     */
    getRole(tenantId: TenantId, roleId: RoleId): Promise<Role | null>;
    /**
     * Update a role
     */
    updateRole(tenantId: TenantId, roleId: RoleId, input: UpdateRoleInput): Promise<Role>;
    /**
     * Delete a role
     */
    deleteRole(tenantId: TenantId, roleId: RoleId): Promise<void>;
    /**
     * List all roles in a tenant
     */
    listRoles(tenantId: TenantId): Promise<Role[]>;
    /**
     * Assign a role to a user
     */
    assignRole(input: AssignRoleInput): Promise<UserRoleAssignment>;
    /**
     * Remove a role from a user
     */
    removeRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void>;
    /**
     * Get all roles assigned to a user
     */
    getUserRoles(tenantId: TenantId, userId: UserId): Promise<Role[]>;
    /**
     * Get all capabilities for a user (aggregated from all roles)
     */
    getUserCapabilities(tenantId: TenantId, userId: UserId): Promise<CapabilityId[]>;
    /**
     * Check if a user has a specific capability
     *
     * Returns a deterministic, auditable result explaining:
     * - Whether access is allowed or denied
     * - Which roles/policies granted access (if allowed)
     * - The reason for denial (if denied)
     */
    checkPermission(input: PermissionCheckInput): Promise<PermissionCheckResult>;
    /**
     * Check if a user has ALL of the specified capabilities
     */
    checkPermissions(tenantId: TenantId, userId: UserId, capabilities: CapabilityId[]): Promise<PermissionCheckResult>;
    /**
     * Check if a user has ANY of the specified capabilities
     */
    checkAnyPermission(tenantId: TenantId, userId: UserId, capabilities: CapabilityId[]): Promise<PermissionCheckResult>;
    /**
     * Build a policy context for a user
     */
    buildPolicyContext(tenantId: TenantId, userId: UserId): Promise<PolicyContext>;
    /**
     * Generate a unique ID
     */
    private generateId;
}
//# sourceMappingURL=permissions-service.d.ts.map