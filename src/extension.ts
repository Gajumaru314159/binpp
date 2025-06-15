import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "helloworld-sample" is now active!');

	const disposable = vscode.commands.registerCommand('binpp.open', () => {
		vscode.window.showInformationMessage('Hello binpp!');
	});

	context.subscriptions.push(disposable);
}
