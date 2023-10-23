import { test, expect } from "vitest";
import { PersistentTreap } from "../PersistentTreap.js";
// [[["insert",-29],["reinsert",0],["insert",-15],["delete",-3]]]

test("", () => {
  let tree = new PersistentTreap<number>((l, r) => l - r);

  let oldTree = tree;
  let oldValues = [...oldTree];
  tree = tree.add(-29);
  expect(oldValues).toEqual([...oldTree]);

  oldTree = tree;
  oldValues = [...oldTree];
  tree = tree.add(0);
  expect(oldValues).toEqual([...oldTree]);

  oldTree = tree;
  oldValues = [...oldTree];
  tree = tree.add(0);
  expect(oldValues).toEqual([...oldTree]);

  oldTree = tree;
  oldValues = [...oldTree];
  tree = tree.add(-15);
  expect(oldValues).toEqual([...oldTree]);

  oldTree = tree;
  oldValues = [...oldTree];
  // tree = tree.delete();
  expect(oldValues).toEqual([...oldTree]);

  console.log([...tree], tree.size);

  // TODO: test replace too
});
