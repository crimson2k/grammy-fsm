import type { Context } from "grammy";
import type {
  DataNamespace,
  FSMContextMethods,
  FSMSessionData,
  StateNamespace,
} from "./types.js";

/**
 * Creates state namespace with methods for state management
 */
function createStateNamespace(
  sessionData: FSMSessionData,
  onStateChange?: (oldState: string | null, newState: string | null) => void,
  markModified?: () => void,
): StateNamespace {
  return {
    set(state: string): void {
      const oldState = sessionData.state;
      if (oldState !== state) {
        sessionData.state = state;
        markModified?.();
        if (onStateChange) {
          onStateChange(oldState, state);
        }
      }
    },

    get(): string | null {
      return sessionData.state;
    },

    has(): boolean {
      return sessionData.state !== null;
    },

    clear(): void {
      const oldState = sessionData.state;
      if (oldState !== null) {
        sessionData.state = null;
        markModified?.();
        if (onStateChange) {
          onStateChange(oldState, null);
        }
      }
    },

    // For automatic primitive conversion
    // String(ctx.fsm.state) returns the state value
    toString(): string {
      return sessionData.state ?? "";
    },

    // For numeric context (rare, but for completeness)
    valueOf(): string | null {
      return sessionData.state;
    },

    // For console.log() - show only state value, not methods
    [Symbol.for("nodejs.util.inspect.custom")](): string | null {
      return sessionData.state;
    },

    // Universal primitive conversion
    [Symbol.toPrimitive](hint: string): string | null {
      if (hint === "string") {
        return sessionData.state ?? "";
      }
      return sessionData.state;
    },
  };
}

/**
 * Creates data namespace with methods for data management
 * Supports direct field access via Proxy
 */
function createDataNamespace(
  sessionData: FSMSessionData,
  markModified?: () => void,
): DataNamespace {
  const namespace = {
    set(key: string, value: any): void {
      sessionData.data[key] = value;
      markModified?.();
    },

    get<T = any>(key: string): T | undefined {
      return sessionData.data[key] as T | undefined;
    },

    setAll(data: Record<string, any>): void {
      sessionData.data = data;
      markModified?.();
    },

    getAll<T = Record<string, any>>(): T {
      return sessionData.data as T;
    },

    update(data: Record<string, any>): void {
      sessionData.data = { ...sessionData.data, ...data };
      markModified?.();
    },

    delete(key: string): void {
      // biome-ignore lint/performance/noDelete: Required for FSM API
      delete sessionData.data[key];
      markModified?.();
    },

    clear(): void {
      sessionData.data = {};
      markModified?.();
    },

    // For JSON.stringify() - serialize only data, not methods
    toJSON(): Record<string, any> {
      return sessionData.data;
    },

    // For console.log() in Node.js - show only data, not methods
    [Symbol.for("nodejs.util.inspect.custom")](): Record<string, any> {
      return sessionData.data;
    },
  };

  // Use Proxy to enable direct field access: ctx.fsm.data.name = "John"
  // and to make it behave like a plain object when iterating
  return new Proxy(namespace, {
    get(target, prop: string | symbol) {
      // If property is a method or symbol, return it from namespace
      if (prop in target) {
        return target[prop as keyof typeof target];
      }
      // Otherwise, get from sessionData
      if (typeof prop === "string") {
        return sessionData.data[prop];
      }
    },

    set(target, prop: string, value: any) {
      // Don't allow overwriting methods
      if (prop in target) {
        return false;
      }
      // Set to sessionData
      sessionData.data[prop] = value;
      markModified?.();
      return true;
    },

    has(target, prop: string) {
      return prop in target || prop in sessionData.data;
    },

    deleteProperty(target, prop: string) {
      // Don't allow deleting methods
      if (prop in target) {
        return false;
      }
      // biome-ignore lint/performance/noDelete: Required for FSM API
      delete sessionData.data[prop];
      markModified?.();
      return true;
    },

    // Return only data keys, not method names
    // This makes Object.keys(ctx.fsm.data) return only data fields
    ownKeys(target) {
      return Object.keys(sessionData.data);
    },

    // Describe data properties as enumerable
    // This makes for...in loops and Object.entries() work correctly
    getOwnPropertyDescriptor(target, prop: string) {
      // Methods are not enumerable
      if (prop in target) {
        return Object.getOwnPropertyDescriptor(target, prop);
      }
      // Data fields are enumerable
      if (prop in sessionData.data) {
        return {
          enumerable: true,
          configurable: true,
          value: sessionData.data[prop],
        };
      }
    },
  }) as DataNamespace;
}

/**
 * Creates FSM context methods for a user
 * Synchronous API - session data is loaded before and saved after handlers
 */
export function createFSMContext(
  sessionData: FSMSessionData,
  onStateChange?: (oldState: string | null, newState: string | null) => void,
  markModified?: () => void,
): { state: StateNamespace; data: DataNamespace; fsm: { clear(): void } } {
  const stateNamespace = createStateNamespace(
    sessionData,
    onStateChange,
    markModified,
  );
  const dataNamespace = createDataNamespace(sessionData, markModified);

  return {
    state: stateNamespace,
    data: dataNamespace,
    fsm: {
      clear(): void {
        const oldState = sessionData.state;
        const hadData = Object.keys(sessionData.data).length > 0;
        if (oldState !== null || hadData) {
          sessionData.state = null;
          sessionData.data = {};
          markModified?.();

          if (onStateChange && oldState !== null) {
            onStateChange(oldState, null);
          }
        }
      },
    },
  };
}

/**
 * Adds FSM methods to Grammy context
 * Supports shorthand setters:
 * - ctx.state = "value" calls state.set()
 * - ctx.state = undefined calls state.clear()
 * - ctx.data = undefined calls data.clear()
 */
export function addFSMToContext<C extends Context>(
  ctx: C,
  sessionData: FSMSessionData,
  onStateChange?: (oldState: string | null, newState: string | null) => void,
  markModified?: () => void,
): asserts ctx is C & FSMContextMethods {
  const { state, data, fsm } = createFSMContext(
    sessionData,
    onStateChange,
    markModified,
  );

  // Add fsm namespace with clear() method
  (ctx as any).fsm = fsm;

  // Add state with property descriptor to handle shortcuts
  // ctx.state = "value" -> state.set(value)
  // ctx.state = undefined -> state.clear()
  Object.defineProperty(ctx, "state", {
    get() {
      return state;
    },
    set(value: any) {
      if (value === undefined || value === null) {
        state.clear();
      } else if (typeof value === "string") {
        state.set(value);
      }
    },
    enumerable: true,
    configurable: true,
  });

  // Add data with property descriptor to handle shortcuts
  // ctx.data = undefined -> data.clear()
  Object.defineProperty(ctx, "data", {
    get() {
      return data;
    },
    set(value: any) {
      if (value === undefined || value === null) {
        data.clear();
      }
    },
    enumerable: true,
    configurable: true,
  });
}

