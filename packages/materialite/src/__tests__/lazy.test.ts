import { test } from "vitest";

/**
 * Map, filter, etc. are lazy.
 *
 * As in, if we have a `take` at one end that limits how much
 * we want in the view then on the other end (upstreams) we will stop
 * processing once that limit is hit.
 */
test("lazy", () => {
  console.log("todo");
});
