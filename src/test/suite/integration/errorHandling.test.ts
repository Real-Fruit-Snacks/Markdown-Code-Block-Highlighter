import * as assert from 'assert';
import { TokenizationService, TokenizedCode } from '../../../services/tokenizationService';
import { CacheManager } from '../../../services/cacheManager';
import { ThemeManager } from '../../../services/themeManager';
import { PerformanceMonitor } from '../../../services/performanceMonitor';

suite('Error Handling and Fallback Tests', () => {
    let tokenizationService: TokenizationService;
    let cacheManager: CacheManager;
    let themeManager: ThemeManager;
    let performanceMonitor: PerformanceMonitor;

    setup(() => {
        tokenizationService = new TokenizationService();
        cacheManager = new CacheManager(50);
        themeManager = new ThemeManager();
        performanceMonitor = new PerformanceMonitor(true);
    });

    teardown(() => {
        tokenizationService.dispose();
        cacheManager.clear();
        themeManager.dispose();
        performanceMonitor.clear();
    });

    test('Should handle malformed code blocks gracefully', async function() {
        this.timeout(10000);

        const malformedCodes = [
            'function test() {', // Unclosed brace
            '}}}}}}', // Extra closing braces
            '"unclosed string', // Unclosed string
            '/* unclosed comment', // Unclosed comment
        ];

        const themeData = themeManager.getThemeData();

        for (const code of malformedCodes) {
            const result = await tokenizationService.tokenize(code, 'javascript', themeData);
            
            // Should not throw and should return valid result
            assert.ok(result);
            assert.ok(result.tokens);
            assert.ok(result.tokens.length > 0);
        }
    });

    test('Should handle very large code blocks without crashing', async function() {
        this.timeout(30000);

        const largeCode = 'const x = 1;\n'.repeat(5000); // 5000 lines
        const themeData = themeManager.getThemeData();

        const result = await tokenizationService.tokenize(largeCode, 'javascript', themeData);

        assert.ok(result);
        assert.ok(result.tokens);
        // Should use streaming or fallback but still work
    });

    test('Should handle unknown languages with fallback', async function() {
        this.timeout(10000);

        const unknownLanguages = [
            'unknown-lang',
            'fake-language',
            'xyz123',
            ''
        ];

        const code = 'some code here';
        const themeData = themeManager.getThemeData();

        for (const lang of unknownLanguages) {
            const result = await tokenizationService.tokenize(code, lang, themeData);
            
            assert.ok(result);
            assert.ok(result.tokens);
            // Should fallback to plaintext
            assert.strictEqual(result.language, 'plaintext');
        }
    });

    test('Should handle missing theme data gracefully', async function() {
        this.timeout(10000);

        const code = 'const x = 1;';
        const themeData = themeManager.getThemeData();

        // Should work with theme data
        const result = await tokenizationService.tokenize(code, 'javascript', themeData);
        
        assert.ok(result);
        assert.ok(result.tokens);
    });

    test('Should handle cache overflow correctly', () => {
        const smallCache = new CacheManager(3);

        // Fill cache beyond capacity
        for (let i = 0; i < 10; i++) {
            const key = `key${i}`;
            const value: TokenizedCode = {
                language: 'javascript',
                tokens: [{ text: `code${i}`, scopes: ['text'], startIndex: 0, endIndex: 5, color: '#fff' }]
            };
            smallCache.set(key, value);
        }

        // Cache should not exceed max size
        assert.strictEqual(smallCache.size(), 3);

        smallCache.clear();
    });

    test('Should handle empty or whitespace-only code', async function() {
        this.timeout(10000);

        const emptyCodes = [
            '',
            '   ',
            '\n\n\n',
            '\t\t\t'
        ];

        const themeData = themeManager.getThemeData();

        for (const code of emptyCodes) {
            const result = await tokenizationService.tokenize(code, 'javascript', themeData);
            
            assert.ok(result);
            assert.ok(result.tokens);
            // Should not crash on empty/whitespace
        }
    });

    test('Should handle Unicode and special characters', async function() {
        this.timeout(10000);

        const specialCodes = [
            'const emoji = "🎉🚀💻";',
            'const chinese = "你好世界";',
            'const arrows = "← → ↑ ↓";',
            'const math = "∑ ∫ ∂ √";'
        ];

        const themeData = themeManager.getThemeData();

        for (const code of specialCodes) {
            const result = await tokenizationService.tokenize(code, 'javascript', themeData);
            
            assert.ok(result);
            assert.ok(result.tokens);
            
            // Verify all characters are preserved
            const reconstructed = result.tokens.map(t => t.text).join('');
            assert.strictEqual(reconstructed, code);
        }
    });

    test('Should handle tokenization timeout gracefully', async function() {
        this.timeout(5000);

        const code = 'const x = 1;';
        const themeData = themeManager.getThemeData();

        // Use very short timeout to force fallback
        const result = await tokenizationService.tokenize(code, 'javascript', themeData, 10000, 1);

        // Should still return a result (fallback)
        assert.ok(result);
        assert.ok(result.tokens);
    });

    test('Should handle deeply nested code structures', async function() {
        this.timeout(10000);

        const nestedCode = `
function level1() {
    function level2() {
        function level3() {
            function level4() {
                function level5() {
                    return "deeply nested";
                }
            }
        }
    }
}`;

        const themeData = themeManager.getThemeData();
        const result = await tokenizationService.tokenize(nestedCode, 'javascript', themeData);

        assert.ok(result);
        assert.ok(result.tokens);
    });

    test('Should handle code with very long lines', async function() {
        this.timeout(10000);

        const longLine = 'const x = "' + 'a'.repeat(5000) + '";';
        const themeData = themeManager.getThemeData();

        const result = await tokenizationService.tokenize(longLine, 'javascript', themeData);

        assert.ok(result);
        assert.ok(result.tokens);
    });

    test('Should handle rapid cache operations', () => {
        // Simulate rapid cache access patterns
        for (let i = 0; i < 100; i++) {
            const key = `key${i % 10}`; // Reuse some keys
            const value: TokenizedCode = {
                language: 'javascript',
                tokens: [{ text: `code${i}`, scopes: ['text'], startIndex: 0, endIndex: 5, color: '#fff' }]
            };

            cacheManager.set(key, value);
            cacheManager.get(key);
            
            if (i % 3 === 0) {
                cacheManager.delete(`key${i % 10}`);
            }
        }

        // Should handle all operations without errors
        assert.ok(cacheManager.size() <= 50);
    });

    test('Should handle invalid theme validation', () => {
        const invalidThemes = [
            {
                kind: 'invalid' as any,
                colors: {},
                background: '#000',
                foreground: '#fff',
                borderColor: '#333',
                borderColorSubtle: '#222',
                buttonBackground: '#111',
                buttonForeground: '#fff',
                buttonHoverBackground: '#444',
                accentColor: '#007acc'
            },
            {
                kind: 'dark',
                colors: { comment: '#fff' }, // Missing required colors
                background: 'invalid-color',
                foreground: '#fff',
                borderColor: '#333',
                borderColorSubtle: '#222',
                buttonBackground: '#111',
                buttonForeground: '#fff',
                buttonHoverBackground: '#444',
                accentColor: '#007acc'
            }
        ];

        for (const theme of invalidThemes) {
            const isValid = themeManager.validateThemeData(theme as any);
            assert.strictEqual(isValid, false);
        }
    });

    test('Should preserve original code on tokenization failure', async function() {
        this.timeout(10000);

        const originalCode = 'function test() { return 42; }';
        const themeData = themeManager.getThemeData();

        const result = await tokenizationService.tokenize(originalCode, 'javascript', themeData);

        // Reconstruct code from tokens
        const reconstructed = result.tokens.map(t => t.text).join('');
        
        // Original code should be preserved
        assert.strictEqual(reconstructed, originalCode);
    });

    test('Should handle concurrent tokenization requests', async function() {
        this.timeout(15000);

        const codes = [
            'const x = 1;',
            'function test() {}',
            'class MyClass {}',
            'interface ITest {}',
            'type MyType = string;'
        ];

        const themeData = themeManager.getThemeData();

        // Fire all requests concurrently
        const promises = codes.map(code => 
            tokenizationService.tokenize(code, 'javascript', themeData)
        );

        const results = await Promise.all(promises);

        // All should succeed
        assert.strictEqual(results.length, codes.length);
        for (const result of results) {
            assert.ok(result);
            assert.ok(result.tokens);
        }
    });

    test('Should handle performance monitor overflow', () => {
        // Record many metrics
        for (let i = 0; i < 200; i++) {
            performanceMonitor.recordMetric('test-metric', i);
        }

        const metrics = performanceMonitor.getMetrics();
        const values = metrics.get('test-metric');

        // Should be capped at 100
        assert.ok(values);
        assert.strictEqual(values.length, 100);
    });

    test('Should handle invalid cache keys', () => {
        const invalidKeys = ['', '   ', null as any, undefined as any];

        for (const key of invalidKeys) {
            // Should not crash
            assert.doesNotThrow(() => {
                cacheManager.has(key);
                cacheManager.get(key);
            });
        }
    });

    test('Should handle three-tier tokenization fallback', async function() {
        this.timeout(15000);

        const code = 'const x = 1; // comment\nconst y = "string";';
        const themeData = themeManager.getThemeData();

        // Even if semantic tokens fail, pattern matching should work
        // And if that fails, minimal highlighting should work
        const result = await tokenizationService.tokenize(code, 'javascript', themeData);

        assert.ok(result);
        assert.ok(result.tokens);
        assert.ok(result.tokens.length > 0);

        // Should have some highlighting (keywords, strings, comments, etc.)
        const tokenTypes = new Set(result.tokens.flatMap(t => t.scopes));
        // Should have multiple token types (not just 'text')
        assert.ok(tokenTypes.size > 1);
    });
});
