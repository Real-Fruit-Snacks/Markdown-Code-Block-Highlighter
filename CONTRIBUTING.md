# Contributing Guide

Thank you for your interest in contributing to the **Markdown Code Block Highlighter** extension! This guide will help you get started.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Architecture](#code-architecture)
6. [Adding New Features](#adding-new-features)
7. [Testing Guidelines](#testing-guidelines)
8. [Code Style Guidelines](#code-style-guidelines)
9. [Pull Request Process](#pull-request-process)
10. [Release Process](#release-process)

---

## Code of Conduct

This project adheres to a code of conduct that promotes a welcoming and inclusive environment:

- **Be respectful**: Treat all contributors with respect
- **Be constructive**: Provide helpful feedback
- **Be collaborative**: Work together to solve problems
- **Be patient**: Everyone learns at different paces

---

## Getting Started

### Prerequisites

- **Node.js**: Version 16.x or higher
- **npm**: Version 7.x or higher
- **VS Code**: Version 1.80.0 or higher
- **Git**: For version control
- **TypeScript**: Familiarity with TypeScript is helpful

### Initial Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/markdown-code-block-highlighter
   cd markdown-code-block-highlighter
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/original-owner/markdown-code-block-highlighter
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Build the Project**
   ```bash
   npm run compile
   ```

5. **Run Tests**
   ```bash
   npm run test:extension
   ```

6. **Open in VS Code**
   ```bash
   code .
   ```

7. **Launch Extension Development Host**
   - Press `F5` in VS Code
   - A new window opens with the extension loaded

---

## Project Structure

```
markdown-code-block-highlighter/
├── src/                          # Source code
│   ├── extension.ts              # Extension entry point
│   ├── previewEnhancer.ts        # Main preview enhancement logic
│   ├── preview/
│   │   └── previewScript.ts      # Script injected into preview
│   ├── services/
│   │   ├── themeManager.ts       # Theme color extraction
│   │   ├── tokenizationService.ts # Code tokenization
│   │   ├── cacheManager.ts       # LRU cache implementation
│   │   ├── configurationManager.ts # Settings management
│   │   └── performanceMonitor.ts # Performance tracking
│   └── utils/
│       └── errorHandler.ts       # Error handling utilities
├── test/                         # Test files
│   ├── sample.md                 # Comprehensive test document
│   └── integration.test.md       # Integration test scenarios
├── scripts/                      # Build and test scripts
│   ├── test-extension.js         # Extension validation
│   └── benchmark.js              # Performance benchmarks
├── out/                          # Compiled JavaScript (generated)
├── .vscode/                      # VS Code configuration
│   ├── launch.json               # Debug configurations
│   └── tasks.json                # Build tasks
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # User documentation
├── CONTRIBUTING.md               # This file
├── TESTING.md                    # Testing guide
├── ARCHITECTURE.md               # Architecture documentation
└── QA.md                         # Quality assurance checklist
```

### Key Files

- **`extension.ts`**: Entry point, activates the extension
- **`previewEnhancer.ts`**: Orchestrates theme management and tokenization
- **`previewScript.ts`**: Client-side script that runs in the preview webview
- **`themeManager.ts`**: Extracts theme colors from VS Code
- **`tokenizationService.ts`**: Tokenizes code using VS Code's grammar
- **`cacheManager.ts`**: LRU cache for tokenized results

---

## Development Workflow

### Daily Development

1. **Pull Latest Changes**
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Changes**
   - Edit source files in `src/`
   - Follow code style guidelines
   - Add comments for complex logic

4. **Compile TypeScript**
   ```bash
   npm run compile
   # Or watch mode for continuous compilation
   npm run watch
   ```

5. **Test Your Changes**
   ```bash
   # Run validation tests
   npm run test:extension
   
   # Run benchmarks
   npm run test:benchmark
   
   # Manual testing: Press F5 in VS Code
   ```

6. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add awesome new feature"
   # Or
   git commit -m "fix: resolve issue with theme switching"
   ```

7. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Fill in PR template

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

<detailed description>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(cache): add LRU eviction policy
fix(theme): resolve color extraction for custom themes
docs(readme): update installation instructions
perf(tokenization): optimize large block handling
test(integration): add theme switching test
```

---

## Code Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│           VS Code Extension Host                │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         extension.ts (Activation)         │ │
│  └──────────────────┬────────────────────────┘ │
│                     │                           │
│  ┌──────────────────▼────────────────────────┐ │
│  │       previewEnhancer.ts (Orchestrator)   │ │
│  └──┬──────┬──────┬──────┬──────┬────────────┘ │
│     │      │      │      │      │               │
│  ┌──▼──┐┌─▼──┐┌──▼──┐┌──▼──┐┌──▼──┐          │
│  │Theme││Token││Cache││Perf ││Config│          │
│  │ Mgr ││Svc  ││ Mgr ││Mon  ││ Mgr  │          │
│  └──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘          │
│     │      │      │      │      │               │
│     └──────┴──────┴──────┴──────┘               │
│                   │                              │
│                   │ postMessage                  │
└───────────────────┼──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│          Markdown Preview Webview                │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │     previewScript.ts (Client-side)         │ │
│  │                                            │ │
│  │  • Receives tokenized data                │ │
│  │  • Applies styles to code blocks          │ │
│  │  • Handles lazy loading                   │ │
│  │  • Updates on theme change                │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Component Responsibilities

#### **ThemeManager** ([`themeManager.ts`](src/services/themeManager.ts:1))
- Extracts token colors from current VS Code theme
- Watches for theme changes
- Provides color mappings for tokens

**Key Methods:**
```typescript
getCurrentThemeColors(): ThemeColors
onThemeChanged(callback: () => void): Disposable
```

#### **TokenizationService** ([`tokenizationService.ts`](src/services/tokenizationService.ts:1))
- Tokenizes code using VS Code's TextMate grammars
- Handles multiple languages
- Implements fallback for unsupported languages
- Respects timeout limits

**Key Methods:**
```typescript
tokenizeCode(code: string, languageId: string): Promise<Token[]>
```

#### **CacheManager** ([`cacheManager.ts`](src/services/cacheManager.ts:1))
- Implements LRU (Least Recently Used) cache
- Stores tokenized results
- Configurable size limit
- Thread-safe operations

**Key Methods:**
```typescript
get(key: string): CachedResult | undefined
set(key: string, value: CachedResult): void
clear(): void
getStats(): CacheStats
```

#### **PerformanceMonitor** ([`performanceMonitor.ts`](src/services/performanceMonitor.ts:1))
- Tracks tokenization performance
- Measures cache effectiveness
- Logs metrics (when enabled)
- Provides status bar updates

**Key Methods:**
```typescript
startMeasurement(id: string): void
endMeasurement(id: string): number
getMetrics(): PerformanceMetrics
```

#### **ConfigurationManager** ([`configurationManager.ts`](src/services/configurationManager.ts:1))
- Reads VS Code settings
- Watches for configuration changes
- Provides typed configuration access
- Validates settings

**Key Methods:**
```typescript
getConfiguration(): ExtensionConfig
onConfigurationChanged(callback: () => void): Disposable
```

### Data Flow

1. **User opens Markdown preview**
2. **Extension activates** (if Markdown file)
3. **PreviewEnhancer initializes** services
4. **Theme colors extracted** from current theme
5. **Preview script injected** into webview
6. **Code blocks discovered** in document
7. **Tokenization requested** for each block
8. **Cache checked** first (hit/miss)
9. **Tokenization performed** (if cache miss)
10. **Results sent** to preview via `postMessage`
11. **Preview script applies** styles to code blocks

---

## Adding New Features

### Process

1. **Discuss the Feature**
   - Open an issue to discuss the feature
   - Get feedback from maintainers
   - Ensure it aligns with project goals

2. **Design the Solution**
   - Document the approach
   - Consider performance implications
   - Identify affected components

3. **Implement the Feature**
   - Create feature branch
   - Write the code
   - Follow code style guidelines
   - Add appropriate comments

4. **Add Tests**
   - Add test cases to [`test/sample.md`](test/sample.md:1)
   - Update integration tests
   - Run benchmarks to check performance

5. **Update Documentation**
   - Update README.md
   - Update TESTING.md if needed
   - Add changelog entry

6. **Submit Pull Request**
   - Fill out PR template
   - Link related issues
   - Request review

### Example: Adding a New Configuration Option

Let's add a feature to show line numbers in code blocks.

**Step 1: Update Configuration Types**

Edit [`src/services/configurationManager.ts`](src/services/configurationManager.ts:1):

```typescript
export interface ExtensionConfig {
  enableHighlighting: boolean;
  // ... existing options
  showLineNumbers: boolean; // NEW
}

export class ConfigurationManager {
  getConfiguration(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('markdownCodeBlockHighlighter');
    
    return {
      enableHighlighting: config.get('enableHighlighting', true),
      // ... existing options
      showLineNumbers: config.get('showLineNumbers', false), // NEW
    };
  }
}
```

**Step 2: Update package.json Configuration**

Edit [`package.json`](package.json:1):

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "markdownCodeBlockHighlighter.showLineNumbers": {
          "type": "boolean",
          "default": false,
          "description": "Show line numbers in code blocks"
        }
      }
    }
  }
}
```

**Step 3: Implement Feature**

Edit [`src/preview/previewScript.ts`](src/preview/previewScript.ts:1):

```typescript
function applyHighlighting(blockId: string, tokens: Token[], showLineNumbers: boolean) {
  // Existing code...
  
  if (showLineNumbers) {
    // Add line numbers to each line
    // Implementation here
  }
}
```

**Step 4: Update Documentation**

Add to README.md:
```markdown
### Show Line Numbers

Display line numbers in code blocks:

```json
{
  "markdownCodeBlockHighlighter.showLineNumbers": true
}
```
```

**Step 5: Add Tests**

Add test case to [`test/sample.md`](test/sample.md:1) and test manually.

**Step 6: Create Pull Request**

---

## Testing Guidelines

### Types of Tests

1. **Manual Testing**
   - Follow [`TESTING.md`](TESTING.md:1)
   - Test with multiple themes
   - Test with various document sizes

2. **Automated Validation**
   ```bash
   npm run test:extension
   ```
   - Validates TypeScript compilation
   - Checks package.json structure
   - Verifies file existence

3. **Performance Benchmarks**
   ```bash
   npm run test:benchmark
   ```
   - Measures tokenization speed
   - Checks cache effectiveness
   - Validates performance targets

4. **Integration Tests**
   - Follow [`test/integration.test.md`](test/integration.test.md:1)
   - Test all scenarios
   - Verify expected behaviors

### Writing Tests

**For New Features:**
- Add test cases to [`test/sample.md`](test/sample.md:1)
- Document expected behavior
- Test edge cases

**For Bug Fixes:**
- Add regression test
- Verify bug is fixed
- Ensure no new issues introduced

### Performance Testing

Always run benchmarks before and after changes:

```bash
# Before changes
npm run test:benchmark > before.txt

# Make changes...

# After changes
npm run test:benchmark > after.txt

# Compare results
diff before.txt after.txt
```

**Performance Targets:**
- Small blocks (10 lines): < 10ms
- Medium blocks (100 lines): < 50ms
- Large blocks (500 lines): < 200ms
- Cache hit rate: > 80%
- Theme switch: < 100ms

---

## Code Style Guidelines

### TypeScript Style

**General Principles:**
- Write clear, self-documenting code
- Prefer explicit types over `any`
- Use descriptive variable names
- Keep functions small and focused

**Formatting:**
```typescript
// Use 2-space indentation
function example() {
  if (condition) {
    doSomething();
  }
}

// Use single quotes for strings
const message = 'Hello, world!';

// Use interfaces for object shapes
interface User {
  id: number;
  name: string;
}

// Use async/await over callbacks
async function fetchData(): Promise<Data> {
  const result = await api.getData();
  return result;
}

// Use descriptive names
// ❌ Bad
const x = getData();

// ✅ Good
const userData = getUserData();
```

**Comments:**
```typescript
/**
 * Tokenizes code using VS Code's grammar engine
 * 
 * @param code - The source code to tokenize
 * @param languageId - Language identifier (e.g., 'javascript')
 * @returns Promise resolving to array of tokens
 * @throws TokenizationError if language not supported
 */
async function tokenizeCode(code: string, languageId: string): Promise<Token[]> {
  // Implementation...
}
```

**Error Handling:**
```typescript
// ❌ Bad: Silent failure
try {
  dangerousOperation();
} catch (e) {
  // Ignored
}

// ✅ Good: Proper error handling
try {
  dangerousOperation();
} catch (error) {
  logger.error('Operation failed', error);
  throw new CustomError('Failed to perform operation', error);
}
```

### File Organization

```typescript
// 1. Imports
import * as vscode from 'vscode';
import { SomeType } from './types';

// 2. Constants
const DEFAULT_TIMEOUT = 5000;

// 3. Types/Interfaces
interface Config {
  timeout: number;
}

// 4. Classes
export class MyService {
  // Private fields
  private config: Config;
  
  // Constructor
  constructor(config: Config) {
    this.config = config;
  }
  
  // Public methods
  public doSomething(): void {
    // ...
  }
  
  // Private methods
  private helper(): void {
    // ...
  }
}

// 5. Functions
export function utilityFunction(): void {
  // ...
}
```

### Naming Conventions

- **Classes**: `PascalCase` (e.g., `ThemeManager`)
- **Interfaces**: `PascalCase` (e.g., `ExtensionConfig`)
- **Functions**: `camelCase` (e.g., `tokenizeCode`)
- **Variables**: `camelCase` (e.g., `userData`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_CACHE_SIZE`)
- **Private members**: Prefix with `_` or use `private` keyword
- **Files**: `camelCase.ts` (e.g., `themeManager.ts`)

### Best Practices

**1. Dispose Resources**
```typescript
// Always dispose of VS Code resources
const disposable = vscode.workspace.onDidChangeConfiguration(() => {
  // Handle change
});

// Later:
disposable.dispose();
```

**2. Use VS Code APIs Properly**
```typescript
// ✅ Good: Use workspace API for configuration
const config = vscode.workspace.getConfiguration('myExtension');

// ❌ Bad: Don't access internal APIs
const internal = (vscode as any)._internal.something;
```

**3. Handle Async Operations**
```typescript
// ✅ Good: Proper async handling
async function load(): Promise<void> {
  try {
    const data = await fetchData();
    processData(data);
  } catch (error) {
    handleError(error);
  }
}

// ❌ Bad: Unhandled promises
function load(): void {
  fetchData().then(processData); // Missing error handling
}
```

**4. Performance Considerations**
```typescript
// ✅ Good: Cache expensive operations
class Service {
  private cache = new Map<string, Result>();
  
  async getData(key: string): Promise<Result> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    const result = await expensiveOperation(key);
    this.cache.set(key, result);
    return result;
  }
}
```

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code compiles without errors (`npm run compile`)
- [ ] Tests pass (`npm run test:extension`)
- [ ] Benchmarks meet targets (`npm run test:benchmark`)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No unnecessary files included
- [ ] Code follows style guidelines

### Creating a Pull Request

1. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open Pull Request on GitHub**
   - Click "New Pull Request"
   - Select your branch
   - Fill out the template

3. **PR Title Format**
   ```
   feat: add line numbers option
   fix: resolve theme switching bug
   docs: update contribution guide
   ```

4. **PR Description Should Include:**
   - **What**: What does this PR do?
   - **Why**: Why is this change needed?
   - **How**: How is it implemented?
   - **Testing**: How was it tested?
   - **Screenshots**: (if UI changes)
   - **Related Issues**: Closes #123

### PR Template

```markdown
## Description
Brief description of changes

## Motivation
Why is this change needed?

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Benchmarks within targets

## Screenshots
(if applicable)

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] Code compiles
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Follows code style
```

### Review Process

1. **Automated Checks**
   - CI runs automatically
   - Must pass before review

2. **Code Review**
   - Maintainer reviews code
   - May request changes
   - Address feedback

3. **Approval**
   - Once approved, PR can be merged
   - Squash commits (usually)
   - Delete branch after merge

### Addressing Review Feedback

```bash
# Make requested changes
git add .
git commit -m "fix: address review feedback"
git push origin feature/your-feature-name

# If asked to squash commits
git rebase -i HEAD~3  # Last 3 commits
# Mark commits as 'squash' in editor
git push origin feature/your-feature-name --force
```

---

## Release Process

(For maintainers)

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (e.g., 1.0.0 → 1.0.1)

### Release Steps

1. **Update Version**
   ```bash
   npm version patch  # or minor, major
   ```

2. **Update CHANGELOG.md**
   - Document all changes
   - Categorize: Added, Changed, Fixed, Removed

3. **Build and Test**
   ```bash
   npm run compile
   npm run test:all
   ```

4. **Package Extension**
   ```bash
   npm run package
   # Creates .vsix file
   ```

5. **Create GitHub Release**
   - Tag version
   - Upload .vsix file
   - Copy changelog

6. **Publish to Marketplace**
   ```bash
   npx vsce publish
   ```

---

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email maintainers directly
- **Chat**: Join our community (if available)

---

## Recognition

Contributors are recognized in:
- README.md Contributors section
- Release notes
- Commit history

Thank you for contributing! 🎉

---

## Additional Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TextMate Grammars](https://macromates.com/manual/en/language_grammars)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

**Questions?** Open an issue or discussion on GitHub!
