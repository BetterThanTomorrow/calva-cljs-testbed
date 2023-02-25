import * as vscode from "vscode";
import * as os from "os";
import * as cljsLib from "../out/cljs-lib/cljs-lib.js";

export function hello() {
  return "hello";
}

export function platform() {
  return os.platform();
}

export function cljsLibTestFunction() {
  return cljsLib.testFunction("World");
}

export function showMessage(message: string) {
  void vscode.window.showInformationMessage(message);
}

function sayHello() {
  vscode.window.showInformationMessage("Hello World!");
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("calvacljstestbed.helloWorld", sayHello)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "calvacljstestbed.callCljsLibFunction",
      () => {
        cljsLib.testFunction();
      }
    )
  );
  console.log("Calva CLJS Testbed activated");
}

export function deactivate(): void {
  console.log("Calva CLJS Testbed deactivated");
}
