/**
 * WebWaka Core Permissions Service
 *
 * Provides role-based access control (RBAC) and capability-based permission
 * checks for the WebWaka platform.
 */
export { PermissionsService, PermissionsServiceConfig } from './permissions-service';
export { TenantId, UserId, RoleId, CapabilityId, PermissionId, Role, UserRoleAssignment, PermissionCheckInput, PermissionCheckResult, CreateRoleInput, UpdateRoleInput, AssignRoleInput, PolicyContext, } from './types';
export { RoleStorage, UserRoleStorage, InMemoryRoleStorage, InMemoryUserRoleStorage, } from './storage';
export { CasbinEnforcer, PolicyStorage, InMemoryPolicyStorage, } from './casbin-adapter';
export { validate, TenantIdSchema, UserIdSchema, RoleIdSchema, CapabilityIdSchema, RoleNameSchema, MetadataSchema, CreateRoleInputSchema, UpdateRoleInputSchema, PermissionCheckInputSchema, AssignRoleInputSchema, } from './validation';
//# sourceMappingURL=index.d.ts.map