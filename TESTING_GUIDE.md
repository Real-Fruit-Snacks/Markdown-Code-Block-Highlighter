# Testing Guide - Fixed VS Code Markdown Preview Extension

## What Was Fixed

The extension had a **critical architectural flaw**: it assumed bidirectional communication between the preview webview and extension host, but this communication channel doesn't exist in VS Code's `markdown.previewScripts` architecture.

**Solution**: Made the preview script completely self-contained. It now:
- Detects theme colors directly from CSS variables in the webview
- Performs pattern-based tokenization in JavaScript
- Applies syntax highlighting without needing extension host communication

## Testing Steps

### 1. Open Extension Development Host

1. Open VS Code in this project directory
2. Press `F5` or run "Debug: Start Debugging"
3. A new VS Code window will open (Extension Development Host)

### 2. Create or Open a Test Markdown File

Create a new file `test.md` with code blocks:

````markdown
# Test Markdown File

## JavaScript Example

```javascript
function greet(name) {
    const message = `Hello, ${name}!`;
    return message;
}

// Test the function
const result = greet("World");
console.log(result);
```

## Python Example

```python
def calculate(x, y):
    # Calculate sum
    result = x + y
    return result

# Test
value = calculate(10, 20)
print(f"Result: {value}")
```

## TypeScript Example

```typescript
interface User {
    name: string;
    age: number;
}

function createUser(name: string, age: number): User {
    return { name, age };
}

const user = createUser("Alice", 30);
console.log(user);
```
````

### 3. Open Markdown Preview

1. With `test.md` open, press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac)
2. Or click the preview icon in the top-right corner
3. Or open Command Palette (`Ctrl+Shift+P`) and run "Markdown: Open Preview to the Side"

### 4. Check Console Logs

1. In the **Markdown Preview pane**, right-click and select "Inspect Element" or press `F12`
2. Go to the **Console** tab
3. You should see:
   ```
   === MCBH: Preview script loaded ===
   MCBH: Running in: vscode-webview://...
   MCBH: Script loaded, readyState = ...
   MCBH: Initializing preview script...
   MCBH: Detected theme: dark (or light)
   MCBH: Found X code blocks
   MCBH: Processing block block-... (javascript, X chars)
   MCBH: Successfully highlighted block block-...
   MCBH: Initialization complete
   ```

### 5. Verify Visual Highlighting

In the Markdown preview, code blocks should now have:

#### Visual Features:
1. **Colored syntax highlighting** - Different colors for:
   - Keywords (blue/cyan): `function`, `const`, `return`, `def`, `if`, etc.
   - Strings (orange/red): `"Hello"`, `'World'`, etc.
   - Comments (green): `// comment`, `# comment`
   - Numbers (light green): `10`, `20`, `3.14`
   - Plain text (default foreground color)

2. **Borders** - Code blocks have a subtle border matching the theme

3. **Copy Button** - Hover over a code block to see a "Copy" button in the top-right

4. **Theme-aware colors** - Colors match your current VS Code theme

### 6. Inspect DOM Structure

With DevTools open in the preview:

1. Click the "Elements" or "Inspector" tab
2. Find a code block (look for `<pre>` elements)
3. Expand the structure

You should see:
```html
<div class="mcbh-code-container">
    <button class="mcbh-copy-button">Copy</button>
    <pre style="background-color: #1e1e1e; color: #d4d4d4;">
        <code data-block-id="block-abc123-..." data-highlighted="true" class="language-javascript">
            <span style="color: #569cd6;">function</span>
            <span> </span>
            <span>greet</span>
            <span>(</span>
            <span>name</span>
            <span>) {</span>
            <span>
</span>
            <span>    </span>
            <span style="color: #569cd6;">const</span>
            <span> message </span>
            <span>=</span>
            <span> </span>
            <span style="color: #ce9178;">`Hello, ${name}!`</span>
            <span>;</span>
            <!-- ... more spans ... -->
        </code>
    </pre>
</div>
```

### 7. Test Copy Button

1. Hover over a code block
2. Click the "Copy" button that appears
3. The button should briefly change to "Copied!"
4. Paste the clipboard content - it should be the raw code without HTML

### 8. Test Theme Changes

1. In the Extension Development Host, change the color theme:
   - Open Command Palette (`Ctrl+Shift+P`)
   - Type "Preferences: Color Theme"
   - Select a different theme (e.g., "Light+ (default light)")
   
2. The code highlighting should automatically update to match the new theme:
   - **Light theme**: Different color scheme (darker colors on white background)
   - **Dark theme**: Original color scheme (lighter colors on dark background)

3. Check console for theme change detection:
   ```
   MCBH: Theme changed: dark -> light
   ```

### 9. Check Extension Output

1. In the Extension Development Host, open "Output" panel (`Ctrl+Shift+U`)
2. Select "Markdown Code Block Highlighter" from the dropdown
3. You should see:
   ```
   === Markdown Code Block Highlighter extension is activating ===
   Extension path: ...
   ...
   === Markdown Code Block Highlighter initialization complete! ===
   Extension is ready to process Markdown previews
   ```

4. You should also see a notification message:
   ```
   MCBH: Extension activated successfully. Open a Markdown file to test.
   ```

## Troubleshooting

### No Highlighting Appears

1. **Check console logs** - Open DevTools in preview, check Console tab
2. **Verify script loaded** - Should see "Preview script loaded" message
3. **Check for errors** - Look for red error messages in console
4. **Verify code blocks found** - Should see "Found X code blocks" message

### Colors Look Wrong

1. **Check detected theme** - Console should show "Detected theme: dark/light"
2. **Verify CSS variables** - In DevTools, check computed styles on `<body>`
3. **Check background luminance** - Should be logged in console

### Copy Button Doesn't Work

1. **Check browser permissions** - Clipboard API may require HTTPS or permissions
2. **Check console** - Look for "Failed to copy code" errors
3. **Try right-click copy** - As fallback, you can still select and copy text

### Extension Not Loading

1. **Check Extension Development Host** - Verify it's running
2. **Check for compilation errors** - Run `npm run compile` in terminal
3. **Check activation events** - Extension should activate when opening Markdown files
4. **Reload window** - Try Developer: Reload Window

## Expected vs Actual Behavior

### Before Fix:
- ❌ No syntax highlighting visible
- ❌ Code blocks look like plain text
- ❌ No difference between extension enabled/disabled
- ❌ Messages never reach extension host

### After Fix:
- ✅ Syntax highlighting clearly visible
- ✅ Keywords, strings, numbers have distinct colors
- ✅ Copy button appears on hover
- ✅ Borders around code blocks
- ✅ Theme-aware colors
- ✅ Everything works without extension host communication

## Performance Notes

The self-contained approach is actually **faster** than the original design because:
- No round-trip communication with extension host
- No async message passing delays
- Direct DOM manipulation
- Tokenization happens immediately when code blocks are found

## Next Steps

If highlighting works correctly:
1. Test with various programming languages
2. Test with very large code blocks
3. Test with multiple themes
4. Test dynamic content (if preview updates)
5. Consider publishing the extension

## Known Limitations

1. **Pattern-based tokenization** - Not as sophisticated as VS Code's semantic tokens
   - Simple keyword matching
   - May miss context-specific highlighting
   - Works well for most common languages

2. **No semantic tokens** - Cannot access VS Code's language services from webview
   - Cannot get function/variable definitions
   - Cannot use theme's semantic token colors

3. **Theme detection** - Based on CSS variable parsing
   - Should work for all standard themes
   - Custom themes with unusual structures may need adjustment

These limitations are inherent to the `markdown.previewScripts` architecture and are acceptable trade-offs for a working solution.
