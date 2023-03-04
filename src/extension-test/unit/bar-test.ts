import { equal } from "assert";
import * as bar from "../../bar.js";

describe("hello", () => {
  it("should return expected string", () => {
    equal(bar.hello(), "Hello from bar.ts");
  });
});
