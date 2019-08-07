// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function getWebViewContent(context, templatePath) {
	const resourcePath = path.join(context.extensionPath, templatePath);
	const dirPath = path.dirname(resourcePath);
	let html = fs.readFileSync(resourcePath, 'utf-8');
	// vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
	html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src="|<embed.+?src=")(.+?)"/g, (m, $1, $2) => {
		return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
	});
	return html;
}

function getExtensionFileVscodeResource(context, relativePath) {
	const diskPath = vscode.Uri.file(path.join(context.extensionPath, relativePath));
	return diskPath.with({ scheme: 'vscode-resource' }).toString();
}
function List(context, panel){
	let p = path.join(context.extensionPath, './book');
	fs.readdir(p, (err, data) => {
		if(err){
			throw Error(err);
		}
		panel.webview.postMessage({list: JSON.stringify(data)});
	})
}
function bookWord(context, book, panel) {
	book = './book/' + book;
	let p = path.join(context.extensionPath, book);
	fs.readFile(p, (err, data) => {
		if(err){
			console.log('err', err);
		}else{
			let str = data.toString();
			let chapter = /第.{0,15}章.{0,}(\r\n){0,}/g;
			let n = [];
			let titles = str.match(chapter);
			let arr = str.split(chapter);
			arr.forEach(c => {
				if(c.length > 1000){
					n.push(c);
				}
			});
			titles = titles.filter(t => {
				let S = t.replace(/\s/g, '');
				S = S.replace(/(\r\n)+|↵+/g, '');
				return S.length < 20;
			});
			titles = [...new Set(titles)];
			bookChapter(titles, n, panel);
		}
	})
}
function bookChapter(chanterName, texts, panel){
	panel.webview.postMessage({chapter: JSON.stringify(chanterName)});
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "background" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.hello', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('This Is A Message Hello World!这是第一个组件!');
		const panel = vscode.window.createWebviewPanel(
			'testWebview', // viewType
			"这是一个有趣的~~~~", // 视图标题
			vscode.ViewColumn.One, // 显示在编辑器的哪个部位
			{
				enableScripts: true, // 启用JS，默认禁用
				retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
			}
		);
		let html = getWebViewContent(context, './index.html');
		panel.webview.html = html;
		// panel.webview.postMessage({text: '这是一条消息'});
		panel.webview.onDidReceiveMessage(message => {
			let name = message.name;
			bookWord(context, name, panel);
		}, undefined, context.subscriptions);
		List(context, panel);
	});

	context.subscriptions.push(disposable);

	// let h = vscode.commands.registerCommand('extension.demo.openWebView', function (uri){
	// 	// 创建webview
	// 	const panel = vscode.window.createWebviewPanel(
	// 		'testWebview', // viewType
	// 		"WebView演示", // 视图标题
	// 		vscode.ViewColumn.One, // 显示在编辑器的哪个部位
	// 		{
	// 			enableScripts: true, // 启用JS，默认禁用
	// 			retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
	// 		}
	// 	);
	// 	panel.webview.html = `<html><body>你好，我是Webview</body></html>`;
	// });
	// context.subscriptions.push(h);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
