# Calva CLJS Testbed

## Running the Extension

1. Run `npm install`.
2. Jack-in and choose shadow-cljs and the `calva-lib` build (or copy the jack-in commmand, run it, and connect to the shadow-cljs repl).
3. Run `npm run watch-ts`.
4. Hit `F5` to start the extension in a new VS Code window.
5. Run the "Hello World" command from the command palette if you want to check that the extension is working, and also if you want to connect to the extension build's repl, as this command activates the extension. You can also run the "Call CLJS Lib Function" command to test calling a function in the cljs lib.

## This Branch's Approach

This branch aims to keep the TS at the top level and using the single calva-lib build for the CLJS, but to explore expanding the calva-lib to encompass more of the extension's source code in an ergonomic way.
