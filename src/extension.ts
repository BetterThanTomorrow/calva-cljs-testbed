import * as vscode from "vscode";
import * as os from "os";
import * as cljsLib from "../cljs-lib/cljs-lib.js";
import * as cljsExtension from "../cljs-lib/extension";

export function hello() {
  return "hello";
}

export function platform() {
  return os.platform();
}

export function showMessage(message: string) {
  void vscode.window.showInformationMessage(message);
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("calvacljstestbed.helloWorld", () => {
      vscode.window.showInformationMessage("Hello World");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "calvacljstestbed.callCljsLibFunction",
      () => {
        vscode.window.showInformationMessage(cljsLib.someVar);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "calvacljstestbed.callCljsExtensionFunction",
      () => {
        vscode.window.showInformationMessage(cljsExtension.testFunction());
      }
    )
  );
  console.log("Calva CLJS Testbed activated");
}

export function deactivate(): void {
  console.log("Calva CLJS Testbed deactivated");
}
