import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "helloworld-sample" is now active!');

	const disposable = vscode.commands.registerCommand('binpp.open', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor found.');
			return;
		}
		const document = editor.document;

               const fileName = path.basename(document.fileName);
		const panel = vscode.window.createWebviewPanel(
			'hexView',
			`Preview ${fileName}`,
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);


		// バイナリデータを16進数とASCIIに変換する関数
               function toHexAsciiView(text: string, bytesPerLine: number, offset: number): {address: string, hex: string, ascii: string} {
                       const bytes = Buffer.from(text, 'utf8').slice(offset);
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

               const initialBytesPerLine = 16;
               const initialOffset = 0;

                function renderView(bytesPerLine: number, offset: number) {
                        const hexAscii = toHexAsciiView(document.getText(), bytesPerLine, offset);
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
                                <div class="view-container" id="viewContainer">
                                        ${renderView(initialBytesPerLine, initialOffset)}
                                </div>
                                <script>
                                        const vscode = acquireVsCodeApi();
                                        const select = document.getElementById('bytesPerLine');
                                        const offsetInput = document.getElementById('offset');
                                        const viewContainer = document.getElementById('viewContainer');
                                        let currentBytesPerLine = ${initialBytesPerLine};
                                        let currentOffset = ${initialOffset};
                                        select.addEventListener('change', () => {
                                                const val = parseInt(select.value, 10);
                                                currentBytesPerLine = val;
                                                viewContainer.innerHTML = renderView(currentBytesPerLine, currentOffset);
                                        });
                                        offsetInput.addEventListener('change', () => {
                                                const val = parseInt(offsetInput.value, 10) || 0;
                                                currentOffset = val;
                                                viewContainer.innerHTML = renderView(currentBytesPerLine, currentOffset);
                                        });
                                </script>
			</body>
			</html>
		`;

		panel.webview.html = hexViewHtml;
	});

	context.subscriptions.push(disposable);
}
