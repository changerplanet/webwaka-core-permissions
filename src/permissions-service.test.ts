import { PermissionsService } from './permissions-service';
import { InMemoryRoleStorage, InMemoryUserRoleStorage } from './storage';
import { CreateRoleInput, AssignRoleInput, PermissionCheckInput } from './types';

describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(() => {
    service = new PermissionsService({
      roleStorage: new InMemoryRoleStorage(),
      userRoleStorage: new InMemoryUserRoleStorage(),
    });
  });

  describe('createRole', () => {
    it('should create a role with capabilities', async () => {
      const input: CreateRoleInput = {
        tenantId: 'tenant-1',
        name: 'Admin',
        description: 'Administrator role',
        capabilities: ['pos:create-sale', 'pos:refund-sale', 'inventory:update-stock'],
      };

      const role = await service.createRole(input);

      expect(role.roleId).toBeDefined();
      expect(role.tenantId).toBe('tenant-1');
      expect(role.name).toBe('Admin');
      expect(role.capabilities).toEqual(['pos:create-sale', 'pos:refund-sale', 'inventory:update-stock']);
    });

    it('should reject invalid capability format', async () => {
      const input: CreateRoleInput = {
        tenantId: 'tenant-1',
        name: 'Invalid',
        capabilities: ['invalid-capability'], // Missing colon
      };

      await expect(service.createRole(input)).rejects.toThrow();
    });
  });

  describe('getRole', () => {
    it('should retrieve a role by ID', async () => {
      const input: CreateRoleInput = {
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:create-sale'],
      };

      const created = await service.createRole(input);
      const retrieved = await service.getRole('tenant-1', created.roleId);

      expect(retrieved).toEqual(created);
    });

    it('should enforce tenant isolation', async () => {
      const input: CreateRoleInput = {
        tenantId: 'tenant-1',
        name: 'Manager',
        capabilities: ['pos:create-sale'],
      };

      const created = await service.createRole(input);
      const retrieved = await service.getRole('tenant-2', created.roleId);

      expect(retrieved).toBeNull();
    });
  });

  describe('updateRole', () => {
    it('should update role capabilities', async () => {
      const input: CreateRoleInput = {
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:create-sale'],
      };

      const created = await service.createRole(input);
      const updated = await service.updateRole('tenant-1', created.roleId, {
        capabilities: ['pos:create-sale', 'pos:void-sale'],
      });

      expect(updated.capabilities).toEqual(['pos:create-sale', 'pos:void-sale']);
    });
  });

  describe('assignRole', () => {
    it('should assign a role to a user', async () => {
      const roleInput: CreateRoleInput = {
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:create-sale'],
      };

      const role = await service.createRole(roleInput);

      const assignInput: AssignRoleInput = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role.roleId,
      };

      const assignment = await service.assignRole(assignInput);

      expect(assignment.userId).toBe('user-1');
      expect(assignment.roleId).toBe(role.roleId);
    });

    it('should reject assignment of non-existent role', async () => {
      const assignInput: AssignRoleInput = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: 'non-existent-role',
      };

      await expect(service.assignRole(assignInput)).rejects.toThrow('Role not found');
    });
  });

  describe('getUserRoles', () => {
    it('should return all roles assigned to a user', async () => {
      // Create roles
      const role1 = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:create-sale'],
      });

      const role2 = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Manager',
        capabilities: ['pos:refund-sale'],
      });

      // Assign roles
      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role1.roleId,
      });

      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role2.roleId,
      });

      const userRoles = await service.getUserRoles('tenant-1', 'user-1');

      expect(userRoles).toHaveLength(2);
      expect(userRoles.map(r => r.roleId)).toContain(role1.roleId);
      expect(userRoles.map(r => r.roleId)).toContain(role2.roleId);
    });
  });

  describe('getUserCapabilities', () => {
    it('should aggregate capabilities from all roles', async () => {
      // Create roles
      const role1 = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:create-sale', 'pos:void-sale'],
      });

      const role2 = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Inventory',
        capabilities: ['inventory:view-stock', 'inventory:update-stock'],
      });

      // Assign roles
      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role1.roleId,
      });

      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role2.roleId,
      });

      const capabilities = await service.getUserCapabilities('tenant-1', 'user-1');

      expect(capabilities).toHaveLength(4);
      expect(capabilities).toContain('pos:create-sale');
      expect(capabilities).toContain('pos:void-sale');
      expect(capabilities).toContain('inventory:view-stock');
      expect(capabilities).toContain('inventory:update-stock');
    });

    it('should deduplicate capabilities from multiple roles', async () => {
      // Create roles with overlapping capabilities
      const role1 = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Basic',
        capabilities: ['pos:create-sale'],
      });

      const role2 = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Advanced',
        capabilities: ['pos:create-sale', 'pos:refund-sale'],
      });

      // Assign both roles
      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role1.roleId,
      });

      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role2.roleId,
      });

      const capabilities = await service.getUserCapabilities('tenant-1', 'user-1');

      expect(capabilities).toHaveLength(2); // Deduplicated
      expect(capabilities).toContain('pos:create-sale');
      expect(capabilities).toContain('pos:refund-sale');
    });
  });

  describe('checkPermission', () => {
    it('should allow access when user has capability', async () => {
      const role = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:create-sale'],
      });

      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role.roleId,
      });

      const checkInput: PermissionCheckInput = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        capability: 'pos:create-sale',
      };

      const result = await service.checkPermission(checkInput);

      expect(result.allowed).toBe(true);
      expect(result.matchedRoles).toContain(role.roleId);
    });

    it('should deny access when user lacks capability', async () => {
      const role = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:create-sale'],
      });

      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role.roleId,
      });

      const checkInput: PermissionCheckInput = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        capability: 'pos:refund-sale', // Not granted
      };

      const result = await service.checkPermission(checkInput);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('does not have capability');
    });
  });

  describe('checkPermissions', () => {
    it('should allow when user has all capabilities', async () => {
      const role = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Manager',
        capabilities: ['pos:create-sale', 'pos:refund-sale', 'pos:void-sale'],
      });

      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role.roleId,
      });

      const result = await service.checkPermissions('tenant-1', 'user-1', [
        'pos:create-sale',
        'pos:refund-sale',
      ]);

      expect(result.allowed).toBe(true);
    });

    it('should deny when user is missing any capability', async () => {
      const role = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:create-sale'],
      });

      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role.roleId,
      });

      const result = await service.checkPermissions('tenant-1', 'user-1', [
        'pos:create-sale',
        'pos:refund-sale', // Missing
      ]);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('missing capabilities');
    });
  });

  describe('checkAnyPermission', () => {
    it('should allow when user has at least one capability', async () => {
      const role = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:create-sale'],
      });

      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role.roleId,
      });

      const result = await service.checkAnyPermission('tenant-1', 'user-1', [
        'pos:create-sale', // Has this
        'pos:refund-sale', // Doesn't have this
      ]);

      expect(result.allowed).toBe(true);
    });

    it('should deny when user has none of the capabilities', async () => {
      const role = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:create-sale'],
      });

      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role.roleId,
      });

      const result = await service.checkAnyPermission('tenant-1', 'user-1', [
        'pos:refund-sale',
        'inventory:update-stock',
      ]);

      expect(result.allowed).toBe(false);
    });
  });

  describe('tenant isolation', () => {
    it('should enforce strict tenant boundaries', async () => {
      // Create role in tenant-1
      const role1 = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Admin',
        capabilities: ['pos:create-sale'],
      });

      // Create role in tenant-2
      const role2 = await service.createRole({
        tenantId: 'tenant-2',
        name: 'Admin',
        capabilities: ['pos:create-sale'],
      });

      // Assign role1 to user-1 in tenant-1
      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role1.roleId,
      });

      // Assign role2 to user-1 in tenant-2
      await service.assignRole({
        tenantId: 'tenant-2',
        userId: 'user-1',
        roleId: role2.roleId,
      });

      // Check permissions in tenant-1
      const result1 = await service.checkPermission({
        tenantId: 'tenant-1',
        userId: 'user-1',
        capability: 'pos:create-sale',
      });

      // Check permissions in tenant-2
      const result2 = await service.checkPermission({
        tenantId: 'tenant-2',
        userId: 'user-1',
        capability: 'pos:create-sale',
      });

      // Both should be allowed in their respective tenants
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);

      // Verify roles are isolated
      const roles1 = await service.getUserRoles('tenant-1', 'user-1');
      const roles2 = await service.getUserRoles('tenant-2', 'user-1');

      expect(roles1).toHaveLength(1);
      expect(roles2).toHaveLength(1);
      expect(roles1[0].roleId).toBe(role1.roleId);
      expect(roles2[0].roleId).toBe(role2.roleId);
    });
  });

  describe('buildPolicyContext', () => {
    it('should build complete policy context for a user', async () => {
      const role = await service.createRole({
        tenantId: 'tenant-1',
        name: 'Manager',
        capabilities: ['pos:create-sale', 'pos:refund-sale'],
      });

      await service.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: role.roleId,
      });

      const context = await service.buildPolicyContext('tenant-1', 'user-1');

      expect(context.tenantId).toBe('tenant-1');
      expect(context.userId).toBe('user-1');
      expect(context.roles).toContain(role.roleId);
      expect(context.capabilities).toContain('pos:create-sale');
      expect(context.capabilities).toContain('pos:refund-sale');
    });
  });
});
