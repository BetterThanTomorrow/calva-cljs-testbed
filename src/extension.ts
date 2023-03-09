import * as vscode from "vscode";
import * as os from "os";
import * as foo from "shadow-cljs/calva.foo";
import * as bar from "shadow-cljs/calva.bar";

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
        vscode.window.showInformationMessage(foo.test_function());
        vscode.window.showInformationMessage(bar.some_var);
      }
    )
  );
  // context.subscriptions.push(
  //   vscode.commands.registerCommand(
  //     "calvacljstestbed.callCljsExtensionFunction",
  //     () => {
  //       vscode.window.showInformationMessage(cljsExtension.testFunction());
  //     }
  //   )
  // );
  console.log("Calva CLJS Testbed activated");
}

export function deactivate(): void {
  console.log("Calva CLJS Testbed deactivated");
}
