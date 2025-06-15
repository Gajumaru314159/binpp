"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
function activate(context) {
    console.log('Congratulations, your extension "helloworld-sample" is now active!');
    const disposable = vscode.commands.registerCommand('binpp.open', () => {
        vscode.window.showInformationMessage('Hello binpp!');
    });
    context.subscriptions.push(disposable);
}
//# sourceMappingURL=extension.js.map