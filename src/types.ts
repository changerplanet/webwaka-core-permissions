/**
 * Core type definitions for the Permissions service
 */

/**
 * Tenant identifier
 */
export type TenantId = string;

/**
 * User identifier
 */
export type UserId = string;

/**
 * Role identifier
 */
export type RoleId = string;

/**
 * Capability identifier (e.g., "pos:create-sale", "inventory:update-stock")
 */
export type CapabilityId = string;

/**
 * Permission identifier
 */
export type PermissionId = string;

/**
 * Role definition
 */
export interface Role {
  roleId: RoleId;
  tenantId: TenantId;
  name: string;
  description?: string;
  capabilities: CapabilityId[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission check input
 */
export interface PermissionCheckInput {
  tenantId: TenantId;
  userId: UserId;
  capability: CapabilityId;
  context?: Record<string, unknown>;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  matchedRoles?: RoleId[];
}

/**
 * User role assignment
 */
export interface UserRoleAssignment {
  tenantId: TenantId;
  userId: UserId;
  roleId: RoleId;
  assignedAt: Date;
  assignedBy?: UserId;
}

/**
 * Create role input
 */
export interface CreateRoleInput {
  tenantId: TenantId;
  name: string;
  description?: string;
  capabilities: CapabilityId[];
  metadata?: Record<string, unknown>;
}

/**
 * Update role input
 */
export interface UpdateRoleInput {
  name?: string;
  description?: string;
  capabilities?: CapabilityId[];
  metadata?: Record<string, unknown>;
}

/**
 * Assign role input
 */
export interface AssignRoleInput {
  tenantId: TenantId;
  userId: UserId;
  roleId: RoleId;
  assignedBy?: UserId;
}

/**
 * Policy evaluation context
 */
export interface PolicyContext {
  tenantId: TenantId;
  userId: UserId;
  roles: RoleId[];
  capabilities: CapabilityId[];
  metadata?: Record<string, unknown>;
}
