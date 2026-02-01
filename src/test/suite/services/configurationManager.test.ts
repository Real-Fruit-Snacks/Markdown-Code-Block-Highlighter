import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigurationManager } from '../../../services/configurationManager';

suite('ConfigurationManager Unit Tests', () => {
    let configManager: ConfigurationManager;

    setup(() => {
        configManager = new ConfigurationManager();
    });

    teardown(() => {
        configManager.dispose();
    });

    test('Should load initial configuration', () => {
        const config = configManager.getConfiguration();
        
        assert.ok(config);
        assert.strictEqual(typeof config.enableHighlighting, 'boolean');
        assert.strictEqual(typeof config.fontSize, 'number');
        assert.strictEqual(typeof config.lineHeight, 'number');
        assert.strictEqual(typeof config.enableCache, 'boolean');
        assert.strictEqual(typeof config.cacheSize, 'number');
    });

    test('Should return configuration with all required fields', () => {
        const config = configManager.getConfiguration();
        
        // Verify all ExtensionConfig fields are present
        assert.ok('enableHighlighting' in config);
        assert.ok('fontSize' in config);
        assert.ok('lineHeight' in config);
        assert.ok('enableCache' in config);
        assert.ok('cacheSize' in config);
        assert.ok('maxBlockSize' in config);
        assert.ok('enablePerfMonitoring' in config);
        assert.ok('lazyLoadThreshold' in config);
        assert.ok('tokenizationTimeout' in config);
        assert.ok('batchDelay' in config);
        assert.ok('concurrentRequests' in config);
        assert.ok('showBorder' in config);
        assert.ok('borderWidth' in config);
        assert.ok('borderRadius' in config);
        assert.ok('showCopyButton' in config);
        assert.ok('copyButtonPosition' in config);
        assert.ok('copyButtonVisibility' in config);
    });

    test('Should check if highlighting is enabled', () => {
        const isEnabled = configManager.isHighlightingEnabled();
        assert.strictEqual(typeof isEnabled, 'boolean');
    });

    test('Should get font size', () => {
        const fontSize = configManager.getFontSize();
        assert.strictEqual(typeof fontSize, 'number');
        assert.ok(fontSize >= 0);
    });

    test('Should get line height', () => {
        const lineHeight = configManager.getLineHeight();
        assert.strictEqual(typeof lineHeight, 'number');
        assert.ok(lineHeight >= 1.0);
        assert.ok(lineHeight <= 3.0);
    });

    test('Should check if cache is enabled', () => {
        const isCacheEnabled = configManager.isCacheEnabled();
        assert.strictEqual(typeof isCacheEnabled, 'boolean');
    });

    test('Should get cache size', () => {
        const cacheSize = configManager.getCacheSize();
        assert.strictEqual(typeof cacheSize, 'number');
        assert.ok(cacheSize >= 10);
        assert.ok(cacheSize <= 1000);
    });

    test('Should get max block size', () => {
        const maxBlockSize = configManager.getMaxBlockSize();
        assert.strictEqual(typeof maxBlockSize, 'number');
        assert.ok(maxBlockSize >= 1000);
        assert.ok(maxBlockSize <= 100000);
    });

    test('Should check if performance monitoring is enabled', () => {
        const isPerfMonitoring = configManager.isPerfMonitoringEnabled();
        assert.strictEqual(typeof isPerfMonitoring, 'boolean');
    });

    test('Should get lazy load threshold with validation', () => {
        const threshold = configManager.getLazyLoadThreshold();
        assert.strictEqual(typeof threshold, 'number');
        assert.ok(threshold >= 1);
        assert.ok(threshold <= 10);
    });

    test('Should get tokenization timeout with validation', () => {
        const timeout = configManager.getTokenizationTimeout();
        assert.strictEqual(typeof timeout, 'number');
        assert.ok(timeout >= 1000);
        assert.ok(timeout <= 30000);
    });

    test('Should get batch delay with validation', () => {
        const delay = configManager.getBatchDelay();
        assert.strictEqual(typeof delay, 'number');
        assert.ok(delay >= 10);
        assert.ok(delay <= 500);
    });

    test('Should get concurrent requests with validation', () => {
        const concurrent = configManager.getConcurrentRequests();
        assert.strictEqual(typeof concurrent, 'number');
        assert.ok(concurrent >= 1);
        assert.ok(concurrent <= 20);
    });

    test('Should get show border setting', () => {
        const showBorder = configManager.getShowBorder();
        assert.strictEqual(typeof showBorder, 'boolean');
    });

    test('Should get border width with validation', () => {
        const borderWidth = configManager.getBorderWidth();
        assert.strictEqual(typeof borderWidth, 'number');
        assert.ok(borderWidth >= 1);
        assert.ok(borderWidth <= 4);
    });

    test('Should get border radius with validation', () => {
        const borderRadius = configManager.getBorderRadius();
        assert.strictEqual(typeof borderRadius, 'number');
        assert.ok(borderRadius >= 0);
        assert.ok(borderRadius <= 12);
    });

    test('Should get show copy button setting', () => {
        const showCopyButton = configManager.getShowCopyButton();
        assert.strictEqual(typeof showCopyButton, 'boolean');
    });

    test('Should get copy button position', () => {
        const position = configManager.getCopyButtonPosition();
        assert.ok(['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(position));
    });

    test('Should get copy button visibility', () => {
        const visibility = configManager.getCopyButtonVisibility();
        assert.ok(['hover', 'always'].includes(visibility));
    });

    test('Should get specific configuration value', () => {
        const enableCache = configManager.get<boolean>('enableCache');
        assert.strictEqual(typeof enableCache, 'boolean');

        const cacheSize = configManager.get<number>('cacheSize');
        assert.strictEqual(typeof cacheSize, 'number');
    });

    test('Should return copy of configuration', () => {
        const config1 = configManager.getConfiguration();
        const config2 = configManager.getConfiguration();

        // Should be different objects (not same reference)
        assert.notStrictEqual(config1, config2);

        // But should have same values
        assert.strictEqual(config1.enableHighlighting, config2.enableHighlighting);
        assert.strictEqual(config1.cacheSize, config2.cacheSize);
    });

    test('Should handle configuration change events', (done) => {
        let eventFired = false;
        const disposable = configManager.onDidChangeConfiguration((config) => {
            eventFired = true;
            assert.ok(config);
            disposable.dispose();
            done();
        });

        // Trigger configuration change
        const config = vscode.workspace.getConfiguration('markdownCodeBlockHighlighter');
        config.update('enableHighlighting', false, vscode.ConfigurationTarget.Global)
            .then(() => {
                // Restore original value
                return config.update('enableHighlighting', true, vscode.ConfigurationTarget.Global);
            }, done);

        // Cleanup if event doesn't fire
        setTimeout(() => {
            if (!eventFired) {
                disposable.dispose();
                done(new Error('Configuration change event not fired'));
            }
        }, 2000);
    });

    test('Should use default values when configuration is invalid', () => {
        // The validation methods should return defaults for invalid values
        const config = configManager.getConfiguration();

        // Line height should be within valid range
        assert.ok(config.lineHeight >= 1.0);
        assert.ok(config.lineHeight <= 3.0);

        // Cache size should be within valid range
        assert.ok(config.cacheSize >= 10);
        assert.ok(config.cacheSize <= 1000);

        // Lazy load threshold should be within valid range
        assert.ok(configManager.getLazyLoadThreshold() >= 1);
        assert.ok(configManager.getLazyLoadThreshold() <= 10);
    });

    test('Should dispose correctly', () => {
        const manager = new ConfigurationManager();
        manager.dispose();
        
        // Should not throw after disposal
        assert.doesNotThrow(() => {
            manager.getConfiguration();
        });
    });

    test('Should have correct default configuration', () => {
        const config = configManager.getConfiguration();

        // Check expected defaults (from package.json)
        assert.strictEqual(config.enableHighlighting, true);
        assert.strictEqual(config.fontSize, 0);
        assert.strictEqual(config.lineHeight, 1.5);
        assert.strictEqual(config.enableCache, true);
        assert.strictEqual(config.cacheSize, 100);
        assert.strictEqual(config.maxBlockSize, 10000);
        assert.strictEqual(config.enablePerfMonitoring, false);
        assert.strictEqual(config.lazyLoadThreshold, 3);
        assert.strictEqual(config.tokenizationTimeout, 5000);
        assert.strictEqual(config.batchDelay, 50);
        assert.strictEqual(config.concurrentRequests, 5);
        assert.strictEqual(config.showBorder, true);
        assert.strictEqual(config.borderWidth, 1);
        assert.strictEqual(config.borderRadius, 4);
        assert.strictEqual(config.showCopyButton, true);
        assert.strictEqual(config.copyButtonPosition, 'top-right');
        assert.strictEqual(config.copyButtonVisibility, 'hover');
    });

    test('Should validate number ranges correctly', () => {
        // These getters have built-in validation
        const lazyLoad = configManager.getLazyLoadThreshold();
        const timeout = configManager.getTokenizationTimeout();
        const batchDelay = configManager.getBatchDelay();
        const concurrent = configManager.getConcurrentRequests();
        const borderWidth = configManager.getBorderWidth();
        const borderRadius = configManager.getBorderRadius();

        // All should be within their valid ranges
        assert.ok(lazyLoad >= 1 && lazyLoad <= 10);
        assert.ok(timeout >= 1000 && timeout <= 30000);
        assert.ok(batchDelay >= 10 && batchDelay <= 500);
        assert.ok(concurrent >= 1 && concurrent <= 20);
        assert.ok(borderWidth >= 1 && borderWidth <= 4);
        assert.ok(borderRadius >= 0 && borderRadius <= 12);
    });
});
