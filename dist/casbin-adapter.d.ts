/**
 * Casbin Adapter for WebWaka Permissions
 *
 * Provides domain-aware RBAC using Casbin with:
 * - subject = userId
 * - domain = tenantId
 * - action = capability
 */
import { TenantId, UserId, RoleId, CapabilityId } from './types';
import { RoleStorage, UserRoleStorage } from './storage';
/**
 * Policy storage interface for Casbin policies
 */
export interface PolicyStorage {
    loadPolicies(tenantId: TenantId): Promise<string[][]>;
    savePolicies(tenantId: TenantId, policies: string[][]): Promise<void>;
    loadRoleLinks(tenantId: TenantId): Promise<string[][]>;
    saveRoleLinks(tenantId: TenantId, links: string[][]): Promise<void>;
}
/**
 * In-memory policy storage for testing
 */
export declare class InMemoryPolicyStorage implements PolicyStorage {
    private policies;
    private roleLinks;
    loadPolicies(tenantId: TenantId): Promise<string[][]>;
    savePolicies(tenantId: TenantId, policies: string[][]): Promise<void>;
    loadRoleLinks(tenantId: TenantId): Promise<string[][]>;
    saveRoleLinks(tenantId: TenantId, links: string[][]): Promise<void>;
}
/**
 * Casbin-based permission enforcer
 */
export declare class CasbinEnforcer {
    private enforcer;
    private roleStorage;
    private userRoleStorage;
    constructor(roleStorage: RoleStorage, userRoleStorage: UserRoleStorage);
    /**
     * Initialize the Casbin enforcer
     */
    initialize(): Promise<void>;
    /**
     * Ensure the enforcer is initialized
     */
    private ensureInitialized;
    /**
     * Sync policies from storage to Casbin enforcer for a tenant
     */
    syncPolicies(tenantId: TenantId): Promise<void>;
    /**
     * Add a role policy (role -> capability mapping)
     */
    addRolePolicy(tenantId: TenantId, roleId: RoleId, capability: CapabilityId): Promise<void>;
    /**
     * Remove a role policy
     */
    removeRolePolicy(tenantId: TenantId, roleId: RoleId, capability: CapabilityId): Promise<void>;
    /**
     * Clear all policies for a role
     */
    clearRolePolicies(tenantId: TenantId, roleId: RoleId): Promise<void>;
    /**
     * Add user-role assignment
     */
    addUserRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void>;
    /**
     * Remove user-role assignment
     */
    removeUserRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void>;
    /**
     * Check if a user has a capability in a tenant
     */
    enforce(tenantId: TenantId, userId: UserId, capability: CapabilityId): Promise<boolean>;
    /**
     * Get all roles that grant a specific capability to a user
     */
    getGrantingRoles(tenantId: TenantId, userId: UserId, capability: CapabilityId): Promise<RoleId[]>;
    /**
     * Get all capabilities for a user in a tenant
     */
    getUserCapabilities(tenantId: TenantId, userId: UserId): Promise<CapabilityId[]>;
    /**
     * Get all roles for a user in a tenant
     */
    getUserRoles(tenantId: TenantId, userId: UserId): Promise<RoleId[]>;
}
//# sourceMappingURL=casbin-adapter.d.ts.map