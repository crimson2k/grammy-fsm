# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-10-27

### Changed - BREAKING CHANGES

**State and data moved to top-level context** - `ctx.fsm.state` and `ctx.fsm.data` are now accessible directly as `ctx.state` and `ctx.data` for a cleaner, more intuitive API.

#### Migration Guide

**State Management:**
- `ctx.fsm.state.set(state)` → `ctx.state.set(state)`
- `ctx.fsm.state.get()` → `ctx.state.get()`
- `ctx.fsm.state.has()` → `ctx.state.has()`
- `ctx.fsm.state.clear()` → `ctx.state.clear()`
- `ctx.fsm.state = state` → `ctx.state = state` (shorthand)
- New: `ctx.state = undefined` or `ctx.state = null` - shorthand for `ctx.state.clear()`

**Data Management:**
- `ctx.fsm.data.setAll(data)` → `ctx.data.setAll(data)`
- `ctx.fsm.data.getAll()` → `ctx.data.getAll()`
- `ctx.fsm.data.update(data)` → `ctx.data.update(data)`
- `ctx.fsm.data.set(key, value)` → `ctx.data.set(key, value)`
- `ctx.fsm.data.get(key)` → `ctx.data.get(key)`
- `ctx.fsm.data.delete(key)` → `ctx.data.delete(key)`
- `ctx.fsm.data.clear()` → `ctx.data.clear()`
- `ctx.fsm.data.fieldName` → `ctx.data.fieldName` (direct access)
- New: `ctx.data = undefined` or `ctx.data = null` - shorthand for `ctx.data.clear()`

**General:**
- `ctx.fsm.clear()` - remains the same (clears both state and data)

### Added
- Shorthand syntax for clearing: `ctx.state = undefined` and `ctx.data = undefined`
- More intuitive API with state and data at top-level context
- Cleaner code with shorter property paths

### Removed
- `ctx.fsm.state` namespace (moved to `ctx.state`)
- `ctx.fsm.data` namespace (moved to `ctx.data`)

## [0.2.0] - 2025-10-26

### Changed - BREAKING CHANGES

**Complete API restructure** - state and data methods are now organized in separate namespaces for better clarity and consistency.

#### Migration Guide

**State Management:**
- `ctx.fsm.setState(state)` → `ctx.fsm.state.set(state)` or `ctx.fsm.state = state`
- `ctx.fsm.getState()` → `ctx.fsm.state.get()`
- `ctx.fsm.hasState()` → `ctx.fsm.state.has()`
- New: `ctx.fsm.state.clear()` - clear state only

**Data Management:**
- `ctx.fsm.setData(data)` → `ctx.fsm.data.setAll(data)`
- `ctx.fsm.getData()` → `ctx.fsm.data.getAll()`
- `ctx.fsm.updateData(data)` → `ctx.fsm.data.update(data)`
- `ctx.fsm.set(key, value)` → `ctx.fsm.data.set(key, value)` or `ctx.fsm.data.key = value`
- `ctx.fsm.get(key)` → `ctx.fsm.data.get(key)` or `ctx.fsm.data.key`
- `ctx.fsm.delete(key)` → `ctx.fsm.data.delete(key)`
- New: `ctx.fsm.data.clear()` - clear data only

**General:**
- `ctx.fsm.clear()` - remains the same (clears both state and data)

### Added
- Direct field access for data: `ctx.fsm.data.fieldName = value`
- Shorthand state setter: `ctx.fsm.state = "value"`
- Separate clear methods for state and data
- Improved TypeScript types with `StateNamespace` and `DataNamespace`
- Better API discoverability through namespacing

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
