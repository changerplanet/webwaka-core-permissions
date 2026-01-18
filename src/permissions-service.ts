/**
 * Core Permissions Service
 * 
 * Provides role-based access control (RBAC) and capability-based permission
 * checks with tenant isolation.
 */

import { randomBytes } from 'crypto';
import {
  TenantId,
  UserId,
  RoleId,
  CapabilityId,
  Role,
  UserRoleAssignment,
  PermissionCheckInput,
  PermissionCheckResult,
  CreateRoleInput,
  UpdateRoleInput,
  AssignRoleInput,
  PolicyContext,
} from './types';
import {
  validate,
  CreateRoleInputSchema,
  UpdateRoleInputSchema,
  PermissionCheckInputSchema,
  AssignRoleInputSchema,
  TenantIdSchema,
  UserIdSchema,
  RoleIdSchema,
} from './validation';
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
 */
export class PermissionsService {
  private roleStorage: RoleStorage;
  private userRoleStorage: UserRoleStorage;

  constructor(config: PermissionsServiceConfig) {
    this.roleStorage = config.roleStorage;
    this.userRoleStorage = config.userRoleStorage;
  }

  /**
   * Create a new role
   */
  async createRole(input: CreateRoleInput): Promise<Role> {
    const validated = validate(CreateRoleInputSchema, input);

    // Generate role ID
    const roleId = this.generateId();

    const role: Role = {
      roleId,
      tenantId: validated.tenantId,
      name: validated.name,
      description: validated.description,
      capabilities: validated.capabilities,
      metadata: validated.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.roleStorage.createRole(role);
  }

  /**
   * Get a role by ID
   */
  async getRole(tenantId: TenantId, roleId: RoleId): Promise<Role | null> {
    validate(TenantIdSchema, tenantId);
    validate(RoleIdSchema, roleId);
    return this.roleStorage.getRole(tenantId, roleId);
  }

  /**
   * Update a role
   */
  async updateRole(tenantId: TenantId, roleId: RoleId, input: UpdateRoleInput): Promise<Role> {
    validate(TenantIdSchema, tenantId);
    validate(RoleIdSchema, roleId);
    const validated = validate(UpdateRoleInputSchema, input);

    return this.roleStorage.updateRole(tenantId, roleId, {
      ...validated,
      updatedAt: new Date(),
    });
  }

  /**
   * Delete a role
   */
  async deleteRole(tenantId: TenantId, roleId: RoleId): Promise<void> {
    validate(TenantIdSchema, tenantId);
    validate(RoleIdSchema, roleId);
    await this.roleStorage.deleteRole(tenantId, roleId);
  }

  /**
   * List all roles in a tenant
   */
  async listRoles(tenantId: TenantId): Promise<Role[]> {
    validate(TenantIdSchema, tenantId);
    return this.roleStorage.listRoles(tenantId);
  }

  /**
   * Assign a role to a user
   */
  async assignRole(input: AssignRoleInput): Promise<UserRoleAssignment> {
    const validated = validate(AssignRoleInputSchema, input);

    // Verify role exists
    const role = await this.roleStorage.getRole(validated.tenantId, validated.roleId);
    if (!role) {
      throw new Error(`Role not found: ${validated.roleId}`);
    }

    const assignment: UserRoleAssignment = {
      tenantId: validated.tenantId,
      userId: validated.userId,
      roleId: validated.roleId,
      assignedAt: new Date(),
      assignedBy: validated.assignedBy,
    };

    return this.userRoleStorage.assignRole(assignment);
  }

  /**
   * Remove a role from a user
   */
  async removeRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void> {
    validate(TenantIdSchema, tenantId);
    validate(UserIdSchema, userId);
    validate(RoleIdSchema, roleId);
    await this.userRoleStorage.removeRole(tenantId, userId, roleId);
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(tenantId: TenantId, userId: UserId): Promise<Role[]> {
    validate(TenantIdSchema, tenantId);
    validate(UserIdSchema, userId);

    const roleIds = await this.userRoleStorage.getUserRoles(tenantId, userId);
    const roles: Role[] = [];

    for (const roleId of roleIds) {
      const role = await this.roleStorage.getRole(tenantId, roleId);
      if (role) {
        roles.push(role);
      }
    }

    return roles;
  }

  /**
   * Get all capabilities for a user (aggregated from all roles)
   */
  async getUserCapabilities(tenantId: TenantId, userId: UserId): Promise<CapabilityId[]> {
    const roles = await this.getUserRoles(tenantId, userId);
    const capabilities = new Set<CapabilityId>();

    for (const role of roles) {
      for (const capability of role.capabilities) {
        capabilities.add(capability);
      }
    }

    return Array.from(capabilities);
  }

  /**
   * Check if a user has a specific capability
   */
  async checkPermission(input: PermissionCheckInput): Promise<PermissionCheckResult> {
    const validated = validate(PermissionCheckInputSchema, input);

    // Get user's capabilities
    const capabilities = await this.getUserCapabilities(validated.tenantId, validated.userId);

    // Check if capability is present
    const allowed = capabilities.includes(validated.capability);

    if (allowed) {
      // Get roles that granted this capability
      const roles = await this.getUserRoles(validated.tenantId, validated.userId);
      const matchedRoles = roles
        .filter(role => role.capabilities.includes(validated.capability))
        .map(role => role.roleId);

      return {
        allowed: true,
        matchedRoles,
      };
    }

    return {
      allowed: false,
      reason: `User does not have capability: ${validated.capability}`,
    };
  }

  /**
   * Check if a user has ALL of the specified capabilities
   */
  async checkPermissions(
    tenantId: TenantId,
    userId: UserId,
    capabilities: CapabilityId[]
  ): Promise<PermissionCheckResult> {
    validate(TenantIdSchema, tenantId);
    validate(UserIdSchema, userId);

    const userCapabilities = await this.getUserCapabilities(tenantId, userId);
    const missing: CapabilityId[] = [];

    for (const capability of capabilities) {
      if (!userCapabilities.includes(capability)) {
        missing.push(capability);
      }
    }

    if (missing.length === 0) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `User is missing capabilities: ${missing.join(', ')}`,
    };
  }

  /**
   * Check if a user has ANY of the specified capabilities
   */
  async checkAnyPermission(
    tenantId: TenantId,
    userId: UserId,
    capabilities: CapabilityId[]
  ): Promise<PermissionCheckResult> {
    validate(TenantIdSchema, tenantId);
    validate(UserIdSchema, userId);

    const userCapabilities = await this.getUserCapabilities(tenantId, userId);

    for (const capability of capabilities) {
      if (userCapabilities.includes(capability)) {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: `User does not have any of the required capabilities: ${capabilities.join(', ')}`,
    };
  }

  /**
   * Build a policy context for a user
   */
  async buildPolicyContext(tenantId: TenantId, userId: UserId): Promise<PolicyContext> {
    validate(TenantIdSchema, tenantId);
    validate(UserIdSchema, userId);

    const roles = await this.getUserRoles(tenantId, userId);
    const capabilities = await this.getUserCapabilities(tenantId, userId);

    return {
      tenantId,
      userId,
      roles: roles.map(r => r.roleId),
      capabilities,
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return randomBytes(16).toString('hex');
  }
}
