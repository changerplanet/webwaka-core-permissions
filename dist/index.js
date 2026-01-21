"use strict";
/**
 * WebWaka Core Permissions Service
 *
 * Provides role-based access control (RBAC) and capability-based permission
 * checks for the WebWaka platform.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignRoleInputSchema = exports.PermissionCheckInputSchema = exports.UpdateRoleInputSchema = exports.CreateRoleInputSchema = exports.MetadataSchema = exports.RoleNameSchema = exports.CapabilityIdSchema = exports.RoleIdSchema = exports.UserIdSchema = exports.TenantIdSchema = exports.validate = exports.InMemoryPolicyStorage = exports.CasbinEnforcer = exports.InMemoryUserRoleStorage = exports.InMemoryRoleStorage = exports.PermissionsService = void 0;
// Main service
var permissions_service_1 = require("./permissions-service");
Object.defineProperty(exports, "PermissionsService", { enumerable: true, get: function () { return permissions_service_1.PermissionsService; } });
// Storage interfaces
var storage_1 = require("./storage");
Object.defineProperty(exports, "InMemoryRoleStorage", { enumerable: true, get: function () { return storage_1.InMemoryRoleStorage; } });
Object.defineProperty(exports, "InMemoryUserRoleStorage", { enumerable: true, get: function () { return storage_1.InMemoryUserRoleStorage; } });
// Casbin adapter
var casbin_adapter_1 = require("./casbin-adapter");
Object.defineProperty(exports, "CasbinEnforcer", { enumerable: true, get: function () { return casbin_adapter_1.CasbinEnforcer; } });
Object.defineProperty(exports, "InMemoryPolicyStorage", { enumerable: true, get: function () { return casbin_adapter_1.InMemoryPolicyStorage; } });
// Validation
var validation_1 = require("./validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validation_1.validate; } });
Object.defineProperty(exports, "TenantIdSchema", { enumerable: true, get: function () { return validation_1.TenantIdSchema; } });
Object.defineProperty(exports, "UserIdSchema", { enumerable: true, get: function () { return validation_1.UserIdSchema; } });
Object.defineProperty(exports, "RoleIdSchema", { enumerable: true, get: function () { return validation_1.RoleIdSchema; } });
Object.defineProperty(exports, "CapabilityIdSchema", { enumerable: true, get: function () { return validation_1.CapabilityIdSchema; } });
Object.defineProperty(exports, "RoleNameSchema", { enumerable: true, get: function () { return validation_1.RoleNameSchema; } });
Object.defineProperty(exports, "MetadataSchema", { enumerable: true, get: function () { return validation_1.MetadataSchema; } });
Object.defineProperty(exports, "CreateRoleInputSchema", { enumerable: true, get: function () { return validation_1.CreateRoleInputSchema; } });
Object.defineProperty(exports, "UpdateRoleInputSchema", { enumerable: true, get: function () { return validation_1.UpdateRoleInputSchema; } });
Object.defineProperty(exports, "PermissionCheckInputSchema", { enumerable: true, get: function () { return validation_1.PermissionCheckInputSchema; } });
Object.defineProperty(exports, "AssignRoleInputSchema", { enumerable: true, get: function () { return validation_1.AssignRoleInputSchema; } });
//# sourceMappingURL=index.js.map