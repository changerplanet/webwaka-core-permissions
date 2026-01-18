# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Core permissions service implementation
- Role-based access control (RBAC) with capability-based permissions
- Role management (create, update, delete, list)
- User role assignment and revocation
- Permission check primitives (single, all, any)
- Capability aggregation from multiple roles
- Policy context builder for advanced authorization
- Storage abstraction layer (RoleStorage, UserRoleStorage)
- In-memory storage implementations for testing
- Comprehensive test suite with tenant isolation verification
- TypeScript type definitions and interfaces
- Input validation with Zod schemas
- ESLint and TypeScript configuration

## [0.1.0] - 2026-01-18

### Added
- Initial commit with governance structure
