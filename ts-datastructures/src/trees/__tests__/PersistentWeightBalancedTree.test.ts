import { describe, test, expect, beforeAll } from "vitest";
import { PersistentWeightBalancedTree } from "../PersistenWeightBalancedTree.js";

describe("PersistentWeightBalancedTree", () => {
  const numberComparator = (a: number, b: number) => a - b;

  test("add values", () => {
    const tree = new PersistentWeightBalancedTree<number>(numberComparator)
      .add(10)
      .add(5)
      .add(15)
      .add(20)
      .add(2);
    expect(Array.from(tree)).toEqual([2, 5, 10, 15, 20]);
  });

  test("delete values", () => {
    let tree = new PersistentWeightBalancedTree<number>(numberComparator)
      .add(10)
      .add(5)
      .add(15)
      .add(20)
      .add(2);
    tree = tree.delete(15);
    expect(Array.from(tree)).toEqual([2, 5, 10, 20]);
  });

  test("forEach", () => {
    const tree = new PersistentWeightBalancedTree<number>(numberComparator)
      .add(10)
      .add(5)
      .add(15)
      .add(20)
      .add(2);
    const values: number[] = [];
    tree.forEach((value) => values.push(value));
    expect(values).toEqual([2, 5, 10, 15, 20]);
  });

  test("map", () => {
    const tree = new PersistentWeightBalancedTree<number>(numberComparator)
      .add(10)
      .add(5)
      .add(15)
      .add(20)
      .add(2);
    const squaredTree = tree.map((value) => value * value);
    expect(Array.from(squaredTree)).toEqual([4, 25, 100, 225, 400]);
  });

  test("reduce", () => {
    const tree = new PersistentWeightBalancedTree<number>(numberComparator)
      .add(10)
      .add(5)
      .add(15)
      .add(20)
      .add(2);
    const sum = tree.reduce((acc, value) => acc + value, 0);
    expect(sum).toBe(52);
  });

  test("filter", () => {
    const tree = new PersistentWeightBalancedTree<number>(numberComparator)
      .add(10)
      .add(5)
      .add(15)
      .add(20)
      .add(2);
    const filteredTree = tree.filter((value) => value % 2 === 0); // Even numbers
    expect(Array.from(filteredTree)).toEqual([2, 10, 20]);
  });
});

describe("Performance comparison: Array vs. WBT", () => {
  const SIZE = 100_000; // example size
  let tree: PersistentWeightBalancedTree<number>;
  let array: number[] = [];
  beforeAll(() => {
    tree = new PersistentWeightBalancedTree<number>((a, b) => a - b);

    for (let i = 0; i < SIZE; i++) {
      const value = Math.random(); // or another generation logic
      array.push(value);
      tree = tree.add(value);
    }
  });

  test("iteration by index", () => {
    const start = performance.now();

    let c = 0;
    for (let i = 0; i < SIZE; i++) {
      c += array[i]!;
    }

    const end = performance.now();

    const start2 = performance.now();

    for (let i = 0; i < SIZE; i++) {
      c += tree.at(i)!;
    }

    const end2 = performance.now();
    console.log(
      `Array index iter time: ${end - start}ms, WBT index iter time: ${
        end2 - start2
      }ms`
    );
  });

  test("iteration by iterator", () => {
    const start = performance.now();
    let c = 0;
    for (const _ of array) {
      ++c;
    }
    const end = performance.now();

    const start2 = performance.now();
    for (const _ of tree) {
      ++c;
    }
    const end2 = performance.now();

    console.log(
      `Arr iter: ${end - start}ms, WBT iter: ${end2 - start2}ms | ${c}`
    );
  });
});

describe("Insertion Performance Benchmark", () => {
  const NUM_INSERTS = 1_000_000;

  test("should measure insertion time for PersistentTreap", () => {
    let tree = new PersistentWeightBalancedTree<number>((a, b) => a - b);
    const start = performance.now();

    for (let i = 0; i < NUM_INSERTS; i++) {
      tree = tree.add(i);
    }

    const end = performance.now();

    const map = new Map<number, null>();
    const start2 = performance.now();

    for (let i = 0; i < NUM_INSERTS; i++) {
      map.set(i, null);
    }

    const end2 = performance.now();
    console.log(`WBT: ${end - start}ms, Map: ${end2 - start2}ms`);
  });
});

// TODO: check how balanced the tree is after
// in-order insertion and random insertion
