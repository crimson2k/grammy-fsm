import type { FSMStorage } from "../types";

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<any>;
  setex(key: string, seconds: number, value: string): Promise<any>;
  del(...keys: string[]): Promise<number>;
}

/**
 * Redis storage implementation for FSM
 * Provides persistence and scalability for production environments
 *
 * @example
 * ```typescript
 * import { Redis } from "ioredis";
 *
 * const redis = new Redis();
 * const storage = new RedisStorage(redis, {
 *   keyPrefix: "bot:fsm:",
 *   ttl: 3600
 * });
 * ```
 */
export class RedisStorage implements FSMStorage {
  private keyPrefix: string;
  private ttl?: number;

  constructor(
    private redis: RedisClient,
    options: { keyPrefix?: string; ttl?: number } = {},
  ) {
    this.keyPrefix = options.keyPrefix ?? "fsm:";
    this.ttl = options.ttl;
  }

  private getStateKey(userId: number): string {
    return `${this.keyPrefix}${this.sanitizeUserId(userId)}:state`;
  }

  private getDataKey(userId: number): string {
    return `${this.keyPrefix}${this.sanitizeUserId(userId)}:data`;
  }

  private sanitizeUserId(userId: number): string {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error(`Invalid userId: ${userId}`);
    }
    return userId.toString();
  }

  async setState(userId: number, state: string): Promise<void> {
    const key = this.getStateKey(userId);

    if (this.ttl) {
      await this.redis.setex(key, this.ttl, state);
    } else {
      await this.redis.set(key, state);
    }
  }

  async getState(userId: number): Promise<string | null> {
    const key = this.getStateKey(userId);
    return await this.redis.get(key);
  }

  async setData(userId: number, data: Record<string, any>): Promise<void> {
    const key = this.getDataKey(userId);
    const serialized = JSON.stringify(data);

    if (this.ttl) {
      await this.redis.setex(key, this.ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async getData(userId: number): Promise<Record<string, any> | null> {
    const key = this.getDataKey(userId);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      const parsed = JSON.parse(data);
      return Object.keys(parsed).length > 0 ? parsed : null;
    } catch (error) {
      console.error("Failed to parse FSM data from Redis:", error);
      return null;
    }
  }

  async updateData(userId: number, data: Record<string, any>): Promise<void> {
    const current = (await this.getData(userId)) ?? {};
    const updated = { ...current, ...data };
    await this.setData(userId, updated);
  }

  async clear(userId: number): Promise<void> {
    const stateKey = this.getStateKey(userId);
    const dataKey = this.getDataKey(userId);
    await this.redis.del(stateKey, dataKey);
  }
}
