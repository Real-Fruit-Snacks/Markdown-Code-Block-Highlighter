import * as assert from 'assert';
import { CacheManager } from '../../../services/cacheManager';
import { TokenizedCode } from '../../../services/tokenizationService';

suite('CacheManager Unit Tests', () => {
    let cacheManager: CacheManager;

    setup(() => {
        cacheManager = new CacheManager(5); // Small cache for testing
    });

    teardown(() => {
        cacheManager.clear();
    });

    test('Should create cache with specified size', () => {
        const stats = cacheManager.getStats();
        assert.strictEqual(stats.maxSize, 5);
        assert.strictEqual(stats.size, 0);
    });

    test('Should set and get cached items', () => {
        const key = 'test-key';
        const tokenizedCode: TokenizedCode = {
            language: 'javascript',
            tokens: [{ text: 'test', scopes: ['keyword'], startIndex: 0, endIndex: 4, color: '#fff' }]
        };

        cacheManager.set(key, tokenizedCode);
        const retrieved = cacheManager.get(key);

        assert.ok(retrieved);
        assert.strictEqual(retrieved.language, tokenizedCode.language);
        assert.strictEqual(retrieved.tokens.length, tokenizedCode.tokens.length);
    });

    test('Should return null for non-existent key', () => {
        const retrieved = cacheManager.get('non-existent');
        assert.strictEqual(retrieved, null);
    });

    test('Should evict least recently used item when cache is full', () => {
        // Fill cache
        for (let i = 0; i < 5; i++) {
            const tokenizedCode: TokenizedCode = {
                language: 'javascript',
                tokens: [{ text: `code${i}`, scopes: ['text'], startIndex: 0, endIndex: 5, color: '#fff' }]
            };
            cacheManager.set(`key${i}`, tokenizedCode);
        }

        assert.strictEqual(cacheManager.size(), 5);

        // Add one more item, should evict key0 (least recently used)
        const newCode: TokenizedCode = {
            language: 'javascript',
            tokens: [{ text: 'new', scopes: ['text'], startIndex: 0, endIndex: 3, color: '#fff' }]
        };
        cacheManager.set('key5', newCode);

        assert.strictEqual(cacheManager.size(), 5);
        assert.strictEqual(cacheManager.get('key0'), null); // Should be evicted
        assert.ok(cacheManager.get('key5')); // Should exist
    });

    test('Should update access order on get', () => {
        // Fill cache
        for (let i = 0; i < 5; i++) {
            const tokenizedCode: TokenizedCode = {
                language: 'javascript',
                tokens: [{ text: `code${i}`, scopes: ['text'], startIndex: 0, endIndex: 5, color: '#fff' }]
            };
            cacheManager.set(`key${i}`, tokenizedCode);
        }

        // Access key0, making it most recently used
        cacheManager.get('key0');

        // Add new item, should evict key1 instead of key0
        const newCode: TokenizedCode = {
            language: 'javascript',
            tokens: [{ text: 'new', scopes: ['text'], startIndex: 0, endIndex: 3, color: '#fff' }]
        };
        cacheManager.set('key5', newCode);

        assert.ok(cacheManager.get('key0')); // Should still exist
        assert.strictEqual(cacheManager.get('key1'), null); // Should be evicted
    });

    test('Should clear all cached items', () => {
        for (let i = 0; i < 3; i++) {
            const tokenizedCode: TokenizedCode = {
                language: 'javascript',
                tokens: [{ text: `code${i}`, scopes: ['text'], startIndex: 0, endIndex: 5, color: '#fff' }]
            };
            cacheManager.set(`key${i}`, tokenizedCode);
        }

        assert.strictEqual(cacheManager.size(), 3);
        cacheManager.clear();
        assert.strictEqual(cacheManager.size(), 0);
    });

    test('Should check if key exists', () => {
        const tokenizedCode: TokenizedCode = {
            language: 'javascript',
            tokens: [{ text: 'test', scopes: ['text'], startIndex: 0, endIndex: 4, color: '#fff' }]
        };
        
        cacheManager.set('key1', tokenizedCode);
        
        assert.strictEqual(cacheManager.has('key1'), true);
        assert.strictEqual(cacheManager.has('key2'), false);
    });

    test('Should delete specific entry', () => {
        const tokenizedCode: TokenizedCode = {
            language: 'javascript',
            tokens: [{ text: 'test', scopes: ['text'], startIndex: 0, endIndex: 4, color: '#fff' }]
        };
        
        cacheManager.set('key1', tokenizedCode);
        assert.strictEqual(cacheManager.has('key1'), true);
        
        const deleted = cacheManager.delete('key1');
        assert.strictEqual(deleted, true);
        assert.strictEqual(cacheManager.has('key1'), false);
    });

    test('Should generate consistent cache keys', () => {
        const code = 'const x = 1;';
        const language = 'javascript';
        const themeKind = 'dark';

        const key1 = cacheManager.generateKey(code, language, themeKind);
        const key2 = cacheManager.generateKey(code, language, themeKind);

        assert.strictEqual(key1, key2);
    });

    test('Should generate different keys for different inputs', () => {
        const code1 = 'const x = 1;';
        const code2 = 'const y = 2;';
        const language = 'javascript';
        const themeKind = 'dark';

        const key1 = cacheManager.generateKey(code1, language, themeKind);
        const key2 = cacheManager.generateKey(code2, language, themeKind);

        assert.notStrictEqual(key1, key2);
    });

    test('Should update max size and evict excess entries', () => {
        // Fill cache with 5 items
        for (let i = 0; i < 5; i++) {
            const tokenizedCode: TokenizedCode = {
                language: 'javascript',
                tokens: [{ text: `code${i}`, scopes: ['text'], startIndex: 0, endIndex: 5, color: '#fff' }]
            };
            cacheManager.set(`key${i}`, tokenizedCode);
        }

        assert.strictEqual(cacheManager.size(), 5);

        // Reduce max size to 3
        cacheManager.setMaxSize(3);

        assert.strictEqual(cacheManager.size(), 3);
        assert.strictEqual(cacheManager.getStats().maxSize, 3);
    });

    test('Should handle updating existing entries', () => {
        const key = 'test-key';
        const tokenizedCode1: TokenizedCode = {
            language: 'javascript',
            tokens: [{ text: 'original', scopes: ['text'], startIndex: 0, endIndex: 8, color: '#fff' }]
        };
        const tokenizedCode2: TokenizedCode = {
            language: 'javascript',
            tokens: [
                { text: 'updated', scopes: ['text'], startIndex: 0, endIndex: 7, color: '#fff' },
                { text: 'text', scopes: ['text'], startIndex: 8, endIndex: 12, color: '#fff' }
            ]
        };

        cacheManager.set(key, tokenizedCode1);
        assert.strictEqual(cacheManager.size(), 1);

        cacheManager.set(key, tokenizedCode2);
        assert.strictEqual(cacheManager.size(), 1); // Size shouldn't change

        const retrieved = cacheManager.get(key);
        assert.ok(retrieved);
        assert.strictEqual(retrieved.tokens.length, 2);
    });

    test('Should handle cache with size 0', () => {
        const zeroCache = new CacheManager(0);
        const tokenizedCode: TokenizedCode = {
            language: 'javascript',
            tokens: [{ text: 'test', scopes: ['text'], startIndex: 0, endIndex: 4, color: '#fff' }]
        };

        zeroCache.set('key1', tokenizedCode);
        assert.strictEqual(zeroCache.size(), 0);
        assert.strictEqual(zeroCache.get('key1'), null);
    });

    test('Should return correct statistics', () => {
        for (let i = 0; i < 3; i++) {
            const tokenizedCode: TokenizedCode = {
                language: 'javascript',
                tokens: [{ text: `code${i}`, scopes: ['text'], startIndex: 0, endIndex: 5, color: '#fff' }]
            };
            cacheManager.set(`key${i}`, tokenizedCode);
        }

        const stats = cacheManager.getStats();
        assert.strictEqual(stats.size, 3);
        assert.strictEqual(stats.maxSize, 5);
        assert.strictEqual(typeof stats.hitRate, 'number');
    });
});
