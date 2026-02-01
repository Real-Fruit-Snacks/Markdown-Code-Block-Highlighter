import * as vscode from 'vscode';
import { ThemeManager, ThemeData } from './services/themeManager';
import { TokenizationService, TokenizedCode } from './services/tokenizationService';
import { CacheManager } from './services/cacheManager';
import { ConfigurationManager } from './services/configurationManager';
import { PerformanceMonitor } from './services/performanceMonitor';
import { ErrorHandler, ErrorSeverity } from './utils/errorHandler';

/**
 * Message protocol types
 */
interface TokenizeRequestMessage {
    type: 'tokenize';
    id: string;
    code: string;
    language: string;
}

interface TokenizedResponseMessage {
    type: 'tokenized';
    id: string;
    tokens: TokenizedCode['tokens'];
    themeData: ThemeData;
}

interface ThemeChangedMessage {
    type: 'themeChanged';
    themeData: ThemeData;
}

/**
 * Request with priority information
 */
interface PrioritizedRequest {
    request: TokenizeRequestMessage;
    priority: number;
    timestamp: number;
}

/**
 * PreviewEnhancer - Coordinates theme management, tokenization, and preview communication
 * Enhanced with request batching, prioritization, and performance monitoring
 */
export class PreviewEnhancer {
    private themeManager: ThemeManager;
    private tokenizationService: TokenizationService;
    private cacheManager: CacheManager;
    private configManager: ConfigurationManager;
    private performanceMonitor: PerformanceMonitor;
    private errorHandler: ErrorHandler;
    private disposables: vscode.Disposable[] = [];
    private outputChannel: vscode.OutputChannel;

    // Request batching and prioritization
    private requestQueue: PrioritizedRequest[] = [];
    private activeRequests: Set<string> = new Set();
    private batchTimeout: NodeJS.Timeout | null = null;
    private themeChangeDebounceTimeout: NodeJS.Timeout | null = null;
    private maxConcurrentRequests: number = 5;

    constructor(
        themeManager: ThemeManager,
        tokenizationService: TokenizationService,
        cacheManager: CacheManager,
        configManager: ConfigurationManager,
        performanceMonitor: PerformanceMonitor,
        errorHandler: ErrorHandler
    ) {
        this.themeManager = themeManager;
        this.tokenizationService = tokenizationService;
        this.cacheManager = cacheManager;
        this.configManager = configManager;
        this.performanceMonitor = performanceMonitor;
        this.errorHandler = errorHandler;
        this.outputChannel = vscode.window.createOutputChannel('Markdown Code Block Highlighter');

        this.initialize();
    }

    /**
     * Initialize the preview enhancer
     */
    private initialize(): void {
        try {
            // Update max concurrent requests from config
            this.maxConcurrentRequests = this.configManager.getConcurrentRequests();

            // Listen for theme changes with debouncing
            this.disposables.push(
                this.themeManager.onDidChangeTheme(this.handleThemeChange.bind(this))
            );

            // Listen for configuration changes
            this.disposables.push(
                this.configManager.onDidChangeConfiguration(this.handleConfigurationChange.bind(this))
            );

            // Set up message handler for preview webviews
            this.setupMessageHandler();

            // Send initial config to preview
            this.sendConfigToPreview();

            this.outputChannel.appendLine('=== PreviewEnhancer initialized ===');
            this.outputChannel.appendLine('  - Batching enabled');
            this.outputChannel.appendLine('  - Max concurrent requests: ' + this.maxConcurrentRequests);
            this.outputChannel.appendLine('  - Message handler registered');
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'PreviewEnhancer initialization', ErrorSeverity.Critical);
        }
    }

    /**
     * Set up message handler for webview communication
     */
    private setupMessageHandler(): void {
        // Register a command that the preview script can call
        this.disposables.push(
            vscode.commands.registerCommand(
                'markdownCodeBlockHighlighter.tokenize',
                this.handleTokenizeRequest.bind(this)
            )
        );

        // For markdown previews, we need to work with the markdown extension
        this.setupWebviewMessageInterception();
    }

    /**
     * Set up webview message interception
     */
    private setupWebviewMessageInterception(): void {
        // Try to get markdown extension
        const markdownExtension = vscode.extensions.getExtension('vscode.markdown-language-features');
        
        if (markdownExtension) {
            this.outputChannel.appendLine('Markdown extension found, setting up message handling');
            this.setupCommandBasedCommunication();
        } else {
            this.errorHandler.logWarning('Markdown extension not found');
        }
    }

    /**
     * Set up command-based communication
     */
    private setupCommandBasedCommunication(): void {
        // Command to post message from preview
        this.disposables.push(
            vscode.commands.registerCommand(
                'markdownCodeBlockHighlighter.postMessage',
                (message: any) => {
                    this.handlePreviewMessage(message);
                }
            )
        );

        this.outputChannel.appendLine('Command-based communication set up');
    }

    /**
     * Handle messages from preview webview
     */
    private async handlePreviewMessage(message: any): Promise<void> {
        try {
            this.outputChannel.appendLine(`MCBH: Received message from preview: ${message.type}`);
            
            switch (message.type) {
                case 'tokenize':
                    this.outputChannel.appendLine(`MCBH: Processing tokenize request: ${message.id}`);
                    await this.handleTokenizeRequest(message as TokenizeRequestMessage);
                    break;
                default:
                    this.outputChannel.appendLine(`MCBH: Unknown message type: ${message.type}`);
                    this.errorHandler.logWarning(`Unknown message type: ${message.type}`);
            }
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'handlePreviewMessage', ErrorSeverity.Recoverable);
        }
    }

    /**
     * Handle tokenization request from preview with batching and prioritization
     */
    private async handleTokenizeRequest(request: TokenizeRequestMessage): Promise<void> {
        try {
            this.outputChannel.appendLine(`MCBH: handleTokenizeRequest called for ${request.id}`);
            
            // Check if highlighting is enabled
            if (!this.configManager.isHighlightingEnabled()) {
                this.outputChannel.appendLine('MCBH: Highlighting is disabled in settings');
                this.errorHandler.logInfo('Highlighting is disabled');
                return;
            }
            
            this.outputChannel.appendLine(`MCBH: Highlighting enabled, proceeding with request`);

            // Check if already processing this request
            if (this.activeRequests.has(request.id)) {
                this.errorHandler.logInfo(`Request ${request.id} already being processed`);
                return;
            }

            // Check code block size
            const maxBlockSize = this.configManager.getMaxBlockSize();
            if (request.code.length > maxBlockSize * 2) {
                this.errorHandler.logWarning(
                    `Code block ${request.id} too large (${request.code.length} > ${maxBlockSize * 2}), skipping`
                );
                return;
            }

            // Calculate priority (visible blocks should have higher priority)
            const priority = this.calculatePriority(request);

            // Add to queue
            this.queueRequest({
                request,
                priority,
                timestamp: Date.now()
            });

            // Process queue with debouncing
            this.scheduleQueueProcessing();
        } catch (error) {
            this.errorHandler.handleError(error as Error, `handleTokenizeRequest: ${request.id}`, ErrorSeverity.Recoverable);
        }
    }

    /**
     * Calculate request priority
     * Higher priority = process first
     */
    private calculatePriority(request: TokenizeRequestMessage): number {
        let priority = 100; // Base priority

        // Smaller blocks get higher priority (faster to process)
        if (request.code.length < 1000) {
            priority += 50;
        } else if (request.code.length < 5000) {
            priority += 20;
        }

        // Common languages get slightly higher priority
        const commonLanguages = ['javascript', 'typescript', 'python', 'java', 'cpp'];
        if (commonLanguages.includes(request.language.toLowerCase())) {
            priority += 10;
        }

        return priority;
    }

    /**
     * Queue a tokenization request
     */
    private queueRequest(prioritizedRequest: PrioritizedRequest): void {
        // Check if request already in queue
        const existingIndex = this.requestQueue.findIndex(
            r => r.request.id === prioritizedRequest.request.id
        );

        if (existingIndex >= 0) {
            // Update existing request with higher priority if applicable
            if (prioritizedRequest.priority > this.requestQueue[existingIndex].priority) {
                this.requestQueue[existingIndex] = prioritizedRequest;
                this.sortQueue();
            }
            return;
        }

        // Add new request
        this.requestQueue.push(prioritizedRequest);
        this.sortQueue();
    }

    /**
     * Sort queue by priority (descending)
     */
    private sortQueue(): void {
        this.requestQueue.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Schedule queue processing with debouncing
     */
    private scheduleQueueProcessing(): void {
        const batchDelay = this.configManager.getBatchDelay();

        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }

        this.batchTimeout = setTimeout(() => {
            this.processQueue();
            this.batchTimeout = null;
        }, batchDelay);
    }

    /**
     * Process queued requests with concurrency control
     */
    private async processQueue(): Promise<void> {
        try {
            // Process up to maxConcurrentRequests at a time
            while (this.requestQueue.length > 0 && this.activeRequests.size < this.maxConcurrentRequests) {
                const prioritizedRequest = this.requestQueue.shift();
                if (!prioritizedRequest) {
                    break;
                }

                const { request } = prioritizedRequest;

                // Mark as active
                this.activeRequests.add(request.id);

                // Process request (don't await - process concurrently)
                this.processRequest(request)
                    .then(() => {
                        this.activeRequests.delete(request.id);
                        // Continue processing queue if there are more items
                        if (this.requestQueue.length > 0) {
                            this.processQueue();
                        }
                    })
                    .catch(error => {
                        this.activeRequests.delete(request.id);
                        this.errorHandler.handleError(
                            error,
                            `processRequest: ${request.id}`,
                            ErrorSeverity.Recoverable
                        );
                    });
            }

            if (this.performanceMonitor.isEnabled()) {
                this.performanceMonitor.recordMetric('queueSize', this.requestQueue.length);
                this.performanceMonitor.recordMetric('activeRequests', this.activeRequests.size);
            }
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'processQueue', ErrorSeverity.Recoverable);
        }
    }

    /**
     * Process a single tokenization request
     */
    private async processRequest(request: TokenizeRequestMessage): Promise<void> {
        const { id, code, language } = request;
        
        const timerId = this.performanceMonitor.startTimer('tokenization');

        try {
            // Get current theme data
            const themeData = this.themeManager.getThemeData();

            // Check cache if enabled
            let tokenizedCode: TokenizedCode | null = null;
            
            if (this.configManager.isCacheEnabled()) {
                const cacheKey = this.cacheManager.generateKey(code, language, themeData.kind);
                tokenizedCode = this.cacheManager.get(cacheKey);
                
                if (tokenizedCode) {
                    this.outputChannel.appendLine(`Cache hit for block ${id}`);
                    if (this.performanceMonitor.isEnabled()) {
                        this.performanceMonitor.recordMetric('cacheHit', 1);
                    }
                }
            }

            // Tokenize if not cached
            if (!tokenizedCode) {
                this.outputChannel.appendLine(`MCBH: Cache miss - tokenizing block ${id} (${language}, ${code.length} chars)`);
                
                const maxBlockSize = this.configManager.getMaxBlockSize();
                const timeout = this.configManager.getTokenizationTimeout();
                
                tokenizedCode = await this.tokenizationService.tokenize(
                    code,
                    language,
                    themeData,
                    maxBlockSize,
                    timeout
                );

                // Cache result if enabled
                if (this.configManager.isCacheEnabled()) {
                    const cacheKey = this.cacheManager.generateKey(code, language, themeData.kind);
                    this.cacheManager.set(cacheKey, tokenizedCode);
                }

                if (this.performanceMonitor.isEnabled()) {
                    this.performanceMonitor.recordMetric('cacheMiss', 1);
                }
            }

            const elapsed = this.performanceMonitor.endTimer(timerId);
            if (elapsed > 0) {
                this.outputChannel.appendLine(`Tokenization took ${elapsed.toFixed(2)}ms`);
            }

            // Send response back to preview
            const response: TokenizedResponseMessage = {
                type: 'tokenized',
                id,
                tokens: tokenizedCode.tokens,
                themeData
            };

            this.outputChannel.appendLine(`MCBH: Sending tokenized response back to preview for ${id}`);
            await this.sendMessageToPreview(response);
            this.outputChannel.appendLine(`MCBH: Response sent successfully for ${id}`);
        } catch (error) {
            this.performanceMonitor.endTimer(timerId);
            throw error;
        }
    }

    /**
     * Send message to preview webview
     */
    private async sendMessageToPreview(message: any): Promise<void> {
        try {
            this.outputChannel.appendLine(`MCBH: Attempting to send message to preview: ${message.type}`);
            
            // Broadcast via command execution
            await vscode.commands.executeCommand(
                'markdown.api.render',
                JSON.stringify(message)
            );
            
            this.outputChannel.appendLine('MCBH: Message sent via markdown.api.render command');
        } catch (error) {
            this.outputChannel.appendLine(`MCBH: Failed to send via markdown.api.render: ${error}`);
            this.outputChannel.appendLine('MCBH: This is expected - the preview script cannot receive messages this way');
            // Command might not exist, that's okay
            // The preview script will handle rendering on its side
        }
    }

    /**
     * Handle theme changes with debouncing
     */
    private handleThemeChange(themeData: ThemeData): void {
        // Debounce theme change notifications to prevent rapid updates
        if (this.themeChangeDebounceTimeout) {
            clearTimeout(this.themeChangeDebounceTimeout);
        }

        this.themeChangeDebounceTimeout = setTimeout(() => {
            try {
                this.outputChannel.appendLine(`Theme changed to: ${themeData.kind}`);

                // Clear cache on theme change
                this.cacheManager.clear();
                this.outputChannel.appendLine('Cache cleared due to theme change');

                // Clear pending requests (will be re-requested with new theme)
                this.requestQueue.length = 0;
                this.activeRequests.clear();

                // Notify all preview instances
                const message: ThemeChangedMessage = {
                    type: 'themeChanged',
                    themeData
                };

                this.sendMessageToPreview(message);
            } catch (error) {
                this.errorHandler.handleError(error as Error, 'handleThemeChange', ErrorSeverity.Recoverable);
            }
        }, 100); // 100ms debounce
    }

    /**
     * Handle configuration changes
     */
    private handleConfigurationChange(config: any): void {
        try {
            this.outputChannel.appendLine('Configuration changed');

            // Update max concurrent requests
            if (config.concurrentRequests) {
                this.maxConcurrentRequests = config.concurrentRequests;
            }

            // Update cache size if changed
            if (config.cacheSize) {
                this.cacheManager.setMaxSize(config.cacheSize);
            }

            // Clear cache if cache was disabled
            if (!config.enableCache) {
                this.cacheManager.clear();
            }

            // Update performance monitoring
            if (config.enablePerfMonitoring !== undefined) {
                this.performanceMonitor.setEnabled(config.enablePerfMonitoring);
            }

            // Send updated config to preview
            this.sendConfigToPreview();
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'handleConfigurationChange', ErrorSeverity.Recoverable);
        }
    }

    /**
     * Send current configuration to preview
     */
    private sendConfigToPreview(): void {
        try {
            const configMessage = {
                type: 'config',
                enablePerfMonitoring: this.configManager.isPerfMonitoringEnabled(),
                batchDelay: this.configManager.getBatchDelay(),
                lazyLoadThreshold: this.configManager.getLazyLoadThreshold(),
                showBorder: this.configManager.getShowBorder(),
                borderWidth: this.configManager.getBorderWidth(),
                borderRadius: this.configManager.getBorderRadius(),
                showCopyButton: this.configManager.getShowCopyButton(),
                copyButtonPosition: this.configManager.getCopyButtonPosition(),
                copyButtonVisibility: this.configManager.getCopyButtonVisibility()
            };

            this.sendMessageToPreview(configMessage);
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'sendConfigToPreview', ErrorSeverity.Recoverable);
        }
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { size: number; maxSize: number } {
        return this.cacheManager.getStats();
    }

    /**
     * Get performance statistics
     */
    public getPerformanceStats(): Map<string, number[]> {
        return this.performanceMonitor.getMetrics();
    }

    /**
     * Get queue statistics
     */
    public getQueueStats(): { queueSize: number; activeRequests: number } {
        return {
            queueSize: this.requestQueue.length,
            activeRequests: this.activeRequests.size
        };
    }

    /**
     * Clear cache manually
     */
    public clearCache(): void {
        this.cacheManager.clear();
        this.outputChannel.appendLine('Cache cleared manually');
    }

    /**
     * Log performance summary
     */
    public logPerformanceSummary(): void {
        this.performanceMonitor.logSummary();
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        // Clear timeouts
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        if (this.themeChangeDebounceTimeout) {
            clearTimeout(this.themeChangeDebounceTimeout);
        }

        // Dispose subscriptions
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        
        this.outputChannel.dispose();
    }
}
