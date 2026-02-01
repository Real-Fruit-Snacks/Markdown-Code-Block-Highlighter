import * as assert from 'assert';
import * as vscode from 'vscode';
import { TokenizationService } from '../../../services/tokenizationService';
import { ThemeData } from '../../../services/themeManager';

suite('TokenizationService Unit Tests', () => {
    let tokenizationService: TokenizationService;
    let mockThemeData: ThemeData;

    setup(() => {
        tokenizationService = new TokenizationService();
        mockThemeData = {
            kind: 'dark',
            colors: {
                comment: '#6a9955',
                string: '#ce9178',
                keyword: '#569cd6',
                number: '#b5cea8',
                function: '#dcdcaa',
                class: '#4ec9b0',
                variable: '#9cdcfe',
                constant: '#4fc1ff',
                operator: '#d4d4d4',
                type: '#4ec9b0',
                parameter: '#9cdcfe',
                property: '#9cdcfe',
                punctuation: '#d4d4d4',
                regexp: '#d16969'
            },
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            borderColor: '#404040',
            borderColorSubtle: '#303030',
            buttonBackground: '#252526cc',
            buttonForeground: '#cccccc',
            buttonHoverBackground: '#2a2d2e',
            accentColor: '#569cd6'
        };
    });

    teardown(() => {
        tokenizationService.dispose();
    });

    test('Should tokenize JavaScript code', async function() {
        this.timeout(10000);

        const code = 'const x = 1;';
        const result = await tokenizationService.tokenize(code, 'javascript', mockThemeData);

        assert.ok(result);
        assert.strictEqual(result.language, 'javascript');
        assert.ok(result.tokens);
        assert.ok(result.tokens.length > 0);
    });

    test('Should tokenize Python code', async function() {
        this.timeout(10000);

        const code = 'def hello():\n    print("Hello")';
        const result = await tokenizationService.tokenize(code, 'python', mockThemeData);

        assert.ok(result);
        assert.strictEqual(result.language, 'python');
        assert.ok(result.tokens);
        assert.ok(result.tokens.length > 0);
    });

    test('Should tokenize TypeScript code', async function() {
        this.timeout(10000);

        const code = 'interface Person { name: string; }';
        const result = await tokenizationService.tokenize(code, 'typescript', mockThemeData);

        assert.ok(result);
        assert.strictEqual(result.language, 'typescript');
        assert.ok(result.tokens);
        assert.ok(result.tokens.length > 0);
    });

    test('Should handle unknown language with fallback', async function() {
        this.timeout(10000);

        const code = 'some random code';
        const result = await tokenizationService.tokenize(code, 'unknown-language', mockThemeData);

        assert.ok(result);
        assert.ok(result.tokens);
        assert.ok(result.tokens.length > 0);
        // Should still return tokenized result with plaintext
        assert.strictEqual(result.language, 'plaintext');
    });

    test('Should handle empty code', async function() {
        this.timeout(10000);

        const code = '';
        const result = await tokenizationService.tokenize(code, 'javascript', mockThemeData);

        assert.ok(result);
        assert.ok(result.tokens);
    });

    test('Should detect large blocks correctly', () => {
        const smallCode = 'const x = 1;';
        const largeCode = 'x'.repeat(15000);

        assert.strictEqual(tokenizationService.isLargeBlock(smallCode, 10000), false);
        assert.strictEqual(tokenizationService.isLargeBlock(largeCode, 10000), true);
    });

    test('Should use streaming for large blocks', async function() {
        this.timeout(20000);

        const largeCode = 'const x = 1;\n'.repeat(1000);
        const result = await tokenizationService.tokenize(largeCode, 'javascript', mockThemeData, 1000);

        assert.ok(result);
        assert.ok(result.tokens);
        // Should still produce valid tokens
        assert.ok(result.tokens.length > 0);
    });

    test('Should handle language aliases', async function() {
        this.timeout(10000);

        const code = 'const x = 1;';
        
        // Test js → javascript alias
        const result1 = await tokenizationService.tokenize(code, 'js', mockThemeData);
        assert.strictEqual(result1.language, 'javascript');

        // Test py → python alias
        const result2 = await tokenizationService.tokenize('print("hi")', 'py', mockThemeData);
        assert.strictEqual(result2.language, 'python');

        // Test ts → typescript alias
        const result3 = await tokenizationService.tokenize(code, 'ts', mockThemeData);
        assert.strictEqual(result3.language, 'typescript');
    });

    test('Should create minimal highlighting with correct structure', () => {
        const code = 'function test() { return 42; }';
        const result = tokenizationService.createMinimalHighlighting(code, 'javascript', mockThemeData);

        assert.ok(result);
        assert.strictEqual(result.language, 'javascript');
        assert.ok(result.tokens);
        assert.ok(result.tokens.length > 0);

        // Verify token structure
        const firstToken = result.tokens[0];
        assert.ok(firstToken.text);
        assert.ok(firstToken.scopes);
        assert.ok(Array.isArray(firstToken.scopes));
        assert.ok(typeof firstToken.startIndex === 'number');
        assert.ok(typeof firstToken.endIndex === 'number');
        assert.ok(firstToken.color);
    });

    test('Should highlight keywords in minimal highlighting', () => {
        const code = 'function test() { return 42; }';
        const result = tokenizationService.createMinimalHighlighting(code, 'javascript', mockThemeData);

        // Find keyword tokens
        const keywordTokens = result.tokens.filter(t => t.scopes.includes('keyword'));
        assert.ok(keywordTokens.length > 0, 'Should have keyword tokens');

        // Verify keyword colors match theme
        const keywordColor = mockThemeData.colors.keyword;
        for (const token of keywordTokens) {
            assert.strictEqual(token.color, keywordColor);
        }
    });

    test('Should highlight strings in minimal highlighting', () => {
        const code = 'const message = "Hello, World!";';
        const result = tokenizationService.createMinimalHighlighting(code, 'javascript', mockThemeData);

        // Find string tokens
        const stringTokens = result.tokens.filter(t => t.scopes.includes('string'));
        assert.ok(stringTokens.length > 0, 'Should have string tokens');

        // Verify string colors match theme
        const stringColor = mockThemeData.colors.string;
        for (const token of stringTokens) {
            assert.strictEqual(token.color, stringColor);
        }
    });

    test('Should highlight numbers in minimal highlighting', () => {
        const code = 'const x = 42;';
        const result = tokenizationService.createMinimalHighlighting(code, 'javascript', mockThemeData);

        // Find number tokens
        const numberTokens = result.tokens.filter(t => t.scopes.includes('number'));
        assert.ok(numberTokens.length > 0, 'Should have number tokens');

        // Verify number colors match theme
        const numberColor = mockThemeData.colors.number;
        for (const token of numberTokens) {
            assert.strictEqual(token.color, numberColor);
        }
    });

    test('Should highlight comments in minimal highlighting', () => {
        const code = '// This is a comment\nconst x = 1;';
        const result = tokenizationService.createMinimalHighlighting(code, 'javascript', mockThemeData);

        // Find comment tokens
        const commentTokens = result.tokens.filter(t => t.scopes.includes('comment'));
        assert.ok(commentTokens.length > 0, 'Should have comment tokens');

        // Verify comment colors match theme
        const commentColor = mockThemeData.colors.comment;
        for (const token of commentTokens) {
            assert.strictEqual(token.color, commentColor);
        }
    });

    test('Should handle multiline code correctly', async function() {
        this.timeout(10000);

        const code = 'function test() {\n  return 42;\n}';
        const result = await tokenizationService.tokenize(code, 'javascript', mockThemeData);

        assert.ok(result);
        assert.ok(result.tokens);

        // Verify tokens span the entire code
        const allText = result.tokens.map(t => t.text).join('');
        assert.strictEqual(allText, code);
    });

    test('Should handle code with special characters', async function() {
        this.timeout(10000);

        const code = 'const emoji = "🎉"; const unicode = "→";';
        const result = await tokenizationService.tokenize(code, 'javascript', mockThemeData);

        assert.ok(result);
        assert.ok(result.tokens);

        // Verify all characters are preserved
        const allText = result.tokens.map(t => t.text).join('');
        assert.strictEqual(allText, code);
    });

    test('Should respect tokenization timeout', async function() {
        this.timeout(5000);

        const code = 'const x = 1;';
        // Use very short timeout to ensure it's respected
        const result = await tokenizationService.tokenize(code, 'javascript', mockThemeData, 10000, 1);

        // Should still return a result (fallback)
        assert.ok(result);
        assert.ok(result.tokens);
    });

    test('Should handle code with only whitespace', async function() {
        this.timeout(10000);

        const code = '   \n   \n   ';
        const result = await tokenizationService.tokenize(code, 'javascript', mockThemeData);

        assert.ok(result);
        assert.ok(result.tokens);
    });

    test('Should assign correct colors to token types', () => {
        const testCases = [
            { code: 'function', expectedType: 'keyword' },
            { code: '"string"', expectedType: 'string' },
            { code: '42', expectedType: 'number' },
            { code: '// comment', expectedType: 'comment' }
        ];

        for (const testCase of testCases) {
            const result = tokenizationService.createMinimalHighlighting(
                testCase.code,
                'javascript',
                mockThemeData
            );

            const matchingTokens = result.tokens.filter(t => t.scopes.includes(testCase.expectedType));
            assert.ok(matchingTokens.length > 0, `Should find ${testCase.expectedType} tokens`);

            const expectedColor = mockThemeData.colors[testCase.expectedType];
            for (const token of matchingTokens) {
                assert.strictEqual(token.color, expectedColor, `Color mismatch for ${testCase.expectedType}`);
            }
        }
    });

    test('Should maintain token position consistency', () => {
        const code = 'const x = 1;';
        const result = tokenizationService.createMinimalHighlighting(code, 'javascript', mockThemeData);

        // Verify tokens are in order and don't overlap incorrectly
        for (let i = 0; i < result.tokens.length - 1; i++) {
            const current = result.tokens[i];
            const next = result.tokens[i + 1];

            assert.ok(current.endIndex <= next.startIndex, 'Tokens should not overlap incorrectly');
            assert.strictEqual(current.endIndex - current.startIndex, current.text.length);
        }
    });

    test('Should handle different theme kinds', async function() {
        this.timeout(10000);

        const lightTheme: ThemeData = {
            ...mockThemeData,
            kind: 'light',
            colors: {
                ...mockThemeData.colors,
                keyword: '#0000ff'
            }
        };

        const code = 'function test() {}';
        const result = await tokenizationService.tokenize(code, 'javascript', lightTheme);

        assert.ok(result);
        assert.ok(result.tokens);
    });
});
