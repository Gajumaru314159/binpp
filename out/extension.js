"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
function activate(context) {
    console.log('Congratulations, your extension "helloworld-sample" is now active!');
    const disposable = vscode.commands.registerCommand('binpp.open', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found.');
            return;
        }
        const document = editor.document;
        const path = require('path');
        const fileName = path.basename(document.fileName);
        const panel = vscode.window.createWebviewPanel('hexView', `Preview ${fileName}`, vscode.ViewColumn.One, { enableScripts: true });
        // バイナリデータを16進数とASCIIに変換する関数
        function toHexAsciiView(text, bytesPerLine) {
            const bytes = Buffer.from(text, 'utf8');
            const addressLines = [];
            const hexLines = [];
            const asciiLines = [];
            for (let i = 0; i < bytes.length; i += bytesPerLine) {
                const slice = bytes.slice(i, i + bytesPerLine);
                const address = i.toString(16).padStart(8, '0');
                const hexBytes = Array.from(slice).map(b => b.toString(16).padStart(2, '0')).join(' ');
                const ascii = Array.from(slice).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
                addressLines.push(`<tr><td>${address}</td></tr>`);
                hexLines.push(`<tr><td>${hexBytes.padEnd(bytesPerLine * 3 - 1, ' ')}</td></tr>`);
                asciiLines.push(`<tr><td>${ascii}</td></tr>`);
            }
            return { address: addressLines.join('\n'), hex: hexLines.join('\n'), ascii: asciiLines.join('\n') };
        }
        const initialBytesPerLine = 16;
        let currentBytesPerLine = initialBytesPerLine;
        function renderView(bytesPerLine) {
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
    context.subscriptions.push(disposable);
}
//# sourceMappingURL=extension.js.map