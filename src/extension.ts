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

<<<<<<< HEAD
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.text = 'Offset: 0x00000000';
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);
=======
		// バイナリデータを16進数とASCIIに変換する関数
		function toHexAsciiView(text: string, bytesPerLine: number): {address: string, hex: string, ascii: string} {
			const bytes = Buffer.from(text, 'utf8');
			const addressLines: string[] = [];
			const hexLines: string[] = [];
			const asciiLines: string[] = [];
			for (let i = 0; i < bytes.length; i += bytesPerLine) {
				const slice = bytes.slice(i, i + bytesPerLine);
				const address = i.toString(16).padStart(8, '0');
				const hexBytes = Array.from(slice).map(b => b.toString(16).padStart(2, '0')).join(' ');
				const ascii = Array.from(slice).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
				addressLines.push(`<tr><td>${address}</td></tr>`);
				hexLines.push(`<tr><td>${hexBytes.padEnd(bytesPerLine * 3 - 1, ' ')}</td></tr>`);
				asciiLines.push(`<tr><td>${ascii}</td></tr>`);
			}
			return {address: addressLines.join('\n'), hex: hexLines.join('\n'), ascii: asciiLines.join('\n')};
		}
>>>>>>> parent of d37e32c... Merge pull request #19 from Gajumaru314159/codex/treeviewの4列目にアドレス表示

        panel.webview.html = getHexViewHtml(panel.webview, context.extensionUri, {
            base64Data,
            formatOptions: formatOptionsHtml,
            initialBytesPerLine: 16,
            initialOffset: 0,
            initialArrayLimit: currentArrayLimit,
            initialFormat,
            initialEndian: 'LE',
        });

<<<<<<< HEAD
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
=======
		function renderView(bytesPerLine: number) {
			const hexAscii = toHexAsciiView(document.getText(), bytesPerLine);
			return `
			<table class="address">
				${hexAscii.address}
			</table>
			<table class="hex">
				${hexAscii.hex}
			</table>
			<table class="ascii">
				${hexAscii.ascii}
			</table>
			`;
		}

		const hexViewHtml = `
			<html>
			<head>

				<style>
					body { font-family: monospace; display: flex; flex-direction: column; }
					.toolbar { margin-bottom: 10px; }
					table { border-collapse: collapse; margin-right: 10px; }
					td { padding: 0 5px; vertical-align: top; }
					.address td { color: gray; user-select: text; }
					.hex td { letter-spacing: 0.1em; user-select: text; }
					.ascii td { padding-left: 10px; user-select: text; }
					.view-container { display: flex; }
				</style>
			</head>
			<body>
				<div class="toolbar">
					<label for="bytesPerLine">Bytes per line: </label>
					<select id="bytesPerLine">
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="4">4</option>
						<option value="8">8</option>
						<option value="16" selected>16</option>
						<option value="32">32</option>
						<option value="64">64</option>
						<option value="128">128</option>
					</select>
				</div>
				<div class="view-container" id="viewContainer">
					${renderView(initialBytesPerLine)}
				</div>
				<script>
					const vscode = acquireVsCodeApi();
					const select = document.getElementById('bytesPerLine');
					const viewContainer = document.getElementById('viewContainer');
					select.addEventListener('change', () => {
						const val = parseInt(select.value, 10);
						viewContainer.innerHTML = renderView(val)};
					});
				</script>
			</body>
			</html>
		`;

		panel.webview.html = hexViewHtml;
	});
>>>>>>> parent of d37e32c... Merge pull request #19 from Gajumaru314159/codex/treeviewの4列目にアドレス表示

    context.subscriptions.push(disposable);
    context.subscriptions.push(output);
}
