import { describe, it } from "vitest";
import { PersistentTreap } from "../PersistentTreap.js";

describe("Insertion Performance Benchmark", () => {
  const NUM_INSERTS = 1_000_000;

  it("should measure insertion time for PersistentTreap", () => {
    let treap = new PersistentTreap<number>((a, b) => a - b);
    const start = performance.now();

    for (let i = 0; i < NUM_INSERTS; i++) {
      treap = treap.add(i);
    }

    const end = performance.now();
    console.log(`Time taken for PersistentTreap: ${end - start}ms`);

    const map = new Map<number, null>();
    const start2 = performance.now();

    for (let i = 0; i < NUM_INSERTS; i++) {
      map.set(i, null);
    }

    const end2 = performance.now();
    console.log(`PersistentTreap: ${end - start}ms, Map: ${end2 - start2}ms`);
  });
});
