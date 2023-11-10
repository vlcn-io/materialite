import { expect, test } from "vitest";
import { Treap } from "../Treap.js";

test("getting an iterator", () => {
  const t = new Treap<number>((a, b) => a - b);
  t.add(10);
  t.add(5);
  t.add(15);
  t.add(2);
  console.log([...t]);
  const iter = t.iteratorAfter(6);
  console.log(iter.data);
  console.log([...iter]);
  console.log([...iter]);
  // expect(iter.next()).toBe(10);
  // expect(iter.next()).toBe(15);
  // expect(iter.next()).toBe(null);
});

test("balance", () => {});

test("is sorted", () => {
  // adds
  // removes
  // replaces
});

test("replaces", () => {});
