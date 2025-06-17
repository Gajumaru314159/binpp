import * as vscode from 'vscode';

export interface WebviewOptions {
    base64Data: string;
    formatOptions: string;
    initialBytesPerLine: number;
    initialOffset: number;
    initialArrayLimit: number;
    initialFormat?: string;
    initialEndian: 'LE' | 'BE';
}

export function getHexViewHtml(webview: vscode.Webview, extensionUri: vscode.Uri, opts: WebviewOptions): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'script.js'));
    return `
<html>
<head>
    <meta name="color-scheme" content="light dark" />
    <style>
        html, body {
            height: 100%;
        }
        body {
            font-family: monospace;
            display: flex;
            flex-direction: column;
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            overflow: hidden;
        }
        .toolbar {
            margin-bottom: 10px;
            position: sticky;
            top: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 4px;
            z-index: 1;
        }
        input, select {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border);
            padding: 2px 8px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        table { border-collapse: collapse; margin-right: 10px; }
        td { padding: 0 5px; vertical-align: top; }
        .address td { color: gray; user-select: text; }
        .hex td { letter-spacing: 0.1em; user-select: text; }
        .ascii td { padding-left: 10px; user-select: text; }
        .byte { outline: none; min-width: 20px; text-align: center; }
        .byte.highlight {
            background-color: var(--vscode-editor-selectionBackground, rgba(100,100,255,0.4));
        }
        .view-container {
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;
            height: 100%;
            overflow: hidden;
        }
        #hexContainer, #treeContainer {
            overflow: auto;
        }
        #hexContainer {
            display: flex;
        }
        #treeContainer { display: none; }
        #divider {
            height: 4px;
            background: var(--vscode-editorGroup-border, gray);
            cursor: row-resize;
            display: none;
        }
        .tree-table { border-collapse: collapse; width: 100%; }
        .tree-table td, .tree-table th { border: none; padding: 2px 4px; }
        .tree-table tbody tr:nth-child(odd) {
            background-color: var(--vscode-sideBar-background, var(--vscode-editor-background));
        }
        .tree-table tbody tr:nth-child(even) {
            background-color: var(--vscode-editor-background);
        }
        .tree-table .name { white-space: pre; }
        .tree-table .toggle { cursor: pointer; display: inline-block; width: 1em; }
        .tree-table tr.hidden { display: none; }
    </style>
</head>
<body data-base64="${opts.base64Data}" data-bytes-per-line="${opts.initialBytesPerLine}" data-offset="${opts.initialOffset}" data-array-limit="${opts.initialArrayLimit}">
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
    <label for="formatSelect">Format: </label>
    <select id="formatSelect" data-initial-format="${opts.initialFormat ?? ''}">
        ${opts.formatOptions}
    </select>
    <label for="endian">Endian: </label>
    <select id="endian" data-initial-endian="${opts.initialEndian}">
        <option value="LE"${opts.initialEndian === 'LE' ? ' selected' : ''}>Little Endian</option>
        <option value="BE"${opts.initialEndian === 'BE' ? ' selected' : ''}>Big Endian</option>
    </select>
    <label for="arrayLimit">Array limit: </label>
    <input id="arrayLimit" type="number" value="${opts.initialArrayLimit}" style="width:80px;" />
    <button id="reload">Reload</button>
</div>
<div class="view-container" id="viewContainer">
    <div id="hexContainer"></div>
    <div id="divider"></div>
    <div id="treeContainer"></div>
</div>
<script src="${scriptUri}"></script>
</body>
</html>`;
}
