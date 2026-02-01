# Quality Assurance Checklist

Use this checklist to verify the extension meets quality standards before release.

---

## 📋 Pre-Release QA Checklist

### Build and Compilation ✅

- [ ] **TypeScript compiles without errors**
  ```bash
  npm run compile
  ```
  - Expected: No TypeScript errors
  - All `.ts` files compile to `.js` in `out/` directory

- [ ] **No TypeScript warnings**
  ```bash
  npm run test:compile
  ```
  - Expected: Clean compilation
  - No unused variables or imports

- [ ] **Linting passes**
  ```bash
  npm run lint
  ```
  - Expected: No ESLint errors or warnings
  - Code follows style guidelines

- [ ] **Automated tests pass**
  ```bash
  npm run test:extension
  ```
  - Expected: All validation tests pass
  - No file structure issues

- [ ] **Benchmarks meet targets**
  ```bash
  npm run test:benchmark
  ```
  - Expected: Performance within acceptable ranges
  - Cache hit rate > 80%

---

### Extension Activation 🚀

- [ ] **Extension activates on Markdown files**
  - Open a `.md` file
  - Check console: `[Extension] Code Block Highlighter activated`
  - No activation errors

- [ ] **Extension does NOT activate unnecessarily**
  - Open non-Markdown files (`.txt`, `.js`, etc.)
  - Extension should remain inactive
  - No unnecessary resource usage

- [ ] **Activation performance**
  - Activation time < 500ms
  - No blocking of VS Code startup
  - Background initialization completes smoothly

- [ ] **Deactivation cleanup**
  - Close all Markdown files
  - Extension cleans up resources
  - No memory leaks
  - Event listeners removed

---

### Core Functionality 🎨

- [ ] **Basic syntax highlighting works**
  - Open [`test/sample.md`](test/sample.md:1)
  - Open preview (`Ctrl+Shift+V` / `Cmd+Shift+V`)
  - All code blocks display with syntax highlighting
  - Colors match current theme

- [ ] **Multiple languages supported**
  - JavaScript, TypeScript, Python, Java highlighted correctly
  - HTML, CSS, SQL rendered properly
  - Rust, Go, C++ show appropriate colors
  - At least 15+ languages verified

- [ ] **Theme switching updates immediately**
  - Open preview with Dark+ theme
  - Switch to Light+ theme
  - Highlighting updates within 100ms
  - No flicker or flash of unstyled content

- [ ] **Large documents load smoothly**
  - [`test/sample.md`](test/sample.md:1) (50+ blocks) loads < 1 second
  - Scrolling is smooth (60 FPS)
  - No freezing or lag
  - Very large blocks (500+ lines) render correctly

- [ ] **Cache improves performance**
  - First load: Full tokenization
  - Second load (after close/reopen): 50-80% faster
  - Cache hit rate visible in logs (if monitoring enabled)
  - Memory usage reasonable (< 100MB increase)

---

### Configuration ⚙️

- [ ] **All settings work correctly**
  
  #### Enable/Disable Highlighting
  - [ ] Toggle `enableHighlighting` OFF → highlighting disappears
  - [ ] Toggle back ON → highlighting returns
  - [ ] No restart required
  
  #### Font Size
  - [ ] Set `fontSize` to 14 → code blocks use 14px font
  - [ ] Set to 16 → updates immediately
  - [ ] Set to 0 → uses VS Code default
  
  #### Line Height
  - [ ] Set `lineHeight` to 1.2 → compact spacing
  - [ ] Set to 2.0 → loose spacing
  - [ ] Changes apply immediately
  
  #### Cache Settings
  - [ ] Disable `enableCache` → no caching (verify via logs)
  - [ ] Set `cacheSize` to 10 → cache limits to 10 entries
  - [ ] Enable `enableCache` → caching resumes
  
  #### Performance Settings
  - [ ] Set `maxBlockSize` to 100 → large blocks fall back
  - [ ] Enable `enablePerfMonitoring` → logs appear in console
  - [ ] Adjust `concurrentRequests` → affects parallelization

- [ ] **Invalid configuration handled gracefully**
  - Set `cacheSize` to -1 → uses default or minimum
  - Set `lineHeight` to 10 → clamped to maximum
  - Invalid values don't crash extension

---

### Edge Cases and Error Handling 🐛

- [ ] **Unknown languages handled gracefully**
  - Code block with `invalidlang` → renders as plain text
  - No errors in console
  - Fallback message in logs (if monitoring enabled)

- [ ] **Empty code blocks**
  - Empty blocks render without errors
  - No console warnings
  - Correct spacing maintained

- [ ] **No language specified**
  - Code blocks without language tag render as plain text
  - Expected behavior, no errors

- [ ] **Very long lines**
  - Horizontal scrolling works
  - No text overflow
  - Performance acceptable

- [ ] **Unicode and special characters**
  - Emoji render correctly: 😀🎉🚀
  - Math symbols display: ∑∫∂√π
  - Non-ASCII characters work: 世界, Привет, مرحبا
  - No encoding issues

- [ ] **Nested structures**
  - Code in lists highlights correctly
  - Code in blockquotes works
  - Code in tables renders properly

- [ ] **Malformed Markdown**
  - Extension doesn't crash on malformed Markdown
  - Errors handled gracefully
  - User-friendly error messages

---

### Performance Validation ⚡

- [ ] **Small blocks (10 lines) < 10ms**
  - Verify via benchmarks or performance monitoring
  - Consistent across runs

- [ ] **Medium blocks (100 lines) < 50ms**
  - Acceptable tokenization time
  - No lag during scrolling

- [ ] **Large blocks (500 lines) < 200ms**
  - Renders without freezing
  - Progressive rendering if needed

- [ ] **Very large blocks (10,000 lines) < 500ms**
  - Falls back gracefully if exceeds `maxBlockSize`
  - Timeout doesn't crash extension

- [ ] **Theme switch (50 blocks) < 100ms**
  - All blocks update quickly
  - Smooth transition
  - No visual glitches

- [ ] **Cache hit rate > 80%**
  - On document reload
  - Verified via performance logs
  - Memory usage stable

- [ ] **Memory usage reasonable**
  - < 100MB increase for typical documents
  - No memory leaks over time
  - Garbage collection works

- [ ] **Scroll performance 60 FPS**
  - Smooth scrolling in large documents
  - No frame drops
  - Lazy loading works

---

### User Interface 🖥️

- [ ] **No console errors**
  - Open Developer Tools (`Help → Toggle Developer Tools`)
  - Console tab shows no red errors
  - Only expected info/debug messages

- [ ] **Status bar integration (if applicable)**
  - Status bar item appears when preview active
  - Shows relevant information (cache stats, etc.)
  - Clicking opens details
  - Hides when preview closes

- [ ] **Command palette commands work**
  - All registered commands appear in palette
  - Commands execute correctly
  - User feedback provided

- [ ] **No UI flickering or glitches**
  - Preview updates smoothly
  - Theme changes don't cause flicker
  - No layout shifts

- [ ] **Split view works correctly**
  - Preview in split view updates
  - Both source and preview synchronized
  - No conflicts between views

---

### Theme Compatibility 🌈

Test with multiple themes:

- [ ] **Dark+ (default dark)** ✅
  - Syntax highlighting appropriate
  - Good contrast
  - Readable

- [ ] **Light+ (default light)** ✅
  - Colors match theme
  - Text readable
  - No contrast issues

- [ ] **Dark Modern** ✅
  - Highlighting works
  - Theme colors respected

- [ ] **Light Modern** ✅
  - Appropriate light colors
  - Good readability

- [ ] **Monokai** ✅
  - Distinctive Monokai colors
  - Syntax highlighting accurate

- [ ] **Solarized Light** ✅
  - Solarized palette used
  - Pleasant appearance

- [ ] **High Contrast Dark** ♿
  - Excellent contrast for accessibility
  - All text readable
  - WCAG AA compliant

- [ ] **High Contrast Light** ♿
  - High contrast maintained
  - Accessibility requirements met

- [ ] **Custom theme (if available)** ✅
  - Works with user's theme
  - No hardcoded colors
  - Graceful fallback if theme incomplete

---

### Documentation 📚

- [ ] **README.md complete and accurate**
  - Installation instructions clear
  - Usage examples work
  - Configuration documented
  - Screenshots/GIFs present (or placeholders)

- [ ] **TESTING.md comprehensive**
  - All test scenarios documented
  - Instructions clear
  - Expected results specified

- [ ] **CONTRIBUTING.md helpful**
  - Development setup explained
  - Code architecture documented
  - PR process clear

- [ ] **ARCHITECTURE.md up-to-date**
  - Reflects current implementation
  - Design decisions documented
  - Diagrams accurate

- [ ] **Inline code comments**
  - Complex logic explained
  - Public APIs documented
  - JSDoc comments for TypeScript

- [ ] **package.json metadata**
  - Correct version number
  - Accurate description
  - Keywords appropriate
  - Repository URL correct
  - License specified

---

### Packaging 📦

- [ ] **Extension packages successfully**
  ```bash
  npm run package
  ```
  - `.vsix` file created
  - No packaging errors
  - File size reasonable (< 10MB)

- [ ] **Package validation passes**
  ```bash
  npx vsce ls
  ```
  - Lists all included files
  - No unexpected files
  - Source files excluded (via `.vscodeignore`)

- [ ] **.vscodeignore configured correctly**
  - `src/` excluded
  - `test/` excluded
  - `node_modules/` excluded
  - `out/` included
  - `README.md` included

- [ ] **Extension installs from VSIX**
  - Install `.vsix` file in VS Code
  - Extension activates
  - All features work

- [ ] **Extension size acceptable**
  - < 5MB ideal
  - < 10MB acceptable
  - If larger, investigate compression

---

### Security 🔒

- [ ] **No secrets in code**
  - No hardcoded API keys
  - No passwords or tokens
  - No sensitive data

- [ ] **Dependencies up-to-date**
  ```bash
  npm audit
  ```
  - No high/critical vulnerabilities
  - All dependencies necessary

- [ ] **No arbitrary code execution**
  - User input sanitized
  - No `eval()` or `Function()` constructors
  - Safe data handling

- [ ] **Webview security**
  - Content Security Policy configured
  - No inline scripts
  - Resources loaded securely

---

### Accessibility ♿

- [ ] **Screen reader compatible**
  - Semantic HTML maintained
  - ARIA attributes preserved
  - Code blocks navigable

- [ ] **Keyboard navigation works**
  - All features accessible via keyboard
  - Focus indicators visible
  - Tab order logical

- [ ] **High contrast themes work**
  - Text readable in all contrast modes
  - WCAG AA contrast ratios met
  - No color-only information

- [ ] **Respects user preferences**
  - Font size settings honored
  - Motion preferences respected (if applicable)
  - Theme preferences followed

---

### Cross-Platform Testing 🖥️

- [ ] **Windows 10/11**
  - Extension installs
  - All features work
  - Performance acceptable
  - No platform-specific bugs

- [ ] **macOS (latest)**
  - Extension installs
  - Keyboard shortcuts work (Cmd vs Ctrl)
  - Rendering correct
  - Performance good

- [ ] **Linux (Ubuntu or similar)**
  - Extension installs
  - All features functional
  - No Linux-specific issues
  - Performance acceptable

---

### Regression Testing 🔄

After bug fixes or new features:

- [ ] **Previous bugs don't reappear**
  - Check known issue list
  - Verify fixes still work
  - No new regressions introduced

- [ ] **Existing features still work**
  - Core functionality intact
  - No breaking changes
  - Backward compatibility maintained

- [ ] **Performance not degraded**
  - Benchmarks still meet targets
  - No slowdowns introduced
  - Memory usage stable

---

## 🎯 Release Criteria

**Minimum requirements for release:**

✅ **Critical (Must Pass)**
- [ ] Extension compiles without errors
- [ ] Basic syntax highlighting works
- [ ] Theme switching works
- [ ] No console errors in normal usage
- [ ] Performance benchmarks meet minimum targets
- [ ] Extension packages successfully

✅ **Important (Should Pass)**
- [ ] All automated tests pass
- [ ] Large documents perform well
- [ ] Cache improves performance
- [ ] Configuration settings work
- [ ] Documentation complete

⚠️ **Nice to Have (Good to Pass)**
- [ ] All themes tested
- [ ] Cross-platform testing complete
- [ ] Accessibility fully validated
- [ ] All edge cases handled

---

## 📊 Test Results

### Test Session Information

| Field | Value |
|-------|-------|
| **Date** | YYYY-MM-DD |
| **Tester** | [Name] |
| **VS Code Version** | [Version] |
| **Extension Version** | [Version] |
| **OS** | [Windows 11 / macOS 14 / Ubuntu 22.04] |
| **Node Version** | [Version] |

### Results Summary

| Category | Pass | Fail | Skip | Notes |
|----------|------|------|------|-------|
| Build & Compilation | ☐ | ☐ | ☐ | |
| Extension Activation | ☐ | ☐ | ☐ | |
| Core Functionality | ☐ | ☐ | ☐ | |
| Configuration | ☐ | ☐ | ☐ | |
| Edge Cases | ☐ | ☐ | ☐ | |
| Performance | ☐ | ☐ | ☐ | |
| User Interface | ☐ | ☐ | ☐ | |
| Theme Compatibility | ☐ | ☐ | ☐ | |
| Documentation | ☐ | ☐ | ☐ | |
| Packaging | ☐ | ☐ | ☐ | |
| Security | ☐ | ☐ | ☐ | |
| Accessibility | ☐ | ☐ | ☐ | |

### Issues Found

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| 1 | Critical/High/Medium/Low | [Description] | Open/Fixed |
| 2 | | | |

### Overall Assessment

☐ **Ready for Release** - All critical and important tests pass
☐ **Needs Minor Fixes** - Some nice-to-have items need attention
☐ **Needs Major Fixes** - Critical or important tests failed
☐ **Not Ready** - Significant issues found

### Sign-off

**QA Tester:** _________________________ **Date:** ___________

**Lead Developer:** _____________________  **Date:** ___________

---

## 📝 Notes

- This checklist should be completed before each release
- Document all issues found during testing
- Retest after fixes are applied
- Keep this document updated with new test cases

---

**Last Updated:** [Date]
**Checklist Version:** 1.0
