"use strict";
/**
 * Storage interface for permissions data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUserRoleStorage = exports.InMemoryRoleStorage = void 0;
/**
 * In-memory implementation for testing
 */
class InMemoryRoleStorage {
    constructor() {
        this.roles = new Map();
    }
    getKey(tenantId, roleId) {
        return `${tenantId}:${roleId}`;
    }
    async createRole(role) {
        const key = this.getKey(role.tenantId, role.roleId);
        if (this.roles.has(key)) {
            throw new Error(`Role already exists: ${role.roleId}`);
        }
        this.roles.set(key, role);
        return role;
    }
    async getRole(tenantId, roleId) {
        const key = this.getKey(tenantId, roleId);
        return this.roles.get(key) || null;
    }
    async updateRole(tenantId, roleId, updates) {
        const key = this.getKey(tenantId, roleId);
        const existing = this.roles.get(key);
        if (!existing) {
            throw new Error(`Role not found: ${roleId}`);
        }
        const updated = {
            ...existing,
            ...updates,
            roleId: existing.roleId, // Immutable
            tenantId: existing.tenantId, // Immutable
            createdAt: existing.createdAt, // Immutable
            updatedAt: new Date(),
        };
        this.roles.set(key, updated);
        return updated;
    }
    async deleteRole(tenantId, roleId) {
        const key = this.getKey(tenantId, roleId);
        this.roles.delete(key);
    }
    async listRoles(tenantId) {
        return Array.from(this.roles.values())
            .filter(role => role.tenantId === tenantId);
    }
}
exports.InMemoryRoleStorage = InMemoryRoleStorage;
/**
 * In-memory implementation for user-role assignments
 */
class InMemoryUserRoleStorage {
    constructor() {
        this.assignments = new Map();
    }
    getKey(tenantId, userId, roleId) {
        return `${tenantId}:${userId}:${roleId}`;
    }
    getUserKey(tenantId, userId) {
        return `${tenantId}:${userId}:`;
    }
    getRoleKey(tenantId, _roleId) {
        return `${tenantId}:`;
    }
    async assignRole(assignment) {
        const key = this.getKey(assignment.tenantId, assignment.userId, assignment.roleId);
        this.assignments.set(key, assignment);
        return assignment;
    }
    async removeRole(tenantId, userId, roleId) {
        const key = this.getKey(tenantId, userId, roleId);
        this.assignments.delete(key);
    }
    async getUserRoles(tenantId, userId) {
        const userKey = this.getUserKey(tenantId, userId);
        return Array.from(this.assignments.entries())
            .filter(([key]) => key.startsWith(userKey))
            .map(([, assignment]) => assignment.roleId);
    }
    async getRoleUsers(tenantId, roleId) {
        const roleKey = this.getRoleKey(tenantId, roleId);
        return Array.from(this.assignments.entries())
            .filter(([key, assignment]) => key.startsWith(roleKey) && assignment.roleId === roleId)
            .map(([, assignment]) => assignment.userId);
    }
}
exports.InMemoryUserRoleStorage = InMemoryUserRoleStorage;
//# sourceMappingURL=storage.js.map