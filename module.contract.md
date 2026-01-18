# Module Contract: Core Permissions

## Purpose

The Core Permissions service provides a canonical authorization layer for the WebWaka platform. It implements role-based access control (RBAC) with capability-based permission checks, enabling any Suite or module to enforce access control in a consistent, tenant-aware manner.

## Capabilities

This module provides the following capabilities:

- **Role Management**: Create, update, and delete roles with associated capabilities
- **Capability-Based Permissions**: Define permissions as capabilities (e.g., `pos:create-sale`) rather than route-based rules
- **Permission Checks**: Evaluate whether a user can perform a specific action
- **Tenant-Aware RBAC**: Enforce strict tenant isolation in all permission operations
- **Policy Evaluation**: Build policy contexts for advanced authorization scenarios
- **Role Assignment**: Assign and revoke roles for users within tenants

## Dependencies

This module depends on:

- **webwaka-core-identity**: For user and tenant context (logical dependency, not code coupling)

The permissions service operates on `userId` and `tenantId` values that are resolved by the identity service, but does not directly call identity service methods.

## API Surface

### Public Interfaces

#### PermissionsService

The main service class that provides all permission operations.

```typescript
class PermissionsService {
  constructor(config: PermissionsServiceConfig);
  
  // Role management
  createRole(input: CreateRoleInput): Promise<Role>;
  getRole(tenantId: TenantId, roleId: RoleId): Promise<Role | null>;
  updateRole(tenantId: TenantId, roleId: RoleId, input: UpdateRoleInput): Promise<Role>;
  deleteRole(tenantId: TenantId, roleId: RoleId): Promise<void>;
  listRoles(tenantId: TenantId): Promise<Role[]>;
  
  // Role assignment
  assignRole(input: AssignRoleInput): Promise<UserRoleAssignment>;
  removeRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void>;
  getUserRoles(tenantId: TenantId, userId: UserId): Promise<Role[]>;
  getUserCapabilities(tenantId: TenantId, userId: UserId): Promise<CapabilityId[]>;
  
  // Permission checks
  checkPermission(input: PermissionCheckInput): Promise<PermissionCheckResult>;
  checkPermissions(tenantId: TenantId, userId: UserId, capabilities: CapabilityId[]): Promise<PermissionCheckResult>;
  checkAnyPermission(tenantId: TenantId, userId: UserId, capabilities: CapabilityId[]): Promise<PermissionCheckResult>;
  
  // Policy evaluation
  buildPolicyContext(tenantId: TenantId, userId: UserId): Promise<PolicyContext>;
}
```

#### Storage Interfaces

Storage abstraction for pluggable persistence backends.

```typescript
interface RoleStorage {
  createRole(role: Role): Promise<Role>;
  getRole(tenantId: TenantId, roleId: RoleId): Promise<Role | null>;
  updateRole(tenantId: TenantId, roleId: RoleId, updates: Partial<Role>): Promise<Role>;
  deleteRole(tenantId: TenantId, roleId: RoleId): Promise<void>;
  listRoles(tenantId: TenantId): Promise<Role[]>;
}

interface UserRoleStorage {
  assignRole(assignment: UserRoleAssignment): Promise<UserRoleAssignment>;
  removeRole(tenantId: TenantId, userId: UserId, roleId: RoleId): Promise<void>;
  getUserRoles(tenantId: TenantId, userId: UserId): Promise<RoleId[]>;
  getRoleUsers(tenantId: TenantId, roleId: RoleId): Promise<UserId[]>;
}
```

### Events

This module does not emit events. It is a synchronous service that returns results directly.

## Data Models

### Role

```typescript
interface Role {
  roleId: RoleId;
  tenantId: TenantId;
  name: string;
  description?: string;
  capabilities: CapabilityId[];  // e.g., ["pos:create-sale", "inventory:update-stock"]
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

### PermissionCheckResult

```typescript
interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  matchedRoles?: RoleId[];  // Roles that granted the permission
}
```

### PolicyContext

```typescript
interface PolicyContext {
  tenantId: TenantId;
  userId: UserId;
  roles: RoleId[];
  capabilities: CapabilityId[];
  metadata?: Record<string, unknown>;
}
```

## Capability Format

Capabilities follow the format `module:action`, where:
- `module` is the WebWaka module or feature area (e.g., `pos`, `inventory`, `crm`)
- `action` is the specific operation (e.g., `create-sale`, `update-stock`, `view-customer`)

Examples:
- `pos:create-sale`
- `pos:refund-sale`
- `inventory:update-stock`
- `crm:view-customer`
- `crm:delete-customer`

This format ensures capabilities are:
- **Descriptive**: Clear what they allow
- **Scoped**: Tied to specific modules
- **Flexible**: Easy to add new capabilities without code changes

## Security Considerations

### Tenant Isolation

**All operations enforce strict tenant isolation.** Roles and permissions are scoped to tenants. A user in tenant A cannot be assigned roles from tenant B, and permission checks always require a `tenantId`.

### Capability Aggregation

When a user has multiple roles, their capabilities are aggregated (union). This means a user with roles `Cashier` and `Manager` has all capabilities from both roles.

### Deterministic Permission Checks

Permission checks are deterministic and auditable. The `checkPermission` method returns not only whether access is allowed, but also which roles granted the permission, enabling audit trails.

### No Authentication Logic

This service does NOT perform authentication. It assumes that `userId` and `tenantId` have already been validated by the identity service. Callers must ensure they pass validated identity context.

## Performance Expectations

### Storage Abstraction

The service uses a storage abstraction layer to allow for different persistence backends. The in-memory implementation is provided for testing and development. Production deployments should use a persistent storage backend (e.g., PostgreSQL, MySQL, DynamoDB).

### Expected Latency

- Role creation: < 100ms
- Role lookup: < 50ms
- Permission check: < 100ms (depends on number of roles)
- Capability aggregation: < 150ms

### Caching Recommendations

For high-throughput scenarios, implementers should consider caching:
- User role assignments (TTL: 5-15 minutes)
- User capabilities (TTL: 5-15 minutes)
- Role definitions (TTL: 30-60 minutes)

## Versioning

This module follows semantic versioning (semver).

**Current version:** 0.1.0 (initial implementation)

### Breaking Changes

Breaking changes will increment the major version. Examples of breaking changes:
- Removing or renaming public interfaces
- Changing capability format
- Modifying permission check semantics
- Changing data model structure

### Non-Breaking Changes

Non-breaking changes will increment the minor or patch version. Examples:
- Adding new methods
- Adding optional parameters
- Performance improvements
- Bug fixes
