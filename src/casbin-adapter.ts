/**
 * Casbin Adapter for WebWaka Permissions
 * 
 * Provides domain-aware RBAC using Casbin with:
 * - subject = userId
 * - domain = tenantId
 * - action = capability
 */

import { newEnforcer, Enforcer, newModel } from 'casbin';
import { TenantId, UserId, RoleId, CapabilityId } from './types';
import { RoleStorage, UserRoleStorage } from './storage';

/**
 * RBAC model with domain (tenant) support
 * 
 * This model implements:
 * - request: subject (user), domain (tenant), action (capability)
 * - policy: role, domain, capability
 * - role: user has role in domain
 * - matchers: user has role in domain AND role has capability in domain
 */
const RBAC_MODEL = `
[request_definition]
r = sub, dom, act

[policy_definition]
p = sub, dom, act

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.act == p.act
`;

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
export class InMemoryPolicyStorage implements PolicyStorage {
  private policies: Map<string, string[][]> = new Map();
  private roleLinks: Map<string, string[][]> = new Map();

  async loadPolicies(tenantId: TenantId): Promise<string[][]> {
    return this.policies.get(tenantId) || [];
  }

  async savePolicies(tenantId: TenantId, policies: string[][]): Promise<void> {
    this.policies.set(tenantId, policies);
  }

  async loadRoleLinks(tenantId: TenantId): Promise<string[][]> {
    return this.roleLinks.get(tenantId) || [];
  }

  async saveRoleLinks(tenantId: TenantId, links: string[][]): Promise<void> {
    this.roleLinks.set(tenantId, links);
  }
}

/**
 * Casbin-based permission enforcer
 */
export class CasbinEnforcer {
  private enforcer: Enforcer | null = null;
  private roleStorage: RoleStorage;
  private userRoleStorage: UserRoleStorage;

  constructor(roleStorage: RoleStorage, userRoleStorage: UserRoleStorage) {
    this.roleStorage = roleStorage;
    this.userRoleStorage = userRoleStorage;
  }

  /**
   * Initialize the Casbin enforcer
   */
  async initialize(): Promise<void> {
    const model = newModel(RBAC_MODEL);
    this.enforcer = await newEnforcer(model);
  }

  /**
   * Ensure the enforcer is initialized
   */
  private async ensureInitialized(): Promise<Enforcer> {
    if (!this.enforcer) {
      await this.initialize();
    }
    return this.enforcer!;
  }

  /**
   * Sync policies from storage to Casbin enforcer for a tenant
   */
  async syncPolicies(tenantId: TenantId): Promise<void> {
    const enforcer = await this.ensureInitialized();

    // Clear existing policies for this tenant
    const existingPolicies = await enforcer.getFilteredPolicy(1, tenantId);
    for (const policy of existingPolicies) {
      await enforcer.removePolicy(...policy);
    }

    const existingGroupings = await enforcer.getFilteredGroupingPolicy(2, tenantId);
    for (const grouping of existingGroupings) {
      await enforcer.removeGroupingPolicy(...grouping);
    }

    // Load roles and create policies
    const roles = await this.roleStorage.listRoles(tenantId);
    for (const role of roles) {
      for (const capability of role.capabilities) {
        // p = role, domain, capability
        await enforcer.addPolicy(role.roleId, tenantId, capability);
      }
    }

    // Load user-role assignments
    const allRoleIds = roles.map(r => r.roleId);
    for (const roleId of allRoleIds) {
      const userIds = await this.userRoleStorage.getRoleUsers(tenantId, roleId);
      for (const userId of userIds) {
        // g = user, role, domain
        await enforcer.addGroupingPolicy(userId, roleId, tenantId);
      }
    }
  }

  /**
   * Add a role policy (role -> capability mapping)
   */
  async addRolePolicy(tenantId: TenantId, roleId: RoleId, capability: CapabilityId): Promise<void> {
    const enforcer = await this.ensureInitialized();
    await enforcer.addPolicy(roleId, tenantId, capability);
  }

  /**
   * Remove a role policy
   */
  async removeRolePolicy(tenantId: TenantId, roleId: RoleId, capability: CapabilityId): Promise<void> {
    const enforcer = await this.ensureInitialized();
    await enforcer.removePolicy(roleId, tenantId, capability);
  }

  /**
   * Clear all policies for a role
   */
  async clearRolePolicies(tenantId: TenantId, roleId: RoleId): Promise<void> {
    const enforcer = await this.ensureInitialized();
    const policies = await enforcer.getFilteredPolicy(0, roleId, tenantId);
    for (const policy of policies) {
      await enforcer.removePolicy(...policy);
    }
  }

  /**
   * Add user-role assignment
   */
  async addUserRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void> {
    const enforcer = await this.ensureInitialized();
    await enforcer.addGroupingPolicy(userId, roleId, tenantId);
  }

  /**
   * Remove user-role assignment
   */
  async removeUserRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void> {
    const enforcer = await this.ensureInitialized();
    await enforcer.removeGroupingPolicy(userId, roleId, tenantId);
  }

  /**
   * Check if a user has a capability in a tenant
   */
  async enforce(tenantId: TenantId, userId: UserId, capability: CapabilityId): Promise<boolean> {
    const enforcer = await this.ensureInitialized();
    return enforcer.enforce(userId, tenantId, capability);
  }

  /**
   * Get all roles that grant a specific capability to a user
   */
  async getGrantingRoles(tenantId: TenantId, userId: UserId, capability: CapabilityId): Promise<RoleId[]> {
    const enforcer = await this.ensureInitialized();
    const grantingRoles: RoleId[] = [];

    // Get all roles for the user in this tenant
    const userRoles = await enforcer.getFilteredGroupingPolicy(0, userId);
    const tenantRoles = userRoles
      .filter(([, , domain]) => domain === tenantId)
      .map(([, role]) => role);

    // Check which roles have the capability
    for (const roleId of tenantRoles) {
      const policies = await enforcer.getFilteredPolicy(0, roleId, tenantId, capability);
      if (policies.length > 0) {
        grantingRoles.push(roleId);
      }
    }

    return grantingRoles;
  }

  /**
   * Get all capabilities for a user in a tenant
   */
  async getUserCapabilities(tenantId: TenantId, userId: UserId): Promise<CapabilityId[]> {
    const enforcer = await this.ensureInitialized();
    const capabilities = new Set<CapabilityId>();

    // Get all roles for the user in this tenant
    const userRoles = await enforcer.getFilteredGroupingPolicy(0, userId);
    const tenantRoles = userRoles
      .filter(([, , domain]) => domain === tenantId)
      .map(([, role]) => role);

    // Get all capabilities from those roles
    for (const roleId of tenantRoles) {
      const policies = await enforcer.getFilteredPolicy(0, roleId, tenantId);
      for (const policy of policies) {
        capabilities.add(policy[2]); // capability is at index 2
      }
    }

    return Array.from(capabilities);
  }

  /**
   * Get all roles for a user in a tenant
   */
  async getUserRoles(tenantId: TenantId, userId: UserId): Promise<RoleId[]> {
    const enforcer = await this.ensureInitialized();
    const userRoles = await enforcer.getFilteredGroupingPolicy(0, userId);
    return userRoles
      .filter(([, , domain]) => domain === tenantId)
      .map(([, role]) => role);
  }
}
