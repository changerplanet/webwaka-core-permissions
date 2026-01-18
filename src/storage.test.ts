import { InMemoryRoleStorage, InMemoryUserRoleStorage } from './storage';
import { Role, UserRoleAssignment } from './types';

describe('InMemoryRoleStorage', () => {
  let storage: InMemoryRoleStorage;

  beforeEach(() => {
    storage = new InMemoryRoleStorage();
  });

  describe('createRole', () => {
    it('should create a role', async () => {
      const role: Role = {
        roleId: 'role-1',
        tenantId: 'tenant-1',
        name: 'Admin',
        capabilities: ['pos:create-sale'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const created = await storage.createRole(role);
      expect(created).toEqual(role);
    });

    it('should throw error when role already exists', async () => {
      const role: Role = {
        roleId: 'role-1',
        tenantId: 'tenant-1',
        name: 'Admin',
        capabilities: ['pos:create-sale'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storage.createRole(role);
      await expect(storage.createRole(role)).rejects.toThrow('Role already exists');
    });
  });

  describe('getRole', () => {
    it('should retrieve a role by ID', async () => {
      const role: Role = {
        roleId: 'role-1',
        tenantId: 'tenant-1',
        name: 'Admin',
        capabilities: ['pos:create-sale'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storage.createRole(role);
      const retrieved = await storage.getRole('tenant-1', 'role-1');
      expect(retrieved).toEqual(role);
    });

    it('should return null for non-existent role', async () => {
      const retrieved = await storage.getRole('tenant-1', 'non-existent');
      expect(retrieved).toBeNull();
    });

    it('should enforce tenant isolation', async () => {
      const role: Role = {
        roleId: 'role-1',
        tenantId: 'tenant-1',
        name: 'Admin',
        capabilities: ['pos:create-sale'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storage.createRole(role);
      const retrieved = await storage.getRole('tenant-2', 'role-1');
      expect(retrieved).toBeNull();
    });
  });

  describe('updateRole', () => {
    it('should update role fields', async () => {
      const role: Role = {
        roleId: 'role-1',
        tenantId: 'tenant-1',
        name: 'Admin',
        capabilities: ['pos:create-sale'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storage.createRole(role);
      const updated = await storage.updateRole('tenant-1', 'role-1', {
        name: 'Super Admin',
        capabilities: ['pos:create-sale', 'pos:refund-sale'],
      });

      expect(updated.name).toBe('Super Admin');
      expect(updated.capabilities).toEqual(['pos:create-sale', 'pos:refund-sale']);
      expect(updated.roleId).toBe('role-1');
      expect(updated.tenantId).toBe('tenant-1');
    });

    it('should throw error for non-existent role', async () => {
      await expect(storage.updateRole('tenant-1', 'non-existent', { name: 'New Name' }))
        .rejects.toThrow('Role not found');
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      const role: Role = {
        roleId: 'role-1',
        tenantId: 'tenant-1',
        name: 'Admin',
        capabilities: ['pos:create-sale'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storage.createRole(role);
      await storage.deleteRole('tenant-1', 'role-1');

      const retrieved = await storage.getRole('tenant-1', 'role-1');
      expect(retrieved).toBeNull();
    });
  });

  describe('listRoles', () => {
    it('should list all roles in a tenant', async () => {
      await storage.createRole({
        roleId: 'role-1',
        tenantId: 'tenant-1',
        name: 'Admin',
        capabilities: ['pos:create-sale'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await storage.createRole({
        roleId: 'role-2',
        tenantId: 'tenant-1',
        name: 'Cashier',
        capabilities: ['pos:view-sale'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await storage.createRole({
        roleId: 'role-3',
        tenantId: 'tenant-2',
        name: 'Manager',
        capabilities: ['pos:manage'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const roles = await storage.listRoles('tenant-1');
      expect(roles).toHaveLength(2);
      expect(roles.map(r => r.roleId)).toContain('role-1');
      expect(roles.map(r => r.roleId)).toContain('role-2');
    });
  });
});

describe('InMemoryUserRoleStorage', () => {
  let storage: InMemoryUserRoleStorage;

  beforeEach(() => {
    storage = new InMemoryUserRoleStorage();
  });

  describe('assignRole', () => {
    it('should assign a role to a user', async () => {
      const assignment: UserRoleAssignment = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: 'role-1',
        assignedAt: new Date(),
      };

      const result = await storage.assignRole(assignment);
      expect(result).toEqual(assignment);
    });
  });

  describe('removeRole', () => {
    it('should remove a role from a user', async () => {
      await storage.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: 'role-1',
        assignedAt: new Date(),
      });

      await storage.removeRole('tenant-1', 'user-1', 'role-1');

      const roles = await storage.getUserRoles('tenant-1', 'user-1');
      expect(roles).toEqual([]);
    });
  });

  describe('getUserRoles', () => {
    it('should get all roles for a user', async () => {
      await storage.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: 'role-1',
        assignedAt: new Date(),
      });

      await storage.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: 'role-2',
        assignedAt: new Date(),
      });

      const roles = await storage.getUserRoles('tenant-1', 'user-1');
      expect(roles).toContain('role-1');
      expect(roles).toContain('role-2');
    });
  });

  describe('getRoleUsers', () => {
    it('should get all users with a role', async () => {
      await storage.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: 'role-1',
        assignedAt: new Date(),
      });

      await storage.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-2',
        roleId: 'role-1',
        assignedAt: new Date(),
      });

      const users = await storage.getRoleUsers('tenant-1', 'role-1');
      expect(users).toContain('user-1');
      expect(users).toContain('user-2');
    });

    it('should enforce tenant isolation', async () => {
      await storage.assignRole({
        tenantId: 'tenant-1',
        userId: 'user-1',
        roleId: 'role-1',
        assignedAt: new Date(),
      });

      await storage.assignRole({
        tenantId: 'tenant-2',
        userId: 'user-2',
        roleId: 'role-1',
        assignedAt: new Date(),
      });

      const users1 = await storage.getRoleUsers('tenant-1', 'role-1');
      const users2 = await storage.getRoleUsers('tenant-2', 'role-1');

      expect(users1).toEqual(['user-1']);
      expect(users2).toEqual(['user-2']);
    });
  });
});
