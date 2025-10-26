import type { Context } from "grammy";

/**
 * Storage interface for FSM state and data persistence
 */
export interface FSMStorage {
  /**
   * Set state for a user
   */
  setState(userId: number, state: string): Promise<void>;

  /**
   * Get current state for a user
   */
  getState(userId: number): Promise<string | null>;

  /**
   * Set data for a user (overwrites existing data)
   */
  setData(userId: number, data: Record<string, any>): Promise<void>;

  /**
   * Get all data for a user
   */
  getData(userId: number): Promise<Record<string, any> | null>;

  /**
   * Update data for a user (merges with existing data)
   */
  updateData(userId: number, data: Record<string, any>): Promise<void>;

  /**
   * Clear both state and data for a user
   */
  clear(userId: number): Promise<void>;
}

/**
 * FSM session data structure
 */
export interface FSMSessionData {
  state: string | null;
  data: Record<string, any>;
}

/**
 * State management namespace
 * Provides methods to work with FSM state
 * Automatically converts to primitive when used in string context
 */
export interface StateNamespace {
  /**
   * Set current state
   * @example ctx.fsm.state.set("awaiting_name")
   */
  set(state: string): void;

  /**
   * Get current state
   * @example const state = ctx.fsm.state.get()
   */
  get(): string | null;

  /**
   * Check if state is set
   * @example if (ctx.fsm.state.has()) { ... }
   */
  has(): boolean;

  /**
   * Clear state (sets to null)
   * @example ctx.fsm.state.clear()
   */
  clear(): void;

  /**
   * Convert to string (returns current state)
   * @example String(ctx.fsm.state) -> "awaiting_name"
   */
  toString(): string;

  /**
   * Return primitive value (returns current state)
   * @example ctx.fsm.state.valueOf() -> "awaiting_name"
   */
  valueOf(): string | null;

  /**
   * Symbol for primitive conversion
   */
  [Symbol.toPrimitive](hint: string): string | null;
}

/**
 * Data management namespace
 * Provides methods to work with FSM data
 * Supports direct field access: ctx.fsm.data.name = "John"
 */
export interface DataNamespace {
  /**
   * Set single field
   * @example ctx.fsm.data.set("name", "John")
   */
  set(key: string, value: any): void;

  /**
   * Get single field
   * @example const name = ctx.fsm.data.get<string>("name")
   */
  get<T = any>(key: string): T | undefined;

  /**
   * Set all data (overwrites)
   * @example ctx.fsm.data.setAll({ name: "John", age: 25 })
   */
  setAll(data: Record<string, any>): void;

  /**
   * Get all data
   * @example const data = ctx.fsm.data.getAll()
   */
  getAll<T = Record<string, any>>(): T;

  /**
   * Update data (merges with existing)
   * @example ctx.fsm.data.update({ city: "NYC" })
   */
  update(data: Record<string, any>): void;

  /**
   * Delete single field
   * @example ctx.fsm.data.delete("name")
   */
  delete(key: string): void;

  /**
   * Clear all data
   * @example ctx.fsm.data.clear()
   */
  clear(): void;

  /**
   * Direct field access via index signature
   * @example ctx.fsm.data.name = "John"
   */
  [key: string]: any;
}

/**
 * FSM context methods added to Grammy context
 * Synchronous API - no await needed!
 */
export interface FSMContextMethods {
  /**
   * State namespace - methods for state management
   * Supports shorthand: ctx.state = "awaiting_name"
   * Clear with: ctx.state.clear() or ctx.state = undefined
   * @example
   * ctx.state.set("awaiting_name")
   * ctx.state = "awaiting_name"  // shorthand
   * ctx.state = undefined        // clear state
   */
  state: StateNamespace;

  /**
   * Data namespace - methods for data management
   * Supports direct field access: ctx.data.name = "John"
   * Clear with: ctx.data.clear() or ctx.data = undefined
   * @example
   * ctx.data.set("name", "John")
   * ctx.data.name = "John"       // direct access
   * ctx.data = undefined          // clear data
   */
  data: DataNamespace;

  /**
   * FSM namespace - global operations
   */
  fsm: {
    /**
     * Clear everything (state and data)
     * @example ctx.fsm.clear()
     */
    clear(): void;
  };
}

/**
 * FSM flavor for Grammy context
 * Use this to extend your context type
 *
 * @example
 * ```typescript
 * import type { Context } from "grammy";
 * import type { FSMFlavor } from "modules/fsm";
 *
 * type MyContext = Context & FSMFlavor;
 * const bot = new Bot<MyContext>("TOKEN");
 * ```
 */
export type FSMFlavor = FSMContextMethods;

/**
 * Options for createFSM plugin
 */
export interface FSMOptions {
  storage: "memory" | "redis" | FSMStorage;
  redis?: {
    client: any; // Redis client instance
    keyPrefix?: string;
  };
  ttl?: number; // Time to live in seconds
  onStateChange?: (
    userId: number,
    oldState: string | null,
    newState: string | null,
  ) => void | Promise<void>;
}

/**
 * State filter function type
 * Returns a predicate function for Grammy's .filter() method
 */
export type StateFilterFn = (ctx: Context & FSMFlavor) => boolean;
