# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-26

### Added
- Initial release of grammy-fsm
- Finite State Machine implementation for Grammy
- Memory storage backend for development
- Redis storage backend for production
- Type-safe state management with TypeScript
- Middleware filters: `state()`, `states()`, `inAnyState()`, `noState()`
- Context methods for state and data management
- TTL support for automatic cleanup (Redis)
- State change callbacks via `onStateChange` option
- Complete TypeScript type definitions
- Comprehensive documentation and examples
