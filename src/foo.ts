import vscode from "vscode";
import os from "os";
// @ts-ignore
import foo from "shadow-cljs/calva.foo";

export function hello() {
  return "Hello from TypeScript";
}

export function platform() {
  return os.platform();
}

export function cljsLibTestFunction() {
  return foo.test_function();
}

export function showMessage(message: string) {
  void vscode.window.showInformationMessage(message);
}

//.. some comment
