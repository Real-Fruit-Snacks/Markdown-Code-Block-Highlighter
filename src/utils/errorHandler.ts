import * as vscode from 'vscode';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    /** Recoverable error - operation can continue */
    Recoverable = 'recoverable',
    /** Non-recoverable error - operation must stop */
    Critical = 'critical',
    /** Warning - potential issue but not an error */
    Warning = 'warning'
}

/**
 * ErrorHandler - Centralized error handling and logging
 * Provides consistent error management across the extension
 */
export class ErrorHandler {
    private outputChannel: vscode.OutputChannel;
    private errorCounts: Map<string, number> = new Map();

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Handle an error with appropriate logging and user feedback
     * @param error - The error to handle
     * @param context - Context about where the error occurred
     * @param severity - Error severity level
     */
    public handleError(
        error: Error | unknown,
        context: string,
        severity: ErrorSeverity = ErrorSeverity.Recoverable
    ): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        // Log detailed error information
        this.logError(`[${severity}] ${context}: ${errorMessage}`, {
            stack: errorStack,
            timestamp: new Date().toISOString()
        });

        // Track error counts
        this.incrementErrorCount(context);

        // Show user-visible messages for critical errors
        if (severity === ErrorSeverity.Critical) {
            this.showErrorMessage(`${context}: ${errorMessage}`);
        }
    }

    /**
     * Log an error message to the output channel
     * @param message - Error message
     * @param details - Additional error details
     */
    public logError(message: string, details?: any): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[ERROR ${timestamp}] ${message}`);
        
        if (details) {
            this.outputChannel.appendLine(`  Details: ${JSON.stringify(details, null, 2)}`);
        }
    }

    /**
     * Log a warning message
     * @param message - Warning message
     * @param details - Additional details
     */
    public logWarning(message: string, details?: any): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[WARN ${timestamp}] ${message}`);
        
        if (details) {
            this.outputChannel.appendLine(`  Details: ${JSON.stringify(details, null, 2)}`);
        }
    }

    /**
     * Log an info message
     * @param message - Info message
     */
    public logInfo(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[INFO ${timestamp}] ${message}`);
    }

    /**
     * Show error message to user
     * @param message - User-friendly error message
     */
    public showErrorMessage(message: string): void {
        vscode.window.showErrorMessage(
            `Markdown Code Block Highlighter: ${message}`
        );
    }

    /**
     * Show warning message to user
     * @param message - User-friendly warning message
     */
    public showWarningMessage(message: string): void {
        vscode.window.showWarningMessage(
            `Markdown Code Block Highlighter: ${message}`
        );
    }

    /**
     * Increment error count for a specific context
     */
    private incrementErrorCount(context: string): void {
        const count = this.errorCounts.get(context) || 0;
        this.errorCounts.set(context, count + 1);
    }

    /**
     * Get error counts by context
     */
    public getErrorCounts(): Map<string, number> {
        return new Map(this.errorCounts);
    }

    /**
     * Clear error counts
     */
    public clearErrorCounts(): void {
        this.errorCounts.clear();
    }

    /**
     * Get total error count
     */
    public getTotalErrorCount(): number {
        let total = 0;
        for (const count of this.errorCounts.values()) {
            total += count;
        }
        return total;
    }

    /**
     * Wrap a function with error handling
     * @param fn - Function to wrap
     * @param context - Context for error reporting
     * @param fallback - Fallback value if error occurs
     */
    public wrapWithErrorHandling<T>(
        fn: () => T,
        context: string,
        fallback?: T
    ): T | undefined {
        try {
            return fn();
        } catch (error) {
            this.handleError(error, context, ErrorSeverity.Recoverable);
            return fallback;
        }
    }

    /**
     * Wrap an async function with error handling
     * @param fn - Async function to wrap
     * @param context - Context for error reporting
     * @param fallback - Fallback value if error occurs
     */
    public async wrapAsyncWithErrorHandling<T>(
        fn: () => Promise<T>,
        context: string,
        fallback?: T
    ): Promise<T | undefined> {
        try {
            return await fn();
        } catch (error) {
            this.handleError(error, context, ErrorSeverity.Recoverable);
            return fallback;
        }
    }
}
