import * as vscode from 'vscode';

/**
 * Extension configuration interface
 */
export interface ExtensionConfig {
    enableHighlighting: boolean;
    fontSize: number;
    lineHeight: number;
    enableCache: boolean;
    cacheSize: number;
    maxBlockSize: number;
    enablePerfMonitoring: boolean;
    lazyLoadThreshold: number;
    tokenizationTimeout: number;
    batchDelay: number;
    concurrentRequests: number;
    showBorder: boolean;
    borderWidth: number;
    borderRadius: number;
    showCopyButton: boolean;
    copyButtonPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    copyButtonVisibility: 'hover' | 'always';
}

/**
 * ConfigurationManager - Manages extension settings and configuration
 * Provides typed access to settings and notifies on changes
 */
export class ConfigurationManager {
    private static readonly SECTION = 'markdownCodeBlockHighlighter';
    private readonly _onDidChangeConfiguration = new vscode.EventEmitter<ExtensionConfig>();
    public readonly onDidChangeConfiguration = this._onDidChangeConfiguration.event;
    
    private disposables: vscode.Disposable[] = [];
    private currentConfig: ExtensionConfig;

    constructor() {
        // Load initial configuration
        this.currentConfig = this.loadConfiguration();

        // Listen for configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(this.handleConfigurationChange.bind(this))
        );
    }

    /**
     * Get current configuration
     */
    public getConfiguration(): ExtensionConfig {
        return { ...this.currentConfig };
    }

    /**
     * Check if highlighting is enabled
     */
    public isHighlightingEnabled(): boolean {
        return this.currentConfig.enableHighlighting;
    }

    /**
     * Get font size setting
     */
    public getFontSize(): number {
        return this.currentConfig.fontSize;
    }

    /**
     * Get line height setting
     */
    public getLineHeight(): number {
        return this.currentConfig.lineHeight;
    }

    /**
     * Check if cache is enabled
     */
    public isCacheEnabled(): boolean {
        return this.currentConfig.enableCache;
    }

    /**
     * Get cache size setting
     */
    public getCacheSize(): number {
        return this.currentConfig.cacheSize;
    }

    /**
     * Get max block size setting
     */
    public getMaxBlockSize(): number {
        return this.currentConfig.maxBlockSize;
    }

    /**
     * Check if performance monitoring is enabled
     */
    public isPerfMonitoringEnabled(): boolean {
        return this.currentConfig.enablePerfMonitoring;
    }

    /**
     * Get lazy load threshold setting
     */
    public getLazyLoadThreshold(): number {
        return this.validateNumber(this.currentConfig.lazyLoadThreshold, 1, 10, 3);
    }

    /**
     * Get tokenization timeout setting
     */
    public getTokenizationTimeout(): number {
        return this.validateNumber(this.currentConfig.tokenizationTimeout, 1000, 30000, 5000);
    }

    /**
     * Get batch delay setting
     */
    public getBatchDelay(): number {
        return this.validateNumber(this.currentConfig.batchDelay, 10, 500, 50);
    }

    /**
     * Get concurrent requests setting
     */
    public getConcurrentRequests(): number {
        return this.validateNumber(this.currentConfig.concurrentRequests, 1, 20, 5);
    }

    /**
     * Check if border should be shown
     */
    public getShowBorder(): boolean {
        return this.currentConfig.showBorder;
    }

    /**
     * Get border width setting
     */
    public getBorderWidth(): number {
        return this.validateNumber(this.currentConfig.borderWidth, 1, 4, 1);
    }

    /**
     * Get border radius setting
     */
    public getBorderRadius(): number {
        return this.validateNumber(this.currentConfig.borderRadius, 0, 12, 4);
    }

    /**
     * Check if copy button should be shown
     */
    public getShowCopyButton(): boolean {
        return this.currentConfig.showCopyButton;
    }

    /**
     * Get copy button position setting
     */
    public getCopyButtonPosition(): 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' {
        return this.currentConfig.copyButtonPosition;
    }

    /**
     * Get copy button visibility setting
     */
    public getCopyButtonVisibility(): 'hover' | 'always' {
        return this.currentConfig.copyButtonVisibility;
    }

    /**
     * Validate a number is within range, return default if invalid
     */
    private validateNumber(value: number, min: number, max: number, defaultValue: number): number {
        if (typeof value !== 'number' || isNaN(value) || value < min || value > max) {
            return defaultValue;
        }
        return value;
    }

    /**
     * Handle configuration changes
     */
    private handleConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
        // Check if our settings changed
        if (event.affectsConfiguration(ConfigurationManager.SECTION)) {
            const newConfig = this.loadConfiguration();
            const oldConfig = this.currentConfig;

            // Check if any values actually changed
            if (this.hasConfigurationChanged(oldConfig, newConfig)) {
                this.currentConfig = newConfig;
                this._onDidChangeConfiguration.fire(newConfig);
                
                console.log('Configuration changed:', newConfig);
            }
        }
    }

    /**
     * Load configuration from VS Code settings
     */
    private loadConfiguration(): ExtensionConfig {
        const config = vscode.workspace.getConfiguration(ConfigurationManager.SECTION);

        return {
            enableHighlighting: config.get<boolean>('enableHighlighting', true),
            fontSize: config.get<number>('fontSize', 0),
            lineHeight: config.get<number>('lineHeight', 1.5),
            enableCache: config.get<boolean>('enableCache', true),
            cacheSize: config.get<number>('cacheSize', 100),
            maxBlockSize: config.get<number>('maxBlockSize', 10000),
            enablePerfMonitoring: config.get<boolean>('enablePerfMonitoring', false),
            lazyLoadThreshold: config.get<number>('lazyLoadThreshold', 3),
            tokenizationTimeout: config.get<number>('tokenizationTimeout', 5000),
            batchDelay: config.get<number>('batchDelay', 50),
            concurrentRequests: config.get<number>('concurrentRequests', 5),
            showBorder: config.get<boolean>('showBorder', true),
            borderWidth: config.get<number>('borderWidth', 1),
            borderRadius: config.get<number>('borderRadius', 4),
            showCopyButton: config.get<boolean>('showCopyButton', true),
            copyButtonPosition: config.get<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('copyButtonPosition', 'top-right'),
            copyButtonVisibility: config.get<'hover' | 'always'>('copyButtonVisibility', 'hover')
        };
    }

    /**
     * Check if configuration has actually changed
     */
    private hasConfigurationChanged(oldConfig: ExtensionConfig, newConfig: ExtensionConfig): boolean {
        return (
            oldConfig.enableHighlighting !== newConfig.enableHighlighting ||
            oldConfig.fontSize !== newConfig.fontSize ||
            oldConfig.lineHeight !== newConfig.lineHeight ||
            oldConfig.enableCache !== newConfig.enableCache ||
            oldConfig.cacheSize !== newConfig.cacheSize ||
            oldConfig.maxBlockSize !== newConfig.maxBlockSize ||
            oldConfig.enablePerfMonitoring !== newConfig.enablePerfMonitoring ||
            oldConfig.lazyLoadThreshold !== newConfig.lazyLoadThreshold ||
            oldConfig.tokenizationTimeout !== newConfig.tokenizationTimeout ||
            oldConfig.batchDelay !== newConfig.batchDelay ||
            oldConfig.concurrentRequests !== newConfig.concurrentRequests ||
            oldConfig.showBorder !== newConfig.showBorder ||
            oldConfig.borderWidth !== newConfig.borderWidth ||
            oldConfig.borderRadius !== newConfig.borderRadius ||
            oldConfig.showCopyButton !== newConfig.showCopyButton ||
            oldConfig.copyButtonPosition !== newConfig.copyButtonPosition ||
            oldConfig.copyButtonVisibility !== newConfig.copyButtonVisibility
        );
    }

    /**
     * Get a specific configuration value
     */
    public get<T>(key: keyof ExtensionConfig): T {
        return this.currentConfig[key] as T;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this._onDidChangeConfiguration.dispose();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
