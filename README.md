# Calva CLJS Testbed

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

1. Run `npm install`.
2. Run `npm run compile-cljs`. This must be done before running the `watch-ts` script since the TypeScript needs to be able to import the compiled CLJS from `src/cljs-lib/src/calva`.
3. Run `npm run watch-ts`. This must be done before started the shadow-cljs watch process so that the compiled TypeScript files are on the classpath and can be imported by the CLJS code in `src/calva_cljs`.
4. Jack-in and choose shadow-cljs and the `extension` and `calva-lib` builds (or copy the jack-in commmand, run it, and connect to the shadow-cljs repl).
5. Hit `F5` to start the extension in a new VS Code window.
6. Run the "Hello World" command from the command palette if you want to check that the extension is working, and also if you want to connect to the extension build's repl, as this command activates the extension.

## This Branch's Approach

This branch aims to keep the TS at the top level and using the single calva-lib build for the CLJS, but to explore expanding the calva-lib to encompass more of the extension's source code in an ergonomic way.
