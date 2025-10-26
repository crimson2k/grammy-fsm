import type { Context, MiddlewareFn, MiddlewareObj, NextFunction } from "grammy";
import { addFSMToContext } from "./context";
import { MemoryStorage } from "./storage/memory";
import { RedisStorage } from "./storage/redis";
import type { FSMOptions, FSMSessionData, FSMStorage } from "./types";

/**
 * Creates FSM plugin for Grammy bot
 *
 * This plugin adds FSM capabilities to your bot context, allowing you to:
 * - Manage user states (synchronously!)
 * - Store temporary data per user (synchronously!)
 * - Filter handlers based on current state
 *
 * Works like Grammy session plugin:
 * 1. Loads state and data BEFORE handlers
 * 2. Handlers work with data synchronously (no await!)
 * 3. Saves state and data AFTER handlers
 *
 * @param options - Configuration options for FSM
 * @returns Middleware object to be used with bot.use()
 *
 * @example
 * ```typescript
 * // With memory storage (development)
 * bot.use(createFSM({ storage: "memory" }));
 *
 * // With Redis storage (production)
 * import { Redis } from "ioredis";
 * const redis = new Redis();
 *
 * bot.use(createFSM({
 *   storage: "redis",
 *   redis: {
 *     client: redis,
 *     keyPrefix: "bot:fsm:",
 *   },
 *   ttl: 3600, // 1 hour
 *   onStateChange: (userId, oldState, newState) => {
 *     console.log(`User ${userId}: ${oldState} -> ${newState}`);
 *   }
 * }));
 *
 * // With custom storage
 * const customStorage = new MyCustomStorage();
 * bot.use(createFSM({ storage: customStorage }));
 * ```
 */
export function createFSM<C extends Context>(
  options: FSMOptions,
): MiddlewareFn<C> {
  const storage = initializeStorage(options);
  const globalOnStateChange = options.onStateChange;

  return async (ctx: C, next: NextFunction) => {
    const userId = ctx.from?.id;

    // Skip if no user context
    if (!userId) {
      await next();
      return;
    }

    // LOAD: Load session data from storage BEFORE handlers
    const state = await storage.getState(userId);
    const data = await storage.getData(userId);

    const sessionData: FSMSessionData = {
      state: state,
      data: data || {},
    };

    // Create state change callback for this specific user
    const onStateChange = globalOnStateChange
      ? (oldState: string | null, newState: string | null) => {
          globalOnStateChange(userId, oldState, newState);
        }
      : undefined;

    // Add FSM methods to context (synchronous API)
    addFSMToContext(ctx, sessionData, onStateChange);

    // Execute handlers (they work with sessionData synchronously)
    await next();

    // SAVE: Save session data to storage AFTER handlers
    if (sessionData.state !== null) {
      // State is set - save both state and data
      await storage.setState(userId, sessionData.state);
      await storage.setData(userId, sessionData.data);
    } else if (state !== null) {
      // State was cleared - clear storage
      await storage.clear(userId);
    }
    // If state was null and still null - do nothing (no unnecessary writes)
  };
}

/**
 * Initializes storage based on options
 */
function initializeStorage(options: FSMOptions): FSMStorage {
  // If custom storage instance provided
  if (typeof options.storage === "object") {
    return options.storage;
  }

  // Memory storage
  if (options.storage === "memory") {
    return new MemoryStorage();
  }

  // Redis storage
  if (options.storage === "redis") {
    if (!options.redis?.client) {
      throw new Error(
        'Redis client is required when using storage: "redis". Provide options.redis.client',
      );
    }

    return new RedisStorage(options.redis.client, {
      keyPrefix: options.redis.keyPrefix,
      ttl: options.ttl,
    });
  }

  throw new Error(`Unknown storage type: ${options.storage}`);
}
