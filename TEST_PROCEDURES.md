# Manual Testing Procedures

This document outlines comprehensive manual testing procedures for the Markdown Code Block Highlighter extension.

## Prerequisites

- VS Code installed (version 1.80.0 or higher)
- Extension compiled (`npm run compile`)
- Test markdown file available (`src/test/fixtures/sample.md`)

---

## Section 1: Visual Verification

### 1.1 Basic Syntax Highlighting

**Objective:** Verify that code blocks are properly highlighted with theme-aware colors.

**Steps:**
1. Open VS Code with the extension installed
2. Open `src/test/fixtures/sample.md`
3. Open Markdown Preview (Ctrl+Shift+V or Cmd+Shift+V)
4. Verify each code block shows syntax highlighting:
   - JavaScript: Keywords in blue, strings in orange, comments in green
   - Python: Keywords, strings, and comments properly colored
   - TypeScript: Types and interfaces highlighted appropriately
   - JSON: Keys and values distinguished by color
   - HTML: Tags, attributes, and content properly colored
   - CSS: Selectors, properties, and values highlighted

**Expected Result:**
- All code blocks show appropriate syntax highlighting
- Colors match the current VS Code theme
- No blocks appear as plain text (unless specified)

**Pass/Fail:** [ ]

---

### 1.2 Theme Switching Test

**Objective:** Verify highlighting adapts to theme changes.

**Steps:**
1. With Markdown preview open, note the current colors
2. Change VS Code theme: File → Preferences → Color Theme
3. Switch to a light theme (e.g., "Light+")
4. Observe code block colors in preview
5. Switch to a dark theme (e.g., "Dark+")
6. Observe code block colors again
7. Try a high contrast theme

**Expected Result:**
- Code block colors update immediately on theme change
- Light themes use darker colors for better contrast
- Dark themes use lighter colors for better readability
- High contrast themes use maximum contrast colors

**Pass/Fail:** [ ]

---

### 1.3 Border Visibility Verification

**Objective:** Verify borders appear and match theme colors.

**Steps:**
1. Open Markdown preview with `sample.md`
2. Observe borders around code blocks
3. Verify border color matches theme aesthetic
4. Change theme and verify border color updates
5. Open settings and disable borders: `markdownCodeBlockHighlighter.showBorder: false`
6. Verify borders disappear
7. Re-enable borders

**Expected Result:**
- Borders visible by default
- Border color complements theme
- Border color updates on theme change
- Border width and radius are appropriate (1px, 4px radius default)
- Setting controls border visibility

**Pass/Fail:** [ ]

---

### 1.4 Copy Button Visibility

**Objective:** Verify copy button appears and functions correctly.

**Steps:**
1. Open Markdown preview with `sample.md`
2. Hover over a code block
3. Verify copy button appears in top-right corner
4. Move mouse away and verify button fades/disappears (if hover mode)
5. Change setting to `markdownCodeBlockHighlighter.copyButtonVisibility: "always"`
6. Verify button remains visible without hover

**Expected Result:**
- Copy button appears on hover (default)
- Button positioned correctly in top-right corner
- Button visibility matches setting (hover/always)
- Button styling matches theme

**Pass/Fail:** [ ]

---

## Section 2: Functional Verification

### 2.1 Copy Button Functionality

**Objective:** Test copy button actually copies code to clipboard.

**Steps:**
1. Open Markdown preview with code blocks
2. Hover over JavaScript code block
3. Click the copy button
4. Verify visual feedback (button shows "Copied!" or changes icon)
5. Open a text editor or notepad
6. Paste (Ctrl+V or Cmd+V)
7. Verify pasted content matches original code exactly
8. Test with different code blocks (Python, TypeScript, etc.)

**Expected Result:**
- Button provides immediate visual feedback on click
- Code is copied to clipboard accurately
- No extra whitespace or formatting issues
- Works consistently across all code blocks

**Pass/Fail:** [ ]

---

### 2.2 Copy Button Position Configuration

**Objective:** Verify copy button position can be configured.

**Steps:**
1. Open settings
2. Set `markdownCodeBlockHighlighter.copyButtonPosition: "top-right"`
3. Verify button in top-right corner
4. Change to `"top-left"` - verify button moves
5. Change to `"bottom-right"` - verify button moves
6. Change to `"bottom-left"` - verify button moves

**Expected Result:**
- Button position updates immediately on setting change
- Button remains accessible in all positions
- Button doesn't overlap code content

**Pass/Fail:** [ ]

---

### 2.3 Theme Synchronization

**Objective:** Verify real-time theme synchronization.

**Steps:**
1. Open Markdown preview
2. Keep preview visible
3. Change VS Code theme multiple times rapidly
4. Observe code block colors update

**Expected Result:**
- Colors update within 1 second of theme change
- No flickering or visual glitches
- Preview remains usable during updates
- All code blocks update consistently

**Pass/Fail:** [ ]

---

### 2.4 Configuration Changes

**Objective:** Test configuration changes take effect.

**Steps:**
1. Open settings (Ctrl+, or Cmd+,)
2. Change `markdownCodeBlockHighlighter.borderWidth: 2`
3. Verify borders become thicker
4. Change `markdownCodeBlockHighlighter.borderRadius: 8`
5. Verify corners become more rounded
6. Disable highlighting: `markdownCodeBlockHighlighter.enableHighlighting: false`
7. Verify highlighting disabled
8. Re-enable highlighting

**Expected Result:**
- All configuration changes take effect immediately or on reload
- Border width changes are visible (1-4px range)
- Border radius changes are visible (0-12px range)
- Disabling highlighting removes all syntax colors
- Re-enabling restores highlighting

**Pass/Fail:** [ ]

---

### 2.5 Command Palette Commands

**Objective:** Test extension commands work correctly.

**Steps:**
1. Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Type "Markdown Code Block" to filter commands
3. Execute "Clear Cache" command
4. Verify success message appears
5. Execute "Show Stats" command
6. Verify cache statistics displayed
7. Enable performance monitoring in settings
8. Execute "Show Detailed Stats" command
9. Verify performance metrics displayed

**Expected Result:**
- All commands appear in palette
- Commands execute without errors
- Appropriate feedback messages shown
- Statistics are accurate and informative

**Pass/Fail:** [ ]

---

## Section 3: Performance Verification

### 3.1 Small Documents (1-5 blocks)

**Objective:** Verify performance with small documents.

**Steps:**
1. Create markdown file with 3 code blocks
2. Open Markdown preview
3. Measure time to first highlight (< 1 second)
4. Scroll through document
5. Verify smooth scrolling (60fps)

**Expected Result:**
- Instant highlighting (< 1 second)
- No lag or stutter
- Smooth scrolling
- No performance warnings in console

**Pass/Fail:** [ ]

---

### 3.2 Medium Documents (10-25 blocks)

**Objective:** Verify performance with medium documents.

**Steps:**
1. Create markdown file with 15 code blocks
2. Open Markdown preview
3. Measure time to first highlight (< 2 seconds)
4. Scroll through entire document
5. Verify all blocks highlight correctly
6. Check memory usage (< 100MB increase)

**Expected Result:**
- Quick highlighting (< 2 seconds)
- All blocks highlighted correctly
- Smooth scrolling maintained
- Reasonable memory usage

**Pass/Fail:** [ ]

---

### 3.3 Large Documents (50+ blocks)

**Objective:** Verify performance with large documents.

**Steps:**
1. Create markdown file with 60 code blocks
2. Open Markdown preview
3. Measure time to initial render (< 5 seconds)
4. Scroll to bottom
5. Verify lazy loading works (blocks highlight as scrolled into view)
6. Monitor memory usage
7. Switch themes - verify smooth update

**Expected Result:**
- Reasonable initial render time (< 5 seconds)
- Lazy loading reduces initial load
- Smooth scrolling maintained
- Memory usage stays stable (< 200MB increase)
- Theme switching remains responsive

**Pass/Fail:** [ ]

---

### 3.4 Very Large Blocks (10,000+ lines)

**Objective:** Verify handling of extremely large code blocks.

**Steps:**
1. Create code block with 15,000 lines
2. Open Markdown preview
3. Verify extension doesn't crash
4. Check that fallback highlighting is used
5. Verify scrolling still works
6. Check console for errors

**Expected Result:**
- Extension handles large blocks gracefully
- Falls back to simpler highlighting or streaming
- No crashes or freezes
- Preview remains responsive
- Appropriate warnings in console (optional)

**Pass/Fail:** [ ]

---

## Section 4: Edge Cases

### 4.1 No Language Identifier

**Objective:** Test blocks without language specification.

**Steps:**
1. Create code block with just ``` (no language)
2. Open preview
3. Verify minimal highlighting applied
4. Verify no errors in console

**Expected Result:**
- Block renders without errors
- Basic highlighting applied (if possible)
- No crashes or warnings

**Pass/Fail:** [ ]

---

### 4.2 Invalid Language Identifier

**Objective:** Test blocks with unknown languages.

**Steps:**
1. Create block with ```unknown-language
2. Create block with ```xyz123
3. Open preview
4. Verify fallback to plaintext
5. Verify no errors

**Expected Result:**
- Blocks render as plaintext
- No errors or crashes
- Graceful degradation

**Pass/Fail:** [ ]

---

### 4.3 Empty Code Blocks

**Objective:** Test empty or whitespace-only blocks.

**Steps:**
1. Create empty code block: ```javascript\n```
2. Create whitespace-only block
3. Open preview
4. Verify no errors

**Expected Result:**
- Empty blocks render correctly
- No errors or crashes
- Appropriate spacing maintained

**Pass/Fail:** [ ]

---

### 4.4 Unicode Characters

**Objective:** Test blocks with special characters.

**Steps:**
1. Create blocks with:
   - Emoji: 🎉 🚀 💻
   - Chinese characters: 你好世界
   - Math symbols: ∑ ∫ ∂
   - Arrows: ← → ↑ ↓
2. Open preview
3. Verify all characters display correctly
4. Test copy-paste functionality

**Expected Result:**
- All Unicode characters display correctly
- No character corruption
- Copy-paste preserves all characters
- No rendering issues

**Pass/Fail:** [ ]

---

### 4.5 Very Long Lines

**Objective:** Test blocks with extremely long lines.

**Steps:**
1. Create code block with 10,000 character line
2. Open preview
3. Verify horizontal scrolling works
4. Verify no performance issues

**Expected Result:**
- Long lines handled gracefully
- Horizontal scrolling available
- No performance degradation
- No line truncation

**Pass/Fail:** [ ]

---

### 4.6 Nested Markdown Structures

**Objective:** Test blocks within lists, blockquotes, etc.

**Steps:**
1. Create code block inside ordered list
2. Create code block inside unordered list
3. Create code block inside blockquote
4. Create nested lists with code blocks
5. Open preview and verify all render correctly

**Expected Result:**
- All nested blocks highlight correctly
- Markdown structure preserved
- No layout issues
- Copy button accessible

**Pass/Fail:** [ ]

---

## Section 5: Cross-Platform Verification

### 5.1 Windows Testing

**Objective:** Verify functionality on Windows.

**Platform:** Windows 10/11

**Steps:**
1. Run all tests from Sections 1-4
2. Note any Windows-specific issues
3. Test keyboard shortcuts (Ctrl+...)
4. Test with Windows-specific themes

**Expected Result:**
- All features work on Windows
- No platform-specific bugs
- Keyboard shortcuts work correctly

**Pass/Fail:** [ ]

---

### 5.2 macOS Testing

**Objective:** Verify functionality on macOS.

**Platform:** macOS 11+ (Big Sur or later)

**Steps:**
1. Run all tests from Sections 1-4
2. Note any macOS-specific issues
3. Test keyboard shortcuts (Cmd+...)
4. Test with macOS-specific themes

**Expected Result:**
- All features work on macOS
- No platform-specific bugs
- Keyboard shortcuts work correctly

**Pass/Fail:** [ ]

---

### 5.3 Linux Testing

**Objective:** Verify functionality on Linux.

**Platform:** Ubuntu 20.04+ or similar

**Steps:**
1. Run all tests from Sections 1-4
2. Note any Linux-specific issues
3. Test with various Linux themes
4. Verify clipboard functionality

**Expected Result:**
- All features work on Linux
- No platform-specific bugs
- Clipboard integration works

**Pass/Fail:** [ ]

---

## Section 6: Regression Testing

### 6.1 Previous Issue Verification

**Objective:** Verify previously fixed issues remain fixed.

**Steps:**
1. Review DEBUG_SUMMARY.md for past issues
2. Test each previously problematic scenario
3. Verify fixes are still working

**Expected Result:**
- All previous issues remain fixed
- No regressions introduced

**Pass/Fail:** [ ]

---

## Test Summary

**Date:** _____________

**Tester:** _____________

**VS Code Version:** _____________

**Extension Version:** _____________

**Operating System:** _____________

### Results Summary

- **Total Tests:** 26
- **Passed:** _____
- **Failed:** _____
- **Skipped:** _____

### Critical Issues Found

1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Minor Issues Found

1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Recommendations

_______________________________________________________
_______________________________________________________
_______________________________________________________

### Sign-off

**Tester Signature:** _____________________ **Date:** _______

**Reviewer Signature:** ___________________ **Date:** _______

---

## Notes

- Run these tests after any significant code changes
- Update this document as new features are added
- Report any issues not covered by these procedures
- Consider automating tests where possible
