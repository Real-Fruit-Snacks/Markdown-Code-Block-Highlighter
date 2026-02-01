import * as vscode from 'vscode';
import { ThemeData } from './themeManager';

/**
 * Token interface representing a single syntax token
 */
export interface Token {
    text: string;
    scopes: string[];
    startIndex: number;
    endIndex: number;
    color?: string;
}

/**
 * Tokenized code structure
 */
export interface TokenizedCode {
    language: string;
    tokens: Token[];
}

/**
 * TokenizationService - Tokenizes code blocks using VS Code's language services
 * Maps tokens to theme colors for syntax highlighting
 * Enhanced with size limits, streaming, and robust fallback mechanisms
 */
export class TokenizationService {
    private outputChannel: vscode.OutputChannel;
    private readonly STREAMING_CHUNK_SIZE = 500; // Process in chunks of 500 lines
    private readonly DEFAULT_TIMEOUT = 5000; // 5 seconds default timeout

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Markdown Code Block Highlighter');
    }

    /**
     * Check if a code block is considered large
     */
    public isLargeBlock(code: string, maxBlockSize: number = 10000): boolean {
        return code.length > maxBlockSize;
    }

    /**
     * Tokenize code block and apply theme colors with timeout protection
     */
    public async tokenize(
        code: string,
        language: string,
        themeData: ThemeData,
        maxBlockSize: number = 10000,
        timeout: number = this.DEFAULT_TIMEOUT
    ): Promise<TokenizedCode> {
        try {
            // Check if block exceeds size limit
            if (this.isLargeBlock(code, maxBlockSize)) {
                this.outputChannel.appendLine(
                    `Code block is large (${code.length} chars), using streaming tokenization`
                );
                return await this.tokenizeWithStreaming(code, language, themeData, timeout);
            }

            // Normal tokenization with timeout
            return await this.tokenizeWithTimeout(code, language, themeData, timeout);
        } catch (error) {
            this.outputChannel.appendLine(`Error tokenizing code (${language}): ${error}`);
            // Return fallback with minimal highlighting
            return this.createMinimalHighlighting(code, language, themeData);
        }
    }

    /**
     * Tokenize with timeout protection
     */
    private async tokenizeWithTimeout(
        code: string,
        language: string,
        themeData: ThemeData,
        timeout: number
    ): Promise<TokenizedCode> {
        return Promise.race([
            this.tokenizeInternal(code, language, themeData),
            new Promise<TokenizedCode>((_, reject) => 
                setTimeout(() => reject(new Error('Tokenization timeout')), timeout)
            )
        ]).catch((error) => {
            this.outputChannel.appendLine(`Tokenization timeout or error: ${error}`);
            return this.createMinimalHighlighting(code, language, themeData);
        });
    }

    /**
     * Internal tokenization with three-tier fallback strategy
     */
    private async tokenizeInternal(
        code: string,
        language: string,
        themeData: ThemeData
    ): Promise<TokenizedCode> {
        // Normalize language identifier
        const normalizedLanguage = this.normalizeLanguage(language);
        
        // Validate language exists
        const validLanguage = await this.validateLanguage(normalizedLanguage);
        
        // Create temporary document for tokenization
        const document = await vscode.workspace.openTextDocument({
            content: code,
            language: validLanguage
        });

        // Three-tier fallback strategy:
        // 1. Try VS Code semantic tokens
        const semanticResult = await this.trySemanticTokens(document, themeData);
        if (semanticResult) {
            return { language: validLanguage, tokens: semanticResult };
        }

        // 2. Try pattern-based tokenization
        const patternResult = this.tryPatternTokenization(code, validLanguage, themeData);
        if (patternResult && patternResult.length > 0) {
            return { language: validLanguage, tokens: patternResult };
        }

        // 3. Fall back to minimal highlighting
        return this.createMinimalHighlighting(code, validLanguage, themeData);
    }

    /**
     * Tokenize large blocks using streaming approach
     */
    private async tokenizeWithStreaming(
        code: string,
        language: string,
        themeData: ThemeData,
        timeout: number
    ): Promise<TokenizedCode> {
        const lines = code.split('\n');
        const tokens: Token[] = [];
        let currentPosition = 0;

        // Process in chunks
        for (let i = 0; i < lines.length; i += this.STREAMING_CHUNK_SIZE) {
            const chunk = lines.slice(i, i + this.STREAMING_CHUNK_SIZE).join('\n');
            
            try {
                // Tokenize chunk with reduced timeout
                const chunkResult = await this.tokenizeWithTimeout(
                    chunk,
                    language,
                    themeData,
                    timeout / 10 // Reduced timeout per chunk
                );

                // Adjust token positions
                for (const token of chunkResult.tokens) {
                    tokens.push({
                        ...token,
                        startIndex: token.startIndex + currentPosition,
                        endIndex: token.endIndex + currentPosition
                    });
                }

                currentPosition += chunk.length;
                
                // Add newline if not last chunk
                if (i + this.STREAMING_CHUNK_SIZE < lines.length) {
                    currentPosition += 1;
                }
            } catch (error) {
                // On chunk error, add as plain text
                tokens.push({
                    text: chunk,
                    scopes: ['text'],
                    startIndex: currentPosition,
                    endIndex: currentPosition + chunk.length,
                    color: themeData.foreground
                });
                currentPosition += chunk.length + 1;
            }
        }

        return {
            language: this.normalizeLanguage(language),
            tokens
        };
    }

    /**
     * Try to tokenize using VS Code semantic tokens (Tier 1)
     */
    private async trySemanticTokens(
        document: vscode.TextDocument,
        themeData: ThemeData
    ): Promise<Token[] | null> {
        try {
            const semanticTokens = await vscode.commands.executeCommand<vscode.SemanticTokens>(
                'vscode.provideDocumentSemanticTokens',
                document.uri
            );

            if (semanticTokens && semanticTokens.data.length > 0) {
                const text = document.getText();
                return this.parseSemanticTokens(text, semanticTokens, themeData);
            }
        } catch (error) {
            this.outputChannel.appendLine(`Semantic tokens not available: ${error}`);
        }

        return null;
    }

    /**
     * Try pattern-based tokenization (Tier 2)
     */
    private tryPatternTokenization(
        text: string,
        language: string,
        themeData: ThemeData
    ): Token[] | null {
        try {
            return this.simpleTokenize(text, language, themeData);
        } catch (error) {
            this.outputChannel.appendLine(`Pattern tokenization failed: ${error}`);
            return null;
        }
    }

    /**
     * Create minimal highlighting for code (Tier 3 fallback)
     * Highlights only basic keywords and common syntax elements
     */
    public createMinimalHighlighting(code: string, language: string, themeData: ThemeData): TokenizedCode {
        const tokens: Token[] = [];
        
        // Common keywords across languages
        const keywords = [
            'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case',
            'break', 'continue', 'const', 'let', 'var', 'class', 'interface', 'enum',
            'type', 'import', 'export', 'from', 'as', 'default', 'async', 'await',
            'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'extends',
            'implements', 'public', 'private', 'protected', 'static', 'readonly',
            'def', 'lambda', 'yield', 'raise', 'with', 'pass', 'assert', 'global',
            'nonlocal', 'in', 'is', 'not', 'and', 'or', 'true', 'false', 'null',
            'undefined', 'void', 'any', 'boolean', 'number', 'string', 'object'
        ];

        const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
        const stringPattern = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
        const commentPattern = /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm;
        const numberPattern = /\b\d+\.?\d*\b/g;

        let position = 0;
        const lines = code.split('\n');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const matches: Array<{ start: number; end: number; type: string }> = [];

            // Find all matches
            let match;
            
            // Comments
            commentPattern.lastIndex = 0;
            while ((match = commentPattern.exec(line)) !== null) {
                matches.push({ start: match.index, end: match.index + match[0].length, type: 'comment' });
            }

            // Strings
            stringPattern.lastIndex = 0;
            while ((match = stringPattern.exec(line)) !== null) {
                matches.push({ start: match.index, end: match.index + match[0].length, type: 'string' });
            }

            // Keywords
            keywordPattern.lastIndex = 0;
            while ((match = keywordPattern.exec(line)) !== null) {
                matches.push({ start: match.index, end: match.index + match[0].length, type: 'keyword' });
            }

            // Numbers
            numberPattern.lastIndex = 0;
            while ((match = numberPattern.exec(line)) !== null) {
                matches.push({ start: match.index, end: match.index + match[0].length, type: 'number' });
            }

            // Sort matches by position
            matches.sort((a, b) => a.start - b.start);

            // Remove overlapping matches (prioritize first match)
            const filteredMatches: typeof matches = [];
            let lastEnd = -1;
            for (const m of matches) {
                if (m.start >= lastEnd) {
                    filteredMatches.push(m);
                    lastEnd = m.end;
                }
            }

            // Create tokens
            let linePosition = 0;
            for (const m of filteredMatches) {
                // Add plain text before match
                if (m.start > linePosition) {
                    tokens.push({
                        text: line.substring(linePosition, m.start),
                        scopes: ['text'],
                        startIndex: position + linePosition,
                        endIndex: position + m.start,
                        color: themeData.foreground
                    });
                }

                // Add matched token
                tokens.push({
                    text: line.substring(m.start, m.end),
                    scopes: [m.type],
                    startIndex: position + m.start,
                    endIndex: position + m.end,
                    color: this.getColorForTokenType(m.type, themeData)
                });

                linePosition = m.end;
            }

            // Add remaining text
            if (linePosition < line.length) {
                tokens.push({
                    text: line.substring(linePosition),
                    scopes: ['text'],
                    startIndex: position + linePosition,
                    endIndex: position + line.length,
                    color: themeData.foreground
                });
            }

            position += line.length;

            // Add newline
            if (lineIndex < lines.length - 1) {
                tokens.push({
                    text: '\n',
                    scopes: ['text'],
                    startIndex: position,
                    endIndex: position + 1,
                    color: themeData.foreground
                });
                position += 1;
            }
        }

        return {
            language,
            tokens: tokens.length > 0 ? tokens : [{
                text: code,
                scopes: ['text'],
                startIndex: 0,
                endIndex: code.length,
                color: themeData.foreground
            }]
        };
    }

    /**
     * Validate and detect language, fallback to plaintext if invalid
     */
    private async validateLanguage(language: string): Promise<string> {
        try {
            // Get available languages
            const languages = await vscode.languages.getLanguages();
            
            if (languages.includes(language)) {
                return language;
            }

            // Try common aliases
            const normalized = this.normalizeLanguage(language);
            if (languages.includes(normalized)) {
                return normalized;
            }

            // Fallback to plaintext
            this.outputChannel.appendLine(`Unknown language: ${language}, using plaintext`);
            return 'plaintext';
        } catch (error) {
            this.outputChannel.appendLine(`Language validation failed: ${error}`);
            return 'plaintext';
        }
    }

    /**
     * Parse semantic tokens from VS Code
     */
    private parseSemanticTokens(text: string, semanticTokens: vscode.SemanticTokens, themeData: ThemeData): Token[] {
        const tokens: Token[] = [];
        const data = semanticTokens.data;
        
        let currentLine = 0;
        let currentChar = 0;

        // Semantic tokens are encoded as: [deltaLine, deltaStartChar, length, tokenType, tokenModifiers]
        for (let i = 0; i < data.length; i += 5) {
            const deltaLine = data[i];
            const deltaStartChar = data[i + 1];
            const length = data[i + 2];
            const tokenType = data[i + 3];

            currentLine += deltaLine;
            if (deltaLine === 0) {
                currentChar += deltaStartChar;
            } else {
                currentChar = deltaStartChar;
            }

            // Calculate absolute position
            const lines = text.split('\n');
            let absoluteStart = 0;
            for (let l = 0; l < currentLine; l++) {
                absoluteStart += lines[l].length + 1;
            }
            absoluteStart += currentChar;

            const tokenText = text.substring(absoluteStart, absoluteStart + length);
            const tokenTypeName = this.getSemanticTokenTypeName(tokenType);
            
            tokens.push({
                text: tokenText,
                scopes: [tokenTypeName],
                startIndex: absoluteStart,
                endIndex: absoluteStart + length,
                color: this.getColorForTokenType(tokenTypeName, themeData)
            });
        }

        return this.fillGapsWithPlainTokens(text, tokens, themeData);
    }

    /**
     * Get semantic token type name from index
     */
    private getSemanticTokenTypeName(tokenType: number): string {
        const types = [
            'namespace', 'type', 'class', 'enum', 'interface',
            'struct', 'typeParameter', 'parameter', 'variable', 'property',
            'enumMember', 'event', 'function', 'method', 'macro',
            'keyword', 'modifier', 'comment', 'string', 'number',
            'regexp', 'operator'
        ];
        return types[tokenType] || 'unknown';
    }

    /**
     * Simple pattern-based tokenization fallback
     */
    private simpleTokenize(text: string, language: string, themeData: ThemeData): Token[] {
        const tokens: Token[] = [];
        const patterns = this.getLanguagePatterns(language);

        let position = 0;
        const lines = text.split('\n');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            let linePosition = 0;

            while (linePosition < line.length) {
                let matched = false;

                for (const pattern of patterns) {
                    const regex = new RegExp(pattern.regex, 'g');
                    regex.lastIndex = linePosition;
                    const match = regex.exec(line);

                    if (match && match.index === linePosition) {
                        tokens.push({
                            text: match[0],
                            scopes: [pattern.type],
                            startIndex: position + linePosition,
                            endIndex: position + linePosition + match[0].length,
                            color: this.getColorForTokenType(pattern.type, themeData)
                        });
                        linePosition += match[0].length;
                        matched = true;
                        break;
                    }
                }

                if (!matched) {
                    tokens.push({
                        text: line[linePosition],
                        scopes: ['text'],
                        startIndex: position + linePosition,
                        endIndex: position + linePosition + 1,
                        color: themeData.foreground
                    });
                    linePosition++;
                }
            }

            if (lineIndex < lines.length - 1) {
                tokens.push({
                    text: '\n',
                    scopes: ['text'],
                    startIndex: position + linePosition,
                    endIndex: position + linePosition + 1,
                    color: themeData.foreground
                });
                position += line.length + 1;
            } else {
                position += line.length;
            }
        }

        return tokens;
    }

    /**
     * Get language-specific tokenization patterns
     */
    private getLanguagePatterns(_language: string): Array<{ regex: string; type: string }> {
        return [
            // Comments
            { regex: '//.*$', type: 'comment' },
            { regex: '/\\*[\\s\\S]*?\\*/', type: 'comment' },
            { regex: '#.*$', type: 'comment' },
            
            // Strings
            { regex: '"(?:[^"\\\\]|\\\\.)*"', type: 'string' },
            { regex: "'(?:[^'\\\\]|\\\\.)*'", type: 'string' },
            { regex: '`(?:[^`\\\\]|\\\\.)*`', type: 'string' },
            
            // Numbers
            { regex: '\\b\\d+\\.?\\d*\\b', type: 'number' },
            
            // Keywords
            { regex: '\\b(function|return|if|else|for|while|do|switch|case|break|continue|const|let|var|class|interface|enum|type|import|export|from|as|default|async|await|try|catch|finally|throw|new|this|super|extends|implements|public|private|protected|static|readonly)\\b', type: 'keyword' },
            
            // Functions
            { regex: '\\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\\s*\\()', type: 'function' },
            
            // Types/Classes
            { regex: '\\b[A-Z][a-zA-Z0-9_$]*\\b', type: 'class' },
            
            // Variables
            { regex: '\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b', type: 'variable' },
            
            // Operators
            { regex: '[+\\-*/%=<>!&|^~?:]+', type: 'operator' },
            
            // Punctuation
            { regex: '[\\(\\)\\[\\]\\{\\};,.]', type: 'punctuation' }
        ];
    }

    /**
     * Fill gaps between tokens with plain text tokens
     */
    private fillGapsWithPlainTokens(text: string, tokens: Token[], themeData: ThemeData): Token[] {
        if (tokens.length === 0) {
            return [{
                text,
                scopes: ['text'],
                startIndex: 0,
                endIndex: text.length,
                color: themeData.foreground
            }];
        }

        const filledTokens: Token[] = [];
        let lastEnd = 0;

        for (const token of tokens) {
            if (token.startIndex > lastEnd) {
                filledTokens.push({
                    text: text.substring(lastEnd, token.startIndex),
                    scopes: ['text'],
                    startIndex: lastEnd,
                    endIndex: token.startIndex,
                    color: themeData.foreground
                });
            }
            filledTokens.push(token);
            lastEnd = token.endIndex;
        }

        if (lastEnd < text.length) {
            filledTokens.push({
                text: text.substring(lastEnd),
                scopes: ['text'],
                startIndex: lastEnd,
                endIndex: text.length,
                color: themeData.foreground
            });
        }

        return filledTokens;
    }

    /**
     * Get color for token type from theme data
     */
    private getColorForTokenType(tokenType: string, themeData: ThemeData): string {
        const typeMapping: { [key: string]: string } = {
            'comment': 'comment',
            'string': 'string',
            'keyword': 'keyword',
            'number': 'number',
            'function': 'function',
            'method': 'function',
            'class': 'class',
            'type': 'type',
            'interface': 'type',
            'variable': 'variable',
            'parameter': 'parameter',
            'property': 'property',
            'constant': 'constant',
            'operator': 'operator',
            'punctuation': 'punctuation',
            'regexp': 'regexp',
            'namespace': 'type',
            'enum': 'type',
            'struct': 'type',
            'typeParameter': 'type',
            'enumMember': 'constant',
            'event': 'function',
            'macro': 'function',
            'modifier': 'keyword'
        };

        const mappedType = typeMapping[tokenType] || 'variable';
        return themeData.colors[mappedType] || themeData.foreground;
    }

    /**
     * Normalize language identifier (handle aliases)
     */
    private normalizeLanguage(language: string): string {
        const aliases: { [key: string]: string } = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'rb': 'ruby',
            'sh': 'shellscript',
            'bash': 'shellscript',
            'zsh': 'shellscript',
            'yml': 'yaml',
            'dockerfile': 'docker',
            'md': 'markdown',
            'cs': 'csharp',
            'cpp': 'cpp',
            'c++': 'cpp',
            'kt': 'kotlin',
            'rs': 'rust',
            'go': 'go',
            'java': 'java',
            'php': 'php',
            'swift': 'swift',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'json': 'json',
            'xml': 'xml',
            'sql': 'sql'
        };

        return aliases[language.toLowerCase()] || language.toLowerCase();
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.outputChannel.dispose();
    }
}
