import * as vscode from "vscode";
import * as os from "os";
import * as cljsLib from "../out/cljs-lib/cljs-lib.js";

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
        cljsLib._.calva.foo.testFunction();
      }
    )
  );
  console.log("Calva CLJS Testbed activated");
}

export function deactivate(): void {
  console.log("Calva CLJS Testbed deactivated");
}
