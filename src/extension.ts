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
        let initialFormat: string | undefined;
        const ext = path.extname(fileName).replace('.', '');
        if (ext) {
            const candidate = `${ext}.h`;
            if (formatPaths[candidate]) {
                initialFormat = candidate;
            }
        }
        let currentFormat: FormatDef | undefined;
        let currentArrayLimit = 10000;
        let currentFormatPath: string | undefined;
        let currentLittleEndian = true;

        const panel = vscode.window.createWebviewPanel(
            'hexView',
            `Preview ${fileName}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        let fileBytes = fs.readFileSync(document.uri.fsPath);
        let base64Data = fileBytes.toString('base64');

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
            initialFormat,
            initialEndian: 'LE',
        });

        panel.webview.onDidReceiveMessage(message => {
            if (message.type === 'cursorMove') {
                statusBarItem.text = `Offset: 0x${message.index.toString(16).padStart(8, '0')}`;
            } else if (message.type === 'parse') {
                const selected = message.format as string;
                currentArrayLimit = typeof message.limit === 'number' ? message.limit : currentArrayLimit;
                currentLittleEndian = message.littleEndian !== false;
                if (selected && formatPaths[selected]) {
                    try {
                        currentFormatPath = formatPaths[selected];
                        const content = fs.readFileSync(currentFormatPath, 'utf8');
                        currentFormat = parseFormatFile(content);
                        if (!currentFormat.structs['Root']) {
                            throw new Error('Format file lacks Root struct');
                        }
                        const tree = parseBinary(fileBytes, currentFormat, currentArrayLimit, 'Root', currentLittleEndian);
                        const html = treeToHtml(tree);
                        panel.webview.postMessage({ type: 'treeData', html });
                    } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : String(err);
                        output.appendLine(`[parse] ${msg}`);
                        if (err instanceof Error && err.stack) {
                            output.appendLine(err.stack);
                        }
                        vscode.window.showErrorMessage('Parse failed: ' + msg + '. See "binpp" output for details.');
                        panel.webview.postMessage({ type: 'treeData', html: '' });
                    }
                } else {
                    currentFormatPath = undefined;
                    currentFormat = undefined;
                    panel.webview.postMessage({ type: 'treeData', html: '' });
                }
            } else if (message.type === 'reload') {
                currentLittleEndian = message.littleEndian !== false;
                try {
                    fileBytes = fs.readFileSync(document.uri.fsPath);
                    base64Data = fileBytes.toString('base64');
                    panel.webview.postMessage({ type: 'fileData', base64Data });
                    if (currentFormatPath) {
                        const content = fs.readFileSync(currentFormatPath, 'utf8');
                        currentFormat = parseFormatFile(content);
                        if (!currentFormat.structs['Root']) {
                            throw new Error('Format file lacks Root struct');
                        }
                        const tree = parseBinary(fileBytes, currentFormat, currentArrayLimit, 'Root', currentLittleEndian);
                        const html = treeToHtml(tree);
                        panel.webview.postMessage({ type: 'treeData', html });
                    } else {
                        panel.webview.postMessage({ type: 'treeData', html: '' });
                    }
                } catch (err: any) {
                    const msg = err?.message || String(err);
                    output.appendLine(`[reload] ${msg}`);
                    if (err?.stack) {
                        output.appendLine(err.stack);
                    }
                    vscode.window.showErrorMessage('Reload failed: ' + msg + '. See "binpp" output for details.');
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
