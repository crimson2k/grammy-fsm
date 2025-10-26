/**
 * FSM (Finite State Machine) Module for Grammy
 *
 * A full-featured FSM implementation for Grammy bot framework,
 * with synchronous API (like Grammy session).
 *
 * @module fsm
 *
 * @example
 * ```typescript
 * import { Bot } from "grammy";
 * import { createFSM, state, type FSMFlavor } from "grammy-fsm";
 *
 * // Define states using enum
 * enum MyStates {
 *   Registration = "registration",
 *   AwaitingName = "awaiting_name"
 * }
 *
 * // Create bot with FSM
 * type MyContext = Context & FSMFlavor;
 * const bot = new Bot<MyContext>("TOKEN");
 * bot.use(createFSM({ storage: "memory" }));
 *
 * // Use states (synchronous API - no await!)
 * bot.command("start", async (ctx) => {
 *   ctx.state = MyStates.Registration;
 *   await ctx.reply("What's your name?");
 * });
 *
 * bot.filter(state(MyStates.Registration)).on("message:text", async (ctx) => {
 *   ctx.data.name = ctx.message.text;
 *   await ctx.reply("Registration complete!");
 *   ctx.fsm.clear();
 * });
 * ```
 */

// Middleware filters
export { inAnyState, noState, state, states } from "./middleware";
// Core plugin
export { createFSM } from "./plugin";
// Storage implementations
export { MemoryStorage, RedisStorage } from "./storage";
// Types and interfaces
export type {
  FSMContextMethods,
  FSMFlavor,
  FSMOptions,
  FSMSessionData,
  FSMStorage,
  StateFilterFn,
} from "./types";
