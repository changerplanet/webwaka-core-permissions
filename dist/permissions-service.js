"use strict";
/**
 * Core Permissions Service
 *
 * Provides role-based access control (RBAC) and capability-based permission
 * checks with tenant isolation, powered by Casbin.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const crypto_1 = require("crypto");
const validation_1 = require("./validation");
const casbin_adapter_1 = require("./casbin-adapter");
/**
 * Permissions Service
 *
 * Provides deterministic, auditable permission checks using Casbin.
 */
class PermissionsService {
    constructor(config) {
        this.roleStorage = config.roleStorage;
        this.userRoleStorage = config.userRoleStorage;
        this.enforcer = new casbin_adapter_1.CasbinEnforcer(config.roleStorage, config.userRoleStorage);
    }
    /**
     * Create a new role
     */
    async createRole(input) {
        const validated = (0, validation_1.validate)(validation_1.CreateRoleInputSchema, input);
        const roleId = this.generateId();
        const role = {
            roleId,
            tenantId: validated.tenantId,
            name: validated.name,
            description: validated.description,
            capabilities: validated.capabilities,
            metadata: validated.metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const created = await this.roleStorage.createRole(role);
        // Sync Casbin policies
        for (const capability of created.capabilities) {
            await this.enforcer.addRolePolicy(created.tenantId, created.roleId, capability);
        }
        return created;
    }
    /**
     * Get a role by ID
     */
    async getRole(tenantId, roleId) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        (0, validation_1.validate)(validation_1.RoleIdSchema, roleId);
        return this.roleStorage.getRole(tenantId, roleId);
    }
    /**
     * Update a role
     */
    async updateRole(tenantId, roleId, input) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        (0, validation_1.validate)(validation_1.RoleIdSchema, roleId);
        const validated = (0, validation_1.validate)(validation_1.UpdateRoleInputSchema, input);
        // Get existing role to compare capabilities
        const existingRole = await this.roleStorage.getRole(tenantId, roleId);
        if (!existingRole) {
            throw new Error(`Role not found: ${roleId}`);
        }
        const updated = await this.roleStorage.updateRole(tenantId, roleId, {
            ...validated,
            updatedAt: new Date(),
        });
        // Update Casbin policies if capabilities changed
        if (validated.capabilities) {
            // Remove old capabilities
            await this.enforcer.clearRolePolicies(tenantId, roleId);
            // Add new capabilities
            for (const capability of validated.capabilities) {
                await this.enforcer.addRolePolicy(tenantId, roleId, capability);
            }
        }
        return updated;
    }
    /**
     * Delete a role
     */
    async deleteRole(tenantId, roleId) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        (0, validation_1.validate)(validation_1.RoleIdSchema, roleId);
        // Clear Casbin policies
        await this.enforcer.clearRolePolicies(tenantId, roleId);
        await this.roleStorage.deleteRole(tenantId, roleId);
    }
    /**
     * List all roles in a tenant
     */
    async listRoles(tenantId) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        return this.roleStorage.listRoles(tenantId);
    }
    /**
     * Assign a role to a user
     */
    async assignRole(input) {
        const validated = (0, validation_1.validate)(validation_1.AssignRoleInputSchema, input);
        // Verify role exists
        const role = await this.roleStorage.getRole(validated.tenantId, validated.roleId);
        if (!role) {
            throw new Error(`Role not found: ${validated.roleId}`);
        }
        const assignment = {
            tenantId: validated.tenantId,
            userId: validated.userId,
            roleId: validated.roleId,
            assignedAt: new Date(),
            assignedBy: validated.assignedBy,
        };
        const result = await this.userRoleStorage.assignRole(assignment);
        // Sync Casbin grouping policy
        await this.enforcer.addUserRole(validated.tenantId, validated.userId, validated.roleId);
        return result;
    }
    /**
     * Remove a role from a user
     */
    async removeRole(tenantId, userId, roleId) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        (0, validation_1.validate)(validation_1.UserIdSchema, userId);
        (0, validation_1.validate)(validation_1.RoleIdSchema, roleId);
        await this.userRoleStorage.removeRole(tenantId, userId, roleId);
        // Sync Casbin grouping policy
        await this.enforcer.removeUserRole(tenantId, userId, roleId);
    }
    /**
     * Get all roles assigned to a user
     */
    async getUserRoles(tenantId, userId) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        (0, validation_1.validate)(validation_1.UserIdSchema, userId);
        const roleIds = await this.userRoleStorage.getUserRoles(tenantId, userId);
        const roles = [];
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
    async getUserCapabilities(tenantId, userId) {
        const roles = await this.getUserRoles(tenantId, userId);
        const capabilities = new Set();
        for (const role of roles) {
            for (const capability of role.capabilities) {
                capabilities.add(capability);
            }
        }
        return Array.from(capabilities);
    }
    /**
     * Check if a user has a specific capability
     *
     * Returns a deterministic, auditable result explaining:
     * - Whether access is allowed or denied
     * - Which roles/policies granted access (if allowed)
     * - The reason for denial (if denied)
     */
    async checkPermission(input) {
        const validated = (0, validation_1.validate)(validation_1.PermissionCheckInputSchema, input);
        // Use Casbin to enforce
        const allowed = await this.enforcer.enforce(validated.tenantId, validated.userId, validated.capability);
        if (allowed) {
            // Get roles that granted this capability
            const grantingRoles = await this.enforcer.getGrantingRoles(validated.tenantId, validated.userId, validated.capability);
            // Get role names for audit trail
            const grantedBy = [];
            for (const roleId of grantingRoles) {
                const role = await this.roleStorage.getRole(validated.tenantId, roleId);
                if (role) {
                    grantedBy.push(`role:${role.name} (${role.roleId})`);
                }
            }
            return {
                allowed: true,
                grantedBy,
                reason: `Access granted by ${grantedBy.length} role(s)`,
            };
        }
        return {
            allowed: false,
            grantedBy: [],
            reason: `User does not have capability: ${validated.capability}`,
        };
    }
    /**
     * Check if a user has ALL of the specified capabilities
     */
    async checkPermissions(tenantId, userId, capabilities) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        (0, validation_1.validate)(validation_1.UserIdSchema, userId);
        const allGrantedBy = [];
        const missing = [];
        for (const capability of capabilities) {
            const result = await this.checkPermission({
                tenantId,
                userId,
                capability,
            });
            if (result.allowed) {
                allGrantedBy.push(...result.grantedBy);
            }
            else {
                missing.push(capability);
            }
        }
        if (missing.length === 0) {
            // Deduplicate granted by
            const uniqueGrantedBy = [...new Set(allGrantedBy)];
            return {
                allowed: true,
                grantedBy: uniqueGrantedBy,
                reason: `All ${capabilities.length} capabilities granted`,
            };
        }
        return {
            allowed: false,
            grantedBy: [],
            reason: `User is missing capabilities: ${missing.join(', ')}`,
        };
    }
    /**
     * Check if a user has ANY of the specified capabilities
     */
    async checkAnyPermission(tenantId, userId, capabilities) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        (0, validation_1.validate)(validation_1.UserIdSchema, userId);
        for (const capability of capabilities) {
            const result = await this.checkPermission({
                tenantId,
                userId,
                capability,
            });
            if (result.allowed) {
                return {
                    allowed: true,
                    grantedBy: result.grantedBy,
                    reason: `Capability ${capability} granted`,
                };
            }
        }
        return {
            allowed: false,
            grantedBy: [],
            reason: `User does not have any of the required capabilities: ${capabilities.join(', ')}`,
        };
    }
    /**
     * Build a policy context for a user
     */
    async buildPolicyContext(tenantId, userId) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        (0, validation_1.validate)(validation_1.UserIdSchema, userId);
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
    generateId() {
        return (0, crypto_1.randomBytes)(16).toString('hex');
    }
}
exports.PermissionsService = PermissionsService;
//# sourceMappingURL=permissions-service.js.map