import { test, expect } from "vitest";
import { RBTree } from "../RedBlackTree";
import { shuffle } from "../../shuffle";
import { INode } from "../TreeBase";

type Position = "L" | "R" | "ROOT";
test("inserting items in order still results in a balanced tree", () => {
  const tree = new RBTree<number>((a, b) => a - b);

  const items = Array.from({ length: 99 }, (_, i) => i);
  items.forEach((item) => tree.insert(item));

  const root = tree.root;
  function gatherTree(root: INode<number> | null) {
    if (root == null) {
      return [];
    }
    const out: [Position, number][] = [];
    const queue: [Position, INode<number>][] = [["ROOT", root]];
    while (queue.length > 0) {
      const [position, node] = queue.shift()!;
      if (node.left) {
        queue.push(["L", node.left]);
      }
      if (node.right) {
        queue.push(["R", node.right]);
      }
      out.push([position, node.data!]);
    }
    return out;
  }
  const linearized = gatherTree(root);

  let lastPosition = null;
  for (const [position, _] of linearized) {
    // If the tree is balanced, every position will be different from the last
    expect(position).not.toBe(lastPosition);
    lastPosition = position;
  }
  expect(linearized.length).toBe(99);
});

test("in-order traversal of tree returns items in-order!", () => {
  const tree = new RBTree<number>((a, b) => a - b);

  const items = shuffle(Array.from({ length: 100 }, (_, i) => i));
  items.forEach((item) => tree.insert(item));

  const out: number[] = [];
  function inOrder(root: INode<number>) {
    if (root.left) {
      inOrder(root.left);
    }
    out.push(root.data!);
    if (root.right) {
      inOrder(root.right);
    }
  }
  inOrder(tree.root!);
  expect(out).toEqual(items.sort((a, b) => a - b));
});

test("can fulfill a gte range request via lower bound", () => {
  const tree = new RBTree<number>((a, b) => a - b);

  const items = shuffle(Array.from({ length: 10 }, (_, i) => i));
  items.forEach((item) => tree.insert(item));

  const out: number[] = [];
  const iter = tree.lowerBound(5);
  // can't do this yet due to next being eagerly called in for
  // for (const data of iter) {
  //   out.push(data);
  // }
  while (iter.data !== null) {
    out.push(iter.data!);
    iter.next();
  }
  expect(out).toEqual(items.filter((item) => item >= 5).sort((a, b) => a - b));
});

test("can fulfill a lte range request via lower bound", () => {
  const tree = new RBTree<number>((a, b) => a - b);

  const items = shuffle(Array.from({ length: 10 }, (_, i) => i));
  items.forEach((item) => tree.insert(item));

  const out: number[] = [];
  const iter = tree.lowerBound(5);
  while (iter.data !== null) {
    out.push(iter.data!);
    iter.prev();
  }
  expect(out).toEqual(items.filter((item) => item <= 5).sort((a, b) => b - a));
});
