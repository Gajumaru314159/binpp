import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseFormatFile, parseBinary, treeToHtml, FormatDef } from './parser';
import { loadFormatOptions } from './config';
import { getHexViewHtml } from './webview/html';

export function activate(context: vscode.ExtensionContext): void {
    const output = vscode.window.createOutputChannel('binpp');
    output.appendLine('binpp extension activated');

    const disposable = vscode.commands.registerCommand('binpp.open', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found.');
            return;
        }
        const document = editor.document;
        const fileName = path.basename(document.fileName);

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const { html: formatOptionsHtml, paths: formatPaths } = loadFormatOptions(workspaceFolder, output);
        let currentFormat: FormatDef | undefined;
        let currentArrayLimit = 10000;

        const panel = vscode.window.createWebviewPanel(
            'hexView',
            `Preview ${fileName}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const fileBytes = fs.readFileSync(document.uri.fsPath);
        const base64Data = fileBytes.toString('base64');

        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.text = 'Offset: 0x00000000';
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);

        panel.webview.html = getHexViewHtml(panel.webview, context.extensionUri, {
            base64Data,
            formatOptions: formatOptionsHtml,
            initialBytesPerLine: 16,
            initialOffset: 0,
            initialArrayLimit: currentArrayLimit,
        });

        panel.webview.onDidReceiveMessage(message => {
            if (message.type === 'cursorMove') {
                statusBarItem.text = `Offset: 0x${message.index.toString(16).padStart(8, '0')}`;
            } else if (message.type === 'parse') {
                const selected = message.format as string;
                currentArrayLimit = typeof message.limit === 'number' ? message.limit : currentArrayLimit;
                if (selected && formatPaths[selected]) {
                    try {
                        const content = fs.readFileSync(formatPaths[selected], 'utf8');
                        currentFormat = parseFormatFile(content);
                        if (!currentFormat.structs['Root']) {
                            throw new Error('Format file lacks Root struct');
                        }
                        const tree = parseBinary(fileBytes, currentFormat, currentArrayLimit);
                        const html = treeToHtml(tree);
                        panel.webview.postMessage({ type: 'treeData', html });
                    } catch (err: any) {
                        const msg = err?.message || String(err);
                        output.appendLine(`[parse] ${msg}`);
                        if (err?.stack) {
                            output.appendLine(err.stack);
                        }
                        vscode.window.showErrorMessage('Parse failed: ' + msg + '. See "binpp" output for details.');
                        panel.webview.postMessage({ type: 'treeData', html: '' });
                    }
                } else {
                    panel.webview.postMessage({ type: 'treeData', html: '' });
                }
            }
        });

        panel.onDidDispose(() => {
            statusBarItem.hide();
        });
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(output);
}
