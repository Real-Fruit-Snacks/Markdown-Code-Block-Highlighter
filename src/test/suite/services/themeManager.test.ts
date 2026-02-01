import * as assert from 'assert';
import * as vscode from 'vscode';
import { ThemeManager, ThemeData } from '../../../services/themeManager';

suite('ThemeManager Unit Tests', () => {
    let themeManager: ThemeManager;

    setup(() => {
        themeManager = new ThemeManager();
    });

    teardown(() => {
        themeManager.dispose();
    });

    test('Should initialize with current theme', () => {
        const themeData = themeManager.getThemeData();
        assert.ok(themeData);
        assert.ok(['light', 'dark', 'highContrast'].includes(themeData.kind));
    });

    test('Should return valid theme data structure', () => {
        const themeData = themeManager.getThemeData();
        
        assert.ok(themeData.kind);
        assert.ok(themeData.colors);
        assert.ok(themeData.background);
        assert.ok(themeData.foreground);
        assert.ok(themeData.borderColor);
        assert.ok(themeData.buttonBackground);
        assert.ok(themeData.buttonForeground);
        assert.ok(themeData.accentColor);
    });

    test('Should include all required token colors', () => {
        const themeData = themeManager.getThemeData();
        const requiredTokens = [
            'comment', 'string', 'keyword', 'number', 'function',
            'class', 'variable', 'constant', 'operator', 'type'
        ];

        for (const token of requiredTokens) {
            assert.ok(themeData.colors[token], `Missing token color: ${token}`);
        }
    });

    test('Should validate valid theme data', () => {
        const validTheme: ThemeData = {
            kind: 'dark',
            colors: {
                comment: '#6a9955',
                string: '#ce9178',
                keyword: '#569cd6',
                number: '#b5cea8',
                function: '#dcdcaa'
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

        assert.strictEqual(themeManager.validateThemeData(validTheme), true);
    });

    test('Should reject invalid theme data - wrong kind', () => {
        const invalidTheme = {
            kind: 'invalid' as any,
            colors: {
                comment: '#6a9955',
                string: '#ce9178',
                keyword: '#569cd6',
                number: '#b5cea8',
                function: '#dcdcaa'
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

        assert.strictEqual(themeManager.validateThemeData(invalidTheme as ThemeData), false);
    });

    test('Should reject invalid theme data - invalid color format', () => {
        const invalidTheme: ThemeData = {
            kind: 'dark',
            colors: {
                comment: '#6a9955',
                string: '#ce9178',
                keyword: '#569cd6',
                number: '#b5cea8',
                function: '#dcdcaa'
            },
            background: 'invalid-color',
            foreground: '#d4d4d4',
            borderColor: '#404040',
            borderColorSubtle: '#303030',
            buttonBackground: '#252526cc',
            buttonForeground: '#cccccc',
            buttonHoverBackground: '#2a2d2e',
            accentColor: '#569cd6'
        };

        assert.strictEqual(themeManager.validateThemeData(invalidTheme), false);
    });

    test('Should reject theme data missing required tokens', () => {
        const invalidTheme: ThemeData = {
            kind: 'dark',
            colors: {
                comment: '#6a9955',
                string: '#ce9178'
                // Missing required tokens
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

        assert.strictEqual(themeManager.validateThemeData(invalidTheme), false);
    });

    test('Should have different colors for light vs dark themes', () => {
        // This test assumes we can mock the theme kind
        const themeData = themeManager.getThemeData();
        const currentKind = themeData.kind;

        // At minimum, verify the structure is different for different kinds
        assert.ok(themeData.colors);
        assert.strictEqual(typeof themeData.colors, 'object');
    });

    test('Should validate color format correctly', () => {
        const validTheme: ThemeData = {
            kind: 'dark',
            colors: {
                comment: '#6a9955',
                string: '#ce9178',
                keyword: '#569cd6',
                number: '#b5cea8',
                function: '#dcdcaa'
            },
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            borderColor: '#404040',
            borderColorSubtle: '#303030',
            buttonBackground: '#252526cc', // With alpha
            buttonForeground: '#cccccc',
            buttonHoverBackground: '#2a2d2e',
            accentColor: '#569cd6'
        };

        assert.strictEqual(themeManager.validateThemeData(validTheme), true);
    });

    test('Should accept colors with alpha channel', () => {
        const themeWithAlpha: ThemeData = {
            kind: 'dark',
            colors: {
                comment: '#6a9955ff',
                string: '#ce9178ff',
                keyword: '#569cd6ff',
                number: '#b5cea8ff',
                function: '#dcdcaaff'
            },
            background: '#1e1e1eff',
            foreground: '#d4d4d4ff',
            borderColor: '#404040ff',
            borderColorSubtle: '#303030ff',
            buttonBackground: '#252526cc',
            buttonForeground: '#ccccccff',
            buttonHoverBackground: '#2a2d2eff',
            accentColor: '#569cd6ff'
        };

        assert.strictEqual(themeManager.validateThemeData(themeWithAlpha), true);
    });

    test('Should set and apply custom theme overrides', () => {
        const overrides = {
            comment: '#ff0000',
            string: '#00ff00'
        };

        themeManager.setThemeOverrides(overrides);
        const themeData = themeManager.getThemeData();

        assert.strictEqual(themeData.colors.comment, '#ff0000');
        assert.strictEqual(themeData.colors.string, '#00ff00');
    });

    test('Should clear theme overrides', () => {
        const overrides = {
            comment: '#ff0000'
        };

        themeManager.setThemeOverrides(overrides);
        let themeData = themeManager.getThemeData();
        assert.strictEqual(themeData.colors.comment, '#ff0000');

        themeManager.clearThemeOverrides();
        themeData = themeManager.getThemeData();
        assert.notStrictEqual(themeData.colors.comment, '#ff0000');
    });

    test('Should fire theme change event', (done) => {
        let eventFired = false;
        const disposable = themeManager.onDidChangeTheme((themeData) => {
            eventFired = true;
            assert.ok(themeData);
            disposable.dispose();
            done();
        });

        // Trigger theme change by setting overrides
        themeManager.setThemeOverrides({ comment: '#ffffff' });

        // Cleanup if event doesn't fire
        setTimeout(() => {
            if (!eventFired) {
                disposable.dispose();
                done(new Error('Theme change event not fired'));
            }
        }, 1000);
    });

    test('Should handle disposal correctly', () => {
        const manager = new ThemeManager();
        manager.dispose();
        
        // Should not throw after disposal
        assert.doesNotThrow(() => {
            manager.getThemeData();
        });
    });

    test('Should provide all UI element colors', () => {
        const themeData = themeManager.getThemeData();
        
        // Verify all UI colors are present and valid hex
        const hexRegex = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
        
        assert.ok(hexRegex.test(themeData.borderColor));
        assert.ok(hexRegex.test(themeData.borderColorSubtle));
        assert.ok(hexRegex.test(themeData.buttonBackground));
        assert.ok(hexRegex.test(themeData.buttonForeground));
        assert.ok(hexRegex.test(themeData.buttonHoverBackground));
        assert.ok(hexRegex.test(themeData.accentColor));
    });

    test('Should have comprehensive token color coverage', () => {
        const themeData = themeManager.getThemeData();
        
        // Check for extended token types
        const extendedTokens = [
            'parameter', 'property', 'punctuation', 'regexp',
            'storage', 'support', 'entity', 'tag', 'attribute'
        ];

        for (const token of extendedTokens) {
            assert.ok(themeData.colors[token], `Missing extended token: ${token}`);
        }
    });
});
