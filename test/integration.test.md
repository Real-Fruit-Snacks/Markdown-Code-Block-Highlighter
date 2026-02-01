# Integration Test Plan

This document provides structured test scenarios for the **Code Block Syntax Highlighter** extension.

---

## Test Environment Setup

**Prerequisites:**
- VS Code version 1.80.0 or higher
- Extension installed in Development Extension Host
- Sample test document available ([`test/sample.md`](sample.md:1))

**Setup Steps:**
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build TypeScript
4. Press F5 to launch Extension Development Host
5. Open [`test/sample.md`](sample.md:1) in the Development Host

---

## Test Scenario 1: Basic Syntax Highlighting

**Objective:** Verify that code blocks render with proper syntax highlighting

**Steps:**
1. Open [`test/sample.md`](sample.md:1) in VS Code
2. Open Markdown preview (Ctrl+Shift+V or Cmd+Shift+V on Mac)
3. Scroll through the document
4. Observe each code block

**Expected Results:**
- ✅ JavaScript blocks show syntax highlighting with proper colors
- ✅ TypeScript blocks show type annotations in distinct colors
- ✅ Python blocks show keywords, strings, and functions highlighted
- ✅ All supported languages render with appropriate highlighting
- ✅ No flickering or rendering delays
- ✅ Colors match the current VS Code theme

**Performance Benchmark:**
- Initial render: < 500ms for entire document
- Scroll lag: None
- Memory usage: < 50MB increase

**Test Data:** Sections 1-3 of [`sample.md`](sample.md:1)

---

## Test Scenario 2: Theme Switching

**Objective:** Verify highlighting updates when theme changes

**Steps:**
1. Open [`test/sample.md`](sample.md:1) preview
2. Note the current syntax highlighting colors
3. Change VS Code theme:
   - Open Command Palette (Ctrl+Shift+P)
   - Type "Preferences: Color Theme"
   - Select a different theme (e.g., Dark+ → Light+)
4. Observe the preview window

**Expected Results:**
- ✅ Syntax highlighting updates immediately (within 100ms)
- ✅ Colors match the new theme
- ✅ No flash of unstyled content
- ✅ All code blocks update consistently
- ✅ No console errors

**Test Themes:**
- Dark Modern (default dark)
- Light Modern (default light)
- Monokai
- Solarized Light
- Dracula (if installed)

**Performance Benchmark:**
- Theme switch response time: < 100ms
- No visual artifacts during transition

---

## Test Scenario 3: Large Document Performance

**Objective:** Verify extension handles large documents efficiently

**Test Document Stats:**
- Total code blocks: 50+
- Largest block: 500+ lines (Python Flask app)
- Total lines: 1,500+
- Languages: 15+

**Steps:**
1. Open [`test/sample.md`](sample.md:1) preview
2. Monitor performance (open Developer Tools: Help → Toggle Developer Tools)
3. Scroll rapidly up and down
4. Observe console for errors
5. Check memory usage in Task Manager

**Expected Results:**
- ✅ Initial load: < 1 second
- ✅ Smooth scrolling (60 FPS)
- ✅ No JavaScript errors in console
- ✅ Memory usage stable (< 100MB)
- ✅ Large blocks render without freezing

**Performance Benchmarks:**
- Time to first paint: < 500ms
- Time to interactive: < 1000ms
- Scroll frame rate: 60 FPS
- Memory usage: < 100MB total

**Monitoring Commands:**
```javascript
// In Developer Tools Console
console.time('render');
// Reload preview
console.timeEnd('render');

// Check memory
performance.memory.usedJSHeapSize / 1048576 + ' MB'
```

---

## Test Scenario 4: Cache Effectiveness

**Objective:** Verify LRU cache improves performance on repeated renders

**Steps:**
1. Open [`test/sample.md`](sample.md:1) preview
2. Note initial load time (check console logs)
3. Close preview
4. Reopen preview (Ctrl+Shift+V)
5. Note second load time
6. Switch to another file
7. Switch back to [`sample.md`](sample.md:1)
8. Check cache statistics in status bar

**Expected Results:**
- ✅ First load: Tokenizes all blocks
- ✅ Second load: Significantly faster (50%+ improvement)
- ✅ Cache hit rate: > 80% on reload
- ✅ Status bar shows cache statistics
- ✅ Cache persists across file switches

**Performance Benchmarks:**
- First load: ~1000ms
- Cached load: ~200ms (80% improvement)
- Cache hit rate: > 80%

**Validation:**
Check console logs for cache messages:
```
[Cache] Cache hit for block-<hash>
[Cache] Cache miss for block-<hash>
[Performance] Cache hit rate: 85%
```

---

## Test Scenario 5: Fallback Mechanism

**Objective:** Verify graceful degradation for unsupported languages

**Steps:**
1. Navigate to Section 4 "Edge Cases" in [`sample.md`](sample.md:1)
2. Observe blocks with:
   - No language specified
   - Invalid language name (`invalidlang`)
   - Empty code blocks

**Expected Results:**
- ✅ No language: Renders as plain text (no highlighting)
- ✅ Invalid language: Falls back to plain text
- ✅ Empty blocks: Render without errors
- ✅ No console errors or warnings
- ✅ Graceful fallback message in console (debug mode)

**Console Messages:**
```
[Tokenization] Falling back to plain text for unsupported language: invalidlang
[Tokenization] Empty code block, skipping tokenization
```

---

## Test Scenario 6: Configuration Changes

**Objective:** Verify extension respects configuration settings

**Steps:**
1. Open VS Code Settings (File → Preferences → Settings)
2. Search for "codeBlock"
3. Modify each setting and observe behavior:

**Settings to Test:**

### 6.1 Enable/Disable Highlighting
```json
{
  "codeBlock.enableHighlighting": false
}
```
**Expected:** Code blocks render without custom highlighting (default Markdown preview)

### 6.2 Cache Size
```json
{
  "codeBlock.cacheSize": 10
}
```
**Expected:** Cache limited to 10 entries, older entries evicted

### 6.3 Performance Monitoring
```json
{
  "codeBlock.enablePerformanceMonitoring": true
}
```
**Expected:** Detailed performance metrics in console and status bar

### 6.4 Debounce Delay
```json
{
  "codeBlock.debounceDelay": 500
}
```
**Expected:** Preview updates 500ms after typing stops

**Expected Results:**
- ✅ Configuration changes apply immediately
- ✅ No extension restart required
- ✅ Settings persist across sessions
- ✅ Invalid values handled gracefully

---

## Test Scenario 7: Error Recovery

**Objective:** Verify extension handles errors gracefully

**Error Scenarios:**

### 7.1 Corrupted Theme Data
**Simulate:** Manually corrupt theme token colors in Developer Tools
**Expected:** Falls back to default colors, user-friendly error message

### 7.2 Memory Pressure
**Simulate:** Open many large documents simultaneously
**Expected:** Cache eviction works, no crashes, performance degrades gracefully

### 7.3 Missing Dependencies
**Simulate:** Temporarily rename VS Code API methods
**Expected:** Clear error message, extension doesn't crash VS Code

### 7.4 Malformed Code Blocks
**Test Data:** Section 4 of [`sample.md`](sample.md:1)
**Expected:** Renders without errors, graceful handling

**Expected Results:**
- ✅ No unhandled exceptions
- ✅ User-friendly error messages
- ✅ Extension continues to function
- ✅ Errors logged to console with context
- ✅ VS Code remains stable

---

## Test Scenario 8: Edge Cases

**Objective:** Test boundary conditions and special characters

**Test Cases:**

### 8.1 Very Long Lines
**Location:** Section 4, "Very Long Single Line"
**Expected:** Horizontal scrolling works, no text overflow

### 8.2 Unicode and Emoji
**Location:** Section 4, "Special Characters and Unicode"
**Expected:** All characters render correctly, no encoding issues

### 8.3 Nested Structures
**Location:** Section 5, "Nested Structures"
**Expected:** Code in lists, blockquotes, tables all highlight correctly

### 8.4 Rapid File Switching
**Steps:** Quickly switch between multiple files with code blocks
**Expected:** No race conditions, correct highlighting per file

### 8.5 Preview Split View
**Steps:** Open preview in split view with source
**Expected:** Both views render correctly, sync works

**Expected Results:**
- ✅ All edge cases handled gracefully
- ✅ No visual glitches
- ✅ No console errors
- ✅ Performance remains acceptable

---

## Test Scenario 9: Multi-Language Document

**Objective:** Verify handling of documents with many different languages

**Steps:**
1. Scroll through entire [`sample.md`](sample.md:1)
2. Verify each language section

**Languages to Verify:**
- [x] JavaScript (ES6+)
- [x] TypeScript (with types)
- [x] Python (with decorators)
- [x] Java (with classes)
- [x] C++ (with STL)
- [x] Rust (async/await)
- [x] Go (concurrency)
- [x] HTML (with structure)
- [x] CSS (with variables)
- [x] SQL (with joins)
- [x] Bash/Shell (with functions)
- [x] JSON (with nesting)
- [x] Ruby (with classes)

**Expected Results:**
- ✅ All languages render with distinct highlighting
- ✅ Language-specific features highlighted correctly
- ✅ No language confusion (e.g., Python syntax in JavaScript)
- ✅ Consistent rendering across all blocks

---

## Test Scenario 10: Status Bar Integration

**Objective:** Verify status bar shows accurate information

**Steps:**
1. Open [`sample.md`](sample.md:1) preview
2. Observe status bar (bottom of VS Code)
3. Switch themes
4. Reload preview
5. Monitor status bar updates

**Expected Status Bar Content:**
- Current theme name
- Number of code blocks processed
- Cache hit rate
- Performance metrics (if enabled)

**Expected Results:**
- ✅ Status bar appears when preview is active
- ✅ Information updates in real-time
- ✅ Clicking status bar shows detailed info
- ✅ Status bar hides when preview closes

---

## Test Scenario 11: Command Palette

**Objective:** Verify extension commands work correctly

**Commands to Test:**

### 11.1 Clear Cache
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Code Block: Clear Cache"
3. Execute command

**Expected:** Cache cleared, confirmation message, next render is slower

### 11.2 Show Performance Report
1. Open Command Palette
2. Type "Code Block: Show Performance Report"
3. Execute command

**Expected:** Modal with detailed performance metrics

### 11.3 Toggle Highlighting
1. Open Command Palette
2. Type "Code Block: Toggle Highlighting"
3. Execute command

**Expected:** Highlighting turns off/on immediately

---

## Performance Benchmarks Summary

| Metric | Target | Measured |
|--------|--------|----------|
| Initial Load (50 blocks) | < 1000ms | _________ |
| Cached Load | < 200ms | _________ |
| Theme Switch | < 100ms | _________ |
| Cache Hit Rate | > 80% | _________ |
| Memory Usage | < 100MB | _________ |
| Scroll FPS | 60 FPS | _________ |
| Large Block (500 lines) | < 150ms | _________ |

**Fill in measured values during testing**

---

## Browser Console Checks

Open Developer Tools (Help → Toggle Developer Tools) and verify:

### No Errors
```
✅ No red error messages
✅ No unhandled promise rejections
✅ No React/framework warnings
```

### Expected Log Messages
```
[Extension] Code Block Highlighter activated
[ThemeManager] Current theme: <theme-name>
[Cache] Initialized with size: 100
[Performance] Tokenization completed in Xms
```

### Memory Profile
```javascript
// Run in console
performance.memory
// Check: usedJSHeapSize should be reasonable
```

---

## Cleanup and Validation

After all tests:

1. **Check Extension State:**
   - No memory leaks (reload and compare memory)
   - Cache cleared properly on deactivate
   - Event listeners removed

2. **Validate Logs:**
   - No error or warning messages
   - Performance metrics within targets
   - Cache statistics reasonable

3. **User Experience:**
   - Fast and responsive
   - No visual glitches
   - Intuitive behavior

---

## Test Results Template

```markdown
## Test Session: YYYY-MM-DD

**Tester:** [Name]
**VS Code Version:** [Version]
**Extension Version:** [Version]
**OS:** [Windows/Mac/Linux]
**Theme Tested:** [Theme Name]

### Scenario Results

| Scenario | Pass | Fail | Notes |
|----------|------|------|-------|
| 1. Basic Highlighting | ☐ | ☐ | |
| 2. Theme Switching | ☐ | ☐ | |
| 3. Large Documents | ☐ | ☐ | |
| 4. Cache Effectiveness | ☐ | ☐ | |
| 5. Fallback Mechanism | ☐ | ☐ | |
| 6. Configuration Changes | ☐ | ☐ | |
| 7. Error Recovery | ☐ | ☐ | |
| 8. Edge Cases | ☐ | ☐ | |
| 9. Multi-Language | ☐ | ☐ | |
| 10. Status Bar | ☐ | ☐ | |
| 11. Commands | ☐ | ☐ | |

### Performance Benchmarks

[Fill in from table above]

### Issues Found

1. [Issue description]
2. [Issue description]

### Overall Assessment

☐ Ready for Release
☐ Needs Fixes
☐ Major Issues Found
```

---

## Automated Testing Notes

**Future Enhancements:**
- Unit tests for individual services
- E2E tests with Playwright
- Performance regression tests
- CI/CD integration

**Current Status:**
This document provides manual testing procedures. Automated tests are planned for future releases.

---

**Next Steps After Testing:**
1. Document any issues found
2. Fix critical bugs
3. Optimize performance bottlenecks
4. Update README with actual benchmark results
5. Prepare for release
