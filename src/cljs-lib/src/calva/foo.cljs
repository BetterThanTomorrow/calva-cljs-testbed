(ns calva.foo
  (:require ["vscode" :as vscode]))

(defn test-function []
  (.. vscode -window (showInformationMessage "Hello from CLJS Lib----")))