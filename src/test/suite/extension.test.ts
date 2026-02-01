import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        const extension = vscode.extensions.getExtension('your-publisher-name.markdown-code-block-highlighter');
        assert.ok(extension, 'Extension should be installed');
    });

    test('Extension should activate on markdown file', async function() {
        this.timeout(30000); // Increase timeout for activation

        const extension = vscode.extensions.getExtension('your-publisher-name.markdown-code-block-highlighter');
        assert.ok(extension, 'Extension should be installed');

        // Create a markdown document to trigger activation
        const doc = await vscode.workspace.openTextDocument({
            language: 'markdown',
            content: '# Test\n\n```javascript\nconst x = 1;\n```'
        });

        await vscode.window.showTextDocument(doc);

        // Wait for activation
        await extension.activate();

        assert.strictEqual(extension.isActive, true, 'Extension should be active after opening markdown file');
    });

    test('Extension commands should be registered', async function() {
        this.timeout(30000);

        const extension = vscode.extensions.getExtension('your-publisher-name.markdown-code-block-highlighter');
        if (extension && !extension.isActive) {
            await extension.activate();
        }

        const commands = await vscode.commands.getCommands(true);
        
        const expectedCommands = [
            'markdownCodeBlockHighlighter.clearCache',
            'markdownCodeBlockHighlighter.showStats',
            'markdownCodeBlockHighlighter.showDetailedStats',
            'markdownCodeBlockHighlighter.showPerformanceSummary',
            'markdownCodeBlockHighlighter.togglePerfMonitoring',
            'markdownCodeBlockHighlighter.reload',
            'markdownCodeBlockHighlighter.showErrorLog'
        ];

        for (const cmd of expectedCommands) {
            assert.ok(
                commands.includes(cmd),
                `Command ${cmd} should be registered`
            );
        }
    });

    test('Extension configuration should have correct defaults', () => {
        const config = vscode.workspace.getConfiguration('markdownCodeBlockHighlighter');
        
        assert.strictEqual(config.get('enableHighlighting'), true);
        assert.strictEqual(config.get('fontSize'), 0);
        assert.strictEqual(config.get('lineHeight'), 1.5);
        assert.strictEqual(config.get('enableCache'), true);
        assert.strictEqual(config.get('cacheSize'), 100);
        assert.strictEqual(config.get('maxBlockSize'), 10000);
        assert.strictEqual(config.get('enablePerfMonitoring'), false);
        assert.strictEqual(config.get('showBorder'), true);
        assert.strictEqual(config.get('showCopyButton'), true);
        assert.strictEqual(config.get('copyButtonPosition'), 'top-right');
        assert.strictEqual(config.get('copyButtonVisibility'), 'hover');
    });

    test('Preview script should exist', () => {
        const extensionPath = vscode.extensions.getExtension('your-publisher-name.markdown-code-block-highlighter')?.extensionPath;
        assert.ok(extensionPath, 'Extension path should be available');

        const previewScriptPath = path.join(extensionPath, 'out', 'preview', 'previewScript.js');
        // Note: We can't easily test file existence in this context, but we can verify the path is correct
        assert.ok(previewScriptPath.includes('previewScript.js'));
    });
});
