"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
function activate(context) {
    console.log('Congratulations, your extension "helloworld-sample" is now active!');
    const disposable = vscode.commands.registerCommand('binpp.open', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found.');
            return;
        }
        const document = editor.document;
        const fileName = path.basename(document.fileName);
        const panel = vscode.window.createWebviewPanel('hexView', `Preview ${fileName}`, vscode.ViewColumn.One, { enableScripts: true });
        const initialBytesPerLine = 16;
        const initialOffset = 0;
        const fileBytes = fs.readFileSync(document.uri.fsPath);
        const base64Data = fileBytes.toString('base64');
        const hexViewHtml = `
			<html>
			<head>

				<style>
					body { font-family: monospace; display: flex; flex-direction: column; }
                                        .toolbar {
                                                margin-bottom: 10px;
                                                position: sticky;
                                                top: 0;
                                                background-color: white;
                                                z-index: 1;
                                        }
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
                                        <label for="offset">Offset: </label>
                                        <input id="offset" type="number" value="0" style="width:100px;" />
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
                                <div class="view-container" id="viewContainer"></div>
                                <script>
                                        const vscode = acquireVsCodeApi();
                                        const rawData = '${base64Data}';
                                        const bytes = Uint8Array.from(atob(rawData), c => c.charCodeAt(0));
                                        const select = document.getElementById('bytesPerLine');
                                        const offsetInput = document.getElementById('offset');
                                        const viewContainer = document.getElementById('viewContainer');

                                        function renderView(bytesPerLine, offset) {
                                                const slice = bytes.slice(offset);
                                                let addr = '';
                                                let hex = '';
                                                let ascii = '';
                                                for (let i = 0; i < slice.length; i += bytesPerLine) {
                                                        const row = slice.slice(i, i + bytesPerLine);
                                                        const address = i.toString(16).padStart(8, '0');
                                                        const hexBytes = Array.from(row).map(b => b.toString(16).padStart(2, '0')).join(' ');
                                                        const asciiStr = Array.from(row).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
                                                        addr += '<tr><td>' + address + '</td></tr>';
                                                        hex += '<tr><td>' + hexBytes.padEnd(bytesPerLine * 3 - 1, ' ') + '</td></tr>';
                                                        ascii += '<tr><td>' + asciiStr + '</td></tr>';
                                                }
                                                return '<table class="address">' + addr + '</table>' +
                                                       '<table class="hex">' + hex + '</table>' +
                                                       '<table class="ascii">' + ascii + '</table>';
                                        }

                                        let currentBytesPerLine = ${initialBytesPerLine};
                                        let currentOffset = ${initialOffset};

                                        function updateView() {
                                                currentBytesPerLine = parseInt(select.value, 10);
                                                currentOffset = parseInt(offsetInput.value, 10) || 0;
                                                console.log('updateView', currentBytesPerLine, currentOffset);
                                                viewContainer.innerHTML = renderView(currentBytesPerLine, currentOffset);
                                        }

                                        select.addEventListener('change', updateView);
                                        offsetInput.addEventListener('change', updateView);
                                        updateView();
                                </script>
			</body>
			</html>
		`;
        panel.webview.html = hexViewHtml;
    });
    context.subscriptions.push(disposable);
}
//# sourceMappingURL=extension.js.map