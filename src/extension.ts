import * as vscode from 'vscode';
import { ThemeManager } from './services/themeManager';
import { TokenizationService } from './services/tokenizationService';
import { CacheManager } from './services/cacheManager';
import { ConfigurationManager } from './services/configurationManager';
import { PerformanceMonitor } from './services/performanceMonitor';
import { ErrorHandler } from './utils/errorHandler';
import { PreviewEnhancer } from './previewEnhancer';

/**
 * Global services that need to be disposed on deactivation
 */
let themeManager: ThemeManager | undefined;
let tokenizationService: TokenizationService | undefined;
let cacheManager: CacheManager | undefined;
let configManager: ConfigurationManager | undefined;
let performanceMonitor: PerformanceMonitor | undefined;
let errorHandler: ErrorHandler | undefined;
let previewEnhancer: PreviewEnhancer | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

/**
 * Extension activation entry point
 * Called when the extension is activated (when a Markdown file is opened)
 */
export function activate(context: vscode.ExtensionContext): void {
    const outputChannel = vscode.window.createOutputChannel('Markdown Code Block Highlighter');
    outputChannel.appendLine('=== Markdown Code Block Highlighter extension is activating ===');
    outputChannel.appendLine(`Extension path: ${context.extensionPath}`);
    outputChannel.appendLine(`Storage path: ${context.globalStorageUri?.fsPath || 'N/A'}`);
    console.log('=== MCBH: Extension activating ===');

    try {
        // Initialize error handler first
        errorHandler = new ErrorHandler(outputChannel);
        errorHandler.logInfo('Initializing extension...');

        // Initialize configuration manager
        configManager = new ConfigurationManager();
        context.subscriptions.push(configManager);

        const config = configManager.getConfiguration();

        // Check if highlighting is enabled
        if (!config.enableHighlighting) {
            outputChannel.appendLine('Markdown Code Block Highlighter is disabled in settings');
            console.log('Markdown Code Block Highlighter is disabled in settings');
            return;
        }

        // Log configuration for debugging
        outputChannel.appendLine('Extension configuration:');
        outputChannel.appendLine(JSON.stringify(config, null, 2));
        console.log('Extension configuration:', config);

        // Initialize performance monitor
        performanceMonitor = new PerformanceMonitor(config.enablePerfMonitoring);
        errorHandler.logInfo(`PerformanceMonitor initialized (enabled: ${config.enablePerfMonitoring})`);

        // Initialize theme manager
        themeManager = new ThemeManager();
        context.subscriptions.push(themeManager);
        errorHandler.logInfo('ThemeManager initialized');

        // Initialize tokenization service
        tokenizationService = new TokenizationService();
        context.subscriptions.push(tokenizationService);
        errorHandler.logInfo('TokenizationService initialized');

        // Initialize cache manager with configured size
        const cacheSize = config.enableCache ? config.cacheSize : 0;
        cacheManager = new CacheManager(cacheSize);
        errorHandler.logInfo(`CacheManager initialized with size: ${cacheSize}`);

        // Initialize preview enhancer (coordinates all services)
        previewEnhancer = new PreviewEnhancer(
            themeManager,
            tokenizationService,
            cacheManager,
            configManager,
            performanceMonitor,
            errorHandler
        );
        context.subscriptions.push(previewEnhancer);
        errorHandler.logInfo('PreviewEnhancer initialized');

        // Register commands
        registerCommands(context, outputChannel);

        // Create status bar item if performance monitoring is enabled
        if (config.enablePerfMonitoring) {
            createStatusBarItem(context);
        }

        outputChannel.appendLine('=== Markdown Code Block Highlighter initialization complete! ===');
        outputChannel.appendLine('Extension is ready to process Markdown previews');
        console.log('=== MCBH: Initialization complete ===');

        // Show success message (always show for debugging)
        vscode.window.showInformationMessage(
            'MCBH: Extension activated successfully. Open a Markdown file to test.'
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        outputChannel.appendLine(`ERROR: ${errorMessage}`);
        console.error('Error activating Markdown Code Block Highlighter:', error);
        
        if (errorHandler) {
            errorHandler.showErrorMessage(`Failed to activate: ${errorMessage}`);
        } else {
            vscode.window.showErrorMessage(
                `Failed to activate Markdown Code Block Highlighter: ${errorMessage}`
            );
        }
    }
}

/**
 * Create status bar item for cache statistics
 */
function createStatusBarItem(context: vscode.ExtensionContext): void {
    try {
        statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        statusBarItem.command = 'markdownCodeBlockHighlighter.showDetailedStats';
        context.subscriptions.push(statusBarItem);

        // Update status bar periodically
        updateStatusBar();
        const updateInterval = setInterval(() => {
            updateStatusBar();
        }, 5000); // Update every 5 seconds

        context.subscriptions.push({
            dispose: () => clearInterval(updateInterval)
        });

        statusBarItem.show();
    } catch (error) {
        console.error('Failed to create status bar item:', error);
    }
}

/**
 * Update status bar with cache statistics
 */
function updateStatusBar(): void {
    if (!statusBarItem || !previewEnhancer || !configManager) {
        return;
    }

    try {
        if (!configManager.isPerfMonitoringEnabled()) {
            statusBarItem.hide();
            return;
        }

        const cacheStats = previewEnhancer.getCacheStats();
        const queueStats = previewEnhancer.getQueueStats();
        
        statusBarItem.text = `$(database) ${cacheStats.size}/${cacheStats.maxSize} | $(pulse) ${queueStats.activeRequests}/${queueStats.queueSize}`;
        statusBarItem.tooltip = `Cache: ${cacheStats.size}/${cacheStats.maxSize} | Active: ${queueStats.activeRequests} | Queued: ${queueStats.queueSize}`;
        statusBarItem.show();
    } catch (error) {
        console.error('Failed to update status bar:', error);
    }
}

/**
 * Register extension commands
 */
function registerCommands(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): void {
    // Command to clear cache
    const clearCacheCommand = vscode.commands.registerCommand(
        'markdownCodeBlockHighlighter.clearCache',
        () => {
            if (previewEnhancer && errorHandler) {
                previewEnhancer.clearCache();
                vscode.window.showInformationMessage('Markdown Code Block Highlighter: Cache cleared');
                errorHandler.logInfo('Cache cleared via command');
                updateStatusBar();
            }
        }
    );
    context.subscriptions.push(clearCacheCommand);

    // Command to show cache stats
    const showStatsCommand = vscode.commands.registerCommand(
        'markdownCodeBlockHighlighter.showStats',
        () => {
            if (previewEnhancer && errorHandler) {
                const stats = previewEnhancer.getCacheStats();
                const message = `Cache: ${stats.size}/${stats.maxSize} entries`;
                vscode.window.showInformationMessage(message);
                errorHandler.logInfo(`Stats: ${message}`);
            }
        }
    );
    context.subscriptions.push(showStatsCommand);

    // Command to show detailed stats
    const showDetailedStatsCommand = vscode.commands.registerCommand(
        'markdownCodeBlockHighlighter.showDetailedStats',
        () => {
            if (previewEnhancer && performanceMonitor && errorHandler) {
                const cacheStats = previewEnhancer.getCacheStats();
                const queueStats = previewEnhancer.getQueueStats();
                const perfStats = performanceMonitor.getMetrics();

                let message = `Cache: ${cacheStats.size}/${cacheStats.maxSize}\n`;
                message += `Queue: ${queueStats.queueSize} pending, ${queueStats.activeRequests} active\n\n`;
                
                if (perfStats.size > 0) {
                    message += 'Performance Metrics:\n';
                    for (const [name, values] of perfStats.entries()) {
                        const stats = performanceMonitor.getMetricStats(name);
                        if (stats) {
                            message += `  ${name}: avg ${stats.avg.toFixed(2)}ms (${stats.count} samples)\n`;
                        }
                    }
                }

                vscode.window.showInformationMessage(message, { modal: false });
                errorHandler.logInfo('Detailed stats displayed');
            }
        }
    );
    context.subscriptions.push(showDetailedStatsCommand);

    // Command to show performance summary
    const showPerfSummaryCommand = vscode.commands.registerCommand(
        'markdownCodeBlockHighlighter.showPerformanceSummary',
        () => {
            if (previewEnhancer && performanceMonitor && errorHandler) {
                previewEnhancer.logPerformanceSummary();
                vscode.window.showInformationMessage('Performance summary logged to console');
                errorHandler.logInfo('Performance summary displayed');
            }
        }
    );
    context.subscriptions.push(showPerfSummaryCommand);

    // Command to toggle performance monitoring
    const togglePerfMonitoringCommand = vscode.commands.registerCommand(
        'markdownCodeBlockHighlighter.togglePerfMonitoring',
        async () => {
            if (configManager && performanceMonitor && errorHandler) {
                const config = vscode.workspace.getConfiguration('markdownCodeBlockHighlighter');
                const currentValue = config.get<boolean>('enablePerfMonitoring', false);
                await config.update('enablePerfMonitoring', !currentValue, vscode.ConfigurationTarget.Global);
                
                const newValue = !currentValue;
                performanceMonitor.setEnabled(newValue);
                
                if (newValue && statusBarItem) {
                    statusBarItem.show();
                } else if (!newValue && statusBarItem) {
                    statusBarItem.hide();
                }
                
                vscode.window.showInformationMessage(
                    `Performance monitoring ${newValue ? 'enabled' : 'disabled'}`
                );
                errorHandler.logInfo(`Performance monitoring ${newValue ? 'enabled' : 'disabled'}`);
            }
        }
    );
    context.subscriptions.push(togglePerfMonitoringCommand);

    // Command to reload extension
    const reloadCommand = vscode.commands.registerCommand(
        'markdownCodeBlockHighlighter.reload',
        async () => {
            if (errorHandler) {
                errorHandler.logInfo('Reloading extension...');
            }
            outputChannel.appendLine('Reloading extension...');
            
            // Deactivate
            deactivate();
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Reactivate
            activate(context);
            
            vscode.window.showInformationMessage('Markdown Code Block Highlighter reloaded');
        }
    );
    context.subscriptions.push(reloadCommand);

    // Command to show error log
    const showErrorLogCommand = vscode.commands.registerCommand(
        'markdownCodeBlockHighlighter.showErrorLog',
        () => {
            if (errorHandler) {
                const errorCounts = errorHandler.getErrorCounts();
                const totalErrors = errorHandler.getTotalErrorCount();
                
                if (totalErrors === 0) {
                    vscode.window.showInformationMessage('No errors recorded');
                } else {
                    let message = `Total errors: ${totalErrors}\n\n`;
                    for (const [context, count] of errorCounts.entries()) {
                        message += `${context}: ${count}\n`;
                    }
                    vscode.window.showInformationMessage(message);
                }
            }
        }
    );
    context.subscriptions.push(showErrorLogCommand);

    outputChannel.appendLine('Commands registered');
}

/**
 * Extension deactivation entry point
 * Called when the extension is deactivated
 */
export function deactivate(): void {
    console.log('Markdown Code Block Highlighter is now deactivating...');

    // Log performance summary if monitoring was enabled
    if (performanceMonitor?.isEnabled() && previewEnhancer) {
        previewEnhancer.logPerformanceSummary();
    }

    // Dispose all services
    if (previewEnhancer) {
        previewEnhancer.dispose();
        previewEnhancer = undefined;
    }

    if (cacheManager) {
        cacheManager.clear();
        cacheManager = undefined;
    }

    if (tokenizationService) {
        tokenizationService.dispose();
        tokenizationService = undefined;
    }

    if (themeManager) {
        themeManager.dispose();
        themeManager = undefined;
    }

    if (configManager) {
        configManager.dispose();
        configManager = undefined;
    }

    if (performanceMonitor) {
        performanceMonitor.clear();
        performanceMonitor = undefined;
    }

    if (statusBarItem) {
        statusBarItem.dispose();
        statusBarItem = undefined;
    }

    errorHandler = undefined;

    console.log('Markdown Code Block Highlighter deactivated successfully');
}
