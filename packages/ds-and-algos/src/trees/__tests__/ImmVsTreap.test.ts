import { test } from "vitest";
import { Map } from "immutable";
import { PersistentTreap } from "../PersistentTreap.js";

test("should add values correctly", () => {
  const SIZE = 100_000;
  const TRIALS = 10;

  let average = 0;
  for (let t = 0; t < TRIALS; ++t) {
    let treap = new PersistentTreap<number>((a, b) => a - b);
    const start = Date.now();
    for (let i = 0; i < SIZE; i++) {
      treap = treap.add(i);
    }
    const end = Date.now();
    average += end - start;
  }

  console.log(`PersistentTreap: ${average / TRIALS}ms`);

  average = 0;
  for (let t = 0; t < TRIALS; ++t) {
    let map = Map<number, number>();
    const start = Date.now();
    for (let i = 0; i < SIZE; i++) {
      map = map.set(i, i);
    }
    const end = Date.now();
    average += end - start;
  }

  console.log(`Immutable Map: ${average / TRIALS}ms`);
  // Conclusion: about the same speed. Treap slightly faster.
});
