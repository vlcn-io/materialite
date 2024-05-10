import { describe, it, beforeAll } from "vitest";
import BTree from "sorted-btree";
import { Treap } from "../Treap.js";
const BTreeClass = (
  BTree.default ? BTree.default : BTree
) as typeof BTree.default;

describe("Insertion Performance Benchmark", () => {
  const NUM_INSERTS = 1_000_000;

  it("should measure insertion time for BTree", () => {
    const tree = new BTreeClass<number, number>();
    let start = performance.now();

    for (let i = 0; i < NUM_INSERTS; i++) {
      tree.set(i, i);
    }
    let end = performance.now();
    console.log(`BTree#add: ${end - start}ms`);

    start = performance.now();
    const keys = [];
    let sum = 0;
    for (const k of tree.keys()) {
      keys.push(k);
    }
    end = performance.now();
    console.log(`BTree#iterator: ${end - start}ms ${sum}`);

    start = performance.now();
    for (let i = 0; i < 1; i++) {
      tree.delete(i);
    }
    end = performance.now();
    console.log(`BTree#delete: ${end - start}ms`);

    for (let i = 0; i < NUM_INSERTS; i++) {
      tree.set(i, i);
    }

    // const rev = tree.entriesReversed();
    start = performance.now();
    for (const k of keys) {
      tree.entries(k);
    }
    end = performance.now();
    console.log(`BTree#getIterators: ${end - start}ms`);
  });

  it("should mesure insertion time for Treap", () => {
    let treap = new Treap<number>((a, b) => a - b);
    let start = performance.now();

    for (let i = 0; i < NUM_INSERTS; i++) {
      treap = treap.add(i);
    }
    let end = performance.now();
    console.log(`Treap#add: ${end - start}ms`);

    start = performance.now();
    let sum = 0;
    const keys = [];
    for (const v of treap) {
      keys.push(v);
    }
    end = performance.now();
    console.log(`Treap#iterator: ${end - start}ms ${sum}`);

    start = performance.now();
    for (let i = 0; i < 1; i++) {
      treap.delete(i);
    }
    end = performance.now();
    console.log(`Treap#delete: ${end - start}ms`);

    start = performance.now();
    for (const k of keys) {
      treap.iteratorAfter(k);
    }
    end = performance.now();
    console.log(`Treap#getIterators: ${end - start}ms`);
  });
});
