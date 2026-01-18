# webwaka-core-permissions

**Type:** core  
**Description:** Role-based access control and authorization core service

## Status

✅ **Phase 2.2 Complete** - Core permissions service implemented and tested.

This module provides production-grade role-based access control (RBAC) with capability-based permission checks and strict tenant isolation.

## Features

- **Role Management**: Create, update, and delete roles with capabilities
- **Capability-Based Permissions**: Use `module:action` format (e.g., `pos:create-sale`)
- **Permission Checks**: Evaluate user permissions with deterministic results
- **Tenant Isolation**: Strict tenant boundaries in all operations
- **Policy Evaluation**: Build policy contexts for advanced authorization
- **Storage Abstraction**: Pluggable storage backends for flexibility

## Installation

```bash
pnpm install
```

## Usage

```typescript
import { PermissionsService, InMemoryRoleStorage, InMemoryUserRoleStorage } from 'webwaka-core-permissions';

// Create service instance
const permissionsService = new PermissionsService({
  roleStorage: new InMemoryRoleStorage(),
  userRoleStorage: new InMemoryUserRoleStorage(),
});

// Create a role
const role = await permissionsService.createRole({
  tenantId: 'tenant-1',
  name: 'Cashier',
  capabilities: ['pos:create-sale', 'pos:void-sale'],
});

// Assign role to user
await permissionsService.assignRole({
  tenantId: 'tenant-1',
  userId: 'user-1',
  roleId: role.roleId,
});

// Check permission
const result = await permissionsService.checkPermission({
  tenantId: 'tenant-1',
  userId: 'user-1',
  capability: 'pos:create-sale',
});

console.log(result.allowed); // true
```

## Testing

```bash
pnpm test
```

## Documentation

- [Module Contract](./module.contract.md) - Defines the module's capabilities, dependencies, and API surface
- [Changelog](./CHANGELOG.md) - Version history and changes
- [Security Policy](./SECURITY.md) - Security guidelines and vulnerability reporting
- [Owners](./OWNERS.md) - Maintainers and code review requirements

## Module Manifest

See `module.manifest.json` for the complete module specification.

## Contributing

This module follows the WebWaka architectural rules:
- All changes must go through pull requests
- CI/CD checks must pass before merging
- Manifest validation is enforced automatically

## License

MIT
