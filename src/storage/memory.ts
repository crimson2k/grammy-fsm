import type { FSMStorage } from "../types";

interface StorageData {
  state: string | null;
  data: Record<string, any>;
}

/**
 * In-memory storage implementation for FSM
 * Useful for development and testing
 *
 * @example
 * ```typescript
 * const storage = new MemoryStorage();
 * await storage.setState(123, "awaiting_name");
 * const state = await storage.getState(123); // "awaiting_name"
 * ```
 */
export class MemoryStorage implements FSMStorage {
  private storage = new Map<number, StorageData>();

  async setState(userId: number, state: string): Promise<void> {
    const current = this.storage.get(userId) ?? { state: null, data: {} };
    current.state = state;
    this.storage.set(userId, current);
  }

  async getState(userId: number): Promise<string | null> {
    return this.storage.get(userId)?.state ?? null;
  }

  async setData(userId: number, data: Record<string, any>): Promise<void> {
    const current = this.storage.get(userId) ?? { state: null, data: {} };
    current.data = data;
    this.storage.set(userId, current);
  }

  async getData(userId: number): Promise<Record<string, any> | null> {
    const data = this.storage.get(userId)?.data;
    return data && Object.keys(data).length > 0 ? data : null;
  }

  async updateData(userId: number, data: Record<string, any>): Promise<void> {
    const current = this.storage.get(userId) ?? { state: null, data: {} };
    current.data = { ...current.data, ...data };
    this.storage.set(userId, current);
  }

  async clear(userId: number): Promise<void> {
    this.storage.delete(userId);
  }

  /**
   * Get all stored user IDs (useful for testing/debugging)
   */
  getUserIds(): number[] {
    return Array.from(this.storage.keys());
  }

  /**
   * Clear all data (useful for testing)
   */
  clearAll(): void {
    this.storage.clear();
  }
}
