# Markdown Code Block Highlighter

> 🎨 Beautiful, theme-aware syntax highlighting for Markdown code blocks

Enhance your Markdown preview with intelligent syntax highlighting that automatically matches your VS Code theme. Say goodbye to inconsistent, dull code blocks in your Markdown previews!

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/your-username/markdown-code-block-highlighter)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-007ACC.svg)](https://code.visualstudio.com/)

---

## ✨ Quick Start

1. Install the extension
2. Open any Markdown file (`.md`)
3. Open preview (`Ctrl+Shift+V` or `Cmd+Shift+V`)
4. Watch your code blocks come alive with theme-aware highlighting! 🎉

<!-- TODO: Add animated GIF showing theme switching -->
![Demo Animation](https://via.placeholder.com/800x450/1e1e1e/ffffff?text=Demo+Animation+Coming+Soon)

---

## 🌟 Features

### Core Features

#### 🎨 **Theme-Aware Highlighting**
Code blocks automatically match your active VS Code theme - no configuration needed! Switch from dark to light theme and watch your code blocks update instantly.

<!-- TODO: Add screenshot of theme switching -->
![Theme Awareness](https://via.placeholder.com/800x300/1e1e1e/ffffff?text=Theme-Aware+Highlighting)

#### ⚡ **Blazing Fast Performance**
- **Smart Caching**: LRU cache stores tokenized results for instant reloads
- **Lazy Loading**: Only visible code blocks are processed initially
- **Optimized Rendering**: Handles documents with 100+ code blocks smoothly
- **Incremental Updates**: Theme changes applied without flicker

<!-- TODO: Add performance comparison chart -->
![Performance](https://via.placeholder.com/800x300/1e1e1e/ffffff?text=Performance+Metrics)

#### 🌐 **Universal Language Support**
Supports 50+ programming languages out of the box:
- **Web**: JavaScript, TypeScript, HTML, CSS, JSX, TSX
- **Backend**: Python, Java, C#, Go, Rust, PHP, Ruby
- **Systems**: C, C++, Objective-C, Swift, Kotlin
- **Scripting**: Bash, PowerShell, Perl, Lua
- **Data**: JSON, YAML, XML, SQL, GraphQL
- **Markup**: Markdown, LaTeX, TOML
- **And many more...**

#### 🔧 **Highly Customizable**
Fine-tune every aspect:
- Adjust font size and line height
- Configure cache size and behavior
- Set performance thresholds
- Enable detailed performance monitoring

#### ♿ **Accessibility First**
- Maintains semantic HTML structure
- Preserves ARIA attributes
- Works with screen readers
- High contrast theme support

## Installation

### From VS Code Marketplace (Coming Soon)

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P` to open Quick Open
3. Type `ext install markdown-code-block-highlighter`
4. Press Enter

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to launch the extension in a new VS Code window

## Usage

1. Open any Markdown file in VS Code
2. Open the preview pane (`Ctrl+Shift+V` / `Cmd+Shift+V`)
3. Code blocks will automatically be highlighted with your active theme
4. Switch themes to see the highlighting update in real-time

### Example

````markdown
```typescript
function greet(name: string): string {
    return `Hello, ${name}!`;
}

console.log(greet("World"));
```
````

The code block above will be highlighted with proper TypeScript syntax highlighting that matches your current VS Code theme.

## Configuration

You can customize the extension's behavior through VS Code settings:

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `markdownCodeBlockHighlighter.enableHighlighting` | boolean | `true` | Enable/disable theme-aware syntax highlighting |
| `markdownCodeBlockHighlighter.fontSize` | number | `0` | Font size for code blocks in pixels (0 uses VS Code default) |
| `markdownCodeBlockHighlighter.lineHeight` | number | `1.5` | Line height multiplier for code blocks |
| `markdownCodeBlockHighlighter.enableCache` | boolean | `true` | Enable caching of tokenized code blocks |
| `markdownCodeBlockHighlighter.cacheSize` | number | `100` | Maximum number of cached code blocks |
| `markdownCodeBlockHighlighter.maxBlockSize` | number | `10000` | Maximum size in characters for code blocks to highlight |
| `markdownCodeBlockHighlighter.enablePerfMonitoring` | boolean | `false` | Enable performance monitoring (for debugging) |

### Example Configuration

Add these settings to your `settings.json`:

```json
{
  "markdownCodeBlockHighlighter.enableHighlighting": true,
  "markdownCodeBlockHighlighter.fontSize": 14,
  "markdownCodeBlockHighlighter.lineHeight": 1.6,
  "markdownCodeBlockHighlighter.cacheSize": 200
}
```

## Supported Languages

The extension supports all languages that VS Code's TextMate tokenization engine supports, including:

- JavaScript / TypeScript
- Python
- Java / C / C++ / C#
- Go / Rust
- Ruby / PHP
- HTML / CSS / SCSS
- JSON / YAML / XML
- Markdown
- Shell scripts (Bash, PowerShell)
- SQL
- And many more...

## Requirements

- Visual Studio Code version 1.80.0 or higher
- A Markdown file to preview

## Known Issues

- Very large code blocks (>10,000 characters) may fall back to default highlighting for performance
- Some custom themes may not provide complete token color information

## Performance

The extension is designed for optimal performance:

- **Caching**: Tokenized code blocks are cached to avoid redundant processing
- **Lazy Rendering**: Only visible code blocks are highlighted initially
- **Incremental Updates**: Theme changes are batched to prevent flicker
- **Resource Limits**: Configurable limits protect against performance degradation

## Troubleshooting

### Code blocks aren't being highlighted

1. Check that the extension is enabled in settings
2. Verify that the code block has a language identifier (e.g., ` ```javascript`)
3. Check the VS Code console for error messages
4. Try disabling other Markdown extensions that might conflict

### Performance issues with large documents

1. Reduce `cacheSize` if memory is a concern
2. Decrease `maxBlockSize` to skip very large blocks
3. Enable `enablePerfMonitoring` to identify bottlenecks

### Theme colors don't match editor

Some themes may not provide complete token color mappings. The extension will use fallback colors in these cases.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Architecture

For detailed information about the extension's architecture and design decisions, see [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Release Notes

### 0.1.0 (Initial Release)

- Initial release with basic theme-aware syntax highlighting
- Support for 50+ programming languages
- Configurable caching and performance options
- Dynamic theme switching without preview reload

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built on VS Code's Extension API
- Uses VS Code's TextMate tokenization engine
- Inspired by the need for consistent theme experience across editor and preview

---

**Enjoy enhanced Markdown previews with beautiful, theme-aware code highlighting!** 🎨✨
