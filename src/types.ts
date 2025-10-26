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
 * FSM context methods added to Grammy context
 * Synchronous API - no await needed!
 */
export interface FSMContextMethods {
  fsm: {
    /**
     * Current state (synchronous access)
     * @example ctx.fsm.state = "awaiting_name"
     */
    state: string | null;

    /**
     * Session data (synchronous access)
     * @example ctx.fsm.data.name = "John"
     */
    data: Record<string, any>;

    /**
     * Set current state
     * @example ctx.fsm.setState("awaiting_name")
     */
    setState(state: string): void;

    /**
     * Get current state
     * @example const state = ctx.fsm.getState()
     */
    getState(): string | null;

    /**
     * Check if state is set
     * @example if (ctx.fsm.hasState()) { ... }
     */
    hasState(): boolean;

    /**
     * Set data (overwrites all data)
     * @example ctx.fsm.setData({ name: "John", age: 25 })
     */
    setData(data: Record<string, any>): void;

    /**
     * Get all data
     * @example const data = ctx.fsm.getData()
     */
    getData<T = Record<string, any>>(): T;

    /**
     * Update data (merges with existing)
     * @example ctx.fsm.updateData({ city: "NYC" })
     */
    updateData(data: Record<string, any>): void;

    /**
     * Get single field
     * @example const name = ctx.fsm.get<string>("name")
     */
    get<T = any>(key: string): T | undefined;

    /**
     * Set single field
     * @example ctx.fsm.set("name", "John")
     */
    set(key: string, value: any): void;

    /**
     * Delete single field
     * @example ctx.fsm.delete("name")
     */
    delete(key: string): void;

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
