import { describe, it, beforeAll } from "vitest";
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

describe("Performance comparison: Array vs. Treap", () => {
  const SIZE = 100_000; // example size
  let array: number[] = [];
  let treap: PersistentTreap<number>;

  beforeAll(() => {
    treap = new PersistentTreap<number>((a, b) => a - b);

    for (let i = 0; i < SIZE; i++) {
      const value = Math.random(); // or another generation logic
      array.push(value);
      treap = treap.add(value);
    }
  });

  it("iteration by index", () => {
    const start = performance.now();

    for (let i = 0; i < SIZE; i++) {
      const _ = array[i];
    }

    const end = performance.now();

    const start2 = performance.now();

    for (let i = 0; i < SIZE; i++) {
      const _ = treap.at(i);
    }

    const end2 = performance.now();
    console.log(
      `Array index iter time: ${end - start}ms, Treap index iter time: ${
        end2 - start2
      }ms`
    );
  });

  it("iteration by iterator", () => {
    const start = performance.now();
    let c = 0;
    for (const _ of array) {
      ++c;
    }
    const end = performance.now();

    const start2 = performance.now();
    for (const _ of treap) {
      ++c;
    }
    const end2 = performance.now();

    console.log(
      `Arr iter: ${end - start}ms, Treap iter: ${end2 - start2}ms | ${c}`
    );
  });
});
