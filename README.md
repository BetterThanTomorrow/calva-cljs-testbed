# Calva CLJS Testbed <!-- omit in toc -->

- [Where The `main` Branch Leaves Off](#where-the-main-branch-leaves-off)
- [The End Goal](#the-end-goal)
- [Running the Extension](#running-the-extension)
- [`attempt_1` Issues and Solutions](#attempt_1-issues-and-solutions)
  - [Importing Compiled `foo.ts` in the :extension Build CLJS](#importing-compiled-foots-in-the-extension-build-cljs)
  - [Importing the cljs-lib Code in `foo.ts`](#importing-the-cljs-lib-code-in-foots)
- [Using the :npm-module Target for the calva-lib Build](#using-the-npm-module-target-for-the-calva-lib-build)
- [Removing the :js-options From the :extension Build](#removing-the-js-options-from-the-extension-build)
- [Using a Single shadow-cljs Build with :npm-module as the Target](#using-a-single-shadow-cljs-build-with-npm-module-as-the-target)
- [Using a single shadow-cljs build with :node-library as the Target](#using-a-single-shadow-cljs-build-with-node-library-as-the-target)
- [Using two :node-library builds](#using-two-node-library-builds)
- [Back to using a single shadow-cljs build with :npm-module as the target (using advice from Thomas Heller)](#back-to-using-a-single-shadow-cljs-build-with-npm-module-as-the-target-using-advice-from-thomas-heller)
- [Using :esm build target](#using-esm-build-target)
- [Using a single :node-library build with goog imports](#using-a-single-node-library-build-with-goog-imports)
  - [Unit testing problem](#unit-testing-problem)


This repo serves as a testbed for getting Calva into a state in which the extension is built with shadow-cljs, so that hot reloading of the TypeScript works and so that we can start porting the extension to ClojureScript incrementally.

The main branch aligns with the current state of the Calva `dev` branch as of commit `bdfcd416d2494cb165c01c02d45b26b2e64c2ee2`, except for some initial setup which doesn't yet aim to solve issues:

- The `:extension` build was added to shadow-cljs.edn
- `src/foo.ts` was added to serve as our TS layer test file
- `src/calva_cljs/extension.cljs` was added to serve as our extension entry point
- The `main` entry in package.json was changed to `./lib/main.js` so the compiled CLJS is used as the entry point

This branch should be left as-is, and efforts to set up Calva for being built by shadow-cljs should be done in separate branches, which could each represent a different approach.

The readme in each branch that represents an approach should describe issues that arose and how they were resolved so that we can track decisions and assumptions.

## Where The `main` Branch Leaves Off

The extension entrypoint is `src/calva_cljs/extension.cljs`, but doesn't yet try to import and call compiled TypeScript.

## The End Goal

- Run the `Hello World` command, which calls a function in `src/calva_cljs/extension.cljs`, which in turn calls a function in `src/foo.ts`, which in turn calls a function in `src/cljs-lib/src/calva/foo.cljs`.
- Build and run a VSIX and verify that the `Hello World` command, as mentioned above, works.

## Running the Extension

These instructions may change for different methods of building the extension, and the different processes may be mentioned in the respective sections below.

1. Run `npm install`.
2. Run `npm run compile-cljs`. This must be done before running the `watch-ts` script since the TypeScript needs to be able to import the compiled CLJS from `src/cljs-lib/src/calva`.
3. Run `npm run watch-ts`. This must be done before started the shadow-cljs watch process so that the compiled TypeScript files are on the classpath and can be imported by the CLJS code in `src/calva_cljs`.
4. Jack-in and choose shadow-cljs and the `extension` and `calva-lib` builds (or copy the jack-in commmand, run it, and connect to the shadow-cljs repl).
5. Hit `F5` to start the extension in a new VS Code window.
6. Run the "Hello World" command from the command palette if you want to check that the extension is working, and also if you want to connect to the extension build's repl, as this command activates the extension.

## `attempt_1` Issues and Solutions

### Importing Compiled `foo.ts` in the :extension Build CLJS

When requiring `/foo.js` using `["/foo.js" :as foo]` and loading the file in the repl, evaluating `foo` throws an error:
  
```clojure
:repl/exception!
; 
; Execution error (ReferenceError) at (<cljs repl>:1).
; module$foo is not defined
```

If you set `moduleResolution` to `node16` in `tsconfig.json`, then load the `extension.clj` file in the repl and evaluate `foo`, you get:
  
```clojure
#js {:default #js {:hello nil, :platform nil, :showMessage nil}}
```

Trying to evaluate a call to any of those functions from `foo` throws an error, as expected since they're `nil`:

```clojure
:repl/exception!
; 
; Execution error (TypeError) at (<cljs repl>:1).
; module$foo.hello is not a function
```

If we then remove the `moduleResolution` setting and set `module` to `es6`, we get the following error from the TS compiler:

```text
src/test/runTest.ts:3:26 - error TS2792: Cannot find module '@vscode/test-electron'. Did you mean to set the 'moduleResolution' option to 'node', or to add aliases to the 'paths' option?

3 import { runTests } from '@vscode/test-electron';
```

And we also get these errors from the shadow-cljs compiler:

```text
Closure compilation failed with 2 errors
--- foo.js:1
Namespace imports (goog:some.Namespace) cannot use import * as. Did you mean to import vscode from 'goog:shadow.js.shim.module$vscode';?
--- foo.js:2
Namespace imports (goog:some.Namespace) cannot use import * as. Did you mean to import os from 'goog:shadow.js.shim.module$os';?
```

If then set `moduleResolution` to `node16`, TS compilation succeeds, but the shadow-cljs compiler errors above still occur. [This Slack convo about the above error](https://clojurians.slack.com/archives/C6N245JGG/p1612767381070600) points toward using es2015 (es6) module output as the solution.

If we then set `module` in `tsconfig.json` to `es6`, we still get the same errors from shadow-cljs, but if we change the imports in `./out/foo.js` manually from:

```javascript
import * as vscode from "vscode";
import * os from "os";
```

to:

```javascript
import vscode from "vscode";
import os from "os";
```

then the shadow-cljs compilation succeeds, and after loading the `extension.clj` file in the repl and evaluating `foo`, we now get:

```clojure
#js
 {:hello #object [hello$$module$foo],
  :platform #object [platform$$module$foo],
  :showMessage #object [showMessage$$module$foo]}
```

and evaluating `(.. foo (hello))` succeeds, but when the TS is compiled again, the `import * as` syntax is added back to `./out/foo.js`, and the shadow-cljs compilation fails again.

So what happens if we change the imports as mentioned above in `foo.ts`? The TS compiler complains:

```text
src/foo.ts:1:8 - error TS1192: Module '"vscode"' has no default export.

1 import vscode from "vscode";
         ~~~~~~

src/foo.ts:2:8 - error TS1192: Module '"os"' has no default export.

2 import os from "os";
```

In the tsconfig docs, the [`allowSyntheticDefaultImports`](https://www.typescriptlang.org/tsconfig#allowSyntheticDefaultImports) setting looks like it might be the solution. Setting this to `true` in `tsconfig.json` results in both the TS and CLJS compilation succeeding, and evaluating `(.. foo (hello))` in the repl succeeds.

### Importing the cljs-lib Code in `foo.ts`

Now it's time to try importing the cljs-lib code in `foo.ts` and calling a function from it.

We add the following import to `foo.ts`:

```typescript
import * as cljsLib from "../out/cljs-lib/cljs-lib";
```

and the compilation for both TS and CLJS succeeds, but shadow-cljs reports the following warning:

```text
------ WARNING #1 -  -----------------------------------------------------------
 Resource: 
 Failed to resolve sourcemap at foo.js.map: foo.js.map
--------------------------------------------------------------------------------
```

If we set `inlineSourceMap` to `true` in `tsconfig.json`, the warning goes away.

Now let's try to call a function from the cljs-lib code. We add the following to `foo.ts`:

```typescript
export function cljsLibTestFunction() {
  return cljsLib.testFunction("World");
}
```

Now we get the following error from the shadow-cljs watch process:

```text
Cannot access "../out/cljs-lib/cljs-lib" from "foo.js".
Access outside the classpath is not allowed for relative requires.
```

It seems that the `..`, to shadow-cljs, means going up outside the classpath. Nodejs wants relative file path imports, but shadow-cljs wants classpath imports.

Maybe if we make the cljs-lib code a nodejs module, we can import it from node_modules instead of using a relative file path. We run `npm init` in the `src/cljs-lib` directory to create a `package.json` file and set it's `main` property to `"out/cljs-lib.js"`. resulting in the following file contents:

```json
{
  "name": "cljs-lib",
  "version": "1.0.0",
  "description": "",
  "main": "out/cljs-lib.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC"
}
```

Next we run `npm install ./src/cljs-lib` in the top level directory to install the cljs-lib code as a nodejs module in Calva. This adds the following entry to Calva's dependencies in `package.json`:

```json
"cljs-lib": "file:src/cljs-lib"
```

We then change the `:output-to` value for the `:calva-cljs` build in `shadow-cljs.edn` to `"src/cljs-lib/out/cljs-lib.js"`, and then run `npm run compile-cljs`.

Now, back in `foo.ts`, we change the import to:

```typescript
import * as cljsLib from "cljs-lib";
```

We then get the following info and exception from the shadow-cljs compiler:

```text
[2023-02-11 19:48:41.611 - INFO] :shadow.build.npm/js-invalid-requires - {:resource-name "node_modules/cljs-lib/out/cljs-lib.js", :requires [{:line 899, :column 6}]}
[:extension] Build failure:
no output for id: [:shadow.build.classpath/resource "foo.js"]
{:resource-id [:shadow.build.classpath/resource "foo.js"]}
ExceptionInfo: no output for id: [:shadow.build.classpath/resource "foo.js"]
        shadow.build.data/get-output! (data.clj:202)
        shadow.build.data/get-output! (data.clj:198)
        shadow.build.warnings/get-source-excerpts-for-rc (warnings.clj:50)
        shadow.build.warnings/get-source-excerpts-for-rc (warnings.clj:47)
        shadow.build.warnings/get-source-excerpt-for-rc (warnings.clj:55)
        shadow.build.warnings/get-source-excerpt-for-rc (warnings.clj:54)
        shadow.build.closure/js-error-xf/fn--13477 (closure.clj:620)
        ...
```

If we comment out the `cljsLibTestFunction` function in `foo.ts`, the cljs compilation succeeds:

```typescript
// export function cljsLibTestFunction() {
//   return cljsLib.testFunction("World");
// }
```

So it seems there's something about the compiled cljs-lib code that shadow-cljs doesn't like.

If we change the import statement in `foo.ts` to:

```typescript
import cljsLib from 'cljs-lib';
```

then the shadow-cljs build fails with the following errors:

```text
Closure compilation failed with 3 errors
--- node_modules/cljs-lib/out/cljs-lib.js:299
Closure primitive methods (goog.provide, goog.require, goog.define, etc) must be called at file scope.
--- node_modules/cljs-lib/out/cljs-lib.js:300
Closure primitive methods (goog.provide, goog.require, goog.define, etc) must be called at file scope.
--- node_modules/cljs-lib/out/cljs-lib.js:301
Closure primitive methods (goog.provide, goog.require, goog.define, etc) must be called at file scope.
```

Looking at `node_modules/cljs-lib/out/cljs-lib.js`, we see at line 299:

```javascript
goog.forwardDeclare("XMLHttpRequest");
```

All the code in that file is wrapped in a function that is immediately invoked, so it seems that the `goog.forwardDeclare` call is not at file scope, but that probably isn't the real problem here.

If shadow-cljs is building the cljs-lib code, then it should be able to later compile the TS code that imports it, so maybe there's something we need to change with the way shadow-cljs builds the cljs-lib code, or there's something we need to change in the `:extension` build in `shadow-cljs.edn` to make shadow-cljs bypass compiling the cljs-lib code, which seems like a redundant step anyway.

At this point, let's upgrade the shadow-cljs version to `^2.20.20` and see if that helps... Nope, same error. Let's keep it at this currently latest version, though.

## Using the :npm-module Target for the calva-lib Build

If we set the `:calva-lib` build config to the following:

```edn
                {:target    :npm-module
                 :entries [calva.foo]
                 :output-dir "node_modules/shadow-cljs"}
```

then change the import in `foo.ts` to:

```typescript
import cljsLib from "shadow-cljs/calva.foo";
```

then the `:calva-lib` compilation and the TS compilation both succeed, but when we try to compile the `:extension` build, we get the following error:

```text
[2023-02-14 14:01:37.418 - INFO] :shadow.build.npm/js-invalid-requires - {:resource-name "node_modules/shadow-cljs/cljs_env.js", :requires [{:line 792, :column 6}]}
[:extension] Build failure:
Closure compilation failed with 109 errors
--- node_modules/shadow-cljs/cljs.core.js:15
Required namespace "goog.math.Long" never defined.
--- node_modules/shadow-cljs/cljs.core.js:16
Required namespace "goog.object" never defined.
... (many more errors like the above)
```

If we remove `:js-provider :shadow` from the `:extension` build, then the `:extension` build succeeds, but when we run the extension host and run the "Hello World" command to activate the extension, we get the following error popup:

```text
Activating extension 'undefined_publisher.calvacljstestbed' failed: Namespace "goog.debug.Error" already declared..
```

and in the debug console we get this error:

```text
SHADOW import error /Users/brandon/development/calvacljstestbed/lib/js/cljs-runtime/shadow.js.shim.module$shadow_cljs$calva_foo.js
```

At this point we removed the changes for trying the `:npm-module` target.

## Removing the :js-options From the :extension Build

If we remove the `:js-options` from the `:extension` build, then the `:extension` build succeeds, but after we start the extension host and run the "Hello World" command, we get the following error popup:

```text
Activating extension 'undefined_publisher.calvacljstestbed' failed: No protocol method ISwap.-swap! defined for type cljs.core/Atom: [object Object].
```

At this point we removed the changes for removing the `:js-options` from the `:extension` build.

## Using a Single shadow-cljs Build with :npm-module as the Target

Let's update the shadow-cljs.edn file to use a single build with the `:npm-module` target:

```edn
{:deps true
 :builds       {:extension
                {:target :npm-module
                 :output-dir "node_modules/shadow-cljs"
                 :entries [calva-cljs.extension
                           calva.foo]
                 :devtools {:before-load-async calva-cljs.extension/before-load-async
                            :after-load calva-cljs.extension/after-load}}}}
```

and set `main` property in `package.json` to `"./node_modules/shadow-cljs/calva_cljs.extension.js"`, and comment out the import of the cljs-lib in `foo.ts`.

If we run `npm run watch-ts` then run the shadow-compilation, then run the extension host, then run the "Hello World" command, it works, but trying to load `extension.cljs` in the repl fails with a warning popup in the extension host mentioning `id` cannot be accessed on `undefined`.

This was a bug in Calva and was fixed in 2.0.332. The following steps below this were taken using 2.0.332 or later.

Now when we try to load a file with the extension host running, after calling the "Hello World" command, we don't see a warning popup, but shadow-cljs tells us "No available JS runtime." Maybe the `:npm-module` target can't be used to connect to a runtime? The docs [here](https://shadow-cljs.github.io/docs/UsersGuide.html#missing-js-runtime) don't mention `:npm-module`.

Even when we add `^:export` metdata to the `activate` and `deactivate` functions, we still get the "No available JS runtime" message.

Update: This was later tried again and the TS `import` statement was changed to a `require` statement, but when we tried to load `extension.cljs` in the repl, we got the following error:

```text
Namespace "goog.debug.Error" already declared.
```

## Using a single shadow-cljs build with :node-library as the Target

If we update the shadow-cljs `:extension` build to look like:

```edn
                {:target :node-library
                 :exports {:activate calva-cljs.extension/activate
                           :deactivate calva-cljs.extension/deactivate
                           :testFunction calva.foo/test-function}
                 :output-dir "src/cljs-lib/out/js"
                 :output-to "src/cljs-lib/out/main.js"
                 :devtools {:before-load-async calva-cljs.extension/before-load-async
                            :after-load calva-cljs.extension/after-load}}
```

and we set the `main` property in `package.json` to `"src/cljs-lib/out/main.js"`, and we make the import of the cljs-lib in `foo.ts` look like `const cljsLib = require("cljs-lib")`, then the extension works, but if we try to call `cljsLibTestFunction` from the repl, we get a repl exception:

```text
:repl/exception!
; 
; Execution error (TypeError) at (<cljs repl>:1).
; module$shadow_js_shim_module$cljs_lib.default.testFunction is not a function
```

and we get warnings from node:

```text
(node:66966) Warning: Accessing non-existent property 'toJSON' of module exports inside circular dependency
(node:66966) Warning: Accessing non-existent property 'Symbol(Symbol.toStringTag)' of module exports inside circular dependency
(node:66966) Warning: Accessing non-existent property 'splice' of module exports inside circular dependency
(node:66966) Warning: Accessing non-existent property 'Symbol(nodejs.util.inspect.custom)' of module exports inside circular dependency
(node:66966) Warning: Accessing non-existent property 'constructor' of module exports inside circular dependency
(node:66966) Warning: Accessing non-existent property 'Symbol(Symbol.toStringTag)' of module exports inside circular dependency
(node:66966) Warning: Accessing non-existent property 'Symbol(Symbol.iterator)' of module exports inside circular dependency
(node:66966) Warning: Accessing non-existent property 'testFunction' of module exports inside circular dependency
```

If we log the `cljsLib` object, we see `{}`.

It doesn't seem like this will work due to the circular dependency.

## Using two :node-library builds

We update `shadow-cljs.edn` to look like:

```edn
{:deps true
 :builds       {:calva-lib
                {:target    :node-library
                 :exports   {:testFunction calva.foo/test-function}
                 :output-to "src/cljs-lib/out/cljs-lib.js"}
                :extension
                {:target :node-library
                 :exports {:activate calva-cljs.extension/activate
                           :deactivate calva-cljs.extension/deactivate}
                 :output-dir "lib/js"
                 :output-to "lib/main.js"
                 :devtools {:before-load-async calva-cljs.extension/before-load-async
                            :after-load calva-cljs.extension/after-load}}}}
```

We set the `main` property in `package.json` to `"lib/main.js"`.

We make the import of the cljs-lib in `foo.ts` look like `const cljsLib = require("cljs-lib")`.

When we run the extension and then run the `Hello World` command, we get the following error in a popup:

```text
Activating extension 'undefined_publisher.calvacljstestbed' failed: No protocol method ISwap.-swap! defined for type cljs.core/Atom: [object Object].
```

If we do a release build of the cljs-lib, then start the TS watch, then do a dev build of the extension build, then everything works fine, and we can connect to the runtime with the cljs-lib code and the extension code and develop at the repl for both builds, but hot reloading does not work for the cljs-lib code.

According to Thomas Heller, loading two :node-library builds in development mode is not supported. [In this Slack thread](https://clojurians.slack.com/archives/C6N245JGG/p1528782322000056), he recommends using a single :npm-module build.

## Back to using a single shadow-cljs build with :npm-module as the target (using advice from Thomas Heller)

We updated the shadow-cljs.edn file to look like:

```edn
{:deps true
 :builds       {:extension
                {:target :npm-module
                 :runtime :node
                 :output-dir "node_modules/shadow-cljs"
                 :entries [calva-cljs.extension
                           calva.foo]
                 :devtools {:before-load-async calva-cljs.extension/before-load-async
                            :after-load calva-cljs.extension/after-load}}}}
```

We added an `index.js` file for the extension entry point that looks like:

```js
console.log("Loading shadow devtools for node client");
require("shadow-cljs/shadow.cljs.devtools.client.node");
console.log("Loading extension entry point");
const extension = require("shadow-cljs/calva_cljs.extension");

exports.activate = extension.activate;
exports.deactivate = extension.deactivate;
```

We set the `main` property in `package.json` to `"./index.js"`.

When we run the extension and run the `Hello World` command, it works. However, when we save the `extension.cljs` file, we get the following error in the debug console (though, the shadow-cljs compilation succeeds):

```text
JS reload failed ReferenceError: SHADOW_IMPORT is not defined
```

The advice used in this section and a discussion about the error can be found in [this Slack thread](https://clojurians.slack.com/archives/C6N245JGG/p1676500815612249).

Thomas Heller suggested copying the contents of the `node_bootstrap.js` file from the shadow-cljs source into the entry js file. After doing that, the above-mentioned procedure leads to an error that `SHADOW_IMPORT_PATH` is not defined. It looks like the `shadow.build.node/flush-unoptimized` adds a definition for that variable, but when we tried to set it to `__dirname + "/node_modules/shadow-cljs"`, which seemed correct for our setup, another error occurred:

```text
SHADOW import error /Users/brandon/development/calvacljstestbed/node_modules/shadow-cljs/calva_cljs.extension.js
extensionHostProcess.js:100
JS reload failed Error: Cannot find module './cljs_env'
Require stack:
- /Users/brandon/development/calvacljstestbed/index.js
...
```

That file/module is defined at the relative path mentioned, so it's not clear what to do next.

Note: Hot reloading does not work at all with this solution, at least not when using compiled cljs directly for the entry point, and not a JS file (need to test with the JS entry point again).

## Using :esm build target

We changed shadow-cljs.edn to look like:

```edn
{:deps true
 :builds       {:extension
                {:target :esm
                 :runtime :node
                 :js-options {:js-provider :shadow
                              :keep-native-requires true
                              :keep-as-require #{"vscode"}}
                 :output-dir "public/js"
                 :modules {:main {:exports {activate calva-cljs.extension/activate
                                            deactivate calva-cljs.extension/deactivate}}}
                 :devtools {:before-load-async calva-cljs.extension/before-load-async
                            :after-load calva-cljs.extension/after-load}}}}
```

The output for that build can't be used as it is by VS Code, so we installed esbuild as a dev dep and ran the following after the shadow-cljs build completed:

```bash
npx esbuild public/js/main.js --bundle --platform=node --packages=external --outfile=public/js/main.bundle.js
```

We changed the `main` property in `package.json` to `"./public/js/main.bundle.js"`.

This seems to work - the `Hello World` command runs fine, but we cannot connect to the JS runtime from the repl.

## Using a single :node-library build with goog imports

We changed shadow-cljs.edn to look like:

```edn
{:deps true
 :builds       {:extension
                {:target :node-library
                 :exports {:activate calva-cljs.extension/activate
                           :deactivate calva-cljs.extension/deactivate}
                 :output-dir "lib/js"
                 :output-to "lib/main.js"
                 :devtools {:before-load-async calva-cljs.extension/before-load-async
                            :after-load calva-cljs.extension/after-load}}}}
```

We changed the `main` property in `package.json` to `"lib/main.js"`.

We imported the `calva.foo` cljs namespace in `foo.ts` like so:

```ts
// @ts-ignore
import foo from "goog:calva.foo";
```

We also added `onLanguage:clojure` to the activation events in `package.json` so the extension will be activated when a Clojure file is opened.

To run the extension:

1. Run `npm install`.
2. Run `npm run watch-ts`. This must be done before started the shadow-cljs watch process so that the compiled TypeScript files are on the classpath and can be imported by the CLJS code in `src/calva_cljs`.
3. Jack-in and choose shadow-cljs and the `extension` build (or copy the jack-in commmand, run it, and connect to the shadow-cljs repl).
4. Hit `F5` to start the extension in a new VS Code window.
5. Activate the extension by running a registered in the `calva-cljs.extension` namespace, or by opening a Clojure file
6. Evaluate cljs code in the repl

### Unit testing problem

If we import the `calva.foo` namespace in `bar.ts` like so:

```ts
import foo from "goog:calva.foo";
```

and run the tests with `npm run test`, we get the following error:

```text
src/bar.ts:1:17 - error TS2307: Cannot find module 'goog:calva.foo' or its corresponding type declarations.

1 import foo from "goog:calva.foo";
```

If we don't import the `goog:calva.foo` namespace in `bar.ts`, the tests run fine.

If we add `// @ts-ignore` above the `goog:calva.foo` import statement, the tests run fine and the TS compilation succeeds, but we get this error:

```text
Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file, data are supported by the default ESM loader. Received protocol 'goog:'
```
