import { expect, test } from "vitest";
import { Treap } from "../Treap.js";

// See TreapFastCheck for more intensive tests

test("getting an iterator", () => {
  const t = new Treap<number>((a, b) => a - b);
  t.add(10);
  t.add(5);
  t.add(15);
  t.add(2);
  expect([...t]).toEqual([2, 5, 10, 15]);
  const iter = t.iteratorAfter(6);
  expect(iter.next().value).toBe(10);
  expect(iter.next().value).toBe(15);
  expect(iter.next().value).toBe(null);
});

test("delete", () => {
  const t = new Treap<number>((a, b) => a - b);
  t.add(0);
  t.add(0);
  t.delete(0);

  console.log([...t]);
  expect(t.size).toBe(0);
});
