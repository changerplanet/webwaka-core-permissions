import { CasbinEnforcer, InMemoryPolicyStorage } from './casbin-adapter';
import { InMemoryRoleStorage, InMemoryUserRoleStorage } from './storage';

describe('CasbinEnforcer', () => {
  let enforcer: CasbinEnforcer;
  let roleStorage: InMemoryRoleStorage;
  let userRoleStorage: InMemoryUserRoleStorage;

  beforeEach(() => {
    roleStorage = new InMemoryRoleStorage();
    userRoleStorage = new InMemoryUserRoleStorage();
    enforcer = new CasbinEnforcer(roleStorage, userRoleStorage);
  });

  describe('initialize', () => {
    it('should initialize the Casbin enforcer', async () => {
      await enforcer.initialize();
      const result = await enforcer.enforce('tenant-1', 'user-1', 'test:action');
      expect(result).toBe(false);
    });
  });

  describe('addRolePolicy and enforce', () => {
    it('should add role policy and enforce it', async () => {
      await enforcer.addRolePolicy('tenant-1', 'role-1', 'pos:create-sale');
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-1');

      const result = await enforcer.enforce('tenant-1', 'user-1', 'pos:create-sale');
      expect(result).toBe(true);
    });

    it('should deny when user does not have the capability', async () => {
      await enforcer.addRolePolicy('tenant-1', 'role-1', 'pos:create-sale');
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-1');

      const result = await enforcer.enforce('tenant-1', 'user-1', 'pos:refund-sale');
      expect(result).toBe(false);
    });
  });

  describe('removeRolePolicy', () => {
    it('should remove role policy', async () => {
      await enforcer.addRolePolicy('tenant-1', 'role-1', 'pos:create-sale');
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-1');

      let result = await enforcer.enforce('tenant-1', 'user-1', 'pos:create-sale');
      expect(result).toBe(true);

      await enforcer.removeRolePolicy('tenant-1', 'role-1', 'pos:create-sale');

      result = await enforcer.enforce('tenant-1', 'user-1', 'pos:create-sale');
      expect(result).toBe(false);
    });
  });

  describe('clearRolePolicies', () => {
    it('should clear all policies for a role', async () => {
      await enforcer.addRolePolicy('tenant-1', 'role-1', 'pos:create-sale');
      await enforcer.addRolePolicy('tenant-1', 'role-1', 'pos:refund-sale');
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-1');

      await enforcer.clearRolePolicies('tenant-1', 'role-1');

      const result1 = await enforcer.enforce('tenant-1', 'user-1', 'pos:create-sale');
      const result2 = await enforcer.enforce('tenant-1', 'user-1', 'pos:refund-sale');
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('removeUserRole', () => {
    it('should remove user role assignment', async () => {
      await enforcer.addRolePolicy('tenant-1', 'role-1', 'pos:create-sale');
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-1');

      let result = await enforcer.enforce('tenant-1', 'user-1', 'pos:create-sale');
      expect(result).toBe(true);

      await enforcer.removeUserRole('tenant-1', 'user-1', 'role-1');

      result = await enforcer.enforce('tenant-1', 'user-1', 'pos:create-sale');
      expect(result).toBe(false);
    });
  });

  describe('getGrantingRoles', () => {
    it('should return roles that grant a capability', async () => {
      await enforcer.addRolePolicy('tenant-1', 'role-1', 'pos:create-sale');
      await enforcer.addRolePolicy('tenant-1', 'role-2', 'pos:create-sale');
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-1');
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-2');

      const roles = await enforcer.getGrantingRoles('tenant-1', 'user-1', 'pos:create-sale');
      expect(roles).toContain('role-1');
      expect(roles).toContain('role-2');
    });

    it('should return empty array if no roles grant the capability', async () => {
      await enforcer.addRolePolicy('tenant-1', 'role-1', 'pos:create-sale');
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-1');

      const roles = await enforcer.getGrantingRoles('tenant-1', 'user-1', 'pos:refund-sale');
      expect(roles).toEqual([]);
    });
  });

  describe('getUserCapabilities', () => {
    it('should return all capabilities for a user', async () => {
      await enforcer.addRolePolicy('tenant-1', 'role-1', 'pos:create-sale');
      await enforcer.addRolePolicy('tenant-1', 'role-1', 'pos:void-sale');
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-1');

      const capabilities = await enforcer.getUserCapabilities('tenant-1', 'user-1');
      expect(capabilities).toContain('pos:create-sale');
      expect(capabilities).toContain('pos:void-sale');
    });

    it('should return empty array if user has no roles', async () => {
      const capabilities = await enforcer.getUserCapabilities('tenant-1', 'user-1');
      expect(capabilities).toEqual([]);
    });
  });

  describe('getUserRoles', () => {
    it('should return all roles for a user in a tenant', async () => {
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-1');
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-2');

      const roles = await enforcer.getUserRoles('tenant-1', 'user-1');
      expect(roles).toContain('role-1');
      expect(roles).toContain('role-2');
    });

    it('should isolate roles by tenant', async () => {
      await enforcer.addUserRole('tenant-1', 'user-1', 'role-1');
      await enforcer.addUserRole('tenant-2', 'user-1', 'role-2');

      const roles1 = await enforcer.getUserRoles('tenant-1', 'user-1');
      const roles2 = await enforcer.getUserRoles('tenant-2', 'user-1');

      expect(roles1).toEqual(['role-1']);
      expect(roles2).toEqual(['role-2']);
    });
  });

  describe('syncPolicies', () => {
    it('should sync policies from storage to Casbin', async () => {
      await roleStorage.createRole({
        roleId: 'synced-role',
        tenantId: 'sync-tenant',
        name: 'Synced Role',
        capabilities: ['sync:test-action'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await userRoleStorage.assignRole({
        tenantId: 'sync-tenant',
        userId: 'sync-user',
        roleId: 'synced-role',
        assignedAt: new Date(),
      });

      await enforcer.syncPolicies('sync-tenant');

      const result = await enforcer.enforce('sync-tenant', 'sync-user', 'sync:test-action');
      expect(result).toBe(true);
    });
  });
});

describe('InMemoryPolicyStorage', () => {
  let storage: InMemoryPolicyStorage;

  beforeEach(() => {
    storage = new InMemoryPolicyStorage();
  });

  describe('policies', () => {
    it('should save and load policies', async () => {
      const policies = [
        ['role-1', 'tenant-1', 'pos:create-sale'],
        ['role-2', 'tenant-1', 'pos:refund-sale'],
      ];

      await storage.savePolicies('tenant-1', policies);
      const loaded = await storage.loadPolicies('tenant-1');

      expect(loaded).toEqual(policies);
    });

    it('should return empty array for unknown tenant', async () => {
      const loaded = await storage.loadPolicies('unknown-tenant');
      expect(loaded).toEqual([]);
    });
  });

  describe('role links', () => {
    it('should save and load role links', async () => {
      const links = [
        ['user-1', 'role-1', 'tenant-1'],
        ['user-2', 'role-2', 'tenant-1'],
      ];

      await storage.saveRoleLinks('tenant-1', links);
      const loaded = await storage.loadRoleLinks('tenant-1');

      expect(loaded).toEqual(links);
    });

    it('should return empty array for unknown tenant', async () => {
      const loaded = await storage.loadRoleLinks('unknown-tenant');
      expect(loaded).toEqual([]);
    });
  });
});
