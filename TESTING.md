# Testing Guide

Comprehensive manual testing guide for the **Markdown Code Block Highlighter** VS Code extension.

---

## Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Quick Start](#quick-start)
3. [Manual Testing Procedure](#manual-testing-procedure)
4. [Expected Behaviors](#expected-behaviors)
5. [Performance Validation](#performance-validation)
6. [Theme Compatibility](#theme-compatibility)
7. [Configuration Testing](#configuration-testing)
8. [Known Limitations](#known-limitations)
9. [Troubleshooting](#troubleshooting)
10. [Reporting Issues](#reporting-issues)

---

## Setup Instructions

### Prerequisites

- **VS Code**: Version 1.80.0 or higher
- **Node.js**: Version 16.x or higher
- **npm**: Version 7.x or higher

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/markdown-code-block-highlighter
   cd markdown-code-block-highlighter
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Compile TypeScript**
   ```bash
   npm run compile
   ```

4. **Verify Build**
   ```bash
   npm run test:compile
   ```

5. **Run Automated Tests**
   ```bash
   npm run test:extension
   ```

### Loading Extension in Development Host

**Method 1: Using F5 (Recommended)**
1. Open the project folder in VS Code
2. Press `F5` (or Run → Start Debugging)
3. A new VS Code window (Extension Development Host) will open
4. The extension is now active in the Development Host

**Method 2: Using Command Line**
1. Compile the extension: `npm run compile`
2. Open VS Code
3. Go to Extensions view (Ctrl+Shift+X)
4. Click "..." menu → "Install from VSIX"
5. Navigate to packaged `.vsix` file

**Method 3: Manual Installation (For Testing)**
1. Package the extension: `npm run package`
2. Install the generated `.vsix` file in VS Code

---

## Quick Start

**5-Minute Smoke Test:**

1. Open Extension Development Host (F5)
2. Open [`test/sample.md`](test/sample.md:1)
3. Open Markdown preview (Ctrl+Shift+V or Cmd+Shift+V)
4. Verify code blocks have syntax highlighting
5. Switch theme (Ctrl+K Ctrl+T) and verify colors update
6. ✅ If all works, extension is functional

---

## Manual Testing Procedure

### Step 1: Basic Syntax Highlighting

**Objective:** Verify code blocks render with proper syntax highlighting

**Steps:**
1. Launch Extension Development Host (F5)
2. In the Development Host, open [`test/sample.md`](test/sample.md:1)
3. Open Markdown preview:
   - **Windows/Linux**: `Ctrl+Shift+V`
   - **macOS**: `Cmd+Shift+V`
4. Observe the preview window

**Expected Results:**
- ✅ Code blocks display with syntax highlighting
- ✅ Colors are appropriate for the current theme
- ✅ Different languages have distinct color schemes
- ✅ Keywords, strings, comments are properly highlighted
- ✅ No visual glitches or rendering errors

**Verification Checklist:**
- [ ] JavaScript blocks: Keywords (`const`, `function`) highlighted
- [ ] TypeScript blocks: Type annotations highlighted differently
- [ ] Python blocks: Decorators, keywords, strings highlighted
- [ ] HTML blocks: Tags, attributes, values color-coded
- [ ] CSS blocks: Properties, selectors, values distinguished
- [ ] Comments appear in muted colors

**Debug:** If highlighting doesn't appear:
1. Open Developer Tools: `Help → Toggle Developer Tools`
2. Check Console for errors
3. Verify extension activated: Look for `[Extension] Code Block Highlighter activated`

---

### Step 2: Theme Switching

**Objective:** Verify highlighting updates when VS Code theme changes

**Steps:**
1. With preview open, note current highlighting colors
2. Open Command Palette: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
3. Type: `Preferences: Color Theme`
4. Select a different theme:
   - Try: `Dark+ (default dark)` → `Light+ (default light)`
   - Or: Any installed theme
5. Observe the preview window

**Expected Results:**
- ✅ Syntax highlighting updates immediately (< 100ms)
- ✅ Colors match the new theme's color scheme
- ✅ No flash of unstyled content (FOUC)
- ✅ All code blocks update consistently
- ✅ No console errors in Developer Tools

**Test Multiple Themes:**
- [ ] Dark Modern (default)
- [ ] Light Modern (default)
- [ ] Monokai
- [ ] Solarized Light
- [ ] Solarized Dark
- [ ] High Contrast (accessibility)
- [ ] Any custom themes you have installed

**Verification:**
Open Developer Tools Console and look for:
```
[ThemeManager] Theme changed: <new-theme-name>
[Preview] Updating syntax highlighting for theme change
```

---

### Step 3: Large Document Performance

**Objective:** Verify extension handles large documents efficiently

**Steps:**
1. Open [`test/sample.md`](test/sample.md:1) (contains 50+ code blocks)
2. Open preview
3. Observe initial load time (should be < 1 second)
4. Scroll rapidly up and down
5. Check for smooth scrolling (60 FPS)
6. Open Developer Tools → Console
7. Look for performance logs

**Expected Results:**
- ✅ Initial load: < 1 second
- ✅ Smooth scrolling with no lag
- ✅ Large blocks (500+ lines) render without freezing
- ✅ No JavaScript errors in console
- ✅ Memory usage remains stable

**Performance Monitoring:**
1. Open Developer Tools: `Help → Toggle Developer Tools`
2. Go to Console tab
3. Enable performance monitoring in settings:
   ```json
   {
     "markdownCodeBlockHighlighter.enablePerfMonitoring": true
   }
   ```
4. Reload preview
5. Check console for performance metrics:
   ```
   [Performance] Tokenization completed in Xms
   [Cache] Hit rate: X%
   ```

**Benchmark Test:**
Run automated benchmark:
```bash
npm run test:benchmark
```

Expected results:
- Small blocks (10 lines): < 10ms
- Medium blocks (100 lines): < 50ms
- Large blocks (500 lines): < 200ms
- Cache hit rate: > 80% on reload

---

### Step 4: Cache Effectiveness

**Objective:** Verify LRU cache improves performance on repeated renders

**Steps:**
1. Open [`test/sample.md`](test/sample.md:1) preview
2. Note initial load time (check console logs if perf monitoring enabled)
3. Close preview (click X on preview tab)
4. Reopen preview (`Ctrl+Shift+V`)
5. Note second load time (should be significantly faster)
6. Repeat 2-3 times
7. Check cache statistics

**Expected Results:**
- ✅ First load: Full tokenization (slower)
- ✅ Second load: 50-80% faster due to cache
- ✅ Cache hit rate increases with repeated loads
- ✅ No stale or incorrect highlighting

**Verification:**
With performance monitoring enabled, look for:
```
[Cache] Cache hit for block-<hash>
[Cache] Cache miss for block-<hash>
[Performance] Cache hit rate: 85%
```

**Clear Cache Test:**
1. Open Command Palette
2. Run: `Code Block: Clear Cache` (if command exists)
3. Reload preview
4. Should be slower (cache cleared)

---

### Step 5: Configuration Changes

**Objective:** Verify extension respects user configuration

**Steps:**

#### 5.1 Enable/Disable Highlighting
1. Open Settings: `File → Preferences → Settings`
2. Search for: `markdown code block`
3. Toggle: `Enable Highlighting` OFF
4. Observe preview (should revert to default Markdown highlighting)
5. Toggle back ON
6. Verify highlighting returns

#### 5.2 Adjust Cache Size
1. In Settings, find: `Cache Size`
2. Change from 100 to 10
3. Open large document
4. Verify cache respects new limit (check console logs)

#### 5.3 Performance Monitoring
1. In Settings, find: `Enable Perf Monitoring`
2. Set to `true`
3. Open preview
4. Verify detailed logs appear in console

#### 5.4 Max Block Size
1. Find: `Max Block Size`
2. Set to 100 (very low)
3. View large code blocks
4. Verify they fall back to plain text

**Expected Results:**
- ✅ All configuration changes apply immediately
- ✅ No extension restart required
- ✅ Settings persist across sessions
- ✅ Invalid values are handled gracefully

---

### Step 6: Edge Cases and Error Handling

**Objective:** Verify graceful handling of edge cases

**Test Cases:**

#### 6.1 Unknown Language
1. Navigate to "Edge Cases" section in [`test/sample.md`](test/sample.md:1)
2. Find code block with `invalidlang`
3. Verify it renders as plain text (no errors)

#### 6.2 Empty Code Blocks
1. Find empty code blocks in test document
2. Verify no errors in console
3. Block should render (but empty)

#### 6.3 No Language Specified
1. Find code blocks without language tag
2. Should render as plain text
3. No highlighting (expected behavior)

#### 6.4 Very Long Lines
1. Find "Very Long Single Line" section
2. Verify horizontal scrolling works
3. No text overflow or visual glitches

#### 6.5 Unicode and Special Characters
1. Find "Special Characters and Unicode" section
2. Verify all characters render correctly:
   - Emoji: 😀🎉🚀
   - Math symbols: ∑∫∂√π
   - Arrows: →←↑↓
3. No encoding issues

#### 6.6 Nested Structures
1. Navigate to "Nested Structures" section
2. Verify code blocks in:
   - Lists (ordered and unordered)
   - Blockquotes
   - Tables
3. All should have proper highlighting

**Expected Results:**
- ✅ No unhandled exceptions
- ✅ All edge cases render gracefully
- ✅ Console shows fallback messages (not errors)
- ✅ Extension remains stable

---

### Step 7: Multi-Language Support

**Objective:** Verify correct highlighting for various languages

**Languages to Test:**

1. **JavaScript** (ES6+)
   - Check: Arrow functions, template literals, async/await
   - Expected: Keywords blue, strings orange, functions yellow

2. **TypeScript**
   - Check: Type annotations, interfaces, generics
   - Expected: Types distinct from variables

3. **Python**
   - Check: Decorators, f-strings, keywords
   - Expected: Decorators highlighted, indentation visible

4. **Java**
   - Check: Classes, methods, annotations
   - Expected: Java keywords, types highlighted

5. **C++**
   - Check: Templates, STL, preprocessor directives
   - Expected: `#include` highlighted differently

6. **Rust**
   - Check: Ownership keywords, async/await, macros
   - Expected: Rust-specific keywords highlighted

7. **Go**
   - Check: Goroutines, channels, defer
   - Expected: Go keywords distinct

8. **HTML**
   - Check: Tags, attributes, values
   - Expected: Tags, attributes, strings distinct colors

9. **CSS**
   - Check: Selectors, properties, values
   - Expected: Selectors, properties, values distinguished

10. **SQL**
    - Check: Keywords, table names, functions
    - Expected: SQL keywords uppercase, highlighted

11. **Bash/Shell**
    - Check: Variables, commands, comments
    - Expected: Variables, strings highlighted

12. **JSON**
    - Check: Keys, values, nested objects
    - Expected: Keys, strings, numbers, booleans distinct

**Verification Checklist:**
- [ ] All languages render with distinct highlighting
- [ ] No language confusion (correct grammar for each)
- [ ] Language-specific features highlighted properly
- [ ] Consistent highlighting across same language

---

### Step 8: Split View and Multiple Previews

**Objective:** Test extension with multiple preview instances

**Steps:**
1. Open [`test/sample.md`](test/sample.md:1)
2. Open preview to the side: `Ctrl+K V` (Windows/Linux) or `Cmd+K V` (macOS)
3. Edit source file while preview is open
4. Verify preview updates
5. Open another Markdown file in a second tab
6. Open its preview
7. Switch between tabs
8. Verify each preview maintains correct highlighting

**Expected Results:**
- ✅ Multiple previews can be open simultaneously
- ✅ Each preview has correct highlighting
- ✅ Previews update when source changes
- ✅ No conflicts between multiple instances
- ✅ Theme changes affect all previews

---

### Step 9: Extension Lifecycle

**Objective:** Verify proper activation and deactivation

**Activation Test:**
1. Start VS Code with extension installed
2. Open a non-Markdown file (e.g., `.txt`)
3. Extension should NOT activate yet
4. Open a Markdown file
5. Extension should activate
6. Check console: Look for activation message

**Deactivation Test:**
1. With extension active, close all Markdown files
2. Extension may deactivate (depending on VS Code)
3. Reopen Markdown file
4. Extension should reactivate smoothly

**Developer Tools Check:**
1. Open Developer Tools
2. Console should show:
   ```
   [Extension] Code Block Highlighter activated
   [ThemeManager] Initialized with theme: <theme-name>
   [Cache] Initialized with size: 100
   ```
3. No errors or warnings

---

## Expected Behaviors

### Correct Behaviors ✅

- **Immediate highlighting**: Code blocks highlighted within 100ms of preview opening
- **Theme synchronization**: Colors update within 100ms of theme change
- **Smooth scrolling**: 60 FPS scrolling even with many code blocks
- **Cache effectiveness**: 50-80% faster on reload (after cache warm-up)
- **Error tolerance**: Unknown languages fall back to plain text gracefully
- **Memory efficiency**: < 100MB memory increase for typical documents
- **Configuration responsive**: Settings apply immediately without restart

### Incorrect Behaviors ❌

If you observe these, please report as bugs:

- **No highlighting**: Code blocks appear without syntax highlighting
- **Wrong colors**: Colors don't match theme or are random
- **Flickering**: Constant re-rendering or flashing
- **Freezing**: Extension causes VS Code to freeze or hang
- **Console errors**: Red error messages in Developer Tools
- **Memory leaks**: Memory usage continuously increases
- **Stale highlighting**: Highlighting doesn't update on theme change
- **Crashes**: Extension causes VS Code to crash

---

## Performance Validation

### Running Benchmarks

**Automated Benchmark:**
```bash
npm run test:benchmark
```

**Expected Results:**
```
Tokenization Performance:
  ✓ Small Block (10 lines): < 10ms
  ✓ Medium Block (100 lines): < 50ms
  ✓ Large Block (500 lines): < 200ms
  ✓ Very Large Block (10,000 lines): < 500ms

Cache Performance:
  ✓ Hit rate: > 80%
  Performance improvement: 70-80%

Rapid Operations:
  ✓ Theme switch: < 100ms

Memory:
  Total increase: < 50MB for 1000 blocks
```

### Manual Performance Testing

**Test 1: Time to First Paint**
1. Close all previews
2. Open [`test/sample.md`](test/sample.md:1)
3. Start timer
4. Open preview (`Ctrl+Shift+V`)
5. Stop timer when all content rendered
6. **Target**: < 500ms

**Test 2: Scroll Performance**
1. Open preview of large document
2. Scroll rapidly from top to bottom
3. Observe smoothness
4. **Target**: No lag, 60 FPS

**Test 3: Memory Usage**
1. Open Task Manager (Windows) or Activity Monitor (macOS)
2. Find VS Code Extension Host process
3. Note baseline memory
4. Open preview
5. Note memory increase
6. **Target**: < 100MB increase

**Test 4: Cache Performance**
1. Open preview (cold cache)
2. Note load time
3. Close preview
4. Reopen preview (warm cache)
5. Compare load times
6. **Target**: 50-80% faster

---

## Theme Compatibility

### Supported Themes

The extension should work with **all** VS Code themes, including:

**Built-in Themes:**
- ✅ Dark+ (default dark)
- ✅ Light+ (default light)
- ✅ Dark Modern
- ✅ Light Modern
- ✅ Dark High Contrast
- ✅ Light High Contrast
- ✅ Monokai
- ✅ Solarized Light
- ✅ Solarized Dark

**Popular Extension Themes:**
- ✅ Dracula Official
- ✅ One Dark Pro
- ✅ Material Theme
- ✅ Nord
- ✅ Palenight
- ✅ Gruvbox
- ✅ Ayu
- ✅ Tokyo Night

### Theme Testing Procedure

For each theme:
1. Switch to theme
2. Open preview
3. Verify:
   - [ ] Highlighting colors match theme
   - [ ] Text is readable (good contrast)
   - [ ] Background matches theme's editor background
   - [ ] No garish or mismatched colors

**Custom Theme Test:**
If you have custom themes installed:
1. Test with your custom theme
2. Verify colors are appropriate
3. Report any theme-specific issues

---

## Configuration Testing

### Complete Settings Reference

Test each setting:

#### `enableHighlighting` (boolean, default: true)
- **Test**: Toggle on/off
- **Expected**: Highlighting turns on/off immediately

#### `fontSize` (number, default: 0)
- **Test**: Set to 14, 16, 18
- **Expected**: Font size changes in preview

#### `lineHeight` (number, default: 1.5)
- **Test**: Set to 1.2, 1.5, 2.0
- **Expected**: Line spacing adjusts

#### `enableCache` (boolean, default: true)
- **Test**: Disable, reload preview multiple times
- **Expected**: No performance improvement (cache disabled)

#### `cacheSize` (number, default: 100)
- **Test**: Set to 10, reload large document
- **Expected**: Cache limits to 10 entries

#### `maxBlockSize` (number, default: 10000)
- **Test**: Set to 100, view large blocks
- **Expected**: Large blocks fall back to plain text

#### `enablePerfMonitoring` (boolean, default: false)
- **Test**: Enable, check console
- **Expected**: Detailed performance logs appear

#### `lazyLoadThreshold` (number, default: 3)
- **Test**: Set to 1, 5, 10
- **Expected**: Affects preloading behavior

#### `tokenizationTimeout` (number, default: 5000)
- **Test**: Set to 1000, view very large blocks
- **Expected**: Timeout occurs faster

#### `batchDelay` (number, default: 50)
- **Test**: Set to 10, 100, 500
- **Expected**: Affects debouncing of updates

#### `concurrentRequests` (number, default: 5)
- **Test**: Set to 1, 10
- **Expected**: Affects parallel tokenization

---

## Known Limitations

### Current Limitations

1. **Very Large Blocks** (> 10,000 lines)
   - May experience slower tokenization
   - Consider splitting into smaller blocks
   - Respects `maxBlockSize` configuration

2. **Custom Language Grammars**
   - Uses VS Code's built-in tokenization
   - Requires language extension to be installed
   - Falls back to plain text for unknown languages

3. **Embedded Code Blocks**
   - Code within inline `code` is not highlighted (by design)
   - Only fenced code blocks (```) are processed

4. **Real-time Editing**
   - Highlighting updates on preview refresh, not on every keystroke
   - This is intentional for performance

5. **Limited Customization**
   - Colors come from VS Code theme
   - Cannot override individual token colors (uses theme)

### Planned Features (Future Releases)

- [ ] Custom color overrides
- [ ] Export highlighted code as HTML/Image
- [ ] Line numbers option
- [ ] Copy code button
- [ ] Diff highlighting support
- [ ] Inline code highlighting

---

## Troubleshooting

### Issue: No Syntax Highlighting Appears

**Symptoms:** Code blocks show no colors, look like plain text

**Solutions:**
1. **Check Configuration**
   - Settings → Search "markdown code block"
   - Verify `Enable Highlighting` is ON
   
2. **Verify Extension Activated**
   - Open Developer Tools (`Help → Toggle Developer Tools`)
   - Console should show: `[Extension] Code Block Highlighter activated`
   - If not, extension didn't activate

3. **Reload Window**
   - Command Palette → `Developer: Reload Window`
   - Try opening preview again

4. **Check Extension Installed**
   - Extensions view → Search for "Markdown Code Block Highlighter"
   - Should show as installed and enabled

5. **Reinstall Extension**
   - Uninstall → Restart VS Code → Reinstall

---

### Issue: Highlighting Doesn't Update on Theme Change

**Symptoms:** Colors stay the same when switching themes

**Solutions:**
1. **Reload Preview**
   - Close preview tab
   - Reopen with `Ctrl+Shift+V`

2. **Check Console for Errors**
   - Open Developer Tools
   - Look for JavaScript errors
   - Report if found

3. **Clear Cache**
   - Command Palette → `Code Block: Clear Cache` (if available)
   - Reload preview

4. **Restart VS Code**
   - Close and reopen VS Code
   - Try theme switch again

---

### Issue: Poor Performance / Slow Preview

**Symptoms:** Preview takes long to load, laggy scrolling

**Solutions:**
1. **Check Document Size**
   - Very large documents (> 100 blocks) may be slower
   - Consider splitting document

2. **Adjust Cache Settings**
   - Increase `cacheSize` to 200-500
   - Enable cache if disabled

3. **Disable Performance Monitoring**
   - Set `enablePerfMonitoring` to false
   - Logging impacts performance

4. **Reduce Max Block Size**
   - Set `maxBlockSize` to 5000
   - Very large blocks will fall back faster

5. **Check System Resources**
   - Close other applications
   - Check CPU/memory usage

6. **Run Benchmark**
   ```bash
   npm run test:benchmark
   ```
   - Compare results to targets
   - Report if significantly slower

---

### Issue: Extension Not Activating

**Symptoms:** No logs in console, extension seems inactive

**Solutions:**
1. **Verify Activation Event**
   - Extension activates on Markdown file open
   - Open a `.md` file (not `.txt`)

2. **Check Extension Host**
   - Help → Toggle Developer Tools
   - Check for errors in Console

3. **View Extension Logs**
   - Output panel → "Extension Host"
   - Look for errors or warnings

4. **Reinstall Dependencies**
   ```bash
   npm install
   npm run compile
   ```

5. **Check VS Code Version**
   - Help → About
   - Must be version 1.80.0 or higher
   - Update VS Code if needed

---

### Issue: Console Errors

**Symptoms:** Red error messages in Developer Tools

**Common Errors and Solutions:**

**Error:** `Cannot read property 'X' of undefined`
- **Cause:** Extension trying to access unavailable data
- **Solution:** Reload window, report if persists

**Error:** `Timeout: Tokenization took too long`
- **Cause:** Code block too large or complex
- **Solution:** Increase `tokenizationTimeout` or reduce `maxBlockSize`

**Error:** `Theme manager not initialized`
- **Cause:** Theme data not loaded yet
- **Solution:** Reload window, should be transient

---

### Issue: Memory Leaks

**Symptoms:** Memory usage continuously increases

**Diagnostic:**
1. Open Task Manager / Activity Monitor
2. Find "Code - Extension Host" process
3. Monitor memory over time
4. If increases without bound, memory leak possible

**Solutions:**
1. **Clear Cache Periodically**
   - Cache may grow too large
   - Command: `Code Block: Clear Cache`

2. **Reduce Cache Size**
   - Settings: `cacheSize` → 50

3. **Reload Window**
   - Command: `Developer: Reload Window`

4. **Report Issue**
   - Include memory usage details
   - Steps to reproduce

---

### Diagnostic Commands

**Check Extension Status:**
```javascript
// In Developer Tools Console
vscode.extensions.getExtension('your-publisher.markdown-code-block-highlighter')
```

**Check Memory Usage:**
```javascript
// In Developer Tools Console
performance.memory
```

**Force Garbage Collection (if available):**
```javascript
// Start VS Code with: code --js-flags="--expose-gc"
if (global.gc) global.gc();
```

---

## Reporting Issues

### Before Reporting

1. **Search Existing Issues**
   - Check GitHub issues for similar problems
   - May already have a solution

2. **Try Troubleshooting Steps**
   - Follow relevant troubleshooting section above
   - Note what you tried

3. **Gather Information**
   - VS Code version
   - Extension version
   - Operating system
   - Theme being used
   - Console errors (screenshot)

### Creating an Issue

**Include:**
1. **Title**: Clear, concise description
2. **Description**: What went wrong? What did you expect?
3. **Steps to Reproduce**:
   - Step 1: ...
   - Step 2: ...
   - Expected: ...
   - Actual: ...
4. **Environment**:
   - VS Code version: X.X.X
   - Extension version: X.X.X
   - OS: Windows 11 / macOS 14 / Ubuntu 22.04
   - Theme: Theme name
5. **Console Logs**: (from Developer Tools)
6. **Screenshots**: (if visual issue)
7. **Sample Code**: (if specific code causes issue)

**Example Issue:**
```markdown
## Syntax Highlighting Not Working for Python

**Description:**
Python code blocks in Markdown preview show no syntax highlighting.
JavaScript and TypeScript work fine.

**Steps to Reproduce:**
1. Create file `test.md` with Python code block:
   ````markdown
   ```python
   def hello():
       print("Hello")
   ```
   ````
2. Open preview
3. No highlighting visible

**Environment:**
- VS Code: 1.85.0
- Extension: 0.1.0
- OS: Windows 11
- Theme: Dark+

**Console Logs:**
```
[Extension] Code Block Highlighter activated
[Tokenization] Falling back to plain text for unsupported language: python
```

**Expected:** Python keywords and strings should be highlighted
**Actual:** Shows as plain text
```

---

## Additional Resources

- **Source Code**: [GitHub Repository](https://github.com/your-username/markdown-code-block-highlighter)
- **Issue Tracker**: [GitHub Issues](https://github.com/your-username/markdown-code-block-highlighter/issues)
- **Changelog**: See [CHANGELOG.md](CHANGELOG.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Integration Tests**: See [test/integration.test.md](test/integration.test.md:1)

---

## Testing Checklist

Use this checklist to verify all testing procedures:

- [ ] Extension activates without errors
- [ ] Basic syntax highlighting works
- [ ] Theme switching updates colors
- [ ] Large documents load smoothly
- [ ] Cache improves performance
- [ ] Configuration changes apply
- [ ] Edge cases handled gracefully
- [ ] Multiple languages supported
- [ ] Split view works correctly
- [ ] No console errors
- [ ] Memory usage reasonable
- [ ] Performance benchmarks pass

---

**Happy Testing! 🧪**

If you encounter any issues not covered in this guide, please [open an issue](https://github.com/your-username/markdown-code-block-highlighter/issues) on GitHub.
