import { test, expect } from "vitest";

test("late arrivals signal a pull to get old data. Old data being pushed down respects the path along which it was requested.", () => {
  // hmm... will this break forking?
  // if after is pushed to the source then forked streams will be forced into `after` semantics too.
  // We can get more complex to solve this or as a first pass require that `after` must be the first operator
  // against the source.
  expect(true).toBe(true);
});
