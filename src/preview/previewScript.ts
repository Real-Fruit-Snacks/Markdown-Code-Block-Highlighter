/**
 * Preview Script - Runs in the Markdown preview webview context
 * SELF-CONTAINED: Performs all highlighting logic without extension host communication
 * 
 * Architecture Note: This script runs in a webview owned by VS Code's markdown-language-features
 * extension. We do NOT have access to message passing with our extension host. Therefore, all
 * theme detection and tokenization must happen here in the browser context.
 */

(function() {
    'use strict';

    console.log('=== MCBH: Preview script loaded ===');
    console.log('MCBH: Running in:', window.location.href);

    // Configuration (could be enhanced to read from settings via injected script tag)
    const config = {
        showBorder: true,
        borderWidth: 1,
        borderRadius: 4,
        showCopyButton: true,
        copyButtonPosition: 'top-right' as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
        copyButtonVisibility: 'hover' as 'hover' | 'always'
    };

    // Track processed code blocks to avoid duplicate processing
    const processedBlocks = new Set<string>();

    // Dynamic style element for theme-aware CSS
    let styleElement: HTMLStyleElement | null = null;

    // Current theme data
    interface ThemeData {
        kind: 'light' | 'dark' | 'highContrast';
        colors: { [key: string]: string };
        background: string;
        foreground: string;
        borderColor: string;
        borderColorSubtle: string;
        buttonBackground: string;
        buttonForeground: string;
        buttonHoverBackground: string;
        accentColor: string;
    }

    let currentTheme: ThemeData | null = null;

    /**
     * Helper to get CSS variable with fallback
     * Reads VS Code CSS variables from document.body styles
     */
    function getCSSVar(varName: string, fallback: string): string {
        const bodyStyles = getComputedStyle(document.body);
        const value = bodyStyles.getPropertyValue(varName).trim();
        return value || fallback;
    }

    /**
     * Initialize the preview script
     */
    function initialize(): void {
        try {
            console.log('MCBH: Initializing preview script...');
            
            // Detect current theme from CSS variables
            currentTheme = detectThemeFromDOM();
            console.log('MCBH: Detected theme:', currentTheme.kind);
            
            // Initialize dynamic styles
            initializeDynamicStyles();
            
            // Scan and enhance code blocks
            scanAndEnhanceCodeBlocks();
            
            // Observe DOM changes for dynamically added content
            observeDOMChanges();
            
            // Watch for theme changes
            observeThemeChanges();
            
            console.log('MCBH: Initialization complete');
        } catch (error) {
            console.error('MCBH: Initialization failed:', error);
        }
    }

    /**
     * Detect theme colors from VS Code CSS variables
     */
    function detectThemeFromDOM(): ThemeData {
        const bodyStyles = getComputedStyle(document.body);

        // Detect theme kind based on background color
        const bgColor = getCSSVar('--vscode-editor-background', '#1e1e1e');
        const kind = detectThemeKind(bgColor);

        console.log('MCBH: Background color:', bgColor, '-> Theme kind:', kind);

        // Enhanced border color detection for theme-specific colors
        const borderColor = detectBorderColor(bodyStyles, kind);
        console.log('MCBH: Selected border color:', borderColor.color, '(from:', borderColor.source + ')');

        return {
            kind,
            colors: extractTokenColorsFromTheme(kind),
            background: getCSSVar('--vscode-editor-background', kind === 'light' ? '#ffffff' : '#1e1e1e'),
            foreground: getCSSVar('--vscode-editor-foreground', kind === 'light' ? '#000000' : '#d4d4d4'),
            borderColor: borderColor.color,
            borderColorSubtle: getCSSVar('--vscode-widget-border', kind === 'light' ? '#e0e0e0' : '#303030'),
            buttonBackground: getCSSVar('--vscode-button-background', kind === 'light' ? '#f3f3f3cc' : '#252526cc'),
            buttonForeground: getCSSVar('--vscode-button-foreground', kind === 'light' ? '#333333' : '#cccccc'),
            buttonHoverBackground: getCSSVar('--vscode-button-hoverBackground', kind === 'light' ? '#e8e8e8' : '#2a2d2e'),
            accentColor: getCSSVar('--vscode-focusBorder', kind === 'light' ? '#007acc' : '#569cd6')
        };
    }

    /**
     * Detect optimal border color from theme CSS variables
     * Prioritizes theme accent colors for custom themes like Catppuccin
     */
    function detectBorderColor(styles: CSSStyleDeclaration, kind: 'light' | 'dark' | 'highContrast'): { color: string; source: string } {
        const defaultLight = '#d0d0d0';
        const defaultDark = '#404040';
        const defaultColor = kind === 'light' ? defaultLight : defaultDark;

        // Priority order for border color detection:
        // 1. focusBorder - theme's primary accent color (best for custom themes)
        // 2. textLink.foreground - theme's link color
        // 3. editorWidget.border - widget border color
        // 4. button.background - button background (often theme-colored)
        // 5. panel.border - generic panel border
        // 6. fallback to gray

        const candidates = [
            { name: '--vscode-focusBorder', source: 'focusBorder' },
            { name: '--vscode-textLink-foreground', source: 'textLink.foreground' },
            { name: '--vscode-editorWidget-border', source: 'editorWidget.border' },
            { name: '--vscode-button-background', source: 'button.background' },
            { name: '--vscode-panel-border', source: 'panel.border' }
        ];

        // Try each candidate in order
        for (const candidate of candidates) {
            const rawColor = styles.getPropertyValue(candidate.name).trim();
            if (!rawColor) continue;

            // Parse and validate the color
            const validation = validateBorderColor(rawColor, kind);
            
            if (validation.isValid) {
                // For highly saturated colors, reduce saturation slightly for borders
                const finalColor = validation.needsSaturationReduction
                    ? reduceSaturation(rawColor, 0.7)
                    : rawColor;
                
                console.log(`MCBH: Border color from ${candidate.source}: ${rawColor} -> ${finalColor}`);
                return { color: finalColor, source: candidate.source };
            } else {
                console.log(`MCBH: Rejected ${candidate.source}: ${rawColor} (${validation.reason})`);
            }
        }

        // Fallback to default
        console.log('MCBH: Using default border color:', defaultColor);
        return { color: defaultColor, source: 'default' };
    }

    /**
     * Validate if a color is suitable for use as a border
     */
    function validateBorderColor(color: string, kind: 'light' | 'dark' | 'highContrast'): {
        isValid: boolean;
        reason?: string;
        needsSaturationReduction?: boolean;
    } {
        // Parse the color
        const parsed = parseColorWithAlpha(color);
        if (!parsed) {
            return { isValid: false, reason: 'failed to parse' };
        }

        // Check transparency - border should be visible (alpha >= 0.3)
        if (parsed.a < 0.3) {
            return { isValid: false, reason: `too transparent (alpha: ${parsed.a.toFixed(2)})` };
        }

        // Calculate saturation
        const max = Math.max(parsed.r, parsed.g, parsed.b);
        const min = Math.min(parsed.r, parsed.g, parsed.b);
        const saturation = max === 0 ? 0 : (max - min) / max;

        // Very saturated colors (like Catppuccin pink) should be slightly reduced
        const needsSaturationReduction = saturation > 0.7;

        return {
            isValid: true,
            needsSaturationReduction
        };
    }

    /**
     * Parse color string to RGBA
     */
    function parseColorWithAlpha(color: string): { r: number; g: number; b: number; a: number } | null {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            if (hex.length === 6) {
                return {
                    r: parseInt(hex.substr(0, 2), 16),
                    g: parseInt(hex.substr(2, 2), 16),
                    b: parseInt(hex.substr(4, 2), 16),
                    a: 1.0
                };
            } else if (hex.length === 8) {
                return {
                    r: parseInt(hex.substr(0, 2), 16),
                    g: parseInt(hex.substr(2, 2), 16),
                    b: parseInt(hex.substr(4, 2), 16),
                    a: parseInt(hex.substr(6, 2), 16) / 255
                };
            }
        }
        
        // Handle rgba colors
        const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbaMatch) {
            return {
                r: parseInt(rgbaMatch[1]),
                g: parseInt(rgbaMatch[2]),
                b: parseInt(rgbaMatch[3]),
                a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0
            };
        }

        return null;
    }

    /**
     * Reduce saturation of a color by a factor
     */
    function reduceSaturation(color: string, factor: number): string {
        const parsed = parseColorWithAlpha(color);
        if (!parsed) return color;

        // Convert RGB to HSL
        const r = parsed.r / 255;
        const g = parsed.g / 255;
        const b = parsed.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;

        if (max === min) {
            // Grayscale - no saturation to reduce
            return color;
        }

        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        // Reduce saturation
        const newS = s * factor;

        // Convert back to RGB
        const hue = (() => {
            if (max === r) return ((g - b) / d + (g < b ? 6 : 0)) / 6;
            if (max === g) return ((b - r) / d + 2) / 6;
            return ((r - g) / d + 4) / 6;
        })();

        const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            const hue2rgb = (t: number): number => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            return [
                Math.round(hue2rgb(h + 1/3) * 255),
                Math.round(hue2rgb(h) * 255),
                Math.round(hue2rgb(h - 1/3) * 255)
            ];
        };

        const [newR, newG, newB] = hslToRgb(hue, newS, l);

        // Return as rgba if original had alpha
        if (parsed.a < 1.0) {
            return `rgba(${newR}, ${newG}, ${newB}, ${parsed.a})`;
        }
        
        // Return as hex
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }

    /**
     * Detect theme kind from background color
     */
    function detectThemeKind(bgColor: string): 'light' | 'dark' | 'highContrast' {
        // Convert to RGB if needed
        const rgb = parseColor(bgColor);
        if (!rgb) return 'dark';

        // Calculate luminance
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

        console.log('MCBH: Background luminance:', luminance);

        // Check for high contrast (very dark or very light)
        if (luminance < 0.05 || luminance > 0.95) {
            return 'highContrast';
        }

        return luminance > 0.5 ? 'light' : 'dark';
    }

    /**
     * Parse color string to RGB
     */
    function parseColor(color: string): { r: number; g: number; b: number } | null {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            if (hex.length === 6) {
                return {
                    r: parseInt(hex.substr(0, 2), 16),
                    g: parseInt(hex.substr(2, 2), 16),
                    b: parseInt(hex.substr(4, 2), 16)
                };
            }
        }
        
        // Handle rgb/rgba colors
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            };
        }

        return null;
    }

    /**
     * Get token colors for theme kind
     */
    function extractTokenColorsFromTheme(kind: 'light' | 'dark' | 'highContrast'): { [key: string]: string } {
        if (kind === 'light') {
            return {
                'comment': '#008000',
                'string': '#a31515',
                'keyword': '#0000ff',
                'number': '#098658',
                'function': '#795e26',
                'class': '#267f99',
                'variable': '#001080',
                'constant': '#0070c1',
                'operator': '#000000',
                'type': '#267f99',
                'parameter': '#001080',
                'property': '#001080',
                'punctuation': '#000000',
                'regexp': '#811f3f'
            };
        } else if (kind === 'dark') {
            return {
                'comment': '#6a9955',
                'string': '#ce9178',
                'keyword': '#569cd6',
                'number': '#b5cea8',
                'function': '#dcdcaa',
                'class': '#4ec9b0',
                'variable': '#9cdcfe',
                'constant': '#4fc1ff',
                'operator': '#d4d4d4',
                'type': '#4ec9b0',
                'parameter': '#9cdcfe',
                'property': '#9cdcfe',
                'punctuation': '#d4d4d4',
                'regexp': '#d16969'
            };
        } else {
            return {
                'comment': '#7ca668',
                'string': '#ce9178',
                'keyword': '#569cd6',
                'number': '#b5cea8',
                'function': '#dcdcaa',
                'class': '#4ec9b0',
                'variable': '#ffffff',
                'constant': '#4fc1ff',
                'operator': '#ffffff',
                'type': '#4ec9b0',
                'parameter': '#ffffff',
                'property': '#ffffff',
                'punctuation': '#ffffff',
                'regexp': '#d16969'
            };
        }
    }

    /**
     * Initialize dynamic style element
     */
    function initializeDynamicStyles(): void {
        try {
            styleElement = document.createElement('style');
            styleElement.id = 'mcbh-dynamic-styles';
            document.head.appendChild(styleElement);
            updateDynamicStyles();
        } catch (error) {
            console.error('MCBH: Failed to initialize dynamic styles:', error);
        }
    }

    /**
     * Update dynamic CSS styles
     */
    function updateDynamicStyles(): void {
        if (!styleElement || !currentTheme) return;

        const borderStyle = config.showBorder
            ? `${config.borderWidth}px solid ${currentTheme.borderColor}`
            : 'none';

        const copyButtonOpacity = config.copyButtonVisibility === 'always' ? '1' : '0';
        const positionStyles = getPositionStyles(config.copyButtonPosition);

        styleElement.textContent = `
            .mcbh-code-container {
                position: relative;
                border: ${borderStyle};
                border-radius: ${config.borderRadius}px;
                margin: 1em 0;
                overflow: hidden;
                transition: border-color 0.2s ease;
            }
            
            .mcbh-code-container > pre {
                margin: 0;
                border-radius: 0;
            }
            
            .mcbh-copy-button {
                position: absolute;
                ${positionStyles}
                padding: 4px 8px;
                background: ${currentTheme.buttonBackground};
                color: ${currentTheme.buttonForeground};
                border: 1px solid ${currentTheme.borderColorSubtle};
                border-radius: 4px;
                cursor: pointer;
                opacity: ${copyButtonOpacity};
                transition: opacity 0.2s ease, background 0.2s ease, color 0.2s ease;
                font-size: 12px;
                z-index: 10;
            }
            
            .mcbh-code-container:hover .mcbh-copy-button {
                opacity: 1;
            }
            
            .mcbh-copy-button:hover {
                background: ${currentTheme.buttonHoverBackground};
            }
            
            .mcbh-copy-button.copied {
                color: ${currentTheme.buttonForeground} !important;
                background: ${currentTheme.buttonHoverBackground} !important;
                border-color: ${currentTheme.accentColor} !important;
                font-weight: 600;
            }
        `;
    }

    /**
     * Get position styles for copy button
     */
    function getPositionStyles(position: string): string {
        switch (position) {
            case 'top-left': return 'top: 8px; left: 8px;';
            case 'bottom-right': return 'bottom: 8px; right: 8px;';
            case 'bottom-left': return 'bottom: 8px; left: 8px;';
            default: return 'top: 8px; right: 8px;';
        }
    }

    /**
     * Scan and enhance all code blocks
     */
    function scanAndEnhanceCodeBlocks(): void {
        try {
            const codeBlocks = document.querySelectorAll('pre > code');
            console.log(`MCBH: Found ${codeBlocks.length} code blocks`);

            codeBlocks.forEach((codeElement) => {
                processCodeBlock(codeElement as HTMLElement);
            });
        } catch (error) {
            console.error('MCBH: Failed to scan code blocks:', error);
        }
    }

    /**
     * Process a single code block
     */
    function processCodeBlock(codeElement: HTMLElement): void {
        try {
            const blockId = getOrCreateBlockId(codeElement);

            if (processedBlocks.has(blockId)) {
                return;
            }

            const language = extractLanguage(codeElement);
            const code = codeElement.textContent || '';

            if (!code.trim()) {
                return;
            }

            console.log(`MCBH: Processing block ${blockId} (${language}, ${code.length} chars)`);

            // Mark as processed
            processedBlocks.add(blockId);

            // Tokenize and apply highlighting
            const tokens = tokenizeCode(code, language);
            applyHighlighting(codeElement, tokens);

            // Wrap in container and add copy button
            wrapCodeBlock(codeElement, code);

            console.log(`MCBH: Successfully highlighted block ${blockId}`);
        } catch (error) {
            console.error('MCBH: Failed to process code block:', error);
        }
    }

    /**
     * Get or create block ID
     */
    function getOrCreateBlockId(element: HTMLElement): string {
        let blockId = element.getAttribute('data-block-id');
        if (!blockId) {
            const code = element.textContent || '';
            blockId = `block-${simpleHash(code)}-${Date.now()}`;
            element.setAttribute('data-block-id', blockId);
        }
        return blockId;
    }

    /**
     * Extract language from code element
     */
    function extractLanguage(codeElement: Element): string {
        const className = codeElement.className;
        const match = className.match(/language-(\w+)/);
        return match ? match[1] : 'plaintext';
    }

    /**
     * Tokenize code using pattern-based approach
     */
    function tokenizeCode(code: string, language: string): Array<{ text: string; type: string }> {
        const tokens: Array<{ text: string; type: string }> = [];

        // Language-agnostic patterns
        const keywords = [
            'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case',
            'break', 'continue', 'const', 'let', 'var', 'class', 'interface', 'enum',
            'type', 'import', 'export', 'from', 'as', 'default', 'async', 'await',
            'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'extends',
            'implements', 'public', 'private', 'protected', 'static', 'readonly',
            'def', 'lambda', 'yield', 'raise', 'with', 'pass', 'assert', 'global',
            'in', 'is', 'not', 'and', 'or', 'true', 'false', 'null', 'undefined'
        ];

        const lines = code.split('\n');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const matches: Array<{ start: number; end: number; type: string }> = [];

            // Find comments
            let commentMatch: RegExpExecArray | null;
            const commentPattern = /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm;
            commentPattern.lastIndex = 0;
            while ((commentMatch = commentPattern.exec(line)) !== null) {
                matches.push({
                    start: commentMatch.index,
                    end: commentMatch.index + commentMatch[0].length,
                    type: 'comment'
                });
            }

            // Find strings
            let stringMatch: RegExpExecArray | null;
            const stringPattern = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
            stringPattern.lastIndex = 0;
            while ((stringMatch = stringPattern.exec(line)) !== null) {
                matches.push({
                    start: stringMatch.index,
                    end: stringMatch.index + stringMatch[0].length,
                    type: 'string'
                });
            }

            // Find numbers
            let numberMatch: RegExpExecArray | null;
            const numberPattern = /\b\d+\.?\d*\b/g;
            numberPattern.lastIndex = 0;
            while ((numberMatch = numberPattern.exec(line)) !== null) {
                matches.push({
                    start: numberMatch.index,
                    end: numberMatch.index + numberMatch[0].length,
                    type: 'number'
                });
            }

            // Find keywords
            const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
            keywordPattern.lastIndex = 0;
            while ((commentMatch = keywordPattern.exec(line)) !== null) {
                matches.push({
                    start: commentMatch.index,
                    end: commentMatch.index + commentMatch[0].length,
                    type: 'keyword'
                });
            }

            // Sort and remove overlaps
            matches.sort((a, b) => a.start - b.start);
            const filtered: typeof matches = [];
            let lastEnd = -1;
            for (const m of matches) {
                if (m.start >= lastEnd) {
                    filtered.push(m);
                    lastEnd = m.end;
                }
            }

            // Create tokens
            let position = 0;
            for (const m of filtered) {
                if (m.start > position) {
                    tokens.push({
                        text: line.substring(position, m.start),
                        type: 'text'
                    });
                }
                tokens.push({
                    text: line.substring(m.start, m.end),
                    type: m.type
                });
                position = m.end;
            }

            if (position < line.length) {
                tokens.push({
                    text: line.substring(position),
                    type: 'text'
                });
            }

            // Add newline
            if (lineIndex < lines.length - 1) {
                tokens.push({ text: '\n', type: 'text' });
            }
        }

        return tokens;
    }

    /**
     * Apply syntax highlighting to code element
     */
    function applyHighlighting(codeElement: HTMLElement, tokens: Array<{ text: string; type: string }>): void {
        if (!currentTheme) return;

        // Clear existing content
        codeElement.innerHTML = '';

        // Create spans for each token
        const fragment = document.createDocumentFragment();
        for (const token of tokens) {
            const span = document.createElement('span');
            span.textContent = token.text;
            
            const color = getColorForTokenType(token.type);
            if (color) {
                span.style.color = color;
            }

            fragment.appendChild(span);
        }

        codeElement.appendChild(fragment);
        codeElement.setAttribute('data-highlighted', 'true');

        // Apply background to pre element
        const preElement = codeElement.parentElement as HTMLPreElement;
        if (preElement && preElement.tagName === 'PRE') {
            preElement.style.backgroundColor = currentTheme.background;
            preElement.style.color = currentTheme.foreground;
        }
    }

    /**
     * Get color for token type
     */
    function getColorForTokenType(tokenType: string): string | null {
        if (!currentTheme) return null;

        const typeMap: { [key: string]: string } = {
            'comment': 'comment',
            'string': 'string',
            'keyword': 'keyword',
            'number': 'number',
            'function': 'function',
            'class': 'class',
            'variable': 'variable',
            'constant': 'constant',
            'operator': 'operator',
            'type': 'type',
            'punctuation': 'punctuation',
            'regexp': 'regexp'
        };

        const mappedType = typeMap[tokenType];
        return mappedType ? currentTheme.colors[mappedType] : null;
    }

    /**
     * Wrap code block in container and add copy button
     */
    function wrapCodeBlock(codeElement: HTMLElement, code: string): void {
        const preElement = codeElement.parentElement;
        if (!preElement || preElement.tagName !== 'PRE') return;

        // Check if already wrapped
        if (preElement.parentElement?.classList.contains('mcbh-code-container')) {
            return;
        }

        // Create container
        const container = document.createElement('div');
        container.className = 'mcbh-code-container';

        // Create copy button
        if (config.showCopyButton) {
            const copyButton = document.createElement('button');
            copyButton.className = 'mcbh-copy-button';
            copyButton.textContent = 'Copy';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');
            
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(code).then(() => {
                    copyButton.textContent = 'Copied!';
                    copyButton.classList.add('copied');
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                        copyButton.classList.remove('copied');
                    }, 2000);
                }).catch((error) => {
                    console.error('MCBH: Failed to copy code:', error);
                    copyButton.textContent = 'Failed';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 2000);
                });
            });

            container.appendChild(copyButton);
        }

        // Wrap pre element
        preElement.parentElement?.insertBefore(container, preElement);
        container.appendChild(preElement);
    }

    /**
     * Observe DOM changes
     */
    function observeDOMChanges(): void {
        try {
            const observer = new MutationObserver(debounce(() => {
                scanAndEnhanceCodeBlocks();
            }, 250));

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } catch (error) {
            console.error('MCBH: Failed to observe DOM:', error);
        }
    }

    /**
     * Observe theme changes
     */
    function observeThemeChanges(): void {
        try {
            const observer = new MutationObserver(() => {
                const newTheme = detectThemeFromDOM();
                if (newTheme.kind !== currentTheme?.kind) {
                    console.log('MCBH: Theme changed:', currentTheme?.kind, '->', newTheme.kind);
                    currentTheme = newTheme;
                    updateDynamicStyles();
                    
                    // Re-process all code blocks
                    processedBlocks.clear();
                    scanAndEnhanceCodeBlocks();
                }
            });

            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        } catch (error) {
            console.error('MCBH: Failed to observe theme changes:', error);
        }
    }

    /**
     * Simple hash function
     */
    function simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Debounce function
     */
    function debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: number | null = null;

        return function(...args: Parameters<T>) {
            if (timeout !== null) {
                clearTimeout(timeout);
            }

            timeout = window.setTimeout(() => {
                func(...args);
                timeout = null;
            }, wait);
        };
    }

    // Initialize when DOM is ready
    console.log('MCBH: Script loaded, readyState =', document.readyState);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
