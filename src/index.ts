/**
 * WebWaka Core Permissions Service
 * 
 * Provides role-based access control (RBAC) and capability-based permission
 * checks for the WebWaka platform.
 */

// Main service
export { PermissionsService, PermissionsServiceConfig } from './permissions-service';

// Types
export {
  TenantId,
  UserId,
  RoleId,
  CapabilityId,
  PermissionId,
  Role,
  UserRoleAssignment,
  PermissionCheckInput,
  PermissionCheckResult,
  CreateRoleInput,
  UpdateRoleInput,
  AssignRoleInput,
  PolicyContext,
} from './types';

// Storage interfaces
export {
  RoleStorage,
  UserRoleStorage,
  InMemoryRoleStorage,
  InMemoryUserRoleStorage,
} from './storage';

// Casbin adapter
export {
  CasbinEnforcer,
  PolicyStorage,
  InMemoryPolicyStorage,
} from './casbin-adapter';

// Validation
export {
  validate,
  TenantIdSchema,
  UserIdSchema,
  RoleIdSchema,
  CapabilityIdSchema,
  RoleNameSchema,
  MetadataSchema,
  CreateRoleInputSchema,
  UpdateRoleInputSchema,
  PermissionCheckInputSchema,
  AssignRoleInputSchema,
} from './validation';
