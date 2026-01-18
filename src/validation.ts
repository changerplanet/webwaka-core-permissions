/**
 * Input validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Tenant ID validation
 */
export const TenantIdSchema = z.string().min(1).max(255);

/**
 * User ID validation
 */
export const UserIdSchema = z.string().min(1).max(255);

/**
 * Role ID validation
 */
export const RoleIdSchema = z.string().min(1).max(255);

/**
 * Capability ID validation (format: "module:action")
 */
export const CapabilityIdSchema = z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/, {
  message: 'Capability ID must be in format "module:action"',
});

/**
 * Role name validation
 */
export const RoleNameSchema = z.string().min(1).max(255);

/**
 * Metadata validation
 */
export const MetadataSchema = z.record(z.unknown()).optional();

/**
 * Create role input validation
 */
export const CreateRoleInputSchema = z.object({
  tenantId: TenantIdSchema,
  name: RoleNameSchema,
  description: z.string().max(1000).optional(),
  capabilities: z.array(CapabilityIdSchema),
  metadata: MetadataSchema,
});

/**
 * Update role input validation
 */
export const UpdateRoleInputSchema = z.object({
  name: RoleNameSchema.optional(),
  description: z.string().max(1000).optional(),
  capabilities: z.array(CapabilityIdSchema).optional(),
  metadata: MetadataSchema,
});

/**
 * Permission check input validation
 */
export const PermissionCheckInputSchema = z.object({
  tenantId: TenantIdSchema,
  userId: UserIdSchema,
  capability: CapabilityIdSchema,
  context: MetadataSchema,
});

/**
 * Assign role input validation
 */
export const AssignRoleInputSchema = z.object({
  tenantId: TenantIdSchema,
  userId: UserIdSchema,
  roleId: RoleIdSchema,
  assignedBy: UserIdSchema.optional(),
});

/**
 * Validate input against a schema
 */
export function validate<T>(schema: z.ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}
