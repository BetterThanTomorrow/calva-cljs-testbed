(ns calva.main
  (:require [calva.foo]))

(def namespaces-to-export ['calva.foo
                           'calva.bar])

(def all-exports (clj->js {'calva {'foo {'testFunction calva.foo/test-function}}}))

(comment
  :rcf)

