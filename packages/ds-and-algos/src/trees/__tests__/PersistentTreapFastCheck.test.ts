import { assert, property } from "fast-check";
import fc from "fast-check";
import { PersistentTreap, Node } from "../PersistentTreap.js";
import { expect, test } from "vitest";

// Assuming your treap class is imported as:
// import { PersistentTreap } from './path_to_treap';

// Helper function to measure tree depth.
function depth<T>(node: Node<T> | null): number {
  if (!node) return 0;
  return 1 + Math.max(depth(node.left), depth(node.right));
}

test("PersistentTreap Property-based Tests (large)", () => {
  assert(
    property(
      // Arbitrarily generate a list of operations
      script(1000),
      checkTreap
    )
  );
});

test("PersistentTreap Property-based Tests (small)", () => {
  assert(property(script(0), checkTreap));
});

function script(size: number) {
  return fc.array(
    fc.tuple(
      fc.oneof(
        fc.constant("insert"),
        fc.constant("delete"),
        fc.constant("reinsert")
      ),
      fc.integer()
    ),
    {
      minLength: size,
    }
  );
}

function checkTreap(operations: [string, number][]) {
  let treap = new PersistentTreap<number>((l, r) => l - r);
  const set = new Set<number>();

  for (const [operation, value] of operations) {
    let oldTreap = treap;
    const oldTreapValues = [...oldTreap];
    switch (operation) {
      case "insert":
        treap = treap.add(value);
        set.add(value);
        break;
      case "delete":
        if (set.size == 0) {
          continue;
        }
        const vs = [...set.values()];
        const v = vs[Math.floor(Math.random() * vs.length)]!;
        treap = treap.delete(v);
        set.delete(v);
        break;
      case "reinsert":
        treap = treap.add(value);
        treap = treap.add(value);
        set.add(value);
        break;
    }
    const oldTreapValuesPostModification = [...oldTreap];

    // Treap should not be modified in place.
    expect(oldTreapValues).toEqual(oldTreapValuesPostModification);
  }

  // 1. The treap has all items that are in the set.
  for (const item of set) {
    expect(treap.contains(item)).toBe(true);
  }

  // 2. The treap returns items in sorted order when iterating.
  let lastValue = Number.NEGATIVE_INFINITY;
  for (const value of treap) {
    expect(value).toBeGreaterThan(lastValue);
    lastValue = value;
  }

  // 3. The treap's size matches the set.
  expect(treap.length).toBe(set.size);

  // 4. When indexing the treap, items are returned in the correct order.
  const sortedSet = [...set.values()].sort((a, b) => a - b);
  for (let i = 0; i < treap.length; i++) {
    const treapValue = treap.at(i);
    expect(treapValue).toBe(sortedSet[i]);
  }

  // 5. Check tree depth to ensure balance.
  // Given we balance randomly, check that we're within a certain range.
  const d = depth(treap._root);
  expect(d).toBeLessThanOrEqual(3 * Math.log2(treap.length + 1));

  return true;
}
