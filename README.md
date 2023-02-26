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

;; We'd create a JS object similarly to this (minus the reduction and ns-publics call)
(def all-exports (clj->js {'calva {'foo {'testFunction calva.foo/test-function}}}))
```
