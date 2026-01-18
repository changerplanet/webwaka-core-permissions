import {
  PermissionsService,
  InMemoryRoleStorage,
  InMemoryUserRoleStorage,
  CasbinEnforcer,
  InMemoryPolicyStorage,
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
} from './index';

describe('Module exports', () => {
  it('should export PermissionsService', () => {
    expect(PermissionsService).toBeDefined();
  });

  it('should export storage classes', () => {
    expect(InMemoryRoleStorage).toBeDefined();
    expect(InMemoryUserRoleStorage).toBeDefined();
    expect(InMemoryPolicyStorage).toBeDefined();
  });

  it('should export CasbinEnforcer', () => {
    expect(CasbinEnforcer).toBeDefined();
  });

  it('should export validation utilities', () => {
    expect(validate).toBeDefined();
    expect(TenantIdSchema).toBeDefined();
    expect(UserIdSchema).toBeDefined();
    expect(RoleIdSchema).toBeDefined();
    expect(CapabilityIdSchema).toBeDefined();
    expect(RoleNameSchema).toBeDefined();
    expect(MetadataSchema).toBeDefined();
    expect(CreateRoleInputSchema).toBeDefined();
    expect(UpdateRoleInputSchema).toBeDefined();
    expect(PermissionCheckInputSchema).toBeDefined();
    expect(AssignRoleInputSchema).toBeDefined();
  });

  it('should be able to create a permissions service from exports', () => {
    const service = new PermissionsService({
      roleStorage: new InMemoryRoleStorage(),
      userRoleStorage: new InMemoryUserRoleStorage(),
    });
    expect(service).toBeDefined();
  });

  it('should validate tenantId correctly', () => {
    expect(() => validate(TenantIdSchema, 'valid-tenant')).not.toThrow();
    expect(() => validate(TenantIdSchema, '')).toThrow();
  });

  it('should validate capability format correctly', () => {
    expect(() => validate(CapabilityIdSchema, 'pos:create-sale')).not.toThrow();
    expect(() => validate(CapabilityIdSchema, 'invalid')).toThrow();
  });
});
