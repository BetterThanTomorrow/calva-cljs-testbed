# Calva CLJS Testbed

## Running the Extension

1. Run `npm install`.
2. Jack-in and choose shadow-cljs and the `calva-lib` build (or copy the jack-in commmand, run it, and connect to the shadow-cljs repl).
3. Run `npm run watch-ts`.
4. Hit `F5` to start the extension in a new VS Code window.
5. Run the "Hello World" command from the command palette if you want to check that the extension is working, and also if you want to connect to the extension build's repl, as this command activates the extension. You can also run the "Call CLJS Lib Function" command to test calling a function in the cljs lib.

## This Branch's Approach

This branch aims to keep the TS at the top level and using the single calva-lib build for the CLJS, but to explore expanding the calva-lib to encompass more of the extension's source code in an ergonomic way.

## Dynamically Exporting Vars from Namespaces

If we want to avoid having to manually add exports to the shadow-cljd build config, we can have a list of namespaces for which we want to export vars, and then reduce over them, call `ns-publics` on them, and create a nested JS object that corresponds to the namespace segments, with the leaves of the object being objects with all public vars for the namespace. We can also camelCase all namespace segments and vars.

```clojure
;; Having this list, assuming calva.foo has a function called test-function...
(def namespaces-to-export [calva.foo])

;; We'd create a JS object similarly to this (but using `reduce` and `ns-publics`)
(def all-exports (clj->js {'calva {'foo {'testFunction calva.foo/test-function}}}))
```

Then in the shadow-cljs build config, we can export a single var that points to `all-exports`.

```edn
{:deps true
 :builds       {:calva-lib
                {:target    :node-library
                 :exports   {:_ calva.main/all-exports}
                 :output-to "out/cljs-lib/cljs-lib.js"}}}
```

Then in the TS, we can call `test-function` like this:

```typescript
cljsLib._.calva.foo.testFunction();
```

## Why We Can't Use a Single :node-library Build

When using a single :node-library build, we can't import `vscode` in the CLJS code because the unit-test script will fail since `vscode` can't be found.

## Using a single :esm build

We changed shadow-cljs.edn to look like:

```edn
{:deps true
 :builds       {:calva-lib
                {:target    :esm
                 :runtime   :node
                 :js-options {:js-provider :shadow
                              :keep-native-requires true
                              :keep-as-require #{"vscode"}}
                 :modules {:base {:entries []}
                           :cljs-lib {:exports {someVar calva.bar/some-var}
                                      :depends-on #{:base}}
                           :extension {:exports {testFunction calva.foo/test-function}
                                       :depends-on #{:base}}}
                 :output-dir "out/cljs-lib"}}}
```

The output for that build can't be used as it is by VS Code, so we installed esbuild as a dev dep and ran the following after the shadow-cljs build completed:

```bash
npx esbuild out/cljs-lib/cljs-lib.js out/cljs-lib/extension.js --bundle --platform=node --outdir=cljs-lib --packages=external
```

We add `--packages=external` to the esbuild command to avoid a warning about `vscode` not being found.

If we import both the modules like below:

```typescript
import * as cljsLib from "../cljs-lib/cljs-lib.js";
import * as cljsExtension from "../cljs-lib/extension";
```

AND we call functions/vars from those modules in the code, then when we run the extension and run a command which activates the extension, we get the following error in a popup:

```text
Activating extension 'undefined_publisher.calvacljstestbed' failed: Namespace "cljs.core" already declared..
```

We tried adding `:cljs-lib` to the `:depends-on` of the `:extension` module, but still had the same issue.
