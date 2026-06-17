export class MemoryCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();
  private readonly ttl: number;
  private readonly maxKeys: number;

  constructor(ttlSeconds: number = 60, maxKeys: number = 1000) {
    this.ttl = ttlSeconds * 1000;
    this.maxKeys = maxKeys;
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  set(key: string, value: T): void {
    // Evict oldest if full (simple LRU-ish, though Map iteration order is insertion order)
    if (this.cache.size >= this.maxKeys) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey); 
    }
    
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
