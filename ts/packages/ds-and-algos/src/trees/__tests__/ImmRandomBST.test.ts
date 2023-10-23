import { test, expect } from "vitest";
import { ImmRandomBST } from "../ImmRandomBST.js";

test("Test adding some nodes", () => {
  let tree = new ImmRandomBST<number>((a, b) => a - b);

  console.log("add 10");
  tree = tree.add(10);
  console.log("add 5");
  tree = tree.add(5);
  console.log("add 15");
  tree = tree.add(15);
  console.log("add 3");
  tree = tree.add(3);

  // console.log([...tree]);
  // console.log(tree.actualDepth_expensive());
  // console.log(tree.likelyDepth());
});

test("Test adding nodes in-order", () => {
  let tree = new ImmRandomBST<number>((a, b) => a - b);
  for (let i = 0; i < 100; i++) {
    tree = tree.add(i);
  }

  console.log(tree.actualDepth_expensive());
  console.log(tree.likelyDepth());
});

_test("Test adding nodes randomly", () => {});

_test("original trees are not modified by inserts and delets", () => {});

_test("time perf", () => {
  const N = 1_000_000;
  const set = new Set<number>();
  let tree = new ImmRandomBST<number>((a, b) => a - b);

  let start = performance.now();
  for (let i = 0; i < N; i++) {
    set.add(i);
  }
  const setTime = performance.now() - start;

  start = performance.now();
  for (let i = 0; i < N; i++) {
    tree = tree.add(i);
  }
  const treeTime = performance.now() - start;

  console.log(`Set: ${setTime}ms, Tree: ${treeTime}ms`);

  // expect([...tree]).toEqual([...set]);
});

// return Math.floor(Math.log2(this.size));

function _test(_s: string, _c: () => void) {
  expect(true).toBe(true);
}
