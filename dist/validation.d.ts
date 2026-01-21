/**
 * Input validation schemas using Zod
 */
import { z } from 'zod';
/**
 * Tenant ID validation
 */
export declare const TenantIdSchema: z.ZodString;
/**
 * User ID validation
 */
export declare const UserIdSchema: z.ZodString;
/**
 * Role ID validation
 */
export declare const RoleIdSchema: z.ZodString;
/**
 * Capability ID validation (format: "module:action")
 */
export declare const CapabilityIdSchema: z.ZodString;
/**
 * Role name validation
 */
export declare const RoleNameSchema: z.ZodString;
/**
 * Metadata validation
 */
export declare const MetadataSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
/**
 * Create role input validation
 */
export declare const CreateRoleInputSchema: z.ZodObject<{
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodArray<z.ZodString, "many">;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    name: string;
    capabilities: string[];
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    tenantId: string;
    name: string;
    capabilities: string[];
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Update role input validation
 */
export declare const UpdateRoleInputSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    capabilities?: string[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    capabilities?: string[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Permission check input validation
 */
export declare const PermissionCheckInputSchema: z.ZodObject<{
    tenantId: z.ZodString;
    userId: z.ZodString;
    capability: z.ZodString;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    userId: string;
    capability: string;
    context?: Record<string, unknown> | undefined;
}, {
    tenantId: string;
    userId: string;
    capability: string;
    context?: Record<string, unknown> | undefined;
}>;
/**
 * Assign role input validation
 */
export declare const AssignRoleInputSchema: z.ZodObject<{
    tenantId: z.ZodString;
    userId: z.ZodString;
    roleId: z.ZodString;
    assignedBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    roleId: string;
    tenantId: string;
    userId: string;
    assignedBy?: string | undefined;
}, {
    roleId: string;
    tenantId: string;
    userId: string;
    assignedBy?: string | undefined;
}>;
/**
 * Validate input against a schema
 */
export declare function validate<T>(schema: z.ZodSchema<T>, input: unknown): T;
//# sourceMappingURL=validation.d.ts.map