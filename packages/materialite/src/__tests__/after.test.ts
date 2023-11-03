import { test, expect } from "vitest";

test("after on a stateful source. After is pushed to the source.", () => {
  // hmm... will this break forking?
  // if after is pushed to the source then forked streams will be forced into `after` semantics too.
  // We can get more complex to solve this or as a first pass require that `after` must be the first operator
  // against the source.
  expect(true).toBe(true);
});
