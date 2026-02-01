import * as vscode from 'vscode';

/**
 * Theme data structure for serialization to webview
 */
export interface ThemeData {
    kind: 'light' | 'dark' | 'highContrast';
    colors: {
        [tokenType: string]: string;
    };
    background: string;
    foreground: string;
    borderColor: string;
    borderColorSubtle: string;
    buttonBackground: string;
    buttonForeground: string;
    buttonHoverBackground: string;
    accentColor: string;
}

/**
 * ThemeManager - Manages VS Code color theme detection and synchronization
 * Extracts theme colors for syntax tokens and provides theme change notifications
 * Enhanced with validation and robust fallback mechanisms
 */
export class ThemeManager {
    private readonly _onDidChangeTheme = new vscode.EventEmitter<ThemeData>();
    public readonly onDidChangeTheme = this._onDidChangeTheme.event;
    
    private currentThemeData: ThemeData | null = null;
    private disposables: vscode.Disposable[] = [];
    private customThemeOverrides: { [key: string]: string } = {};

    constructor() {
        // Listen for theme changes
        this.disposables.push(
            vscode.window.onDidChangeActiveColorTheme(this.handleThemeChange.bind(this))
        );
        
        // Initialize with current theme
        this.updateThemeData();
        
        // Load custom theme overrides from settings
        this.loadCustomThemeOverrides();
    }

    /**
     * Get the current theme data
     */
    public getThemeData(): ThemeData {
        if (!this.currentThemeData) {
            this.updateThemeData();
        }
        return this.currentThemeData!;
    }

    /**
     * Validate theme data completeness
     * Ensures all required fields are present and valid
     */
    public validateThemeData(theme: ThemeData): boolean {
        try {
            // Check required fields
            if (!theme.kind || !theme.colors || !theme.background || !theme.foreground) {
                return false;
            }

            // Validate kind
            if (!['light', 'dark', 'highContrast'].includes(theme.kind)) {
                return false;
            }

            // Validate colors is an object
            if (typeof theme.colors !== 'object' || Array.isArray(theme.colors)) {
                return false;
            }

            // Validate color format (basic hex check)
            const colorRegex = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
            if (!colorRegex.test(theme.background) || !colorRegex.test(theme.foreground)) {
                return false;
            }

            // Check for minimum required token types
            const requiredTokenTypes = ['comment', 'string', 'keyword', 'number', 'function'];
            for (const tokenType of requiredTokenTypes) {
                if (!theme.colors[tokenType]) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Theme validation error:', error);
            return false;
        }
    }

    /**
     * Handle theme change events
     */
    private handleThemeChange(theme: vscode.ColorTheme): void {
        console.log(`Theme changed to: ${theme.kind}`);
        this.updateThemeData();
        
        // Validate before firing event
        if (this.currentThemeData && this.validateThemeData(this.currentThemeData)) {
            this._onDidChangeTheme.fire(this.currentThemeData);
        } else {
            // If validation fails, use fallback
            console.warn('Theme validation failed, using fallback theme');
            this.currentThemeData = this.createFallbackTheme(theme.kind);
            this._onDidChangeTheme.fire(this.currentThemeData);
        }
    }

    /**
     * Update theme data from current active theme
     */
    private updateThemeData(): void {
        const theme = vscode.window.activeColorTheme;
        this.currentThemeData = this.extractThemeData(theme);
        
        // Validate and fallback if needed
        if (!this.validateThemeData(this.currentThemeData)) {
            console.warn('Extracted theme data invalid, using fallback');
            this.currentThemeData = this.createFallbackTheme(theme.kind);
        }
    }

    /**
     * Extract theme data from VS Code ColorTheme
     */
    private extractThemeData(theme: vscode.ColorTheme): ThemeData {
        const kind = this.mapThemeKind(theme.kind);
        
        // Extract token colors with fallback approach
        let colors = this.extractTokenColors(kind);
        
        // Apply custom theme overrides
        colors = { ...colors, ...this.customThemeOverrides };
        
        // Ensure all colors are valid
        colors = this.validateAndFixColors(colors, kind);
        
        return {
            kind,
            colors,
            background: this.getBackgroundColor(kind),
            foreground: this.getForegroundColor(kind),
            borderColor: this.getBorderColor(kind),
            borderColorSubtle: this.getBorderColorSubtle(kind),
            buttonBackground: this.getButtonBackground(kind),
            buttonForeground: this.getButtonForeground(kind),
            buttonHoverBackground: this.getButtonHoverBackground(kind),
            accentColor: this.getAccentColor(kind)
        };
    }

    /**
     * Create fallback theme for partially defined or corrupted themes
     */
    private createFallbackTheme(kind: vscode.ColorThemeKind): ThemeData {
        const mappedKind = this.mapThemeKind(kind);
        
        return {
            kind: mappedKind,
            colors: this.extractTokenColors(mappedKind),
            background: this.getBackgroundColor(mappedKind),
            foreground: this.getForegroundColor(mappedKind),
            borderColor: this.getBorderColor(mappedKind),
            borderColorSubtle: this.getBorderColorSubtle(mappedKind),
            buttonBackground: this.getButtonBackground(mappedKind),
            buttonForeground: this.getButtonForeground(mappedKind),
            buttonHoverBackground: this.getButtonHoverBackground(mappedKind),
            accentColor: this.getAccentColor(mappedKind)
        };
    }

    /**
     * Validate and fix color values
     */
    private validateAndFixColors(
        colors: { [key: string]: string },
        kind: 'light' | 'dark' | 'highContrast'
    ): { [key: string]: string } {
        const colorRegex = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
        const fallbackColors = this.extractTokenColors(kind);
        const fixedColors: { [key: string]: string } = {};

        for (const [key, value] of Object.entries(colors)) {
            if (colorRegex.test(value)) {
                fixedColors[key] = value;
            } else {
                // Use fallback color if invalid
                fixedColors[key] = fallbackColors[key] || this.getForegroundColor(kind);
            }
        }

        // Ensure all required token types are present
        const requiredTypes = [
            'comment', 'string', 'keyword', 'number', 'function',
            'class', 'variable', 'constant', 'operator', 'type',
            'parameter', 'property', 'punctuation', 'regexp'
        ];

        for (const type of requiredTypes) {
            if (!fixedColors[type]) {
                fixedColors[type] = fallbackColors[type] || this.getForegroundColor(kind);
            }
        }

        return fixedColors;
    }

    /**
     * Load custom theme overrides from extension settings
     */
    private loadCustomThemeOverrides(): void {
        try {
            const config = vscode.workspace.getConfiguration('markdownCodeBlockHighlighter');
            const overrides = config.get<{ [key: string]: string }>('themeOverrides');
            
            if (overrides && typeof overrides === 'object') {
                this.customThemeOverrides = overrides;
                console.log('Loaded custom theme overrides:', Object.keys(overrides).length);
            }
        } catch (error) {
            console.warn('Failed to load custom theme overrides:', error);
        }
    }

    /**
     * Map VS Code ColorThemeKind to our simplified theme kind
     */
    private mapThemeKind(kind: vscode.ColorThemeKind): 'light' | 'dark' | 'highContrast' {
        switch (kind) {
            case vscode.ColorThemeKind.Light:
                return 'light';
            case vscode.ColorThemeKind.Dark:
                return 'dark';
            case vscode.ColorThemeKind.HighContrast:
            case vscode.ColorThemeKind.HighContrastLight:
                return 'highContrast';
            default:
                return 'dark';
        }
    }

    /**
     * Extract token colors based on theme kind with enhanced fallbacks
     * These are representative colors that work well across most themes
     */
    private extractTokenColors(kind: 'light' | 'dark' | 'highContrast'): { [key: string]: string } {
        // Enhanced fallback color schemes for different theme kinds
        if (kind === 'light') {
            return {
                'comment': '#008000',           // Green
                'string': '#a31515',            // Red
                'keyword': '#0000ff',           // Blue
                'number': '#098658',            // Teal
                'function': '#795e26',          // Brown
                'class': '#267f99',             // Cyan
                'variable': '#001080',          // Dark blue
                'constant': '#0070c1',          // Blue
                'operator': '#000000',          // Black
                'type': '#267f99',              // Cyan
                'parameter': '#001080',         // Dark blue
                'property': '#001080',          // Dark blue
                'punctuation': '#000000',       // Black
                'regexp': '#811f3f',            // Dark red
                'storage': '#0000ff',           // Blue
                'support': '#267f99',           // Cyan
                'entity': '#795e26',            // Brown
                'tag': '#800000',               // Maroon
                'attribute': '#ff0000',         // Red
                'markup.heading': '#0000ff',    // Blue
                'markup.bold': '#000000',       // Black
                'markup.italic': '#000000',     // Black
                'invalid': '#cd3131',           // Red
                'namespace': '#267f99',         // Cyan
                'enumMember': '#0070c1',        // Blue
                'decorator': '#795e26',         // Brown
                'label': '#0000ff',             // Blue
            };
        } else if (kind === 'dark') {
            return {
                'comment': '#6a9955',           // Green
                'string': '#ce9178',            // Orange
                'keyword': '#569cd6',           // Light blue
                'number': '#b5cea8',            // Light green
                'function': '#dcdcaa',          // Yellow
                'class': '#4ec9b0',             // Cyan
                'variable': '#9cdcfe',          // Light blue
                'constant': '#4fc1ff',          // Bright blue
                'operator': '#d4d4d4',          // Light gray
                'type': '#4ec9b0',              // Cyan
                'parameter': '#9cdcfe',         // Light blue
                'property': '#9cdcfe',          // Light blue
                'punctuation': '#d4d4d4',       // Light gray
                'regexp': '#d16969',            // Light red
                'storage': '#569cd6',           // Light blue
                'support': '#4ec9b0',           // Cyan
                'entity': '#dcdcaa',            // Yellow
                'tag': '#569cd6',               // Light blue
                'attribute': '#9cdcfe',         // Light blue
                'markup.heading': '#569cd6',    // Light blue
                'markup.bold': '#d4d4d4',       // Light gray
                'markup.italic': '#d4d4d4',     // Light gray
                'invalid': '#f44747',           // Red
                'namespace': '#4ec9b0',         // Cyan
                'enumMember': '#4fc1ff',        // Bright blue
                'decorator': '#dcdcaa',         // Yellow
                'label': '#569cd6',             // Light blue
            };
        } else { // highContrast
            return {
                'comment': '#7ca668',           // Green
                'string': '#ce9178',            // Orange
                'keyword': '#569cd6',           // Light blue
                'number': '#b5cea8',            // Light green
                'function': '#dcdcaa',          // Yellow
                'class': '#4ec9b0',             // Cyan
                'variable': '#ffffff',          // White
                'constant': '#4fc1ff',          // Bright blue
                'operator': '#ffffff',          // White
                'type': '#4ec9b0',              // Cyan
                'parameter': '#ffffff',         // White
                'property': '#ffffff',          // White
                'punctuation': '#ffffff',       // White
                'regexp': '#d16969',            // Light red
                'storage': '#569cd6',           // Light blue
                'support': '#4ec9b0',           // Cyan
                'entity': '#dcdcaa',            // Yellow
                'tag': '#569cd6',               // Light blue
                'attribute': '#ffffff',         // White
                'markup.heading': '#569cd6',    // Light blue
                'markup.bold': '#ffffff',       // White
                'markup.italic': '#ffffff',     // White
                'invalid': '#ff0000',           // Red
                'namespace': '#4ec9b0',         // Cyan
                'enumMember': '#4fc1ff',        // Bright blue
                'decorator': '#dcdcaa',         // Yellow
                'label': '#569cd6',             // Light blue
            };
        }
    }

    /**
     * Get background color for theme kind
     */
    private getBackgroundColor(kind: 'light' | 'dark' | 'highContrast'): string {
        switch (kind) {
            case 'light':
                return '#ffffff';
            case 'dark':
                return '#1e1e1e';
            case 'highContrast':
                return '#000000';
        }
    }

    /**
     * Get foreground color for theme kind
     */
    private getForegroundColor(kind: 'light' | 'dark' | 'highContrast'): string {
        switch (kind) {
            case 'light':
                return '#000000';
            case 'dark':
                return '#d4d4d4';
            case 'highContrast':
                return '#ffffff';
        }
    }

    /**
     * Get border color for theme kind
     */
    private getBorderColor(kind: 'light' | 'dark' | 'highContrast'): string {
        switch (kind) {
            case 'light':
                return '#d0d0d0';
            case 'dark':
                return '#404040';
            case 'highContrast':
                return '#6fc3df';
        }
    }

    /**
     * Get subtle border color for theme kind
     */
    private getBorderColorSubtle(kind: 'light' | 'dark' | 'highContrast'): string {
        switch (kind) {
            case 'light':
                return '#e0e0e0';
            case 'dark':
                return '#303030';
            case 'highContrast':
                return '#4c94b0';
        }
    }

    /**
     * Get button background color for theme kind
     */
    private getButtonBackground(kind: 'light' | 'dark' | 'highContrast'): string {
        switch (kind) {
            case 'light':
                return '#f3f3f3cc';
            case 'dark':
                return '#252526cc';
            case 'highContrast':
                return '#000000cc';
        }
    }

    /**
     * Get button foreground color for theme kind
     */
    private getButtonForeground(kind: 'light' | 'dark' | 'highContrast'): string {
        switch (kind) {
            case 'light':
                return '#333333';
            case 'dark':
                return '#cccccc';
            case 'highContrast':
                return '#ffffff';
        }
    }

    /**
     * Get button hover background color for theme kind
     */
    private getButtonHoverBackground(kind: 'light' | 'dark' | 'highContrast'): string {
        switch (kind) {
            case 'light':
                return '#e8e8e8';
            case 'dark':
                return '#2a2d2e';
            case 'highContrast':
                return '#1a1a1a';
        }
    }

    /**
     * Get accent color for theme kind
     */
    private getAccentColor(kind: 'light' | 'dark' | 'highContrast'): string {
        switch (kind) {
            case 'light':
                return '#007acc';
            case 'dark':
                return '#569cd6';
            case 'highContrast':
                return '#6fc3df';
        }
    }

    /**
     * Set custom theme overrides programmatically
     */
    public setThemeOverrides(overrides: { [key: string]: string }): void {
        this.customThemeOverrides = { ...this.customThemeOverrides, ...overrides };
        this.updateThemeData();
        
        if (this.currentThemeData) {
            this._onDidChangeTheme.fire(this.currentThemeData);
        }
    }

    /**
     * Clear custom theme overrides
     */
    public clearThemeOverrides(): void {
        this.customThemeOverrides = {};
        this.updateThemeData();
        
        if (this.currentThemeData) {
            this._onDidChangeTheme.fire(this.currentThemeData);
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this._onDidChangeTheme.dispose();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
