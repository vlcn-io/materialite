import { test } from "vitest";
import { RBTree } from "../RedBlackTree";

test("time a regular map vs an rbtree", () => {
  const N = 1_000_000;
  const map = new Map<number, number>();
  const rbtree = new RBTree<number>((a, b) => a - b);

  const start = performance.now();
  for (let i = 0; i < N; i++) {
    // const v = (Math.random() * N) | 0;
    // map.set(v, v);
    map.set(i, i);
  }
  const mapTime = performance.now() - start;

  const start2 = performance.now();
  for (let i = 0; i < N; i++) {
    // rbtree.insert((Math.random() * N) | 0);
    rbtree.insert(i);
  }
  const rbtreeTime = performance.now() - start2;

  console.log(`Map: ${mapTime}ms, RBTree: ${rbtreeTime}ms`);
});
