"use strict";
/**
 * Input validation schemas using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignRoleInputSchema = exports.PermissionCheckInputSchema = exports.UpdateRoleInputSchema = exports.CreateRoleInputSchema = exports.MetadataSchema = exports.RoleNameSchema = exports.CapabilityIdSchema = exports.RoleIdSchema = exports.UserIdSchema = exports.TenantIdSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
/**
 * Tenant ID validation
 */
exports.TenantIdSchema = zod_1.z.string().min(1).max(255);
/**
 * User ID validation
 */
exports.UserIdSchema = zod_1.z.string().min(1).max(255);
/**
 * Role ID validation
 */
exports.RoleIdSchema = zod_1.z.string().min(1).max(255);
/**
 * Capability ID validation (format: "module:action")
 */
exports.CapabilityIdSchema = zod_1.z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/, {
    message: 'Capability ID must be in format "module:action"',
});
/**
 * Role name validation
 */
exports.RoleNameSchema = zod_1.z.string().min(1).max(255);
/**
 * Metadata validation
 */
exports.MetadataSchema = zod_1.z.record(zod_1.z.unknown()).optional();
/**
 * Create role input validation
 */
exports.CreateRoleInputSchema = zod_1.z.object({
    tenantId: exports.TenantIdSchema,
    name: exports.RoleNameSchema,
    description: zod_1.z.string().max(1000).optional(),
    capabilities: zod_1.z.array(exports.CapabilityIdSchema),
    metadata: exports.MetadataSchema,
});
/**
 * Update role input validation
 */
exports.UpdateRoleInputSchema = zod_1.z.object({
    name: exports.RoleNameSchema.optional(),
    description: zod_1.z.string().max(1000).optional(),
    capabilities: zod_1.z.array(exports.CapabilityIdSchema).optional(),
    metadata: exports.MetadataSchema,
});
/**
 * Permission check input validation
 */
exports.PermissionCheckInputSchema = zod_1.z.object({
    tenantId: exports.TenantIdSchema,
    userId: exports.UserIdSchema,
    capability: exports.CapabilityIdSchema,
    context: exports.MetadataSchema,
});
/**
 * Assign role input validation
 */
exports.AssignRoleInputSchema = zod_1.z.object({
    tenantId: exports.TenantIdSchema,
    userId: exports.UserIdSchema,
    roleId: exports.RoleIdSchema,
    assignedBy: exports.UserIdSchema.optional(),
});
/**
 * Validate input against a schema
 */
function validate(schema, input) {
    return schema.parse(input);
}
//# sourceMappingURL=validation.js.map