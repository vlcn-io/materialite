import { Arbitrary, assert, property, tuple, fc } from "fast-check";
import { PersistentTreap } from "../PersistentTreap.js";
import { describe } from "vitest";

// Assuming your treap class is imported as:
// import { PersistentTreap } from './path_to_treap';

// Helper function to measure tree depth.
function depth<T>(node: Node<T> | null): number {
  if (!node) return 0;
  return 1 + Math.max(depth(node.left), depth(node.right));
}

describe("PersistentTreap Property-based Tests", () => {
  assert(
    property(
      // Arbitrarily generate a list of operations
      fc.array(
        tuple(
          fc.oneof(
            fc.constant("insert"),
            fc.constant("delete"),
            fc.constant("reinsert")
          ),
          fc.integer()
        )
      ),
      (operations) => {
        let treap = new PersistentTreap<number>((l, r) => l - r);
        const set = new Set<number>();

        for (const [operation, value] of operations) {
          switch (operation) {
            case "insert":
              treap = treap.add(value);
              set.add(value);
              break;
            case "delete":
              treap = treap.delete(value);
              set.delete(value);
              break;
            case "reinsert":
              treap = treap.add(value);
              set.add(value);
              break;
          }
        }

        // 1. The treap has all items that are in the set.
        for (const item of set) {
          if (!treap.contains(item)) return false;
        }

        // 2. The treap returns items in sorted order when iterating.
        let lastValue = Number.NEGATIVE_INFINITY;
        for (const value of treap) {
          if (value <= lastValue) return false;
          lastValue = value;
        }

        // 3. The treap's size matches the set.
        if (treap.length !== set.size) return false;

        // 4. When indexing the treap, items are returned in the correct order.
        for (let i = 0; i < treap.length; i++) {
          const treapValue = treap.at(i);
          if (treapValue !== [...set.values()].sort()[i]) return false;
        }

        // 5. Check tree depth to ensure balance.
        const d = depth(treap.root);
        if (d > 3 * Math.log2(treap.size + 1)) return false;

        return true;
      }
    )
  );
});
