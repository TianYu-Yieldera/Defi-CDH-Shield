/**
 * Base Name Cache
 * Caches ENS/Base Name resolutions to reduce RPC calls
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class BaseNameCache {
  private cache: Map<string, CacheEntry<string | null>>;
  private avatarCache: Map<string, CacheEntry<string | null>>;
  private readonly TTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();
    this.avatarCache = new Map();

    // Clean up expired entries every minute
    if (typeof window !== "undefined") {
      setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  /**
   * Get cached Base Name for address
   */
  getName(address: string): string | null | undefined {
    const entry = this.cache.get(address.toLowerCase());

    if (!entry) {
      return undefined; // Not in cache
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(address.toLowerCase());
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set Base Name for address
   */
  setName(address: string, name: string | null): void {
    this.cache.set(address.toLowerCase(), {
      value: name,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached avatar for Base Name
   */
  getAvatar(name: string): string | null | undefined {
    const entry = this.avatarCache.get(name.toLowerCase());

    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.timestamp > this.TTL) {
      this.avatarCache.delete(name.toLowerCase());
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set avatar for Base Name
   */
  setAvatar(name: string, avatar: string | null): void {
    this.avatarCache.set(name.toLowerCase(), {
      value: avatar,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    // Clean up name cache
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }

    // Clean up avatar cache
    for (const [key, entry] of this.avatarCache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.avatarCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.avatarCache.clear();
  }

  /**
   * Get cache stats (for debugging)
   */
  getStats() {
    return {
      nameEntries: this.cache.size,
      avatarEntries: this.avatarCache.size,
      ttl: this.TTL,
    };
  }
}

// Singleton instance
export const baseNameCache = new BaseNameCache();
