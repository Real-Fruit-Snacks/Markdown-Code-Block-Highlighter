# Diagnostic Findings - VS Code Markdown Preview Extension

## Date: 2026-02-01

## Root Cause Identified

### Problem
The extension has **NO VISIBLE SYNTAX HIGHLIGHTING** in the Markdown preview, even though all services are implemented.

### Root Cause Analysis

**CRITICAL ARCHITECTURAL FLAW**: The extension assumes bidirectional communication between the preview script (webview) and the extension host, but **this communication channel does not exist**.

#### Why Communication Fails:

1. **Preview Script Context**
   - The `previewScript.ts` is loaded via `markdown.previewScripts` contribution point
   - It runs inside the Markdown preview **webview** context
   - The webview is owned by VS Code's built-in `markdown-language-features` extension

2. **Message Flow Breakdown**
   - Preview script calls `vscode.postMessage(message)` to send tokenization requests
   - These messages are sent to the **webview panel's message handler**
   - The webview panel is owned by the `markdown-language-features` extension, NOT our extension
   - **Our extension has NO access to register handlers for webviews it doesn't own**
   - Therefore, messages from the preview script **NEVER reach our extension host**

3. **Return Path Also Broken**
   - `PreviewEnhancer.sendMessageToPreview()` tries to use `markdown.api.render` command
   - This command doesn't exist in the standard Markdown API
   - Even if it did, there's no standard way to inject messages into already-rendered previews
   - **There is NO way to send messages back from extension host to the preview webview**

#### Evidence:

```typescript
// previewScript.ts - sends messages that never arrive
vscode.postMessage({
    type: 'tokenize',
    id: blockId,
    code: code,
    language: language
});  // ❌ These messages go nowhere our extension can receive

// previewEnhancer.ts - tries to send responses that never arrive
await vscode.commands.executeCommand(
    'markdown.api.render',  // ❌ This command doesn't exist
    JSON.stringify(message)
);
```

### Impact

- Extension activates successfully ✅
- Services initialize correctly ✅
- Preview script loads and runs ✅
- Code blocks are found ✅
- **BUT**: No communication occurs between preview and extension host ❌
- **RESULT**: No tokenization happens, no highlighting applied ❌

## Solution

### Option 1: Self-Contained Preview Script (RECOMMENDED)

Make the preview script completely standalone:

1. **Theme Detection**: Read theme colors from CSS variables in the webview DOM
2. **Tokenization**: Perform pattern-based tokenization directly in JavaScript
3. **Highlighting**: Apply syntax highlighting without extension host communication

**Pros:**
- Works within VS Code's architecture constraints
- No communication needed
- Simpler, more reliable
- Lower latency

**Cons:**
- Cannot use VS Code's semantic tokens API
- Limited to pattern-based tokenization
- Cannot leverage extension host services

### Option 2: Custom Webview Panel (Alternative)

Create our own webview panel instead of using markdown.previewScripts:

1. Register a command to open custom Markdown preview
2. Create our own webview panel
3. Render Markdown ourselves
4. Have full control over message passing

**Pros:**
- Full bidirectional communication
- Can use all extension host services
- More powerful features possible

**Cons:**
- Users must use custom preview instead of built-in one
- More complex implementation
- Duplicate effort (re-implementing Markdown rendering)
- Poor user experience

### Option 3: Markdown-It Plugin (Advanced)

Use VS Code's Markdown extension API to register a markdown-it plugin:

**Pros:**
- Integrates with built-in preview
- Processes Markdown during rendering

**Cons:**
- Still no access to theme colors
- Runs in extension host, not webview
- Cannot style based on live theme changes

## Recommended Implementation: Option 1

Transform the preview script to be self-contained with these components:

### 1. Theme Detection
```javascript
function detectThemeFromDOM() {
    const bodyStyles = getComputedStyle(document.body);
    return {
        background: bodyStyles.getPropertyValue('--vscode-editor-background'),
        foreground: bodyStyles.getPropertyValue('--vscode-editor-foreground'),
        // Map all needed CSS variables to theme colors
    };
}
```

### 2. Pattern-Based Tokenization
Use the existing `createMinimalHighlighting` logic directly in the preview script.

### 3. Direct Application
Apply highlighting immediately without waiting for messages that never arrive.

## Files Requiring Changes

1. **`src/preview/previewScript.ts`**
   - Remove `vscode.postMessage()` calls
   - Remove message listener for responses
   - Add theme detection from CSS variables
   - Add inline tokenization logic
   - Apply highlighting synchronously

2. **`src/previewEnhancer.ts`** (Optional)
   - Can keep for future use or remove
   - Currently serves no purpose in the architecture

3. **`package.json`**
   - Contribution point is correct
   - No changes needed

## Testing Plan

After implementing Option 1:

1. Compile the extension
2. Open Extension Development Host
3. Open a Markdown file with code blocks
4. Check browser console for diagnostic logs
5. Inspect DOM to verify:
   - `<span>` elements with inline styles exist
   - Colors are distinct from default
6. Change VS Code theme
7. Verify highlighting updates to match new theme

## Conclusion

The extension was built with a fundamentally incorrect assumption about VS Code's architecture. The markdown.previewScripts contribution point does NOT provide bidirectional communication with the extension host. The only viable solution is to make the preview script self-contained.
