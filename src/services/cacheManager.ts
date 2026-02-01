import { TokenizedCode } from './tokenizationService';

/**
 * LRU Cache entry
 */
interface CacheEntry<T> {
    key: string;
    value: T;
    timestamp: number;
}

/**
 * CacheManager - Implements LRU (Least Recently Used) cache for tokenized code blocks
 * Improves performance by caching tokenization results
 */
export class CacheManager {
    private cache: Map<string, CacheEntry<TokenizedCode>>;
    private maxSize: number;
    private accessOrder: string[]; // Track access order for LRU

    constructor(maxSize: number = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.accessOrder = [];
    }

    /**
     * Get cached tokenized code
     */
    public get(key: string): TokenizedCode | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Update access order (move to end - most recently used)
        this.updateAccessOrder(key);
        entry.timestamp = Date.now();

        return entry.value;
    }

    /**
     * Store tokenized code in cache
     */
    public set(key: string, value: TokenizedCode): void {
        // Check if key already exists
        if (this.cache.has(key)) {
            // Update existing entry
            const entry = this.cache.get(key)!;
            entry.value = value;
            entry.timestamp = Date.now();
            this.updateAccessOrder(key);
            return;
        }

        // Check if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictLeastRecentlyUsed();
        }

        // Add new entry
        const entry: CacheEntry<TokenizedCode> = {
            key,
            value,
            timestamp: Date.now()
        };

        this.cache.set(key, entry);
        this.accessOrder.push(key);
    }

    /**
     * Generate cache key from code block properties
     */
    public generateKey(code: string, language: string, themeKind: string): string {
        const hash = this.hashCode(code);
        return `${language}:${themeKind}:${hash}`;
    }

    /**
     * Clear all cached entries
     */
    public clear(): void {
        this.cache.clear();
        this.accessOrder = [];
    }

    /**
     * Get current cache size
     */
    public size(): number {
        return this.cache.size;
    }

    /**
     * Check if key exists in cache
     */
    public has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Remove specific entry from cache
     */
    public delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.accessOrder = this.accessOrder.filter(k => k !== key);
        }
        return deleted;
    }

    /**
     * Get cache statistics
     */
    public getStats(): { size: number; maxSize: number; hitRate: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: 0 // Could be calculated with hit/miss counters
        };
    }

    /**
     * Update access order for LRU tracking
     */
    private updateAccessOrder(key: string): void {
        // Remove key from current position
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        // Add to end (most recently used)
        this.accessOrder.push(key);
    }

    /**
     * Evict least recently used entry
     */
    private evictLeastRecentlyUsed(): void {
        if (this.accessOrder.length === 0) {
            return;
        }

        // Remove first item (least recently used)
        const keyToEvict = this.accessOrder.shift();
        if (keyToEvict) {
            this.cache.delete(keyToEvict);
        }
    }

    /**
     * Hash function for generating cache keys
     * Simple but effective hash for code strings
     */
    private hashCode(str: string): string {
        let hash = 0;
        
        if (str.length === 0) {
            return '0';
        }

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        // Convert to positive base36 string
        return Math.abs(hash).toString(36);
    }

    /**
     * Update maximum cache size
     */
    public setMaxSize(newMaxSize: number): void {
        this.maxSize = newMaxSize;

        // Evict entries if current size exceeds new max
        while (this.cache.size > this.maxSize) {
            this.evictLeastRecentlyUsed();
        }
    }
}
