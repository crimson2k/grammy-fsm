import type { Context } from "grammy";
import type { FSMContextMethods, FSMSessionData } from "./types";

/**
 * Creates FSM context methods for a user
 * Synchronous API - session data is loaded before and saved after handlers
 */
export function createFSMContext(
  sessionData: FSMSessionData,
  onStateChange?: (oldState: string | null, newState: string | null) => void,
): FSMContextMethods["fsm"] {
  return {
    // Direct state access (synchronous)
    get state(): string | null {
      return sessionData.state;
    },

    set state(value: string | null) {
      const oldState = sessionData.state;
      sessionData.state = value;

      if (onStateChange && oldState !== value) {
        onStateChange(oldState, value);
      }
    },

    // Direct data access (synchronous)
    get data(): Record<string, any> {
      return sessionData.data;
    },

    set data(value: Record<string, any>) {
      sessionData.data = value;
    },

    // State management methods
    setState(state: string): void {
      const oldState = sessionData.state;
      sessionData.state = state;

      if (onStateChange && oldState !== state) {
        onStateChange(oldState, state);
      }
    },

    getState(): string | null {
      return sessionData.state;
    },

    hasState(): boolean {
      return sessionData.state !== null;
    },

    // Data management methods
    setData(data: Record<string, any>): void {
      sessionData.data = data;
    },

    getData<T = Record<string, any>>(): T {
      return sessionData.data as T;
    },

    updateData(data: Record<string, any>): void {
      sessionData.data = { ...sessionData.data, ...data };
    },

    // Individual field operations
    get<T = any>(key: string): T | undefined {
      return sessionData.data[key] as T | undefined;
    },

    set(key: string, value: any): void {
      sessionData.data[key] = value;
    },

    delete(key: string): void {
      // biome-ignore lint/performance/noDelete: Required for FSM API
      delete sessionData.data[key];
    },

    // Clear everything
    clear(): void {
      const oldState = sessionData.state;
      sessionData.state = null;
      sessionData.data = {};

      if (onStateChange && oldState !== null) {
        onStateChange(oldState, null);
      }
    },
  };
}

/**
 * Adds FSM methods to Grammy context
 */
export function addFSMToContext<C extends Context>(
  ctx: C,
  sessionData: FSMSessionData,
  onStateChange?: (oldState: string | null, newState: string | null) => void,
): asserts ctx is C & FSMContextMethods {
  (ctx as any).fsm = createFSMContext(sessionData, onStateChange);
}
