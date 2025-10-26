import type { Context } from "grammy";
import type { FSMFlavor } from "./types";

/**
 * Filter function that checks if user is in a specific state
 * Synchronous - no await needed!
 *
 * @param stateName - State name to filter by
 * @returns Filter function for Grammy .filter()
 *
 * @example
 * ```typescript
 * // With enum
 * enum MyStates {
 *   AwaitingName = "awaiting_name",
 *   AwaitingAge = "awaiting_age"
 * }
 *
 * bot.filter(state(MyStates.AwaitingName)).on("message:text", async (ctx) => {
 *   // Only runs when user is in "awaiting_name" state
 * });
 *
 * // With string
 * bot.filter(state("awaiting_name")).on("message:text", async (ctx) => {
 *   // Also works with plain strings
 * });
 * ```
 */
export function state(stateName: string) {
  return (ctx: Context & FSMFlavor): boolean => {
    if (!ctx.state) {
      throw new Error(
        "FSM plugin not initialized. Did you forget to use createFSM()?",
      );
    }

    return ctx.state.get() === stateName;
  };
}

/**
 * Filter function that checks if user is in any of the specified states
 * Synchronous - no await needed!
 *
 * @param stateNames - Multiple state names
 * @returns Filter function for Grammy .filter()
 *
 * @example
 * ```typescript
 * enum MyStates {
 *   Step1 = "step1",
 *   Step2 = "step2",
 *   Step3 = "step3"
 * }
 *
 * bot.filter(states(MyStates.Step1, MyStates.Step2)).on("message", async (ctx) => {
 *   // Runs when user is in step1 OR step2
 * });
 * ```
 */
export function states(...stateNames: string[]) {
  return (ctx: Context & FSMFlavor): boolean => {
    if (!ctx.state) {
      throw new Error(
        "FSM plugin not initialized. Did you forget to use createFSM()?",
      );
    }

    const currentState = ctx.state.get();
    return currentState !== null && stateNames.includes(currentState);
  };
}

/**
 * Filter function that checks if user has any state set
 * Synchronous - no await needed!
 *
 * @returns Filter function for Grammy .filter()
 *
 * @example
 * ```typescript
 * bot.filter(inAnyState()).on("message", async (ctx) => {
 *   // Only runs if user has a state (any state)
 * });
 * ```
 */
export function inAnyState() {
  return (ctx: Context & FSMFlavor): boolean => {
    if (!ctx.state) {
      throw new Error(
        "FSM plugin not initialized. Did you forget to use createFSM()?",
      );
    }

    return ctx.state.has();
  };
}

/**
 * Filter function that checks if user has no state set
 * Synchronous - no await needed!
 *
 * @returns Filter function for Grammy .filter()
 *
 * @example
 * ```typescript
 * bot.filter(noState()).on("message", async (ctx) => {
 *   // Only runs if user has no state set
 * });
 * ```
 */
export function noState() {
  return (ctx: Context & FSMFlavor): boolean => {
    if (!ctx.state) {
      throw new Error(
        "FSM plugin not initialized. Did you forget to use createFSM()?",
      );
    }

    return !ctx.state.has();
  };
}
