(ns calva.foo
  (:require ["vscode" :as vscode]))

(defn test-function []
  (.. vscode -window (showInformationMessage "Hello from CLJS Lib----")))

(def some-var "some var")

(def some-var-2 "some var 2")

(def helloWorld "hello world")

(comment
  (->> 'calva.foo
       ns-publics
       (reduce (fn [m [k v]] (assoc m k (deref v))) {})
       clj->js)
  (ns-publics 'calva.foo)
  :rcf)

